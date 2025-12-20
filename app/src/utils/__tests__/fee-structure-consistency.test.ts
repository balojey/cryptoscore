/**
 * Property-Based Tests for Fee Structure Consistency
 * 
 * **Feature: web2-migration, Property 8: Fee Structure Consistency**
 * **Validates: Requirements 8.1, 8.3**
 * 
 * Tests that fee calculation and platform economics remain consistent
 * when migrated from blockchain to database operations.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { FEE_DISTRIBUTION, BASIS_POINTS_DIVISOR, calculateFeeDistribution } from '../../config/fees'

// Generators for property-based testing (updated for decimal amounts)
const totalPoolArb = fc.float({ min: Math.fround(0.001), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }) // 0.001 to 10000 units

describe('Fee Structure Consistency Properties', () => {
  it('Property 8.1: Creator fee is always exactly 2% of total pool', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        totalPoolArb,
        (totalPool) => {
          const feeDistribution = calculateFeeDistribution(totalPool)
          const expectedCreatorFee = (totalPool * FEE_DISTRIBUTION.CREATOR_FEE_BPS) / BASIS_POINTS_DIVISOR
          
          // Use approximate equality for floating point comparison
          expect(Math.abs(feeDistribution.creatorFee - expectedCreatorFee)).toBeLessThan(0.0001)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8.2: Platform fee is always exactly 3% of total pool', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        totalPoolArb,
        (totalPool) => {
          const feeDistribution = calculateFeeDistribution(totalPool)
          const expectedPlatformFee = (totalPool * FEE_DISTRIBUTION.PLATFORM_FEE_BPS) / BASIS_POINTS_DIVISOR
          
          // Use approximate equality for floating point comparison
          expect(Math.abs(feeDistribution.platformFee - expectedPlatformFee)).toBeLessThan(0.0001)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8.3: Participant pool is calculated correctly as remainder', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        totalPoolArb,
        (totalPool) => {
          const feeDistribution = calculateFeeDistribution(totalPool)
          const expectedParticipantPool = totalPool - feeDistribution.creatorFee - feeDistribution.platformFee
          
          // Use approximate equality for floating point comparison
          expect(Math.abs(feeDistribution.participantPool - expectedParticipantPool)).toBeLessThan(0.0001)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8.4: Fee distribution components always sum to total pool', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        totalPoolArb,
        (totalPool) => {
          const feeDistribution = calculateFeeDistribution(totalPool)
          const sum = feeDistribution.creatorFee + feeDistribution.platformFee + feeDistribution.participantPool
          
          // Use approximate equality for floating point comparison
          expect(Math.abs(sum - totalPool)).toBeLessThan(0.0001)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8.5: Fee percentages are consistent across different pool sizes', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: Math.fround(1), max: Math.fround(10000), noNaN: true, noDefaultInfinity: true }), { minLength: 2, maxLength: 5 }),
        (totalPools) => {
          const distributions = totalPools.map(pool => calculateFeeDistribution(pool))
          
          // Calculate percentage for each distribution
          const creatorPercentages = distributions.map((dist, i) => 
            (dist.creatorFee / totalPools[i]) * 100
          )
          const platformPercentages = distributions.map((dist, i) => 
            (dist.platformFee / totalPools[i]) * 100
          )
          
          // All creator percentages should be approximately 2%
          creatorPercentages.forEach(percentage => {
            expect(Math.abs(percentage - 2)).toBeLessThan(0.01)
          })
          
          // All platform percentages should be approximately 3%
          platformPercentages.forEach(percentage => {
            expect(Math.abs(percentage - 3)).toBeLessThan(0.01)
          })
        }
      ),
      { numRuns: 50 }
    )
  })

  it('Property 8.6: Fee distribution is deterministic for same input', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        totalPoolArb,
        (totalPool) => {
          const distribution1 = calculateFeeDistribution(totalPool)
          const distribution2 = calculateFeeDistribution(totalPool)
          
          expect(distribution1.creatorFee).toBe(distribution2.creatorFee)
          expect(distribution1.platformFee).toBe(distribution2.platformFee)
          expect(distribution1.participantPool).toBe(distribution2.participantPool)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8.7: Fee distribution handles edge cases correctly', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.001), max: Math.fround(1), noNaN: true, noDefaultInfinity: true }), // Very small amounts
        (totalPool) => {
          const feeDistribution = calculateFeeDistribution(totalPool)
          
          // All components should be non-negative
          expect(feeDistribution.creatorFee).toBeGreaterThanOrEqual(0)
          expect(feeDistribution.platformFee).toBeGreaterThanOrEqual(0)
          expect(feeDistribution.participantPool).toBeGreaterThanOrEqual(0)
          
          // Sum should approximately equal total pool
          const sum = feeDistribution.creatorFee + feeDistribution.platformFee + feeDistribution.participantPool
          expect(Math.abs(sum - totalPool)).toBeLessThan(0.0001)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 8.8: Basis points calculation is mathematically correct', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        totalPoolArb,
        (totalPool) => {
          // Manual calculation using basis points
          const manualCreatorFee = (totalPool * 200) / 10000 // 2% = 200 basis points
          const manualPlatformFee = (totalPool * 300) / 10000 // 3% = 300 basis points
          const manualParticipantPool = totalPool - manualCreatorFee - manualPlatformFee
          
          const feeDistribution = calculateFeeDistribution(totalPool)
          
          // Use approximate equality for floating point comparison
          expect(Math.abs(feeDistribution.creatorFee - manualCreatorFee)).toBeLessThan(0.0001)
          expect(Math.abs(feeDistribution.platformFee - manualPlatformFee)).toBeLessThan(0.0001)
          expect(Math.abs(feeDistribution.participantPool - manualParticipantPool)).toBeLessThan(0.0001)
        }
      ),
      { numRuns: 100 }
    )
  })
})