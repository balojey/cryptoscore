import { describe, it, expect, beforeEach } from 'vitest'
import { MNEE_SDK_CONFIG, MNEE_TOKEN_CONFIG, MNEE_UNITS, validateMneeConfig } from '../mnee'

describe('MNEE Configuration', () => {
  beforeEach(() => {
    // Reset any environment variables if needed
  })

  it('should have valid SDK configuration', () => {
    expect(MNEE_SDK_CONFIG).toBeDefined()
    expect(MNEE_SDK_CONFIG.environment).toMatch(/^(production|sandbox)$/)
    expect(MNEE_SDK_CONFIG.apiKey).toBeDefined()
    expect(typeof MNEE_SDK_CONFIG.apiKey).toBe('string')
  })

  it('should have valid token configuration', () => {
    expect(MNEE_TOKEN_CONFIG).toBeDefined()
    expect(MNEE_TOKEN_CONFIG.atomicUnitsPerToken).toBe(100000)
    expect(MNEE_TOKEN_CONFIG.decimals).toBe(5)
    expect(MNEE_TOKEN_CONFIG.symbol).toBe('MNEE')
    expect(MNEE_TOKEN_CONFIG.name).toBe('MNEE Token')
  })

  it('should validate configuration without throwing', () => {
    expect(() => validateMneeConfig()).not.toThrow()
  })

  describe('Unit Conversion', () => {
    it('should convert MNEE tokens to atomic units correctly', () => {
      expect(MNEE_UNITS.toAtomicUnits(1)).toBe(100000)
      expect(MNEE_UNITS.toAtomicUnits(0.5)).toBe(50000)
      expect(MNEE_UNITS.toAtomicUnits(10.12345)).toBe(1012345)
    })

    it('should convert atomic units to MNEE tokens correctly', () => {
      expect(MNEE_UNITS.fromAtomicUnits(100000)).toBe(1)
      expect(MNEE_UNITS.fromAtomicUnits(50000)).toBe(0.5)
      expect(MNEE_UNITS.fromAtomicUnits(1012345)).toBe(10.12345)
    })

    it('should format MNEE amounts correctly', () => {
      expect(MNEE_UNITS.formatMneeAmount(100000)).toBe('1.00000 MNEE')
      expect(MNEE_UNITS.formatMneeAmount(50000)).toBe('0.50000 MNEE')
      expect(MNEE_UNITS.formatMneeAmount(1012345)).toBe('10.12345 MNEE')
    })

    it('should format MNEE amounts without symbol when requested', () => {
      expect(MNEE_UNITS.formatMneeAmount(100000, { includeSymbol: false })).toBe('1.00000')
      expect(MNEE_UNITS.formatMneeAmount(50000, { includeSymbol: false })).toBe('0.50000')
    })

    it('should format MNEE amounts with custom decimals', () => {
      expect(MNEE_UNITS.formatMneeAmount(100000, { decimals: 2 })).toBe('1.00 MNEE')
      expect(MNEE_UNITS.formatMneeAmount(50000, { decimals: 3 })).toBe('0.500 MNEE')
    })

    it('should parse MNEE amount strings correctly', () => {
      expect(MNEE_UNITS.parseMneeAmount('1.0')).toBe(100000)
      expect(MNEE_UNITS.parseMneeAmount('0.5')).toBe(50000)
      expect(MNEE_UNITS.parseMneeAmount('10.12345')).toBe(1012345)
      expect(MNEE_UNITS.parseMneeAmount('1.0 MNEE')).toBe(100000)
      expect(MNEE_UNITS.parseMneeAmount('$1.0')).toBe(100000)
    })

    it('should throw error for invalid MNEE amount strings', () => {
      expect(() => MNEE_UNITS.parseMneeAmount('invalid')).toThrow('Invalid MNEE amount: invalid')
      expect(() => MNEE_UNITS.parseMneeAmount('')).toThrow('Invalid MNEE amount: ')
    })

    it('should validate MNEE amounts correctly', () => {
      expect(() => MNEE_UNITS.validateAmount(100000)).not.toThrow()
      expect(() => MNEE_UNITS.validateAmount(1000)).not.toThrow()
      
      expect(() => MNEE_UNITS.validateAmount(-1)).toThrow('MNEE amount cannot be negative')
      expect(() => MNEE_UNITS.validateAmount(500)).toThrow('MNEE amount too small')
      expect(() => MNEE_UNITS.validateAmount(100000000001)).toThrow('MNEE amount too large')
    })
  })
})