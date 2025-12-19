/**
 * Tests for SolanaUtils
 */

import { PublicKey } from '@solana/web3.js'
import { describe, expect, it } from 'vitest'
import { SolanaUtils } from '../utils'

describe('solanaUtils', () => {
  describe('lamportsToSol', () => {
    it('should convert lamports to SOL (bigint)', () => {
      const lamports = BigInt(1_000_000_000)
      const sol = SolanaUtils.lamportsToSol(lamports)

      expect(sol).toBe(1)
    })

    it('should convert lamports to SOL (number)', () => {
      const lamports = 1_000_000_000
      const sol = SolanaUtils.lamportsToSol(lamports)

      expect(sol).toBe(1)
    })

    it('should handle fractional SOL', () => {
      const lamports = BigInt(500_000_000)
      const sol = SolanaUtils.lamportsToSol(lamports)

      expect(sol).toBe(0.5)
    })

    it('should handle small amounts', () => {
      const lamports = BigInt(1)
      const sol = SolanaUtils.lamportsToSol(lamports)

      expect(sol).toBe(0.000000001)
    })

    it('should handle zero', () => {
      const lamports = BigInt(0)
      const sol = SolanaUtils.lamportsToSol(lamports)

      expect(sol).toBe(0)
    })
  })

  describe('solToLamports', () => {
    it('should convert SOL to lamports', () => {
      const sol = 1
      const lamports = SolanaUtils.solToLamports(sol)

      expect(lamports).toBe(BigInt(1_000_000_000))
    })

    it('should handle fractional SOL', () => {
      const sol = 0.5
      const lamports = SolanaUtils.solToLamports(sol)

      expect(lamports).toBe(BigInt(500_000_000))
    })

    it('should handle small amounts', () => {
      const sol = 0.000000001
      const lamports = SolanaUtils.solToLamports(sol)

      expect(lamports).toBe(BigInt(1))
    })

    it('should handle zero', () => {
      const sol = 0
      const lamports = SolanaUtils.solToLamports(sol)

      expect(lamports).toBe(BigInt(0))
    })

    it('should floor fractional lamports', () => {
      const sol = 0.0000000015 // 1.5 lamports
      const lamports = SolanaUtils.solToLamports(sol)

      expect(lamports).toBe(BigInt(1)) // Should floor to 1
    })
  })

  describe('shortenAddress', () => {
    const testPubkey = new PublicKey('11111111111111111111111111111111')

    it('should shorten PublicKey with default chars', () => {
      const shortened = SolanaUtils.shortenAddress(testPubkey)

      expect(shortened).toContain('...')
      expect(shortened.length).toBe(11) // 4 + 3 + 4
    })

    it('should shorten string address with default chars', () => {
      const address = testPubkey.toBase58()
      const shortened = SolanaUtils.shortenAddress(address)

      expect(shortened).toContain('...')
    })

    it('should shorten with custom chars', () => {
      const shortened = SolanaUtils.shortenAddress(testPubkey, 6)

      expect(shortened).toContain('...')
      expect(shortened.length).toBe(15) // 6 + 3 + 6
    })

    it('should handle different char lengths', () => {
      const chars = [2, 4, 6, 8]

      chars.forEach((char) => {
        const shortened = SolanaUtils.shortenAddress(testPubkey, char)
        expect(shortened.length).toBe(char * 2 + 3)
      })
    })
  })

  describe('getExplorerUrl', () => {
    const signature = 'test_signature_123'

    it('should generate devnet explorer URL', () => {
      const url = SolanaUtils.getExplorerUrl(signature, 'devnet')

      expect(url).toBe('https://explorer.solana.com/tx/test_signature_123?cluster=devnet')
    })

    it('should generate mainnet explorer URL', () => {
      const url = SolanaUtils.getExplorerUrl(signature, 'mainnet-beta')

      expect(url).toBe('https://explorer.solana.com/tx/test_signature_123')
    })

    it('should generate testnet explorer URL', () => {
      const url = SolanaUtils.getExplorerUrl(signature, 'testnet')

      expect(url).toBe('https://explorer.solana.com/tx/test_signature_123?cluster=testnet')
    })

    it('should generate localnet explorer URL', () => {
      const url = SolanaUtils.getExplorerUrl(signature, 'localnet')

      expect(url).toBe('https://explorer.solana.com/tx/test_signature_123?cluster=localnet')
    })

    it('should default to devnet', () => {
      const url = SolanaUtils.getExplorerUrl(signature)

      expect(url).toBe('https://explorer.solana.com/tx/test_signature_123?cluster=devnet')
    })
  })

  describe('getExplorerAddressUrl', () => {
    const testPubkey = new PublicKey('11111111111111111111111111111111')

    it('should generate devnet address URL from PublicKey', () => {
      const url = SolanaUtils.getExplorerAddressUrl(testPubkey, 'devnet')

      expect(url).toContain('https://explorer.solana.com/address/')
      expect(url).toContain('?cluster=devnet')
    })

    it('should generate mainnet address URL from string', () => {
      const address = testPubkey.toBase58()
      const url = SolanaUtils.getExplorerAddressUrl(address, 'mainnet-beta')

      expect(url).toContain('https://explorer.solana.com/address/')
      expect(url).not.toContain('?cluster=')
    })

    it('should default to devnet', () => {
      const url = SolanaUtils.getExplorerAddressUrl(testPubkey)

      expect(url).toContain('?cluster=devnet')
    })
  })

  describe('formatSol', () => {
    it('should format SOL with default decimals', () => {
      const lamports = BigInt(1_234_567_890)
      const formatted = SolanaUtils.formatSol(lamports)

      expect(formatted).toBe('1.2346')
    })

    it('should format SOL with custom decimals', () => {
      const lamports = BigInt(1_234_567_890)
      const formatted = SolanaUtils.formatSol(lamports, 2)

      expect(formatted).toBe('1.23')
    })

    it('should handle zero', () => {
      const lamports = BigInt(0)
      const formatted = SolanaUtils.formatSol(lamports)

      expect(formatted).toBe('0.0000')
    })

    it('should handle small amounts', () => {
      const lamports = BigInt(1000)
      const formatted = SolanaUtils.formatSol(lamports, 9)

      expect(formatted).toBe('0.000001000')
    })
  })

  describe('isValidPublicKey', () => {
    it('should return true for valid public key', () => {
      const validKey = '11111111111111111111111111111111'
      const result = SolanaUtils.isValidPublicKey(validKey)

      expect(result).toBe(true)
    })

    it('should return false for invalid public key', () => {
      const invalidKey = 'not_a_valid_key'
      const result = SolanaUtils.isValidPublicKey(invalidKey)

      expect(result).toBe(false)
    })

    it('should return false for empty string', () => {
      const result = SolanaUtils.isValidPublicKey('')

      expect(result).toBe(false)
    })

    it('should return false for too short string', () => {
      const result = SolanaUtils.isValidPublicKey('123')

      expect(result).toBe(false)
    })
  })

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const start = Date.now()
      await SolanaUtils.sleep(100)
      const end = Date.now()

      expect(end - start).toBeGreaterThanOrEqual(90) // Allow some tolerance
    })

    it('should resolve after delay', async () => {
      const promise = SolanaUtils.sleep(50)

      expect(promise).toBeInstanceOf(Promise)
      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('formatFee', () => {
    it('should format fee with SOL symbol by default', () => {
      const lamports = 5000
      const formatted = SolanaUtils.formatFee(lamports)

      expect(formatted).toContain('SOL')
      // Small fees use exponential notation
      expect(formatted).toMatch(/e-\d+/)
    })

    it('should format fee without SOL symbol', () => {
      const lamports = 5000
      const formatted = SolanaUtils.formatFee(lamports, false)

      expect(formatted).not.toContain('SOL')
      // Small fees use exponential notation
      expect(formatted).toMatch(/e-\d+/)
    })

    it('should use exponential notation for very small fees', () => {
      const lamports = 10 // 0.00000001 SOL
      const formatted = SolanaUtils.formatFee(lamports)

      expect(formatted).toContain('e')
      expect(formatted).toContain('SOL')
    })

    it('should handle zero fee', () => {
      const lamports = 0
      const formatted = SolanaUtils.formatFee(lamports)

      expect(formatted).toContain('SOL')
      expect(formatted).toContain('0')
    })
  })

  describe('conversion round-trip', () => {
    it('should maintain precision in round-trip conversion', () => {
      const originalSol = 1.5
      const lamports = SolanaUtils.solToLamports(originalSol)
      const convertedSol = SolanaUtils.lamportsToSol(lamports)

      expect(convertedSol).toBe(originalSol)
    })

    it('should handle multiple round-trips', () => {
      let value = 2.5

      for (let i = 0; i < 5; i++) {
        const lamports = SolanaUtils.solToLamports(value)
        value = SolanaUtils.lamportsToSol(lamports)
      }

      expect(value).toBe(2.5)
    })
  })
})
