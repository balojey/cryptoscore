/**
 * Unified Wallet Context (Web2 Migration)
 *
 * Simplified version that only supports Crossmint EVM wallets.
 * Removed Solana wallet adapter support.
 */

import { useAuth, useWallet as useCrossmintWallet } from '@crossmint/client-sdk-react-ui'
import React, { createContext, use, useCallback, useState } from 'react'
import { toast } from 'sonner'

/**
 * Wallet type discriminator (simplified for web2)
 */
export type WalletType = 'crossmint' | null

/**
 * Crossmint user information
 */
export interface CrossmintUser {
  userId: string
  email?: string
  phoneNumber?: string
  walletAddress?: string
  displayName?: string
}

/**
 * Unified wallet context interface (simplified)
 */
export interface UnifiedWalletContextType {
  // Connection state
  connected: boolean
  connecting: boolean
  disconnecting: boolean

  // Wallet information
  publicKey: string | null // Changed from PublicKey to string for EVM
  walletAddress: string | null
  walletType: WalletType
  user: CrossmintUser | null

  // Wallet metadata
  walletName: string | undefined
  walletIcon: string | undefined

  // Connection methods
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const UnifiedWalletContext = createContext<UnifiedWalletContextType | undefined>(undefined)

export function UnifiedWalletProvider({ children }: { children: React.ReactNode }) {
  const { user: crossmintUser, jwt, logout } = useAuth()
  const { wallet: crossmintWallet } = useCrossmintWallet()
  
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  // Determine connection state
  const connected = !!jwt && !!crossmintUser
  const walletType: WalletType = connected ? 'crossmint' : null

  // Extract wallet information
  const publicKey = crossmintWallet?.address || null
  const walletAddress = publicKey
  const user: CrossmintUser | null = crossmintUser ? {
    userId: crossmintUser.id || '',
    email: crossmintUser.email,
    phoneNumber: crossmintUser.phoneNumber,
    walletAddress: crossmintWallet?.address,
    displayName: crossmintUser.email // Use email as display name
  } : null

  const connect = useCallback(async () => {
    setConnecting(true)
    try {
      // Connection is handled by AuthModal
      console.log('Connect initiated - handled by AuthModal')
    } catch (error) {
      console.error('Connection failed:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    setDisconnecting(true)
    try {
      await logout()
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Disconnect failed:', error)
      toast.error('Failed to disconnect wallet')
    } finally {
      setDisconnecting(false)
    }
  }, [logout])

  const contextValue: UnifiedWalletContextType = {
    connected,
    connecting,
    disconnecting,
    publicKey,
    walletAddress,
    walletType,
    user,
    walletName: connected ? 'Crossmint' : undefined,
    walletIcon: undefined,
    connect,
    disconnect,
  }

  return (
    <UnifiedWalletContext.Provider value={contextValue}>
      {children}
    </UnifiedWalletContext.Provider>
  )
}

export function useUnifiedWallet(): UnifiedWalletContextType {
  const context = use(UnifiedWalletContext)
  if (context === undefined) {
    throw new Error('useUnifiedWallet must be used within a UnifiedWalletProvider')
  }
  return context
}