/**
 * Property-based tests for multiple predictions enforcement
 * 
 * **Feature: enhanced-prediction-system, Property 4: Multiple predictions per user are enforced**
 * **Validates: Requirements 3.1, 3.2**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { MarketService } from '../market-service'
import { MockDatabaseTestUtils } from './mock-database'

// Generators for property-based testing
const predictionArb = fc.constantFrom('HOME_WIN', 'DRAW', 'AWAY_WIN')
const entryAmountArb = fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true, noDefaultInfinity: true })
const futureTimestampArb = fc.integer({ min: Date.now() + 3600000, max: Date.now() + 86400000 * 30 })

const marketDataArb = fc.record({
  title: fc.string({ minLength: 5, maxLength: 100 }).filter(title => title.trim().length > 0),
  description: fc.string({ minLength: 10, maxLength: 500 }).filter(desc => desc.trim().length > 0),
  entryFee: entryAmountArb,
  endTime: futureTimestampArb,
})

const multiPredictionArb = fc.record({
  predictions: fc.array(predictionArb, { minLength: 1, maxLength: 5 }),
  entryAmounts: fc.array(fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true, noDefaultInfinity: true }), { minLength: 1, maxLength: 5 })
}).map(data => ({
  predictions: data.predictions,
  entryAmounts: data.entryAmounts.slice(0, data.predictions.length) // Ensure same length
}))

describe('Multiple Predictions Enforcement Properties', () => {
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
   * **Feature: enhanced-prediction-system, Property 4: Multiple predictions per user are enforced**
   * **Validates: Requirements 3.1, 3.2**
   * 
   * Property: For any user and market combination, the system should allow up to 3 predictions 
   * (one per outcome) and prevent duplicate predictions for the same outcome
   */
  it('should allow up to 3 predictions per user per market (one per outcome)', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        multiPredictionArb,
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

          const uniquePredictions = [...new Set(predictionData.predictions)]
          const successfulPredictions: string[] = []
          const failedPredictions: string[] = []

          // Try to place all predictions
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
              successfulPredictions.push(prediction)
            } catch (error) {
              failedPredictions.push(prediction)
            }
          }

          // Verify that only unique predictions succeeded (max 3, one per outcome)
          const uniqueSuccessful = [...new Set(successfulPredictions)]
          expect(uniqueSuccessful.length).toBeLessThanOrEqual(3)
          expect(uniqueSuccessful.length).toBe(Math.min(uniquePredictions.length, 3))

          // Verify that duplicate predictions failed
          const duplicateAttempts = predictionData.predictions.length - uniquePredictions.length
          expect(failedPredictions.length).toBeGreaterThanOrEqual(duplicateAttempts)

          // Verify each outcome can only have one prediction
          const participants = await MarketService.getMarketParticipants(market.id)
          const userParticipants = participants.filter(p => p.user_id === testUser.id)
          
          const predictionCounts = userParticipants.reduce((counts, p) => {
            counts[p.prediction] = (counts[p.prediction] || 0) + 1
            return counts
          }, {} as Record<string, number>)

          // Each prediction outcome should appear at most once
          for (const count of Object.values(predictionCounts)) {
            expect(count).toBe(1)
          }

          // Total predictions should not exceed 3
          expect(userParticipants.length).toBeLessThanOrEqual(3)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should prevent more than 3 predictions per user per market', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        fc.array(fc.float({ min: Math.fround(0.01), max: Math.fround(100), noNaN: true, noDefaultInfinity: true }), { minLength: 4, maxLength: 10 }),
        async (marketData, entryAmounts) => {
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

          const predictions: ('HOME_WIN' | 'DRAW' | 'AWAY_WIN')[] = ['HOME_WIN', 'DRAW', 'AWAY_WIN']
          let successfulPredictions = 0
          let failedPredictions = 0

          // First, place one prediction for each outcome (should succeed)
          for (let i = 0; i < 3; i++) {
            try {
              await MarketService.joinMarket({
                marketId: market.id,
                userId: testUser.id,
                prediction: predictions[i],
                entryAmount: entryAmounts[i]
              })
              successfulPredictions++
            } catch (error) {
              failedPredictions++
            }
          }

          // Verify first 3 predictions succeeded
          expect(successfulPredictions).toBe(3)

          // Now try to place additional predictions (should fail)
          for (let i = 3; i < entryAmounts.length; i++) {
            const prediction = predictions[i % 3] as 'HOME_WIN' | 'DRAW' | 'AWAY_WIN' // Cycle through predictions
            
            try {
              await MarketService.joinMarket({
                marketId: market.id,
                userId: testUser.id,
                prediction: prediction,
                entryAmount: entryAmounts[i]
              })
              // If we reach here, the prediction succeeded when it shouldn't have
              expect(true).toBe(false) // Force failure
            } catch (error) {
              // This is expected - additional predictions should fail
              failedPredictions++
            }
          }

          // Verify that additional predictions failed
          expect(failedPredictions).toBe(entryAmounts.length - 3)

          // Verify total predictions is exactly 3
          const participants = await MarketService.getMarketParticipants(market.id)
          const userParticipants = participants.filter(p => p.user_id === testUser.id)
          expect(userParticipants.length).toBe(3)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should allow different users to place multiple predictions on the same market', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        fc.integer({ min: 2, max: 5 }), // Number of users
        fc.array(predictionArb, { minLength: 1, maxLength: 3 }), // Predictions per user
        async (marketData, userCount, predictionsPerUser) => {
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

          let totalSuccessfulPredictions = 0

          // Each user places their predictions
          for (const user of testUsers) {
            const uniquePredictions = [...new Set(predictionsPerUser)]
            
            for (const prediction of uniquePredictions) {
              try {
                await MarketService.joinMarket({
                  marketId: market.id,
                  userId: user.id,
                  prediction: prediction,
                  entryAmount: 0.1
                })
                totalSuccessfulPredictions++
              } catch (error) {
                // Some predictions might fail, that's okay
              }
            }
          }

          // Verify that multiple users can participate
          const participants = await MarketService.getMarketParticipants(market.id)
          expect(participants.length).toBe(totalSuccessfulPredictions)

          // Verify each user has at most 3 predictions
          for (const user of testUsers) {
            const userParticipants = participants.filter(p => p.user_id === user.id)
            expect(userParticipants.length).toBeLessThanOrEqual(3)

            // Verify no duplicate predictions per user
            const userPredictions = userParticipants.map(p => p.prediction)
            const uniqueUserPredictions = [...new Set(userPredictions)]
            expect(userPredictions.length).toBe(uniqueUserPredictions.length)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})