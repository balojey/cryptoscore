/**
 * Football-Data API Rate Limiter
 *
 * Manages API rate limits across multiple API keys to maximize throughput
 * while respecting the football-data.org API rate limits.
 *
 * @module lib/football-data/rate-limiter
 */

import { footballDataConfig } from '@/config/football-data'

/**
 * Rate limit information for a single API key
 */
interface ApiKeyRateLimit {
  key: string
  requestsRemaining: number
  resetTime: number
  lastUsed: number
  isBlocked: boolean
}

/**
 * Rate limiter for football-data API
 */
export class FootballDataRateLimiter {
  private static keyLimits = new Map<string, ApiKeyRateLimit>()
  private static keyRotationIndex = 0

  /**
   * Initialize rate limiting for all configured API keys
   */
  static initialize(): void {
    const { apiKeys, rateLimit } = footballDataConfig

    for (const key of apiKeys) {
      if (!this.keyLimits.has(key)) {
        this.keyLimits.set(key, {
          key,
          requestsRemaining: rateLimit.requestsPerMinute,
          resetTime: Date.now() + 60000, // Reset in 1 minute
          lastUsed: 0,
          isBlocked: false,
        })
      }
    }
  }

  /**
   * Get the best available API key for making a request
   */
  static getBestApiKey(): string | null {
    this.initialize()

    const now = Date.now()
    const availableKeys: ApiKeyRateLimit[] = []

    // Reset any keys whose rate limit window has expired
    for (const [key, limit] of this.keyLimits.entries()) {
      if (now >= limit.resetTime) {
        limit.requestsRemaining = footballDataConfig.rateLimit.requestsPerMinute
        limit.resetTime = now + 60000
        limit.isBlocked = false
      }

      // Collect available keys (not blocked and has remaining requests)
      if (!limit.isBlocked && limit.requestsRemaining > 0) {
        availableKeys.push(limit)
      }
    }

    if (availableKeys.length === 0) {
      return null // No keys available
    }

    // Sort by requests remaining (descending) and last used (ascending)
    availableKeys.sort((a, b) => {
      if (a.requestsRemaining !== b.requestsRemaining) {
        return b.requestsRemaining - a.requestsRemaining
      }
      return a.lastUsed - b.lastUsed
    })

    return availableKeys[0].key
  }

  /**
   * Record that a request was made with a specific API key
   */
  static recordRequest(apiKey: string): void {
    const limit = this.keyLimits.get(apiKey)
    if (limit) {
      limit.requestsRemaining = Math.max(0, limit.requestsRemaining - 1)
      limit.lastUsed = Date.now()
    }
  }

  /**
   * Update rate limit information from API response headers
   */
  static updateFromHeaders(apiKey: string, headers: Headers): void {
    const limit = this.keyLimits.get(apiKey)
    if (!limit) return

    const remaining = headers.get('X-Requests-Available-Minute')
    const resetCounter = headers.get('X-RequestCounter-Reset')

    if (remaining) {
      limit.requestsRemaining = parseInt(remaining, 10)
    }

    if (resetCounter) {
      // The reset counter appears to be seconds until reset
      const resetSeconds = parseInt(resetCounter, 10)
      limit.resetTime = Date.now() + (resetSeconds * 1000)
    }
  }

  /**
   * Mark an API key as temporarily blocked (e.g., due to 429 response)
   */
  static blockApiKey(apiKey: string, blockDurationMs = 60000): void {
    const limit = this.keyLimits.get(apiKey)
    if (limit) {
      limit.isBlocked = true
      limit.requestsRemaining = 0
      limit.resetTime = Date.now() + blockDurationMs

      // Automatically unblock after the duration
      setTimeout(() => {
        limit.isBlocked = false
        limit.requestsRemaining = footballDataConfig.rateLimit.requestsPerMinute
      }, blockDurationMs)
    }
  }

  /**
   * Get rate limit status for all API keys
   */
  static getStatus(): Array<{
    key: string
    requestsRemaining: number
    resetTime: number
    isBlocked: boolean
    timeUntilReset: number
  }> {
    this.initialize()

    const now = Date.now()
    const status: Array<{
      key: string
      requestsRemaining: number
      resetTime: number
      isBlocked: boolean
      timeUntilReset: number
    }> = []

    for (const [key, limit] of this.keyLimits.entries()) {
      status.push({
        key: key.substring(0, 8) + '...', // Mask the key for security
        requestsRemaining: limit.requestsRemaining,
        resetTime: limit.resetTime,
        isBlocked: limit.isBlocked,
        timeUntilReset: Math.max(0, limit.resetTime - now),
      })
    }

    return status
  }

  /**
   * Calculate how long to wait before the next request
   */
  static getWaitTime(): number {
    const bestKey = this.getBestApiKey()
    
    if (bestKey) {
      // We have an available key, check if we need to wait for rate limiting
      const limit = this.keyLimits.get(bestKey)
      if (limit) {
        const timeSinceLastRequest = Date.now() - limit.lastUsed
        const minInterval = footballDataConfig.rateLimit.requestDelay
        
        if (timeSinceLastRequest < minInterval) {
          return minInterval - timeSinceLastRequest
        }
      }
      return 0
    }

    // No keys available, find the one that resets soonest
    const now = Date.now()
    let shortestWait = Infinity

    for (const limit of this.keyLimits.values()) {
      const waitTime = limit.resetTime - now
      if (waitTime > 0 && waitTime < shortestWait) {
        shortestWait = waitTime
      }
    }

    return shortestWait === Infinity ? 60000 : shortestWait
  }

  /**
   * Wait for the next available request slot
   */
  static async waitForAvailableSlot(): Promise<string> {
    const maxWaitTime = 5 * 60 * 1000 // 5 minutes max wait

    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      const bestKey = this.getBestApiKey()
      
      if (bestKey) {
        const waitTime = this.getWaitTime()
        
        if (waitTime > 0) {
          await this.delay(waitTime)
        }
        
        return bestKey
      }

      // No keys available, wait for the shortest reset time
      const waitTime = this.getWaitTime()
      await this.delay(Math.min(waitTime, 10000)) // Wait max 10 seconds at a time
    }

    throw new Error('No API keys available after maximum wait time')
  }

  /**
   * Reset all rate limit tracking (useful for testing)
   */
  static reset(): void {
    this.keyLimits.clear()
    this.keyRotationIndex = 0
  }

  /**
   * Get total number of requests remaining across all keys
   */
  static getTotalRequestsRemaining(): number {
    this.initialize()

    let total = 0
    for (const limit of this.keyLimits.values()) {
      if (!limit.isBlocked) {
        total += limit.requestsRemaining
      }
    }

    return total
  }

  /**
   * Check if any API keys are available
   */
  static hasAvailableKeys(): boolean {
    return this.getBestApiKey() !== null
  }

  /**
   * Delay helper
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}