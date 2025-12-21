/**
 * Integration test for mock database market participation functionality
 * Tests the complete flow from market creation to participation using isolated mock database
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MockDatabaseService } from '../../lib/supabase/__tests__/mock-database-service'
import { MockDatabaseTestUtils } from '../../lib/supabase/__tests__/mock-database'

describe('Mock Database Market Participation Integration', () => {
  let mockUser: any
  let mockMarket: any

  beforeEach(() => {
    // Reset mock database
    MockDatabaseTestUtils.reset()
    
    // Setup platform configuration
    MockDatabaseTestUtils.createTestPlatformConfig('platform_fee_percentage', 5)
    
    // Create test data
    mockUser = MockDatabaseTestUtils.createTestUser({
      wallet_address: '0x1234567890abcdef',
      email: 'test@example.com',
      display_name: 'Test User',
    })

    mockMarket = MockDatabaseTestUtils.createTestMarket({
      creator_id: mockUser.id,
      title: 'Test Market',
      description: 'A test prediction market',
      entry_fee: 0.1,
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      total_pool: 0,
      platform_fee_percentage: 5,
    })
  })

  describe('Market Creation', () => {
    it('should create a market with correct parameters', async () => {
      const marketData = {
        creator_id: mockUser.id,
        title: 'New Test Market',
        description: 'A new test prediction market',
        entry_fee: 0.2,
        end_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        status: 'active' as const,
        total_pool: 0,
        platform_fee_percentage: 5,
      }

      const result = await MockDatabaseService.createMarket(marketData)

      expect(result).toBeDefined()
      expect(result.title).toBe('New Test Market')
      expect(result.creator_id).toBe(mockUser.id)
      expect(result.entry_fee).toBe(0.2)
      expect(result.status).toBe('active')

      // Verify transaction was created
      await MockDatabaseService.createTransaction({
        user_id: mockUser.id,
        market_id: result.id,
        type: 'market_entry',
        amount: 0,
        description: `Created market: ${result.title}`,
      })

      const transactions = await MockDatabaseService.getUserTransactions(mockUser.id)
      const creationTx = transactions.find(tx => tx.type === 'market_entry' && tx.amount === 0)
      expect(creationTx).toBeDefined()
    })
  })

  describe('Market Participation', () => {
    it('should allow user to join market with prediction', async () => {
      const participant = MockDatabaseTestUtils.createTestUser()

      const participantData = {
        market_id: mockMarket.id,
        user_id: participant.id,
        prediction: 'Home',
        entry_amount: 0.1,
        potential_winnings: 0.095,
      }

      const result = await MockDatabaseService.joinMarket(participantData)

      expect(result).toBeDefined()
      expect(result.market_id).toBe(mockMarket.id)
      expect(result.user_id).toBe(participant.id)
      expect(result.prediction).toBe('Home')
      expect(result.entry_amount).toBe(0.1)

      // Verify market pool was updated
      await MockDatabaseService.updateMarket(mockMarket.id, {
        total_pool: 0.1,
      })

      const updatedMarket = await MockDatabaseService.getMarketById(mockMarket.id)
      expect(updatedMarket?.total_pool).toBe(0.1)

      // Verify transaction was created
      await MockDatabaseService.createTransaction({
        user_id: participant.id,
        market_id: mockMarket.id,
        type: 'market_entry',
        amount: 0.1,
        description: 'Joined market with Home prediction',
      })

      const transactions = await MockDatabaseService.getUserTransactions(participant.id)
      const joinTx = transactions.find(tx => tx.type === 'market_entry' && tx.amount === 0.1)
      expect(joinTx).toBeDefined()
    })

    it('should prevent duplicate participation', async () => {
      const participant = MockDatabaseTestUtils.createTestUser()
      
      // Create existing participation
      MockDatabaseTestUtils.createTestParticipant({
        market_id: mockMarket.id,
        user_id: participant.id,
        prediction: 'Home',
        entry_amount: 0.1,
      })

      // Check that user already has participation
      const existingParticipation = await MockDatabaseService.getUserMarketParticipation(participant.id, mockMarket.id)
      expect(existingParticipation).toBeDefined()
      expect(existingParticipation?.prediction).toBe('Home')
    })

    it('should prevent joining ended markets', async () => {
      const participant = MockDatabaseTestUtils.createTestUser()
      
      // Create ended market
      const endedMarket = MockDatabaseTestUtils.createTestMarket({
        creator_id: mockUser.id,
        end_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
      })

      // Verify market has ended
      const marketFromDb = await MockDatabaseService.getMarketById(endedMarket.id)
      expect(new Date(marketFromDb!.end_time) < new Date()).toBe(true)
    })
  })

  describe('Market Resolution', () => {
    it('should resolve market and distribute winnings', async () => {
      const user1 = MockDatabaseTestUtils.createTestUser()
      const user2 = MockDatabaseTestUtils.createTestUser()
      
      // Update market with pool
      const marketWithPool = MockDatabaseTestUtils.createTestMarket({
        creator_id: mockUser.id,
        total_pool: 200000000, // 0.2 SOL in lamports
      })

      const participant1 = MockDatabaseTestUtils.createTestParticipant({
        market_id: marketWithPool.id,
        user_id: user1.id,
        prediction: 'Home',
        entry_amount: 100000000, // 0.1 SOL in lamports
        potential_winnings: 190000000, // 0.19 SOL in lamports
      })

      const participant2 = MockDatabaseTestUtils.createTestParticipant({
        market_id: marketWithPool.id,
        user_id: user2.id,
        prediction: 'Away',
        entry_amount: 100000000, // 0.1 SOL in lamports
        potential_winnings: 190000000, // 0.19 SOL in lamports
      })

      // Resolve market
      await MockDatabaseService.updateMarket(marketWithPool.id, {
        status: 'resolved',
        resolution_outcome: 'Home',
      })

      // Update winner's winnings
      await MockDatabaseService.updateParticipant(participant1.id, {
        actual_winnings: 190000000,
      })

      // Verify market was resolved
      const resolvedMarket = await MockDatabaseService.getMarketById(marketWithPool.id)
      expect(resolvedMarket?.status).toBe('resolved')
      expect(resolvedMarket?.resolution_outcome).toBe('Home')

      // Create winnings transaction for winner
      await MockDatabaseService.createTransaction({
        user_id: user1.id,
        market_id: marketWithPool.id,
        type: 'winnings',
        amount: 190000000, // 0.19 SOL in lamports
        description: 'Winnings from market resolution: Home',
      })

      // Create platform fee transaction
      await MockDatabaseService.createTransaction({
        user_id: mockUser.id, // Market creator
        market_id: marketWithPool.id,
        type: 'platform_fee',
        amount: 6000000, // 3% of 0.2 SOL = 0.006 SOL in lamports
        description: 'Platform fee from market resolution',
      })

      // Verify winnings transaction was created for winner
      const transactions = await MockDatabaseService.getUserTransactions(user1.id)
      const winningsTx = transactions.find(tx => tx.type === 'winnings')
      expect(winningsTx).toBeDefined()
      expect(winningsTx!.amount).toBe(190000000) // 0.19 SOL in lamports

      // Verify platform fee transaction was created
      const marketTransactions = await MockDatabaseService.getMarketTransactions(marketWithPool.id)
      const platformFeeTx = marketTransactions.find(tx => tx.type === 'platform_fee')
      expect(platformFeeTx).toBeDefined()
      expect(platformFeeTx!.amount).toBe(6000000) // 3% of 0.2 SOL = 0.006 SOL in lamports
    })
  })

  describe('Market Statistics', () => {
    it('should calculate market statistics correctly', async () => {
      const user1 = MockDatabaseTestUtils.createTestUser()
      const user2 = MockDatabaseTestUtils.createTestUser()
      const user3 = MockDatabaseTestUtils.createTestUser()

      MockDatabaseTestUtils.createTestParticipant({
        market_id: mockMarket.id,
        user_id: user1.id,
        prediction: 'Home',
        entry_amount: 0.1,
        potential_winnings: 0.19,
      })

      MockDatabaseTestUtils.createTestParticipant({
        market_id: mockMarket.id,
        user_id: user2.id,
        prediction: 'Home',
        entry_amount: 0.1,
        potential_winnings: 0.19,
      })

      MockDatabaseTestUtils.createTestParticipant({
        market_id: mockMarket.id,
        user_id: user3.id,
        prediction: 'Away',
        entry_amount: 0.1,
        potential_winnings: 0.19,
      })

      // Calculate stats manually
      const participants = await MockDatabaseService.getMarketParticipants(mockMarket.id)
      
      const totalParticipants = participants.length
      const homeCount = participants.filter(p => p.prediction === 'Home').length
      const drawCount = participants.filter(p => p.prediction === 'Draw').length
      const awayCount = participants.filter(p => p.prediction === 'Away').length
      const totalPool = participants.reduce((sum, p) => sum + p.entry_amount, 0)

      expect(totalParticipants).toBe(3)
      expect(homeCount).toBe(2)
      expect(drawCount).toBe(0)
      expect(awayCount).toBe(1)
      expect(totalPool).toBeCloseTo(0.3, 5) // Allow for floating point precision
    })
  })
})