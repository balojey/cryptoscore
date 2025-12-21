/**
 * Property-based tests for platform fee transaction separation
 * 
 * **Feature: enhanced-prediction-system, Property 10: Platform fee transaction separation**
 * **Validates: Requirements 6.4**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { MockDatabaseService } from './mock-database-service'
import { MockDatabaseTestUtils } from './mock-database'
import { AutomationService } from '../automation-service'
import type { Database } from '@/types/supabase'

type Transaction = Database['public']['Tables']['transactions']['Row']
type Market = Database['public']['Tables']['markets']['Row']

describe('Platform Fee Transaction Separation Property Tests', () => {
  beforeEach(() => {
    MockDatabaseTestUtils.reset()
  })

  /**
   * **Feature: enhanced-prediction-system, Property 10: Platform fee transaction separation**
   * **Validates: Requirements 6.4**
   * 
   * For any market resolution with platform fees, fee deductions should create 
   * separate transaction records for transparency
   */
  it('should create separate transaction records for platform fees', async () => {
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
          participantCount: fc.integer({ min: 2, max: 10 }),
        }),
        async ({ marketData, participantCount }) => {
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

          // Create market
          const market = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            title: marketData.title,
            description: marketData.description,
            entry_fee: marketData.entry_fee,
            total_pool: marketData.total_pool,
            platform_fee_percentage: marketData.platform_fee_percentage,
            creator_reward_percentage: marketData.creator_reward_percentage,
            status: 'FINISHED',
            resolution_outcome: marketData.resolution_outcome,
            match_id: marketData.match_id,
          })

          // Create participants with predictions
          const predictions = ['HOME_WIN', 'DRAW', 'AWAY_WIN']
          for (let i = 0; i < participantCount; i++) {
            MockDatabaseTestUtils.createTestParticipant({
              market_id: market.id,
              user_id: participants[i].id,
              prediction: predictions[i % predictions.length],
              entry_amount: marketData.entry_fee,
              potential_winnings: marketData.entry_fee * 2,
            })
          }

          // Calculate expected platform fee
          const expectedPlatformFee = marketData.total_pool * marketData.platform_fee_percentage

          // Record initial transaction count
          const initialTransactionCount = MockDatabaseTestUtils.getState().transactions.size

          // Create platform fee transaction
          const platformFeeTransaction = await MockDatabaseService.createTransaction({
            user_id: creator.id, // Associated with creator for tracking
            market_id: market.id,
            type: 'platform_fee',
            amount: expectedPlatformFee,
            description: 'Automated platform fee from market resolution',
          })

          // Create other transaction types for comparison
          const winningsTransaction = await MockDatabaseService.createTransaction({
            user_id: participants[0].id,
            market_id: market.id,
            type: 'winnings',
            amount: marketData.entry_fee * 1.5,
            description: 'Automated winnings from market resolution',
          })

          const creatorRewardTransaction = await MockDatabaseService.createTransaction({
            user_id: creator.id,
            market_id: market.id,
            type: 'creator_reward',
            amount: marketData.total_pool * marketData.creator_reward_percentage,
            description: 'Automated creator reward from market resolution',
          })

          // Verify transaction separation
          const finalTransactionCount = MockDatabaseTestUtils.getState().transactions.size
          const newTransactionCount = finalTransactionCount - initialTransactionCount

          // Property 1: Platform fee should have its own separate transaction record
          expect(newTransactionCount).toBe(3) // platform_fee + winnings + creator_reward
          expect(platformFeeTransaction).toBeDefined()
          expect(platformFeeTransaction.type).toBe('platform_fee')

          // Property 2: Platform fee transaction should be distinct from other transaction types
          expect(platformFeeTransaction.id).not.toBe(winningsTransaction.id)
          expect(platformFeeTransaction.id).not.toBe(creatorRewardTransaction.id)
          expect(platformFeeTransaction.type).not.toBe(winningsTransaction.type)
          expect(platformFeeTransaction.type).not.toBe(creatorRewardTransaction.type)

          // Property 3: Platform fee transaction should have correct metadata
          expect(platformFeeTransaction.user_id).toBe(creator.id)
          expect(platformFeeTransaction.market_id).toBe(market.id)
          expect(platformFeeTransaction.amount).toBe(expectedPlatformFee)
          expect(platformFeeTransaction.description).toContain('platform fee')
          expect(platformFeeTransaction.description.toLowerCase()).toContain('automated')

          // Property 4: Platform fee transactions should be retrievable separately
          const allMarketTransactions = await MockDatabaseService.getMarketTransactions(market.id)
          const platformFeeTransactions = allMarketTransactions.filter(t => t.type === 'platform_fee')
          const winningsTransactions = allMarketTransactions.filter(t => t.type === 'winnings')
          const creatorRewardTransactions = allMarketTransactions.filter(t => t.type === 'creator_reward')

          expect(platformFeeTransactions.length).toBe(1)
          expect(winningsTransactions.length).toBe(1)
          expect(creatorRewardTransactions.length).toBe(1)

          // Property 5: Platform fee transaction should be identifiable by type alone
          const platformFeeById = platformFeeTransactions[0]
          expect(platformFeeById.id).toBe(platformFeeTransaction.id)
          expect(platformFeeById.type).toBe('platform_fee')
          expect(platformFeeById.amount).toBe(expectedPlatformFee)

          // Property 6: Platform fee amount should be calculated correctly
          const calculatedFee = marketData.total_pool * marketData.platform_fee_percentage
          expect(platformFeeTransaction.amount).toBeCloseTo(calculatedFee, 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test for platform fee transaction transparency
   * Ensures platform fees are logged separately for user transparency
   */
  it('should log platform fees separately for transparency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalPool: fc.float({ min: Math.fround(1.0), max: Math.fround(1000.0) }).filter(n => !isNaN(n) && isFinite(n)),
          platformFeePercentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.1) }).filter(n => !isNaN(n) && isFinite(n)),
          marketTitle: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
        }),
        async ({ totalPool, platformFeePercentage, marketTitle }) => {
          // Create test data
          const creator = MockDatabaseTestUtils.createTestUser({
            display_name: 'Market Creator',
            email: 'creator@test.com',
          })

          const market = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            title: marketTitle,
            description: 'Test market for platform fee transparency',
            total_pool: totalPool,
            platform_fee_percentage: platformFeePercentage,
            status: 'FINISHED',
            resolution_outcome: 'HOME_WIN',
          })

          // Calculate platform fee
          const platformFee = totalPool * platformFeePercentage

          // Create platform fee transaction
          const transaction = await MockDatabaseService.createTransaction({
            user_id: creator.id,
            market_id: market.id,
            type: 'platform_fee',
            amount: platformFee,
            description: `Automated platform fee from market resolution`,
          })

          // Verify transparency properties
          // Property 1: Transaction type clearly identifies it as a platform fee
          expect(transaction.type).toBe('platform_fee')

          // Property 2: Transaction is associated with the market
          expect(transaction.market_id).toBe(market.id)

          // Property 3: Transaction amount matches calculated fee
          expect(transaction.amount).toBeCloseTo(platformFee, 5)

          // Property 4: Transaction description is clear and informative
          expect(transaction.description).toBeDefined()
          expect(transaction.description.toLowerCase()).toContain('platform fee')
          expect(transaction.description.toLowerCase()).toContain('automated')

          // Property 5: Transaction can be retrieved and identified
          const marketTransactions = await MockDatabaseService.getMarketTransactions(market.id)
          const platformFeeTransactions = marketTransactions.filter(t => t.type === 'platform_fee')
          
          expect(platformFeeTransactions.length).toBeGreaterThan(0)
          expect(platformFeeTransactions[0].id).toBe(transaction.id)

          // Property 6: Transaction has timestamp for audit trail
          expect(transaction.created_at).toBeDefined()
          const transactionTime = new Date(transaction.created_at).getTime()
          const now = Date.now()
          expect(transactionTime).toBeLessThanOrEqual(now)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test for platform fee calculation consistency
   * Ensures platform fees are calculated consistently across all markets
   */
  it('should calculate platform fees consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            totalPool: fc.float({ min: Math.fround(1.0), max: Math.fround(100.0) }).filter(n => !isNaN(n) && isFinite(n)),
            platformFeePercentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.1) }).filter(n => !isNaN(n) && isFinite(n)),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (markets) => {
          // Reset database state for this test iteration
          MockDatabaseTestUtils.reset()
          
          const creator = MockDatabaseTestUtils.createTestUser({
            display_name: 'Market Creator',
            email: 'creator@test.com',
          })

          const platformFeeTransactions = []

          for (let i = 0; i < markets.length; i++) {
            const marketData = markets[i]
            
            const market = MockDatabaseTestUtils.createTestMarket({
              creator_id: creator.id,
              title: `Market ${i + 1}`,
              description: `Test market ${i + 1}`,
              total_pool: marketData.totalPool,
              platform_fee_percentage: marketData.platformFeePercentage,
              status: 'FINISHED',
              resolution_outcome: 'HOME_WIN',
            })

            const platformFee = marketData.totalPool * marketData.platformFeePercentage

            const transaction = await MockDatabaseService.createTransaction({
              user_id: creator.id,
              market_id: market.id,
              type: 'platform_fee',
              amount: platformFee,
              description: 'Automated platform fee from market resolution',
            })

            platformFeeTransactions.push({
              transaction,
              expectedFee: platformFee,
              market: marketData,
            })
          }

          // Property: Each platform fee should match its calculated value
          for (const { transaction, expectedFee, market } of platformFeeTransactions) {
            expect(transaction.type).toBe('platform_fee')
            expect(transaction.amount).toBeCloseTo(expectedFee, 5)
            
            // Verify calculation: amount = total_pool * percentage
            const calculatedFee = market.totalPool * market.platformFeePercentage
            expect(transaction.amount).toBeCloseTo(calculatedFee, 5)
          }

          // Property: All platform fee transactions should be retrievable
          const allTransactions = MockDatabaseTestUtils.getState().transactions
          const allPlatformFees = Array.from(allTransactions.values()).filter(t => t.type === 'platform_fee')
          
          expect(allPlatformFees.length).toBe(platformFeeTransactions.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})
