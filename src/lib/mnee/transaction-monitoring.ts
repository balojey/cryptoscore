// Enhanced transaction monitoring and validation service

import { MneeService } from './mnee-service'
import { DatabaseService } from '@/lib/supabase/database-service'
import type { TransactionStatus, TransferRecipient, MneeBalance } from './types'
import { MneeValidationError, MneeNetworkError } from './types'
import { generateCorrelationId } from './utils'

export interface TransactionMonitoringOptions {
  maxRetries?: number
  retryDelay?: number
  timeoutMs?: number
  enableCaching?: boolean
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  balanceCheck?: {
    required: number
    available: number
    sufficient: boolean
  }
}

export interface MonitoringStats {
  totalTransactions: number
  pendingTransactions: number
  failedTransactions: number
  averageConfirmationTime: number
  lastUpdateTime: number
}

export class MneeTransactionMonitoringService {
  private static instance: MneeTransactionMonitoringService
  private monitoringInterval: NodeJS.Timeout | null = null
  private transactionCache = new Map<string, { status: TransactionStatus; timestamp: number }>()
  private readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  private constructor(
    private mneeService: MneeService,
    private options: TransactionMonitoringOptions = {}
  ) {
    this.options = {
      maxRetries: 3,
      retryDelay: 2000,
      timeoutMs: 30000,
      enableCaching: true,
      ...options
    }
  }

  static getInstance(mneeService: MneeService, options?: TransactionMonitoringOptions): MneeTransactionMonitoringService {
    if (!this.instance) {
      this.instance = new MneeTransactionMonitoringService(mneeService, options)
    }
    return this.instance
  }

  /**
   * Comprehensive transfer validation with balance checking
   */
  async validateTransferComprehensive(
    recipients: TransferRecipient[],
    privateKey: string,
    senderAddress?: string
  ): Promise<ValidationResult> {
    const correlationId = generateCorrelationId()
    const errors: string[] = []
    const warnings: string[] = []
    let balanceCheck: ValidationResult['balanceCheck']

    try {
      console.log(`[${correlationId}] Starting comprehensive transfer validation`)

      // Basic SDK validation
      const basicValidation = await this.mneeService.validateTransfer(recipients, privateKey)
      if (!basicValidation) {
        errors.push('Basic MNEE SDK validation failed')
      }

      // Enhanced balance validation if sender address is provided
      if (senderAddress) {
        try {
          const balance = await this.mneeService.getBalance(senderAddress)
          const totalRequired = recipients.reduce((sum, r) => sum + this.mneeService.toAtomicUnits(r.amount), 0)
          
          // Estimate fees (placeholder - would use actual SDK method)
          const estimatedFee = Math.max(1000, totalRequired * 0.001) // 0.1% fee minimum 0.01 MNEE
          const totalWithFees = totalRequired + estimatedFee

          balanceCheck = {
            required: totalWithFees,
            available: balance.amount,
            sufficient: balance.amount >= totalWithFees
          }

          if (!balanceCheck.sufficient) {
            errors.push(`Insufficient balance: need ${this.mneeService.formatMneeAmount(totalWithFees)}, have ${this.mneeService.formatMneeAmount(balance.amount)}`)
          }

          // Warning for low balance after transfer
          const remainingBalance = balance.amount - totalWithFees
          if (remainingBalance < 10000) { // Less than 0.1 MNEE remaining
            warnings.push('Transfer will leave very low balance remaining')
          }
        } catch (balanceError) {
          errors.push(`Failed to check sender balance: ${balanceError instanceof Error ? balanceError.message : 'Unknown error'}`)
        }
      }

      // Validate recipient addresses
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i]
        
        // Check for self-transfer
        if (senderAddress && recipient.address.toLowerCase() === senderAddress.toLowerCase()) {
          warnings.push(`Recipient ${i + 1} is the same as sender address`)
        }

        // Check for very small amounts
        const atomicAmount = this.mneeService.toAtomicUnits(recipient.amount)
        if (atomicAmount < 1000) { // Less than 0.01 MNEE
          warnings.push(`Recipient ${i + 1} has very small transfer amount: ${recipient.amount} MNEE`)
        }
      }

