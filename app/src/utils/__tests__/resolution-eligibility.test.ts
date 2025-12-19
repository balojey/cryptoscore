import { describe, it, expect } from 'vitest'
import { determineResolutionEligibility, getResolutionEligibilityMessage } from '../resolution-eligibility'
import type { EnhancedMatchData } from '../../hooks/useMatchData'

// Mock enhanced match data
const createMockMatchData = (overrides: Partial<EnhancedMatchData> = {}): EnhancedMatchData => ({
  id: 1,
  utcDate: '2024-01-01T15:00:00Z',
  status: 'FINISHED',
  matchday: 1,
  stage: 'REGULAR_SEASON',
  group: null,
  lastUpdated: '2024-01-01T17:00:00Z',
  area: { id: 1, name: 'England', code: 'ENG', flag: 'flag.png' },
  competition: { id: 1, name: 'Premier League', code: 'PL', type: 'LEAGUE', emblem: 'emblem.png' },
  season: { id: 1, startDate: '2024-01-01', endDate: '2024-12-31', currentMatchday: 1, winner: null },
  homeTeam: { id: 1, name: 'Arsenal', shortName: 'ARS', tla: 'ARS', crest: 'crest.png' },
  awayTeam: { id: 2, name: 'Chelsea', shortName: 'CHE', tla: 'CHE', crest: 'crest.png' },
  score: {
    winner: 'HOME_TEAM',
    duration: 'REGULAR',
    fullTime: { home: 2, away: 1 },
    halfTime: { home: 1, away: 0 }
  },
  odds: { msg: 'No odds available' },
  referees: [],
  matchResult: 'Home',
  isFinished: true,
  hasValidScore: true,
  ...overrides
})

describe('Resolution Eligibility', () => {
  it('should allow creator to resolve finished match', () => {
    const matchData = createMockMatchData()
    
    const result = determineResolutionEligibility({
      matchData,
      marketStatus: false,
      isUserCreator: true,
      isUserParticipant: false,
      userAddress: 'test-address'
    })

    expect(result.canResolve).toBe(true)
    expect(result.showResolveButton).toBe(true)
    expect(result.matchResult).toBe('Home')
  })

  it('should allow winning participant to resolve', () => {
    const matchData = createMockMatchData()
    
    const result = determineResolutionEligibility({
      matchData,
      marketStatus: false,
      isUserCreator: false,
      isUserParticipant: true,
      userPrediction: 'Home', // Matches the result
      userAddress: 'test-address'
    })

    expect(result.canResolve).toBe(true)
    expect(result.showResolveButton).toBe(true)
    expect(result.userHasWinningPrediction).toBe(true)
  })

  it('should not allow losing participant to resolve', () => {
    const matchData = createMockMatchData()
    
    const result = determineResolutionEligibility({
      matchData,
      marketStatus: false,
      isUserCreator: false,
      isUserParticipant: true,
      userPrediction: 'Away', // Does not match the result
      userAddress: 'test-address'
    })

    expect(result.canResolve).toBe(false)
    expect(result.showResolveButton).toBe(false)
    expect(result.userHasWinningPrediction).toBe(false)
    expect(result.reason).toBe('No potential rewards to claim')
  })

  it('should not allow resolution if match not finished', () => {
    const matchData = createMockMatchData({
      status: 'IN_PLAY',
      isFinished: false
    })
    
    const result = determineResolutionEligibility({
      matchData,
      marketStatus: false,
      isUserCreator: true,
      isUserParticipant: false,
      userAddress: 'test-address'
    })

    expect(result.canResolve).toBe(false)
    expect(result.showResolveButton).toBe(false)
    expect(result.reason).toBe('Match has not finished yet')
  })

  it('should not allow resolution if scores not available', () => {
    const matchData = createMockMatchData({
      hasValidScore: false,
      score: {
        winner: null,
        duration: 'REGULAR',
        fullTime: { home: null, away: null },
        halfTime: { home: null, away: null }
      }
    })
    
    const result = determineResolutionEligibility({
      matchData,
      marketStatus: false,
      isUserCreator: true,
      isUserParticipant: false,
      userAddress: 'test-address'
    })

    expect(result.canResolve).toBe(false)
    expect(result.showResolveButton).toBe(false)
    expect(result.reason).toBe('Match scores not available yet')
  })

  it('should provide user-friendly messages', () => {
    const eligibility = {
      canResolve: false,
      reason: 'Match has not finished yet',
      userHasWinningPrediction: false,
      showResolveButton: false
    }

    const message = getResolutionEligibilityMessage(eligibility)
    expect(message).toBe('Wait for the match to finish')
  })
})