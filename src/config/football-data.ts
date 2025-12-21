/**
 * Football-Data API Configuration
 *
 * Configuration for football-data.org API integration.
 * Supports multiple API keys for rate limit management and failover.
 *
 * @module config/football-data
 * @see {@link https://www.football-data.org/documentation Football-Data API Documentation}
 */

/**
 * Match status values from football-data API
 * These correspond to the match_status enum in the database
 */
export type MatchStatus = 
  | 'SCHEDULED'    // Match is scheduled but not started
  | 'LIVE'         // Match is currently in progress
  | 'IN_PLAY'      // Alternative live status
  | 'PAUSED'       // Match temporarily paused
  | 'FINISHED'     // Match completed normally
  | 'POSTPONED'    // Match postponed to later date
  | 'CANCELLED'    // Match cancelled
  | 'SUSPENDED'    // Match suspended indefinitely

/**
 * Football-Data API configuration interface
 */
export interface FootballDataConfig {
  /** Array of API keys for rate limit management */
  apiKeys: string[]
  
  /** Base URL for the API */
  baseUrl: string
  
  /** Request timeout in milliseconds */
  timeout: number
  
  /** Rate limit configuration */
  rateLimit: {
    /** Requests per minute per API key */
    requestsPerMinute: number
    
    /** Delay between requests in milliseconds */
    requestDelay: number
  }
  
  /** Retry configuration */
  retry: {
    /** Maximum number of retry attempts */
    maxAttempts: number
    
    /** Retry delays in milliseconds (exponential backoff) */
    delays: number[]
  }
}

/**
 * Football-Data API keys from environment variables
 * Supports up to 5 API keys for better rate limit management
 */
const API_KEYS = [
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_1,
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_2,
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_3,
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_4,
  import.meta.env.VITE_FOOTBALL_DATA_API_KEY_5,
].filter(Boolean) as string[]

/**
 * Football-Data API base URL
 */
export const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4'

/**
 * Request timeout in milliseconds
 */
export const FOOTBALL_DATA_TIMEOUT = 10000

/**
 * Rate limit configuration
 * Free tier: 10 requests per minute per API key
 * Paid tier: Higher limits available
 */
export const RATE_LIMIT_CONFIG = {
  requestsPerMinute: 10,
  requestDelay: 6000, // 6 seconds between requests for free tier
}

/**
 * Retry configuration with exponential backoff
 */
export const RETRY_CONFIG = {
  maxAttempts: 3,
  delays: [1000, 2000, 4000], // 1s, 2s, 4s
}

/**
 * Complete Football-Data API configuration
 */
export const footballDataConfig: FootballDataConfig = {
  apiKeys: API_KEYS,
  baseUrl: FOOTBALL_DATA_BASE_URL,
  timeout: FOOTBALL_DATA_TIMEOUT,
  rateLimit: RATE_LIMIT_CONFIG,
  retry: RETRY_CONFIG,
}

/**
 * Validate Football-Data API configuration
 *
 * @returns Object containing validation result and optional error message
 */
export function validateFootballDataConfig(): {
  valid: boolean
  error?: string
} {
  if (API_KEYS.length === 0) {
    return {
      valid: false,
      error: 'No Football-Data API keys found in environment variables. Set at least VITE_FOOTBALL_DATA_API_KEY_1',
    }
  }

  // Validate API key format (should be valid strings)
  for (let i = 0; i < API_KEYS.length; i++) {
    const key = API_KEYS[i]
    if (!key || typeof key !== 'string' || key.length < 10) {
      return {
        valid: false,
        error: `Invalid API key at position ${i + 1}. API keys should be valid strings.`,
      }
    }
  }

  return { valid: true }
}

/**
 * Check if Football-Data API integration is enabled
 *
 * @returns True if at least one API key is configured
 */
export function isFootballDataEnabled(): boolean {
  return API_KEYS.length > 0
}

/**
 * Get the number of configured API keys
 *
 * @returns Number of available API keys
 */
export function getApiKeyCount(): number {
  return API_KEYS.length
}

/**
 * Competition IDs for major football leagues
 * These can be used to filter matches by competition
 */
export const COMPETITION_IDS = {
  PREMIER_LEAGUE: 2021,
  CHAMPIONS_LEAGUE: 2001,
  BUNDESLIGA: 2002,
  SERIE_A: 2019,
  LA_LIGA: 2014,
  LIGUE_1: 2015,
  EREDIVISIE: 2003,
  PRIMEIRA_LIGA: 2017,
  CHAMPIONSHIP: 2016,
  WORLD_CUP: 2000,
  EUROPEAN_CHAMPIONSHIP: 2018,
} as const

/**
 * Type for competition IDs
 */
export type CompetitionId = typeof COMPETITION_IDS[keyof typeof COMPETITION_IDS]

/**
 * Default competitions to monitor
 * Can be configured based on user preferences
 */
export const DEFAULT_COMPETITIONS = [
  COMPETITION_IDS.PREMIER_LEAGUE,
  COMPETITION_IDS.CHAMPIONS_LEAGUE,
  COMPETITION_IDS.BUNDESLIGA,
  COMPETITION_IDS.SERIE_A,
  COMPETITION_IDS.LA_LIGA,
] as const