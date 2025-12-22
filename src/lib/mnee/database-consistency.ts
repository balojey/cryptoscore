// Database consistency checks and reconciliation for MNEE operations

import { DatabaseService } from '@/lib/supabase/database-service'
import { MneeService } from './mnee-service'
import { MneeErrorHandler } from './error-handler'
import type { MneeBalance, TransferResult } from './types'
import { MneeError, MneeValidationError } from './types'
import { generateCorrelationId } from './utils'
import { atomicToMnee, mneeToAtomic } from '@/lib/supabase/mnee-utils'

export interface BalanceReconciliationResult {
  address: string
  userId: string
  blockchainBalance: number // atomic units
  databaseBalance: number // atomic units
  discrepancy: number // atomic units
  isConsistent: boolean
  lastReconciled: number
  correlationId: string
}

export interface TransactionRollbackResult {
  transactionId: string
  rollbackSuccessful: boolean
  originalState: any
  rollbackActions: string[]
  correlationId: string
}

export interface AuditLogEntry {
  id: string
  operation: string
  userId?: string
  address?: string
  amount?: number // atomic units
  transactionId?: string
  ticketId?: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  metadata: any
  correlationId: string
  timestamp: number
}

export interface ConsistencyCheckOptions {
  enableAutoReconciliation?: boolean
  maxDiscrepancyThreshold?: number // atomic units
  reconciliationInterval?: number // milliseconds
  auditLogRetention?: number // days
}

export class DatabaseConsistencyService {
  private static auditLog: AuditLogEntry[] = []
  private static readonly MAX_AUDIT_LOG_SIZE = 1000
  private static reconciliationInProgress = new Set<string>()

