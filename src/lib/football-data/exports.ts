/**
 * Football-Data API Module Exports
 *
 * Barrel export file for the football-data API integration module.
 * Provides a clean interface for importing football-data functionality.
 *
 * @module lib/football-data/exports
 */

// Main service
export { FootballDataService } from './index'

// Utilities
export {
  mapApiStatusToDbStatus,
  isMatchLive,
  isMatchFinished,
  isMatchCancelled,
  isEligibleForMarket,
  determineMatchResult,
  validateMatchData,
  formatMatchDisplayName,
  formatMatchDate,
  getTimeUntilMatch,
  hasSignificantChange,
  createEnhancedMatchData,
  filterMatches,
  sortMatchesByDate,
} from './match-utils'

// Error handling
export {
  FootballDataError,
  FootballDataErrorHandler,
  FootballDataErrorType,
  withErrorHandling,
} from './error-handler'

// Rate limiting
export { FootballDataRateLimiter } from './rate-limiter'

// Configuration
export {
  footballDataConfig,
  validateFootballDataConfig,
  isFootballDataEnabled,
  getApiKeyCount,
  COMPETITION_IDS,
  DEFAULT_COMPETITIONS,
  type MatchStatus,
  type CompetitionId,
} from '@/config/football-data'

// Types
export type {
  MatchData,
  EnhancedMatchData,
  ServiceResponse,
  RateLimitInfo,
  MatchFilters,
  StatusSyncResult,
  Team,
  Competition,
  Area,
  Season,
  Score,
  Referee,
  MatchesResponse,
  MatchResponse,
  CompetitionResponse,
  TeamResponse,
  FootballDataError as FootballDataErrorType,
  ApiRequestOptions,
  MatchMonitorConfig,
} from '@/types/football-data'