      // Check for duplicate recipients
      const addressSet = new Set()
      for (let i = 0; i < recipients.length; i++) {
        const address = recipients[i].address.toLowerCase()
        if (addressSet.has(address)) {
          errors.push(`Duplicate recipient address found: ${recipients[i].address}`)
        }
        addressSet.add(address)
      }

      console.log(`[${correlationId}] Validation completed: ${errors.length} errors, ${warnings.length} warnings`)

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        balanceCheck
      }
    } catch (error) {
      console.error(`[${correlationId}] Validation failed:`, error)
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      return {
        isValid: false,
        errors,
        warnings,
        balanceCheck
      }
    }
  }

  /**
   * Monitor transaction status with automatic retries and caching
   */
  async monitorTransactionStatus(
    ticketId: string,
    onStatusUpdate?: (status: TransactionStatus) => void
  ): Promise<TransactionStatus> {
    const correlationId = generateCorrelationId()
    
    try {
      console.log(`[${correlationId}] Starting transaction monitoring for ticket: ${ticketId}`)

      // Check cache first
      if (this.options.enableCaching) {
        const cached = this.getCachedStatus(ticketId)
        if (cached && cached.status.status !== 'pending') {
          console.log(`[${correlationId}] Using cached status for ${ticketId}`)
          return cached.status
        }
      }

      // Get status with retries
      const status = await this.getStatusWithRetries(ticketId, correlationId)
      
      // Cache the result
      if (this.options.enableCaching) {
        this.cacheStatus(ticketId, status)
      }

      // Notify callback
      if (onStatusUpdate) {
        onStatusUpdate(status)
      }

      // Update database if transaction is completed
      if (status.status !== 'pending') {
        await this.updateDatabaseTransactionStatus(ticketId, status)
      }

      return status
    } catch (error) {
      console.error(`[${correlationId}] Transaction monitoring failed:`, error)
      throw error
    }
  }

  /**
   * Batch monitor multiple transactions
   */
  async monitorBatchTransactions(
    ticketIds: string[],
    onBatchUpdate?: (results: Map<string, TransactionStatus>) => void
  ): Promise<Map<string, TransactionStatus>> {
    const correlationId = generateCorrelationId()
    console.log(`[${correlationId}] Monitoring batch of ${ticketIds.length} transactions`)

    const results = new Map<string, TransactionStatus>()
    const batchSize = 5

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < ticketIds.length; i += batchSize) {
      const batch = ticketIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (ticketId) => {
        try {
          const status = await this.monitorTransactionStatus(ticketId)
          results.set(ticketId, status)
        } catch (error) {
          console.error(`[${correlationId}] Failed to monitor ${ticketId}:`, error)
          // Create a failed status for tracking
          results.set(ticketId, {
            ticketId,
            status: 'failed',
            confirmations: 0,
            timestamp: Date.now(),
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })

      await Promise.all(batchPromises)
      
      // Small delay between batches
      if (i + batchSize < ticketIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    if (onBatchUpdate) {
      onBatchUpdate(results)
    }

    console.log(`[${correlationId}] Batch monitoring completed: ${results.size} results`)
    return results
  }

  /**
   * Start continuous monitoring of pending transactions
   */
  startContinuousMonitoring(intervalMs = 30000): void {
    if (this.monitoringInterval) {
      console.warn('Continuous monitoring already running')
      return
    }

    console.log(`Starting continuous transaction monitoring (interval: ${intervalMs}ms)`)
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkPendingTransactions()
        this.cleanupCache()
      } catch (error) {
        console.error('Continuous monitoring error:', error)
      }
    }, intervalMs)
  }

  /**
   * Stop continuous monitoring
   */
  stopContinuousMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log('Continuous transaction monitoring stopped')
    }
  }

  /**
   * Get monitoring statistics
   */
  async getMonitoringStats(): Promise<MonitoringStats> {
    try {
      // Get pending transactions from database
      const { data: pendingTransactions } = await DatabaseService.supabase
        .from('transactions')
        .select('*')
        .eq('status', 'PENDING')
        .not('mnee_transaction_id', 'is', null)

      // Get failed transactions from last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const { data: failedTransactions } = await DatabaseService.supabase
        .from('transactions')
        .select('*')
        .eq('status', 'FAILED')
        .gte('created_at', oneDayAgo)

      // Get total transactions
      const { count: totalCount } = await DatabaseService.supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .not('mnee_transaction_id', 'is', null)

      return {
        totalTransactions: totalCount || 0,
        pendingTransactions: pendingTransactions?.length || 0,
        failedTransactions: failedTransactions?.length || 0,
        averageConfirmationTime: 0, // Would calculate from historical data
        lastUpdateTime: Date.now()
      }
    } catch (error) {
      console.error('Failed to get monitoring stats:', error)
      return {
        totalTransactions: 0,
        pendingTransactions: 0,
        failedTransactions: 0,
        averageConfirmationTime: 0,
        lastUpdateTime: Date.now()
      }
    }
  }

  /**
   * Get transaction status with retry logic
   */
  private async getStatusWithRetries(ticketId: string, correlationId: string): Promise<TransactionStatus> {
    const maxRetries = this.options.maxRetries || 3
    const retryDelay = this.options.retryDelay || 2000
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[${correlationId}] Getting status attempt ${attempt}/${maxRetries}`)
        return await this.mneeService.getTransactionStatus(ticketId)
      } catch (error) {
        lastError = error as Error
        console.warn(`[${correlationId}] Status check failed (attempt ${attempt}):`, error)
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        }
      }
    }

    throw new MneeNetworkError(
      `Failed to get transaction status after ${maxRetries} attempts: ${lastError?.message}`,
      lastError
    )
  }

  /**
   * Cache transaction status
   */
  private cacheStatus(ticketId: string, status: TransactionStatus): void {
    this.transactionCache.set(ticketId, {
      status,
      timestamp: Date.now()
    })
  }

  /**
   * Get cached transaction status
   */
  private getCachedStatus(ticketId: string): { status: TransactionStatus; timestamp: number } | null {
    const cached = this.transactionCache.get(ticketId)
    if (!cached) return null

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.transactionCache.delete(ticketId)
      return null
    }

    return cached
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    for (const [ticketId, cached] of this.transactionCache.entries()) {
      if (now - cached.timestamp > this.CACHE_TTL) {
        this.transactionCache.delete(ticketId)
      }
    }
  }

  /**
   * Check all pending transactions in database
   */
  private async checkPendingTransactions(): Promise<void> {
    try {
      const { data: pendingTransactions } = await DatabaseService.supabase
        .from('transactions')
        .select('*')
        .eq('status', 'PENDING')
        .not('ticket_id', 'is', null)
        .limit(50) // Limit to avoid overwhelming the system

      if (!pendingTransactions || pendingTransactions.length === 0) {
        return
      }

      console.log(`Checking ${pendingTransactions.length} pending transactions`)

      const ticketIds = pendingTransactions
        .map(tx => tx.ticket_id)
        .filter((id): id is string => id !== null)

      const statusResults = await this.monitorBatchTransactions(ticketIds)

      // Update database with results
      for (const [ticketId, status] of statusResults.entries()) {
        if (status.status !== 'pending') {
          await this.updateDatabaseTransactionStatus(ticketId, status)
        }
      }
    } catch (error) {
      console.error('Failed to check pending transactions:', error)
    }
  }

  /**
   * Update database transaction status
   */
  private async updateDatabaseTransactionStatus(ticketId: string, status: TransactionStatus): Promise<void> {
    try {
      const dbStatus = status.status === 'confirmed' ? 'SUCCESS' : 
                      status.status === 'failed' ? 'FAILED' : 'PENDING'

      await DatabaseService.supabase
        .from('transactions')
        .update({
          status: dbStatus,
          updated_at: new Date().toISOString(),
          metadata: {
            mneeStatus: status.status,
            confirmations: status.confirmations,
            lastChecked: Date.now(),
            error: status.error
          }
        })
        .eq('ticket_id', ticketId)

      console.log(`Updated database status for ticket ${ticketId}: ${dbStatus}`)
    } catch (error) {
      console.error(`Failed to update database status for ticket ${ticketId}:`, error)
    }
  }
}