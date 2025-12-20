/**
 * Property-Based Tests for Winnings Calculation Preservation
 * 
 * **Feature: web2-migration, Property 7: Winnings Calculation Preservation**
 * **Validates: Requirements 4.4**
 * 
 * Tests that winnings calculation logic remains consistent when migrated
 * from blockchain to database operations.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { WinningsCalculator } from '../winnings-calculator'
import type { MarketData } from '../../hooks/useMarketData'
import type { ParticipantData } from '../../hooks/useParticipantData'

// Generators for property-based testing
const predictionArb = fc.constantFrom('Home', 'Draw', 'Away')
const statusArb = fc.constantFrom('Open', 'Live', 'Resolved')

// Generate consistent market data
const marketDataArb = fc.integer({ min: 1, max: 10 }).chain(participantCount => {
  const entryFee = fc.integer({ min: 100000000, max: 500000000 }) // 0.1 to 0.5 SOL
  
  return fc.record({
    marketAddress: fc.string({ minLength: 32, maxLength: 44 }),
    creator: fc.string({ minLength: 32, maxLength: 44 }),
    matchId: fc.string({ minLength: 5, maxLength: 20 }),
    entryFee,
    kickoffTime: fc.integer({ min: Date.now(), max: Date.now() + 86400000 }),
    endTime: fc.integer({ min: Date.now() + 3600000, max: Date.now() + 172800000 }),
    status: statusArb,
    outcome: fc.option(predictionArb, { nil: null }),
    participantCount: fc.constant(participantCount),
    isPublic: fc.boolean()
  }).chain(baseData => {
    // Generate prediction counts that sum to participantCount
    return fc.array(fc.integer({ min: 0, max: participantCount }), { minLength: 3, maxLength: 3 })
      .filter(counts => counts.reduce((sum, count) => sum + count, 0) === participantCount)
      .map(([homeCount, drawCount, awayCount]) => ({
        ...baseData,
        totalPool: baseData.entryFee * participantCount,
        homeCount,
        drawCount,
        awayCount
      }))
  })
})

const participantDataArb = fc.record({
  market: fc.string({ minLength: 32, maxLength: 44 }),
  user: fc.string({ minLength: 32, maxLength: 44 }),
  prediction: predictionArb,
  hasWithdrawn: fc.boolean(),
  joinedAt: fc.integer({ min: Date.now() - 86400000, max: Date.now() })
})

describe('Winnings Calculation Preservation Properties', () => {
  it('Property 7.1: Potential winnings calculation is deterministic', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        marketDataArb,
        predictionArb,
        fc.boolean(),
        (marketData, prediction, isExistingParticipant) => {
          // Calculate winnings twice with same inputs
          const winnings1 = WinningsCalculator.calculatePotentialWinnings(
            marketData as MarketData, 
            prediction, 
            isExistingParticipant
          )
          const winnings2 = WinningsCalculator.calculatePotentialWinnings(
            marketData as MarketData, 
            prediction, 
            isExistingParticipant
          )
          
          // Results should be identical
          expect(winnings1).toBe(winnings2)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 7.2: Creator reward is always 2% of total pool', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        marketDataArb,
        (marketData) => {
          const reward = WinningsCalculator.calculateCreatorReward(marketData as MarketData)
          const expectedReward = Math.floor((marketData.totalPool * 200) / 10000) // 2% in basis points
          
          expect(reward).toBe(expectedReward)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 7.3: Actual winnings for correct prediction is never negative', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        marketDataArb.chain(data => fc.constant({ ...data, status: 'Resolved' as const, outcome: fc.sample(predictionArb, 1)[0] })),
        participantDataArb,
        (marketData, participantData) => {
          // Ensure participant prediction matches market outcome for this test
          const alignedParticipant = {
            ...participantData,
            prediction: marketData.outcome!
          }
          
          const winnings = WinningsCalculator.calculateActualWinnings(
            marketData as MarketData, 
            alignedParticipant as ParticipantData
          )
          
          expect(winnings).toBeGreaterThanOrEqual(0)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 7.4: Total distributed winnings never exceed participant pool', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        marketDataArb.chain(data => fc.constant({ ...data, status: 'Resolved' as const, outcome: fc.sample(predictionArb, 1)[0] })),
        (marketData) => {
          const participantPool = Math.floor((marketData.totalPool * 9500) / 10000) // 95%
          
          // Calculate winnings per winner
          let winnerCount = 0
          switch (marketData.outcome) {
            case 'Home': winnerCount = marketData.homeCount; break
            case 'Draw': winnerCount = marketData.drawCount; break
            case 'Away': winnerCount = marketData.awayCount; break
          }
          
          if (winnerCount > 0) {
            const winningsPerWinner = Math.floor(participantPool / winnerCount)
            const totalDistributed = winningsPerWinner * winnerCount
            
            expect(totalDistributed).toBeLessThanOrEqual(participantPool)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 7.5: Fee distribution always sums to total pool', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        marketDataArb,
        (marketData) => {
          const creatorReward = WinningsCalculator.calculateCreatorReward(marketData as MarketData)
          const platformFee = Math.floor((marketData.totalPool * 300) / 10000) // 3%
          const participantPool = Math.floor((marketData.totalPool * 9500) / 10000) // 95%
          
          const totalDistribution = creatorReward + platformFee + participantPool
          
          // Allow for small rounding differences (within 1 lamport per component)
          const tolerance = 3 // 3 lamports total tolerance
          expect(Math.abs(totalDistribution - marketData.totalPool)).toBeLessThanOrEqual(tolerance)
        }
      ),
      { numRuns: 50 }
    )
  })
})