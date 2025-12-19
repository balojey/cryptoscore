import type { Transaction } from '@solana/web3.js'
import bs58 from 'bs58'

/**
 * Utility class for serializing Solana transactions to Base58 format
 * Required for Crossmint wallet transaction submission
 */
export class TransactionSerializer {
  /**
   * Serialize a transaction to Base58 format for Crossmint
   * @param transaction - The transaction to serialize
   * @returns Base58-encoded transaction string
   */
  static toBase58(transaction: Transaction): string {
    const serialized = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    })
    return bs58.encode(serialized)
  }

  /**
   * Get transaction size in bytes
   * @param transaction - The transaction to measure
   * @returns Size in bytes
   */
  static getSize(transaction: Transaction): number {
    return transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    }).length
  }

  /**
   * Log transaction details for debugging
   * @param transaction - The transaction to log
   * @param label - Optional label for the log
   */
  static logDetails(transaction: Transaction, label?: string): void {
    const size = this.getSize(transaction)
    const instructions = transaction.instructions.length

    console.log(`[Transaction${label ? ` ${label}` : ''}]`, {
      size: `${size} bytes`,
      instructions,
      feePayer: transaction.feePayer?.toBase58(),
      recentBlockhash: transaction.recentBlockhash,
    })
  }
}
