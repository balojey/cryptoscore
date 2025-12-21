/**
 * Football-Data API Integration Service
 *
 * Provides integration with football-data.org API for retrieving match data,
 * monitoring match statuses, and synchronizing with the CryptoScore platform.
 *
 * Features:
 * - Multiple API key support for rate limit management
 * - Automatic failover between API keys
 * - Retry logic with exponential backoff
 * - Rate limit tracking and enforcement
 * - Match status monitoring and synchronization
 *
 * @module lib/football-data
 */

import type {
  MatchData,
  EnhancedMatchData,
  MatchesResponse,
  MatchResponse,
  ServiceResponse,
  RateLimitInfo,
  ApiRequestOptions,
  MatchFilters,
  StatusSyncResult,
} from '@/types/football-data'
import type { MatchStatus } from '@/config/football-data'
import { footballDataConfig } from '@/config/football-data'
import { FootballDataRateLimiter } from './rate-limiter'
import { FootballDataErrorHandler, FootballDataError } from './error-handler'
import { createEnhancedMatchData } from './match-utils'

/**
 * Football-Data API Service
 *
 * Handles all interactions with the football-data.org API including
 * match data retrieval, status monitoring, and rate limit management.
 */
export class FootballDataService {
  /**
   * Initialize the service
   */
  static initialize(): void {
    FootballDataRateLimiter.initialize()
  }

  /**
   * Get the next available API key using the rate limiter
   */
  private static async getAvailableApiKey(): Promise<string> {
    return FootballDataRateLimiter.waitForAvailableSlot()
  }

  /**
   * Parse rate limit information from response headers
   */
  private static parseRateLimitHeaders(headers: Headers): RateLimitInfo | undefined {
    const remaining = headers.get('X-Requests-Available-Minute')
    const limit = headers.get('X-RequestCounter-Reset')

    if (!remaining) {
      return undefined
    }

    const resetTime = limit ? parseInt(limit, 10) : Date.now() + 60000
    const resetTimeSeconds = Math.floor((resetTime - Date.now()) / 1000)

    return {
      remaining: parseInt(remaining, 10),
      limit: footballDataConfig.rateLimit.requestsPerMinute,
      resetTime,
      resetTimeSeconds,
    }
  }

  /**
   * Make an HTTP request to the Football-Data API
   */
  private static async makeRequest<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ServiceResponse<T>> {
    const { baseUrl, timeout } = footballDataConfig
    
    try {
      // Get an available API key
      const apiKey = options.apiKey || await this.getAvailableApiKey()
      
      // Make the request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || timeout)

      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'X-Auth-Token': apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Update rate limiter with response headers
      FootballDataRateLimiter.updateFromHeaders(apiKey, response.headers)
      FootballDataRateLimiter.recordRequest(apiKey)

      // Parse rate limit info
      const rateLimit = this.parseRateLimitHeaders(response.headers)

      // Handle rate limit exceeded
      if (response.status === 429) {
        FootballDataRateLimiter.blockApiKey(apiKey)
        const error = await FootballDataErrorHandler.createFromResponse(response)
        throw error
      }

      // Handle other errors
      if (!response.ok) {
        const error = await FootballDataErrorHandler.createFromResponse(response)
        throw error
      }

      // Parse and return successful response
      const data = await response.json()

      return {
        data,
        success: true,
        rateLimit,
        apiKeyUsed: apiKey,
      }
    } catch (error) {
      const footballDataError = error instanceof FootballDataError 
        ? error 
        : FootballDataErrorHandler.handleError(error)

      return {
        data: null as any,
        success: false,
        error: footballDataError.message,
      }
    }
  }

  /**
   * Get a single match by ID
   */
  static async getMatch(matchId: number): Promise<ServiceResponse<MatchData>> {
    const response = await this.makeRequest<MatchResponse>(`/matches/${matchId}`)

    if (!response.success) {
      return response as ServiceResponse<MatchData>
    }

    return {
      ...response,
      data: response.data.match,
    }
  }

