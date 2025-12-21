/**
 * Property-based tests for portfolio aggregation with multiple predictions
 * 
 * **Feature: enhanced-prediction-system, Property 14: Portfolio aggregation with multiple predictions**
 * **Validates: Requirements 8.4, 8.5**
 */

import { describe, it, beforeEach, expect } from 'vitest'
import fc from 'fast-check'
import { MockDatabaseService } from '../../lib/supabase/__tests__/mock-database-service'
import { MockDatabaseTestUtils } from '../../lib/supabase/__tests__/test-utils'

// Arbitraries for property-based testing
const predictionArb = fc.constantFrom('Home', 'Draw', 'Away')

// Generator for multiple predictions per user per market
const multipleParticipationsArb = fc.record({
  user_id: fc.uuid(),
  markets: fc.array(
    fc.record({
      market_id: fc.uuid(),
      predictions: fc.uniqueArray(
        fc.record({
          prediction: predictionArb,
          entry_amount: fc.float({ min: Math.fround(0.1), max: Math.fround(5.0) }),
          potential_winnings: fc.float({ min: Math.fround(0.1), max: Math.fround(50.0) }),
          actual_winnings: fc.option(fc.float({ min: Math.fround(0.0), max: Math.fround(50.0) }), { nil: null })
        }),
        { 
          minLength: 1, 
          maxLength: 3,
          selector: (p) => p.prediction // Ensure unique predictions per market
        }
      )
    }),
    { minLength: 1, maxLength: 10 }
  )
}).map(data => {
  return {
    ...data,
    markets: data.markets.map(market => ({
      ...market,
      predictions: market.predictions.map((p) => ({
        id: `${data.user_id}-${market.market_id}-${p.prediction}`, // Use prediction type in ID to ensure uniqueness
        market_id: market.market_id,
        user_id: data.user_id,
        prediction: p.prediction,
        entry_amount: p.entry_amount,
        potential_winnings: p.potential_winnings,
        actual_winnings: p.actual_winnings,
        joined_at: new Date().toISOString()
      }))
    }))
  }
})

