/**
 * Crossmint Session Manager
 *
 * Handles session persistence, token storage, and automatic session restoration
 * for Crossmint-authenticated users. The Crossmint SDK handles most of the
 * token management internally, but this utility provides additional session
 * monitoring and restoration capabilities.
 */

import { WALLET_ERROR_CODES, WalletError, WalletErrorHandler } from './wallet-error-handler'

/**
 * Session storage keys
 */
const SESSION_KEYS = {
  LAST_AUTH_METHOD: 'crossmint_last_auth_method',
  SESSION_TIMESTAMP: 'crossmint_session_timestamp',
  USER_PREFERENCES: 'crossmint_user_preferences',
} as const

/**
 * Session metadata stored in localStorage
 */
interface SessionMetadata {
  authMethod?: 'google' | 'twitter' | 'farcaster' | 'email' | 'web3'
  timestamp: number
  userId?: string
}

/**
 * User preferences that persist across sessions
 */
interface UserPreferences {
  rememberMe: boolean
  lastWalletAddress?: string
}

/**
 * Session Manager class
 *
 * Provides static methods for managing Crossmint user sessions, including
 * session persistence, validation, and monitoring.
 */
export class SessionManager {
  /**
   * Store session metadata when user authenticates
   *
   * Saves authentication method and timestamp to localStorage for
   * session restoration and monitoring.
   *
   * @param metadata - Session metadata to store (timestamp added automatically)
   *
   * @example
   * ```typescript
   * SessionManager.storeSessionMetadata({
   *   authMethod: 'google',
   *   userId: 'user123'
   * })
   * ```
   */
  static storeSessionMetadata(metadata: Omit<SessionMetadata, 'timestamp'>): void {
    try {
      const sessionData: SessionMetadata = {
        ...metadata,
        timestamp: Date.now(),
      }

      if (metadata.authMethod) {
        localStorage.setItem(SESSION_KEYS.LAST_AUTH_METHOD, metadata.authMethod)
      }

      localStorage.setItem(SESSION_KEYS.SESSION_TIMESTAMP, String(sessionData.timestamp))

      console.log('[SessionManager] Session metadata stored:', {
        authMethod: metadata.authMethod,
        userId: metadata.userId,
      })
    }
    catch (error) {
      WalletErrorHandler.logError(error, 'storeSessionMetadata', 'crossmint')
    }
  }

  /**
   * Get stored session metadata
   *
   * Retrieves session information from localStorage.
   *
   * @returns Session metadata if available, null otherwise
   *
   * @example
   * ```typescript
   * const metadata = SessionManager.getSessionMetadata()
   * if (metadata) {
   *   console.log(`Last auth: ${metadata.authMethod}`)
   * }
   * ```
   */
  static getSessionMetadata(): SessionMetadata | null {
    try {
      const authMethod = localStorage.getItem(SESSION_KEYS.LAST_AUTH_METHOD)
      const timestamp = localStorage.getItem(SESSION_KEYS.SESSION_TIMESTAMP)

      if (!timestamp) {
        return null
      }

      return {
        authMethod: authMethod as SessionMetadata['authMethod'],
        timestamp: Number.parseInt(timestamp, 10),
      }
    }
    catch (error) {
      WalletErrorHandler.logError(error, 'getSessionMetadata', 'crossmint')
      return null
    }
  }

  /**
   * Clear session metadata on logout
   *
   * Removes all session-related data from localStorage.
   * Should be called when user logs out.
   */
  static clearSessionMetadata(): void {
    try {
      localStorage.removeItem(SESSION_KEYS.LAST_AUTH_METHOD)
      localStorage.removeItem(SESSION_KEYS.SESSION_TIMESTAMP)

      console.log('[SessionManager] Session metadata cleared')
    }
    catch (error) {
      WalletErrorHandler.logError(error, 'clearSessionMetadata', 'crossmint')
    }
  }

  /**
   * Check if a session exists and is recent
   *
   * Determines whether there's a stored session that's newer than the
   * specified maximum age.
   *
   * @param maxAgeMs - Maximum age of session in milliseconds (default: 7 days)
   * @returns True if a recent session exists
   *
   * @example
   * ```typescript
   * if (SessionManager.hasRecentSession()) {
   *   // Attempt session restoration
   * }
   * ```
   */
  static hasRecentSession(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): boolean {
    const metadata = this.getSessionMetadata()

    if (!metadata) {
      return false
    }

    const age = Date.now() - metadata.timestamp
    return age < maxAgeMs
  }

