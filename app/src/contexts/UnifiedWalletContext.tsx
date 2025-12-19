/**
 * Unified Wallet Context
 *
 * Provides a unified interface for both Crossmint-managed wallets and
 * traditional Solana wallet adapter connections. This abstraction allows
 * the application to work seamlessly with both authentication methods.
 */

import { useAuth, useWallet as useCrossmintWallet } from '@crossmint/client-sdk-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import React, { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { SessionManager } from '@/lib/crossmint/session-manager'
import { WALLET_ERROR_CODES, WalletErrorHandler } from '@/lib/crossmint/wallet-error-handler'

/**
 * Wallet type discriminator
 *
 * Identifies which wallet system is currently active:
 * - `crossmint`: User authenticated via Crossmint social login
 * - `adapter`: User connected via traditional Solana wallet adapter
 * - `null`: No wallet connected
 */
export type WalletType = 'crossmint' | 'adapter' | null

/**
 * Crossmint user information
 *
 * Contains profile information for users authenticated via Crossmint.
 * Available fields depend on the authentication method used.
 */
export interface CrossmintUser {
  /** Unique user identifier from Crossmint */
  userId: string

  /** Email address (if authenticated via email or Google) */
  email?: string

  /** Phone number (if provided) */
  phoneNumber?: string

  // /** Twitter profile information (if authenticated via Twitter) */
  // twitter?: { username: string }

  // /** Farcaster profile information (if authenticated via Farcaster) */
  // farcaster?: { username: string }
}

/**
 * Unified wallet context interface
 *
 * Provides a consistent API for wallet operations regardless of whether
 * the user is authenticated via Crossmint or a traditional wallet adapter.
 * This abstraction allows the application to work seamlessly with both
 * authentication methods.
 */
export interface UnifiedWalletContextType {
  // Connection state
  /** True if a wallet is currently connected */
  connected: boolean

  /** True if a connection attempt is in progress */
  connecting: boolean

  /** True if a disconnection is in progress */
  disconnecting: boolean

  // Wallet information
  /** Solana public key of the connected wallet */
  publicKey: PublicKey | null

  /** Base58-encoded wallet address string */
  walletAddress: string | null

  /** Type of wallet currently connected (crossmint, adapter, or null) */
  walletType: WalletType

  // User information (for Crossmint users)
  /** User profile information (only available for Crossmint users) */
  user: CrossmintUser | null

  // Wallet metadata
  /** Display name of the connected wallet (e.g., "Phantom", "Crossmint") */
  walletName: string | undefined

  /** Icon URL for the connected wallet */
  walletIcon: string | undefined

  // Connection methods
  /**
   * Initiate wallet connection
   * Note: Currently handled by AuthModal component
   */
  connect: () => Promise<void>

  /**
   * Disconnect the current wallet
   * Handles both Crossmint logout and traditional wallet disconnection
   */
  disconnect: () => Promise<void>

  // Direct wallet access
  /**
   * Direct access to the Crossmint wallet instance
   * 
   * Use this for Crossmint-specific operations like transaction submission.
   * Available only when walletType is 'crossmint'.
   * 
   * @example
   * ```tsx
   * const { crossmintWallet, walletType } = useUnifiedWallet()
   * 
   * if (walletType === 'crossmint' && crossmintWallet) {
   *   const result = await crossmintWallet.send({ transaction: base58Tx })
   * }
   * ```
   */
  crossmintWallet: any | null

  /**
   * Direct access to the Solana wallet adapter instance
   * 
   * Use this for adapter-specific operations like transaction signing.
   * Available only when walletType is 'adapter'.
   * 
   * @example
   * ```tsx
   * const { adapterWallet, walletType } = useUnifiedWallet()
   * 
   * if (walletType === 'adapter' && adapterWallet?.signTransaction) {
   *   const signed = await adapterWallet.signTransaction(transaction)
   * }
   * ```
   */
  adapterWallet: any | null
}

/**
 * Create the context with undefined default
 */
const UnifiedWalletContext = createContext<UnifiedWalletContextType | undefined>(undefined)

/**
 * Props for UnifiedWalletProvider
 */
export interface UnifiedWalletProviderProps {
  /** Child components to wrap with wallet context */
  children: React.ReactNode
}

