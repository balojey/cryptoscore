/**
 * Tests for MNEE unit conversion utilities
 */

import { describe, it, expect } from 'vitest'
import {
  mneeToAtomic,
  atomicToMnee,
  formatMneeAmount,
  parseMneeAmount,
  validateMneeAmount,
  createMneeAmount,
  createMneeAmountFromDecimal,
  MNEE_ATOMIC_UNITS_PER_TOKEN
} from '../mnee-utils'

describe('MNEE Utils', () => {
  describe('Unit Conversion', () => {
    it('should convert MNEE tokens to atomic units', () => {
      expect(mneeToAtomic(1)).toBe(100000)
      expect(mneeToAtomic(0.5)).toBe(50000)
      expect(mneeToAtomic(0.00001)).toBe(1)
      expect(mneeToAtomic(0)).toBe(0)
    })

    it('should convert atomic units to MNEE tokens', () => {
      expect(atomicToMnee(100000)).toBe(1)
      expect(atomicToMnee(50000)).toBe(0.5)
      expect(atomicToMnee(1)).toBe(0.00001)
      expect(atomicToMnee(0)).toBe(0)
    })

    it('should maintain precision in round-trip conversions', () => {
      const testAmounts = [1, 0.5, 0.12345, 10.99999]
      
      testAmounts.forEach(amount => {
        const atomic = mneeToAtomic(amount)
        const backToMnee = atomicToMnee(atomic)
        expect(backToMnee).toBeCloseTo(amount, 5)
      })
    })
  })

  describe('Formatting', () => {
    it('should format atomic amounts as MNEE tokens with symbol', () => {
      expect(formatMneeAmount(100000)).toBe('1.00000 MNEE')
      expect(formatMneeAmount(50000)).toBe('0.50000 MNEE')
      expect(formatMneeAmount(1)).toBe('0.00001 MNEE')
    })

    it('should format without symbol when requested', () => {
      expect(formatMneeAmount(100000, { includeSymbol: false })).toBe('1.00000')
      expect(formatMneeAmount(50000, { includeSymbol: false })).toBe('0.50000')
    })

    it('should respect custom decimal places', () => {
      expect(formatMneeAmount(100000, { decimalPlaces: 2 })).toBe('1.00 MNEE')
      expect(formatMneeAmount(150000, { decimalPlaces: 3 })).toBe('1.500 MNEE')
    })
  })

  describe('Parsing', () => {
    it('should parse MNEE amount strings to atomic units', () => {
      expect(parseMneeAmount('1.00000 MNEE')).toBe(100000)
      expect(parseMneeAmount('0.50000')).toBe(50000)
      expect(parseMneeAmount('1')).toBe(100000)
      expect(parseMneeAmount('0.00001')).toBe(1)
    })

    it('should handle various string formats', () => {
      expect(parseMneeAmount(' 1.5 MNEE ')).toBe(150000)
      expect(parseMneeAmount('2.5')).toBe(250000)
      expect(parseMneeAmount('0.1')).toBe(10000)
    })

    it('should throw error for invalid formats', () => {
      expect(() => parseMneeAmount('invalid')).toThrow('Invalid MNEE amount format')
      expect(() => parseMneeAmount('')).toThrow('Invalid MNEE amount format')
      expect(() => parseMneeAmount('abc MNEE')).toThrow('Invalid MNEE amount format')
    })
  })

  describe('Validation', () => {
    it('should validate atomic amounts within range', () => {
      expect(validateMneeAmount(100000)).toBe(true)
      expect(validateMneeAmount(0)).toBe(true)
      expect(validateMneeAmount(1)).toBe(true)
    })

    it('should reject non-integer amounts', () => {
      expect(validateMneeAmount(100000.5)).toBe(false)
      expect(validateMneeAmount(1.1)).toBe(false)
    })

    it('should respect min/max constraints', () => {
      expect(validateMneeAmount(50000, { min: 100000 })).toBe(false)
      expect(validateMneeAmount(150000, { min: 100000 })).toBe(true)
      expect(validateMneeAmount(200000, { max: 150000 })).toBe(false)
      expect(validateMneeAmount(100000, { max: 150000 })).toBe(true)
    })
  })

  describe('MneeAmount Objects', () => {
    it('should create MneeAmount from atomic units', () => {
      const amount = createMneeAmount(150000)
      expect(amount.atomic).toBe(150000)
      expect(amount.decimal).toBe(1.5)
      expect(amount.formatted).toBe('1.50000 MNEE')
    })

    it('should create MneeAmount from decimal', () => {
      const amount = createMneeAmountFromDecimal(2.5)
      expect(amount.atomic).toBe(250000)
      expect(amount.decimal).toBe(2.5)
      expect(amount.formatted).toBe('2.50000 MNEE')
    })
  })

  describe('Constants', () => {
    it('should have correct atomic units per token', () => {
      expect(MNEE_ATOMIC_UNITS_PER_TOKEN).toBe(100000)
    })
  })
})