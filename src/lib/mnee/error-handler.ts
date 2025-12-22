// Enhanced error handling service for MNEE operations

import type { RetryConfig } from './types'
import { 
  MneeError, 
  MneeNetworkError, 
  MneeValidationError, 
  MneeConfigurationError 
} from './types'
import { retryWithBackoff, generateCorrelationId } from './utils'

export interface ErrorContext {
  operation: string
  correlationId: string
  address?: string
  amount?: number
  ticketId?: string
  originalError?: unknown
  timestamp: number
  retryAttempt?: number
}

export interface UserFriendlyError {
  title: string
  message: string
  action?: string
  canRetry: boolean
  severity: 'low' | 'medium' | 'high'
}

export interface ErrorRecoveryOptions {
  enableRetry?: boolean
  maxRetries?: number
  fallbackToCache?: boolean
  notifyUser?: boolean
  logError?: boolean
}

export class MneeErrorHandler {
  private static errorLog: ErrorContext[] = []
  private static readonly MAX_ERROR_LOG_SIZE = 100

  /**
   * Handle MNEE SDK operation with comprehensive error handling
   */
  static async handleOperation<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext>,
    retryConfig?: RetryConfig,
    recoveryOptions: ErrorRecoveryOptions = {}
  ): Promise<T> {
    const correlationId = context.correlationId || generateCorrelationId()
    const fullContext: ErrorContext = {
      operation: 'unknown',
      correlationId,
      timestamp: Date.now(),
      ...context
    }

    const {
      enableRetry = true,
      maxRetries = 3,
      fallbackToCache = false,
      notifyUser = true,
      logError = true
    } = recoveryOptions

    try {
      if (enableRetry && retryConfig) {
        return await retryWithBackoff(operation, retryConfig)
      } else {
        return await operation()
      }
    } catch (error) {
      const enhancedContext = {
        ...fullContext,
        originalError: error
      }

      if (logError) {
        this.logError(enhancedContext)
      }

      // Try to recover from the error
      const recoveredResult = await this.attemptErrorRecovery<T>(
        error,
        enhancedContext,
        { enableRetry, maxRetries, fallbackToCache, notifyUser, logError }
      )

      if (recoveredResult !== null) {
        return recoveredResult
      }

      // If recovery failed, throw enhanced error
      throw this.enhanceError(error, enhancedContext)
    }
  }

  /**
   * Convert technical errors to user-friendly messages
   */
  static getUserFriendlyError(error: unknown, _context?: Partial<ErrorContext>): UserFriendlyError {
    if (error instanceof MneeValidationError) {
      return {
        title: 'Invalid Input',
        message: error.message,
        action: 'Please check your input and try again',
        canRetry: false,
        severity: 'medium'
      }
    }

    if (error instanceof MneeConfigurationError) {
      return {
        title: 'Configuration Error',
        message: 'There is a problem with the MNEE service configuration',
        action: 'Please contact support if this problem persists',
        canRetry: false,
        severity: 'high'
      }
    }

    if (error instanceof MneeNetworkError) {
      const isTimeout = error.message.includes('timeout')
      const isRateLimit = error.message.includes('rate limit')
      const isConnection = error.message.includes('network') || error.message.includes('connection')

      if (isTimeout) {
        return {
          title: 'Request Timeout',
          message: 'The operation took too long to complete',
          action: 'Please try again in a moment',
          canRetry: true,
          severity: 'medium'
        }
      }

      if (isRateLimit) {
        return {
          title: 'Too Many Requests',
          message: 'You are making requests too quickly',
          action: 'Please wait a moment before trying again',
          canRetry: true,
          severity: 'low'
        }
      }

      if (isConnection) {
        return {
          title: 'Connection Error',
          message: 'Unable to connect to the MNEE network',
          action: 'Please check your internet connection and try again',
          canRetry: true,
          severity: 'medium'
        }
      }

      return {
        title: 'Network Error',
        message: 'A network error occurred while processing your request',
        action: 'Please try again in a moment',
        canRetry: true,
        severity: 'medium'
      }
    }

    if (error instanceof MneeError) {
      return {
        title: 'MNEE Error',
        message: error.message,
        action: 'Please try again or contact support if the problem persists',
        canRetry: true,
        severity: 'medium'
      }
    }

    // Handle common SDK errors
    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      if (message.includes('insufficient balance')) {
        return {
          title: 'Insufficient Balance',
          message: 'You do not have enough MNEE tokens for this transaction',
          action: 'Please add more MNEE tokens to your wallet',
          canRetry: false,
          severity: 'medium'
        }
      }

      if (message.includes('invalid address')) {
        return {
          title: 'Invalid Address',
          message: 'The wallet address provided is not valid',
          action: 'Please check the address and try again',
          canRetry: false,
          severity: 'medium'
        }
      }

      if (message.includes('transaction failed')) {
        return {
          title: 'Transaction Failed',
          message: 'The MNEE transaction could not be completed',
          action: 'Please try again or contact support',
          canRetry: true,
          severity: 'high'
        }
      }

      if (message.includes('unauthorized') || message.includes('forbidden')) {
        return {
          title: 'Authorization Error',
          message: 'You are not authorized to perform this operation',
          action: 'Please check your wallet connection and try again',
          canRetry: false,
          severity: 'high'
        }
      }
    }

    // Fallback for unknown errors
    return {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred',
      action: 'Please try again or contact support if the problem persists',
      canRetry: true,
      severity: 'medium'
    }
  }

  /**
   * Attempt to recover from errors using various strategies
   */
  private static async attemptErrorRecovery<T>(
    error: unknown,
    context: ErrorContext,
    options: ErrorRecoveryOptions
  ): Promise<T | null> {
    // Strategy 1: Fallback to cached data for balance queries
    if (options.fallbackToCache && context.operation.includes('balance') && context.address) {
      try {
        const cachedBalance = await this.getCachedBalance(context.address)
        if (cachedBalance !== null) {
          console.warn(`[${context.correlationId}] Using cached balance for ${context.address}`)
          return cachedBalance as T
        }
      } catch (cacheError) {
        console.warn(`[${context.correlationId}] Cache fallback failed:`, cacheError)
      }
    }

    // Strategy 2: Retry with exponential backoff for network errors
    if (error instanceof MneeNetworkError && options.enableRetry) {
      const retryCount = context.retryAttempt || 0
      const maxRetries = options.maxRetries || 3

      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        console.warn(`[${context.correlationId}] Retrying operation after ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)
        
        await new Promise(resolve => setTimeout(resolve, delay))
        // Return null to indicate retry should be handled by caller
        return null
      }
    }

    // Strategy 3: Graceful degradation for non-critical operations
    if (context.operation.includes('subscription') || context.operation.includes('notification')) {
      console.warn(`[${context.correlationId}] Gracefully degrading non-critical operation: ${context.operation}`)
      // Return a default value for non-critical operations
      return {} as T
    }

    return null
  }

  /**
   * Get cached balance from database
   */
  private static async getCachedBalance(address: string): Promise<any | null> {
    try {
      // Import dynamically to avoid circular dependencies
      const { DatabaseService } = await import('@/lib/supabase/database-service')
      const { UserService } = await import('@/lib/supabase/user-service')
      
      // Get user by wallet address
      const user = await UserService.getUserByWalletAddress(address)
      if (!user) return null

      // Get cached balance
      const cachedBalance = await DatabaseService.getMneeBalanceCache(user.id, address)
      if (!cachedBalance) return null

      // Check if cache is not too old (5 minutes)
      const cacheAge = Date.now() - new Date(cachedBalance.last_updated || Date.now()).getTime()
      if (cacheAge > 5 * 60 * 1000) return null

      return {
        address,
        amount: cachedBalance.balance_atomic,
        decimalAmount: cachedBalance.balance_decimal,
        lastUpdated: new Date(cachedBalance.last_updated || Date.now()).getTime()
      }
    } catch (error) {
      console.warn('Failed to get cached balance:', error)
      return null
    }
  }

  /**
   * Enhance error with additional context and correlation ID
   */
  private static enhanceError(error: unknown, context: ErrorContext): Error {
    if (error instanceof MneeError) {
      // Add context to existing MNEE error
      error.details = {
        ...error.details,
        ...context
      }
      return error
    }

    if (error instanceof Error) {
      // Wrap regular errors in MneeError with context
      return new MneeError(
        `${context.operation} failed: ${error.message}`,
        'OPERATION_FAILED',
        context
      )
    }

    // Handle unknown error types
    return new MneeError(
      `${context.operation} failed with unknown error`,
      'UNKNOWN_ERROR',
      { ...context, originalError: error }
    )
  }

  /**
   * Log error for debugging and monitoring
   */
  private static logError(context: ErrorContext): void {
    // Add to in-memory log
    this.errorLog.unshift(context)
    
    // Keep log size manageable
    if (this.errorLog.length > this.MAX_ERROR_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(0, this.MAX_ERROR_LOG_SIZE)
    }

    // Console logging with structured format
    console.error(`[MNEE Error] ${context.operation}`, {
      correlationId: context.correlationId,
      timestamp: new Date(context.timestamp).toISOString(),
      address: context.address,
      amount: context.amount,
      ticketId: context.ticketId,
      error: context.originalError
    })

    // TODO: Send to external monitoring service in production
    // this.sendToMonitoring(context)
  }

  /**
   * Get recent error log for debugging
   */
  static getErrorLog(limit = 20): ErrorContext[] {
    return this.errorLog.slice(0, limit)
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * Get error statistics
   */
  static getErrorStats(): {
    totalErrors: number
    errorsByOperation: Record<string, number>
    errorsByType: Record<string, number>
    recentErrors: number
  } {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    const recentErrors = this.errorLog.filter(error => error.timestamp > oneHourAgo)
    
    const errorsByOperation = this.errorLog.reduce((acc, error) => {
      acc[error.operation] = (acc[error.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const errorsByType = this.errorLog.reduce((acc, error) => {
      const errorType = error.originalError instanceof Error 
        ? error.originalError.constructor.name 
        : 'Unknown'
      acc[errorType] = (acc[errorType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalErrors: this.errorLog.length,
      errorsByOperation,
      errorsByType,
      recentErrors: recentErrors.length
    }
  }

  /**
   * Check if operation should be retried based on error history
   */
  static shouldRetryOperation(operation: string, address?: string): boolean {
    const recentErrors = this.errorLog.filter(error => {
      const isRecent = Date.now() - error.timestamp < 5 * 60 * 1000 // 5 minutes
      const sameOperation = error.operation === operation
      const sameAddress = !address || error.address === address
      return isRecent && sameOperation && sameAddress
    })

    // Don't retry if there have been too many recent failures
    return recentErrors.length < 3
  }

  /**
   * Create a recovery strategy for specific error types
   */
  static createRecoveryStrategy(error: unknown): ErrorRecoveryOptions {
    if (error instanceof MneeValidationError) {
      return {
        enableRetry: false,
        fallbackToCache: false,
        notifyUser: true,
        logError: true
      }
    }

    if (error instanceof MneeNetworkError) {
      const isTimeout = error.message.includes('timeout')
      const isRateLimit = error.message.includes('rate limit')

      return {
        enableRetry: true,
        maxRetries: isTimeout ? 2 : isRateLimit ? 1 : 3,
        fallbackToCache: true,
        notifyUser: true,
        logError: true
      }
    }

    if (error instanceof MneeConfigurationError) {
      return {
        enableRetry: false,
        fallbackToCache: false,
        notifyUser: true,
        logError: true
      }
    }

    // Default strategy for unknown errors
    return {
      enableRetry: true,
      maxRetries: 2,
      fallbackToCache: true,
      notifyUser: true,
      logError: true
    }
  }
}

/**
 * Decorator for automatic error handling
 */
export function withErrorHandling<T extends any[], R>(
  _operation: string,
  retryConfig?: RetryConfig
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value!

    descriptor.value = async function (...args: T): Promise<R> {
      const context: Partial<ErrorContext> = {
        operation: `${target.constructor.name}.${propertyKey}`,
        correlationId: generateCorrelationId()
      }

      return MneeErrorHandler.handleOperation(
        () => originalMethod.apply(this, args),
        context,
        retryConfig,
        MneeErrorHandler.createRecoveryStrategy(new Error('Unknown'))
      )
    }

    return descriptor
  }
}