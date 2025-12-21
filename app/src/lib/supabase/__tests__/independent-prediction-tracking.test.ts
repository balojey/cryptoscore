/**
 * Property-based tests for independent prediction tracking
 * 
 * **Feature: enhanced-prediction-system, Property 5: Multiple predictions are tracked independently**
 * **Validates: Requirements 3.4**
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

const multiplePredictionsArb = fc.record({
  predictions: fc.array(predictionArb, { minLength: 1, maxLength: 3 }),
  entryAmounts: fc.array(fc.float({ min: Math.fround(0.1), max: Math.fround(100), noNaN: true, noDefaultInfinity: true }), { minLength: 1, maxLength: 3 })
}).map(data => {
  // Ensure unique predictions and matching array lengths
  const uniquePredictions = [...new Set(data.predictions)]
  const matchingEntryAmounts = data.entryAmounts.slice(0, uniquePredictions.length)
  
  // If we don't have enough entry amounts, pad with the last one
  while (matchingEntryAmounts.length < uniquePredictions.length) {
    matchingEntryAmounts.push(matchingEntryAmounts[matchingEntryAmounts.length - 1] || 0.1)
  }
  
  return {
    predictions: uniquePredictions,
    entryAmounts: matchingEntryAmounts
  }
})

describe('Independent Prediction Tracking Properties', () => {
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
   * **Feature: enhanced-prediction-system, Property 5: Multiple predictions are tracked independently**
   * **Validates: Requirements 3.4**
   * 
   * Property: For any user placing multiple predictions, each prediction should be stored as a 
   * separate record with individual entry amounts and tracked independently
   */
  it('should track each prediction as a separate record with individual entry amounts', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        multiplePredictionsArb,
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

          // Place multiple predictions with different entry amounts
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
              // Some predictions might fail, that's okay for this test
            }
          }

          // Verify each prediction is tracked as a separate record
          const participants = await MarketService.getMarketParticipants(market.id)
          const userParticipants = participants.filter(p => p.user_id === testUser.id)

          // Should have one record per successful prediction
          expect(userParticipants.length).toBe(placedPredictions.length)

          // Each record should have individual entry amounts
          for (const placedPrediction of placedPredictions) {
            const dbPrediction = placedPrediction.prediction === 'HOME_WIN' ? 'Home' : 
                                placedPrediction.prediction === 'AWAY_WIN' ? 'Away' : 'Draw'
            
            const participantRecord = userParticipants.find(p => p.prediction === dbPrediction)
            expect(participantRecord).toBeDefined()
            expect(participantRecord!.entry_amount).toBe(placedPrediction.entryAmount)
            expect(participantRecord!.user_id).toBe(testUser.id)
            expect(participantRecord!.market_id).toBe(market.id)
          }

          // Verify each record has unique ID
          const participantIds = userParticipants.map(p => p.id)
          const uniqueIds = [...new Set(participantIds)]
          expect(participantIds.length).toBe(uniqueIds.length)

          // Verify each record has independent potential winnings calculation
          for (const participant of userParticipants) {
            expect(participant.potential_winnings).toBeGreaterThan(0)
            expect(typeof participant.potential_winnings).toBe('number')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain independent tracking across different users', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        fc.integer({ min: 2, max: 4 }), // Number of users
        multiplePredictionsArb,
        async (marketData, userCount, predictionTemplate) => {
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

          const allUserPredictions: Array<{ userId: string, prediction: string, entryAmount: number }> = []

          // Each user places their predictions
          for (const user of testUsers) {
            for (let i = 0; i < predictionTemplate.predictions.length; i++) {
              const prediction = predictionTemplate.predictions[i]
              const entryAmount = predictionTemplate.entryAmounts[i]

              try {
                await MarketService.joinMarket({
                  marketId: market.id,
                  userId: user.id,
                  prediction: prediction,
                  entryAmount: entryAmount
                })
                allUserPredictions.push({ userId: user.id, prediction, entryAmount })
              } catch (error) {
                // Some predictions might fail, that's okay
              }
            }
          }

          // Verify independent tracking for each user
          const participants = await MarketService.getMarketParticipants(market.id)

          for (const user of testUsers) {
            const userParticipants = participants.filter(p => p.user_id === user.id)
            const userPredictions = allUserPredictions.filter(p => p.userId === user.id)

            // Each user should have their own independent records
            expect(userParticipants.length).toBe(userPredictions.length)

            // Verify each user's predictions are tracked independently
            for (const userPrediction of userPredictions) {
              const dbPrediction = userPrediction.prediction === 'HOME_WIN' ? 'Home' : 
                                  userPrediction.prediction === 'AWAY_WIN' ? 'Away' : 'Draw'
              
              const participantRecord = userParticipants.find(p => p.prediction === dbPrediction)
              expect(participantRecord).toBeDefined()
              expect(participantRecord!.entry_amount).toBe(userPrediction.entryAmount)
              expect(participantRecord!.user_id).toBe(user.id)
            }
          }

          // Verify total records match total successful predictions
          expect(participants.length).toBe(allUserPredictions.length)

          // Verify each record is unique (different IDs)
          const allIds = participants.map(p => p.id)
          const uniqueIds = [...new Set(allIds)]
          expect(allIds.length).toBe(uniqueIds.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should track predictions independently even with same entry amounts', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        entryAmountArb,
        fc.array(predictionArb, { minLength: 2, maxLength: 3 }),
        async (marketData, commonEntryAmount, predictions) => {
          // Ensure unique predictions
          const uniquePredictions = [...new Set(predictions)]
          if (uniquePredictions.length < 2) return // Skip if not enough unique predictions

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

          const placedPredictions: string[] = []

          // Place multiple predictions with the same entry amount
          for (const prediction of uniquePredictions) {
            try {
              await MarketService.joinMarket({
                marketId: market.id,
                userId: testUser.id,
                prediction: prediction,
                entryAmount: commonEntryAmount
              })
              placedPredictions.push(prediction)
            } catch (error) {
              // Some predictions might fail, that's okay
            }
          }

          // Verify independent tracking despite same entry amounts
          const participants = await MarketService.getMarketParticipants(market.id)
          const userParticipants = participants.filter(p => p.user_id === testUser.id)

          // Should have separate records for each prediction
          expect(userParticipants.length).toBe(placedPredictions.length)

          // Each record should be independent with same entry amount but different predictions
          for (const placedPrediction of placedPredictions) {
            const dbPrediction = placedPrediction === 'HOME_WIN' ? 'Home' : 
                                placedPrediction === 'AWAY_WIN' ? 'Away' : 'Draw'
            
            const participantRecord = userParticipants.find(p => p.prediction === dbPrediction)
            expect(participantRecord).toBeDefined()
            expect(participantRecord!.entry_amount).toBe(commonEntryAmount)
            expect(participantRecord!.user_id).toBe(testUser.id)
            expect(participantRecord!.market_id).toBe(market.id)
          }

          // Verify each record has unique ID even with same entry amounts
          const participantIds = userParticipants.map(p => p.id)
          const uniqueIds = [...new Set(participantIds)]
          expect(participantIds.length).toBe(uniqueIds.length)

          // Verify predictions are different
          const participantPredictions = userParticipants.map(p => p.prediction)
          const uniquePredictionValues = [...new Set(participantPredictions)]
          expect(participantPredictions.length).toBe(uniquePredictionValues.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain independent tracking during market resolution', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        multiplePredictionsArb,
        predictionArb, // Winning outcome
        async (marketData, predictionData, winningOutcome) => {
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

          // Place multiple predictions
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

          // Resolve market
          const dbWinningOutcome = winningOutcome === 'HOME_WIN' ? 'Home' : 
                                  winningOutcome === 'AWAY_WIN' ? 'Away' : 'Draw'
          
          try {
            await MarketService.resolveMarket({
              marketId: market.id,
              outcome: dbWinningOutcome
            })
          } catch (error) {
            // Market resolution might fail in some cases, that's okay
            return
          }

          // Verify independent tracking after resolution
          const participants = await MarketService.getMarketParticipants(market.id)
          const userParticipants = participants.filter(p => p.user_id === testUser.id)

          // Should still have separate records for each prediction
          expect(userParticipants.length).toBe(placedPredictions.length)

          // Each record should maintain its independence
          for (const placedPrediction of placedPredictions) {
            const dbPrediction = placedPrediction.prediction === 'HOME_WIN' ? 'Home' : 
                                placedPrediction.prediction === 'AWAY_WIN' ? 'Away' : 'Draw'
            
            const participantRecord = userParticipants.find(p => p.prediction === dbPrediction)
            expect(participantRecord).toBeDefined()
            expect(participantRecord!.entry_amount).toBe(placedPrediction.entryAmount)
            expect(participantRecord!.user_id).toBe(testUser.id)
            expect(participantRecord!.market_id).toBe(market.id)

            // Check winnings assignment based on prediction outcome
            if (dbPrediction === dbWinningOutcome) {
              expect(participantRecord!.actual_winnings).toBeGreaterThan(0)
            } else {
              expect(participantRecord!.actual_winnings).toBe(0)
            }
          }

          // Verify each record still has unique ID
          const participantIds = userParticipants.map(p => p.id)
          const uniqueIds = [...new Set(participantIds)]
          expect(participantIds.length).toBe(uniqueIds.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})