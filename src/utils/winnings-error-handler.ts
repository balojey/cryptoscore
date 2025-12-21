/**
 * WinningsErrorHandler - Comprehensive error handling utility for winnings calculations
 *
 * Provides centralized error classification, recovery strategies, and user-friendly
 * error messages for all winnings-related operations.
 */

import React from 'react'
import type { WinningsResult } from './winnings-calculator'
import type { MarketData } from '../hooks/useMarketData'

/**
 * Error types for winnings operations
 */
export enum WinningsErrorType {
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  CALCULATION_ERROR = 'calculation_error',
  EXCHANGE_RATE_ERROR = 'exchange_rate_error',
  DATA_CORRUPTION = 'data_corruption',
  TIMEOUT_ERROR = 'timeout_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',        // Warning, doesn't prevent basic functionality
  MEDIUM = 'medium',  // Error, some functionality affected
  HIGH = 'high',      // Critical error, major functionality broken
  CRITICAL = 'critical', // System error, requires immediate attention
}

/**
 * Recovery strategy types
 */
export enum RecoveryStrategy {
  RETRY = 'retry',                    // Can be retried automatically
  MANUAL_RETRY = 'manual_retry',      // Requires user action to retry
  FALLBACK = 'fallback',              // Use fallback data/calculation
  REFRESH_PAGE = 'refresh_page',      // Requires page refresh
  NO_RECOVERY = 'no_recovery',        // Cannot be recovered
}

/**
 * Structured error information
 */
export interface WinningsError {
  type: WinningsErrorType
  severity: ErrorSeverity
  recovery: RecoveryStrategy
  message: string
  userMessage: string
  technicalDetails?: string
  retryable: boolean
  timestamp: number
  context?: {
    marketId?: string
    userId?: string
    operation?: string
    [key: string]: any
  }
}

/**
 * Error handling configuration
 */
interface ErrorHandlingConfig {
  maxRetries: number
  retryDelay: number
  enableFallbacks: boolean
  logErrors: boolean
  showTechnicalDetails: boolean
}

/**
 * Default error handling configuration
 */
const DEFAULT_CONFIG: ErrorHandlingConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  enableFallbacks: true,
  logErrors: true,
  showTechnicalDetails: false,
}

/**
 * WinningsErrorHandler class
 */
export class WinningsErrorHandler {
  private static config: ErrorHandlingConfig = DEFAULT_CONFIG
  private static errorHistory: WinningsError[] = []

  /**
   * Configure error handling behavior
   */
  static configure(config: Partial<ErrorHandlingConfig>): void {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Classify an error and return structured error information
   */
  static classifyError(
    error: Error | string,
    context?: WinningsError['context']
  ): WinningsError {
    const errorMessage = typeof error === 'string' ? error : error.message
    const errorStack = typeof error === 'string' ? undefined : error.stack

    // Classify error type based on message content
    const type = this.determineErrorType(errorMessage)
    const severity = this.determineSeverity(type, errorMessage)
    const recovery = this.determineRecoveryStrategy(type, severity)

    const winningsError: WinningsError = {
      type,
      severity,
      recovery,
      message: errorMessage,
      userMessage: this.generateUserMessage(type, severity),
      technicalDetails: this.config.showTechnicalDetails ? errorStack : undefined,
      retryable: recovery === RecoveryStrategy.RETRY || recovery === RecoveryStrategy.MANUAL_RETRY,
      timestamp: Date.now(),
      context,
    }

    // Log error if enabled
    if (this.config.logErrors) {
      this.logError(winningsError)
    }

    // Store in history
    this.errorHistory.push(winningsError)
    
    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory = this.errorHistory.slice(-50)
    }

    return winningsError
  }

