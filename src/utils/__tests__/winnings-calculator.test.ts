import { describe, it, expect } from 'vitest'
import { WinningsCalculator } from '../winnings-calculator'
import type { MarketData } from '../../hooks/useMarketData'
import type { ParticipantData } from '../../hooks/useParticipantData'
import type { EnhancedMatchData } from '../../hooks/useMatchData'

describe('WinningsCalculator', () => {
  // Mock data for testing
  const mockMarketData: MarketData = {
    id: 'test-market-id',
    creator_id: 'test-creator-address',
    matchId: 'test-match-123',
    title: 'Test Market',
    description: 'Test market description',
    entry_fee: 1000000000, // 1 SOL in lamports
    end_time: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    status: 'active',
    resolution_outcome: null,
    total_pool: 5000000000, // 5 SOL in lamports
    platform_fee_percentage: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    participantCount: 5,
    homeCount: 2,
    drawCount: 1,
    awayCount: 2
  }

  const mockParticipantData: ParticipantData = {
    id: 'test-participant-id',
    market_id: 'test-market-id',
    user_id: 'test-user-address',
    prediction: 'Home',
    entry_amount: 1000000000,
    potential_winnings: 0,
    actual_winnings: null,
    joined_at: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
  }

  const mockFinishedMatch: EnhancedMatchData = {
    id: 123,
    utcDate: '2024-01-01T15:00:00Z',
    status: 'FINISHED',
    matchday: 1,
    stage: 'GROUP_STAGE',
    group: null,
    lastUpdated: '2024-01-01T17:00:00Z',
    area: { id: 1, name: 'England', code: 'ENG', flag: 'flag.png' },
    competition: { id: 1, name: 'Premier League', code: 'PL', type: 'LEAGUE', emblem: 'emblem.png' },
    season: { id: 1, startDate: '2024-01-01', endDate: '2024-12-31', currentMatchday: 1, winner: null },
    homeTeam: { id: 1, name: 'Team A', shortName: 'TEA', tla: 'TEA', crest: 'crest-a.png' },
    awayTeam: { id: 2, name: 'Team B', shortName: 'TEB', tla: 'TEB', crest: 'crest-b.png' },
    score: {
      winner: 'HOME',
      duration: 'REGULAR',
      fullTime: { home: 2, away: 1 },
      halfTime: { home: 1, away: 0 }
    },
    odds: { msg: 'No odds available' },
    referees: [],
    matchResult: 'Home',
    isFinished: true,
    hasValidScore: true
  }

  describe('calculatePotentialWinnings', () => {
    it('should calculate potential winnings for Home prediction (new user)', () => {
      const winnings = WinningsCalculator.calculatePotentialWinnings(mockMarketData, 'Home', false)
      
      // New total pool after user joins: 5 SOL + 1 SOL = 6 SOL
      // New participant pool is 95% of 6 SOL = 5.7 SOL
      // Home has 2 predictions, user will be 3rd, so each winner gets 5.7 SOL / 3
      const newTotalPool = 5000000000 + 1000000000 // 6 SOL
      const newParticipantPool = Math.floor((newTotalPool * 9500) / 10000)
      const expectedWinnings = Math.floor(newParticipantPool / 3) // 2 existing + 1 new user
      expect(winnings).toBe(expectedWinnings)
    })

    it('should calculate potential winnings for Draw prediction (new user)', () => {
      const winnings = WinningsCalculator.calculatePotentialWinnings(mockMarketData, 'Draw', false)
      
      // New total pool after user joins: 5 SOL + 1 SOL = 6 SOL
      // New participant pool is 95% of 6 SOL = 5.7 SOL
      // Draw has 1 prediction, user will be 2nd, so each winner gets 5.7 SOL / 2
      const newTotalPool = 5000000000 + 1000000000 // 6 SOL
      const newParticipantPool = Math.floor((newTotalPool * 9500) / 10000)
      const expectedWinnings = Math.floor(newParticipantPool / 2) // 1 existing + 1 new user
      expect(winnings).toBe(expectedWinnings)
    })

    it('should return full participant pool for unpredicted outcome (new user)', () => {
      const marketWithNoPredictions = {
        ...mockMarketData,
        homeCount: 0,
        drawCount: 0,
        awayCount: 0
      }
      
      const winnings = WinningsCalculator.calculatePotentialWinnings(marketWithNoPredictions, 'Home', false)
      // New total pool after user joins: 5 SOL + 1 SOL = 6 SOL
      // New participant pool is 95% of 6 SOL = 5.7 SOL
      // User would be the only one with this prediction, so gets full participant pool
      const newTotalPool = 5000000000 + 1000000000 // 6 SOL
      const newParticipantPool = Math.floor((newTotalPool * 9500) / 10000)
      expect(winnings).toBe(newParticipantPool)
    })

    it('should calculate potential winnings for existing participant', () => {
      const winnings = WinningsCalculator.calculatePotentialWinnings(mockMarketData, 'Home', true)
      
      // For existing participants, use current pool and current prediction count
      // Current participant pool is 95% of 5 SOL = 4.75 SOL
      // Home has 2 predictions, so each gets 4.75 SOL / 2
      const currentParticipantPool = Math.floor((5000000000 * 9500) / 10000)
      const expectedWinnings = Math.floor(currentParticipantPool / 2) // 2 existing Home predictions
      expect(winnings).toBe(expectedWinnings)
    })
  })

  describe('calculateActualWinnings', () => {
    it('should calculate actual winnings for correct prediction', () => {
      const resolvedMarket = {
        ...mockMarketData,
        status: 'resolved' as const,
        resolution_outcome: 'Home' as const
      }
      
      const winnings = WinningsCalculator.calculateActualWinnings(resolvedMarket, mockParticipantData)
      
      // Home prediction is correct, participant pool divided by 2 home predictions
      const expectedWinnings = Math.floor((5000000000 * 9500) / 10000 / 2)
      expect(winnings).toBe(expectedWinnings)
    })

    it('should return 0 for incorrect prediction', () => {
      const resolvedMarket = {
        ...mockMarketData,
        status: 'resolved' as const,
        resolution_outcome: 'Away' as const
      }
      
      const winnings = WinningsCalculator.calculateActualWinnings(resolvedMarket, mockParticipantData)
      expect(winnings).toBe(0)
    })
  })

  describe('calculateCreatorReward', () => {
    it('should calculate 2% creator reward', () => {
      const reward = WinningsCalculator.calculateCreatorReward(mockMarketData)
      
      // 2% of 5 SOL = 0.1 SOL = 100,000,000 lamports
      const expectedReward = Math.floor((5000000000 * 200) / 10000)
      expect(reward).toBe(expectedReward)
    })
  })

  describe('isUserCreator', () => {
    it('should return true when user is creator', () => {
      const isCreator = WinningsCalculator.isUserCreator(mockMarketData, 'test-creator-address')
      expect(isCreator).toBe(true)
    })

    it('should return false when user is not creator', () => {
      const isCreator = WinningsCalculator.isUserCreator(mockMarketData, 'different-address')
      expect(isCreator).toBe(false)
    })

    it('should return false when no user address provided', () => {
      const isCreator = WinningsCalculator.isUserCreator(mockMarketData)
      expect(isCreator).toBe(false)
    })
  })

  describe('calculateWinnings - integration scenarios', () => {
    it('should handle unauthenticated user viewing open market', () => {
      const result = WinningsCalculator.calculateWinnings({
        marketData: mockMarketData
      })

      expect(result.type).toBe('potential')
      expect(result.status).toBe('eligible')
      expect(result.displayVariant).toBe('info')
      expect(result.message).toContain('Average potential winnings across all predictions')
    })

    it('should handle participant viewing open market', () => {
      const result = WinningsCalculator.calculateWinnings({
        marketData: mockMarketData,
        participantData: mockParticipantData,
        userAddress: 'test-user-address'
      })

      expect(result.type).toBe('potential')
      expect(result.status).toBe('eligible')
      expect(result.displayVariant).toBe('info')
      expect(result.message).toContain('Potential winnings for your Home prediction')
    })

    it('should handle creator participant viewing open market', () => {
      const result = WinningsCalculator.calculateWinnings({
        marketData: mockMarketData,
        participantData: mockParticipantData,
        userAddress: 'test-creator-address' // Same as market creator
      })

      expect(result.type).toBe('potential')
      expect(result.status).toBe('eligible')
      expect(result.displayVariant).toBe('info')
      expect(result.breakdown?.participantWinnings).toBeDefined()
      expect(result.breakdown?.creatorReward).toBeDefined()
    })

    it('should handle winner viewing ended match', () => {
      const liveMarket = {
        ...mockMarketData,
        status: 'active' as const
      }

      const result = WinningsCalculator.calculateWinnings({
        marketData: liveMarket,
        participantData: mockParticipantData,
        userAddress: 'test-user-address',
        matchData: mockFinishedMatch
      })

      expect(result.type).toBe('actual')
      expect(result.status).toBe('won')
      expect(result.displayVariant).toBe('success')
      expect(result.message).toContain('You won!')
    })

    it('should handle resolved market with winner', () => {
      const resolvedMarket = {
        ...mockMarketData,
        status: 'resolved' as const,
        resolution_outcome: 'Home' as const
      }

      const result = WinningsCalculator.calculateWinnings({
        marketData: resolvedMarket,
        participantData: mockParticipantData,
        userAddress: 'test-user-address'
      })

      expect(result.type).toBe('actual')
      expect(result.status).toBe('distributed')
      expect(result.displayVariant).toBe('success')
      expect(result.message).toContain('Winnings distributed!')
    })
  })
})