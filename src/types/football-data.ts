/**
 * Football-Data API Type Definitions
 *
 * Type definitions for the football-data.org API responses and data structures.
 * These types ensure type safety when working with external API data.
 *
 * @module types/football-data
 */

import type { MatchStatus } from '@/config/football-data'

/**
 * Team information from football-data API
 */
export interface Team {
  id: number
  name: string
  shortName: string
  tla: string // Three Letter Abbreviation
  crest: string // Team logo URL
}

/**
 * Competition information from football-data API
 */
export interface Competition {
  id: number
  name: string
  code: string
  type: string
  emblem: string
}

/**
 * Area (country/region) information from football-data API
 */
export interface Area {
  id: number
  name: string
  code: string
  flag: string
}

/**
 * Season information from football-data API
 */
export interface Season {
  id: number
  startDate: string
  endDate: string
  currentMatchday: number
  winner: Team | null
}

/**
 * Match score information from football-data API
 */
export interface Score {
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
  duration: 'REGULAR' | 'EXTRA_TIME' | 'PENALTY_SHOOTOUT'
  fullTime: {
    home: number | null
    away: number | null
  }
  halfTime: {
    home: number | null
    away: number | null
  }
  extraTime?: {
    home: number | null
    away: number | null
  }
  penalties?: {
    home: number | null
    away: number | null
  }
}

/**
 * Referee information from football-data API
 */
export interface Referee {
  id: number
  name: string
  type: string
  nationality: string
}

/**
 * Match data from football-data API
 */
export interface MatchData {
  id: number
  utcDate: string
  status: MatchStatus
  matchday: number
  stage: string
  group: string | null
  lastUpdated: string
  area: Area
  competition: Competition
  season: Season
  homeTeam: Team
  awayTeam: Team
  score: Score
  odds?: {
    msg: string
  }
  referees: Referee[]
}

/**
 * Enhanced match data with computed properties
 */
export interface EnhancedMatchData extends MatchData {
  /** Computed match result for market resolution */
  matchResult?: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN'
  
  /** Whether the match has finished */
  isFinished: boolean
  
  /** Whether the match has a valid score for resolution */
  hasValidScore: boolean
  
  /** Whether the match can be used for market creation */
  isEligibleForMarket: boolean
}

/**
 * API response wrapper for matches
 */
export interface MatchesResponse {
  filters: {
    dateFrom?: string
    dateTo?: string
    status?: MatchStatus[]
    competitions?: number[]
  }
  resultSet: {
    count: number
    first: string
    last: string
    played: number
  }
  matches: MatchData[]
}

/**
 * API response wrapper for a single match
 */
export interface MatchResponse {
  match: MatchData
}

/**
 * Competition details response
 */
export interface CompetitionResponse {
  competition: Competition & {
    area: Area
    currentSeason: Season
    seasons: Season[]
    lastUpdated: string
  }
}

/**
 * Team details response
 */
export interface TeamResponse {
  team: Team & {
    area: Area
    activeCompetitions: Competition[]
    coach: {
      id: number
      name: string
      dateOfBirth: string
      nationality: string
    }
    squad: Array<{
      id: number
      name: string
      position: string
      dateOfBirth: string
      nationality: string
    }>
    lastUpdated: string
  }
}

/**
 * API error response structure
 */
export interface FootballDataError {
  message: string
  errorCode: number
}

/**
 * Rate limit information from API headers
 */
export interface RateLimitInfo {
  /** Requests remaining in current window */
  remaining: number
  
  /** Total requests allowed per window */
  limit: number
  
  /** Time when rate limit resets (Unix timestamp) */
  resetTime: number
  
  /** Seconds until rate limit resets */
  resetTimeSeconds: number
}

/**
 * API request options
 */
export interface ApiRequestOptions {
  /** API key to use for the request */
  apiKey?: string
  
  /** Request timeout in milliseconds */
  timeout?: number
  
  /** Whether to retry on failure */
  retry?: boolean
  
  /** Additional headers to include */
  headers?: Record<string, string>
}

/**
 * Match filter options for API requests
 */
export interface MatchFilters {
  /** Filter by date range */
  dateFrom?: string
  dateTo?: string
  
  /** Filter by match status */
  status?: MatchStatus | MatchStatus[]
  
  /** Filter by competition IDs */
  competitions?: number[]
  
  /** Filter by matchday */
  matchday?: number
  
  /** Filter by stage */
  stage?: string
  
  /** Filter by group */
  group?: string
}

/**
 * Service response wrapper
 */
export interface ServiceResponse<T> {
  /** Response data */
  data: T
  
  /** Whether the request was successful */
  success: boolean
  
  /** Error message if request failed */
  error?: string
  
  /** Rate limit information */
  rateLimit?: RateLimitInfo
  
  /** API key used for the request */
  apiKeyUsed?: string
}

/**
 * Status synchronization result
 */
export interface StatusSyncResult {
  /** Number of matches checked */
  matchesChecked: number
  
  /** Number of matches updated */
  matchesUpdated: number
  
  /** Number of matches with errors */
  matchesWithErrors: number
  
  /** Detailed results per match */
  results: Array<{
    matchId: number
    oldStatus: MatchStatus
    newStatus: MatchStatus
    updated: boolean
    error?: string
  }>
}

/**
 * Match monitoring configuration
 */
export interface MatchMonitorConfig {
  /** Interval between status checks in milliseconds */
  checkInterval: number
  
  /** Match IDs to monitor */
  matchIds: number[]
  
  /** Whether to auto-resolve markets when matches finish */
  autoResolve: boolean
  
  /** Callback for status updates */
  onStatusUpdate?: (matchId: number, oldStatus: MatchStatus, newStatus: MatchStatus) => void
  
  /** Callback for errors */
  onError?: (matchId: number, error: string) => void
}