/**
 * SolanaErrorHandler - Parses and handles Solana program errors
 * 
 * Maps error codes to user-friendly messages.
 */

export interface ProgramError {
  code: number
  message: string
  logs?: string[]
}

// Program error codes (should match on-chain program)
const ERROR_CODES: Record<number, string> = {
  6000: 'Market has already started',
  6001: 'Market has not started yet',
  6002: 'Market has already ended',
  6003: 'Market is not resolved',
  6004: 'Market is already resolved',
  6005: 'Invalid prediction choice',
  6006: 'User has already joined this market',
  6007: 'User has not joined this market',
  6008: 'User is not a winner',
  6009: 'Rewards already withdrawn',
  6010: 'Insufficient funds',
  6011: 'Unauthorized',
  6012: 'Invalid market status',
  6013: 'Invalid outcome',
  6014: 'Arithmetic overflow',
  6015: 'Arithmetic underflow',
}

// Common Solana errors
const SOLANA_ERRORS: Record<string, string> = {
  'insufficient funds': 'Insufficient SOL balance for this transaction',
  'Transaction simulation failed': 'Transaction would fail - please check your inputs',
  'blockhash not found': 'Transaction expired - please try again',
  'User rejected': 'Transaction was rejected by wallet',
  'Transaction was not confirmed': 'Transaction timed out - it may still succeed',
}

export class SolanaErrorHandler {
  /**
   * Parse program error from transaction error
   */
  static parseError(error: any): ProgramError {
    // Extract error message
    const errorMessage = error?.message || error?.toString() || 'Unknown error'

    // Check for program errors
    if (error?.logs) {
      const programError = this.extractProgramError(error.logs)
      if (programError) {
        return programError
      }
    }

    // Check for common Solana errors
    for (const [key, message] of Object.entries(SOLANA_ERRORS)) {
      if (errorMessage.toLowerCase().includes(key.toLowerCase())) {
        return {
          code: -1,
          message,
          logs: error?.logs,
        }
      }
    }

    // Return generic error
    return {
      code: -1,
      message: errorMessage,
      logs: error?.logs,
    }
  }

  /**
   * Extract program error from transaction logs
   */
  private static extractProgramError(logs: string[]): ProgramError | null {
    for (const log of logs) {
      // Look for custom program error
      const match = log.match(/custom program error: 0x([0-9a-fA-F]+)/)
      if (match) {
        const code = Number.parseInt(match[1], 16)
        const message = ERROR_CODES[code] || `Program error: ${code}`
        return { code, message, logs }
      }
    }
    return null
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: any): string {
    const parsed = this.parseError(error)
    return parsed.message
  }

  /**
   * Log error for debugging
   */
  static logError(error: any, context?: string): void {
    const parsed = this.parseError(error)
    console.error(`[SolanaError${context ? ` - ${context}` : ''}]`, {
      code: parsed.code,
      message: parsed.message,
      logs: parsed.logs,
      originalError: error,
    })
  }

  /**
   * Check if error is a specific program error
   */
  static isErrorCode(error: any, code: number): boolean {
    const parsed = this.parseError(error)
    return parsed.code === code
  }
}
