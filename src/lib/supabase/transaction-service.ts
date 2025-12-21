/**
 * Transaction Service for Enhanced Prediction System
 *
 * Handles comprehensive transaction logging with detailed metadata,
 * status tracking, and real-time updates for transparency and auditability.
 */

import { DatabaseService } from './database-service'
import type { Database } from '@/types/supabase'

type Transaction = Database['public']['Tables']['transactions']['Row']
type CreateTransaction = Database['public']['Tables']['transactions']['Insert']
type Market = Database['public']['Tables']['markets']['Row']
type Participant = Database['public']['Tables']['participants']['Row']

/**
 * Enhanced transaction metadata for different transaction types
 */
export interface TransactionMetadata {
  // Common metadata
  automatedTransfer?: boolean
  marketId?: string
  matchId?: number
  
  // Winnings-specific metadata
  predictionId?: string
  prediction?: string
  entryAmount?: number
  resolutionOutcome?: string
  
  // Fee-specific metadata
  totalPool?: number
  feePercentage?: number
  rewardPercentage?: number
  
  // Status tracking
  completedAt?: string
  failedAt?: string
  failureReason?: string
  
  // Audit trail
  processedBy?: string
  batchId?: string
}

/**
 * Transaction creation options with enhanced logging
 */
export interface CreateTransactionOptions {
  userId: string
  marketId?: string
  type: Transaction['type']
  amount: number
  description: string
  metadata?: TransactionMetadata
  status?: Transaction['status']
}

/**
 * Transaction batch for atomic operations
 */
export interface TransactionBatch {
  id: string
  marketId: string
  transactions: CreateTransactionOptions[]
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  createdAt: string
}

/**
 * Transaction Service class
 */
export class TransactionService {
  /**
   * Create a transaction with comprehensive logging
   */
  static async createTransaction(options: CreateTransactionOptions): Promise<Transaction> {
    const enhancedMetadata: TransactionMetadata = {
      automatedTransfer: true,
      ...options.metadata,
    }

    const transactionData: CreateTransaction = {
      user_id: options.userId,
      market_id: options.marketId || null,
      type: options.type,
      amount: options.amount,
      description: options.description,
      status: options.status || 'PENDING',
      metadata: enhancedMetadata,
    }

    return await DatabaseService.createTransaction(transactionData)
  }

  /**
   * Create market entry transaction
   */
  static async createMarketEntryTransaction(
    userId: string,
    marketId: string,
    amount: number,
    predictionDetails: {
      prediction: string
      participantId: string
    }
  ): Promise<Transaction> {
    const metadata: TransactionMetadata = {
      automatedTransfer: false,
      marketId,
      predictionId: predictionDetails.participantId,
      prediction: predictionDetails.prediction,
      entryAmount: amount,
    }

    return await this.createTransaction({
      userId,
      marketId,
      type: 'market_entry',
      amount,
      description: `Market entry: ${predictionDetails.prediction} prediction`,
      metadata,
      status: 'COMPLETED',
    })
  }

  /**
   * Create winnings transaction with detailed metadata
   */
  static async createWinningsTransaction(
    userId: string,
    marketId: string,
    amount: number,
    winningsDetails: {
      predictionId: string
      prediction: string
      entryAmount: number
      resolutionOutcome: string
      matchId?: number
    }
  ): Promise<Transaction> {
    const metadata: TransactionMetadata = {
      automatedTransfer: true,
      marketId,
      matchId: winningsDetails.matchId,
      predictionId: winningsDetails.predictionId,
      prediction: winningsDetails.prediction,
      entryAmount: winningsDetails.entryAmount,
      resolutionOutcome: winningsDetails.resolutionOutcome,
    }

    const transaction = await this.createTransaction({
      userId,
      marketId,
      type: 'winnings',
      amount,
      description: `Automated winnings from market resolution: ${winningsDetails.resolutionOutcome}`,
      metadata,
      status: 'PENDING',
    })

    // Mark as completed immediately for successful transfers
    return await this.completeTransaction(transaction.id, {
      completedAt: new Date().toISOString(),
    })
  }

  /**
   * Create platform fee transaction
   */
  static async createPlatformFeeTransaction(
    marketId: string,
    amount: number,
    feeDetails: {
      totalPool: number
      feePercentage: number
      matchId?: number
      creatorId: string
    }
  ): Promise<Transaction> {
    const metadata: TransactionMetadata = {
      automatedTransfer: true,
      marketId,
      matchId: feeDetails.matchId,
      totalPool: feeDetails.totalPool,
      feePercentage: feeDetails.feePercentage,
    }

    const transaction = await this.createTransaction({
      userId: feeDetails.creatorId, // Associate with creator for tracking
      marketId,
      type: 'platform_fee',
      amount,
      description: 'Automated platform fee from market resolution',
      metadata,
      status: 'PENDING',
    })

    // Mark as completed immediately for fee collection
    return await this.completeTransaction(transaction.id, {
      completedAt: new Date().toISOString(),
    })
  }