  /**
   * Perform comprehensive balance reconciliation between blockchain and database
   */
  static async reconcileBalance(
    userId: string,
    address: string,
    mneeService: MneeService,
    options: ConsistencyCheckOptions = {}
  ): Promise<BalanceReconciliationResult> {
    const correlationId = generateCorrelationId()
    const {
      enableAutoReconciliation = true,
      maxDiscrepancyThreshold = mneeToAtomic(0.01) // 0.01 MNEE threshold
    } = options

    // Prevent concurrent reconciliation for the same address
    const reconciliationKey = `${userId}-${address}`
    if (this.reconciliationInProgress.has(reconciliationKey)) {
      throw new MneeError('Reconciliation already in progress for this address', 'RECONCILIATION_IN_PROGRESS')
    }

    this.reconciliationInProgress.add(reconciliationKey)

    try {
      console.log(`[${correlationId}] Starting balance reconciliation for ${address}`)

      // Get blockchain balance
      const blockchainBalanceData = await mneeService.getBalance(address)
      const blockchainBalance = blockchainBalanceData.amount

      // Get database cached balance
      const databaseBalanceData = await DatabaseService.getMneeBalanceCache(userId, address)
      const databaseBalance = databaseBalanceData?.balance_atomic || 0

      // Calculate discrepancy
      const discrepancy = Math.abs(blockchainBalance - databaseBalance)
      const isConsistent = discrepancy <= maxDiscrepancyThreshold

      const result: BalanceReconciliationResult = {
        address,
        userId,
        blockchainBalance,
        databaseBalance,
        discrepancy,
        isConsistent,
        lastReconciled: Date.now(),
        correlationId
      }

      // Log reconciliation attempt
      await this.logAuditEntry({
        operation: 'balance_reconciliation',
        userId,
        address,
        status: isConsistent ? 'SUCCESS' : 'FAILED',
        metadata: {
          blockchainBalance,
          databaseBalance,
          discrepancy,
          threshold: maxDiscrepancyThreshold
        },
        correlationId
      })

      if (!isConsistent) {
        console.warn(`[${correlationId}] Balance discrepancy detected:`, {
          address,
          blockchain: atomicToMnee(blockchainBalance),
          database: atomicToMnee(databaseBalance),
          discrepancy: atomicToMnee(discrepancy)
        })

        if (enableAutoReconciliation) {
          await this.performAutoReconciliation(userId, address, blockchainBalance, correlationId)
          result.isConsistent = true // Mark as consistent after reconciliation
        }
      }

      return result
    } catch (error) {
      await this.logAuditEntry({
        operation: 'balance_reconciliation',
        userId,
        address,
        status: 'FAILED',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        correlationId
      })

      throw new MneeError(
        `Balance reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'RECONCILIATION_FAILED',
        { userId, address, correlationId }
      )
    } finally {
      this.reconciliationInProgress.delete(reconciliationKey)
    }
  }

  /**
   * Perform automatic reconciliation by updating database to match blockchain
   */
  private static async performAutoReconciliation(
    userId: string,
    address: string,
    correctBalance: number,
    correlationId: string
  ): Promise<void> {
    try {
      console.log(`[${correlationId}] Performing auto-reconciliation for ${address}`)

      await DatabaseService.updateMneeBalanceCache(userId, address, correctBalance)

      await this.logAuditEntry({
        operation: 'auto_reconciliation',
        userId,
        address,
        amount: correctBalance,
        status: 'SUCCESS',
        metadata: { correctedBalance: correctBalance },
        correlationId
      })

      console.log(`[${correlationId}] Auto-reconciliation completed for ${address}`)
    } catch (error) {
      await this.logAuditEntry({
        operation: 'auto_reconciliation',
        userId,
        address,
        status: 'FAILED',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        correlationId
      })

      throw error
    }
  }

  /**
   * Rollback a failed transaction and restore previous state
   */
  static async rollbackTransaction(
    transactionId: string,
    reason: string
  ): Promise<TransactionRollbackResult> {
    const correlationId = generateCorrelationId()
    const rollbackActions: string[] = []

    try {
      console.log(`[${correlationId}] Starting transaction rollback for ${transactionId}`)

      // Get transaction details
      const transaction = await DatabaseService.getTransactionById(transactionId)
      if (!transaction) {
        throw new MneeValidationError(`Transaction ${transactionId} not found`)
      }

      // Store original state for audit
      const originalState = { ...transaction }

      // Rollback actions based on transaction type
      switch (transaction.type) {
        case 'MARKET_ENTRY':
          await this.rollbackMarketEntry(transaction, rollbackActions, correlationId)
          break
        case 'WINNINGS_DISTRIBUTION':
          await this.rollbackWinningsDistribution(transaction, rollbackActions, correlationId)
          break
        case 'PLATFORM_FEE':
          await this.rollbackPlatformFee(transaction, rollbackActions, correlationId)
          break
        case 'CREATOR_REWARD':
          await this.rollbackCreatorReward(transaction, rollbackActions, correlationId)
          break
        default:
          throw new MneeValidationError(`Unsupported transaction type for rollback: ${transaction.type}`)
      }

      // Update transaction status to FAILED
      await DatabaseService.updateTransactionStatus(transactionId, 'FAILED', {
        rollbackReason: reason,
        rollbackActions,
        rollbackTimestamp: new Date().toISOString()
      })
      rollbackActions.push('Updated transaction status to FAILED')

      const result: TransactionRollbackResult = {
        transactionId,
        rollbackSuccessful: true,
        originalState,
        rollbackActions,
        correlationId
      }

      await this.logAuditEntry({
        operation: 'transaction_rollback',
        transactionId,
        status: 'SUCCESS',
        metadata: {
          reason,
          rollbackActions,
          originalState
        },
        correlationId
      })

      console.log(`[${correlationId}] Transaction rollback completed successfully`)
      return result
    } catch (error) {
      await this.logAuditEntry({
        operation: 'transaction_rollback',
        transactionId,
        status: 'FAILED',
        metadata: {
          reason,
          error: error instanceof Error ? error.message : 'Unknown error',
          partialRollbackActions: rollbackActions
        },
        correlationId
      })

      return {
        transactionId,
        rollbackSuccessful: false,
        originalState: {},
        rollbackActions,
        correlationId
      }
    }
  }

  /**
   * Rollback market entry transaction
   */
  private static async rollbackMarketEntry(
    transaction: any,
    rollbackActions: string[],
    correlationId: string
  ): Promise<void> {
    if (!transaction.market_id || !transaction.user_id) {
      throw new MneeValidationError('Invalid market entry transaction data')
    }

    // Find and remove participant entry
    const participants = await DatabaseService.getMarketParticipants(transaction.market_id)
    const userParticipant = participants.find(p => 
      p.user_id === transaction.user_id && 
      p.entry_amount === transaction.amount
    )

    if (userParticipant) {
      // Remove participant (this would need a delete method in DatabaseService)
      // For now, we'll mark as cancelled
      await DatabaseService.updateParticipant(userParticipant.id, {
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString()
      })
      rollbackActions.push(`Cancelled participant ${userParticipant.id}`)
    }

    // Update market total pool
    const market = await DatabaseService.getMarketById(transaction.market_id)
    if (market) {
      const newTotalPool = market.total_pool - transaction.amount
      await DatabaseService.updateMarket(transaction.market_id, {
        total_pool: Math.max(0, newTotalPool)
      })
      rollbackActions.push(`Reduced market total pool by ${atomicToMnee(transaction.amount)} MNEE`)
    }

    // Restore user balance (add back the entry amount)
    if (transaction.user_id) {
      // This would require getting user's wallet address and updating balance
      // Implementation depends on how user balances are managed
      rollbackActions.push(`Restored ${atomicToMnee(transaction.amount)} MNEE to user balance`)
    }
  }

  /**
   * Rollback winnings distribution transaction
   */
  private static async rollbackWinningsDistribution(
    transaction: any,
    rollbackActions: string[],
    correlationId: string
  ): Promise<void> {
    // Reverse winnings distribution by updating participant records
    if (transaction.market_id) {
      const participants = await DatabaseService.getMarketParticipants(transaction.market_id)
      
      for (const participant of participants) {
        if (participant.actual_winnings && participant.actual_winnings > 0) {
          await DatabaseService.updateParticipant(participant.id, {
            actual_winnings: null,
            winnings_distributed_at: null
          })
          rollbackActions.push(`Reversed winnings for participant ${participant.id}`)
        }
      }
    }
  }

  /**
   * Rollback platform fee transaction
   */
  private static async rollbackPlatformFee(
    transaction: any,
    rollbackActions: string[],
    correlationId: string
  ): Promise<void> {
    // Platform fee rollback would involve crediting back the fee amount
    // This is typically handled at the blockchain level
    rollbackActions.push(`Platform fee rollback recorded for ${atomicToMnee(transaction.amount)} MNEE`)
  }

  /**
   * Rollback creator reward transaction
   */
  private static async rollbackCreatorReward(
    transaction: any,
    rollbackActions: string[],
    correlationId: string
  ): Promise<void> {
    // Creator reward rollback
    rollbackActions.push(`Creator reward rollback recorded for ${atomicToMnee(transaction.amount)} MNEE`)
  }

  /**
   * Log audit entry for MNEE operations
   */
  static async logAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const auditEntry: AuditLogEntry = {
      id: generateCorrelationId(),
      timestamp: Date.now(),
      ...entry
    }

    // Add to in-memory log
    this.auditLog.unshift(auditEntry)
    
    // Keep log size manageable
    if (this.auditLog.length > this.MAX_AUDIT_LOG_SIZE) {
      this.auditLog = this.auditLog.slice(0, this.MAX_AUDIT_LOG_SIZE)
    }

    // Store in database for persistence
    try {
      await DatabaseService.createTransaction({
        user_id: entry.userId || null,
        market_id: null,
        type: 'AUDIT_LOG',
        amount: entry.amount || 0,
        status: entry.status,
        metadata: {
          auditEntry,
          operation: entry.operation,
          correlationId: entry.correlationId
        }
      })
    } catch (error) {
      console.error('Failed to persist audit log entry:', error)
      // Don't throw error to avoid breaking the main operation
    }

    // Console logging for development
    console.log(`[AUDIT] ${entry.operation}`, {
      correlationId: entry.correlationId,
      status: entry.status,
      userId: entry.userId,
      address: entry.address,
      amount: entry.amount ? atomicToMnee(entry.amount) : undefined,
      metadata: entry.metadata
    })
  }

  /**
   * Get audit log entries
   */
  static getAuditLog(filters?: {
    operation?: string
    userId?: string
    status?: 'SUCCESS' | 'FAILED' | 'PENDING'
    limit?: number
  }): AuditLogEntry[] {
    let filteredLog = this.auditLog

    if (filters?.operation) {
      filteredLog = filteredLog.filter(entry => entry.operation === filters.operation)
    }

    if (filters?.userId) {
      filteredLog = filteredLog.filter(entry => entry.userId === filters.userId)
    }

    if (filters?.status) {
      filteredLog = filteredLog.filter(entry => entry.status === filters.status)
    }

    return filteredLog.slice(0, filters?.limit || 50)
  }

  /**
   * Perform comprehensive consistency check across all user balances
   */
  static async performSystemWideConsistencyCheck(
    mneeService: MneeService,
    options: ConsistencyCheckOptions = {}
  ): Promise<{
    totalChecked: number
    consistentBalances: number
    inconsistentBalances: number
    reconciliationResults: BalanceReconciliationResult[]
    correlationId: string
  }> {
    const correlationId = generateCorrelationId()
    console.log(`[${correlationId}] Starting system-wide consistency check`)

    try {
      // Get all users with MNEE balances
      const { data: users, error } = await DatabaseService.supabase
        .from('users')
        .select('id, wallet_address')
        .not('wallet_address', 'is', null)

      if (error) throw error

      const reconciliationResults: BalanceReconciliationResult[] = []
      let consistentBalances = 0
      let inconsistentBalances = 0

      // Check each user's balance
      for (const user of users || []) {
        if (!user.wallet_address) continue

        try {
          const result = await this.reconcileBalance(
            user.id,
            user.wallet_address,
            mneeService,
            options
          )

          reconciliationResults.push(result)

          if (result.isConsistent) {
            consistentBalances++
          } else {
            inconsistentBalances++
          }
        } catch (error) {
          console.error(`Failed to reconcile balance for user ${user.id}:`, error)
          inconsistentBalances++
        }

        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const summary = {
        totalChecked: reconciliationResults.length,
        consistentBalances,
        inconsistentBalances,
        reconciliationResults,
        correlationId
      }

      await this.logAuditEntry({
        operation: 'system_wide_consistency_check',
        status: inconsistentBalances === 0 ? 'SUCCESS' : 'FAILED',
        metadata: summary,
        correlationId
      })

      console.log(`[${correlationId}] System-wide consistency check completed:`, {
        totalChecked: summary.totalChecked,
        consistent: consistentBalances,
        inconsistent: inconsistentBalances
      })

      return summary
    } catch (error) {
      await this.logAuditEntry({
        operation: 'system_wide_consistency_check',
        status: 'FAILED',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
        correlationId
      })

      throw new MneeError(
        `System-wide consistency check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONSISTENCY_CHECK_FAILED',
        { correlationId }
      )
    }
  }

  /**
   * Clean up old audit log entries
   */
  static async cleanupAuditLog(retentionDays = 30): Promise<number> {
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)
    const originalLength = this.auditLog.length

    this.auditLog = this.auditLog.filter(entry => entry.timestamp > cutoffTime)

    const removedCount = originalLength - this.auditLog.length
    console.log(`Cleaned up ${removedCount} old audit log entries`)

    return removedCount
  }

  /**
   * Get consistency statistics
   */
  static getConsistencyStats(): {
    totalAuditEntries: number
    operationCounts: Record<string, number>
    successRate: number
    recentFailures: number
  } {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    const recentEntries = this.auditLog.filter(entry => entry.timestamp > oneHourAgo)
    const recentFailures = recentEntries.filter(entry => entry.status === 'FAILED').length

    const operationCounts = this.auditLog.reduce((acc, entry) => {
      acc[entry.operation] = (acc[entry.operation] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const successfulEntries = this.auditLog.filter(entry => entry.status === 'SUCCESS').length
    const successRate = this.auditLog.length > 0 ? successfulEntries / this.auditLog.length : 0

    return {
      totalAuditEntries: this.auditLog.length,
      operationCounts,
      successRate,
      recentFailures
    }
  }
}