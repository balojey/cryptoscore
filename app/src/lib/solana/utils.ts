/**
 * SolanaUtils - Common utility functions for Solana operations
 *
 * Provides helper functions for conversions, formatting, and transaction handling.
 *
 * @module utils
 *
 * @example
 * ```typescript
 * // Convert lamports to SOL
 * const sol = SolanaUtils.lamportsToSol(1_000_000_000) // 1.0
 *
 * // Shorten address
 * const short = SolanaUtils.shortenAddress(publicKey) // "5Fwq...3xYz"
 *
 * // Get explorer URL
 * const url = SolanaUtils.getExplorerUrl(signature, 'devnet')
 * ```
 */

import type { Commitment, Connection, Transaction, TransactionSignature } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'

/**
 * SolanaUtils class with static utility methods
 *
 * @class SolanaUtils
 */
export class SolanaUtils {
  /**
   * Convert lamports to SOL
   *
   * @param {bigint | number} lamports - Amount in lamports
   * @returns {number} Amount in SOL
   *
   * @example
   * ```typescript
   * const sol = SolanaUtils.lamportsToSol(1_000_000_000) // 1.0
   * const sol2 = SolanaUtils.lamportsToSol(BigInt(500_000_000)) // 0.5
   * ```
   */
  static lamportsToSol(lamports: bigint | number): number {
    const lamportsNum = typeof lamports === 'bigint' ? Number(lamports) : lamports
    return lamportsNum / 1_000_000_000
  }

  /**
   * Convert SOL to lamports
   *
   * @param {number} sol - Amount in SOL
   * @returns {bigint} Amount in lamports
   *
   * @example
   * ```typescript
   * const lamports = SolanaUtils.solToLamports(1.5) // 1_500_000_000n
   * ```
   */
  static solToLamports(sol: number): bigint {
    return BigInt(Math.floor(sol * 1_000_000_000))
  }

  /**
   * Shorten address for display
   *
   * @param {PublicKey | string} address - Public key or base58 string
   * @param {number} [chars] - Number of characters to show on each end
   * @returns {string} Shortened address (e.g., "5Fwq...3xYz")
   *
   * @example
   * ```typescript
   * const short = SolanaUtils.shortenAddress(publicKey) // "5Fwq...3xYz"
   * const short2 = SolanaUtils.shortenAddress(publicKey, 6) // "5FwqAB...CD3xYz"
   * ```
   */
  static shortenAddress(address: PublicKey | string, chars = 4): string {
    const addressStr = typeof address === 'string' ? address : address.toBase58()
    return `${addressStr.slice(0, chars)}...${addressStr.slice(-chars)}`
  }

  /**
   * Confirm transaction with retry logic
   */
  static async confirmTransaction(
    connection: Connection,
    signature: TransactionSignature,
    commitment: Commitment = 'confirmed',
    maxRetries = 3,
  ): Promise<boolean> {
    let retries = 0

    while (retries < maxRetries) {
      try {
        const result = await connection.confirmTransaction(signature, commitment)

        if (result.value.err) {
          console.error('Transaction failed:', result.value.err)
          return false
        }

        return true
      }
      catch (error) {
        retries++
        if (retries >= maxRetries) {
          console.error('Transaction confirmation failed after retries:', error)
          return false
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries))
      }
    }

