// MNEE Service implementation with SDK integration

import Mnee from '@mnee/ts-sdk'
import type { Environment, MNEEBalance, SendMNEE, TransferResponse, TransferStatus } from '@mnee/ts-sdk'
import type {
  MneeServiceInterface,
  MneeConfig,
  MneeConfiguration,
  MneeBalance,
  TransferRecipient,
  TransferResult,
  TransactionStatus,
  TransactionHistory,
  HistoryOptions,
  FormatOptions,
  BalanceCallback,
  RetryConfig,
  CircuitBreakerConfig
} from './types'
import {
  MneeNetworkError,
  MneeValidationError,
  MneeConfigurationError
} from './types'
import { MneeCircuitBreaker } from './circuit-breaker'
import { DatabaseConsistencyService } from './database-consistency'
import {
  retryWithBackoff,
  isValidEvmAddress,
  isValidPrivateKey,
  formatErrorMessage,
  withTimeout,
  batchArray,
  generateCorrelationId
} from './utils'
import { MneeErrorHandler } from './error-handler'
import { MNEE_TOKEN_CONFIG, MNEE_FEE_CONFIG } from '../../config/mnee'
import { getBalanceSubscriptionService } from './balance-subscription-service'
import type { BalanceSubscriptionOptions } from './balance-subscription-service'

export class MneeService implements MneeServiceInterface {
  private sdk: Mnee | null = null
  private config: MneeConfig | null = null
  private circuitBreaker: MneeCircuitBreaker
  private isInitialized = false

