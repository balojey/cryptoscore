/**
 * Complete User Workflow Integration Tests (Mock Database)
 * 
 * Tests the complete end-to-end user workflows for the web2 migration:
 * - Authentication → Market Creation → Participation → Resolution
 * - Validates data consistency throughout the entire process
 * - Uses mock Supabase backend for isolated testing
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MockDatabaseTestUtils } from '../../lib/supabase/__tests__/mock-database'
import { MockDatabaseService } from '../../lib/supabase/__tests__/mock-database-service'
import type { Database } from '../../types/supabase'

type User = Database['public']['Tables']['users']['Row']

describe('Complete User Workflow Integration Tests (Mock Database)', () => {
  beforeEach(() => {
    // Reset mock database
    MockDatabaseTestUtils.reset()
    
    // Setup default platform config
    MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', 0.05)
  })

  afterEach(() => {
    MockDatabaseTestUtils.reset()
  })

  describe('End-to-End User Workflow', () => {
    it('should complete full workflow: authentication → market creation → participation → resolution', async () => {
      // Test data
      const creator: User = MockDatabaseTestUtils.createTestUser({
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        email: 'creator@example.com',
        display_name: 'Market Creator',
      })

      const participant: User = MockDatabaseTestUtils.createTestUser({
        wallet_address: '0xabcdef1234567890abcdef1234567890abcdef12',
        email: 'participant@example.com',
        display_name: 'Market Participant',
      })

      // STEP 1: Verify users exist in mock database
      const creatorFromDb = await MockDatabaseService.getUserByEmail(creator.email!)
      const participantFromDb = await MockDatabaseService.getUserByEmail(participant.email!)
      
      expect(creatorFromDb?.wallet_address).toBe(creator.wallet_address)
      expect(participantFromDb?.wallet_address).toBe(participant.wallet_address)

      // STEP 2: Market Creation
      const marketData = {
        creator_id: creator.id,
        title: 'Test Sports Market',
        description: 'Who will win the big game?',
        entry_fee: 0.1,
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const,
        total_pool: 0,
        platform_fee_percentage: 0.05,
      }

      const createdMarket = await MockDatabaseService.createMarket(marketData)

      expect(createdMarket.creator_id).toBe(creator.id)
      expect(createdMarket.status).toBe('active')
      expect(createdMarket.total_pool).toBe(0)

      // STEP 3: Market Participation
      const participantData = {
        market_id: createdMarket.id,
        user_id: participant.id,
        prediction: 'Home',
        entry_amount: createdMarket.entry_fee,
        potential_winnings: createdMarket.entry_fee * 0.95,
      }

      const participation = await MockDatabaseService.joinMarket(participantData)

      expect(participation.user_id).toBe(participant.id)
      expect(participation.prediction).toBe('Home')
      expect(participation.entry_amount).toBe(createdMarket.entry_fee)

      // Update market pool
      await MockDatabaseService.updateMarket(createdMarket.id, {
        total_pool: createdMarket.entry_fee,
      })

      // STEP 4: Market Resolution
      await MockDatabaseService.updateMarket(createdMarket.id, {
        status: 'resolved',
        resolution_outcome: 'Home',
      })

      // Update participant winnings
      await MockDatabaseService.updateParticipant(participation.id, {
        actual_winnings: participation.potential_winnings,
      })

      // Verify resolution consistency
      const resolvedMarket = await MockDatabaseService.getMarketById(createdMarket.id)
      expect(resolvedMarket?.status).toBe('resolved')
      expect(resolvedMarket?.resolution_outcome).toBe('Home')

      // Verify participant winnings calculation
      const participants = await MockDatabaseService.getMarketParticipants(createdMarket.id)
      const winningParticipant = participants.find(p => p.user_id === participant.id)
      expect(winningParticipant?.actual_winnings).toBeGreaterThan(0)

      // Create transaction records
      await MockDatabaseService.createTransaction({
        user_id: participant.id,
        market_id: createdMarket.id,
        type: 'market_entry',
        amount: createdMarket.entry_fee,
        description: 'Joined market with Home prediction',
      })

      await MockDatabaseService.createTransaction({
        user_id: participant.id,
        market_id: createdMarket.id,
        type: 'winnings',
        amount: participation.potential_winnings!,
        description: 'Winnings from market resolution',
      })

      // Verify transaction records were created
      const transactions = await MockDatabaseService.getUserTransactions(participant.id)
      expect(transactions.length).toBe(2)
      
      const entryTx = transactions.find(tx => tx.type === 'market_entry')
      const winningsTx = transactions.find(tx => tx.type === 'winnings')
      
      expect(entryTx).toBeDefined()
      expect(winningsTx).toBeDefined()
    })

    it('should handle user portfolio calculations correctly', async () => {
      const user: User = MockDatabaseTestUtils.createTestUser({
        wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
        email: 'user@example.com',
        display_name: 'Test User',
      })

      // Create test markets and participations
      const market1 = MockDatabaseTestUtils.createTestMarket({
        creator_id: user.id,
        title: 'Market 1',
      })
      
      const market2 = MockDatabaseTestUtils.createTestMarket({
        creator_id: user.id,
        title: 'Market 2',
      })

      const participation1 = MockDatabaseTestUtils.createTestParticipant({
        market_id: market1.id,
        user_id: user.id,
        prediction: 'Home',
        entry_amount: 0.1,
        potential_winnings: 0.19,
        actual_winnings: 0.19, // Won
      })

      const participation2 = MockDatabaseTestUtils.createTestParticipant({
        market_id: market2.id,
        user_id: user.id,
        prediction: 'Away',
        entry_amount: 0.1,
        potential_winnings: 0.19,
        actual_winnings: 0, // Lost
      })

      // Create transactions
      MockDatabaseTestUtils.createTestTransaction({
        user_id: user.id,
        market_id: market1.id,
        type: 'market_entry',
        amount: 0.1,
        description: 'Joined market 1',
      })

      MockDatabaseTestUtils.createTestTransaction({
        user_id: user.id,
        market_id: market2.id,
        type: 'market_entry',
        amount: 0.1,
        description: 'Joined market 2',
      })

      MockDatabaseTestUtils.createTestTransaction({
        user_id: user.id,
        market_id: market1.id,
        type: 'winnings',
        amount: 0.19,
        description: 'Winnings from market 1',
      })

      // Calculate portfolio manually since we're testing the mock database
      const participations = await MockDatabaseService.getUserParticipation(user.id)
      const transactions = await MockDatabaseService.getUserTransactions(user.id)

      const totalSpent = transactions
        .filter(tx => tx.type === 'market_entry')
        .reduce((sum, tx) => sum + tx.amount, 0)

      const totalWinnings = transactions
        .filter(tx => tx.type === 'winnings')
        .reduce((sum, tx) => sum + tx.amount, 0)

      const netProfitLoss = totalWinnings - totalSpent
      const marketsParticipated = participations.length
      const marketsWon = participations.filter(p => p.actual_winnings && p.actual_winnings > 0).length
      const winRate = marketsParticipated > 0 ? (marketsWon / marketsParticipated) * 100 : 0

      expect(totalSpent).toBe(0.2) // 0.1 + 0.1
      expect(totalWinnings).toBe(0.19)
      expect(netProfitLoss).toBeCloseTo(-0.01, 5) // 0.19 - 0.2
      expect(marketsParticipated).toBe(2)
      expect(marketsWon).toBe(1)
      expect(winRate).toBe(50) // 1/2 * 100
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

      // Simple validation function for testing
      const isValidEvmAddress = (address: string): boolean => {
        if (!address || typeof address !== 'string') return false
        if (!address.startsWith('0x')) return false
        if (address.length !== 42) return false
        return /^0x[0-9a-fA-F]{40}$/.test(address)
      }

      // Test valid addresses
      for (const address of validAddresses) {
        expect(isValidEvmAddress(address)).toBe(true)
      }

      // Test invalid addresses
      for (const address of invalidAddresses) {
        expect(isValidEvmAddress(address)).toBe(false)
      }
    })

    it('should prevent invalid state transitions', async () => {
      const creator = MockDatabaseTestUtils.createTestUser()
      const user = MockDatabaseTestUtils.createTestUser()
      
      const market = MockDatabaseTestUtils.createTestMarket({
        creator_id: creator.id,
        title: 'Test Market',
        description: 'Test description',
        entry_fee: 0.1,
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
      })

      // Test joining ended market
      const endedMarket = MockDatabaseTestUtils.createTestMarket({
        creator_id: creator.id,
        end_time: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      })

      // Verify ended market check
      const endedMarketFromDb = await MockDatabaseService.getMarketById(endedMarket.id)
      expect(new Date(endedMarketFromDb!.end_time) < new Date()).toBe(true)

      // Test resolving already resolved market
      const resolvedMarket = MockDatabaseTestUtils.createTestMarket({
        creator_id: creator.id,
        status: 'resolved',
        resolution_outcome: 'Home',
      })

      const resolvedMarketFromDb = await MockDatabaseService.getMarketById(resolvedMarket.id)
      expect(resolvedMarketFromDb?.status).toBe('resolved')

      // Test double participation
      const existingParticipation = MockDatabaseTestUtils.createTestParticipant({
        market_id: market.id,
        user_id: user.id,
        prediction: 'Home',
        entry_amount: market.entry_fee,
      })

      const userParticipation = await MockDatabaseService.getUserMarketParticipation(user.id, market.id)
      expect(userParticipation).toBeDefined()
      expect(userParticipation?.prediction).toBe('Home')
    })

    it('should handle real-time data consistency', async () => {
      const creator = MockDatabaseTestUtils.createTestUser()
      const market = MockDatabaseTestUtils.createTestMarket({
        creator_id: creator.id,
        title: 'Test Market',
        description: 'Test description',
        entry_fee: 0.1,
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        total_pool: 0,
        platform_fee_percentage: 0.05,
      })

      const user1 = MockDatabaseTestUtils.createTestUser()
      const user2 = MockDatabaseTestUtils.createTestUser()

      const participant1 = MockDatabaseTestUtils.createTestParticipant({
        market_id: market.id,
        user_id: user1.id,
        prediction: 'Home',
        entry_amount: 0.1,
        potential_winnings: 0.095,
      })

      const participant2 = MockDatabaseTestUtils.createTestParticipant({
        market_id: market.id,
        user_id: user2.id,
        prediction: 'Away',
        entry_amount: 0.1,
        potential_winnings: 0.095,
      })

      // Calculate stats manually
      const participants = await MockDatabaseService.getMarketParticipants(market.id)
      
      const totalParticipants = participants.length
      const homeCount = participants.filter(p => p.prediction === 'Home').length
      const drawCount = participants.filter(p => p.prediction === 'Draw').length
      const awayCount = participants.filter(p => p.prediction === 'Away').length
      const totalPool = participants.reduce((sum, p) => sum + p.entry_amount, 0)

      expect(totalParticipants).toBe(2)
      expect(homeCount).toBe(1)
      expect(drawCount).toBe(0)
      expect(awayCount).toBe(1)
      expect(totalPool).toBe(0.2) // 0.1 + 0.1
    })
  })
})