/**
 * Tests for Crossmint wallet utilities
 * **Feature: web2-migration, Property 3: EVM Wallet Creation**
 * **Validates: Requirements 2.2**
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  compareEvmAddresses,
  formatEvmAddress,
  generateRandomEvmAddress,
  isValidEvmAddress,
  isZeroAddress,
  normalizeEvmAddress,
} from '../wallet-utils'

describe('EVM Wallet Address Validation', () => {
  describe('isValidEvmAddress', () => {
    it('should validate correct EVM addresses', () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b8D4C9db96DfbBfC88',
        '0x0000000000000000000000000000000000000000',
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
        '0x1234567890abcdef1234567890abcdef12345678',
      ]

      validAddresses.forEach((address) => {
        expect(isValidEvmAddress(address)).toBe(true)
      })
    })

    it('should reject invalid EVM addresses', () => {
      const invalidAddresses = [
        '', // empty string
        '742d35Cc6634C0532925a3b8D4C9db96DfbBfC88', // missing 0x prefix
        '0x742d35Cc6634C0532925a3b8D4C9db96DfbBfC8', // too short
        '0x742d35Cc6634C0532925a3b8D4C9db96DfbBfC888', // too long
        '0x742d35Cc6634C0532925a3b8D4C9db96DfbBfCGG', // invalid hex characters
        'not-an-address', // completely invalid
        null as any, // null
        undefined as any, // undefined
        123 as any, // number
      ]

      invalidAddresses.forEach((address) => {
        expect(isValidEvmAddress(address)).toBe(false)
      })
    })

    /**
     * Property-based test for EVM wallet creation validation
     * **Feature: web2-migration, Property 3: EVM Wallet Creation**
     * **Validates: Requirements 2.2**
     * 
     * This property ensures that any valid EVM address created by Crossmint
     * will be properly validated by our validation function.
     */
    it('should validate all properly formatted EVM addresses', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }),
          (hexArray) => {
            const hexString = hexArray.map(n => n.toString(16)).join('')
            const evmAddress = `0x${hexString}`
            expect(isValidEvmAddress(evmAddress)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property-based test ensuring invalid formats are rejected
     * **Feature: web2-migration, Property 3: EVM Wallet Creation**
     * **Validates: Requirements 2.2**
     */
    it('should reject addresses without 0x prefix', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }),
          (hexArray) => {
            const hexString = hexArray.map(n => n.toString(16)).join('')
            // Test without 0x prefix
            expect(isValidEvmAddress(hexString)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    /**
     * Property-based test for wrong length addresses
     * **Feature: web2-migration, Property 3: EVM Wallet Creation**
     * **Validates: Requirements 2.2**
     */
    it('should reject addresses with wrong length', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 39 }),
          (length) => {
            const hexArray = Array.from({ length }, () => Math.floor(Math.random() * 16))
            const hexString = hexArray.map(n => n.toString(16)).join('')
            const shortAddress = `0x${hexString}`
            expect(isValidEvmAddress(shortAddress)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('formatEvmAddress', () => {
    it('should format valid addresses correctly', () => {
      const address = '0x742d35Cc6634C0532925a3b8D4C9db96DfbBfC88'
      expect(formatEvmAddress(address)).toBe('0x742d...fC88')
      expect(formatEvmAddress(address, 8, 6)).toBe('0x742d35...bBfC88')
    })

    it('should return original string for invalid addresses', () => {
      const invalidAddress = 'invalid-address'
      expect(formatEvmAddress(invalidAddress)).toBe(invalidAddress)
    })

    /**
     * Property-based test for address formatting
     * **Feature: web2-migration, Property 3: EVM Wallet Creation**
     * **Validates: Requirements 2.2**
     */
    it('should format all valid EVM addresses consistently', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }),
          (hexArray) => {
            const hexString = hexArray.map(n => n.toString(16)).join('')
            const evmAddress = `0x${hexString}`
            const formatted = formatEvmAddress(evmAddress)
            
            // Should start with first 6 chars and end with last 4 chars
            expect(formatted.startsWith(evmAddress.slice(0, 6))).toBe(true)
            expect(formatted.endsWith(evmAddress.slice(-4))).toBe(true)
            expect(formatted).toContain('...')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('normalizeEvmAddress', () => {
    it('should convert addresses to lowercase', () => {
      const mixedCaseAddress = '0x742D35CC6634C0532925A3B8D4C9DB96DFBBFC88'
      const expectedLowercase = '0x742d35cc6634c0532925a3b8d4c9db96dfbbfc88'
      expect(normalizeEvmAddress(mixedCaseAddress)).toBe(expectedLowercase)
    })

    /**
     * Property-based test for address normalization
     * **Feature: web2-migration, Property 3: EVM Wallet Creation**
     * **Validates: Requirements 2.2**
     */
    it('should normalize all valid EVM addresses to lowercase', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }),
          (hexArray) => {
            const hexString = hexArray.map(n => n.toString(16)).join('')
            const evmAddress = `0x${hexString.toUpperCase()}`
            const normalized = normalizeEvmAddress(evmAddress)
            
            expect(normalized).toBe(evmAddress.toLowerCase())
            expect(isValidEvmAddress(normalized)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('isZeroAddress', () => {
    it('should identify zero address correctly', () => {
      const zeroAddress = '0x0000000000000000000000000000000000000000'
      expect(isZeroAddress(zeroAddress)).toBe(true)
      expect(isZeroAddress(zeroAddress.toUpperCase())).toBe(true)
    })

    it('should reject non-zero addresses', () => {
      const nonZeroAddress = '0x742d35Cc6634C0532925a3b8D4C9db96DfbBfC88'
      expect(isZeroAddress(nonZeroAddress)).toBe(false)
    })
  })

  describe('compareEvmAddresses', () => {
    it('should compare addresses case-insensitively', () => {
      const address1 = '0x742D35CC6634C0532925A3B8D4C9DB96DFBBFC88'
      const address2 = '0x742d35cc6634c0532925a3b8d4c9db96dfbbfc88'
      expect(compareEvmAddresses(address1, address2)).toBe(true)
    })

    /**
     * Property-based test for address comparison
     * **Feature: web2-migration, Property 3: EVM Wallet Creation**
     * **Validates: Requirements 2.2**
     */
    it('should compare addresses consistently regardless of case', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 40, maxLength: 40 }),
          (hexArray) => {
            const hexString = hexArray.map(n => n.toString(16)).join('')
            const lowerAddress = `0x${hexString.toLowerCase()}`
            const upperAddress = `0x${hexString.toUpperCase()}`
            const mixedAddress = `0x${hexString}`
            
            expect(compareEvmAddresses(lowerAddress, upperAddress)).toBe(true)
            expect(compareEvmAddresses(lowerAddress, mixedAddress)).toBe(true)
            expect(compareEvmAddresses(upperAddress, mixedAddress)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('generateRandomEvmAddress', () => {
    it('should generate valid EVM addresses', () => {
      for (let i = 0; i < 10; i++) {
        const address = generateRandomEvmAddress()
        expect(isValidEvmAddress(address)).toBe(true)
      }
    })

    it('should generate unique addresses', () => {
      const addresses = new Set()
      for (let i = 0; i < 100; i++) {
        addresses.add(generateRandomEvmAddress())
      }
      // Should generate mostly unique addresses (allowing for very rare collisions)
      expect(addresses.size).toBeGreaterThan(95)
    })

    /**
     * Property-based test for random address generation
     * **Feature: web2-migration, Property 3: EVM Wallet Creation**
     * **Validates: Requirements 2.2**
     */
    it('should always generate valid EVM addresses', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }),
          (count) => {
            for (let i = 0; i < count; i++) {
              const address = generateRandomEvmAddress()
              expect(isValidEvmAddress(address)).toBe(true)
              expect(address.startsWith('0x')).toBe(true)
              expect(address.length).toBe(42)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})