/**
 * TransactionBuilder - Utility for constructing Solana transactions without Anchor
 *
 * Provides a fluent API for building transactions with compute budget and priority fees.
 *
 * @module transaction-builder
 *
 * @example
 * ```typescript
 * const builder = new TransactionBuilder({
 *   computeUnitLimit: 200_000,
 *   computeUnitPrice: 1000,
 * })
 *
 * builder
 *   .addInstruction(instruction1)
 *   .addInstruction(instruction2)
 *
 * const feeEstimate = await builder.previewFee(connection, feePayer)
 * console.log(`Fee: ${feeEstimate.feeInSol} SOL`)
 *
 * const transaction = await builder.build(connection)
 * ```
 */

import type { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js'
import { ComputeBudgetProgram, Transaction } from '@solana/web3.js'

/**
 * Options for configuring transaction compute budget
 *
 * @interface TransactionBuilderOptions
 * @property {number} [computeUnitLimit] - Maximum compute units for transaction (default: 200,000)
 * @property {number} [computeUnitPrice] - Priority fee in microLamports per compute unit
 */
export interface TransactionBuilderOptions {
  computeUnitLimit?: number
  computeUnitPrice?: number
}

/**
 * Result of fee estimation
 *
 * @interface FeeEstimate
 * @property {number} fee - Transaction fee in lamports
 * @property {number} feeInSol - Transaction fee in SOL
 * @property {boolean} success - Whether estimation succeeded
 * @property {string} [error] - Error message if estimation failed
 */
export interface FeeEstimate {
  fee: number // in lamports
  feeInSol: number // in SOL
  success: boolean
  error?: string
}

/**
 * TransactionBuilder class for constructing Solana transactions
 *
 * @class TransactionBuilder
 *
 * @example
 * ```typescript
 * const builder = new TransactionBuilder()
 * builder.addInstruction(createMarketIx)
 * builder.setComputeUnitLimit(200_000)
 * const tx = await builder.build(connection)
 * ```
 */
export class TransactionBuilder {
  private instructions: TransactionInstruction[] = []
  private options: TransactionBuilderOptions

  /**
   * Create a new TransactionBuilder
   *
   * @param {TransactionBuilderOptions} options - Configuration options
   */
  constructor(options: TransactionBuilderOptions = {}) {
    this.options = options
  }

  /**
   * Add an instruction to the transaction
   *
   * @param {TransactionInstruction} instruction - Instruction to add
   * @returns {this} Builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.addInstruction(createMarketIx)
   * ```
   */
  addInstruction(instruction: TransactionInstruction): this {
    this.instructions.push(instruction)
    return this
  }

  /**
   * Add multiple instructions to the transaction
   *
   * @param {TransactionInstruction[]} instructions - Array of instructions to add
   * @returns {this} Builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.addInstructions([ix1, ix2, ix3])
   * ```
   */
  addInstructions(instructions: TransactionInstruction[]): this {
    this.instructions.push(...instructions)
    return this
  }

  /**
   * Set compute budget limit for the transaction
   *
   * @param {number} units - Maximum compute units (typical: 200,000)
   * @returns {this} Builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.setComputeUnitLimit(200_000)
   * ```
   */
  setComputeUnitLimit(units: number): this {
    this.options.computeUnitLimit = units
    return this
  }

  /**
   * Set compute unit price (priority fee) for the transaction
   *
   * @param {number} microLamports - Price in microLamports per compute unit
   * @returns {this} Builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.setComputeUnitPrice(1000) // 0.001 lamports per CU
   * ```
   */
  setComputeUnitPrice(microLamports: number): this {
    this.options.computeUnitPrice = microLamports
    return this
  }

  /**
   * Build the final transaction with all instructions and compute budget
   *
   * @param {Connection} connection - Solana connection instance
   * @returns {Promise<Transaction>} Built transaction ready for signing
   *
   * @example
   * ```typescript
   * const transaction = await builder.build(connection)
   * transaction.feePayer = wallet.publicKey
   * const signed = await wallet.signTransaction(transaction)
   * ```
   */
  async build(connection: Connection): Promise<Transaction> {
    const transaction = new Transaction()

    // Add compute budget instructions if specified
    if (this.options.computeUnitLimit) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: this.options.computeUnitLimit,
        }),
      )
    }

    if (this.options.computeUnitPrice) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: this.options.computeUnitPrice,
        }),
      )
    }

    // Add all instructions
    transaction.add(...this.instructions)

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash

    return transaction
  }

  /**
   * Estimate transaction fee before sending
   * Uses connection.getFeeForMessage to calculate the fee
   *
   * @param connection - Solana connection instance
   * @param feePayer - Public key of the fee payer
   * @returns FeeEstimate object with fee in lamports and SOL
   */
  async estimateFee(connection: Connection, feePayer: PublicKey): Promise<FeeEstimate> {
    try {
      // Build the transaction to get the message
      const transaction = await this.build(connection)
      transaction.feePayer = feePayer

      // Compile the message
      const message = transaction.compileMessage()

      // Get fee for the message
      const feeResponse = await connection.getFeeForMessage(message, 'confirmed')

      if (feeResponse.value === null) {
        return {
          fee: 0,
          feeInSol: 0,
          success: false,
          error: 'Unable to estimate fee - blockhash may be expired',
        }
      }

      const fee = feeResponse.value
      const feeInSol = fee / 1_000_000_000

      return {
        fee,
        feeInSol,
        success: true,
      }
    }
    catch (error) {
      console.error('Fee estimation error:', error)
      return {
        fee: 0,
        feeInSol: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Fee estimation failed',
      }
    }
  }

  /**
   * Get a preview transaction for fee estimation without consuming the builder
   * This allows estimating fees without building the final transaction
   *
   * @param connection - Solana connection instance
   * @param feePayer - Public key of the fee payer
   * @returns FeeEstimate object
   */
  async previewFee(connection: Connection, feePayer: PublicKey): Promise<FeeEstimate> {
    try {
      const transaction = new Transaction()

      // Add compute budget instructions if specified
      if (this.options.computeUnitLimit) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitLimit({
            units: this.options.computeUnitLimit,
          }),
        )
      }

      if (this.options.computeUnitPrice) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: this.options.computeUnitPrice,
          }),
        )
      }

      // Add all instructions
      transaction.add(...this.instructions)

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash('confirmed')
      transaction.recentBlockhash = blockhash
      transaction.feePayer = feePayer

      // Compile the message
      const message = transaction.compileMessage()

      // Get fee for the message
      const feeResponse = await connection.getFeeForMessage(message, 'confirmed')

      if (feeResponse.value === null) {
        return {
          fee: 0,
          feeInSol: 0,
          success: false,
          error: 'Unable to estimate fee - blockhash may be expired',
        }
      }

      const fee = feeResponse.value
      const feeInSol = fee / 1_000_000_000

      return {
        fee,
        feeInSol,
        success: true,
      }
    }
    catch (error) {
      console.error('Fee preview error:', error)
      return {
        fee: 0,
        feeInSol: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Fee preview failed',
      }
    }
  }

  /**
   * Clear all instructions from the builder
   *
   * @returns {this} Builder instance for chaining
   *
   * @example
   * ```typescript
   * builder.clear().addInstruction(newInstruction)
   * ```
   */
  clear(): this {
    this.instructions = []
    return this
  }
}
