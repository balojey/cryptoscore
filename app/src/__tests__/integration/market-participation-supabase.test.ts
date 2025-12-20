/**
 * Integration test for Supabase market participation functionality
 * Tests the complete flow from market creation to participation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MarketService } from '../../lib/supabase/market-service'
import { UserService } from '../../lib/supabase/user-service'
import { DatabaseService } from '../../lib/supabase/database-service'

// Mock Supabase client
vi.mock('../../lib/supabase/database-service', () => ({
  DatabaseService: {
    createMarket: vi.fn(),
    getMarketById: vi.fn(),
    joinMarket: vi.fn(),
    updateMarket: vi.fn(),
    updateParticipant: vi.fn(),
    createTransaction: vi.fn(),
    getUserMarketParticipation: vi.fn(),
    getMarketParticipants: vi.fn(),
    getPlatformConfig: vi.fn(),
  }
}))

vi.mock('../../lib/supabase/user-service', () => ({
  UserService: {
    authenticateUser: vi.fn(),
    getUserByWalletAddress: vi.fn(),
  }
}))

describe('Supabase Market Participation Integration', () => {
  const mockUser = {
    id: 'user-123',
    wallet_address: '0x1234567890abcdef',
    email: 'test@example.com',
    display_name: 'Test User',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const mockMarket = {
    id: 'market-123',
    creator_id: 'user-123',
    title: 'Test Market',
    description: 'A test prediction market',
    entry_fee: 0.1,
    end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: 'active' as const,
    total_pool: 0,
    platform_fee_percentage: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    resolution_outcome: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    vi.mocked(DatabaseService.getPlatformConfig).mockResolvedValue({
      key: 'platform_fee_percentage',
      value: 5,
      updated_at: new Date().toISOString(),
    })
    
    vi.mocked(UserService.authenticateUser).mockResolvedValue({
      user: mockUser,
      isNewUser: false,
    })
    
    vi.mocked(DatabaseService.createMarket).mockResolvedValue(mockMarket)
    vi.mocked(DatabaseService.getMarketById).mockResolvedValue(mockMarket)
    vi.mocked(DatabaseService.getUserMarketParticipation).mockResolvedValue(null)
    vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue([])
  })

  describe('Market Creation', () => {
    it('should create a market with correct parameters', async () => {
      const createParams = {
        matchId: 'match-123',
        title: 'Test Market',
        description: 'A test prediction market',
        entryFee: 0.1,
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isPublic: true,
        creatorId: 'user-123',
      }

      const result = await MarketService.createMarket(createParams)

      expect(DatabaseService.createMarket).toHaveBeenCalledWith({
        creator_id: 'user-123',
        title: 'Test Market',
        description: 'A test prediction market',
        entry_fee: 0.1,
        end_time: createParams.endTime,
        status: 'active',
        total_pool: 0,
        platform_fee_percentage: 5,
      })

      expect(DatabaseService.createTransaction).toHaveBeenCalledWith({
        user_id: 'user-123',
        market_id: 'market-123',
        type: 'market_entry',
        amount: 0,
        description: 'Created market: Test Market',
      })

      expect(result).toEqual(mockMarket)
    })
  })

  describe('Market Participation', () => {
    it('should allow user to join market with prediction', async () => {
      const mockParticipant = {
        id: 'participant-123',
        market_id: 'market-123',
        user_id: 'user-456',
        prediction: 'Home' as const,
        entry_amount: 0.1,
        potential_winnings: 0.095,
        actual_winnings: null,
        joined_at: new Date().toISOString(),
      }

      vi.mocked(DatabaseService.joinMarket).mockResolvedValue(mockParticipant)

      const joinParams = {
        marketId: 'market-123',
        userId: 'user-456',
        prediction: 'Home' as const,
        entryAmount: 0.1,
      }

      const result = await MarketService.joinMarket(joinParams)

      expect(DatabaseService.getMarketById).toHaveBeenCalledWith('market-123')
      expect(DatabaseService.getUserMarketParticipation).toHaveBeenCalledWith('user-456', 'market-123')
      expect(DatabaseService.joinMarket).toHaveBeenCalledWith({
        market_id: 'market-123',
        user_id: 'user-456',
        prediction: 'Home',
        entry_amount: 0.1,
        potential_winnings: expect.any(Number),
      })

      expect(DatabaseService.updateMarket).toHaveBeenCalledWith('market-123', {
        total_pool: 0.1,
        updated_at: expect.any(String),
      })

      expect(DatabaseService.createTransaction).toHaveBeenCalledWith({
        user_id: 'user-456',
        market_id: 'market-123',
        type: 'market_entry',
        amount: 0.1,
        description: 'Joined market with Home prediction',
      })

      expect(result).toEqual(mockParticipant)
    })

    it('should prevent duplicate participation', async () => {
      const existingParticipant = {
        id: 'participant-123',
        market_id: 'market-123',
        user_id: 'user-456',
        prediction: 'Home' as const,
        entry_amount: 0.1,
        potential_winnings: 0.095,
        actual_winnings: null,
        joined_at: new Date().toISOString(),
      }

      vi.mocked(DatabaseService.getUserMarketParticipation).mockResolvedValue(existingParticipant)

      const joinParams = {
        marketId: 'market-123',
        userId: 'user-456',
        prediction: 'Away' as const,
        entryAmount: 0.1,
      }

      await expect(MarketService.joinMarket(joinParams)).rejects.toThrow('User has already joined this market')
    })

    it('should prevent joining ended markets', async () => {
      const endedMarket = {
        ...mockMarket,
        end_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      }

      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(endedMarket)

      const joinParams = {
        marketId: 'market-123',
        userId: 'user-456',
        prediction: 'Home' as const,
        entryAmount: 0.1,
      }

      await expect(MarketService.joinMarket(joinParams)).rejects.toThrow('Market has ended')
    })
  })

  describe('Market Resolution', () => {
    it('should resolve market and distribute winnings', async () => {
      const participants = [
        {
          id: 'p1',
          market_id: 'market-123',
          user_id: 'user-1',
          prediction: 'Home' as const,
          entry_amount: 100000000, // 0.1 SOL in lamports
          potential_winnings: 190000000, // 0.19 SOL in lamports
          actual_winnings: null,
          joined_at: new Date().toISOString(),
        },
        {
          id: 'p2',
          market_id: 'market-123',
          user_id: 'user-2',
          prediction: 'Away' as const,
          entry_amount: 100000000, // 0.1 SOL in lamports
          potential_winnings: 190000000, // 0.19 SOL in lamports
          actual_winnings: null,
          joined_at: new Date().toISOString(),
        },
      ]

      const marketWithPool = {
        ...mockMarket,
        total_pool: 200000000, // 0.2 SOL in lamports
      }

      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(marketWithPool)
      vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue(participants)

      await MarketService.resolveMarket({
        marketId: 'market-123',
        outcome: 'Home',
      })

      expect(DatabaseService.updateMarket).toHaveBeenCalledWith('market-123', {
        status: 'resolved',
        resolution_outcome: 'Home',
        updated_at: expect.any(String),
      })

      // Should create winnings transaction for winner
      expect(DatabaseService.createTransaction).toHaveBeenCalledWith({
        user_id: 'user-1',
        market_id: 'market-123',
        type: 'winnings',
        amount: 190000000, // 0.19 SOL in lamports (95% of 0.2 SOL pool)
        description: 'Winnings from market resolution: Home',
      })

      // Should create platform fee transaction
      expect(DatabaseService.createTransaction).toHaveBeenCalledWith({
        user_id: 'user-123', // Market creator
        market_id: 'market-123',
        type: 'platform_fee',
        amount: 6000000, // 3% of 0.2 SOL = 0.006 SOL in lamports
        description: 'Platform fee from market resolution',
      })
    })
  })

  describe('Market Statistics', () => {
    it('should calculate market statistics correctly', async () => {
      const participants = [
        {
          id: 'p1',
          market_id: 'market-123',
          user_id: 'user-1',
          prediction: 'Home' as const,
          entry_amount: 0.1,
          potential_winnings: 0.19,
          actual_winnings: null,
          joined_at: new Date().toISOString(),
        },
        {
          id: 'p2',
          market_id: 'market-123',
          user_id: 'user-2',
          prediction: 'Home' as const,
          entry_amount: 0.1,
          potential_winnings: 0.19,
          actual_winnings: null,
          joined_at: new Date().toISOString(),
        },
        {
          id: 'p3',
          market_id: 'market-123',
          user_id: 'user-3',
          prediction: 'Away' as const,
          entry_amount: 0.1,
          potential_winnings: 0.19,
          actual_winnings: null,
          joined_at: new Date().toISOString(),
        },
      ]

      vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue(participants)

      const stats = await MarketService.getMarketStats('market-123')

      expect(stats).toEqual({
        totalParticipants: 3,
        homeCount: 2,
        drawCount: 0,
        awayCount: 1,
        totalPool: expect.closeTo(0.3, 5), // Allow for floating point precision
      })
    })
  })
})