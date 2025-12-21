// MNEE utility functions

import type { RetryConfig } from './types'
import { MneeError, MneeNetworkError } from './types'

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on validation errors
      if (error instanceof MneeError && error.code === 'VALIDATION_ERROR') {
        throw error
      }
      
      if (attempt === config.maxAttempts) {
        break
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
        config.maxDelay
      )
      
      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000
      
      await sleep(jitteredDelay)
    }
  }
  
  throw new MneeNetworkError(
    `Operation failed after ${config.maxAttempts} attempts: ${lastError?.message || 'Unknown error'}`,
    { originalError: lastError, attempts: config.maxAttempts }
  )
}

/**
 * Sleep utility function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Validate EVM address format
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate private key format
 */
export function isValidPrivateKey(privateKey: string): boolean {
  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey
  return /^[a-fA-F0-9]{64}$/.test(cleanKey)
}

/**
 * Format error message for user display
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof MneeError) {
    return error.message
  }
  
  if (error instanceof Error) {
    // Map common SDK errors to user-friendly messages
    if (error.message.includes('insufficient balance')) {
      return 'Insufficient MNEE balance for this transaction'
    }
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again'
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again'
    }
    if (error.message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again'
    }
    
    return error.message
  }
  
  return 'An unexpected error occurred'
}

/**
 * Debounce function for balance updates
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle function for API calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Create a timeout promise
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new MneeNetworkError(errorMessage)), timeoutMs)
  })
  
  return Promise.race([promise, timeoutPromise])
}

/**
 * Batch array into chunks
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = []
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize))
  }
  return batches
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * Generate correlation ID for request tracking
 */
export function generateCorrelationId(): string {
  return `mnee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}