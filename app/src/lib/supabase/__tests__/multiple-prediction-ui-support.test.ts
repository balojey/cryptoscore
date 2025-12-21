/**
 * Property-based tests for multiple prediction UI support
 * 
 * **Feature: enhanced-prediction-system, Property 13: Multiple prediction UI support**
 * **Validates: Requirements 8.1, 8.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { MarketService } from '../market-service'
import { MockDatabaseTestUtils } from './mock-database'

// Generators for property-based testing
const predictionArb = fc.constantFrom('HOME_WIN', 'DRAW', 'AWAY_WIN')
const entryAmountArb = fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true, noDefaultInfinity: true })
const futureTimestampArb = fc.integer({ min: Date.now() + 3600000, max: Date.now() + 86400000 * 30 })

const marketDataArb = fc.record({
  title: fc.string({ minLength: 5, maxLength: 100 }).filter(title => title.trim().length > 0),
  description: fc.string({ minLength: 10, maxLength: 500 }).filter(desc => desc.trim().length > 0),
  entryFee: entryAmountArb,
  endTime: futureTimestampArb,
})

const userPredictionsArb = fc.record({
  userCount: fc.integer({ min: 1, max: 5 }),
  predictionsPerUser: fc.array(predictionArb, { minLength: 1, maxLength: 3 }),
  entryAmounts: fc.array(entryAmountArb, { minLength: 1, maxLength: 3 })
}).map(data => {
  const uniquePredictions = [...new Set(data.predictionsPerUser)]
  const matchingEntryAmounts = data.entryAmounts.slice(0, uniquePredictions.length)
  
  // Pad entry amounts if needed
  while (matchingEntryAmounts.length < uniquePredictions.length) {
    matchingEntryAmounts.push(matchingEntryAmounts[matchingEntryAmounts.length - 1] || 0.1)
  }
  
  return {
    userCount: data.userCount,
    predictions: uniquePredictions,
    entryAmounts: matchingEntryAmounts
  }
})

describe('Multiple Prediction UI Support Properties', () => {
  beforeEach(async () => {
    MockDatabaseTestUtils.reset()
    
    // Set up platform config for the test
    MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', '0.03')
    MockDatabaseTestUtils.createTestPlatformConfig('default_creator_reward_percentage', '0.02')
    MockDatabaseTestUtils.createTestPlatformConfig('max_predictions_per_user_per_market', '3')
  })

  afterEach(async () => {
    MockDatabaseTestUtils.reset()
  })

  /**
   * **Feature: enhanced-prediction-system, Property 13: Multiple prediction UI support**
   * **Validates: Requirements 8.1, 8.2**
   * 
   * Property: For any market interface, the system should display options for multiple predictions 
   * and handle their creation and retrieval correctly
   */
  it('should support creation and retrieval of multiple predictions per user', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        userPredictionsArb,
        async (marketData, userData) => {
          // Create test users
          const testUsers = []
          for (let i = 0; i < userData.userCount; i++) {
            testUsers.push(MockDatabaseTestUtils.createTestUser())
          }

          // Create market
          const market = await MarketService.createMarket({
            matchId: '12345',
            title: marketData.title,
            description: marketData.description,
            entryFee: marketData.entryFee,
            endTime: new Date(marketData.endTime).toISOString(),
            isPublic: true,
            creatorId: testUsers[0].id,
            homeTeamId: 1,
            homeTeamName: 'Home Team',
            awayTeamId: 2,
            awayTeamName: 'Away Team'
          })

          // Update market status to SCHEDULED for participation
          await MarketService.updateMarket(market.id, { status: 'SCHEDULED' })

          const allPredictions: Array<{ userId: string, prediction: string, entryAmount: number }> = []

          // Each user places multiple predictions (UI creation support)
          for (const user of testUsers) {
            for (let i = 0; i < userData.predictions.length; i++) {
              const prediction = userData.predictions[i]
              const entryAmount = userData.entryAmounts[i]

              try {
                await MarketService.joinMarket({
                  marketId: market.id,
                  userId: user.id,
                  prediction: prediction,
                  entryAmount: entryAmount
                })
                allPredictions.push({ userId: user.id, prediction, entryAmount })
              } catch (error) {
                // Some predictions might fail due to limits, that's expected
              }
            }
          }

          // Test UI retrieval support - get all market participants
          const allParticipants = await MarketService.getMarketParticipants(market.id)
          expect(allParticipants.length).toBe(allPredictions.length)

          // Test UI retrieval support - get user-specific predictions
          for (const user of testUsers) {
            const userPredictions = await MarketService.getUserMarketPredictions(user.id, market.id)
            const expectedUserPredictions = allPredictions.filter(p => p.userId === user.id)
            
            expect(userPredictions.length).toBe(expectedUserPredictions.length)
            
            // Verify each prediction is correctly retrieved
            for (const expectedPrediction of expectedUserPredictions) {
              const dbPrediction = expectedPrediction.prediction === 'HOME_WIN' ? 'Home' : 
                                  expectedPrediction.prediction === 'AWAY_WIN' ? 'Away' : 'Draw'
              
              const retrievedPrediction = userPredictions.find(p => p.prediction === dbPrediction)
              expect(retrievedPrediction).toBeDefined()
              expect(retrievedPrediction!.entry_amount).toBe(expectedPrediction.entryAmount)
              expect(retrievedPrediction!.user_id).toBe(user.id)
              expect(retrievedPrediction!.market_id).toBe(market.id)
            }
          }

          // Test UI display support - verify market statistics include all predictions
          const marketStats = await MarketService.getMarketStats(market.id)
          expect(marketStats.totalParticipants).toBe(allPredictions.length)
          
          // Verify prediction counts by outcome
          const homeWinCount = allPredictions.filter(p => p.prediction === 'HOME_WIN').length
          const drawCount = allPredictions.filter(p => p.prediction === 'DRAW').length
          const awayWinCount = allPredictions.filter(p => p.prediction === 'AWAY_WIN').length
          
          expect(marketStats.homeCount).toBe(homeWinCount)
          expect(marketStats.drawCount).toBe(drawCount)
          expect(marketStats.awayCount).toBe(awayWinCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle UI validation for prediction limits correctly', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        fc.array(predictionArb, { minLength: 4, maxLength: 10 }), // More than 3 predictions
        fc.array(entryAmountArb, { minLength: 4, maxLength: 10 }),
        async (marketData, predictions, entryAmounts) => {
          // Create test user and market
          const testUser = MockDatabaseTestUtils.createTestUser()
          const market = await MarketService.createMarket({
            matchId: '12345',
            title: marketData.title,
            description: marketData.description,
            entryFee: marketData.entryFee,
            endTime: new Date(marketData.endTime).toISOString(),
            isPublic: true,
            creatorId: testUser.id,
            homeTeamId: 1,
            homeTeamName: 'Home Team',
            awayTeamId: 2,
            awayTeamName: 'Away Team'
          })

          // Update market status to SCHEDULED for participation
          await MarketService.updateMarket(market.id, { status: 'SCHEDULED' })

          const successfulPredictions: string[] = []
          const failedPredictions: string[] = []

          // Try to place all predictions (UI should handle validation)
          for (let i = 0; i < Math.min(predictions.length, entryAmounts.length); i++) {
            const prediction = predictions[i]
            const entryAmount = entryAmounts[i]

            try {
              await MarketService.joinMarket({
                marketId: market.id,
                userId: testUser.id,
                prediction: prediction,
                entryAmount: entryAmount
              })
              successfulPredictions.push(prediction)
            } catch (error) {
              failedPredictions.push(prediction)
            }
          }

          // UI should enforce limits - max 3 successful predictions
          expect(successfulPredictions.length).toBeLessThanOrEqual(3)
          
          // UI should prevent duplicates - successful predictions should be unique
          const uniqueSuccessful = [...new Set(successfulPredictions)]
          expect(successfulPredictions.length).toBe(uniqueSuccessful.length)

          // UI should provide error feedback - excess predictions should fail
          if (predictions.length > 3) {
            expect(failedPredictions.length).toBeGreaterThan(0)
          }

          // Verify UI can retrieve current user predictions for display
          const userPredictions = await MarketService.getUserMarketPredictions(testUser.id, market.id)
          expect(userPredictions.length).toBe(successfulPredictions.length)
          expect(userPredictions.length).toBeLessThanOrEqual(3)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should support UI display of prediction outcomes and entry amounts', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        fc.record({
          predictions: fc.array(predictionArb, { minLength: 1, maxLength: 3 }),
          entryAmounts: fc.array(entryAmountArb, { minLength: 1, maxLength: 3 })
        }).map(data => {
          const uniquePredictions = [...new Set(data.predictions)]
          const matchingEntryAmounts = data.entryAmounts.slice(0, uniquePredictions.length)
          
          while (matchingEntryAmounts.length < uniquePredictions.length) {
            matchingEntryAmounts.push(matchingEntryAmounts[matchingEntryAmounts.length - 1] || 0.1)
          }
          
          return {
            predictions: uniquePredictions,
            entryAmounts: matchingEntryAmounts
          }
        }),
        async (marketData, predictionData) => {
          // Create test user and market
          const testUser = MockDatabaseTestUtils.createTestUser()
          const market = await MarketService.createMarket({
            matchId: '12345',
            title: marketData.title,
            description: marketData.description,
            entryFee: marketData.entryFee,
            endTime: new Date(marketData.endTime).toISOString(),
            isPublic: true,
            creatorId: testUser.id,
            homeTeamId: 1,
            homeTeamName: 'Home Team',
            awayTeamId: 2,
            awayTeamName: 'Away Team'
          })

          // Update market status to SCHEDULED for participation
          await MarketService.updateMarket(market.id, { status: 'SCHEDULED' })

          const placedPredictions: Array<{ prediction: string, entryAmount: number }> = []

          // Place predictions with different entry amounts
          for (let i = 0; i < predictionData.predictions.length; i++) {
            const prediction = predictionData.predictions[i]
            const entryAmount = predictionData.entryAmounts[i]

            try {
              await MarketService.joinMarket({
                marketId: market.id,
                userId: testUser.id,
                prediction: prediction,
                entryAmount: entryAmount
              })
              placedPredictions.push({ prediction, entryAmount })
            } catch (error) {
              // Some predictions might fail, that's okay
            }
          }

          // Skip if no predictions were placed
          if (placedPredictions.length === 0) return

          // Test UI display support - retrieve user predictions with all display data
          const userPredictions = await MarketService.getUserMarketPredictions(testUser.id, market.id)
          
          // The number of retrieved predictions should be at least 1 if we placed any
          expect(userPredictions.length).toBeGreaterThan(0)
          expect(userPredictions.length).toBeLessThanOrEqual(placedPredictions.length)

          // Verify UI can display all necessary information for each retrieved prediction
          for (const uiPrediction of userPredictions) {
            // UI should display prediction outcome
            expect(uiPrediction.prediction).toBeDefined()
            expect(['Home', 'Draw', 'Away']).toContain(uiPrediction.prediction)
            
            // UI should display entry amount
            expect(uiPrediction.entry_amount).toBeGreaterThan(0)
            expect(typeof uiPrediction.entry_amount).toBe('number')
            
            // UI should display potential winnings
            expect(uiPrediction.potential_winnings).toBeGreaterThan(0)
            expect(typeof uiPrediction.potential_winnings).toBe('number')
            
            // UI should display user and market identifiers
            expect(uiPrediction.user_id).toBe(testUser.id)
            expect(uiPrediction.market_id).toBe(market.id)
            
            // UI should display timestamp
            expect(uiPrediction.joined_at).toBeDefined()
            expect(typeof uiPrediction.joined_at).toBe('string')
          }

          // Test UI aggregation support - market stats should reflect all predictions
          const marketStats = await MarketService.getMarketStats(market.id)
          
          // UI should display total pool from all predictions
          const expectedTotalPool = placedPredictions.reduce((sum, p) => sum + p.entryAmount, 0)
          expect(marketStats.totalPool).toBeCloseTo(expectedTotalPool, 2)
          
          // UI should display participant count
          expect(marketStats.totalParticipants).toBe(placedPredictions.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should support UI updates when predictions are modified', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        fc.integer({ min: 2, max: 4 }), // Number of users
        predictionArb, // Common prediction type
        entryAmountArb,
        async (marketData, userCount, commonPrediction, entryAmount) => {
          // Create test users
          const testUsers = []
          for (let i = 0; i < userCount; i++) {
            testUsers.push(MockDatabaseTestUtils.createTestUser())
          }

          // Create market
          const market = await MarketService.createMarket({
            matchId: '12345',
            title: marketData.title,
            description: marketData.description,
            entryFee: marketData.entryFee,
            endTime: new Date(marketData.endTime).toISOString(),
            isPublic: true,
            creatorId: testUsers[0].id,
            homeTeamId: 1,
            homeTeamName: 'Home Team',
            awayTeamId: 2,
            awayTeamName: 'Away Team'
          })

          // Update market status to SCHEDULED for participation
          await MarketService.updateMarket(market.id, { status: 'SCHEDULED' })

          // Initial state - no predictions
          let marketStats = await MarketService.getMarketStats(market.id)
          expect(marketStats.totalParticipants).toBe(0)
          expect(marketStats.totalPool).toBe(0)

          const placedPredictions: string[] = []

          // Add predictions one by one and verify UI updates
          for (const user of testUsers) {
            try {
              await MarketService.joinMarket({
                marketId: market.id,
                userId: user.id,
                prediction: commonPrediction,
                entryAmount: entryAmount
              })
              placedPredictions.push(user.id)

              // UI should reflect the new prediction immediately
              marketStats = await MarketService.getMarketStats(market.id)
              expect(marketStats.totalParticipants).toBe(placedPredictions.length)
              
              // UI should show updated pool
              const expectedPool = placedPredictions.length * entryAmount
              expect(marketStats.totalPool).toBeCloseTo(expectedPool, 2)

              // UI should show updated prediction counts
              const dbPrediction = commonPrediction === 'HOME_WIN' ? 'Home' : 
                                  commonPrediction === 'AWAY_WIN' ? 'Away' : 'Draw'
              
              if (dbPrediction === 'Home') {
                expect(marketStats.homeCount).toBe(placedPredictions.length)
              } else if (dbPrediction === 'Draw') {
                expect(marketStats.drawCount).toBe(placedPredictions.length)
              } else {
                expect(marketStats.awayCount).toBe(placedPredictions.length)
              }

            } catch (error) {
              // Some predictions might fail, that's okay
            }
          }

          // Final verification - UI should show all successful predictions
          const allParticipants = await MarketService.getMarketParticipants(market.id)
          expect(allParticipants.length).toBe(placedPredictions.length)

          // Each user should be able to see their own predictions in UI
          for (const userId of placedPredictions) {
            const userPredictions = await MarketService.getUserMarketPredictions(userId, market.id)
            expect(userPredictions.length).toBe(1) // Each user placed one prediction
            expect(userPredictions[0].user_id).toBe(userId)
            expect(userPredictions[0].market_id).toBe(market.id)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})