/**
 * Unified Wallet Provider Component
 *
 * Wraps the application and provides unified wallet functionality by combining
 * Crossmint and Solana wallet adapter contexts. This provider:
 *
 * - Detects which wallet system is active (Crossmint or adapter)
 * - Provides a consistent API for wallet operations
 * - Handles session restoration for Crossmint users
 * - Monitors session health and token expiration
 * - Manages connection state for both wallet types
 *
 * Must be rendered inside both Crossmint and Solana wallet adapter providers.
 *
 * @param props - Component props
 * @returns Provider component that wraps children with wallet context
 *
 * @example
 * ```tsx
 * <CrossmintProvider>
 *   <WalletProvider>
 *     <UnifiedWalletProvider>
 *       <App />
 *     </UnifiedWalletProvider>
 *   </WalletProvider>
 * </CrossmintProvider>
 * ```
 */
export function UnifiedWalletProvider({ children }: UnifiedWalletProviderProps) {
  // Get Solana wallet adapter state
  const adapterWallet = useWallet()

  // Get Crossmint auth and wallet state
  const crossmintAuth = useAuth()
  const crossmintWalletContext = useCrossmintWallet()
  const crossmintWallet = crossmintWalletContext.wallet

  // Track internal connection state
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [hasShownSessionExpiredWarning, setHasShownSessionExpiredWarning] = useState(false)
  const [sessionRestored, setSessionRestored] = useState(false)

  // Use ref to track if session monitoring is active
  const sessionMonitorRef = useRef<NodeJS.Timeout | null>(null)

  // Determine which wallet type is active
  const walletType: WalletType = useMemo(() => {
    // Debug logging
    console.log('[UnifiedWallet] Determining wallet type:', {
      crossmintStatus: crossmintAuth.status,
      crossmintWalletAddress: crossmintWallet?.address,
      crossmintWalletChain: crossmintWallet?.chain,
      adapterConnected: adapterWallet.connected,
      adapterPublicKey: adapterWallet.publicKey?.toBase58(),
    })

    // Check if Crossmint wallet is connected
    // Note: Wallet might still be creating, so check status first
    if (crossmintAuth.status === 'logged-in') {
      // If wallet address exists, we're fully connected
      if (crossmintWallet?.address) {
        console.log('[UnifiedWallet] Crossmint wallet fully connected')
        return 'crossmint'
      }
      
      // If logged in but no wallet yet, it might still be creating
      // Check if wallet is being created
      console.log('[UnifiedWallet] Crossmint logged in, waiting for wallet...')
      // Still return crossmint type so UI updates
      return 'crossmint'
    }

    // Check if adapter wallet is connected
    if (adapterWallet.connected && adapterWallet.publicKey) {
      return 'adapter'
    }

    return null
  }, [
    crossmintAuth.status,
    crossmintWallet?.address,
    crossmintWallet?.chain,
    adapterWallet.connected,
    adapterWallet.publicKey,
  ])

  // Get public key based on wallet type
  const publicKey = useMemo(() => {
    if (walletType === 'crossmint') {
      // If wallet address exists, parse it
      if (crossmintWallet?.address) {
        try {
          const pubKey = new PublicKey(crossmintWallet.address)
          console.log('[UnifiedWallet] Crossmint wallet address:', pubKey.toBase58())
          return pubKey
        }
        catch (error) {
          console.error('[UnifiedWallet] Failed to parse Crossmint wallet address:', error)
          return null
        }
      }
      
      // Wallet is still being created
      console.log('[UnifiedWallet] Crossmint wallet address not yet available')
      return null
    }

    if (walletType === 'adapter') {
      return adapterWallet.publicKey
    }

    return null
  }, [walletType, crossmintWallet?.address, adapterWallet.publicKey])

  // Get wallet address string
  const walletAddress = useMemo(() => {
    return publicKey?.toBase58() || null
  }, [publicKey])

  // Extract Crossmint user information
  const user: CrossmintUser | null = useMemo(() => {
    if (walletType !== 'crossmint' || !crossmintAuth.user) {
      return null
    }

    return {
      userId: crossmintAuth.user.id || '',
      email: crossmintAuth.user.email,
      phoneNumber: crossmintAuth.user.phoneNumber,
      // twitter: crossmintAuth.user.twitter,
      // farcaster: crossmintAuth.user.farcaster,
    }
  }, [walletType, crossmintAuth.user])

  // Get wallet name and icon
  const walletName = useMemo(() => {
    if (walletType === 'crossmint') {
      return 'Crossmint'
    }
    return adapterWallet.wallet?.adapter.name
  }, [walletType, adapterWallet.wallet])

  const walletIcon = useMemo(() => {
    if (walletType === 'crossmint') {
      // Crossmint logo or icon URL
      return 'https://www.crossmint.com/assets/crossmint/logo.png'
    }
    return adapterWallet.wallet?.adapter.icon
  }, [walletType, adapterWallet.wallet])

  // Determine connection state
  const connected = useMemo(() => {
    return walletType !== null
  }, [walletType])

  const connecting = useMemo(() => {
    return isConnecting || adapterWallet.connecting
  }, [isConnecting, adapterWallet.connecting])

  const disconnecting = useMemo(() => {
    return isDisconnecting || adapterWallet.disconnecting
  }, [isDisconnecting, adapterWallet.disconnecting])

  // Connect method - delegates to appropriate wallet system
  const connect = useCallback(async () => {
    setIsConnecting(true)
    try {
      // For now, this will be handled by the AuthModal component
      // which will call the appropriate login method
      // This is a placeholder for future direct connection support
      console.log('Connect called - should open auth modal')
    }
    finally {
      setIsConnecting(false)
    }
  }, [])

  // Disconnect method - handles both wallet types
  const disconnect = useCallback(async () => {
    setIsDisconnecting(true)
    try {
      if (walletType === 'crossmint') {
        // Clear session data before logout
        SessionManager.clearAll()

        // Logout from Crossmint
        await crossmintAuth.logout()
        toast.success('Disconnected successfully')
      }
      else if (walletType === 'adapter') {
        // Disconnect adapter wallet
        await adapterWallet.disconnect()
        toast.success('Wallet disconnected')
      }

      // Ensure body scroll is restored after disconnect
      setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 100)
    }
    catch (error) {
      // Use WalletErrorHandler to parse and log the error
      WalletErrorHandler.logError(error, 'disconnect', walletType)
      const walletError = WalletErrorHandler.parseError(error, walletType, 'disconnect')

      // Get user-friendly error message
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)
      toast.error(errorMessage)

      throw walletError
    }
    finally {
      setIsDisconnecting(false)
    }
  }, [walletType, crossmintAuth, adapterWallet])



  // Restore session on mount
  useEffect(() => {
    if (sessionRestored) {
      return
    }

    const restoreSession = async () => {
      try {
        // Check if there's a recent session
        const hasSession = SessionManager.hasRecentSession()

        if (hasSession) {
          console.log('[UnifiedWallet] Recent session found, attempting restoration')

          // Validate the session
          const validation = await SessionManager.validateSession()

          if (validation.valid) {
            console.log('[UnifiedWallet] Session is valid')

            // The Crossmint SDK will automatically restore the session
            // if valid tokens exist in storage
            // We just need to wait for the auth state to update

            if (validation.needsRefresh) {
              console.log('[UnifiedWallet] Session needs refresh')
              // The SDK handles token refresh automatically
            }
          }
          else if (validation.error) {
            console.log('[UnifiedWallet] Session validation failed:', validation.error.message)

            // Clear invalid session data
            SessionManager.clearAll()

            if (WalletErrorHandler.requiresReauth(validation.error)) {
              toast.error('Your session has expired. Please sign in again.', {
                duration: 5000,
              })
            }
          }
        }
      }
      catch (error) {
        WalletErrorHandler.logError(error, 'restoreSession', 'crossmint')
      }
      finally {
        setSessionRestored(true)
      }
    }

    restoreSession()
  }, [sessionRestored])

  // Monitor Crossmint wallet creation
  useEffect(() => {
    if (crossmintAuth.status === 'logged-in' && crossmintWallet?.address) {
      console.log('[UnifiedWallet] Crossmint auth status: logged-in')
      console.log('[UnifiedWallet] Crossmint wallet:', {
        address: crossmintWallet?.address,
        chain: crossmintWallet?.chain,
      })
      
      if (!crossmintWallet?.address) {
        console.log('[UnifiedWallet] Waiting for Crossmint wallet to be created...')
        // The wallet should be created automatically by CrossmintWalletProvider
        // with createOnLogin prop
      } else {
        console.log('[UnifiedWallet] Crossmint wallet is ready!')
      }
    }
  }, [crossmintAuth.status, crossmintWallet?.address, crossmintWallet?.chain])

  // Store session metadata when Crossmint user authenticates
  useEffect(() => {
    if (walletType === 'crossmint' && crossmintAuth.status === 'logged-in' && crossmintAuth.user) {
      // Determine auth method from user data
      let authMethod: 'google' | 'email' | 'web3' | undefined

      if (crossmintAuth.user.email) {
        authMethod = 'email'
      }

      SessionManager.storeSessionMetadata({
        authMethod,
        userId: crossmintAuth.user.id,
      })

      console.log('[UnifiedWallet] Session metadata stored for authenticated user')
    }
  }, [walletType, crossmintAuth.status, crossmintAuth.user])

  // Monitor Crossmint authentication state for session expiration
  useEffect(() => {
    // Only monitor if we were previously authenticated with Crossmint
    if (walletType === 'crossmint' && crossmintAuth.status === 'logged-out' && !hasShownSessionExpiredWarning) {
      // Session may have expired
      setHasShownSessionExpiredWarning(true)

      // Show re-authentication prompt
      toast.error('Your session has expired. Please sign in again.', {
        duration: 6000,
        action: {
          label: 'Sign In',
          onClick: () => {
            // Trigger re-authentication
            // This would typically open the auth modal
            console.log('Re-authentication requested')
          },
        },
      })

      WalletErrorHandler.logError(
        new Error('Session expired'),
        'sessionMonitor',
        'crossmint',
      )
    }

    // Reset warning flag when user reconnects
    if (crossmintAuth.status === 'logged-in' && hasShownSessionExpiredWarning) {
      setHasShownSessionExpiredWarning(false)
    }
  }, [walletType, crossmintAuth.status, hasShownSessionExpiredWarning])

  // Set up periodic session monitoring for Crossmint users
  useEffect(() => {
    // Only monitor active Crossmint sessions
    if (walletType !== 'crossmint' || crossmintAuth.status !== 'logged-in') {
      // Clear any existing monitor
      if (sessionMonitorRef.current) {
        clearInterval(sessionMonitorRef.current)
        sessionMonitorRef.current = null
      }
      return
    }

    // Check session health every 5 minutes
    const monitorInterval = 5 * 60 * 1000

    const monitor = async () => {
      await SessionManager.monitorSession(
        // On session expired
        () => {
          if (!hasShownSessionExpiredWarning) {
            setHasShownSessionExpiredWarning(true)
            toast.error('Your session has expired. Please sign in again.', {
              duration: 6000,
            })
          }
        },
        // On refresh needed
        () => {
          console.log('[UnifiedWallet] Session refresh needed - SDK will handle automatically')
          // The Crossmint SDK handles token refresh automatically
          // We just log for monitoring purposes
        },
      )
    }

    // Run initial check
    monitor()

    // Set up periodic monitoring
    sessionMonitorRef.current = setInterval(monitor, monitorInterval)

    // Cleanup on unmount or when dependencies change
    return () => {
      if (sessionMonitorRef.current) {
        clearInterval(sessionMonitorRef.current)
        sessionMonitorRef.current = null
      }
    }
  }, [walletType, crossmintAuth.status, hasShownSessionExpiredWarning])

  // Show warning when session is about to expire
  useEffect(() => {
    if (walletType !== 'crossmint' || crossmintAuth.status !== 'logged-in') {
      return
    }

    // Check if session is expiring soon (within 1 hour)
    const checkExpiry = () => {
      if (SessionManager.isSessionExpiringSoon()) {
        toast.warning('Your session will expire soon. Please save your work.', {
          duration: 10000,
        })
      }
    }

    // Check on mount and every 30 minutes
    checkExpiry()
    const expiryCheckInterval = setInterval(checkExpiry, 30 * 60 * 1000)

    return () => {
      clearInterval(expiryCheckInterval)
    }
  }, [walletType, crossmintAuth.status])

  // Create context value
  const value: UnifiedWalletContextType = useMemo(
    () => ({
      connected,
      connecting,
      disconnecting,
      publicKey,
      walletAddress,
      walletType,
      user,
      walletName,
      walletIcon,
      connect,
      disconnect,
      crossmintWallet: walletType === 'crossmint' ? crossmintWallet : null,
      adapterWallet: walletType === 'adapter' ? adapterWallet : null,
    }),
    [
      connected,
      connecting,
      disconnecting,
      publicKey,
      walletAddress,
      walletType,
      user,
      walletName,
      walletIcon,
      connect,
      disconnect,
      crossmintWallet,
      adapterWallet,
    ],
  )

  return (
    <UnifiedWalletContext value={value}>
      {children}
    </UnifiedWalletContext>
  )
}

/**
 * Hook to access the unified wallet context
 *
 * Provides access to wallet state and operations for both Crossmint
 * and traditional wallet adapter connections.
 *
 * @returns Unified wallet context value
 * @throws Error if used outside of UnifiedWalletProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { connected, walletAddress, walletType, disconnect } = useUnifiedWallet()
 *
 *   if (!connected) {
 *     return <div>Please connect your wallet</div>
 *   }
 *
 *   return (
 *     <div>
 *       <p>Connected: {walletAddress}</p>
 *       <p>Type: {walletType}</p>
 *       <button onClick={disconnect}>Disconnect</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useUnifiedWallet(): UnifiedWalletContextType {
  const context = use(UnifiedWalletContext)

  if (context === undefined) {
    throw new Error('useUnifiedWallet must be used within a UnifiedWalletProvider')
  }

  return context
}