  /**
   * Create a fallback winnings result for errors
   */
  static createFallbackResult(
    error: WinningsError,
    marketData?: MarketData
  ): WinningsResult {
    switch (error.type) {
      case WinningsErrorType.NETWORK_ERROR:
        return {
          type: 'none',
          amount: 0,
          status: 'eligible',
          message: 'Network error - please check your connection',
          displayVariant: 'warning',
          icon: 'AlertTriangle',
        }

      case WinningsErrorType.EXCHANGE_RATE_ERROR:
        return {
          type: 'potential',
          amount: marketData?.entryFee || 0,
          status: 'eligible',
          message: 'Currency conversion unavailable - showing SOL estimate',
          displayVariant: 'warning',
          icon: 'AlertTriangle',
        }

      case WinningsErrorType.VALIDATION_ERROR:
      case WinningsErrorType.DATA_CORRUPTION:
        return {
          type: 'none',
          amount: 0,
          status: 'eligible',
          message: 'Invalid market data - please refresh the page',
          displayVariant: 'error',
          icon: 'AlertTriangle',
        }

      case WinningsErrorType.TIMEOUT_ERROR:
        return {
          type: 'none',
          amount: 0,
          status: 'eligible',
          message: 'Request timed out - please try again',
          displayVariant: 'warning',
          icon: 'Clock',
        }

      case WinningsErrorType.CALCULATION_ERROR:
        return {
          type: 'none',
          amount: 0,
          status: 'eligible',
          message: 'Calculation error - please try again later',
          displayVariant: 'error',
          icon: 'AlertTriangle',
        }

      default:
        return {
          type: 'none',
          amount: 0,
          status: 'eligible',
          message: 'An unexpected error occurred',
          displayVariant: 'error',
          icon: 'AlertTriangle',
        }
    }
  }

  /**
   * Handle error with automatic recovery if possible
   */
  static async handleError(
    error: Error | string,
    context?: WinningsError['context'],
    retryFn?: () => Promise<any>
  ): Promise<{ 
    error: WinningsError
    recovered: boolean
    result?: any 
  }> {
    const winningsError = this.classifyError(error, context)

    // Attempt automatic recovery for retryable errors
    if (winningsError.retryable && retryFn && winningsError.recovery === RecoveryStrategy.RETRY) {
      for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
        try {
          // Wait before retry
          await this.delay(this.config.retryDelay * attempt)
          
          // Attempt recovery
          const result = await retryFn()
          
          console.log(`[WinningsErrorHandler] Recovered after ${attempt} attempts`)
          return { error: winningsError, recovered: true, result }
        } catch (retryError) {
          console.warn(`[WinningsErrorHandler] Retry attempt ${attempt} failed:`, retryError)
          
          // If this was the last attempt, update error
          if (attempt === this.config.maxRetries) {
            winningsError.message += ` (Failed after ${attempt} retries)`
            winningsError.recovery = RecoveryStrategy.MANUAL_RETRY
          }
        }
      }
    }

