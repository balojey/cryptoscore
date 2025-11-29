/**
 * TransactionBuilder - Utility for constructing Solana transactions without Anchor
 * 
 * Provides a fluent API for building transactions with compute budget and priority fees.
 */

import { Connection, Transaction, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js'

export interface TransactionBuilderOptions {
  computeUnitLimit?: number
  computeUnitPrice?: number
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
   * Clear all instructions
   */
  clear(): this {
    this.instructions = []
    return this
  }
}
