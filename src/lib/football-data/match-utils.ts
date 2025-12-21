/**
 * Football-Data Match Utilities
 *
 * Utility functions for working with match data, status mapping,
 * and validation logic for the football-data API integration.
 *
 * @module lib/football-data/match-utils
 */

import type { MatchData, EnhancedMatchData } from '@/types/football-data'
import type { MatchStatus } from '@/config/football-data'

/**
 * Map football-data API status to database enum values
 * Ensures consistency between external API and internal database
 */
export function mapApiStatusToDbStatus(apiStatus: string): MatchStatus {
  // Normalize the status string
  const normalizedStatus = apiStatus.toUpperCase().trim()

  // Direct mappings
  const statusMap: Record<string, MatchStatus> = {
    'SCHEDULED': 'SCHEDULED',
    'TIMED': 'SCHEDULED',
    'LIVE': 'LIVE',
    'IN_PLAY': 'IN_PLAY',
    'PAUSED': 'PAUSED',
    'FINISHED': 'FINISHED',
    'FULL_TIME': 'FINISHED',
    'POSTPONED': 'POSTPONED',
    'CANCELLED': 'CANCELLED',
    'SUSPENDED': 'SUSPENDED',
    'AWARDED': 'FINISHED', // Match awarded to one team
  }

  return statusMap[normalizedStatus] || 'SCHEDULED'
}

/**
 * Check if a match status indicates the match is active/live
 */
export function isMatchLive(status: MatchStatus): boolean {
  return ['LIVE', 'IN_PLAY', 'PAUSED'].includes(status)
}

/**
 * Check if a match status indicates the match is finished
 */
export function isMatchFinished(status: MatchStatus): boolean {
  return status === 'FINISHED'
}

/**
 * Check if a match status indicates the match is cancelled/postponed
 */
export function isMatchCancelled(status: MatchStatus): boolean {
  return ['CANCELLED', 'POSTPONED', 'SUSPENDED'].includes(status)
}

/**
 * Check if a match is eligible for market creation
 */
export function isEligibleForMarket(match: MatchData): boolean {
  // Must be scheduled and in the future
  if (match.status !== 'SCHEDULED') {
    return false
  }

  const matchDate = new Date(match.utcDate)
  const now = new Date()

  // Must be at least 1 hour in the future
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
  
  return matchDate > oneHourFromNow
}

/**
 * Determine the match result from score data
 */
export function determineMatchResult(match: MatchData): 'HOME_WIN' | 'DRAW' | 'AWAY_WIN' | undefined {
  if (!isMatchFinished(match.status)) {
    return undefined
  }

  const { fullTime } = match.score

  if (fullTime.home === null || fullTime.away === null) {
    return undefined
  }

  if (fullTime.home > fullTime.away) {
    return 'HOME_WIN'
  } else if (fullTime.home < fullTime.away) {
    return 'AWAY_WIN'
  } else {
    return 'DRAW'
  }
}

/**
 * Validate match data completeness
 */
export function validateMatchData(match: MatchData): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Required fields
  if (!match.id) {
    errors.push('Match ID is required')
  }

  if (!match.utcDate) {
    errors.push('Match date is required')
  }

  if (!match.status) {
    errors.push('Match status is required')
  }

  if (!match.homeTeam?.id || !match.homeTeam?.name) {
    errors.push('Home team information is incomplete')
  }

  if (!match.awayTeam?.id || !match.awayTeam?.name) {
    errors.push('Away team information is incomplete')
  }

  if (!match.competition?.id || !match.competition?.name) {
    errors.push('Competition information is incomplete')
  }

  // Date validation
  if (match.utcDate) {
    const matchDate = new Date(match.utcDate)
    if (isNaN(matchDate.getTime())) {
      errors.push('Invalid match date format')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Format match display name
 */
export function formatMatchDisplayName(match: MatchData): string {
  const homeTeam = match.homeTeam.shortName || match.homeTeam.name
  const awayTeam = match.awayTeam.shortName || match.awayTeam.name
  
  return `${homeTeam} vs ${awayTeam}`
}

/**
 * Format match date for display
 */
export function formatMatchDate(match: MatchData, locale = 'en-US'): string {
  const date = new Date(match.utcDate)
  
  return date.toLocaleDateString(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

/**
 * Get time until match starts
 */
export function getTimeUntilMatch(match: MatchData): {
  isPast: boolean
  days: number
  hours: number
  minutes: number
  totalMinutes: number
} {
  const matchDate = new Date(match.utcDate)
  const now = new Date()
  const diffMs = matchDate.getTime() - now.getTime()

  const isPast = diffMs < 0
  const absDiffMs = Math.abs(diffMs)

  const totalMinutes = Math.floor(absDiffMs / (1000 * 60))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  return {
    isPast,
    days,
    hours,
    minutes,
    totalMinutes,
  }
}

/**
 * Check if match data has changed significantly
 */
export function hasSignificantChange(
  oldMatch: MatchData,
  newMatch: MatchData
): boolean {
  // Status change is always significant
  if (oldMatch.status !== newMatch.status) {
    return true
  }

  // Score changes are significant
  if (
    oldMatch.score.fullTime.home !== newMatch.score.fullTime.home ||
    oldMatch.score.fullTime.away !== newMatch.score.fullTime.away
  ) {
    return true
  }

  // Date changes are significant
  if (oldMatch.utcDate !== newMatch.utcDate) {
    return true
  }

  return false
}

/**
 * Create enhanced match data with computed properties
 */
export function createEnhancedMatchData(match: MatchData): EnhancedMatchData {
  const matchResult = determineMatchResult(match)
  const isFinished = isMatchFinished(match.status)
  const hasValidScore = 
    match.score.fullTime.home !== null && 
    match.score.fullTime.away !== null
  const isEligibleForMarketCreation = isEligibleForMarket(match)

  return {
    ...match,
    matchResult,
    isFinished,
    hasValidScore,
    isEligibleForMarket: isEligibleForMarketCreation,
  }
}

/**
 * Filter matches by criteria
 */
export function filterMatches(
  matches: MatchData[],
  criteria: {
    status?: MatchStatus[]
    competitionIds?: number[]
    dateFrom?: Date
    dateTo?: Date
    eligibleForMarket?: boolean
  }
): MatchData[] {
  return matches.filter(match => {
    // Status filter
    if (criteria.status && !criteria.status.includes(match.status)) {
      return false
    }

    // Competition filter
    if (criteria.competitionIds && !criteria.competitionIds.includes(match.competition.id)) {
      return false
    }

    // Date range filter
    const matchDate = new Date(match.utcDate)
    if (criteria.dateFrom && matchDate < criteria.dateFrom) {
      return false
    }
    if (criteria.dateTo && matchDate > criteria.dateTo) {
      return false
    }

    // Market eligibility filter
    if (criteria.eligibleForMarket !== undefined) {
      const eligible = isEligibleForMarket(match)
      if (criteria.eligibleForMarket !== eligible) {
        return false
      }
    }

    return true
  })
}

/**
 * Sort matches by date
 */
export function sortMatchesByDate(
  matches: MatchData[],
  direction: 'asc' | 'desc' = 'asc'
): MatchData[] {
  return [...matches].sort((a, b) => {
    const dateA = new Date(a.utcDate).getTime()
    const dateB = new Date(b.utcDate).getTime()
    
    return direction === 'asc' ? dateA - dateB : dateB - dateA
  })
}