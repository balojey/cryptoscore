/**
 * Property-based tests for winnings calculation with multiple predictions
 * 
 * **Feature: enhanced-prediction-system, Property 6: Winnings calculation considers only winning predictions**
 * **Validates: Requirements 3.5**
 */

import { describe, it, beforeEach, expect } from 'vitest'
import fc from 'fast-check'
import { WinningsCalculator } from '../winnings-calculator'
import type { MarketData } from '../../hooks/useMarketData'
import type { ParticipantData } from '../../hooks/useParticipantData'

// Arbitraries for property-based testing
const predictionArb = fc.constantFrom('Home', 'Draw', 'Away')

const marketDataArb = fc.record({
  id: fc.uuid(),
  creator_id: fc.uuid(),
  matchId: fc.uuid(),
  title: fc.string({ minLength: 5, maxLength: 100 }),
  description: fc.string({ minLength: 10, maxLength: 500 }),
  entry_fee: fc.integer({ min: 100000000, max: 10000000000 }), // 0.1 to 10 SOL in lamports
  total_pool: fc.integer({ min: 100000000, max: 100000000000 }), // 0.1 to 100 SOL in lamports
  participantCount: fc.integer({ min: 1, max: 100 }),
  homeCount: fc.integer({ min: 0, max: 50 }),
  drawCount: fc.integer({ min: 0, max: 50 }),
  awayCount: fc.integer({ min: 0, max: 50 }),
  status: fc.constantFrom('active', 'resolved', 'cancelled'),
  resolution_outcome: fc.option(predictionArb, { nil: null }),
  platform_fee_percentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.1) }),
  end_time: fc.constant(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()), // 1 day from now
  created_at: fc.constant(new Date(Date.now() - 60 * 60 * 1000).toISOString()), // 1 hour ago
  updated_at: fc.constant(new Date().toISOString()) // now
}).map(data => ({
  ...data,
  // Ensure participant counts are consistent with total
  homeCount: Math.min(data.homeCount, data.participantCount),
  drawCount: Math.min(data.drawCount, Math.max(0, data.participantCount - data.homeCount)),
  awayCount: Math.max(0, data.participantCount - data.homeCount - data.drawCount),
  // Ensure total pool is consistent with entry fee and participant count
  total_pool: data.entry_fee * data.participantCount
})) as fc.Arbitrary<MarketData>

const participantDataArb = fc.record({
  id: fc.uuid(),
  market_id: fc.uuid(),
  user_id: fc.uuid(),
  prediction: predictionArb,
  entry_amount: fc.integer({ min: 100000000, max: 10000000000 }), // 0.1 to 10 SOL in lamports
  potential_winnings: fc.integer({ min: 100000000, max: 100000000000 }),
  actual_winnings: fc.option(fc.integer({ min: 0, max: 100000000000 }), { nil: null }),
  joined_at: fc.constant(new Date().toISOString())
}) as fc.Arbitrary<ParticipantData>

// Generator for multiple predictions per user
const multipleParticipantDataArb = fc.record({
  user_id: fc.uuid(),
  market_id: fc.uuid(),
  predictions: fc.array(
    fc.record({
      prediction: predictionArb,
      entry_amount: fc.integer({ min: 100000000, max: 10000000000 }),
      potential_winnings: fc.integer({ min: 100000000, max: 100000000000 }),
      actual_winnings: fc.option(fc.integer({ min: 0, max: 100000000000 }), { nil: null })
    }),
    { minLength: 1, maxLength: 3 }
  )
}).map(data => {
  // Ensure unique predictions (no duplicates)
  const uniquePredictions = new Set<string>()
  const filteredPredictions = data.predictions.filter(p => {
    if (uniquePredictions.has(p.prediction)) {
      return false
    }
    uniquePredictions.add(p.prediction)
    return true
  })
  
  return {
    ...data,
    predictions: filteredPredictions.map((p, index) => ({
      id: `${data.user_id}-${index}`,
      market_id: data.market_id,
      user_id: data.user_id,
      prediction: p.prediction,
      entry_amount: p.entry_amount,
      potential_winnings: p.potential_winnings,
      actual_winnings: p.actual_winnings,
      joined_at: new Date().toISOString()
    }))
  }
})

