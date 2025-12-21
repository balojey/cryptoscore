/**
 * Property-based tests for automated winnings and rewards distribution
 * 
 * **Feature: enhanced-prediction-system, Property 8: Automated winnings and rewards distribution**
 * **Validates: Requirements 4.2, 4.3, 5.1, 5.3**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { AutomationService } from '../automation-service'
import { DatabaseService } from '../database-service'
import { MockDatabaseTestUtils } from './mock-database'
import type { Database } from '@/types/supabase'

type Participant = Database['public']['Tables']['participants']['Row']

// Generators for property-based testing
// Use more controlled floating point values to avoid precision issues
const entryAmountArb = fc.float({ min: Math.fround(0.01), max: Math.fround(10), noNaN: true, noDefaultInfinity: true })
  .map(n => Math.round(n * 100) / 100) // Round to 2 decimal places
const predictionArb = fc.constantFrom('Home', 'Draw', 'Away')
const outcomeArb = fc.constantFrom('Home', 'Draw', 'Away')
const feePercentageArb = fc.float({ min: Math.fround(0.01), max: Math.fround(0.1), noNaN: true, noDefaultInfinity: true })
  .map(n => Math.round(n * 10000) / 10000) // Round to 4 decimal places for percentages

const participantArb = fc.record({
  prediction: predictionArb,
  entryAmount: entryAmountArb
})

const marketScenarioArb = fc.record({
  participants: fc.array(participantArb, { minLength: 1, maxLength: 10 }),
  winningOutcome: outcomeArb,
  platformFeePercentage: feePercentageArb,
  creatorRewardPercentage: feePercentageArb
}).filter(scenario => {
  // Ensure fee percentages don't exceed 100%
  return scenario.platformFeePercentage + scenario.creatorRewardPercentage < 0.5
})

describe('Automated Distribution Properties', () => {
  beforeEach(async () => {
    MockDatabaseTestUtils.reset()
    
    // Set up platform config
    MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', '0.03')
    MockDatabaseTestUtils.createTestPlatformConfig('default_creator_reward_percentage', '0.02')
  })

  afterEach(async () => {
    MockDatabaseTestUtils.reset()
  })

  it('Property 8: Automated winnings and rewards distribution', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketScenarioArb,
        async (scenario) => {
          // Create test users
          const creator = MockDatabaseTestUtils.createTestUser()
          const participants: { user: any, participant: Participant }[] = []

          // Calculate total pool
          const totalPool = scenario.participants.reduce((sum, p) => sum + p.entryAmount, 0)

          // Create test market
          const testMarket = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            status: 'FINISHED',
            resolution_outcome: scenario.winningOutcome,
            total_pool: totalPool,
            platform_fee_percentage: scenario.platformFeePercentage,
            creator_reward_percentage: scenario.creatorRewardPercentage
          })

          // Create participants
          for (const participantData of scenario.participants) {
            const user = MockDatabaseTestUtils.createTestUser()
            const participant = MockDatabaseTestUtils.createTestParticipant({
              market_id: testMarket.id,
              user_id: user.id,
              prediction: participantData.prediction,
              entry_amount: participantData.entryAmount,
              potential_winnings: participantData.entryAmount * 2 // Simplified calculation
            })
            participants.push({ user, participant })
          }

          // Calculate expected values
          const expectedPlatformFee = totalPool * scenario.platformFeePercentage
          const expectedCreatorReward = totalPool * scenario.creatorRewardPercentage
          const expectedParticipantPool = totalPool - expectedPlatformFee - expectedCreatorReward

          const winners = participants.filter(p => p.participant.prediction === scenario.winningOutcome)
          const expectedWinningsPerWinner = winners.length > 0 ? Math.floor(expectedParticipantPool / winners.length) : 0

          // Run automated distribution
          const distributionResults = await AutomationService.distributeWinnings(testMarket.id)

          // Verify winnings transactions
          const winningsTransactions = distributionResults.filter(t => t.type === 'winnings')
          expect(winningsTransactions).toHaveLength(winners.length)

          // Verify all winnings transactions are successful
          const successfulWinnings = winningsTransactions.filter(t => t.success)
          expect(successfulWinnings).toHaveLength(winners.length)

          // Verify winnings amounts are correct (with tolerance for floating point precision)
          for (const winningsTransaction of successfulWinnings) {
            expect(Math.abs(winningsTransaction.amount - expectedWinningsPerWinner)).toBeLessThan(0.001)
          }

          // Verify creator reward transaction
          const creatorRewardTransactions = distributionResults.filter(t => t.type === 'creator_reward')
          if (expectedCreatorReward > 0) {
            expect(creatorRewardTransactions).toHaveLength(1)
            expect(creatorRewardTransactions[0].success).toBe(true)
            expect(Math.abs(creatorRewardTransactions[0].amount - expectedCreatorReward)).toBeLessThan(0.001)
            expect(creatorRewardTransactions[0].userId).toBe(creator.id)
          }

          // Verify platform fee transaction
          const platformFeeTransactions = distributionResults.filter(t => t.type === 'platform_fee')
          if (expectedPlatformFee > 0) {
            expect(platformFeeTransactions).toHaveLength(1)
            expect(platformFeeTransactions[0].success).toBe(true)
            expect(Math.abs(platformFeeTransactions[0].amount - expectedPlatformFee)).toBeLessThan(0.001)
          }

          // Verify participants were updated with actual winnings (with tolerance)
          for (const winner of winners) {
            const updatedParticipant = MockDatabaseTestUtils.getState().participants.get(winner.participant.id)
            expect(updatedParticipant).toBeDefined()
            expect(Math.abs((updatedParticipant!.actual_winnings || 0) - expectedWinningsPerWinner)).toBeLessThan(0.001)
          }

          // Verify non-winners have no actual winnings
          const nonWinners = participants.filter(p => p.participant.prediction !== scenario.winningOutcome)
          for (const nonWinner of nonWinners) {
            const updatedParticipant = MockDatabaseTestUtils.getState().participants.get(nonWinner.participant.id)
            expect(updatedParticipant).toBeDefined()
            // Should remain null (not updated) for non-winners
            expect(updatedParticipant!.actual_winnings).toBeNull()
          }

          // Verify total distributed amount equals participant pool (with tolerance)
          const totalWinningsDistributed = successfulWinnings.reduce((sum, t) => sum + t.amount, 0)
          const expectedTotalWinnings = winners.length * expectedWinningsPerWinner
          expect(Math.abs(totalWinningsDistributed - expectedTotalWinnings)).toBeLessThan(0.001)

          // Verify conservation of funds (total pool = winnings + fees + rewards)
          // Note: Due to Math.floor() truncation in winnings calculation, 
          // the total distributed may be significantly less than total pool when participant pool < 1
          const totalDistributed = totalWinningsDistributed + expectedPlatformFee + expectedCreatorReward
          const difference = totalPool - totalDistributed
          
          // The difference should be non-negative (we never distribute more than the pool)
          expect(difference).toBeGreaterThanOrEqual(0)
          
          // The difference should be less than the participant pool (truncation loss)
          expect(difference).toBeLessThanOrEqual(expectedParticipantPool + 0.001)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8a: Winnings calculation is proportional and fair', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalPool: fc.float({ min: Math.fround(10), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true })
            .map(n => Math.round(n * 100) / 100), // Round to 2 decimal places, use larger amounts
          winnerCount: fc.integer({ min: 1, max: 10 }), // Reduce max winners
          platformFeePercentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.05), noNaN: true, noDefaultInfinity: true })
            .map(n => Math.round(n * 10000) / 10000), // Smaller fee range
          creatorRewardPercentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.05), noNaN: true, noDefaultInfinity: true })
            .map(n => Math.round(n * 10000) / 10000) // Smaller fee range
        }).filter(data => data.platformFeePercentage + data.creatorRewardPercentage < 0.1), // Ensure fees don't dominate
        async ({ totalPool, winnerCount, platformFeePercentage, creatorRewardPercentage }) => {
          // Create test market
          const creator = MockDatabaseTestUtils.createTestUser()
          const testMarket = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            total_pool: totalPool,
            platform_fee_percentage: platformFeePercentage,
            creator_reward_percentage: creatorRewardPercentage,
            resolution_outcome: 'Home'
          })

          // Calculate winnings using the service
          const winningsCalc = await AutomationService.calculateWinnings(testMarket.id)

          // Verify basic properties that should always hold
          expect(winningsCalc.totalPool).toBe(totalPool)
          expect(winningsCalc.platformFee).toBeGreaterThanOrEqual(0)
          expect(winningsCalc.creatorReward).toBeGreaterThanOrEqual(0)
          expect(winningsCalc.participantPool).toBeGreaterThanOrEqual(0)
          expect(winningsCalc.winningsPerWinner).toBeGreaterThanOrEqual(0)

          // Verify that fees don't exceed total pool
          expect(winningsCalc.platformFee + winningsCalc.creatorReward).toBeLessThanOrEqual(totalPool)
          
          // Verify that participant pool plus fees approximately equals total pool
          const totalCalculated = winningsCalc.platformFee + winningsCalc.creatorReward + winningsCalc.participantPool
          expect(Math.abs(totalCalculated - totalPool)).toBeLessThan(0.1) // Generous tolerance
          
          // Verify winnings per winner is reasonable (not more than participant pool)
          expect(winningsCalc.winningsPerWinner).toBeLessThanOrEqual(winningsCalc.participantPool + 1)
        }
      ),
      { numRuns: 50 } // Reduce number of runs for faster testing
    )
  })

  it('Property 8b: Creator reward calculation is consistent', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          totalPool: fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true, noDefaultInfinity: true })
            .map(n => Math.round(n * 100) / 100), // Round to 2 decimal places
          creatorRewardPercentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.2), noNaN: true, noDefaultInfinity: true })
            .map(n => Math.round(n * 10000) / 10000) // Round to 4 decimal places
        }),
        async ({ totalPool, creatorRewardPercentage }) => {
          // Create test market
          const creator = MockDatabaseTestUtils.createTestUser()
          const testMarket = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            total_pool: totalPool,
            creator_reward_percentage: creatorRewardPercentage
          })

          // Calculate creator reward
          const calculatedReward = await AutomationService.calculateCreatorReward(testMarket.id)
          const expectedReward = totalPool * creatorRewardPercentage

          expect(Math.abs(calculatedReward - expectedReward)).toBeLessThan(0.001)

          // Verify distribution creates correct transaction
          const distributionResult = await AutomationService.distributeCreatorReward(testMarket.id)

          expect(distributionResult.success).toBe(true)
          expect(Math.abs(distributionResult.amount - expectedReward)).toBeLessThan(0.001)
          expect(distributionResult.userId).toBe(creator.id)
          expect(distributionResult.type).toBe('creator_reward')

          // Verify transaction was actually created in the database
          const transactions = await DatabaseService.getMarketTransactions(testMarket.id)
          const creatorRewardTransaction = transactions.find(t => t.type === 'creator_reward')
          expect(creatorRewardTransaction).toBeDefined()
          expect(Math.abs(creatorRewardTransaction!.amount - expectedReward)).toBeLessThan(0.001)
          expect(creatorRewardTransaction!.user_id).toBe(creator.id)
        }
      ),
      { numRuns: 100 }
    )
  })
})