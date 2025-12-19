/**
 * useSolanaConnection - Hook for managing Solana connection and wallet state
 *
 * Provides connection, wallet, and signing methods without Anchor dependencies.
 * Now uses UnifiedWalletContext to support both Crossmint and adapter wallets.
 */

import type { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import { useConnection } from '@solana/wallet-adapter-react'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'

export interface UseSolanaConnectionReturn {
  connection: Connection
  publicKey: PublicKey | null
  isConnected: boolean
  walletType: 'crossmint' | 'adapter' | null
  signTransaction: <T extends Transaction | VersionedTransaction>(transaction: T) => Promise<T>
  signAllTransactions: <T extends Transaction | VersionedTransaction>(transactions: T[]) => Promise<T[]>
  sendTransaction: (transaction: Transaction | VersionedTransaction) => Promise<string>
}

/**
 * Hook for accessing Solana connection and wallet state
 *
 * @returns Connection, wallet, publicKey, isConnected, and signing methods
 */
export function useSolanaConnection(): UseSolanaConnectionReturn {
  const { connection } = useConnection()
  const {
    publicKey,
    connected,
    walletType,
    signTransaction,
    signAllTransactions,
    sendTransaction,
  } = useUnifiedWallet()

  return {
    connection,
    publicKey,
    isConnected: connected,
    walletType,
    signTransaction,
    signAllTransactions,
    sendTransaction,
  }
}