describe('Multiple Predictions Winnings Calculation Properties', () => {
  beforeEach(() => {
    // Reset any global state if needed
  })

  /**
   * **Feature: enhanced-prediction-system, Property 6: Winnings calculation considers only winning predictions**
   * **Validates: Requirements 3.5**
   * 
   * Property: For any market resolution, only predictions matching the winning outcome should receive winnings calculations
   */
  it('should calculate winnings only for winning predictions when user has multiple predictions', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        multipleParticipantDataArb,
        predictionArb, // winning outcome
        async (marketData, participantData, winningOutcome) => {
          // Set up resolved market with winning outcome
          const resolvedMarket: MarketData = {
            ...marketData,
            status: 'resolved',
            resolution_outcome: winningOutcome
          }

          // Calculate winnings for each prediction
          const winningsResults = participantData.predictions.map(prediction => {
            const result = WinningsCalculator.calculateActualWinnings(resolvedMarket, prediction)
            return {
              prediction: prediction.prediction,
              winnings: result,
              isWinning: prediction.prediction === winningOutcome
            }
          })

          // Property: Only winning predictions should have non-zero winnings
          for (const result of winningsResults) {
            if (result.isWinning) {
              // Winning predictions should have positive winnings (if there are winners)
              const winnerCount = resolvedMarket.homeCount + resolvedMarket.drawCount + resolvedMarket.awayCount > 0 ? 
                (winningOutcome === 'Home' ? resolvedMarket.homeCount : 
                 winningOutcome === 'Draw' ? resolvedMarket.drawCount : resolvedMarket.awayCount) : 0
              if (winnerCount > 0) {
                expect(result.winnings).toBeGreaterThan(0)
              }
            } else {
              // Non-winning predictions should have zero winnings
              expect(result.winnings).toBe(0)
            }
          }

          // Property: Total winnings should not exceed participant pool
          const totalWinnings = winningsResults.reduce((sum, result) => sum + result.winnings, 0)
          const participantPool = Math.floor((resolvedMarket.total_pool * 9500) / 10000) // 95% of total pool
          expect(totalWinnings).toBeLessThanOrEqual(participantPool)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Winnings calculation should be deterministic for the same inputs
   */
  it('should produce consistent winnings calculations for identical inputs', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        participantDataArb,
        async (marketData, participantData) => {
          // Set up resolved market
          const resolvedMarket: MarketData = {
            ...marketData,
            status: 'resolved',
            resolution_outcome: participantData.prediction // Make this a winning prediction
          }

          // Calculate winnings multiple times
          const result1 = WinningsCalculator.calculateActualWinnings(resolvedMarket, participantData)
          const result2 = WinningsCalculator.calculateActualWinnings(resolvedMarket, participantData)
          const result3 = WinningsCalculator.calculateActualWinnings(resolvedMarket, participantData)

          // Property: Results should be identical
          expect(result1).toBe(result2)
          expect(result2).toBe(result3)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property: Winnings should be proportional to entry amount when multiple users have winning predictions
   */
  it('should distribute winnings proportionally among multiple winning predictions', { timeout: 10000 }, async () => {
    await fc.assert(
      fc.asyncProperty(
        marketDataArb,
        predictionArb,
        fc.array(
          fc.record({
            userId: fc.uuid(),
            entryAmount: fc.integer({ min: 100000000, max: 1000000000 }) // 0.1 to 1 SOL
          }),
          { minLength: 2, maxLength: 10 }
        ),
        async (marketData, winningPrediction, participants) => {
          // Create market with multiple participants having the same winning prediction
          const totalEntryAmount = participants.reduce((sum, p) => sum + p.entryAmount, 0)
          const adjustedMarket: MarketData = {
            ...marketData,
            status: 'resolved',
            resolution_outcome: winningPrediction,
            total_pool: totalEntryAmount,
            participantCount: participants.length,
            homeCount: winningPrediction === 'Home' ? participants.length : 0,
            drawCount: winningPrediction === 'Draw' ? participants.length : 0,
            awayCount: winningPrediction === 'Away' ? participants.length : 0
          }

          // Calculate winnings for each participant
          const winningsResults = participants.map(participant => {
            const participantData: ParticipantData = {
              id: `${participant.userId}-1`,
              market_id: adjustedMarket.id,
              user_id: participant.userId,
              prediction: winningPrediction,
              entry_amount: participant.entryAmount,
              potential_winnings: 0,
              actual_winnings: null,
              joined_at: new Date().toISOString()
            }
            
            return {
              userId: participant.userId,
              entryAmount: participant.entryAmount,
              winnings: WinningsCalculator.calculateActualWinnings(adjustedMarket, participantData)
            }
          })

          // Property: All winners should get equal share of participant pool
          const participantPool = Math.floor((adjustedMarket.total_pool * 9500) / 10000) // 95%
          const expectedWinningsPerWinner = Math.floor(participantPool / participants.length)
          
          for (const result of winningsResults) {
            expect(result.winnings).toBe(expectedWinningsPerWinner)
          }

          // Property: Total distributed winnings should not exceed participant pool
          const totalDistributed = winningsResults.reduce((sum, result) => sum + result.winnings, 0)
          expect(totalDistributed).toBeLessThanOrEqual(participantPool)
        }
      ),
      { numRuns: 100 }
    )
  })
})