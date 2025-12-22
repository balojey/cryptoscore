/**
 * Property-based tests for Market Service
 * 
 * Tests market creation, participation, and data consistency
 * using property-based testing with fast-check and mock database.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { MarketService, type CreateMarketParams } from '../market-service'
import { DatabaseService } from '../database-service'
import { MockTestSetup, TestScenarios, MockDatabaseTestUtils } from './test-utils'

describe('MarketService Property Tests', () => {
  beforeEach(async () => {
    await MockTestSetup.setupWithDefaults()
  })

  afterEach(() => {
    MockDatabaseTestUtils.reset()
  })

  /**
   * **Feature: web2-migration, Property 5: Market Data Consistency**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any market creation, the system should collect and store the same 
   * information fields (title, description, entry fee, end time) in Supabase as 
   * the original Solana implementation
   */
  it('should maintain market data consistency when creating markets', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for valid market creation parameters
        fc.record({
          matchId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          title: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          description: fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10),
          entryFee: fc.float({ min: Math.fround(0.001), max: Math.fround(100), noNaN: true }),
          endTime: fc.integer({ min: 1, max: 365 }).map(days => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()),
          isPublic: fc.boolean(),
          creatorId: fc.uuid(),
          homeTeamId: fc.integer({ min: 1, max: 1000 }),
          homeTeamName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
          awayTeamId: fc.integer({ min: 1, max: 1000 }),
          awayTeamName: fc.string({ minLength: 3, maxLength: 50 }).filter(s => s.trim().length >= 3),
        }),
        async (params: CreateMarketParams) => {
          // Create test user first
          const creator = MockDatabaseTestUtils.createTestUser({ id: params.creatorId })

          // Test market creation
          const result = await MarketService.createMarket(params)

          // Verify all required fields are preserved
          expect(result.title).toBe(params.title)
          expect(result.description).toBe(params.description)
          expect(result.entry_fee).toBe(params.entryFee)
          expect(result.end_time).toBe(params.endTime)
          expect(result.creator_id).toBe(params.creatorId)
          expect(result.status).toBe('SCHEDULED')
          expect(result.total_pool).toBe(0)
          expect(result.platform_fee_percentage).toBe(5) // From default config

          // Verify market exists in database
          const storedMarket = await MarketService.getMarketById(result.id)
          expect(storedMarket).toEqual(result)

          // Verify transaction was created
          const transactions = await DatabaseService.getUserTransactions(params.creatorId)
          expect(transactions).toHaveLength(1)
          expect(transactions[0].type).toBe('market_entry')
          expect(transactions[0].amount).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain data consistency when joining markets', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          prediction: fc.oneof(fc.constant('HOME_WIN'), fc.constant('DRAW'), fc.constant('AWAY_WIN')),
          entryAmount: fc.float({ min: Math.fround(0.001), max: Math.fround(10), noNaN: true }),
        }),
        async (joinParams) => {
          // Create test scenario
          const scenario = await TestScenarios.createMarketScenario({ 
            participantCount: 2,
            marketStatus: 'SCHEDULED',
            withTransactions: false 
          })
          
          // Create new user to join market
          const newUser = MockDatabaseTestUtils.createTestUser()

          // Test joining market
          const result = await MarketService.joinMarket({
            marketId: scenario.market.id,
            userId: newUser.id,
            prediction: joinParams.prediction,
            entryAmount: joinParams.entryAmount,
          })

          // Verify participant data consistency
          expect(result.market_id).toBe(scenario.market.id)
          expect(result.user_id).toBe(newUser.id)
          // Database stores predictions in 'Home'/'Draw'/'Away' format
          const expectedDbPrediction = joinParams.prediction === 'HOME_WIN' ? 'Home' : 
                                      joinParams.prediction === 'AWAY_WIN' ? 'Away' : 'Draw'
          expect(result.prediction).toBe(expectedDbPrediction)
          expect(result.entry_amount).toBe(joinParams.entryAmount)
          expect(result.potential_winnings).toBeGreaterThan(0)

          // Verify market pool was updated
          const updatedMarket = await MarketService.getMarketById(scenario.market.id)
          expect(updatedMarket!.total_pool).toBe(scenario.market.total_pool + joinParams.entryAmount)

          // Verify transaction was recorded
          const transactions = await DatabaseService.getUserTransactions(newUser.id)
          expect(transactions).toHaveLength(1)
          expect(transactions[0].type).toBe('market_entry')
          expect(transactions[0].amount).toBe(joinParams.entryAmount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain data consistency during market resolution', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          outcome: fc.oneof(fc.constant('HOME_WIN'), fc.constant('DRAW'), fc.constant('AWAY_WIN')),
        }),
        async (resolveParams) => {
          // Create test scenario with participants
          const scenario = await TestScenarios.createMarketScenario({ 
            participantCount: 6,
            marketStatus: 'SCHEDULED',
            withTransactions: true 
          })

          // Test that manual market resolution is disabled
          const dbOutcome = resolveParams.outcome === 'HOME_WIN' ? 'Home' : 
                           resolveParams.outcome === 'AWAY_WIN' ? 'Away' : 'Draw'
          await expect(MarketService.resolveMarket({
            marketId: scenario.market.id,
            outcome: dbOutcome,
          })).rejects.toThrow('Manual market resolution has been disabled. Markets are now resolved automatically.')

          // Verify market status remains unchanged since manual resolution is disabled
          const market = await MarketService.getMarketById(scenario.market.id)
          expect(market!.status).toBe('SCHEDULED') // Should remain unchanged
          expect(market!.resolution_outcome).toBeNull() // Should remain null

          // Since manual resolution is disabled, participants should not be updated
          const participants = await MarketService.getMarketParticipants(scenario.market.id)
          for (const participant of participants) {
            expect(participant.actual_winnings).toBeNull() // Should remain null
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge cases in market data consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entryFee: fc.oneof(
            fc.constant(0.001), // Minimum fee
            fc.constant(100),   // Maximum fee
            fc.float({ min: Math.fround(0.001), max: Math.fround(100), noNaN: true })
          ),
          endTime: fc.oneof(
            fc.constant(new Date(Date.now() + 60000).toISOString()), // 1 minute from now
            fc.constant(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()), // 1 year from now
          ),
          title: fc.oneof(
            fc.constant('A'.repeat(5)),   // Minimum length
            fc.constant('A'.repeat(200)), // Maximum length
            fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5)
          ),
        }),
        async (edgeParams) => {
          // Create test user
          const creator = MockDatabaseTestUtils.createTestUser()

          const params: CreateMarketParams = {
            matchId: 'edge-test',
            title: edgeParams.title,
            description: 'Edge case test description',
            entryFee: edgeParams.entryFee,
            endTime: edgeParams.endTime,
            isPublic: true,
            creatorId: creator.id,
            homeTeamId: 1,
            homeTeamName: 'Home Team',
            awayTeamId: 2,
            awayTeamName: 'Away Team',
          }

          // Test edge case handling
          const result = await MarketService.createMarket(params)

          // Verify edge cases are handled consistently
          expect(result.entry_fee).toBe(params.entryFee)
          expect(result.entry_fee).toBeGreaterThanOrEqual(0.001)
          expect(result.entry_fee).toBeLessThanOrEqual(100)
          
          expect(result.title).toBe(params.title)
          expect(result.title.length).toBeGreaterThanOrEqual(5)
          expect(result.title.length).toBeLessThanOrEqual(200)
          
          expect(new Date(result.end_time).getTime()).toBeGreaterThan(Date.now())
        }
      ),
      { numRuns: 100 }
    )
  })
})