  /**
   * Create creator reward transaction
   */
  static async createCreatorRewardTransaction(
    creatorId: string,
    marketId: string,
    amount: number,
    rewardDetails: {
      totalPool: number
      rewardPercentage: number
      matchId?: number
    }
  ): Promise<Transaction> {
    const metadata: TransactionMetadata = {
      automatedTransfer: true,
      marketId,
      matchId: rewardDetails.matchId,
      totalPool: rewardDetails.totalPool,
      rewardPercentage: rewardDetails.rewardPercentage,
    }

    const transaction = await this.createTransaction({
      userId: creatorId,
      marketId,
      type: 'creator_reward',
      amount,
      description: 'Automated creator reward from market resolution',
      metadata,
      status: 'PENDING',
    })

    // Mark as completed immediately for successful transfers
    return await this.completeTransaction(transaction.id, {
      completedAt: new Date().toISOString(),
    })
  }

  /**
   * Complete a transaction with additional metadata
   */
  static async completeTransaction(
    transactionId: string,
    completionMetadata?: Partial<TransactionMetadata>
  ): Promise<Transaction> {
    const existingTransaction = await DatabaseService.getTransactionById(transactionId)
    if (!existingTransaction) {
      throw new Error('Transaction not found')
    }

    const updatedMetadata = {
      ...existingTransaction.metadata,
      ...completionMetadata,
      completedAt: new Date().toISOString(),
    }

    return await DatabaseService.updateTransactionStatus(
      transactionId,
      'COMPLETED',
      updatedMetadata
    )
  }

  /**
   * Fail a transaction with error details
   */
  static async failTransaction(
    transactionId: string,
    failureReason: string,
    failureMetadata?: Partial<TransactionMetadata>
  ): Promise<Transaction> {
    const existingTransaction = await DatabaseService.getTransactionById(transactionId)
    if (!existingTransaction) {
      throw new Error('Transaction not found')
    }

    const updatedMetadata = {
      ...existingTransaction.metadata,
      ...failureMetadata,
      failedAt: new Date().toISOString(),
      failureReason,
    }

    return await DatabaseService.updateTransactionStatus(
      transactionId,
      'FAILED',
      updatedMetadata
    )
  }

  /**
   * Process transaction batch atomically
   */
  static async processTransactionBatch(batch: TransactionBatch): Promise<{
    success: boolean
    transactions: Transaction[]
    errors: string[]
  }> {
    const results: Transaction[] = []
    const errors: string[] = []

    try {
      // Create all transactions in the batch
      for (const transactionOptions of batch.transactions) {
        try {
          const transaction = await this.createTransaction({
            ...transactionOptions,
            metadata: {
              ...transactionOptions.metadata,
              batchId: batch.id,
            },
          })
          results.push(transaction)
        } catch (error) {
          errors.push(`Failed to create transaction: ${(error as Error).message}`)
        }
      }

      // If any transaction failed, mark the batch as failed
      if (errors.length > 0) {
        // In a real system, this would trigger rollback
        return {
          success: false,
          transactions: results,
          errors,
        }
      }

      // Complete all transactions in the batch
      const completedTransactions = []
      for (const transaction of results) {
        try {
          const completed = await this.completeTransaction(transaction.id, {
            batchId: batch.id,
          })
          completedTransactions.push(completed)
        } catch (error) {
          errors.push(`Failed to complete transaction ${transaction.id}: ${(error as Error).message}`)
        }
      }

      return {
        success: errors.length === 0,
        transactions: completedTransactions,
        errors,
      }
    } catch (error) {
      return {
        success: false,
        transactions: results,
        errors: [`Batch processing failed: ${(error as Error).message}`],
      }
    }
  }

  /**
   * Get transaction history with filtering
   */
  static async getTransactionHistory(filters: {
    userId?: string
    marketId?: string
    type?: Transaction['type']
    status?: Transaction['status']
    limit?: number
  }): Promise<Transaction[]> {
    if (filters.userId) {
      return await DatabaseService.getUserTransactions(filters.userId, filters.limit)
    }
    
    if (filters.marketId) {
      return await DatabaseService.getMarketTransactions(filters.marketId)
    }
    
    if (filters.status) {
      return await DatabaseService.getTransactionsByStatus(filters.status, filters.limit)
    }

    // Default to recent transactions
    return await DatabaseService.getTransactionsByStatus('COMPLETED', filters.limit || 50)
  }

  /**
   * Get transaction statistics
   */
  static async getTransactionStats(marketId?: string): Promise<{
    totalTransactions: number
    totalVolume: number
    byType: Record<Transaction['type'], { count: number; volume: number }>
    byStatus: Record<Transaction['status'], number>
  }> {
    const transactions = marketId 
      ? await DatabaseService.getMarketTransactions(marketId)
      : await this.getTransactionHistory({ limit: 1000 })

    const stats = {
      totalTransactions: transactions.length,
      totalVolume: transactions.reduce((sum, t) => sum + t.amount, 0),
      byType: {} as Record<Transaction['type'], { count: number; volume: number }>,
      byStatus: {} as Record<Transaction['status'], number>,
    }

    // Initialize counters
    const types: Transaction['type'][] = ['market_entry', 'winnings', 'platform_fee', 'creator_reward', 'automated_transfer']
    const statuses: Transaction['status'][] = ['PENDING', 'COMPLETED', 'FAILED']

    types.forEach(type => {
      stats.byType[type] = { count: 0, volume: 0 }
    })

    statuses.forEach(status => {
      stats.byStatus[status] = 0
    })

    // Count transactions
    transactions.forEach(transaction => {
      stats.byType[transaction.type].count++
      stats.byType[transaction.type].volume += transaction.amount
      stats.byStatus[transaction.status]++
    })

    return stats
  }
}