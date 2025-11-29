/**
 * TransactionBuilder - Utility for constructing Solana transactions without Anchor
 * 
 * Provides a fluent API for building transactions with compute budget and priority fees.
 */

import { Connection, Transaction, TransactionInstruction, ComputeBudgetProgram, PublicKey, VersionedTransaction, Message } from '@solana/web3.js'

export interface TransactionBuilderOptions {
  computeUnitLimit?: number
  computeUnitPrice?: number
}

export interface FeeEstimate {
  fee: number // in lamports
  feeInSol: number // in SOL
  success: boolean
  error?: string
}

export class TransactionBuilder {
  private instructions: TransactionInstruction[] = []
  private options: TransactionBuilderOptions

  constructor(options: TransactionBuilderOptions = {}) {
    this.options = options
  }

  /**
   * Add an instruction to the transaction
   */
  addInstruction(instruction: TransactionInstruction): this {
    this.instructions.push(instruction)
    return this
  }

  /**
   * Add multiple instructions to the transaction
   */
  addInstructions(instructions: TransactionInstruction[]): this {
    this.instructions.push(...instructions)
    return this
  }

  /**
   * Set compute budget limit
   */
  setComputeUnitLimit(units: number): this {
    this.options.computeUnitLimit = units
    return this
  }

  /**
   * Set compute unit price (priority fee)
   */
  setComputeUnitPrice(microLamports: number): this {
    this.options.computeUnitPrice = microLamports
    return this
  }

  /**
   * Build the final transaction
   */
  async build(connection: Connection): Promise<Transaction> {
    const transaction = new Transaction()

    // Add compute budget instructions if specified
    if (this.options.computeUnitLimit) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitLimit({
          units: this.options.computeUnitLimit,
        })
      )
    }

    if (this.options.computeUnitPrice) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: this.options.computeUnitPrice,
        })
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
          })
        )
      }

      if (this.options.computeUnitPrice) {
        transaction.add(
          ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: this.options.computeUnitPrice,
          })
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
   * Clear all instructions
   */
  clear(): this {
    this.instructions = []
    return this
  }
}
