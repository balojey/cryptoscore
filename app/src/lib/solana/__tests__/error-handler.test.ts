/**
 * SolanaErrorHandler Tests
 */

import { describe, expect, it } from 'vitest'
import { SolanaErrorHandler } from '../error-handler'

describe('solanaErrorHandler', () => {
  describe('parseError', () => {
    it('should parse program error from logs', () => {
      const error = {
        message: 'Transaction failed',
        logs: [
          'Program log: Instruction: JoinMarket',
          'Program log: custom program error: 0x1770',
        ],
      }

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(6000)
      expect(parsed.message).toBe('Market has already started')
      expect(parsed.logs).toBeDefined()
    })

    it('should parse insufficient funds error', () => {
      const error = {
        message: 'Transaction failed: insufficient funds for transaction',
      }

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(-1)
      expect(parsed.message).toBe('Insufficient SOL balance for this transaction')
    })

    it('should parse transaction simulation failed error', () => {
      const error = {
        message: 'Transaction simulation failed: Error processing Instruction',
      }

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(-1)
      expect(parsed.message).toBe('Transaction would fail - please check your inputs')
    })

    it('should parse blockhash not found error', () => {
      const error = {
        message: 'Transaction failed: blockhash not found',
      }

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(-1)
      expect(parsed.message).toBe('Transaction expired - please try again')
    })

    it('should parse user rejected error', () => {
      const error = {
        message: 'User rejected the request',
      }

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(-1)
      expect(parsed.message).toBe('Transaction was rejected by wallet')
    })

    it('should parse transaction not confirmed error', () => {
      const error = {
        message: 'Transaction was not confirmed in 30 seconds',
      }

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(-1)
      expect(parsed.message).toBe('Transaction timed out - it may still succeed')
    })

    it('should handle unknown errors', () => {
      const error = {
        message: 'Some unknown error occurred',
      }

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(-1)
      expect(parsed.message).toBe('Some unknown error occurred')
    })

    it('should handle errors without message', () => {
      const error = {}

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(-1)
      expect(parsed.message).toContain('object')
    })

    it('should handle string errors', () => {
      const error = 'String error message'

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(-1)
      expect(parsed.message).toBe('String error message')
    })
  })

  describe('program error codes', () => {
    it('should parse "Market has already started" error (6000)', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1770'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(6000)
      expect(parsed.message).toBe('Market has already started')
    })

    it('should parse "Market has not started yet" error (6001)', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1771'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(6001)
      expect(parsed.message).toBe('Market has not started yet')
    })

    it('should parse "Market has already ended" error (6002)', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1772'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(6002)
      expect(parsed.message).toBe('Market has already ended')
    })

    it('should parse "Invalid prediction choice" error (6005)', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1775'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(6005)
      expect(parsed.message).toBe('Invalid prediction choice')
    })

    it('should parse "User has already joined" error (6006)', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1776'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(6006)
      expect(parsed.message).toBe('User has already joined this market')
    })

    it('should parse "User is not a winner" error (6008)', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1778'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(6008)
      expect(parsed.message).toBe('User is not a winner')
    })

    it('should parse "Rewards already withdrawn" error (6009)', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1779'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(6009)
      expect(parsed.message).toBe('Rewards already withdrawn')
    })

    it('should parse "Insufficient funds" error (6010)', () => {
      const error = {
        logs: ['Program log: custom program error: 0x177a'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(6010)
      expect(parsed.message).toBe('Insufficient funds')
    })

    it('should parse "Unauthorized" error (6011)', () => {
      const error = {
        logs: ['Program log: custom program error: 0x177b'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(6011)
      expect(parsed.message).toBe('Unauthorized')
    })

    it('should handle unknown program error code', () => {
      const error = {
        logs: ['Program log: custom program error: 0x9999'],
      }

      const parsed = SolanaErrorHandler.parseError(error)
      expect(parsed.code).toBe(39321)
      expect(parsed.message).toContain('Program error: 39321')
    })
  })

  describe('getUserMessage', () => {
    it('should return user-friendly message', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1770'],
      }

      const message = SolanaErrorHandler.getUserMessage(error)
      expect(message).toBe('Market has already started')
    })

    it('should return message for common Solana errors', () => {
      const error = {
        message: 'insufficient funds',
      }

      const message = SolanaErrorHandler.getUserMessage(error)
      expect(message).toBe('Insufficient SOL balance for this transaction')
    })
  })

  describe('isErrorCode', () => {
    it('should return true for matching error code', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1770'],
      }

      expect(SolanaErrorHandler.isErrorCode(error, 6000)).toBe(true)
    })

    it('should return false for non-matching error code', () => {
      const error = {
        logs: ['Program log: custom program error: 0x1770'],
      }

      expect(SolanaErrorHandler.isErrorCode(error, 6001)).toBe(false)
    })

    it('should return false for non-program errors', () => {
      const error = {
        message: 'insufficient funds',
      }

      expect(SolanaErrorHandler.isErrorCode(error, 6000)).toBe(false)
    })
  })

  describe('logError', () => {
    it('should log error without throwing', () => {
      const error = {
        message: 'Test error',
        logs: ['Some log'],
      }

      // Should not throw
      expect(() => {
        SolanaErrorHandler.logError(error, 'Test Context')
      }).not.toThrow()
    })

    it('should log error without context', () => {
      const error = {
        message: 'Test error',
      }

      // Should not throw
      expect(() => {
        SolanaErrorHandler.logError(error)
      }).not.toThrow()
    })
  })

  describe('error message case insensitivity', () => {
    it('should match error messages case-insensitively', () => {
      const error1 = { message: 'INSUFFICIENT FUNDS' }
      const error2 = { message: 'Insufficient Funds' }
      const error3 = { message: 'insufficient funds' }

      const parsed1 = SolanaErrorHandler.parseError(error1)
      const parsed2 = SolanaErrorHandler.parseError(error2)
      const parsed3 = SolanaErrorHandler.parseError(error3)

      expect(parsed1.message).toBe('Insufficient SOL balance for this transaction')
      expect(parsed2.message).toBe('Insufficient SOL balance for this transaction')
      expect(parsed3.message).toBe('Insufficient SOL balance for this transaction')
    })
  })

  describe('error with multiple log entries', () => {
    it('should find program error in multiple log entries', () => {
      const error = {
        message: 'Transaction failed',
        logs: [
          'Program log: Instruction: JoinMarket',
          'Program log: Processing instruction',
          'Program log: Checking market status',
          'Program log: custom program error: 0x1770',
          'Program log: Transaction failed',
        ],
      }

      const parsed = SolanaErrorHandler.parseError(error)

      expect(parsed.code).toBe(6000)
      expect(parsed.message).toBe('Market has already started')
    })
  })
})