    return { error: winningsError, recovered: false }
  }

  /**
   * Get error statistics for debugging
   */
  static getErrorStats(): {
    total: number
    byType: Record<WinningsErrorType, number>
    bySeverity: Record<ErrorSeverity, number>
    recent: WinningsError[]
  } {
    const byType = {} as Record<WinningsErrorType, number>
    const bySeverity = {} as Record<ErrorSeverity, number>

    // Initialize counters
    Object.values(WinningsErrorType).forEach(type => {
      byType[type] = 0
    })
    Object.values(ErrorSeverity).forEach(severity => {
      bySeverity[severity] = 0
    })

    // Count errors
    this.errorHistory.forEach(error => {
      byType[error.type]++
      bySeverity[error.severity]++
    })

    return {
      total: this.errorHistory.length,
      byType,
      bySeverity,
      recent: this.errorHistory.slice(-10), // Last 10 errors
    }
  }

  /**
   * Clear error history
   */
  static clearHistory(): void {
    this.errorHistory = []
  }

  // Private helper methods

  private static determineErrorType(message: string): WinningsErrorType {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
      return WinningsErrorType.NETWORK_ERROR
    }

    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return WinningsErrorType.TIMEOUT_ERROR
    }

    if (lowerMessage.includes('invalid') || lowerMessage.includes('validation') || lowerMessage.includes('corrupt')) {
      return WinningsErrorType.VALIDATION_ERROR
    }

    if (lowerMessage.includes('exchange rate') || lowerMessage.includes('currency') || lowerMessage.includes('conversion')) {
      return WinningsErrorType.EXCHANGE_RATE_ERROR
    }

    if (lowerMessage.includes('calculation') || lowerMessage.includes('math') || lowerMessage.includes('overflow')) {
      return WinningsErrorType.CALCULATION_ERROR
    }

    if (lowerMessage.includes('data') && (lowerMessage.includes('corrupt') || lowerMessage.includes('inconsistent'))) {
      return WinningsErrorType.DATA_CORRUPTION
    }

    return WinningsErrorType.UNKNOWN_ERROR
  }

  private static determineSeverity(type: WinningsErrorType, message: string): ErrorSeverity {
    switch (type) {
      case WinningsErrorType.EXCHANGE_RATE_ERROR:
        return ErrorSeverity.LOW // Can still show SOL values

      case WinningsErrorType.NETWORK_ERROR:
      case WinningsErrorType.TIMEOUT_ERROR:
        return ErrorSeverity.MEDIUM // Affects functionality but recoverable

      case WinningsErrorType.CALCULATION_ERROR:
        return ErrorSeverity.MEDIUM // Affects core functionality

      case WinningsErrorType.VALIDATION_ERROR:
      case WinningsErrorType.DATA_CORRUPTION:
        return ErrorSeverity.HIGH // Indicates serious data issues

      case WinningsErrorType.UNKNOWN_ERROR:
        // Determine based on message content
        if (message.includes('critical') || message.includes('fatal')) {
          return ErrorSeverity.CRITICAL
        }
        return ErrorSeverity.MEDIUM

      default:
        return ErrorSeverity.MEDIUM
    }
  }

  private static determineRecoveryStrategy(type: WinningsErrorType, severity: ErrorSeverity): RecoveryStrategy {
    switch (type) {
      case WinningsErrorType.NETWORK_ERROR:
      case WinningsErrorType.TIMEOUT_ERROR:
        return RecoveryStrategy.RETRY

      case WinningsErrorType.EXCHANGE_RATE_ERROR:
        return RecoveryStrategy.FALLBACK

      case WinningsErrorType.CALCULATION_ERROR:
        return severity === ErrorSeverity.HIGH ? RecoveryStrategy.REFRESH_PAGE : RecoveryStrategy.MANUAL_RETRY

      case WinningsErrorType.VALIDATION_ERROR:
      case WinningsErrorType.DATA_CORRUPTION:
        return RecoveryStrategy.REFRESH_PAGE

      case WinningsErrorType.UNKNOWN_ERROR:
        return severity >= ErrorSeverity.HIGH ? RecoveryStrategy.REFRESH_PAGE : RecoveryStrategy.MANUAL_RETRY

      default:
        return RecoveryStrategy.MANUAL_RETRY
    }
  }

  private static generateUserMessage(type: WinningsErrorType, severity: ErrorSeverity): string {
    switch (type) {
      case WinningsErrorType.NETWORK_ERROR:
        return 'Unable to connect to the network. Please check your internet connection.'

      case WinningsErrorType.TIMEOUT_ERROR:
        return 'The request is taking longer than expected. Please try again.'

      case WinningsErrorType.EXCHANGE_RATE_ERROR:
        return 'Currency conversion is temporarily unavailable. Amounts are shown in SOL.'

      case WinningsErrorType.VALIDATION_ERROR:
        return 'The market data appears to be invalid. Please refresh the page.'

      case WinningsErrorType.DATA_CORRUPTION:
        return 'The market data is corrupted. Please refresh the page to reload.'

      case WinningsErrorType.CALCULATION_ERROR:
        return severity === ErrorSeverity.HIGH 
          ? 'A serious calculation error occurred. Please refresh the page.'
          : 'Unable to calculate winnings. Please try again.'

      case WinningsErrorType.UNKNOWN_ERROR:
        return severity >= ErrorSeverity.HIGH
          ? 'A critical error occurred. Please refresh the page.'
          : 'An unexpected error occurred. Please try again.'

      default:
        return 'Something went wrong. Please try again.'
    }
  }

  private static logError(error: WinningsError): void {
    const logLevel = error.severity === ErrorSeverity.CRITICAL ? 'error' : 
                    error.severity === ErrorSeverity.HIGH ? 'error' :
                    error.severity === ErrorSeverity.MEDIUM ? 'warn' : 'info'

    console[logLevel]('[WinningsErrorHandler]', {
      type: error.type,
      severity: error.severity,
      message: error.message,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString(),
    })
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * React hook for winnings error handling
 */
export function useWinningsErrorHandler() {
  const [errors, setErrors] = React.useState<WinningsError[]>([])

  const handleError = React.useCallback(async (
    error: Error | string,
    context?: WinningsError['context'],
    retryFn?: () => Promise<any>
  ) => {
    const result = await WinningsErrorHandler.handleError(error, context, retryFn)
    
    setErrors(prev => [...prev, result.error])
    
    return result
  }, [])

  const clearErrors = React.useCallback(() => {
    setErrors([])
  }, [])

  const getLatestError = React.useCallback(() => {
    return errors[errors.length - 1] || null
  }, [errors])

  return {
    errors,
    handleError,
    clearErrors,
    getLatestError,
    errorStats: WinningsErrorHandler.getErrorStats(),
  }
}

// Export for use in other modules
export { WinningsErrorHandler as default }