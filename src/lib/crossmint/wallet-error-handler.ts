/**
 * Wallet Error Handler
 *
 * Provides error handling utilities for both Crossmint and traditional
 * wallet operations, including authentication and transaction errors.
 */

import type { WalletType } from '@/contexts/UnifiedWalletContext'

/**
 * Error codes for wallet operations
 */
export const WALLET_ERROR_CODES = {
  // Authentication errors
  AUTH_FAILED: 'AUTH_FAILED',
  AUTH_CANCELLED: 'AUTH_CANCELLED',
  AUTH_TIMEOUT: 'AUTH_TIMEOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Connection errors
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  CONNECTION_REJECTED: 'CONNECTION_REJECTED',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  NETWORK_MISMATCH: 'NETWORK_MISMATCH',

  // Transaction errors
  TRANSACTION_REJECTED: 'TRANSACTION_REJECTED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_TIMEOUT: 'TRANSACTION_TIMEOUT',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  SIGNING_FAILED: 'SIGNING_FAILED',
  SIMULATION_FAILED: 'SIMULATION_FAILED',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  RPC_ERROR: 'RPC_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Configuration errors
  CONFIG_ERROR: 'CONFIG_ERROR',
  INVALID_API_KEY: 'INVALID_API_KEY',
  MISSING_ENVIRONMENT: 'MISSING_ENVIRONMENT',

  // Crossmint-specific errors
  CROSSMINT_API_ERROR: 'CROSSMINT_API_ERROR',
  CROSSMINT_SIGNING_ERROR: 'CROSSMINT_SIGNING_ERROR',
  CROSSMINT_WALLET_NOT_READY: 'CROSSMINT_WALLET_NOT_READY',
  TRANSACTION_SERIALIZATION_ERROR: 'TRANSACTION_SERIALIZATION_ERROR',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type WalletErrorCode = typeof WALLET_ERROR_CODES[keyof typeof WALLET_ERROR_CODES]

/**
 * Custom error class for wallet operations
 */
export class WalletError extends Error {
  constructor(
    message: string,
    public code: WalletErrorCode,
    public walletType: WalletType,
    public originalError?: unknown,
  ) {
    super(message)
    this.name = 'WalletError'

    // Maintain proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WalletError)
    }
  }
}

/**
 * User-friendly error messages mapped to error codes
 */
