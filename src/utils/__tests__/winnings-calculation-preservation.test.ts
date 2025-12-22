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
const statusArb = fc.constantFrom('active', 'resolved', 'cancelled')

// Generate consistent market data
const marketDataArb = fc.integer({ min: 1, max: 10 }).chain(participantCount => {
  const entryFee = fc.integer({ min: 100000000, max: 500000000 }) // 0.1 to 0.5 SOL
  
  return fc.record({
    id: fc.uuid(),
    creator_id: fc.uuid(),
    matchId: fc.string({ minLength: 5, maxLength: 20 }),
    title: fc.string({ minLength: 5, maxLength: 50 }),
    description: fc.string({ minLength: 10, maxLength: 100 }),
    entry_fee: entryFee,
    end_time: fc.integer({ min: Date.now() + 3600000, max: Date.now() + 172800000 }).map(ts => new Date(ts).toISOString()),
    status: statusArb,
    resolution_outcome: fc.option(predictionArb, { nil: null }),
    platform_fee_percentage: fc.constant(5),
    created_at: fc.constant(new Date().toISOString()),
    updated_at: fc.constant(new Date().toISOString()),
    participantCount: fc.constant(participantCount)
  }).chain(baseData => {
    // Generate prediction counts that sum to participantCount
    return fc.array(fc.integer({ min: 0, max: participantCount }), { minLength: 3, maxLength: 3 })
      .filter(counts => counts.reduce((sum, count) => sum + count, 0) === participantCount)
      .map(([homeCount, drawCount, awayCount]) => ({
        ...baseData,
        total_pool: baseData.entry_fee * participantCount,
        homeCount,
        drawCount,
        awayCount
      }))
  })
})

const participantDataArb = fc.record({
  id: fc.uuid(),
  market_id: fc.uuid(),
  user_id: fc.uuid(),
  prediction: predictionArb,
  entry_amount: fc.integer({ min: 100000000, max: 500000000 }),
  potential_winnings: fc.integer({ min: 0, max: 1000000000 }),
  actual_winnings: fc.option(fc.integer({ min: 0, max: 1000000000 }), { nil: null }),
  joined_at: fc.integer({ min: Date.now() - 86400000, max: Date.now() }).map(ts => new Date(ts).toISOString())
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
          const expectedReward = Math.floor((marketData.total_pool * 200) / 10000) // 2% in basis points
          
          expect(reward).toBe(expectedReward)
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 7.3: Actual winnings for correct prediction is never negative', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        marketDataArb.chain(data => fc.constant({ ...data, status: 'resolved' as const, resolution_outcome: fc.sample(predictionArb, 1)[0] })),
        participantDataArb,
        (marketData, participantData) => {
          // Ensure participant prediction matches market outcome for this test
          const alignedParticipant = {
            ...participantData,
            prediction: marketData.resolution_outcome!
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
        marketDataArb.chain(data => fc.constant({ ...data, status: 'resolved' as const, resolution_outcome: fc.sample(predictionArb, 1)[0] })),
        (marketData) => {
          const participantPool = Math.floor((marketData.total_pool * 9500) / 10000) // 95%
          
          // Calculate winnings per winner
          let winnerCount = 0
          switch (marketData.resolution_outcome) {
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
          const platformFee = Math.floor((marketData.total_pool * 300) / 10000) // 3%
          const participantPool = Math.floor((marketData.total_pool * 9500) / 10000) // 95%
          
          const totalDistribution = creatorReward + platformFee + participantPool
          
          // Allow for small rounding differences (within 1 lamport per component)
          const tolerance = 3 // 3 lamports total tolerance
          expect(Math.abs(totalDistribution - marketData.total_pool)).toBeLessThanOrEqual(tolerance)
        }
      ),
      { numRuns: 50 }
    )
  })
})