  // Default configurations
  private readonly defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }

  private readonly defaultCircuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    timeout: 60000, // 1 minute
    monitoringPeriod: 30000 // 30 seconds
  }

  constructor() {
    this.circuitBreaker = new MneeCircuitBreaker(this.defaultCircuitBreakerConfig)
  }

  /**
   * Initialize the MNEE service with configuration
   */
  async initialize(config: MneeConfig): Promise<void> {
    try {
      this.validateConfig(config)
      this.config = config

      // Initialize SDK
      this.sdk = new Mnee({
        apiKey: config.apiKey,
        environment: config.environment
      })

      // Update circuit breaker config if provided
      if (config.circuitBreakerThreshold || config.circuitBreakerTimeout) {
        const cbConfig: CircuitBreakerConfig = {
          ...this.defaultCircuitBreakerConfig,
          failureThreshold: config.circuitBreakerThreshold || this.defaultCircuitBreakerConfig.failureThreshold,
          timeout: config.circuitBreakerTimeout || this.defaultCircuitBreakerConfig.timeout
        }
        this.circuitBreaker = new MneeCircuitBreaker(cbConfig)
      }

      this.isInitialized = true
      console.log(`MNEE Service initialized for ${config.environment} environment`)
    } catch (error) {
      throw new MneeConfigurationError(
        `Failed to initialize MNEE service: ${formatErrorMessage(error)}`,
        { originalError: error, config }
      )
    }
  }

  /**
   * Get current configuration
   */
  async getConfig(): Promise<MneeConfiguration> {
    this.ensureInitialized()
    
    return {
      environment: this.config!.environment,
      apiKey: this.config!.apiKey,
      feeAddress: this.config!.feeAddress || MNEE_FEE_CONFIG.platformFeeAddress,
      fees: [
        {
          min: MNEE_FEE_CONFIG.minTransferAmount,
          max: MNEE_FEE_CONFIG.maxTransferAmount,
          fee: this.toAtomicUnits(MNEE_FEE_CONFIG.platformFeePercentage / 100)
        }
      ]
    }
  }

  /**
   * Get balance for a single address with enhanced error handling
   */
  async getBalance(address: string): Promise<MneeBalance> {
    this.ensureInitialized()
    this.validateAddress(address)

    const correlationId = generateCorrelationId()
    
    return await MneeErrorHandler.handleOperation(
      async () => {
        console.log(`[${correlationId}] Fetching balance for address: ${address}`)
        
        const response: MNEEBalance = await withTimeout(
          this.sdk!.balance(address),
          10000, // 10 second timeout
          'Balance query timed out'
        )

        const atomicAmount = response.amount || 0
        const balance: MneeBalance = {
          address,
          amount: atomicAmount,
          decimalAmount: response.decimalAmount || this.fromAtomicUnits(atomicAmount),
          lastUpdated: Date.now()
        }

        console.log(`[${correlationId}] Balance fetched: ${this.formatMneeAmount(atomicAmount)}`)
        return balance
      },
      {
        operation: 'getBalance',
        correlationId,
        address
      },
      this.getRetryConfig(),
      {
        enableRetry: true,
        fallbackToCache: true,
        notifyUser: false, // Don't notify for balance queries
        logError: true
      }
    )
  }

  /**
   * Get balances for multiple addresses
   */
  async getBalances(addresses: string[]): Promise<MneeBalance[]> {
    this.ensureInitialized()
    
    if (addresses.length === 0) {
      return []
    }

    // Validate all addresses
    addresses.forEach(address => this.validateAddress(address))

    const correlationId = generateCorrelationId()
    console.log(`[${correlationId}] Fetching balances for ${addresses.length} addresses`)

    try {
      // Batch requests to avoid overwhelming the API
      const batches = batchArray(addresses, 10) // Process 10 addresses at a time
      const results: MneeBalance[] = []

      for (const batch of batches) {
        const batchPromises = batch.map(address => this.getBalance(address))
        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)
      }

      console.log(`[${correlationId}] Successfully fetched ${results.length} balances`)
      return results
    } catch (error) {
      console.error(`[${correlationId}] Batch balance query failed:`, error)
      throw new MneeNetworkError(
        `Failed to get balances: ${formatErrorMessage(error)}`,
        { addresses, correlationId, originalError: error }
      )
    }
  }

  /**
   * Subscribe to balance changes for an address
   */
  subscribeToBalance(
    address: string, 
    callback: BalanceCallback, 
    options?: BalanceSubscriptionOptions
  ): () => void {
    this.validateAddress(address)

    // Use the enhanced balance subscription service
    const subscriptionService = getBalanceSubscriptionService(this)
    return subscriptionService.subscribe(address, callback, options)
  }

  /**
   * Transfer MNEE tokens to recipients with enhanced error handling
   */
  async transfer(recipients: TransferRecipient[], privateKey: string): Promise<TransferResult> {
    this.ensureInitialized()
    this.validatePrivateKey(privateKey)
    this.validateTransferRecipients(recipients)

    const correlationId = generateCorrelationId()
    const totalAmount = recipients.reduce((sum, r) => sum + this.toAtomicUnits(r.amount), 0)
    
    console.log(`[${correlationId}] Initiating transfer to ${recipients.length} recipients`)

    return await MneeErrorHandler.handleOperation(
      async () => {
        // Convert recipients to the format expected by SDK
        const sendMneeRequests: SendMNEE[] = recipients.map(recipient => ({
          address: recipient.address,
          amount: this.toAtomicUnits(recipient.amount)
        }))

        const response: TransferResponse = await withTimeout(
          this.sdk!.transfer(sendMneeRequests, privateKey),
          30000, // 30 second timeout for transfers
          'Transfer operation timed out'
        )

        const result: TransferResult = {
          ticketId: response.ticketId,
          transactionId: response.rawtx ? 'pending' : undefined,
          status: response.ticketId ? 'pending' : 'failed'
        }

        console.log(`[${correlationId}] Transfer initiated with ticket ID: ${result.ticketId}`)
        return result
      },
      {
        operation: 'transfer',
        correlationId,
        amount: totalAmount
      },
      this.getRetryConfig(),
      {
        enableRetry: true,
        maxRetries: 2, // Fewer retries for transfers to avoid double-spending
        fallbackToCache: false,
        notifyUser: true,
        logError: true
      }
    )
  }

  /**
   * Validate transfer before execution with comprehensive checks
   */
  async validateTransfer(recipients: TransferRecipient[], _privateKey: string): Promise<boolean> {
    this.ensureInitialized()
    
    try {
      // Basic validation
      this.validatePrivateKey(_privateKey)
      this.validateTransferRecipients(recipients)

      // Enhanced validation: check if sender has sufficient balance
      const senderAddress = this.deriveAddressFromPrivateKey(_privateKey)
      const senderBalance = await this.getBalance(senderAddress)
      
      const totalTransferAmount = recipients.reduce((sum, recipient) => {
        return sum + this.toAtomicUnits(recipient.amount)
      }, 0)

      // Estimate fees for the transfer
      const estimatedFee = await this.estimateTransferFee(recipients)
      const totalRequired = totalTransferAmount + estimatedFee

      if (senderBalance.amount < totalRequired) {
        throw new MneeValidationError(
          `Insufficient balance. Required: ${this.formatMneeAmount(totalRequired)}, Available: ${this.formatMneeAmount(senderBalance.amount)}`
        )
      }

      // Validate each recipient address format
      for (const recipient of recipients) {
        if (!this.isValidRecipientAddress(recipient.address)) {
          throw new MneeValidationError(`Invalid recipient address: ${recipient.address}`)
        }
      }

      // Check for duplicate recipients
      const uniqueAddresses = new Set(recipients.map(r => r.address.toLowerCase()))
      if (uniqueAddresses.size !== recipients.length) {
        throw new MneeValidationError('Duplicate recipient addresses are not allowed')
      }

      // Validate against rate limits
      await this.validateTransferRateLimit(senderAddress, recipients.length)

      return true
    } catch (error) {
      console.error('Transfer validation failed:', error)
      return false
    }
  }

  /**
   * Enhanced transaction status tracking with retry logic
   */
  async getTransactionStatusWithRetry(ticketId: string, maxRetries = 3): Promise<TransactionStatus> {
    this.ensureInitialized()
    
    if (!ticketId) {
      throw new MneeValidationError('Ticket ID is required')
    }

    const correlationId = generateCorrelationId()
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[${correlationId}] Checking transaction status (attempt ${attempt}/${maxRetries}): ${ticketId}`)
        
        const status = await this.getTransactionStatus(ticketId)
        
        // Cache the status for future reference
        await this.cacheTransactionStatus(ticketId, status)
        
        return status
      } catch (error) {
        lastError = error as Error
        console.warn(`[${correlationId}] Transaction status check failed (attempt ${attempt}/${maxRetries}):`, error)
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // If all retries failed, try to get cached status
    const cachedStatus = await this.getCachedTransactionStatus(ticketId)
    if (cachedStatus) {
      console.warn(`[${correlationId}] Using cached transaction status for ${ticketId}`)
      return cachedStatus
    }

    throw new MneeNetworkError(
      `Failed to get transaction status after ${maxRetries} attempts: ${lastError?.message}`,
      lastError
    )
  }

  /**
   * Batch transaction status checking
   */
  async getBatchTransactionStatus(ticketIds: string[]): Promise<Map<string, TransactionStatus>> {
    this.ensureInitialized()
    
    const results = new Map<string, TransactionStatus>()
    const correlationId = generateCorrelationId()
    
    console.log(`[${correlationId}] Checking batch transaction status for ${ticketIds.length} tickets`)

    // Process in batches to avoid overwhelming the API
    const batchSize = 5
    for (let i = 0; i < ticketIds.length; i += batchSize) {
      const batch = ticketIds.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (ticketId) => {
        try {
          const status = await this.getTransactionStatusWithRetry(ticketId, 2)
          results.set(ticketId, status)
        } catch (error) {
          console.error(`[${correlationId}] Failed to get status for ticket ${ticketId}:`, error)
          // Set a failed status for tracking
          results.set(ticketId, {
            ticketId,
            status: 'failed',
            confirmations: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now()
          })
        }
      })

      await Promise.all(batchPromises)
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < ticketIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    console.log(`[${correlationId}] Batch status check completed: ${results.size} results`)
    return results
  }

  /**
   * Get transaction status by ticket ID with enhanced error handling
   */
  async getTransactionStatus(ticketId: string): Promise<TransactionStatus> {
    this.ensureInitialized()
    
    if (!ticketId) {
      throw new MneeValidationError('Ticket ID is required')
    }

    const correlationId = generateCorrelationId()

    return await MneeErrorHandler.handleOperation(
      async () => {
        console.log(`[${correlationId}] Checking status for ticket: ${ticketId}`)
        
        const response: TransferStatus = await withTimeout(
          this.sdk!.getTxStatus(ticketId),
          10000,
          'Transaction status query timed out'
        )

        // Map SDK status to our status format
        let status: 'pending' | 'confirmed' | 'failed' = 'pending'
        if (response.status === 'SUCCESS' || response.status === 'MINED') {
          status = 'confirmed'
        } else if (response.status === 'FAILED') {
          status = 'failed'
        }

        return {
          ticketId,
          status,
          confirmations: response.status === 'MINED' ? 1 : 0,
          timestamp: new Date(response.createdAt).getTime(),
          error: response.errors || undefined
        }
      },
      {
        operation: 'getTransactionStatus',
        correlationId,
        ticketId
      },
      this.getRetryConfig(),
      {
        enableRetry: true,
        fallbackToCache: false,
        notifyUser: false,
        logError: true
      }
    )
  }

  /**
   * Get transaction history for an address
   */
  async getTransactionHistory(address: string, options: HistoryOptions = {}): Promise<TransactionHistory[]> {
    this.ensureInitialized()
    this.validateAddress(address)

    const correlationId = generateCorrelationId()

    try {
      return await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(async () => {
          console.log(`[${correlationId}] Fetching transaction history for: ${address}`)
          
          const response = await withTimeout(
            this.sdk!.recentTxHistory(
              address, 
              options.startDate ? Math.floor(options.startDate.getTime() / 1000) : undefined,
              options.limit || 50
            ),
            15000,
            'Transaction history query timed out'
          )

          // Map the response to our format
          return response.history?.map(tx => ({
            id: tx.txid,
            from: tx.type === 'send' ? address : tx.counterparties[0]?.address || '',
            to: tx.type === 'receive' ? address : tx.counterparties[0]?.address || '',
            amount: tx.amount,
            timestamp: Date.now(), // SDK doesn't provide timestamp, use current time
            status: tx.status === 'confirmed' ? 'confirmed' : 'pending',
            ticketId: undefined // Not available in history response
          })) || []
        }, this.getRetryConfig())
      })
    } catch (error) {
      console.error(`[${correlationId}] Transaction history query failed:`, error)
      throw new MneeNetworkError(
        `Failed to get transaction history: ${formatErrorMessage(error)}`,
        { address, options, correlationId, originalError: error }
      )
    }
  }

  /**
   * Convert MNEE tokens to atomic units
   */
  toAtomicUnits(mneeAmount: number): number {
    if (typeof mneeAmount !== 'number' || isNaN(mneeAmount)) {
      throw new MneeValidationError(`Invalid MNEE amount: ${mneeAmount}`)
    }
    return Math.floor(mneeAmount * MNEE_TOKEN_CONFIG.atomicUnitsPerToken)
  }

  /**
   * Convert atomic units to MNEE tokens
   */
  fromAtomicUnits(atomicAmount: number): number {
    if (typeof atomicAmount !== 'number' || isNaN(atomicAmount)) {
      throw new MneeValidationError(`Invalid atomic amount: ${atomicAmount}`)
    }
    return atomicAmount / MNEE_TOKEN_CONFIG.atomicUnitsPerToken
  }

  /**
   * Format atomic units as MNEE token string
   */
  formatMneeAmount(atomicAmount: number, options: FormatOptions = {}): string {
    const { includeSymbol = true, decimals = MNEE_TOKEN_CONFIG.decimals } = options
    const mneeAmount = this.fromAtomicUnits(atomicAmount)
    const formatted = mneeAmount.toFixed(decimals)
    return includeSymbol ? `${formatted} ${MNEE_TOKEN_CONFIG.symbol}` : formatted
  }

  // Private helper methods

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.sdk || !this.config) {
      throw new MneeConfigurationError('MNEE service is not initialized')
    }
  }

  private validateConfig(config: MneeConfig): void {
    if (!config.apiKey) {
      throw new MneeConfigurationError('API key is required')
    }

    const validEnvironments: Environment[] = ['production', 'sandbox']
    if (!validEnvironments.includes(config.environment)) {
      throw new MneeConfigurationError(
        `Invalid environment: ${config.environment}. Must be one of: ${validEnvironments.join(', ')}`
      )
    }
  }

  private validateAddress(address: string): void {
    if (!address) {
      throw new MneeValidationError('Address is required')
    }
    if (!isValidEvmAddress(address)) {
      throw new MneeValidationError(`Invalid EVM address format: ${address}`)
    }
  }

  private validatePrivateKey(privateKey: string): void {
    if (!privateKey) {
      throw new MneeValidationError('Private key is required')
    }
    if (!isValidPrivateKey(privateKey)) {
      throw new MneeValidationError('Invalid private key format')
    }
  }

  private validateTransferRecipients(recipients: TransferRecipient[]): void {
    if (!recipients || recipients.length === 0) {
      throw new MneeValidationError('At least one recipient is required')
    }

    recipients.forEach((recipient, index) => {
      if (!recipient.address) {
        throw new MneeValidationError(`Recipient ${index + 1}: address is required`)
      }
      this.validateAddress(recipient.address)

      if (typeof recipient.amount !== 'number' || recipient.amount <= 0) {
        throw new MneeValidationError(`Recipient ${index + 1}: invalid amount`)
      }

      const atomicAmount = this.toAtomicUnits(recipient.amount)
      if (atomicAmount < MNEE_FEE_CONFIG.minTransferAmount) {
        throw new MneeValidationError(
          `Recipient ${index + 1}: amount too small. Minimum: ${this.formatMneeAmount(MNEE_FEE_CONFIG.minTransferAmount)}`
        )
      }
      if (atomicAmount > MNEE_FEE_CONFIG.maxTransferAmount) {
        throw new MneeValidationError(
          `Recipient ${index + 1}: amount too large. Maximum: ${this.formatMneeAmount(MNEE_FEE_CONFIG.maxTransferAmount)}`
        )
      }
    })
  }

  /**
   * Derive EVM address from private key
   */
  private deriveAddressFromPrivateKey(_privateKey: string): string {
    // This is a placeholder - in a real implementation, you would use
    // the MNEE SDK or a crypto library to derive the address
    // For now, we'll throw an error to indicate this needs implementation
    throw new MneeValidationError('Address derivation from private key not yet implemented')
  }

  /**
   * Estimate transfer fee for recipients
   */
  private async estimateTransferFee(recipients: TransferRecipient[]): Promise<number> {
    // This is a placeholder - in a real implementation, you would use
    // the MNEE SDK to estimate fees based on current network conditions
    // For now, return a basic fee calculation
    const baseFeePer = 1000 // 0.01 MNEE in atomic units (fallback value)
    return baseFeePer * recipients.length
  }

  /**
   * Validate recipient address format
   */
  private isValidRecipientAddress(address: string): boolean {
    // Use the existing address validation
    try {
      this.validateAddress(address)
      return true
    } catch {
      return false
    }
  }

  /**
   * Validate transfer rate limits
   */
  private async validateTransferRateLimit(_senderAddress: string, recipientCount: number): Promise<void> {
    // This is a placeholder for rate limiting logic
    // In a real implementation, you would check against rate limits
    // based on sender address and recent transaction history
    
    const maxRecipientsPerTransfer = 10
    if (recipientCount > maxRecipientsPerTransfer) {
      throw new MneeValidationError(`Too many recipients. Maximum: ${maxRecipientsPerTransfer}`)
    }
  }

  /**
   * Cache transaction status for future reference
   */
  private async cacheTransactionStatus(ticketId: string, status: TransactionStatus): Promise<void> {
    try {
      // Store in localStorage with expiration
      const cacheKey = `mnee_tx_status_${ticketId}`
      const cacheData = {
        status,
        timestamp: Date.now(),
        expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Failed to cache transaction status:', error)
    }
  }

  /**
   * Get cached transaction status
   */
  private async getCachedTransactionStatus(ticketId: string): Promise<TransactionStatus | null> {
    try {
      const cacheKey = `mnee_tx_status_${ticketId}`
      const cached = localStorage.getItem(cacheKey)
      
      if (!cached) return null
      
      const cacheData = JSON.parse(cached)
      
      // Check if cache is expired
      if (Date.now() > cacheData.expiresAt) {
        localStorage.removeItem(cacheKey)
        return null
      }
      
      return cacheData.status
    } catch (error) {
      console.warn('Failed to get cached transaction status:', error)
      return null
    }
  }

  private getRetryConfig(): RetryConfig {
    return {
      maxAttempts: this.config?.retryAttempts || this.defaultRetryConfig.maxAttempts,
      baseDelay: this.config?.retryDelay || this.defaultRetryConfig.baseDelay,
      maxDelay: this.defaultRetryConfig.maxDelay,
      backoffMultiplier: this.defaultRetryConfig.backoffMultiplier
    }
  }

  /**
   * Get the balance subscription service instance
   */
  getBalanceSubscriptionService() {
    return getBalanceSubscriptionService(this)
  }

  /**
   * Get the database consistency service instance
   */
  getDatabaseConsistencyService() {
    return DatabaseConsistencyService
  }

  /**
   * Perform balance reconciliation for a user
   */
  async reconcileUserBalance(userId: string, address: string): Promise<any> {
    return await DatabaseConsistencyService.reconcileBalance(userId, address, this)
  }

  /**
   * Rollback a failed transaction
   */
  async rollbackTransaction(transactionId: string, reason: string): Promise<any> {
    return await DatabaseConsistencyService.rollbackTransaction(transactionId, reason)
  }

  /**
   * Log audit entry for MNEE operations
   */
  async logAuditEntry(entry: any): Promise<void> {
    return await DatabaseConsistencyService.logAuditEntry(entry)
  }
}