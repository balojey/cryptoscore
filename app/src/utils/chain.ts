// Solana network utilities
// This file replaces the old Polkadot chain switching utilities

import type { Connection } from '@solana/web3.js'
import { currentNetwork, getHealthyConnection } from '../config/solana'

/**
 * Ensures connection to Solana network
 * Replaces the old ensurePaseoTestnet function
 */
export async function ensureSolanaNetwork(): Promise<Connection> {
  try {
    // Get a healthy connection with automatic fallback
    const connection = await getHealthyConnection()

    // Verify connection is working
    await connection.getLatestBlockhash('confirmed')

    console.log(`Connected to ${currentNetwork.name}`)
    return connection
  }
  catch (error) {
    console.error('Failed to connect to Solana network:', error)
    throw new Error(`Unable to connect to ${currentNetwork.name}. Please check your network connection.`)
  }
}

/**
 * Get current network info
 */
export function getCurrentNetwork() {
  return currentNetwork
}
