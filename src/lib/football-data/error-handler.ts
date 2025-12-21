/**
 * Football-Data API Error Handler
 *
 * Centralized error handling for football-data API integration.
 * Provides consistent error classification, retry logic, and user-friendly messages.
 *
 * @module lib/football-data/error-handler
 */

/**
 * Error types for football-data API
 */
export enum FootballDataErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Football-Data API error class
 */
export class FootballDataError extends Error {
  public readonly type: FootballDataErrorType
  public readonly statusCode?: number
  public readonly retryable: boolean
  public readonly retryAfter?: number

  constructor(
    message: string,
    type: FootballDataErrorType,
    statusCode?: number,
    retryable = false,
    retryAfter?: number
  ) {
    super(message)
    this.name = 'FootballDataError'
    this.type = type
    this.statusCode = statusCode
    this.retryable = retryable
    this.retryAfter = retryAfter
  }
}

/**
 * Error handler for football-data API responses
 */
export class FootballDataErrorHandler {
  /**
   * Handle fetch errors and HTTP response errors
   */
  static handleError(error: unknown, response?: Response): FootballDataError {
    // Handle fetch errors (network, timeout, etc.)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new FootballDataError(
          'Request timeout - the API took too long to respond',
          FootballDataErrorType.TIMEOUT_ERROR,
          undefined,
          true
        )
      }

      if (error.message.includes('fetch')) {
        return new FootballDataError(
          'Network error - unable to connect to football-data API',
          FootballDataErrorType.NETWORK_ERROR,
          undefined,
          true
        )
      }
    }

    // Handle HTTP response errors
    if (response) {
      return this.handleHttpError(response)
    }

    // Handle unknown errors
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return new FootballDataError(
      message,
      FootballDataErrorType.UNKNOWN_ERROR,
      undefined,
      false
    )
  }

  /**
   * Handle HTTP response errors
   */
  private static handleHttpError(response: Response): FootballDataError {
    const { status, statusText } = response

    switch (status) {
      case 400:
        return new FootballDataError(
          'Invalid request - check your request parameters',
          FootballDataErrorType.INVALID_REQUEST,
          status,
          false
        )

      case 401:
        return new FootballDataError(
          'Authentication failed - check your API key',
          FootballDataErrorType.AUTHENTICATION_ERROR,
          status,
          false
        )

      case 403:
        return new FootballDataError(
          'Access forbidden - your API key may not have sufficient permissions',
          FootballDataErrorType.AUTHENTICATION_ERROR,
          status,
          false
        )

      case 404:
        return new FootballDataError(
          'Resource not found - the requested match or competition does not exist',
          FootballDataErrorType.NOT_FOUND,
          status,
          false
        )

      case 429: {
        const retryAfter = response.headers.get('Retry-After')
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 60

        return new FootballDataError(
          `Rate limit exceeded - too many requests. Retry after ${retryAfterSeconds} seconds`,
          FootballDataErrorType.RATE_LIMIT_EXCEEDED,
          status,
          true,
          retryAfterSeconds * 1000
        )
      }

      case 500:
      case 502:
      case 503:
      case 504:
        return new FootballDataError(
          'Server error - the football-data API is experiencing issues',
          FootballDataErrorType.SERVER_ERROR,
          status,
          true
        )

      default:
        return new FootballDataError(
          `HTTP error ${status}: ${statusText}`,
          FootballDataErrorType.UNKNOWN_ERROR,
          status,
          status >= 500
        )
    }
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: FootballDataError): string {
    switch (error.type) {
      case FootballDataErrorType.NETWORK_ERROR:
        return 'Unable to connect to the sports data service. Please check your internet connection and try again.'

      case FootballDataErrorType.RATE_LIMIT_EXCEEDED:
        return 'Too many requests to the sports data service. Please wait a moment and try again.'

      case FootballDataErrorType.AUTHENTICATION_ERROR:
        return 'There was an issue with the sports data service authentication. Please contact support.'

      case FootballDataErrorType.NOT_FOUND:
        return 'The requested match or competition could not be found.'

      case FootballDataErrorType.INVALID_REQUEST:
        return 'Invalid request parameters. Please check your input and try again.'

      case FootballDataErrorType.SERVER_ERROR:
        return 'The sports data service is temporarily unavailable. Please try again later.'

      case FootballDataErrorType.TIMEOUT_ERROR:
        return 'The request took too long to complete. Please try again.'

      default:
        return 'An unexpected error occurred while fetching sports data. Please try again.'
    }
  }

  /**
   * Determine if an error should trigger a retry
   */
  static shouldRetry(error: FootballDataError, attemptNumber: number, maxAttempts: number): boolean {
    // Don't retry if we've exceeded max attempts
    if (attemptNumber >= maxAttempts) {
      return false
    }

    // Only retry retryable errors
    return error.retryable
  }

  /**
   * Calculate retry delay based on error type and attempt number
   */
  static getRetryDelay(error: FootballDataError, attemptNumber: number): number {
    // Use specific retry-after header if available
    if (error.retryAfter) {
      return error.retryAfter
    }

    // Exponential backoff for retryable errors
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds

    const delay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay)

    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay
    
    return delay + jitter
  }

  /**
   * Log error for debugging and monitoring
   */
  static logError(error: FootballDataError, context?: Record<string, any>): void {
    const logData = {
      error: {
        message: error.message,
        type: error.type,
        statusCode: error.statusCode,
        retryable: error.retryable,
        retryAfter: error.retryAfter,
      },
      context,
      timestamp: new Date().toISOString(),
    }

    // In production, you might want to send this to a logging service
    console.error('Football-Data API Error:', logData)
  }

  /**
   * Create error from API response body
   */
  static async createFromResponse(response: Response): Promise<FootballDataError> {
    try {
      const errorData = await response.json()
      const message = errorData.message || errorData.error || response.statusText
      
      return this.handleHttpError(response)
    } catch {
      // If we can't parse the response body, fall back to status-based error
      return this.handleHttpError(response)
    }
  }
}

/**
 * Utility function to wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<{ data: T | null; error: FootballDataError | null }> {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const footballDataError = error instanceof FootballDataError 
      ? error 
      : FootballDataErrorHandler.handleError(error)

    FootballDataErrorHandler.logError(footballDataError, context)

    return { data: null, error: footballDataError }
  }
}