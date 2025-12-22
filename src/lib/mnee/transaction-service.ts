// Enhanced transaction service with consistency checks and rollback capabilities

import { DatabaseService } from '@/lib/supabase/database-service'
import { DatabaseConsistencyService } from './database-consistency'
import { MneeService } from './mnee-service'
import type { TransferRecipient, TransferResult } from './types'
import { MneeError, MneeValidationError } from './types'
import { generateCorrelationId } from './utils'
import { atomicToMnee } from '@/lib/supabase/mnee-utils'
import type { Database } from '@/types/supabase'

type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']

export interface TransactionContext {
  userId: string
  marketId?: string
  operation: string
  correlationId: string
  metadata?: any
}

export interface AtomicTransactionResult {
  success: boolean
  transactionId?: string
  ticketId?: string
  rollbackPerformed?: boolean
  error?: string
  correlationId: string
}

export class MneeTransactionService {
  private static pendingTransactions = new Map<string, TransactionContext>()

  /**
   * Execute an atomic MNEE transaction with automatic rollback on failure
   */
  static async executeAtomicTransaction(
    mneeService: MneeService,
    context: TransactionContext,
    transactionData: TransactionInsert,
    mneeTransfer?: {
      recipients: TransferRecipient[]
      privateKey: string
    }
  ): Promise<AtomicTransactionResult> {
    const { correlationId } = context
    
    // Track pending transaction
    this.pendingTransactions.set(correlationId, context)

    try {
      console.log(`[${correlationId}] Starting atomic transaction: ${context.operation}`)

      // Step 1: Create database transaction record
      const dbTransaction = await DatabaseService.createTransactionWithMnee({
        ...transactionData,
        status: 'PENDING',
        metadata: {
          ...transactionData.metadata,
          correlationId,
          operation: context.operation,
          atomicTransaction: true
        }
      })

      // Log transaction start
      await DatabaseConsistencyService.logAuditEntry({
        operation: `${context.operation}_start`,
        userId: context.userId,
        transactionId: dbTransaction.id,
        amount: transactionData.amount,
        status: 'PENDING',
        metadata: {
          transactionData,
          mneeTransfer: mneeTransfer ? {
            recipientCount: mneeTransfer.recipients.length,
            totalAmount: mneeTransfer.recipients.reduce((sum, r) => sum + r.amount, 0)
          } : null
        },
        correlationId
      })

      let mneeResult: TransferResult | null = null

      // Step 2: Execute MNEE transfer if required
      if (mneeTransfer) {
        try {
          mneeResult = await mneeService.transfer(mneeTransfer.recipients, mneeTransfer.privateKey)
          
          if (mneeResult.status === 'failed') {
            throw new MneeError(`MNEE transfer failed: ${mneeResult.error}`, 'TRANSFER_FAILED')
          }

          // Update database transaction with MNEE details
          await DatabaseService.updateTransactionStatus(dbTransaction.id, 'PENDING', {
            mneeTransactionId: mneeResult.transactionId,
            ticketId: mneeResult.ticketId,
            mneeStatus: mneeResult.status
          })
        } catch (mneeError) {
          // Rollback database transaction
          await this.rollbackDatabaseTransaction(dbTransaction.id, 'MNEE transfer failed', correlationId)
          throw mneeError
        }
      }

      // Step 3: Update transaction status to SUCCESS
      await DatabaseService.updateTransactionStatus(dbTransaction.id, 'SUCCESS', {
        completedAt: new Date().toISOString(),
        mneeTransactionId: mneeResult?.transactionId,
        ticketId: mneeResult?.ticketId
      })

      // Step 4: Perform balance reconciliation if user balance was affected
      if (transactionData.user_id) {
        try {
          // Get user's wallet address for reconciliation
          const user = await DatabaseService.supabase
            .from('users')
            .select('wallet_address')
            .eq('id', transactionData.user_id)
            .single()

          if (user.data?.wallet_address) {
            await DatabaseConsistencyService.reconcileBalance(
              transactionData.user_id,
              user.data.wallet_address,
              mneeService,
              { enableAutoReconciliation: true }
            )
          }
        } catch (reconciliationError) {
          console.warn(`[${correlationId}] Balance reconciliation failed:`, reconciliationError)
          // Don't fail the transaction for reconciliation errors
        }
      }

      // Log successful completion
      await DatabaseConsistencyService.logAuditEntry({
        operation: `${context.operation}_success`,
        userId: context.userId,
        transactionId: dbTransaction.id,
        ticketId: mneeResult?.ticketId,
        amount: transactionData.amount,
        status: 'SUCCESS',
        metadata: {
          mneeResult,
          completionTime: Date.now()
        },
        correlationId
      })

      console.log(`[${correlationId}] Atomic transaction completed successfully`)

      return {
        success: true,
        transactionId: dbTransaction.id,
        ticketId: mneeResult?.ticketId,
        correlationId
      }

    } catch (error) {
      console.error(`[${correlationId}] Atomic transaction failed:`, error)

      // Attempt comprehensive rollback
      const rollbackResult = await this.performComprehensiveRollback(
        correlationId,
        context,
        error instanceof Error ? error.message : 'Unknown error'
      )

      // Log failure
      await DatabaseConsistencyService.logAuditEntry({
        operation: `${context.operation}_failed`,
        userId: context.userId,
        status: 'FAILED',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          rollbackPerformed: rollbackResult.rollbackPerformed
        },
        correlationId
      })

      return {
        success: false,
        rollbackPerformed: rollbackResult.rollbackPerformed,
        error: error instanceof Error ? error.message : 'Unknown error',
        correlationId
      }
    } finally {
      // Clean up pending transaction tracking
      this.pendingTransactions.delete(correlationId)
    }
  }

  /**
   * Rollback database transaction
   */
  private static async rollbackDatabaseTransaction(
    transactionId: string,
    reason: string,
    correlationId: string
  ): Promise<void> {
    try {
      await DatabaseService.updateTransactionStatus(transactionId, 'FAILED', {
        rollbackReason: reason,
        rollbackTimestamp: new Date().toISOString()
      })

      console.log(`[${correlationId}] Database transaction ${transactionId} rolled back: ${reason}`)
    } catch (error) {
      console.error(`[${correlationId}] Failed to rollback database transaction:`, error)
    }
  }

  /**
   * Perform comprehensive rollback of all transaction components
   */
  private static async performComprehensiveRollback(
    correlationId: string,
    context: TransactionContext,
    reason: string
  ): Promise<{ rollbackPerformed: boolean; actions: string[] }> {
    const rollbackActions: string[] = []
    let rollbackPerformed = false

    try {
      console.log(`[${correlationId}] Starting comprehensive rollback for ${context.operation}`)

      // Find all database transactions for this correlation ID
      const { data: transactions, error } = await DatabaseService.supabase
        .from('transactions')
        .select('*')
        .eq('metadata->>correlationId', correlationId)

      if (error) {
        console.error(`[${correlationId}] Failed to find transactions for rollback:`, error)
        return { rollbackPerformed: false, actions: [] }
      }

      // Rollback each transaction
      for (const transaction of transactions || []) {
        try {
          const rollbackResult = await DatabaseConsistencyService.rollbackTransaction(
            transaction.id,
            `Comprehensive rollback: ${reason}`
          )

          if (rollbackResult.rollbackSuccessful) {
            rollbackActions.push(...rollbackResult.rollbackActions)
            rollbackPerformed = true
          }
        } catch (rollbackError) {
          console.error(`[${correlationId}] Failed to rollback transaction ${transaction.id}:`, rollbackError)
          rollbackActions.push(`Failed to rollback transaction ${transaction.id}`)
        }
      }

      // Additional rollback actions based on operation type
      if (context.operation.includes('market_entry') && context.marketId) {
        await this.rollbackMarketEntryEffects(context.marketId, context.userId, correlationId)
        rollbackActions.push('Rolled back market entry effects')
        rollbackPerformed = true
      }

      console.log(`[${correlationId}] Comprehensive rollback completed. Actions: ${rollbackActions.length}`)

      return { rollbackPerformed, actions: rollbackActions }
    } catch (error) {
      console.error(`[${correlationId}] Comprehensive rollback failed:`, error)
      return { rollbackPerformed: false, actions: rollbackActions }
    }
  }

  /**
   * Rollback market entry specific effects
   */
  private static async rollbackMarketEntryEffects(
    marketId: string,
    userId: string,
    correlationId: string
  ): Promise<void> {
    try {
      // Find recent participant entries for this user and market
      const { data: participants, error } = await DatabaseService.supabase
        .from('participants')
        .select('*')
        .eq('market_id', marketId)
        .eq('user_id', userId)
        .order('joined_at', { ascending: false })
        .limit(1)

      if (error || !participants || participants.length === 0) {
        console.warn(`[${correlationId}] No recent participant found for rollback`)
        return
      }

      const participant = participants[0]

      // Mark participant as cancelled
      await DatabaseService.updateParticipant(participant.id, {
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString()
      })

      // Update market total pool
      const market = await DatabaseService.getMarketById(marketId)
      if (market) {
        const newTotalPool = Math.max(0, market.total_pool - participant.entry_amount)
        await DatabaseService.updateMarket(marketId, {
          total_pool: newTotalPool
        })
      }

      console.log(`[${correlationId}] Market entry effects rolled back for participant ${participant.id}`)
    } catch (error) {
      console.error(`[${correlationId}] Failed to rollback market entry effects:`, error)
    }
  }

  /**
   * Monitor pending transactions and handle timeouts
   */
  static async monitorPendingTransactions(timeoutMs = 300000): Promise<void> { // 5 minutes default
    const now = Date.now()
    const timeoutThreshold = now - timeoutMs

    for (const [correlationId, context] of this.pendingTransactions.entries()) {
      // Check if transaction has been pending too long
      const transactionAge = now - parseInt(correlationId.split('_')[1] || '0')
      
      if (transactionAge > timeoutMs) {
        console.warn(`Transaction ${correlationId} has been pending for ${transactionAge}ms, initiating timeout rollback`)

        try {
          await this.performComprehensiveRollback(
            correlationId,
            context,
            'Transaction timeout'
          )

          await DatabaseConsistencyService.logAuditEntry({
            operation: `${context.operation}_timeout`,
            userId: context.userId,
            status: 'FAILED',
            metadata: {
              reason: 'Transaction timeout',
              pendingDuration: transactionAge
            },
            correlationId
          })
        } catch (error) {
          console.error(`Failed to handle timeout for transaction ${correlationId}:`, error)
        } finally {
          this.pendingTransactions.delete(correlationId)
        }
      }
    }
  }

  /**
   * Get pending transaction statistics
   */
  static getPendingTransactionStats(): {
    totalPending: number
    oldestPendingAge: number
    operationCounts: Record<string, number>
  } {
    const now = Date.now()
    let oldestAge = 0
    const operationCounts: Record<string, number> = {}

    for (const [correlationId, context] of this.pendingTransactions.entries()) {
      const age = now - parseInt(correlationId.split('_')[1] || '0')
      oldestAge = Math.max(oldestAge, age)
      
      operationCounts[context.operation] = (operationCounts[context.operation] || 0) + 1
    }

    return {
      totalPending: this.pendingTransactions.size,
      oldestPendingAge: oldestAge,
      operationCounts
    }
  }

  /**
   * Force rollback a pending transaction
   */
  static async forceRollbackPendingTransaction(correlationId: string, reason: string): Promise<boolean> {
    const context = this.pendingTransactions.get(correlationId)
    if (!context) {
      console.warn(`No pending transaction found for correlation ID: ${correlationId}`)
      return false
    }

    try {
      const result = await this.performComprehensiveRollback(correlationId, context, reason)
      this.pendingTransactions.delete(correlationId)
      
      console.log(`Force rollback completed for ${correlationId}: ${result.rollbackPerformed}`)
      return result.rollbackPerformed
    } catch (error) {
      console.error(`Force rollback failed for ${correlationId}:`, error)
      return false
    }
  }

  /**
   * Clean up completed transactions from tracking
   */
  static cleanupCompletedTransactions(): number {
    const initialSize = this.pendingTransactions.size
    
    // In a real implementation, you would check the database for completed transactions
    // and remove them from the pending map. For now, we'll just log the current state.
    
    console.log(`Cleanup check: ${initialSize} pending transactions`)
    return 0 // No cleanup performed in this simplified version
  }
}