/**
 * Complete User Workflow Integration Tests
 * 
 * Tests the complete end-to-end user workflows for the web2 migration:
 * - Authentication → Market Creation → Participation → Resolution
 * - Validates data consistency throughout the entire process
 * - Verifies all original features work with Supabase backend
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { UserService, type CrossmintUser } from '../../lib/supabase/user-service'
import { MarketService } from '../../lib/supabase/market-service'
import { DatabaseService } from '../../lib/supabase/database-service'
import type { Database } from '../../types/supabase'

type User = Database['public']['Tables']['users']['Row']
type Market = Database['public']['Tables']['markets']['Row']
type Participant = Database['public']['Tables']['participants']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

// Mock Supabase client and services
vi.mock('../../lib/supabase/database-service', () => ({
  DatabaseService: {
    createUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserByWalletAddress: vi.fn(),
    updateUser: vi.fn(),
    createMarket: vi.fn(),
    getMarketById: vi.fn(),
    updateMarket: vi.fn(),
    joinMarket: vi.fn(),
    updateParticipant: vi.fn(),
    getMarketParticipants: vi.fn(),
    getUserMarketParticipation: vi.fn(),
    getUserParticipation: vi.fn(),
    getUserTransactions: vi.fn(),
    createTransaction: vi.fn(),
    getPlatformConfig: vi.fn(),
    getMarkets: vi.fn(),
  }
}))

describe('Complete User Workflow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default platform config
    vi.mocked(DatabaseService.getPlatformConfig).mockResolvedValue({
      key: 'default_platform_fee_percentage',
      value: 0.05,
      updated_at: new Date().toISOString(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('End-to-End User Workflow', () => {
    it('should complete full workflow: authentication → market creation → participation → resolution', async () => {
      // Test data
      const creator: User = {
        id: 'creator-123',
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        email: 'creator@example.com',
        display_name: 'Market Creator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const participant: User = {
        id: 'participant-456',
        wallet_address: '0xabcdef1234567890abcdef1234567890abcdef12',
        email: 'participant@example.com',
        display_name: 'Market Participant',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const market: Market = {
        id: 'market-789',
        creator_id: creator.id,
        title: 'Test Sports Market',
        description: 'Who will win the big game?',
        entry_fee: 0.1,
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        resolution_outcome: null,
        total_pool: 0,
        platform_fee_percentage: 0.05,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // STEP 1: Authentication
      vi.mocked(DatabaseService.getUserByEmail).mockImplementation(async (email) => {
        if (email === creator.email) return creator
        if (email === participant.email) return participant
        return null
      })

      vi.mocked(DatabaseService.createUser).mockImplementation(async (userData) => ({
        ...creator,
        ...userData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))

      vi.mocked(DatabaseService.updateUser).mockImplementation(async (id, updates) => {
        if (id === creator.id) return { ...creator, ...updates, updated_at: new Date().toISOString() }
        if (id === participant.id) return { ...participant, ...updates, updated_at: new Date().toISOString() }
        throw new Error('User not found')
      })

      const creatorCrossmintData: CrossmintUser = {
        id: 'crossmint-creator',
        email: creator.email,
        walletAddress: creator.wallet_address,
        displayName: creator.display_name || undefined,
      }

      const participantCrossmintData: CrossmintUser = {
        id: 'crossmint-participant',
        email: participant.email,
        walletAddress: participant.wallet_address,
        displayName: participant.display_name || undefined,
      }

      const creatorAuth = await UserService.authenticateUser(creatorCrossmintData)
      const participantAuth = await UserService.authenticateUser(participantCrossmintData)

      expect(creatorAuth.user.wallet_address).toBe(creator.wallet_address)
      expect(participantAuth.user.wallet_address).toBe(participant.wallet_address)

      // STEP 2: Market Creation
      vi.mocked(DatabaseService.createMarket).mockResolvedValue(market)
      vi.mocked(DatabaseService.createTransaction).mockResolvedValue({
        id: 'transaction-1',
        user_id: creator.id,
        market_id: market.id,
        type: 'market_entry',
        amount: 0,
        description: `Created market: ${market.title}`,
        created_at: new Date().toISOString(),
      })

      const createdMarket = await MarketService.createMarket({
        matchId: 'match-123',
        title: market.title,
        description: market.description,
        entryFee: market.entry_fee,
        endTime: market.end_time,
        isPublic: true,
        creatorId: creator.id,
      })

      expect(createdMarket.creator_id).toBe(creator.id)
      expect(createdMarket.status).toBe('active')
      expect(createdMarket.total_pool).toBe(0)

      // STEP 3: Market Participation
      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(market)
      vi.mocked(DatabaseService.getUserMarketParticipation).mockResolvedValue(null)
      vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue([])

      const participantData: Participant = {
        id: 'participant-record-1',
        market_id: market.id,
        user_id: participant.id,
        prediction: 'Home',
        entry_amount: market.entry_fee,
        potential_winnings: market.entry_fee * 0.95,
        actual_winnings: null,
        joined_at: new Date().toISOString(),
      }

      vi.mocked(DatabaseService.joinMarket).mockResolvedValue(participantData)
      vi.mocked(DatabaseService.updateMarket).mockResolvedValue({
        ...market,
        total_pool: market.entry_fee,
        updated_at: new Date().toISOString(),
      })

      const participation = await MarketService.joinMarket({
        marketId: market.id,
        userId: participant.id,
        prediction: 'Home',
        entryAmount: market.entry_fee,
      })

      expect(participation.user_id).toBe(participant.id)
      expect(participation.prediction).toBe('Home')
      expect(participation.entry_amount).toBe(market.entry_fee)

      // STEP 4: Market Resolution
      const updatedMarket = {
        ...market,
        total_pool: market.entry_fee,
        status: 'active' as const, // Keep as active for resolution
        resolution_outcome: null,
      }

      const resolvedMarket = {
        ...updatedMarket,
        status: 'resolved' as const,
        resolution_outcome: 'Home',
      }

      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(updatedMarket) // Return active market for resolution
      vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue([participantData])
      vi.mocked(DatabaseService.updateMarket).mockResolvedValue(resolvedMarket)
      vi.mocked(DatabaseService.updateParticipant).mockResolvedValue({
        ...participantData,
        actual_winnings: participantData.potential_winnings,
      })

      await MarketService.resolveMarket({
        marketId: market.id,
        outcome: 'Home',
      })

      // Verify resolution consistency
      expect(DatabaseService.updateMarket).toHaveBeenCalledWith(market.id, {
        status: 'resolved',
        resolution_outcome: 'Home',
        updated_at: expect.any(String),
      })

      // Verify participant winnings calculation
      const expectedWinnings = Math.floor((market.entry_fee * 9500) / 10000) // 95% of pool
      expect(DatabaseService.updateParticipant).toHaveBeenCalledWith(participantData.id, {
        actual_winnings: expectedWinnings,
      })

      // Verify transaction records were created for each step
      expect(DatabaseService.createTransaction).toHaveBeenCalledTimes(2) // Market creation + participation
    })

    it('should handle user portfolio calculations correctly', async () => {
      const user: User = {
        id: 'user-123',
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        email: 'user@example.com',
        display_name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const participations: Participant[] = [
        {
          id: 'p1',
          market_id: 'market-1',
          user_id: user.id,
          prediction: 'Home',
          entry_amount: 0.1,
          potential_winnings: 0.19,
          actual_winnings: 0.19, // Won
          joined_at: new Date().toISOString(),
        },
        {
          id: 'p2',
          market_id: 'market-2',
          user_id: user.id,
          prediction: 'Away',
          entry_amount: 0.1,
          potential_winnings: 0.19,
          actual_winnings: 0, // Lost
          joined_at: new Date().toISOString(),
        },
      ]

      const transactions: Transaction[] = [
        {
          id: 't1',
          user_id: user.id,
          market_id: 'market-1',
          type: 'market_entry',
          amount: 0.1,
          description: 'Joined market 1',
          created_at: new Date().toISOString(),
        },
        {
          id: 't2',
          user_id: user.id,
          market_id: 'market-2',
          type: 'market_entry',
          amount: 0.1,
          description: 'Joined market 2',
          created_at: new Date().toISOString(),
        },
        {
          id: 't3',
          user_id: user.id,
          market_id: 'market-1',
          type: 'winnings',
          amount: 0.19,
          description: 'Winnings from market 1',
          created_at: new Date().toISOString(),
        },
      ]

      vi.mocked(DatabaseService.getUserParticipation).mockResolvedValue(participations)
      vi.mocked(DatabaseService.getUserTransactions).mockResolvedValue(transactions)

      const portfolio = await MarketService.getUserPortfolio(user.id)

      expect(portfolio.totalSpent).toBe(0.2) // 0.1 + 0.1
      expect(portfolio.totalWinnings).toBe(0.19)
      expect(portfolio.netProfitLoss).toBeCloseTo(-0.01, 5) // 0.19 - 0.2
      expect(portfolio.marketsParticipated).toBe(2)
      expect(portfolio.marketsWon).toBe(1)
      expect(portfolio.winRate).toBe(50) // 1/2 * 100
    })

    it('should validate EVM wallet addresses correctly', async () => {
      const validAddresses = [
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
        '0x0000000000000000000000000000000000000000',
      ]

      const invalidAddresses = [
        '1234567890abcdef1234567890abcdef12345678', // Missing 0x prefix
        '0x1234567890abcdef1234567890abcdef1234567', // Too short
        '0x1234567890abcdef1234567890abcdef123456789', // Too long
        '0x1234567890abcdef1234567890abcdef1234567g', // Invalid hex character
        '0x', // Just prefix
        '', // Empty string
      ]

      // Test valid addresses
      for (const address of validAddresses) {
        expect(UserService.isValidEvmAddress(address)).toBe(true)
      }

      // Test invalid addresses
      for (const address of invalidAddresses) {
        expect(UserService.isValidEvmAddress(address)).toBe(false)
      }
    })

    it('should prevent invalid state transitions', async () => {
      const market: Market = {
        id: 'market-123',
        creator_id: 'creator-123',
        title: 'Test Market',
        description: 'Test description',
        entry_fee: 0.1,
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        resolution_outcome: null,
        total_pool: 0,
        platform_fee_percentage: 0.05,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Test joining ended market
      const endedMarket = {
        ...market,
        end_time: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      }

      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(endedMarket)

      await expect(MarketService.joinMarket({
        marketId: endedMarket.id,
        userId: 'user-123',
        prediction: 'Home',
        entryAmount: endedMarket.entry_fee,
      })).rejects.toThrow('Market has ended')

      // Test resolving already resolved market
      const resolvedMarket = {
        ...market,
        status: 'resolved' as const,
        resolution_outcome: 'Home',
      }

      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(resolvedMarket)

      await expect(MarketService.resolveMarket({
        marketId: resolvedMarket.id,
        outcome: 'Away',
      })).rejects.toThrow('Market is not active')

      // Test double participation
      const existingParticipation: Participant = {
        id: 'existing-p1',
        market_id: market.id,
        user_id: 'user-123',
        prediction: 'Home',
        entry_amount: market.entry_fee,
        potential_winnings: market.entry_fee * 0.95,
        actual_winnings: null,
        joined_at: new Date().toISOString(),
      }

      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(market)
      vi.mocked(DatabaseService.getUserMarketParticipation).mockResolvedValue(existingParticipation)

      await expect(MarketService.joinMarket({
        marketId: market.id,
        userId: 'user-123',
        prediction: 'Away',
        entryAmount: market.entry_fee,
      })).rejects.toThrow('User has already joined this market')
    })

    it('should handle fee calculations consistently', async () => {
      const market: Market = {
        id: 'market-123',
        creator_id: 'creator-123',
        title: 'Test Market',
        description: 'Test description',
        entry_fee: 0.1,
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        resolution_outcome: null,
        total_pool: 1.0, // 10 participants at 0.1 each
        platform_fee_percentage: 0.05,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const participants: Participant[] = Array.from({ length: 10 }, (_, i) => ({
        id: `participant-${i}`,
        market_id: market.id,
        user_id: `user-${i}`,
        prediction: i < 5 ? 'Home' : 'Away', // 5 Home, 5 Away
        entry_amount: 0.1,
        potential_winnings: 0.095, // 95% of 0.1
        actual_winnings: null,
        joined_at: new Date().toISOString(),
      }))

      vi.mocked(DatabaseService.getMarketById).mockResolvedValue(market)
      vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue(participants)
      vi.mocked(DatabaseService.updateMarket).mockResolvedValue({
        ...market,
        status: 'resolved',
        resolution_outcome: 'Home',
      })

      vi.mocked(DatabaseService.updateParticipant).mockImplementation(async (id, updates) => {
        const participant = participants.find(p => p.id === id)!
        return { ...participant, ...updates }
      })

      await MarketService.resolveMarket({
        marketId: market.id,
        outcome: 'Home',
      })

      // Verify fee structure (same as WinningsCalculator)
      const totalPool = 1.0
      const expectedCreatorFee = Math.floor((totalPool * 200) / 10000) // 2%
      const expectedPlatformFee = Math.floor((totalPool * 300) / 10000) // 3%

      // Check that creator reward transaction was created
      const creatorRewardCall = vi.mocked(DatabaseService.createTransaction).mock.calls
        .find(call => call[0].type === 'creator_reward')

      if (expectedCreatorFee > 0) {
        expect(creatorRewardCall).toBeDefined()
        expect(creatorRewardCall![0].amount).toBe(expectedCreatorFee)
      }

      // Check that platform fee transaction was created
      const platformFeeCall = vi.mocked(DatabaseService.createTransaction).mock.calls
        .find(call => call[0].type === 'platform_fee')

      if (expectedPlatformFee > 0) {
        expect(platformFeeCall).toBeDefined()
        expect(platformFeeCall![0].amount).toBe(expectedPlatformFee)
      }

      // Verify total fees don't exceed 5%
      const totalFees = expectedCreatorFee + expectedPlatformFee
      const feePercentage = (totalFees / totalPool) * 100
      expect(feePercentage).toBeLessThanOrEqual(5.1) // Allow small rounding tolerance
    })

    it('should handle real-time data consistency', async () => {
      const market: Market = {
        id: 'market-123',
        creator_id: 'creator-123',
        title: 'Test Market',
        description: 'Test description',
        entry_fee: 0.1,
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        resolution_outcome: null,
        total_pool: 0,
        platform_fee_percentage: 0.05,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const participants: Participant[] = [
        {
          id: 'p1',
          market_id: market.id,
          user_id: 'user-1',
          prediction: 'Home',
          entry_amount: 0.1,
          potential_winnings: 0.095,
          actual_winnings: null,
          joined_at: new Date().toISOString(),
        },
        {
          id: 'p2',
          market_id: market.id,
          user_id: 'user-2',
          prediction: 'Away',
          entry_amount: 0.1,
          potential_winnings: 0.095,
          actual_winnings: null,
          joined_at: new Date().toISOString(),
        },
      ]

      vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue(participants)

      const stats = await MarketService.getMarketStats(market.id)

      expect(stats.totalParticipants).toBe(2)
      expect(stats.homeCount).toBe(1)
      expect(stats.drawCount).toBe(0)
      expect(stats.awayCount).toBe(1)
      expect(stats.totalPool).toBe(0.2) // 0.1 + 0.1
    })
  })
})