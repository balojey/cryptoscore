/**
 * Property-based tests for full automation of market lifecycle
 * 
 * **Feature: enhanced-prediction-system, Property 15: Full automation of market lifecycle**
 * **Validates: Requirements 9.5**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { AutomationService } from '../automation-service'
import { FootballDataService } from '../../football-data'
import { MockDatabaseTestUtils } from './mock-database'
import type { Database } from '@/types/supabase'

type Market = Database['public']['Tables']['markets']['Row']
type Participant = Database['public']['Tables']['participants']['Row']

// Mock FootballDataService
vi.mock('../../football-data', () => ({
  FootballDataService: {
    getMatch: vi.fn(),
  },
}))

// Generators for property-based testing
const matchIdArb = fc.integer({ min: 1, max: 999999 })
const scoreArb = fc.integer({ min: 0, max: 10 })
const entryAmountArb = fc.float({ min: Math.fround(1.0), max: Math.fround(10), noNaN: true, noDefaultInfinity: true })
  .map(n => Math.round(n * 100) / 100) // Round to 2 decimal places
const predictionArb = fc.constantFrom('Home', 'Draw', 'Away')
const outcomeArb = fc.constantFrom('Home', 'Draw', 'Away')

const matchResultArb = fc.record({
  matchId: matchIdArb,
  homeScore: scoreArb,
  awayScore: scoreArb,
  status: fc.constant('FINISHED' as const)
})

const participantArb = fc.record({
  prediction: predictionArb,
  entryAmount: entryAmountArb
})

const marketLifecycleArb = fc.record({
  matchResult: matchResultArb,
  participants: fc.array(participantArb, { minLength: 2, maxLength: 8 }),
  platformFeePercentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.05), noNaN: true, noDefaultInfinity: true })
    .map(n => Math.round(n * 10000) / 10000),
  creatorRewardPercentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.05), noNaN: true, noDefaultInfinity: true })
    .map(n => Math.round(n * 10000) / 10000)
}).filter(scenario => {
  // Ensure fee percentages don't exceed 10%
  return scenario.platformFeePercentage + scenario.creatorRewardPercentage < 0.1
})

describe('Full Automation Properties', () => {
  beforeEach(async () => {
    MockDatabaseTestUtils.reset()
    vi.clearAllMocks()
    
    // Set up platform config
    MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', '0.03')
    MockDatabaseTestUtils.createTestPlatformConfig('default_creator_reward_percentage', '0.02')
  })

  afterEach(async () => {
    MockDatabaseTestUtils.reset()
    vi.clearAllMocks()
  })

  it('Property 15: Full automation of market lifecycle', { timeout: 15000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketLifecycleArb,
        async (scenario) => {
          // Determine expected outcome based on scores
          let expectedOutcome: 'Home' | 'Draw' | 'Away'
          if (scenario.matchResult.homeScore > scenario.matchResult.awayScore) {
            expectedOutcome = 'Home'
          } else if (scenario.matchResult.awayScore > scenario.matchResult.homeScore) {
            expectedOutcome = 'Away'
          } else {
            expectedOutcome = 'Draw'
          }

          // Create test users and market
          const creator = MockDatabaseTestUtils.createTestUser()
          const participants: { user: any, participant: Participant }[] = []

          // Calculate total pool
          const totalPool = scenario.participants.reduce((sum, p) => sum + p.entryAmount, 0)

          // Create test market in SCHEDULED state (not yet resolved)
          const testMarket = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            match_id: scenario.matchResult.matchId,
            status: 'SCHEDULED', // Start in scheduled state
            resolution_outcome: null, // Not yet resolved
            total_pool: totalPool,
            platform_fee_percentage: scenario.platformFeePercentage,
            creator_reward_percentage: scenario.creatorRewardPercentage
          })

          // Create participants with different predictions
          for (const participantData of scenario.participants) {
            const user = MockDatabaseTestUtils.createTestUser()
            const participant = MockDatabaseTestUtils.createTestParticipant({
              market_id: testMarket.id,
              user_id: user.id,
              prediction: participantData.prediction,
              entry_amount: participantData.entryAmount,
              potential_winnings: participantData.entryAmount * 2, // Simplified calculation
              actual_winnings: null // Not yet calculated
            })
            participants.push({ user, participant })
          }

          // Mock FootballDataService response for finished match
          const mockMatchData = {
            id: scenario.matchResult.matchId,
            status: 'FINISHED',
            score: {
              fullTime: {
                home: scenario.matchResult.homeScore,
                away: scenario.matchResult.awayScore
              }
            }
          }

          vi.mocked(FootballDataService.getMatch).mockResolvedValue({
            success: true,
            data: mockMatchData
          })

          // PHASE 1: Status Synchronization
          // Test that status sync updates market from SCHEDULED to FINISHED
          const statusSyncResults = await AutomationService.syncMatchStatuses()
          
          // Verify status sync found and updated our market
          const ourMarketSync = statusSyncResults.find(r => r.marketId === testMarket.id)
          expect(ourMarketSync).toBeDefined()
          expect(ourMarketSync!.oldStatus).toBe('SCHEDULED')
          expect(ourMarketSync!.newStatus).toBe('FINISHED')
          expect(ourMarketSync!.updated).toBe(true)

          // Verify market status was actually updated in database
          const updatedMarket = MockDatabaseTestUtils.getState().markets.get(testMarket.id)
          expect(updatedMarket).toBeDefined()
          expect(updatedMarket!.status).toBe('FINISHED')

          // PHASE 2: Automated Resolution
          // Test that resolution automatically resolves finished markets
          const resolutionResults = await AutomationService.resolveFinishedMarkets()
          
          // Verify our market was resolved
          const ourMarketResolution = resolutionResults.find(r => r.marketId === testMarket.id)
          expect(ourMarketResolution).toBeDefined()
          expect(ourMarketResolution!.success).toBe(true)
          expect(ourMarketResolution!.outcome).toBe(expectedOutcome)

          // Verify market was marked as resolved in database
          const resolvedMarket = MockDatabaseTestUtils.getState().markets.get(testMarket.id)
          expect(resolvedMarket).toBeDefined()
          expect(resolvedMarket!.status).toBe('resolved')
          expect(resolvedMarket!.resolution_outcome).toBe(expectedOutcome)

          // PHASE 3: Automated Distribution
          // Verify winnings were distributed correctly
          const winners = participants.filter(p => p.participant.prediction === expectedOutcome)
          const nonWinners = participants.filter(p => p.participant.prediction !== expectedOutcome)

          expect(ourMarketResolution!.winnersCount).toBe(winners.length)

          // Verify winner participants were updated with actual winnings
          for (const winner of winners) {
            const updatedParticipant = MockDatabaseTestUtils.getState().participants.get(winner.participant.id)
            expect(updatedParticipant).toBeDefined()
            expect(updatedParticipant!.actual_winnings).toBeGreaterThan(0)
          }

          // Verify non-winners have no actual winnings
          for (const nonWinner of nonWinners) {
            const updatedParticipant = MockDatabaseTestUtils.getState().participants.get(nonWinner.participant.id)
            expect(updatedParticipant).toBeDefined()
            expect(updatedParticipant!.actual_winnings).toBeNull()
          }

          // PHASE 4: Transaction Logging
          // Verify all transactions were created
          const allTransactions = Array.from(MockDatabaseTestUtils.getState().transactions.values())
          const marketTransactions = allTransactions.filter(t => t.market_id === testMarket.id)

          // Should have transactions for: winnings (per winner) + creator_reward + platform_fee
          const expectedTransactionCount = winners.length + 2 // winners + creator reward + platform fee
          expect(marketTransactions.length).toBe(expectedTransactionCount)

          // Verify winnings transactions
          const winningsTransactions = marketTransactions.filter(t => t.type === 'winnings')
          expect(winningsTransactions).toHaveLength(winners.length)
          
          for (const winningsTransaction of winningsTransactions) {
            expect(winningsTransaction.status).toBe('COMPLETED')
            expect(winningsTransaction.amount).toBeGreaterThan(0)
            expect(winningsTransaction.metadata).toHaveProperty('automatedTransfer', true)
            expect(winningsTransaction.metadata).toHaveProperty('resolutionOutcome', expectedOutcome)
          }

          // Verify creator reward transaction
          const creatorRewardTransactions = marketTransactions.filter(t => t.type === 'creator_reward')
          expect(creatorRewardTransactions).toHaveLength(1)
          expect(creatorRewardTransactions[0].user_id).toBe(creator.id)
          expect(creatorRewardTransactions[0].status).toBe('COMPLETED')
          expect(creatorRewardTransactions[0].amount).toBeGreaterThan(0)
          expect(creatorRewardTransactions[0].metadata).toHaveProperty('automatedTransfer', true)

          // Verify platform fee transaction
          const platformFeeTransactions = marketTransactions.filter(t => t.type === 'platform_fee')
          expect(platformFeeTransactions).toHaveLength(1)
          expect(platformFeeTransactions[0].status).toBe('COMPLETED')
          expect(platformFeeTransactions[0].amount).toBeGreaterThan(0)
          expect(platformFeeTransactions[0].metadata).toHaveProperty('automatedTransfer', true)

          // PHASE 5: Complete Automation Cycle
          // Test that running the full automation cycle handles everything
          const automationCycleResult = await AutomationService.runAutomationCycle()
          
          // Since we already processed this market, the cycle should not find new work
          expect(automationCycleResult.statusSyncResults).toBeDefined()
          expect(automationCycleResult.resolutionResults).toBeDefined()

          // PHASE 6: Verify No Manual Intervention Required
          // The entire lifecycle should be complete without any manual steps
          const finalMarket = MockDatabaseTestUtils.getState().markets.get(testMarket.id)
          expect(finalMarket).toBeDefined()
          expect(finalMarket!.status).toBe('resolved')
          expect(finalMarket!.resolution_outcome).toBe(expectedOutcome)

          // All participants should have final winnings state
          for (const participant of participants) {
            const finalParticipant = MockDatabaseTestUtils.getState().participants.get(participant.participant.id)
            expect(finalParticipant).toBeDefined()
            
            if (participant.participant.prediction === expectedOutcome) {
              // Winners should have actual winnings
              expect(finalParticipant!.actual_winnings).toBeGreaterThan(0)
            } else {
              // Non-winners should have null actual winnings
              expect(finalParticipant!.actual_winnings).toBeNull()
            }
          }

          // All transactions should be completed
          const finalTransactions = Array.from(MockDatabaseTestUtils.getState().transactions.values())
          const finalMarketTransactions = finalTransactions.filter(t => t.market_id === testMarket.id)
          
          for (const transaction of finalMarketTransactions) {
            expect(transaction.status).toBe('COMPLETED')
            expect(transaction.metadata).toHaveProperty('automatedTransfer', true)
          }

          // Verify conservation of funds (total distributed should not exceed total pool)
          const totalWinningsDistributed = winningsTransactions.reduce((sum, t) => sum + t.amount, 0)
          const totalCreatorReward = creatorRewardTransactions.reduce((sum, t) => sum + t.amount, 0)
          const totalPlatformFee = platformFeeTransactions.reduce((sum, t) => sum + t.amount, 0)
          const totalDistributed = totalWinningsDistributed + totalCreatorReward + totalPlatformFee
          
          expect(totalDistributed).toBeLessThanOrEqual(totalPool + 0.01) // Small tolerance for floating point
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 15a: Automation handles edge cases without manual intervention', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          matchId: matchIdArb,
          apiStatus: fc.constantFrom('CANCELLED', 'POSTPONED', 'SUSPENDED'),
          hasParticipants: fc.boolean()
        }),
        async ({ matchId, apiStatus, hasParticipants }) => {
          // Create test market in SCHEDULED state
          const creator = MockDatabaseTestUtils.createTestUser()
          const testMarket = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            match_id: matchId,
            status: 'SCHEDULED',
            resolution_outcome: null,
            total_pool: hasParticipants ? 1.0 : 0.0
          })

          // Optionally create participants
          if (hasParticipants) {
            MockDatabaseTestUtils.createTestParticipant({
              market_id: testMarket.id,
              user_id: creator.id,
              prediction: 'Home',
              entry_amount: 0.5
            })

            MockDatabaseTestUtils.createTestParticipant({
              market_id: testMarket.id,
              user_id: MockDatabaseTestUtils.createTestUser().id,
              prediction: 'Away',
              entry_amount: 0.5
            })
          }

          // Mock FootballDataService response for cancelled/postponed match
          vi.mocked(FootballDataService.getMatch).mockResolvedValue({
            success: true,
            data: {
              id: matchId,
              status: apiStatus
            }
          })

          // Test that automation handles edge cases
          const statusSyncResults = await AutomationService.syncMatchStatuses()
          
          // Verify status sync handled the edge case
          const ourMarketSync = statusSyncResults.find(r => r.marketId === testMarket.id)
          expect(ourMarketSync).toBeDefined()
          expect(ourMarketSync!.updated).toBe(true)

          // Verify market status was updated appropriately
          const updatedMarket = MockDatabaseTestUtils.getState().markets.get(testMarket.id)
          expect(updatedMarket).toBeDefined()
          
          // Status should be mapped correctly for edge cases
          const expectedStatus = apiStatus === 'CANCELLED' || apiStatus === 'SUSPENDED' ? 'CANCELLED' : 'POSTPONED'
          expect(updatedMarket!.status).toBe(expectedStatus)

          // Test that resolution doesn't try to resolve cancelled/postponed markets
          const resolutionResults = await AutomationService.resolveFinishedMarkets()
          
          // Our market should not appear in resolution results since it's not FINISHED
          const ourMarketResolution = resolutionResults.find(r => r.marketId === testMarket.id)
          expect(ourMarketResolution).toBeUndefined()

          // Market should remain in cancelled/postponed state without resolution
          const finalMarket = MockDatabaseTestUtils.getState().markets.get(testMarket.id)
          expect(finalMarket!.status).toBe(expectedStatus)
          expect(finalMarket!.resolution_outcome).toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 15b: Automation cycle is idempotent', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          matchId: matchIdArb,
          homeScore: scoreArb,
          awayScore: scoreArb
        }),
        async ({ matchId, homeScore, awayScore }) => {
          // Create test market and participants
          const creator = MockDatabaseTestUtils.createTestUser()
          const testMarket = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            match_id: matchId,
            status: 'SCHEDULED',
            resolution_outcome: null,
            total_pool: 1.0
          })

          MockDatabaseTestUtils.createTestParticipant({
            market_id: testMarket.id,
            user_id: creator.id,
            prediction: 'Home',
            entry_amount: 0.5
          })

          // Mock FootballDataService response
          vi.mocked(FootballDataService.getMatch).mockResolvedValue({
            success: true,
            data: {
              id: matchId,
              status: 'FINISHED',
              score: {
                fullTime: {
                  home: homeScore,
                  away: awayScore
                }
              }
            }
          })

          // Run automation cycle first time
          const firstCycleResult = await AutomationService.runAutomationCycle()
          
          // Capture state after first run
          const marketAfterFirst = MockDatabaseTestUtils.getState().markets.get(testMarket.id)
          const transactionsAfterFirst = Array.from(MockDatabaseTestUtils.getState().transactions.values())
            .filter(t => t.market_id === testMarket.id)

          // Run automation cycle second time
          const secondCycleResult = await AutomationService.runAutomationCycle()
          
          // Capture state after second run
          const marketAfterSecond = MockDatabaseTestUtils.getState().markets.get(testMarket.id)
          const transactionsAfterSecond = Array.from(MockDatabaseTestUtils.getState().transactions.values())
            .filter(t => t.market_id === testMarket.id)

          // Verify idempotency: second run should not change anything
          expect(marketAfterFirst).toEqual(marketAfterSecond)
          expect(transactionsAfterFirst.length).toBe(transactionsAfterSecond.length)

          // Second cycle should not find new work to do
          expect(secondCycleResult.statusSyncResults.every(r => !r.updated)).toBe(true)
          expect(secondCycleResult.resolutionResults).toHaveLength(0)

          // Market should remain resolved
          expect(marketAfterSecond!.status).toBe('resolved')
          expect(marketAfterSecond!.resolution_outcome).not.toBeNull()
        }
      ),
      { numRuns: 50 }
    )
  })
})