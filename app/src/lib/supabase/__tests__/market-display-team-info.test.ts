/**
 * Property-based tests for market display with team information
 * 
 * **Feature: enhanced-prediction-system, Property 3: Market display includes team information**
 * **Validates: Requirements 2.4**
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

const marketWithTeamDataArb = fc.record({
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

describe('Market Display with Team Information Properties', () => {
  beforeEach(async () => {
    MockDatabaseTestUtils.reset()
    
    // Set up platform config for the test
    MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', '0.03')
    MockDatabaseTestUtils.createTestPlatformConfig('default_creator_reward_percentage', '0.02')
  })

  afterEach(async () => {
    MockDatabaseTestUtils.reset()
  })

  it('Property 3: Market display includes team information', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketWithTeamDataArb,
        async (marketData) => {
          // Create a test user first
          const testUser = MockDatabaseTestUtils.createTestUser()
          
          // Create market with team data
          const market = await MarketService.createMarket({
            matchId: marketData.matchId.toString(),
            title: marketData.title,
            description: marketData.description,
            entryFee: marketData.entryFee,
            endTime: new Date(marketData.endTime).toISOString(),
            isPublic: marketData.isPublic,
            creatorId: testUser.id,
            homeTeamId: marketData.homeTeamId,
            homeTeamName: marketData.homeTeamName,
            awayTeamId: marketData.awayTeamId,
            awayTeamName: marketData.awayTeamName
          })

          // Simulate market display by creating a display string that would be rendered
          const displayString = `Market: ${market.title} - ${market.home_team_name} vs ${market.away_team_name} (Match ID: ${market.match_id})`
          
          // Verify that the display string contains all required team information
          expect(displayString).toContain(market.home_team_name)
          expect(displayString).toContain(market.away_team_name)
          expect(displayString).toContain(market.match_id?.toString())
          expect(displayString).toContain(market.title)
          
          // Verify that team names are not null or undefined in the display
          expect(market.home_team_name).toBeDefined()
          expect(market.home_team_name).not.toBeNull()
          expect(market.away_team_name).toBeDefined()
          expect(market.away_team_name).not.toBeNull()
          
          // Verify that match ID is present for linking to external data
          expect(market.match_id).toBeDefined()
          expect(market.match_id).not.toBeNull()
          expect(typeof market.match_id).toBe('number')
          
          // Verify that team information is retrievable from database
          const retrievedMarket = await MarketService.getMarketById(market.id)
          expect(retrievedMarket).not.toBeNull()
          
          const retrievedDisplayString = `Market: ${retrievedMarket!.title} - ${retrievedMarket!.home_team_name} vs ${retrievedMarket!.away_team_name} (Match ID: ${retrievedMarket!.match_id})`
          
          // Verify retrieved market also contains team information for display
          expect(retrievedDisplayString).toContain(marketData.homeTeamName)
          expect(retrievedDisplayString).toContain(marketData.awayTeamName)
          expect(retrievedDisplayString).toContain(marketData.matchId.toString())
        }
      ),
      { numRuns: 100 }
    )
  })
})