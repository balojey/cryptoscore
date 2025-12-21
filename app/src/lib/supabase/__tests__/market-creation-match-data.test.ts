/**
 * Property-based tests for market creation with match data
 * 
 * **Feature: enhanced-prediction-system, Property 1: Market creation stores complete match data**
 * **Validates: Requirements 1.1, 2.1, 2.2, 2.3**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { MarketService } from '../market-service'
import { MockDatabaseTestUtils } from './mock-database'

// Generators for property-based testing
const matchIdArb = fc.integer({ min: 1, max: 999999 })
const teamIdArb = fc.integer({ min: 1, max: 9999 })
const teamNameArb = fc.string({ minLength: 3, maxLength: 30 }).filter(name => name.trim().length > 0)
const titleArb = fc.string({ minLength: 5, maxLength: 100 }).filter(title => title.trim().length > 0)
const descriptionArb = fc.string({ minLength: 10, maxLength: 500 }).filter(desc => desc.trim().length > 0)
const entryFeeArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true, noDefaultInfinity: true })
const futureTimestampArb = fc.integer({ min: Date.now() + 3600000, max: Date.now() + 86400000 * 30 })

const matchDataArb = fc.record({
  matchId: matchIdArb,
  homeTeamId: teamIdArb,
  homeTeamName: teamNameArb,
  awayTeamId: teamIdArb,
  awayTeamName: teamNameArb,
  title: titleArb,
  description: descriptionArb,
  entryFee: entryFeeArb,
  endTime: futureTimestampArb,
  isPublic: fc.boolean()
}).filter(data => data.homeTeamId !== data.awayTeamId) // Ensure different teams

describe('Market Creation with Match Data Properties', () => {
  beforeEach(async () => {
    MockDatabaseTestUtils.reset()
    
    // Set up platform config for the test
    MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', '0.03')
    MockDatabaseTestUtils.createTestPlatformConfig('default_creator_reward_percentage', '0.02')
  })

  afterEach(async () => {
    MockDatabaseTestUtils.reset()
  })

  it('Property 1: Market creation stores complete match data', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        matchDataArb,
        async (matchData) => {
          // Create a test user first
          const testUser = MockDatabaseTestUtils.createTestUser()
          
          // Create market with match data
          const market = await MarketService.createMarket({
            matchId: matchData.matchId.toString(),
            title: matchData.title,
            description: matchData.description,
            entryFee: matchData.entryFee,
            endTime: new Date(matchData.endTime).toISOString(),
            isPublic: matchData.isPublic,
            creatorId: testUser.id,
            homeTeamId: matchData.homeTeamId,
            homeTeamName: matchData.homeTeamName,
            awayTeamId: matchData.awayTeamId,
            awayTeamName: matchData.awayTeamName
          })

          // Verify all match data is stored correctly
          expect(market.match_id).toBe(matchData.matchId)
          expect(market.home_team_id).toBe(matchData.homeTeamId)
          expect(market.home_team_name).toBe(matchData.homeTeamName)
          expect(market.away_team_id).toBe(matchData.awayTeamId)
          expect(market.away_team_name).toBe(matchData.awayTeamName)
          
          // Verify other market data is preserved
          expect(market.title).toBe(matchData.title)
          expect(market.description).toBe(matchData.description)
          expect(market.entry_fee).toBe(matchData.entryFee)
          expect(market.creator_id).toBe(testUser.id)
          
          // Verify market can be retrieved with match data intact
          const retrievedMarket = await MarketService.getMarketById(market.id)
          expect(retrievedMarket).not.toBeNull()
          expect(retrievedMarket!.match_id).toBe(matchData.matchId)
          expect(retrievedMarket!.home_team_id).toBe(matchData.homeTeamId)
          expect(retrievedMarket!.home_team_name).toBe(matchData.homeTeamName)
          expect(retrievedMarket!.away_team_id).toBe(matchData.awayTeamId)
          expect(retrievedMarket!.away_team_name).toBe(matchData.awayTeamName)
        }
      ),
      { numRuns: 100 }
    )
  })
})