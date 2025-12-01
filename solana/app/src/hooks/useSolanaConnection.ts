/**
 * useSolanaConnection - Hook for managing Solana connection and wallet state
 * 
 * Provides connection, wallet, and signing methods without Anchor dependencies.
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import type { Connection, PublicKey, Transaction } from '@solana/web3.js'

export interface UseSolanaConnectionReturn {
  connection: Connection
  wallet: ReturnType<typeof useWallet>
  publicKey: PublicKey | null
  isConnected: boolean
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined
  signAllTransactions: ((transactions: Transaction[]) => Promise<Transaction[]>) | undefined
  sendTransaction: ((transaction: Transaction, connection: Connection) => Promise<string>) | undefined
}

/**
 * Hook for accessing Solana connection and wallet state
 * 
 * @returns Connection, wallet, publicKey, isConnected, and signing methods
 */
export function useSolanaConnection(): UseSolanaConnectionReturn {
  const { connection } = useConnection()
  const wallet = useWallet()

  return {
    connection,
    wallet,
    publicKey: wallet.publicKey,
    isConnected: wallet.connected && !!wallet.publicKey,
    signTransaction: wallet.signTransaction,
    signAllTransactions: wallet.signAllTransactions,
    sendTransaction: wallet.sendTransaction,
  }
}