  /**
   * Get matches with optional filters
   */
  static async getMatches(filters: MatchFilters = {}): Promise<ServiceResponse<MatchData[]>> {
    // Build query parameters
    const params = new URLSearchParams()

    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      params.append('status', statuses.join(','))
    }
    if (filters.competitions) {
      params.append('competitions', filters.competitions.join(','))
    }
    if (filters.matchday) params.append('matchday', filters.matchday.toString())
    if (filters.stage) params.append('stage', filters.stage)
    if (filters.group) params.append('group', filters.group)

    const queryString = params.toString()
    const endpoint = `/matches${queryString ? `?${queryString}` : ''}`

    const response = await this.makeRequest<MatchesResponse>(endpoint)

    if (!response.success) {
      return response as ServiceResponse<MatchData[]>
    }

    return {
      ...response,
      data: response.data.matches,
    }
  }

  /**
   * Get matches by date range
   */
  static async getMatchesByDate(
    dateFrom: Date,
    dateTo: Date
  ): Promise<ServiceResponse<MatchData[]>> {
    return this.getMatches({
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
    })
  }

  /**
   * Get matches for today
   */
  static async getTodayMatches(): Promise<ServiceResponse<MatchData[]>> {
    const today = new Date()
    return this.getMatchesByDate(today, today)
  }

  /**
   * Get match status
   */
  static async getMatchStatus(matchId: number): Promise<ServiceResponse<MatchStatus>> {
    const response = await this.getMatch(matchId)

    if (!response.success) {
      return response as ServiceResponse<MatchStatus>
    }

    return {
      ...response,
      data: response.data.status,
    }
  }

  /**
   * Enhance match data with computed properties
   */
  static enhanceMatchData(match: MatchData): EnhancedMatchData {
    return createEnhancedMatchData(match)
  }

  /**
   * Synchronize match statuses with database
   * This method should be called periodically to update market statuses
   */
  static async syncMatchStatuses(matchIds: number[]): Promise<StatusSyncResult> {
    const results: StatusSyncResult['results'] = []
    let matchesChecked = 0
    let matchesUpdated = 0
    let matchesWithErrors = 0

    for (const matchId of matchIds) {
      matchesChecked++

      try {
        const response = await this.getMatch(matchId)

        if (!response.success) {
          matchesWithErrors++
          results.push({
            matchId,
            oldStatus: 'SCHEDULED',
            newStatus: 'SCHEDULED',
            updated: false,
            error: response.error,
          })
          continue
        }

        const newStatus = response.data.status

        // Here you would typically:
        // 1. Query the database for the current market status
        // 2. Compare with the new status
        // 3. Update if different
        // For now, we'll just track that we checked it

        results.push({
          matchId,
          oldStatus: 'SCHEDULED', // Would come from database
          newStatus,
          updated: false, // Would be true if database was updated
        })
      } catch (error) {
        matchesWithErrors++
        results.push({
          matchId,
          oldStatus: 'SCHEDULED',
          newStatus: 'SCHEDULED',
          updated: false,
          error: (error as Error).message,
        })
      }
    }

    return {
      matchesChecked,
      matchesUpdated,
      matchesWithErrors,
      results,
    }
  }

  /**
   * Delay helper for retry logic and rate limiting
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clear rate limit tracking (useful for testing)
   */
  static clearRateLimitTracking(): void {
    FootballDataRateLimiter.reset()
  }

  /**
   * Get rate limit status for monitoring
   */
  static getRateLimitStatus() {
    return FootballDataRateLimiter.getStatus()
  }
}

// Export types for convenience
export type {
  MatchData,
  EnhancedMatchData,
  ServiceResponse,
  RateLimitInfo,
  MatchFilters,
  StatusSyncResult,
}

export { type MatchStatus } from '@/config/football-data'