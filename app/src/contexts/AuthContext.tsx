/**
 * Authentication Context
 *
 * Provides unified authentication state management that integrates
 * Crossmint authentication with Supabase user storage.
 */

import { useAuth as useCrossmintAuth, useWallet as useCrossmintWallet } from '@crossmint/client-sdk-react-ui'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SessionManager } from '@/lib/crossmint/session-manager'
import { UserService, type AuthResult, type CrossmintUser } from '@/lib/supabase/user-service'
import type { Database } from '@/types/supabase'

type User = Database['public']['Tables']['users']['Row']

/**
 * Authentication state
 */
export interface AuthState {
  /** Current authenticated user from Supabase */
  user: User | null
  
  /** Whether authentication is in progress */
  isLoading: boolean
  
  /** Whether user data is being loaded/updated */
  isUpdatingProfile: boolean
  
  /** Crossmint authentication status */
  crossmintStatus: 'logged-in' | 'logged-out' | 'loading'
  
  /** EVM wallet address from Crossmint */
  walletAddress: string | null
  
  /** Whether this is a new user (first login) */
  isNewUser: boolean
}

/**
 * Authentication actions
 */
export interface AuthActions {
  /** Update user profile */
  updateProfile: (updates: { displayName?: string; email?: string }) => Promise<void>
  
  /** Logout user */
  logout: () => Promise<void>
  
  /** Refresh user data */
  refreshUser: () => Promise<void>
}

/**
 * Authentication context type
 */
export type AuthContextType = AuthState & AuthActions

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Authentication provider props
 */
export interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Authentication Provider Component
 *
 * Manages authentication state by integrating Crossmint authentication
 * with Supabase user storage. Automatically creates/updates user profiles
 * when users authenticate via Crossmint.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const crossmintAuth = useCrossmintAuth()
  const crossmintWallet = useCrossmintWallet()

  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)
  const [hasProcessedAuth, setHasProcessedAuth] = useState(false)

  /**
   * Process Crossmint authentication and sync with Supabase
   */
  const processAuthentication = async (crossmintUser: any, walletAddress: string) => {
    try {
      setIsLoading(true)

      const crossmintUserData: CrossmintUser = {
        id: crossmintUser.id,
        email: crossmintUser.email,
        walletAddress: walletAddress,
        displayName: crossmintUser.displayName || crossmintUser.name,
      }

      const authResult: AuthResult = await UserService.authenticateUser(crossmintUserData)

      setUser(authResult.user)
      setIsNewUser(authResult.isNewUser)

      // Store session metadata
      SessionManager.storeSessionMetadata({
        authMethod: 'google', // This could be determined from Crossmint auth method
        userId: authResult.user.id,
      })

      if (authResult.isNewUser) {
        toast.success('Welcome to CryptoScore! Your profile has been created.')
      } else {
        toast.success('Welcome back!')
      }

      console.log('[AuthProvider] User authenticated:', {
        userId: authResult.user.id,
        email: authResult.user.email,
        walletAddress: authResult.user.wallet_address,
        isNewUser: authResult.isNewUser,
      })
    } catch (error) {
      console.error('[AuthProvider] Authentication error:', error)
      toast.error('Failed to authenticate user. Please try again.')
      setUser(null)
      setIsNewUser(false)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle logout
   */
  const logout = async () => {
    try {
      setIsLoading(true)

      // Clear session data
      SessionManager.clearAll()

      // Logout from Crossmint
      await crossmintAuth.logout()

      // Clear local state
      setUser(null)
      setIsNewUser(false)
      setHasProcessedAuth(false)

      toast.success('Logged out successfully')
    } catch (error) {
      console.error('[AuthProvider] Logout error:', error)
      toast.error('Failed to logout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update user profile
   */
  const updateProfile = async (updates: { displayName?: string; email?: string }) => {
    if (!user) {
      throw new Error('No authenticated user')
    }

    try {
      setIsUpdatingProfile(true)

      const updatedUser = await UserService.updateProfile(user.id, updates)
      setUser(updatedUser)

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('[AuthProvider] Profile update error:', error)
      toast.error('Failed to update profile. Please try again.')
      throw error
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    if (!user) return

    try {
      const refreshedUser = await UserService.getUserById(user.id)
      if (refreshedUser) {
        setUser(refreshedUser)
      }
    } catch (error) {
      console.error('[AuthProvider] User refresh error:', error)
    }
  }

  /**
   * Monitor Crossmint authentication state
   */
  useEffect(() => {
    const handleAuthStateChange = async () => {
      if (crossmintAuth.status === 'logged-in' && 
          crossmintAuth.user && 
          crossmintWallet.wallet?.address && 
          !hasProcessedAuth) {
        
        setHasProcessedAuth(true)
        await processAuthentication(crossmintAuth.user, crossmintWallet.wallet.address)
      } else if (crossmintAuth.status === 'logged-out' && hasProcessedAuth) {
        // User logged out
        setUser(null)
        setIsNewUser(false)
        setHasProcessedAuth(false)
        SessionManager.clearAll()
      } else if (crossmintAuth.status === 'logged-out') {
        // Initial state or no authentication
        setIsLoading(false)
      }
    }

    handleAuthStateChange()
  }, [
    crossmintAuth.status, 
    crossmintAuth.user, 
    crossmintWallet.wallet?.address, 
    hasProcessedAuth
  ])

  /**
   * Restore session on mount
   */
  useEffect(() => {
    const restoreSession = async () => {
      if (hasProcessedAuth) return

      try {
        const hasSession = SessionManager.hasRecentSession()
        
        if (hasSession) {
          console.log('[AuthProvider] Recent session found, waiting for Crossmint restoration')
          // The Crossmint SDK will handle session restoration automatically
          // We just need to wait for the auth state to update
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('[AuthProvider] Session restoration error:', error)
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [hasProcessedAuth])

  const contextValue: AuthContextType = {
    // State
    user,
    isLoading,
    isUpdatingProfile,
    crossmintStatus: crossmintAuth.status === 'in-progress' || crossmintAuth.status === 'initializing' ? 'loading' : crossmintAuth.status,
    walletAddress: crossmintWallet.wallet?.address || null,
    isNewUser,

    // Actions
    updateProfile,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use authentication context
 *
 * @returns Authentication context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Hook to check if user is authenticated
 *
 * @returns True if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, isLoading } = useAuth()
  return !isLoading && user !== null
}

/**
 * Hook to get current user
 *
 * @returns Current user or null
 */
export function useCurrentUser(): User | null {
  const { user } = useAuth()
  return user
}