  /**
   * Store user preferences
   */
  static storeUserPreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(SESSION_KEYS.USER_PREFERENCES, JSON.stringify(preferences))
      console.log('[SessionManager] User preferences stored')
    }
    catch (error) {
      WalletErrorHandler.logError(error, 'storeUserPreferences', 'crossmint')
    }
  }

  /**
   * Get user preferences
   */
  static getUserPreferences(): UserPreferences | null {
    try {
      const preferencesJson = localStorage.getItem(SESSION_KEYS.USER_PREFERENCES)

      if (!preferencesJson) {
        return null
      }

      return JSON.parse(preferencesJson) as UserPreferences
    }
    catch (error) {
      WalletErrorHandler.logError(error, 'getUserPreferences', 'crossmint')
      return null
    }
  }

  /**
   * Clear user preferences
   */
  static clearUserPreferences(): void {
    try {
      localStorage.removeItem(SESSION_KEYS.USER_PREFERENCES)
      console.log('[SessionManager] User preferences cleared')
    }
    catch (error) {
      WalletErrorHandler.logError(error, 'clearUserPreferences', 'crossmint')
    }
  }

  /**
   * Clear all session data
   *
   * Removes all session-related data including metadata and user preferences.
   * Should be called on logout or when clearing application state.
   */
  static clearAll(): void {
    this.clearSessionMetadata()
    this.clearUserPreferences()
  }

  /**
   * Validate session and check if token refresh is needed
   *
   * Checks if the stored session is still valid and determines if
   * token refresh is needed. The Crossmint SDK handles token refresh
   * automatically, but this provides additional validation and monitoring.
   *
   * @returns Validation result with status and optional error
   *
   * @example
   * ```typescript
   * const validation = await SessionManager.validateSession()
   * if (!validation.valid) {
   *   console.error('Session invalid:', validation.error)
   * } else if (validation.needsRefresh) {
   *   console.log('Session needs refresh')
   * }
   * ```
   */
  static async validateSession(): Promise<{
    valid: boolean
    needsRefresh: boolean
    error?: WalletError
  }> {
    try {
      const metadata = this.getSessionMetadata()

      if (!metadata) {
        return {
          valid: false,
          needsRefresh: false,
        }
      }

      // Check if session is too old (7 days)
      const maxAge = 7 * 24 * 60 * 60 * 1000
      const age = Date.now() - metadata.timestamp

      if (age > maxAge) {
        return {
          valid: false,
          needsRefresh: false,
          error: new WalletError(
            'Session expired',
            WALLET_ERROR_CODES.SESSION_EXPIRED,
            'crossmint',
          ),
        }
      }

      // Check if session needs refresh (older than 1 day)
      const refreshThreshold = 24 * 60 * 60 * 1000
      const needsRefresh = age > refreshThreshold

      return {
        valid: true,
        needsRefresh,
      }
    }
    catch (error) {
      WalletErrorHandler.logError(error, 'validateSession', 'crossmint')

      return {
        valid: false,
        needsRefresh: false,
        error: WalletErrorHandler.parseError(error, 'crossmint', 'validateSession'),
      }
    }
  }

  /**
   * Monitor session health and trigger callbacks if needed
   *
   * Validates the session and triggers appropriate callbacks based on
   * session status. Should be called periodically (e.g., every 5 minutes).
   *
   * @param onSessionExpired - Callback to execute if session has expired
   * @param onRefreshNeeded - Callback to execute if session needs refresh
   *
   * @example
   * ```typescript
   * await SessionManager.monitorSession(
   *   () => toast.error('Session expired'),
   *   () => console.log('Refreshing session')
   * )
   * ```
   */
  static async monitorSession(
    onSessionExpired?: () => void,
    onRefreshNeeded?: () => void,
  ): Promise<void> {
    const validation = await this.validateSession()

    if (!validation.valid) {
      if (validation.error && onSessionExpired) {
        console.log('[SessionManager] Session expired, triggering callback')
        onSessionExpired()
      }
      return
    }

    if (validation.needsRefresh && onRefreshNeeded) {
      console.log('[SessionManager] Session needs refresh, triggering callback')
      onRefreshNeeded()
    }
  }

  /**
   * Get session age in milliseconds
   *
   * Calculates how long the current session has been active.
   *
   * @returns Session age in milliseconds, or null if no session exists
   */
  static getSessionAge(): number | null {
    const metadata = this.getSessionMetadata()

    if (!metadata) {
      return null
    }

    return Date.now() - metadata.timestamp
  }

  /**
   * Check if session is about to expire
   *
   * Determines if the session will expire within 1 hour, allowing
   * the application to warn users to save their work.
   *
   * @returns True if session expires within 1 hour
   */
  static isSessionExpiringSoon(): boolean {
    const age = this.getSessionAge()

    if (age === null) {
      return false
    }

    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    const warningThreshold = maxAge - (60 * 60 * 1000) // 1 hour before expiry

    return age > warningThreshold
  }
}