const ERROR_MESSAGES: Record<WalletErrorCode, string> = {
  // Authentication errors
  [WALLET_ERROR_CODES.AUTH_FAILED]: 'Authentication failed. Please try again.',
  [WALLET_ERROR_CODES.AUTH_CANCELLED]: 'Authentication was cancelled.',
  [WALLET_ERROR_CODES.AUTH_TIMEOUT]: 'Authentication timed out. Please try again.',
  [WALLET_ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
  [WALLET_ERROR_CODES.TOKEN_REFRESH_FAILED]: 'Failed to refresh session. Please sign in again.',
  [WALLET_ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid credentials. Please check and try again.',

  // Connection errors
  [WALLET_ERROR_CODES.CONNECTION_FAILED]: 'Failed to connect wallet. Please try again.',
  [WALLET_ERROR_CODES.CONNECTION_REJECTED]: 'Wallet connection was rejected.',
  [WALLET_ERROR_CODES.WALLET_NOT_FOUND]: 'Wallet not found. Please install a wallet extension.',
  [WALLET_ERROR_CODES.WALLET_NOT_CONNECTED]: 'Wallet not connected. Please connect your wallet first.',
  [WALLET_ERROR_CODES.NETWORK_MISMATCH]: 'Network mismatch. Please switch to the correct network.',

  // Transaction errors
  [WALLET_ERROR_CODES.TRANSACTION_REJECTED]: 'Transaction was rejected.',
  [WALLET_ERROR_CODES.TRANSACTION_FAILED]: 'Transaction failed. Please try again.',
  [WALLET_ERROR_CODES.TRANSACTION_TIMEOUT]: 'Transaction timed out. Please check your wallet.',
  [WALLET_ERROR_CODES.INSUFFICIENT_FUNDS]: 'Insufficient funds to complete this transaction.',
  [WALLET_ERROR_CODES.SIGNING_FAILED]: 'Failed to sign transaction. Please try again.',
  [WALLET_ERROR_CODES.SIMULATION_FAILED]: 'Transaction simulation failed. This transaction may not succeed.',

  // Network errors
  [WALLET_ERROR_CODES.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [WALLET_ERROR_CODES.RPC_ERROR]: 'RPC error. The network may be experiencing issues.',
  [WALLET_ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded. Please wait a moment and try again.',

  // Configuration errors
  [WALLET_ERROR_CODES.CONFIG_ERROR]: 'Configuration error. Please contact support.',
  [WALLET_ERROR_CODES.INVALID_API_KEY]: 'Invalid API key. Please check your configuration.',
  [WALLET_ERROR_CODES.MISSING_ENVIRONMENT]: 'Missing environment configuration. Please contact support.',

  // Crossmint-specific errors
  [WALLET_ERROR_CODES.CROSSMINT_API_ERROR]: 'Crossmint API error. Please try again.',
  [WALLET_ERROR_CODES.CROSSMINT_SIGNING_ERROR]: 'Failed to sign transaction with Crossmint. Please try again.',
  [WALLET_ERROR_CODES.CROSSMINT_WALLET_NOT_READY]: 'Crossmint wallet is not ready. Please wait a moment and try again.',
  [WALLET_ERROR_CODES.TRANSACTION_SERIALIZATION_ERROR]: 'Failed to prepare transaction. Please try again.',

  // Generic errors
  [WALLET_ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
}

/**
 * Wallet Error Handler utility class
 *
 * Provides static methods for parsing, logging, and handling wallet-related errors
 * from both Crossmint and traditional wallet adapters.
 */
export class WalletErrorHandler {
  /**
   * Parse an error and return a WalletError with appropriate code
   *
   * Analyzes the error message and context to determine the appropriate
   * error code and create a structured WalletError object.
   *
   * @param error - The error to parse (can be any type)
   * @param walletType - Type of wallet that generated the error
   * @param context - Optional context string for debugging
   * @returns Structured WalletError with appropriate error code
   *
   * @example
   * ```typescript
   * try {
   *   await wallet.connect()
   * } catch (error) {
   *   const walletError = WalletErrorHandler.parseError(error, 'adapter', 'connect')
   *   console.log(walletError.code) // e.g., 'CONNECTION_FAILED'
   * }
   * ```
   */
  static parseError(error: unknown, walletType: WalletType, context?: string): WalletError {
    // If it's already a WalletError, return it
    if (error instanceof WalletError) {
      return error
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()

      // Authentication errors
      if (errorMessage.includes('auth') || errorMessage.includes('login')) {
        if (errorMessage.includes('cancel')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.AUTH_CANCELLED,
            walletType,
            error,
          )
        }
        if (errorMessage.includes('timeout')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.AUTH_TIMEOUT,
            walletType,
            error,
          )
        }
        if (errorMessage.includes('expired')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.SESSION_EXPIRED,
            walletType,
            error,
          )
        }
        return new WalletError(
          error.message,
          WALLET_ERROR_CODES.AUTH_FAILED,
          walletType,
          error,
        )
      }

      // Connection errors
      if (errorMessage.includes('connect') || errorMessage.includes('wallet')) {
        if (errorMessage.includes('reject')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.CONNECTION_REJECTED,
            walletType,
            error,
          )
        }
        if (errorMessage.includes('not found')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.WALLET_NOT_FOUND,
            walletType,
            error,
          )
        }
        if (errorMessage.includes('not connected')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.WALLET_NOT_CONNECTED,
            walletType,
            error,
          )
        }
        return new WalletError(
          error.message,
          WALLET_ERROR_CODES.CONNECTION_FAILED,
          walletType,
          error,
        )
      }

      // Transaction errors
      if (errorMessage.includes('transaction') || errorMessage.includes('sign')) {
        if (errorMessage.includes('reject') || errorMessage.includes('denied') || errorMessage.includes('declined')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.TRANSACTION_REJECTED,
            walletType,
            error,
          )
        }
        if (errorMessage.includes('insufficient') || errorMessage.includes('balance')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.INSUFFICIENT_FUNDS,
            walletType,
            error,
          )
        }
        if (errorMessage.includes('timeout')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.TRANSACTION_TIMEOUT,
            walletType,
            error,
          )
        }
        if (errorMessage.includes('sign')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.SIGNING_FAILED,
            walletType,
            error,
          )
        }
        if (errorMessage.includes('simulat')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.SIMULATION_FAILED,
            walletType,
            error,
          )
        }
        return new WalletError(
          error.message,
          WALLET_ERROR_CODES.TRANSACTION_FAILED,
          walletType,
          error,
        )
      }

      // Network errors
      if (errorMessage.includes('network') || errorMessage.includes('rpc') || errorMessage.includes('fetch')) {
        if (errorMessage.includes('rate limit')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.RATE_LIMIT_EXCEEDED,
            walletType,
            error,
          )
        }
        if (errorMessage.includes('rpc')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.RPC_ERROR,
            walletType,
            error,
          )
        }
        return new WalletError(
          error.message,
          WALLET_ERROR_CODES.NETWORK_ERROR,
          walletType,
          error,
        )
      }

      // Configuration errors
      if (errorMessage.includes('config') || errorMessage.includes('api key') || errorMessage.includes('environment')) {
        if (errorMessage.includes('api key')) {
          return new WalletError(
            error.message,
            WALLET_ERROR_CODES.INVALID_API_KEY,
            walletType,
            error,
          )
        }
        return new WalletError(
          error.message,
          WALLET_ERROR_CODES.CONFIG_ERROR,
          walletType,
          error,
        )
      }

      // Default to unknown error
      return new WalletError(
        error.message,
        WALLET_ERROR_CODES.UNKNOWN_ERROR,
        walletType,
        error,
      )
    }

    // Handle non-Error objects
    const errorString = String(error)
    return new WalletError(
      errorString,
      WALLET_ERROR_CODES.UNKNOWN_ERROR,
      walletType,
      error,
    )
  }

  /**
   * Parse Crossmint-specific errors
   *
   * Analyzes errors from Crossmint API and wallet operations to determine
   * the appropriate error code and create a structured WalletError object.
   *
   * @param error - The error to parse (can be any type)
   * @param context - Optional context string for debugging
   * @returns Structured WalletError with appropriate Crossmint error code
   *
   * @example
   * ```typescript
   * try {
   *   await crossmintWallet.send({ transaction: base58Tx })
   * } catch (error) {
   *   const walletError = WalletErrorHandler.parseCrossmintError(error, 'createMarket')
   *   console.log(walletError.code) // e.g., 'CROSSMINT_API_ERROR'
   * }
   * ```
   */
  static parseCrossmintError(error: unknown, context?: string): WalletError {
    // If it's already a WalletError, return it
    if (error instanceof WalletError) {
      return error
    }

    // Handle errors with response data (API errors)
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as any).response

      // Check for API error message in response data
      if (response?.data?.message) {
        const message = String(response.data.message).toLowerCase()

        // User rejection
        if (message.includes('reject') || message.includes('denied') || message.includes('declined') || message.includes('cancel')) {
          return new WalletError(
            'Transaction was rejected',
            WALLET_ERROR_CODES.TRANSACTION_REJECTED,
            'crossmint',
            error,
          )
        }

        // Insufficient funds
        if (message.includes('insufficient') || message.includes('balance') || message.includes('funds')) {
          return new WalletError(
            'Insufficient funds to complete this transaction',
            WALLET_ERROR_CODES.INSUFFICIENT_FUNDS,
            'crossmint',
            error,
          )
        }

        // Timeout errors (more specific than network errors)
        if (message.includes('timed out') || message.includes('timeout')) {
          return new WalletError(
            'Transaction timed out. Please try again.',
            WALLET_ERROR_CODES.TRANSACTION_TIMEOUT,
            'crossmint',
            error,
          )
        }

        // Network errors
        if (message.includes('network') || message.includes('connection')) {
          return new WalletError(
            'Network error. Please check your connection and try again.',
            WALLET_ERROR_CODES.NETWORK_ERROR,
            'crossmint',
            error,
          )
        }

        // Session expiration
        if (message.includes('session') || message.includes('expired') || message.includes('token') || message.includes('auth')) {
          return new WalletError(
            'Your session has expired. Please sign in again.',
            WALLET_ERROR_CODES.SESSION_EXPIRED,
            'crossmint',
            error,
          )
        }

        // Wallet not ready
        if (message.includes('wallet not ready') || message.includes('not initialized') || message.includes('not available')) {
          return new WalletError(
            'Crossmint wallet is not ready. Please wait a moment and try again.',
            WALLET_ERROR_CODES.CROSSMINT_WALLET_NOT_READY,
            'crossmint',
            error,
          )
        }

        // Signing errors
        if (message.includes('sign') || message.includes('signature')) {
          return new WalletError(
            'Failed to sign transaction with Crossmint',
            WALLET_ERROR_CODES.CROSSMINT_SIGNING_ERROR,
            'crossmint',
            error,
          )
        }

        // Serialization errors
        if (message.includes('serializ') || message.includes('invalid transaction') || message.includes('malformed')) {
          return new WalletError(
            'Failed to prepare transaction',
            WALLET_ERROR_CODES.TRANSACTION_SERIALIZATION_ERROR,
            'crossmint',
            error,
          )
        }

        // Generic API error with the actual message
        return new WalletError(
          response.data.message,
          WALLET_ERROR_CODES.CROSSMINT_API_ERROR,
          'crossmint',
          error,
        )
      }

      // Check for error message in response
      if (response?.error) {
        const errorMsg = String(response.error).toLowerCase()

        if (errorMsg.includes('reject') || errorMsg.includes('denied')) {
          return new WalletError(
            'Transaction was rejected',
            WALLET_ERROR_CODES.TRANSACTION_REJECTED,
            'crossmint',
            error,
          )
        }

        return new WalletError(
          String(response.error),
          WALLET_ERROR_CODES.CROSSMINT_API_ERROR,
          'crossmint',
          error,
        )
      }
    }

    // Handle standard Error objects
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()

      // User rejection
      if (errorMessage.includes('reject') || errorMessage.includes('denied') || errorMessage.includes('declined') || errorMessage.includes('cancel')) {
        return new WalletError(
          'Transaction was rejected',
          WALLET_ERROR_CODES.TRANSACTION_REJECTED,
          'crossmint',
          error,
        )
      }

      // Insufficient funds
      if (errorMessage.includes('insufficient') || errorMessage.includes('balance') || errorMessage.includes('funds')) {
        return new WalletError(
          'Insufficient funds to complete this transaction',
          WALLET_ERROR_CODES.INSUFFICIENT_FUNDS,
          'crossmint',
          error,
        )
      }

      // Network errors
      if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
        return new WalletError(
          'Network error. Please check your connection and try again.',
          WALLET_ERROR_CODES.NETWORK_ERROR,
          'crossmint',
          error,
        )
      }

      // Session expiration
      if (errorMessage.includes('session') || errorMessage.includes('expired') || errorMessage.includes('token') || errorMessage.includes('auth')) {
        return new WalletError(
          'Your session has expired. Please sign in again.',
          WALLET_ERROR_CODES.SESSION_EXPIRED,
          'crossmint',
          error,
        )
      }

      // Wallet not ready
      if (errorMessage.includes('wallet not ready') || errorMessage.includes('not initialized') || errorMessage.includes('not available') || errorMessage.includes('wallet not connected')) {
        return new WalletError(
          'Crossmint wallet is not ready. Please wait a moment and try again.',
          WALLET_ERROR_CODES.CROSSMINT_WALLET_NOT_READY,
          'crossmint',
          error,
        )
      }

      // Signing errors
      if (errorMessage.includes('sign') || errorMessage.includes('signature')) {
        return new WalletError(
          'Failed to sign transaction with Crossmint',
          WALLET_ERROR_CODES.CROSSMINT_SIGNING_ERROR,
          'crossmint',
          error,
        )
      }

      // Serialization errors
      if (errorMessage.includes('serializ') || errorMessage.includes('invalid transaction') || errorMessage.includes('malformed')) {
        return new WalletError(
          'Failed to prepare transaction',
          WALLET_ERROR_CODES.TRANSACTION_SERIALIZATION_ERROR,
          'crossmint',
          error,
        )
      }

      // Default Crossmint error with original message
      return new WalletError(
        error.message,
        WALLET_ERROR_CODES.CROSSMINT_API_ERROR,
        'crossmint',
        error,
      )
    }

    // Handle non-Error objects
    const errorString = String(error)
    return new WalletError(
      errorString,
      WALLET_ERROR_CODES.CROSSMINT_API_ERROR,
      'crossmint',
      error,
    )
  }

  /**
   * Get user-friendly error message for a WalletError or error code
   *
   * Converts technical error codes into human-readable messages
   * suitable for displaying to end users.
   *
   * @param errorOrCode - WalletError instance or error code string
   * @returns User-friendly error message
   *
   * @example
   * ```typescript
   * const message = WalletErrorHandler.getUserMessage(walletError)
   * toast.error(message) // Display to user
   * ```
   */
  static getUserMessage(errorOrCode: WalletError | WalletErrorCode): string {
    if (errorOrCode instanceof WalletError) {
      return ERROR_MESSAGES[errorOrCode.code] || ERROR_MESSAGES[WALLET_ERROR_CODES.UNKNOWN_ERROR]
    }
    return ERROR_MESSAGES[errorOrCode] || ERROR_MESSAGES[WALLET_ERROR_CODES.UNKNOWN_ERROR]
  }

  /**
   * Log error with context for debugging
   *
   * Logs detailed error information to the console for debugging purposes.
   * Includes error code, message, wallet type, and timestamp.
   *
   * @param error - The error to log
   * @param context - Context string describing where the error occurred
   * @param walletType - Optional wallet type for additional context
   *
   * @example
   * ```typescript
   * WalletErrorHandler.logError(error, 'socialLogin:google', 'crossmint')
   * ```
   */
  static logError(error: unknown, context: string, walletType?: WalletType): void {
    const walletError = walletType
      ? this.parseError(error, walletType, context)
      : error

    console.error(`[${context}] Wallet Error:`, {
      code: walletError instanceof WalletError ? walletError.code : 'UNKNOWN',
      message: walletError instanceof Error ? walletError.message : String(walletError),
      walletType: walletError instanceof WalletError ? walletError.walletType : walletType,
      originalError: walletError instanceof WalletError ? walletError.originalError : error,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Check if an error is recoverable
   *
   * Determines whether the user can retry the operation that caused the error.
   * Recoverable errors are typically temporary issues like timeouts or network errors.
   *
   * @param error - The WalletError to check
   * @returns True if the error is recoverable and user can retry
   *
   * @example
   * ```typescript
   * if (WalletErrorHandler.isRecoverable(walletError)) {
   *   toast.error('Operation failed. Please try again.')
   * } else {
   *   toast.error('Operation failed. Please contact support.')
   * }
   * ```
   */
  static isRecoverable(error: WalletError): boolean {
    const recoverableErrors = [
      WALLET_ERROR_CODES.AUTH_TIMEOUT,
      WALLET_ERROR_CODES.CONNECTION_FAILED,
      WALLET_ERROR_CODES.TRANSACTION_TIMEOUT,
      WALLET_ERROR_CODES.NETWORK_ERROR,
      WALLET_ERROR_CODES.RPC_ERROR,
      WALLET_ERROR_CODES.RATE_LIMIT_EXCEEDED,
    ]

    return recoverableErrors.includes(error.code)
  }

  /**
   * Check if an error requires re-authentication
   *
   * Determines whether the error indicates that the user's session has
   * expired or is invalid, requiring them to authenticate again.
   *
   * @param error - The WalletError to check
   * @returns True if the user needs to re-authenticate
   *
   * @example
   * ```typescript
   * if (WalletErrorHandler.requiresReauth(walletError)) {
   *   toast.error('Your session has expired. Please sign in again.')
   *   openAuthModal()
   * }
   * ```
   */
  static requiresReauth(error: WalletError): boolean {
    const reauthErrors = [
      WALLET_ERROR_CODES.SESSION_EXPIRED,
      WALLET_ERROR_CODES.TOKEN_REFRESH_FAILED,
      WALLET_ERROR_CODES.INVALID_CREDENTIALS,
    ]

    return reauthErrors.includes(error.code)
  }
}