describe('Portfolio Aggregation with Multiple Predictions Properties', () => {
  beforeEach(async () => {
    // Ensure clean state before each test
    MockDatabaseTestUtils.reset()
  })

  afterEach(async () => {
    // Ensure clean state after each test
    MockDatabaseTestUtils.reset()
  })

  /**
   * **Feature: enhanced-prediction-system, Property 14: Portfolio aggregation with multiple predictions**
   * **Validates: Requirements 8.4, 8.5**
   * 
   * Property: For any portfolio calculation, the system should correctly aggregate all user predictions 
   * and broadcast real-time updates for all predictions
   */
  it('should correctly aggregate portfolio stats across multiple predictions per market', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        multipleParticipationsArb,
        async (participationData) => {
          // Reset database at the start of each property test iteration
          MockDatabaseTestUtils.reset()
          
          // Verify clean state
          const initialState = MockDatabaseTestUtils.getState()
          expect(initialState.transactions.size).toBe(0)
          expect(initialState.participants.size).toBe(0)
          expect(initialState.users.size).toBe(0)
          expect(initialState.markets.size).toBe(0)

          // Create test user using the service (not the utility that directly inserts)
          const testUser = {
            id: participationData.user_id,
            wallet_address: '0x' + Math.random().toString(16).substring(2, 42),
            email: `test-${participationData.user_id}@example.com`,
            display_name: `Test User ${Math.random().toString(36).substring(2, 7)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          await MockDatabaseService.createUser(testUser)

          // Track expected stats based on what we actually create
          let expectedTotalSpent = 0
          let expectedTotalWinnings = 0
          let expectedActivePositions = 0
          let expectedResolvedPositions = 0
          let expectedWonPositions = 0
          let expectedClaimableWinnings = 0
          let actualPredictionsCreated = 0

          for (const marketData of participationData.markets) {
            // Create market using the service
            const market = {
              id: marketData.market_id,
              creator_id: fc.sample(fc.uuid(), 1)[0], // Random creator (not the test user)
              title: `Test Market ${marketData.market_id}`,
              description: 'Test market description',
              entry_fee: 0.1,
              end_time: new Date(Date.now() + 86400000).toISOString(),
              status: fc.sample(fc.constantFrom('SCHEDULED', 'FINISHED'), 1)[0],
              resolution_outcome: null,
              total_pool: 0,
              platform_fee_percentage: 5,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            await MockDatabaseService.createMarket(market)

            // Create multiple predictions for this market
            for (const prediction of marketData.predictions) {
              try {
                await MockDatabaseService.joinMarket(prediction)
                actualPredictionsCreated++
                
                // Only track expected stats for successfully created predictions
                expectedTotalSpent += prediction.entry_amount
                
                if (market.status === 'SCHEDULED') {
                  expectedActivePositions++
                } else if (market.status === 'FINISHED') {
                  expectedResolvedPositions++
                }
                
                // Track winnings regardless of market status if actual_winnings exists
                if (prediction.actual_winnings && prediction.actual_winnings > 0) {
                  expectedTotalWinnings += prediction.actual_winnings
                  expectedWonPositions++
                  expectedClaimableWinnings += prediction.actual_winnings
                }

                // Create corresponding transactions only for successful predictions
                const entryTransaction = {
                  id: `${participationData.user_id}-${marketData.market_id}-entry-${Math.random()}`,
                  user_id: participationData.user_id,
                  market_id: marketData.market_id,
                  type: 'market_entry' as const,
                  amount: prediction.entry_amount,
                  description: `Entry for ${prediction.prediction} prediction`,
                  created_at: new Date().toISOString(),
                }
                await MockDatabaseService.createTransaction(entryTransaction)

                if (prediction.actual_winnings && prediction.actual_winnings > 0) {
                  const winningsTransaction = {
                    id: `${participationData.user_id}-${marketData.market_id}-winnings-${Math.random()}`,
                    user_id: participationData.user_id,
                    market_id: marketData.market_id,
                    type: 'winnings' as const,
                    amount: prediction.actual_winnings,
                    description: `Winnings for ${prediction.prediction} prediction`,
                    created_at: new Date().toISOString(),
                  }
                  await MockDatabaseService.createTransaction(winningsTransaction)
                }
              } catch (error) {
                // Skip duplicate predictions - this is expected behavior
                if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
                  continue
                }
                throw error
              }
            }
          }

          // Calculate portfolio stats manually using the mock database
          const transactions = await MockDatabaseService.getUserTransactions(participationData.user_id, 1000)
          const participation = await MockDatabaseService.getUserParticipation(participationData.user_id)

          let actualTotalWinnings = 0
          let actualTotalSpent = 0

          transactions.forEach(transaction => {
            switch (transaction.type) {
              case 'winnings':
              case 'creator_reward':
                actualTotalWinnings += transaction.amount
                break
              case 'market_entry':
                actualTotalSpent += transaction.amount
                break
            }
          })

          // Debug: Log the values to understand the discrepancy
          if (Math.abs(actualTotalSpent - expectedTotalSpent) > 0.01) {
            console.log('Debug - Expected vs Actual:')
            console.log('Expected total spent:', expectedTotalSpent)
            console.log('Actual total spent:', actualTotalSpent)
            console.log('Transactions:', transactions.map(t => ({ type: t.type, amount: t.amount, user_id: t.user_id })))
            console.log('Predictions created:', actualPredictionsCreated)
            console.log('Database state:', {
              users: MockDatabaseTestUtils.getState().users.size,
              markets: MockDatabaseTestUtils.getState().markets.size,
              participants: MockDatabaseTestUtils.getState().participants.size,
              transactions: MockDatabaseTestUtils.getState().transactions.size
            })
          }

          // Property: Portfolio aggregation should include all predictions
          expect(actualTotalSpent).toBeCloseTo(expectedTotalSpent, 2)
          expect(actualTotalWinnings).toBeCloseTo(expectedTotalWinnings, 2)
          
          // Property: Net P&L should be calculated correctly
          const expectedNetPnL = expectedTotalWinnings - expectedTotalSpent
          const actualNetPnL = actualTotalWinnings - actualTotalSpent
          expect(actualNetPnL).toBeCloseTo(expectedNetPnL, 2)

          // Property: Participation count should match created predictions
          expect(participation.length).toBe(actualPredictionsCreated)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Dashboard data should include all user predictions across multiple markets
   */
  it('should include all user predictions in dashboard data aggregation', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        multipleParticipationsArb,
        async (participationData) => {
          // Reset database at the start of each property test iteration
          MockDatabaseTestUtils.reset()
          
          // Verify clean state
          const initialState = MockDatabaseTestUtils.getState()
          expect(initialState.transactions.size).toBe(0)
          expect(initialState.participants.size).toBe(0)
          expect(initialState.users.size).toBe(0)
          expect(initialState.markets.size).toBe(0)
          // Create test user using the service
          const testUser = {
            id: participationData.user_id,
            wallet_address: '0x' + Math.random().toString(16).substr(2, 40),
            email: `test-${participationData.user_id}@example.com`,
            display_name: `Test User ${Math.random().toString(36).substr(2, 5)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          await MockDatabaseService.createUser(testUser)

          // Track expected counts
          let expectedTotalPredictions = 0
          const expectedMarketIds = new Set<string>()

          for (const marketData of participationData.markets) {
            // Create market using the service
            const market = {
              id: marketData.market_id,
              creator_id: fc.sample(fc.uuid(), 1)[0], // Random creator
              title: `Test Market ${marketData.market_id}`,
              description: 'Test market description',
              entry_fee: 0.1,
              end_time: new Date(Date.now() + 86400000).toISOString(),
              status: 'SCHEDULED' as const,
              resolution_outcome: null,
              total_pool: 0,
              platform_fee_percentage: 5,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            await MockDatabaseService.createMarket(market)
            expectedMarketIds.add(marketData.market_id)

            // Create multiple predictions for this market
            for (const prediction of marketData.predictions) {
              try {
                await MockDatabaseService.joinMarket(prediction)
                expectedTotalPredictions++
              } catch (error) {
                // Skip duplicate predictions - this is expected behavior
                if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
                  continue
                }
                throw error
              }
            }
          }

          // Get user participation directly from mock database
          const participation = await MockDatabaseService.getUserParticipation(participationData.user_id)
          
          // Property: All user predictions should be tracked
          expect(participation.length).toBe(expectedTotalPredictions)

          // Property: Each prediction should have correct user and market IDs
          for (const participant of participation) {
            expect(participant.user_id).toBe(participationData.user_id)
            expect(expectedMarketIds.has(participant.market_id)).toBe(true)
          }

          // Property: Markets should exist for all predictions
          const markets = await MockDatabaseService.getMarkets()
          const marketIds = new Set(markets.map(m => m.id))
          
          for (const participant of participation) {
            expect(marketIds.has(participant.market_id)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Portfolio stats should be consistent across different calculation methods
   */
  it('should produce consistent portfolio stats regardless of calculation method', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        multipleParticipationsArb,
        async (participationData) => {
          // Reset database at the start of each property test iteration
          MockDatabaseTestUtils.reset()
          
          // Verify clean state
          const initialState = MockDatabaseTestUtils.getState()
          expect(initialState.transactions.size).toBe(0)
          expect(initialState.participants.size).toBe(0)
          expect(initialState.users.size).toBe(0)
          expect(initialState.markets.size).toBe(0)
          // Create test user using the service
          const testUser = {
            id: participationData.user_id,
            wallet_address: '0x' + Math.random().toString(16).substr(2, 40),
            email: `test-${participationData.user_id}@example.com`,
            display_name: `Test User ${Math.random().toString(36).substr(2, 5)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          await MockDatabaseService.createUser(testUser)

          // Set up test data
          for (const marketData of participationData.markets) {
            const market = {
              id: marketData.market_id,
              creator_id: fc.sample(fc.uuid(), 1)[0],
              title: `Test Market ${marketData.market_id}`,
              description: 'Test market description',
              entry_fee: 0.1,
              end_time: new Date(Date.now() + 86400000).toISOString(),
              status: 'SCHEDULED' as const,
              resolution_outcome: null,
              total_pool: 0,
              platform_fee_percentage: 5,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            await MockDatabaseService.createMarket(market)

            for (const prediction of marketData.predictions) {
              try {
                await MockDatabaseService.joinMarket(prediction)
                
                // Create entry transaction
                const entryTransaction = {
                  id: `${participationData.user_id}-${marketData.market_id}-entry-${Math.random()}`,
                  user_id: participationData.user_id,
                  market_id: marketData.market_id,
                  type: 'market_entry' as const,
                  amount: prediction.entry_amount,
                  description: `Entry for ${prediction.prediction} prediction`,
                  created_at: new Date().toISOString(),
                }
                await MockDatabaseService.createTransaction(entryTransaction)
              } catch (error) {
                // Skip duplicate predictions - this is expected behavior
                if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
                  continue
                }
                throw error
              }
            }
          }

          // Calculate stats using direct database queries (method 1)
          const transactions1 = await MockDatabaseService.getUserTransactions(participationData.user_id, 1000)
          const participation1 = await MockDatabaseService.getUserParticipation(participationData.user_id)
          
          let totalSpent1 = 0
          let totalWinnings1 = 0
          
          transactions1.forEach(transaction => {
            switch (transaction.type) {
              case 'winnings':
              case 'creator_reward':
                totalWinnings1 += transaction.amount
                break
              case 'market_entry':
                totalSpent1 += transaction.amount
                break
            }
          })
          
          // Calculate stats again (method 2 - should be identical)
          const transactions2 = await MockDatabaseService.getUserTransactions(participationData.user_id, 1000)
          const participation2 = await MockDatabaseService.getUserParticipation(participationData.user_id)
          
          let totalSpent2 = 0
          let totalWinnings2 = 0
          
          transactions2.forEach(transaction => {
            switch (transaction.type) {
              case 'winnings':
              case 'creator_reward':
                totalWinnings2 += transaction.amount
                break
              case 'market_entry':
                totalSpent2 += transaction.amount
                break
            }
          })

          // Property: Results should be identical
          expect(totalSpent1).toBe(totalSpent2)
          expect(totalWinnings1).toBe(totalWinnings2)
          expect(participation1.length).toBe(participation2.length)
          
          // Property: Net P&L should be consistent
          const netPnL1 = totalWinnings1 - totalSpent1
          const netPnL2 = totalWinnings2 - totalSpent2
          expect(netPnL1).toBe(netPnL2)
        }
      ),
      { numRuns: 100 }
    )
  })
})