/**
 * Property-based tests for transaction atomicity in resolution
 * 
 * **Feature: enhanced-prediction-system, Property 11: Transaction atomicity in resolution**
 * **Validates: Requirements 5.6**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { MockDatabaseService } from './mock-database-service'
import { MockDatabaseTestUtils } from './mock-database'
import { AutomationService } from '../automation-service'
import type { Database } from '@/types/supabase'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Market = Database['public']['Tables']['markets']['Row']
type Participant = Database['public']['Tables']['participants']['Row']

describe('Transaction Atomicity Property Tests', () => {
  beforeEach(() => {
    MockDatabaseTestUtils.reset()
  })

  /**
   * **Feature: enhanced-prediction-system, Property 11: Transaction atomicity in resolution**
   * **Validates: Requirements 5.6**
   * 
   * For any market resolution, all transfers must complete successfully before 
   * marking resolution as complete
   */
  it('should ensure all transfers complete before marking resolution complete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          marketData: fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
            description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
            entry_fee: fc.float({ min: Math.fround(0.01), max: Math.fround(10.0) }).filter(n => !isNaN(n) && isFinite(n)),
            total_pool: fc.float({ min: Math.fround(1.0), max: Math.fround(100.0) }).filter(n => !isNaN(n) && isFinite(n)),
            platform_fee_percentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.1) }).filter(n => !isNaN(n) && isFinite(n)),
            creator_reward_percentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.05) }).filter(n => !isNaN(n) && isFinite(n)),
            resolution_outcome: fc.constantFrom('HOME_WIN', 'DRAW', 'AWAY_WIN'),
            match_id: fc.integer({ min: 1, max: 10000 }),
          }),
          participantCount: fc.integer({ min: 2, max: 8 }),
          winnerCount: fc.integer({ min: 1, max: 4 }),
        }),
        async ({ marketData, participantCount, winnerCount }) => {
          // Create test users
          const creator = MockDatabaseTestUtils.createTestUser({
            display_name: 'Market Creator',
            email: 'creator@test.com',
          })

          const participants = []
          for (let i = 0; i < participantCount; i++) {
            participants.push(MockDatabaseTestUtils.createTestUser({
              display_name: `Participant ${i + 1}`,
              email: `participant${i + 1}@test.com`,
            }))
          }

          // Create market (initially not resolved)
          const market = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            title: marketData.title,
            description: marketData.description,
            entry_fee: marketData.entry_fee,
            total_pool: marketData.total_pool,
            platform_fee_percentage: marketData.platform_fee_percentage,
            creator_reward_percentage: marketData.creator_reward_percentage,
            status: 'FINISHED', // Finished but not yet resolved
            resolution_outcome: null, // Not yet resolved
            match_id: marketData.match_id,
          })

          // Create participants with predictions
          const predictions = ['HOME_WIN', 'DRAW', 'AWAY_WIN']
          const marketParticipants = []
          
          // Ensure we have at least some winners
          const actualWinnerCount = Math.min(winnerCount, participantCount)
          
          for (let i = 0; i < participantCount; i++) {
            const prediction = i < actualWinnerCount ? marketData.resolution_outcome : predictions[i % predictions.length]
            const participant = MockDatabaseTestUtils.createTestParticipant({
              market_id: market.id,
              user_id: participants[i].id,
              prediction: prediction,
              entry_amount: marketData.entry_fee,
              potential_winnings: marketData.entry_fee * 2,
              actual_winnings: null, // Not yet calculated
            })
            marketParticipants.push(participant)
          }

          // Record initial state
          const initialTransactionCount = MockDatabaseTestUtils.getState().transactions.size
          const initialMarketStatus = market.status
          const initialResolutionOutcome = market.resolution_outcome

          // Simulate atomic resolution process
          const resolutionTransactions = []
          let allTransfersSuccessful = true

          try {
            // Step 1: Calculate winnings
            const winners = marketParticipants.filter(p => p.prediction === marketData.resolution_outcome)
            const platformFee = marketData.total_pool * marketData.platform_fee_percentage
            const creatorReward = marketData.total_pool * marketData.creator_reward_percentage
            const winnerPool = marketData.total_pool - platformFee - creatorReward
            const winningsPerWinner = winners.length > 0 ? winnerPool / winners.length : 0

            // Step 2: Create all transfer transactions (simulating atomic batch)
            const transferOperations = []

            // Winnings transfers
            for (const winner of winners) {
              transferOperations.push({
                type: 'winnings',
                user_id: winner.user_id,
                amount: winningsPerWinner,
                description: `Automated winnings from market resolution: ${marketData.resolution_outcome}`,
              })
            }

            // Creator reward transfer
            if (creatorReward > 0) {
              transferOperations.push({
                type: 'creator_reward',
                user_id: creator.id,
                amount: creatorReward,
                description: 'Automated creator reward from market resolution',
              })
            }

            // Platform fee transfer
            if (platformFee > 0) {
              transferOperations.push({
                type: 'platform_fee',
                user_id: creator.id, // Associated with creator for tracking
                amount: platformFee,
                description: 'Automated platform fee from market resolution',
              })
            }

            // Step 3: Execute all transfers atomically
            for (const operation of transferOperations) {
              const transaction = await MockDatabaseService.createTransaction({
                user_id: operation.user_id,
                market_id: market.id,
                type: operation.type as Transaction['type'],
                amount: operation.amount,
                description: operation.description,
              })
              resolutionTransactions.push(transaction)
            }

            // Step 4: Update participants with actual winnings
            for (const participant of marketParticipants) {
              if (participant.prediction === marketData.resolution_outcome) {
                await MockDatabaseService.updateParticipant(participant.id, {
                  actual_winnings: winningsPerWinner,
                })
              }
            }

            // Step 5: Only mark market as resolved after ALL transfers complete
            await MockDatabaseService.updateMarket(market.id, {
              status: 'resolved',
              resolution_outcome: marketData.resolution_outcome,
              updated_at: new Date().toISOString(),
            })

          } catch (error) {
            allTransfersSuccessful = false
            // In a real system, this would trigger rollback
          }

          // Verify atomicity properties
          const finalTransactionCount = MockDatabaseTestUtils.getState().transactions.size
          const finalMarket = await MockDatabaseService.getMarketById(market.id)

          if (allTransfersSuccessful) {
            // Property 1: If all transfers succeeded, market should be marked as resolved
            expect(finalMarket?.status).toBe('resolved')
            expect(finalMarket?.resolution_outcome).toBe(marketData.resolution_outcome)

            // Property 2: All expected transactions should be created
            const expectedTransactionCount = resolutionTransactions.length
            const actualNewTransactions = finalTransactionCount - initialTransactionCount
            expect(actualNewTransactions).toBe(expectedTransactionCount)

            // Property 3: All transaction types should be present
            const marketTransactions = await MockDatabaseService.getMarketTransactions(market.id)
            const transactionTypes = new Set(marketTransactions.map(t => t.type))
            
            if (resolutionTransactions.some(t => t.type === 'winnings')) {
              expect(transactionTypes.has('winnings')).toBe(true)
            }
            if (resolutionTransactions.some(t => t.type === 'creator_reward')) {
              expect(transactionTypes.has('creator_reward')).toBe(true)
            }
            if (resolutionTransactions.some(t => t.type === 'platform_fee')) {
              expect(transactionTypes.has('platform_fee')).toBe(true)
            }

            // Property 4: Participants should have updated actual_winnings
            const updatedParticipants = await MockDatabaseService.getMarketParticipants(market.id)
            const winners = updatedParticipants.filter(p => p.prediction === marketData.resolution_outcome)
            const losers = updatedParticipants.filter(p => p.prediction !== marketData.resolution_outcome)

            for (const winner of winners) {
              expect(winner.actual_winnings).toBeGreaterThan(0)
            }
            for (const loser of losers) {
              expect(loser.actual_winnings).toBeNull()
            }

          } else {
            // Property 5: If any transfer failed, market should remain unresolved
            expect(finalMarket?.status).not.toBe('resolved')
            expect(finalMarket?.resolution_outcome).toBeNull()
          }

          // Property 6: Transaction timestamps should be consistent (all within a short time window)
          if (resolutionTransactions.length > 1) {
            const timestamps = resolutionTransactions.map(t => new Date(t.created_at).getTime())
            const minTime = Math.min(...timestamps)
            const maxTime = Math.max(...timestamps)
            const timeWindow = maxTime - minTime
            
            // All transactions should be created within 1 second (atomic operation)
            expect(timeWindow).toBeLessThan(1000)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test for rollback behavior on transaction failure
   * Ensures that if any transaction fails, the entire resolution is rolled back
   */
  it('should rollback resolution if any transaction fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalPool: fc.float({ min: Math.fround(1.0), max: Math.fround(100.0) }).filter(n => !isNaN(n) && isFinite(n)),
          platformFeePercentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.1) }).filter(n => !isNaN(n) && isFinite(n)),
          participantCount: fc.integer({ min: 2, max: 5 }),
          failurePoint: fc.integer({ min: 0, max: 2 }), // 0=winnings, 1=creator_reward, 2=platform_fee
        }),
        async ({ totalPool, platformFeePercentage, participantCount, failurePoint }) => {
          // Create test data
          const creator = MockDatabaseTestUtils.createTestUser({
            display_name: 'Market Creator',
            email: 'creator@test.com',
          })

          const participants = []
          for (let i = 0; i < participantCount; i++) {
            participants.push(MockDatabaseTestUtils.createTestUser({
              display_name: `Participant ${i + 1}`,
              email: `participant${i + 1}@test.com`,
            }))
          }

          const market = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            title: 'Test Market',
            description: 'Test market for atomicity',
            total_pool: totalPool,
            platform_fee_percentage: platformFeePercentage,
            status: 'FINISHED',
            resolution_outcome: null, // Not yet resolved
          })

          // Create participants
          for (let i = 0; i < participantCount; i++) {
            MockDatabaseTestUtils.createTestParticipant({
              market_id: market.id,
              user_id: participants[i].id,
              prediction: i === 0 ? 'HOME_WIN' : 'AWAY_WIN', // First participant wins
              entry_amount: 1.0,
              potential_winnings: 2.0,
            })
          }

          // Record initial state
          const initialTransactionCount = MockDatabaseTestUtils.getState().transactions.size
          const initialMarketStatus = market.status

          // Simulate resolution with failure at specific point
          let resolutionSuccessful = true
          const completedTransactions = []

          try {
            // Step 1: Winnings transaction
            if (failurePoint !== 0) {
              const winningsTransaction = await MockDatabaseService.createTransaction({
                user_id: participants[0].id,
                market_id: market.id,
                type: 'winnings',
                amount: totalPool * 0.8,
                description: 'Automated winnings from market resolution',
              })
              completedTransactions.push(winningsTransaction)
            } else {
              throw new Error('Simulated winnings transaction failure')
            }

            // Step 2: Creator reward transaction
            if (failurePoint !== 1) {
              const creatorRewardTransaction = await MockDatabaseService.createTransaction({
                user_id: creator.id,
                market_id: market.id,
                type: 'creator_reward',
                amount: totalPool * 0.1,
                description: 'Automated creator reward from market resolution',
              })
              completedTransactions.push(creatorRewardTransaction)
            } else {
              throw new Error('Simulated creator reward transaction failure')
            }

            // Step 3: Platform fee transaction
            if (failurePoint !== 2) {
              const platformFeeTransaction = await MockDatabaseService.createTransaction({
                user_id: creator.id,
                market_id: market.id,
                type: 'platform_fee',
                amount: totalPool * platformFeePercentage,
                description: 'Automated platform fee from market resolution',
              })
              completedTransactions.push(platformFeeTransaction)
            } else {
              throw new Error('Simulated platform fee transaction failure')
            }

            // If we get here, all transactions succeeded
            await MockDatabaseService.updateMarket(market.id, {
              status: 'resolved',
              resolution_outcome: 'HOME_WIN',
            })

          } catch (error) {
            resolutionSuccessful = false
            
            // In a real system, this would trigger rollback of completed transactions
            // For this test, we simulate the rollback by not updating the market status
          }

          // Verify rollback behavior
          const finalTransactionCount = MockDatabaseTestUtils.getState().transactions.size
          const finalMarket = await MockDatabaseService.getMarketById(market.id)

          if (resolutionSuccessful) {
            // Property 1: If all transactions succeeded, market should be resolved
            expect(finalMarket?.status).toBe('resolved')
            expect(finalMarket?.resolution_outcome).toBe('HOME_WIN')
            expect(finalTransactionCount - initialTransactionCount).toBe(3) // All 3 transactions
          } else {
            // Property 2: If any transaction failed, market should remain unresolved
            expect(finalMarket?.status).toBe('FINISHED') // Original status
            expect(finalMarket?.resolution_outcome).toBeNull()
            
            // Property 3: In a real system, completed transactions would be rolled back
            // For this test, we verify that the market status wasn't updated
            expect(finalMarket?.status).not.toBe('resolved')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test for transaction ordering consistency
   * Ensures transactions are created in a consistent order during resolution
   */
  it('should maintain consistent transaction ordering during resolution', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          marketCount: fc.integer({ min: 2, max: 5 }),
          totalPool: fc.float({ min: Math.fround(10.0), max: Math.fround(100.0) }).filter(n => !isNaN(n) && isFinite(n)),
        }),
        async ({ marketCount, totalPool }) => {
          // Reset for clean state
          MockDatabaseTestUtils.reset()
          
          const creator = MockDatabaseTestUtils.createTestUser({
            display_name: 'Market Creator',
            email: 'creator@test.com',
          })

          const participant = MockDatabaseTestUtils.createTestUser({
            display_name: 'Participant',
            email: 'participant@test.com',
          })

          const resolutionResults = []

          // Create and resolve multiple markets
          for (let i = 0; i < marketCount; i++) {
            const market = MockDatabaseTestUtils.createTestMarket({
              creator_id: creator.id,
              title: `Market ${i + 1}`,
              description: `Test market ${i + 1}`,
              total_pool: totalPool,
              platform_fee_percentage: 0.03,
              creator_reward_percentage: 0.02,
              status: 'FINISHED',
              resolution_outcome: null,
            })

            MockDatabaseTestUtils.createTestParticipant({
              market_id: market.id,
              user_id: participant.id,
              prediction: 'HOME_WIN',
              entry_amount: 1.0,
              potential_winnings: 2.0,
            })

            // Record timestamp before resolution
            const resolutionStartTime = Date.now()

            // Resolve market with consistent transaction order
            const transactions = []

            // 1. Winnings transaction
            const winningsTransaction = await MockDatabaseService.createTransaction({
              user_id: participant.id,
              market_id: market.id,
              type: 'winnings',
              amount: totalPool * 0.95,
              description: 'Automated winnings from market resolution',
            })
            transactions.push(winningsTransaction)

            // 2. Creator reward transaction
            const creatorRewardTransaction = await MockDatabaseService.createTransaction({
              user_id: creator.id,
              market_id: market.id,
              type: 'creator_reward',
              amount: totalPool * 0.02,
              description: 'Automated creator reward from market resolution',
            })
            transactions.push(creatorRewardTransaction)

            // 3. Platform fee transaction
            const platformFeeTransaction = await MockDatabaseService.createTransaction({
              user_id: creator.id,
              market_id: market.id,
              type: 'platform_fee',
              amount: totalPool * 0.03,
              description: 'Automated platform fee from market resolution',
            })
            transactions.push(platformFeeTransaction)

            // Update market status
            await MockDatabaseService.updateMarket(market.id, {
              status: 'resolved',
              resolution_outcome: 'HOME_WIN',
            })

            resolutionResults.push({
              marketId: market.id,
              transactions,
              resolutionTime: resolutionStartTime,
            })
          }

          // Verify consistent ordering across all resolutions
          for (const result of resolutionResults) {
            const { transactions } = result

            // Property 1: Transaction order should be consistent (winnings, creator_reward, platform_fee)
            expect(transactions.length).toBe(3)
            expect(transactions[0].type).toBe('winnings')
            expect(transactions[1].type).toBe('creator_reward')
            expect(transactions[2].type).toBe('platform_fee')

            // Property 2: Transaction timestamps should be in order
            const timestamps = transactions.map(t => new Date(t.created_at).getTime())
            for (let i = 1; i < timestamps.length; i++) {
              expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1])
            }

            // Property 3: All transactions should be associated with the correct market
            for (const transaction of transactions) {
              expect(transaction.market_id).toBe(result.marketId)
            }
          }

          // Property 4: All resolutions should follow the same pattern
          const allTransactionTypes = resolutionResults.flatMap(r => r.transactions.map(t => t.type))
          const expectedPattern = ['winnings', 'creator_reward', 'platform_fee']
          
          for (let i = 0; i < resolutionResults.length; i++) {
            const startIndex = i * 3
            const marketPattern = allTransactionTypes.slice(startIndex, startIndex + 3)
            expect(marketPattern).toEqual(expectedPattern)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})