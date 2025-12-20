/**
 * Tests for Market Resolution and Winnings Calculation
 * 
 * Tests the enhanced market resolution functionality that preserves
 * the same winnings calculation logic as the original WinningsCalculator.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MarketService } from '../market-service'
import { DatabaseService } from '../database-service'

// Mock DatabaseService
vi.mock('../database-service')

describe('Market Resolution and Winnings Calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('resolveMarket', () => {
    it('should calculate winnings using the same logic as WinningsCalculator', async () => {
      // Mock market data
      const mockMarket = {
        id: 'market-123',
        creator_id: 'creator-456',
        title: 'Test Market',
        description: 'Test Description',
        entry_fee: 100000000, // 0.1 SOL in lamports
        end_time: '2025-12-31T23:59:59Z', // Future date
        status: 'active' as const,
        resolution_outcome: null,
        total_pool: 1000000000, // 1 SOL in lamports
        platform_fee_percentage: 0.05,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock participants - 2 Home, 1 Draw, 2 Away
      const mockParticipants = [
        {
          id: 'participant-1',
          market_id: 'market-123',
          user_id: 'user-1',
          prediction: 'Home',
          entry_amount: 200000000, // 0.2 SOL in lamports
          potential_winnings: 475000000, // 0.475 SOL in lamports
          actual_winnings: null,
          joined_at: '2024-01-01T01:00:00Z'
        },
        {
          id: 'participant-2',
          market_id: 'market-123',
          user_id: 'user-2',
          prediction: 'Home',
          entry_amount: 200000000, // 0.2 SOL in lamports
          potential_winnings: 475000000, // 0.475 SOL in lamports
          actual_winnings: null,
          joined_at: '2024-01-01T02:00:00Z'
        },
        {
          id: 'participant-3',
          market_id: 'market-123',
          user_id: 'user-3',
          prediction: 'Draw',
          entry_amount: 200000000, // 0.2 SOL in lamports
          potential_winnings: 950000000, // 0.95 SOL in lamports
          actual_winnings: null,
          joined_at: '2024-01-01T03:00:00Z'
        },
        {
          id: 'participant-4',
          market_id: 'market-123',
          user_id: 'user-4',
          prediction: 'Away',
          entry_amount: 200000000, // 0.2 SOL in lamports
          potential_winnings: 475000000, // 0.475 SOL in lamports
          actual_winnings: null,
          joined_at: '2024-01-01T04:00:00Z'
        },
        {
          id: 'participant-5',
          market_id: 'market-123',
          user_id: 'user-5',
          prediction: 'Away',
          entry_amount: 200000000, // 0.2 SOL in lamports
          potential_winnings: 475000000, // 0.475 SOL in lamports
          actual_winnings: null,
          joined_at: '2024-01-01T05:00:00Z'
        }
      ]

      // Mock DatabaseService methods
      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(mockMarket)
      vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue(mockParticipants)
      vi.mocked(DatabaseService.updateMarket).mockResolvedValue({ ...mockMarket, status: 'resolved', resolution_outcome: 'Home' })
      vi.mocked(DatabaseService.updateParticipant).mockResolvedValue(mockParticipants[0])
      vi.mocked(DatabaseService.createTransaction).mockResolvedValue({
        id: 'transaction-123',
        user_id: 'user-1',
        market_id: 'market-123',
        type: 'winnings',
        amount: 475000000, // 0.475 SOL in lamports
        description: 'Winnings from market resolution: Home',
        created_at: '2024-01-01T06:00:00Z'
      })

      // Resolve market with 'Home' as winning outcome
      try {
        await MarketService.resolveMarket({
          marketId: 'market-123',
          outcome: 'Home'
        })
      } catch (error) {
        console.error('Error in resolveMarket:', error)
        throw error
      }

      // Verify market was updated to resolved status
      expect(DatabaseService.updateMarket).toHaveBeenCalledWith('market-123', {
        status: 'resolved',
        resolution_outcome: 'Home',
        updated_at: expect.any(String)
      })

      // Verify winnings calculation using WinningsCalculator logic
      // Total pool: 1000000000 lamports (1 SOL)
      // Participant pool (95%): 950000000 lamports (0.95 SOL)
      // Home winners: 2 participants
      // Winnings per winner: Math.floor(950000000 / 2) = 475000000 lamports (0.475 SOL)
      const expectedWinningsPerWinner = Math.floor((1000000000 * 9500) / 10000 / 2)

      // Verify each participant was updated correctly
      expect(DatabaseService.updateParticipant).toHaveBeenCalledTimes(5)
      
      // Home winners should get winnings
      expect(DatabaseService.updateParticipant).toHaveBeenCalledWith('participant-1', {
        actual_winnings: expectedWinningsPerWinner
      })
      expect(DatabaseService.updateParticipant).toHaveBeenCalledWith('participant-2', {
        actual_winnings: expectedWinningsPerWinner
      })
      
      // Losers should get 0 winnings
      expect(DatabaseService.updateParticipant).toHaveBeenCalledWith('participant-3', {
        actual_winnings: 0
      })
      expect(DatabaseService.updateParticipant).toHaveBeenCalledWith('participant-4', {
        actual_winnings: 0
      })
      expect(DatabaseService.updateParticipant).toHaveBeenCalledWith('participant-5', {
        actual_winnings: 0
      })

      // Verify transactions were created
      // 2 winning transactions + 1 creator reward + 1 platform fee = 4 total
      expect(DatabaseService.createTransaction).toHaveBeenCalledTimes(4)
      
      // Verify creator reward transaction (2% of total pool)
      const expectedCreatorFee = Math.floor((1000000000 * 200) / 10000) // 20000000 lamports (0.02 SOL)
      expect(DatabaseService.createTransaction).toHaveBeenCalledWith({
        user_id: 'creator-456',
        market_id: 'market-123',
        type: 'creator_reward',
        amount: expectedCreatorFee,
        description: 'Creator reward from market resolution'
      })

      // Verify platform fee transaction (3% of total pool)
      const expectedPlatformFee = Math.floor((1000000000 * 300) / 10000) // 30000000 lamports (0.03 SOL)
      expect(DatabaseService.createTransaction).toHaveBeenCalledWith({
        user_id: 'creator-456',
        market_id: 'market-123',
        type: 'platform_fee',
        amount: expectedPlatformFee,
        description: 'Platform fee from market resolution'
      })
    })

    it('should handle market with no winners correctly', async () => {
      const mockMarket = {
        id: 'market-123',
        creator_id: 'creator-456',
        title: 'Test Market',
        description: 'Test Description',
        entry_fee: 100000000, // 0.1 SOL in lamports
        end_time: '2025-12-31T23:59:59Z',
        status: 'active' as const,
        resolution_outcome: null,
        total_pool: 600000000, // 0.6 SOL in lamports
        platform_fee_percentage: 0.05,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock participants - all predicted Draw, but outcome is Home
      const mockParticipants = [
        {
          id: 'participant-1',
          market_id: 'market-123',
          user_id: 'user-1',
          prediction: 'Draw',
          entry_amount: 200000000, // 0.2 SOL in lamports
          potential_winnings: 570000000, // 0.57 SOL in lamports
          actual_winnings: null,
          joined_at: '2024-01-01T01:00:00Z'
        },
        {
          id: 'participant-2',
          market_id: 'market-123',
          user_id: 'user-2',
          prediction: 'Draw',
          entry_amount: 200000000, // 0.2 SOL in lamports
          potential_winnings: 570000000, // 0.57 SOL in lamports
          actual_winnings: null,
          joined_at: '2024-01-01T02:00:00Z'
        },
        {
          id: 'participant-3',
          market_id: 'market-123',
          user_id: 'user-3',
          prediction: 'Draw',
          entry_amount: 200000000, // 0.2 SOL in lamports
          potential_winnings: 570000000, // 0.57 SOL in lamports
          actual_winnings: null,
          joined_at: '2024-01-01T03:00:00Z'
        }
      ]

      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(mockMarket)
      vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue(mockParticipants)
      vi.mocked(DatabaseService.updateMarket).mockResolvedValue({ ...mockMarket, status: 'resolved', resolution_outcome: 'Home' })
      vi.mocked(DatabaseService.updateParticipant).mockResolvedValue(mockParticipants[0])
      vi.mocked(DatabaseService.createTransaction).mockResolvedValue({
        id: 'transaction-123',
        user_id: 'creator-456',
        market_id: 'market-123',
        type: 'creator_reward',
        amount: 12000000, // 0.012 SOL in lamports (2% of 0.6 SOL)
        description: 'Creator reward from market resolution',
        created_at: '2024-01-01T06:00:00Z'
      })

      await MarketService.resolveMarket({
        marketId: 'market-123',
        outcome: 'Home'
      })

      // All participants should get 0 winnings
      expect(DatabaseService.updateParticipant).toHaveBeenCalledTimes(3)
      mockParticipants.forEach((participant, index) => {
        expect(DatabaseService.updateParticipant).toHaveBeenNthCalledWith(index + 1, participant.id, {
          actual_winnings: 0
        })
      })

      // Only creator reward and platform fee transactions should be created (no winning transactions)
      expect(DatabaseService.createTransaction).toHaveBeenCalledTimes(2)
    })
  })

  describe('joinMarket', () => {
    it('should calculate potential winnings using WinningsCalculator logic', async () => {
      const mockMarket = {
        id: 'market-123',
        creator_id: 'creator-456',
        title: 'Test Market',
        description: 'Test Description',
        entry_fee: 0.1,
        end_time: '2025-12-31T23:59:59Z',
        status: 'active' as const,
        resolution_outcome: null,
        total_pool: 0.4, // 4 participants already joined
        platform_fee_percentage: 0.05,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock existing participants - 2 Home, 1 Draw, 1 Away
      const mockParticipants = [
        {
          id: 'participant-1',
          market_id: 'market-123',
          user_id: 'user-1',
          prediction: 'Home',
          entry_amount: 0.1,
          potential_winnings: 0.237,
          actual_winnings: null,
          joined_at: '2024-01-01T01:00:00Z'
        },
        {
          id: 'participant-2',
          market_id: 'market-123',
          user_id: 'user-2',
          prediction: 'Home',
          entry_amount: 0.1,
          potential_winnings: 0.237,
          actual_winnings: null,
          joined_at: '2024-01-01T02:00:00Z'
        },
        {
          id: 'participant-3',
          market_id: 'market-123',
          user_id: 'user-3',
          prediction: 'Draw',
          entry_amount: 0.1,
          potential_winnings: 0.475,
          actual_winnings: null,
          joined_at: '2024-01-01T03:00:00Z'
        },
        {
          id: 'participant-4',
          market_id: 'market-123',
          user_id: 'user-4',
          prediction: 'Away',
          entry_amount: 0.1,
          potential_winnings: 0.475,
          actual_winnings: null,
          joined_at: '2024-01-01T04:00:00Z'
        }
      ]

      const newParticipant = {
        id: 'participant-5',
        market_id: 'market-123',
        user_id: 'user-5',
        prediction: 'Home',
        entry_amount: 0.1,
        potential_winnings: 0.158, // Will be calculated
        actual_winnings: null,
        joined_at: '2024-01-01T05:00:00Z'
      }

      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(mockMarket)
      vi.mocked(DatabaseService.getUserMarketParticipation).mockResolvedValue(null)
      vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue(mockParticipants)
      vi.mocked(DatabaseService.joinMarket).mockResolvedValue(newParticipant)
      vi.mocked(DatabaseService.updateMarket).mockResolvedValue(mockMarket)
      vi.mocked(DatabaseService.createTransaction).mockResolvedValue({
        id: 'transaction-123',
        user_id: 'user-5',
        market_id: 'market-123',
        type: 'market_entry',
        amount: 0.1,
        description: 'Joined market with Home prediction',
        created_at: '2024-01-01T05:00:00Z'
      })

      await MarketService.joinMarket({
        marketId: 'market-123',
        userId: 'user-5',
        prediction: 'Home',
        entryAmount: 0.1
      })

      // Verify potential winnings calculation
      // New total pool: 0.4 + 0.1 = 0.5 SOL
      // New participant pool (95%): 0.475 SOL
      // Home predictions: 2 existing + 1 new = 3 total
      // Potential winnings per Home prediction: Math.floor(0.475 / 3) = 0.158 SOL
      const expectedPotentialWinnings = Math.floor((0.5 * 9500) / 10000 / 3)

      expect(DatabaseService.joinMarket).toHaveBeenCalledWith({
        market_id: 'market-123',
        user_id: 'user-5',
        prediction: 'Home',
        entry_amount: 0.1,
        potential_winnings: expectedPotentialWinnings
      })
    })
  })

  describe('getUserBalance', () => {
    it('should calculate user balance correctly from transactions', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          user_id: 'user-123',
          market_id: 'market-1',
          type: 'market_entry' as const,
          amount: 0.1,
          description: 'Joined market',
          created_at: '2024-01-01T01:00:00Z'
        },
        {
          id: 'tx-2',
          user_id: 'user-123',
          market_id: 'market-1',
          type: 'winnings' as const,
          amount: 0.2,
          description: 'Market winnings',
          created_at: '2024-01-01T02:00:00Z'
        },
        {
          id: 'tx-3',
          user_id: 'user-123',
          market_id: 'market-2',
          type: 'creator_reward' as const,
          amount: 0.05,
          description: 'Creator reward',
          created_at: '2024-01-01T03:00:00Z'
        },
        {
          id: 'tx-4',
          user_id: 'user-123',
          market_id: 'market-2',
          type: 'market_entry' as const,
          amount: 0.1,
          description: 'Joined another market',
          created_at: '2024-01-01T04:00:00Z'
        }
      ]

      vi.mocked(DatabaseService.getUserTransactions).mockResolvedValue(mockTransactions)

      const balance = await MarketService.getUserBalance('user-123')

      // Balance = winnings (0.2) + creator_reward (0.05) - market_entry (0.1 + 0.1) = 0.05
      expect(balance).toBeCloseTo(0.05, 10)
    })
  })

  describe('getUserPortfolio', () => {
    it('should calculate portfolio metrics correctly', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          user_id: 'user-123',
          market_id: 'market-1',
          type: 'market_entry' as const,
          amount: 0.1,
          description: 'Joined market',
          created_at: '2024-01-01T01:00:00Z'
        },
        {
          id: 'tx-2',
          user_id: 'user-123',
          market_id: 'market-1',
          type: 'winnings' as const,
          amount: 0.2,
          description: 'Market winnings',
          created_at: '2024-01-01T02:00:00Z'
        },
        {
          id: 'tx-3',
          user_id: 'user-123',
          market_id: 'market-2',
          type: 'creator_reward' as const,
          amount: 0.05,
          description: 'Creator reward',
          created_at: '2024-01-01T03:00:00Z'
        }
      ]

      const mockParticipation = [
        {
          id: 'participant-1',
          market_id: 'market-1',
          user_id: 'user-123',
          prediction: 'Home',
          entry_amount: 0.1,
          potential_winnings: 0.2,
          actual_winnings: 0.2, // Won this market
          joined_at: '2024-01-01T01:00:00Z'
        },
        {
          id: 'participant-2',
          market_id: 'market-3',
          user_id: 'user-123',
          prediction: 'Away',
          entry_amount: 0.1,
          potential_winnings: 0.15,
          actual_winnings: null, // Active market
          joined_at: '2024-01-01T04:00:00Z'
        }
      ]

      vi.mocked(DatabaseService.getUserTransactions).mockResolvedValue(mockTransactions)
      vi.mocked(DatabaseService.getUserParticipation).mockResolvedValue(mockParticipation)

      const portfolio = await MarketService.getUserPortfolio('user-123')

      expect(portfolio).toEqual({
        totalWinnings: 0.25, // winnings (0.2) + creator_reward (0.05)
        totalSpent: 0.1, // market_entry (0.1)
        netProfitLoss: 0.15, // 0.25 - 0.1
        marketsParticipated: 2,
        marketsWon: 1,
        winRate: 50, // 1/2 * 100
        activeMarkets: 1
      })
    })
  })
})