    return false
  }

  /**
   * Simulate transaction before sending
   */
  static async simulateTransaction(
    connection: Connection,
    transaction: Transaction,
  ): Promise<{ success: boolean, logs?: string[], error?: string }> {
    try {
      const simulation = await connection.simulateTransaction(transaction)

      if (simulation.value.err) {
        return {
          success: false,
          logs: simulation.value.logs || undefined,
          error: JSON.stringify(simulation.value.err),
        }
      }

      return {
        success: true,
        logs: simulation.value.logs || undefined,
      }
    }
    catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Simulation failed',
      }
    }
  }

  /**
   * Get recent blockhash with retry
   */
  static async getRecentBlockhash(
    connection: Connection,
    commitment: Commitment = 'confirmed',
  ): Promise<string> {
    const { blockhash } = await connection.getLatestBlockhash(commitment)
    return blockhash
  }

  /**
   * Get Solana Explorer URL for transaction
   *
   * @param {string} signature - Transaction signature
   * @param {string} [cluster] - Network cluster
   * @returns {string} Explorer URL
   *
   * @example
   * ```typescript
   * const url = SolanaUtils.getExplorerUrl(signature, 'devnet')
   * // https://explorer.solana.com/tx/...?cluster=devnet
   * ```
   */
  static getExplorerUrl(
    signature: string,
    cluster: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet' = 'devnet',
  ): string {
    const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
    return `https://explorer.solana.com/tx/${signature}${clusterParam}`
  }

  /**
   * Get Solana Explorer URL for address
   *
   * @param {PublicKey | string} address - Public key or base58 string
   * @param {string} [cluster] - Network cluster
   * @returns {string} Explorer URL
   *
   * @example
   * ```typescript
   * const url = SolanaUtils.getExplorerAddressUrl(marketPDA, 'devnet')
   * // https://explorer.solana.com/address/...?cluster=devnet
   * ```
   */
  static getExplorerAddressUrl(
    address: PublicKey | string,
    cluster: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet' = 'devnet',
  ): string {
    const addressStr = typeof address === 'string' ? address : address.toBase58()
    const clusterParam = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
    return `https://explorer.solana.com/address/${addressStr}${clusterParam}`
  }

  /**
   * Format SOL amount for display
   *
   * @param {bigint | number} lamports - Amount in lamports
   * @param {number} [decimals] - Number of decimal places
   * @returns {string} Formatted SOL amount
   *
   * @example
   * ```typescript
   * const formatted = SolanaUtils.formatSol(1_500_000_000) // "1.5000"
   * const formatted2 = SolanaUtils.formatSol(1_500_000_000, 2) // "1.50"
   * ```
   */
  static formatSol(lamports: bigint | number, decimals = 4): string {
    const sol = this.lamportsToSol(lamports)
    return sol.toFixed(decimals)
  }

  /**
   * Check if public key string is valid
   *
   * @param {string} address - Base58 encoded public key
   * @returns {boolean} True if valid
   *
   * @example
   * ```typescript
   * if (SolanaUtils.isValidPublicKey(addressString)) {
   *   const pubkey = new PublicKey(addressString)
   * }
   * ```
   */
  static isValidPublicKey(address: string): boolean {
    try {
      new PublicKey(address)
      return true
    }
    catch {
      return false
    }
  }

  /**
   * Sleep utility for delays
   *
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await SolanaUtils.sleep(1000) // Wait 1 second
   * ```
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Estimate transaction fee with retry logic
   * Handles network condition changes by retrying with fresh blockhash
   *
   * @param connection - Solana connection instance
   * @param transaction - Transaction to estimate fee for
   * @param maxRetries - Maximum number of retry attempts
   * @returns Fee in lamports, or null if estimation fails
   */
  static async estimateTransactionFee(
    connection: Connection,
    transaction: Transaction,
    maxRetries = 2,
  ): Promise<number | null> {
    let retries = 0

    while (retries <= maxRetries) {
      try {
        // Get fresh blockhash for each attempt
        const { blockhash } = await connection.getLatestBlockhash('confirmed')
        transaction.recentBlockhash = blockhash

        // Compile message and get fee
        const message = transaction.compileMessage()
        const feeResponse = await connection.getFeeForMessage(message, 'confirmed')

        if (feeResponse.value !== null) {
          return feeResponse.value
        }

        // If fee is null, retry with fresh blockhash
        retries++
        if (retries <= maxRetries) {
          await this.sleep(500 * retries) // Exponential backoff
        }
      }
      catch (error) {
        console.error(`Fee estimation attempt ${retries + 1} failed:`, error)
        retries++
        if (retries <= maxRetries) {
          await this.sleep(500 * retries)
        }
      }
    }

    console.error('Fee estimation failed after all retries')
    return null
  }

  /**
   * Format fee estimate for display
   *
   * @param lamports - Fee in lamports
   * @param includeSymbol - Whether to include SOL symbol
   * @returns Formatted fee string
   */
  static formatFee(lamports: number, includeSymbol = true): string {
    const sol = this.lamportsToSol(lamports)
    const formatted = sol < 0.0001 ? sol.toExponential(2) : sol.toFixed(6)
    return includeSymbol ? `${formatted} SOL` : formatted
  }
}
