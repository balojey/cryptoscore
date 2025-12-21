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
import {
  retryWithBackoff,
  isValidEvmAddress,
  isValidPrivateKey,
  formatErrorMessage,
  withTimeout,
  batchArray,
  generateCorrelationId
} from './utils'
import { MNEE_TOKEN_CONFIG, MNEE_FEE_CONFIG } from '../../config/mnee'

export class MneeService implements MneeServiceInterface {
  private sdk: Mnee | null = null
  private config: MneeConfig | null = null
  private circuitBreaker: MneeCircuitBreaker
  private balanceSubscriptions = new Map<string, Set<BalanceCallback>>()
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
   * Get balance for a single address
   */
  async getBalance(address: string): Promise<MneeBalance> {
    this.ensureInitialized()
    this.validateAddress(address)

    const correlationId = generateCorrelationId()
    
    try {
      return await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(async () => {
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
        }, this.getRetryConfig())
      })
    } catch (error) {
      console.error(`[${correlationId}] Balance query failed:`, error)
      throw new MneeNetworkError(
        `Failed to get balance for address ${address}: ${formatErrorMessage(error)}`,
        { address, correlationId, originalError: error }
      )
    }
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
  subscribeToBalance(address: string, callback: BalanceCallback): () => void {
    this.validateAddress(address)

    if (!this.balanceSubscriptions.has(address)) {
      this.balanceSubscriptions.set(address, new Set())
    }

    const callbacks = this.balanceSubscriptions.get(address)!
    callbacks.add(callback)

    // Start polling for this address if it's the first subscription
    if (callbacks.size === 1) {
      this.startBalancePolling(address)
    }

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.balanceSubscriptions.delete(address)
        // Stop polling when no more subscribers
      }
    }
  }

  /**
   * Transfer MNEE tokens to recipients
   */
  async transfer(recipients: TransferRecipient[], privateKey: string): Promise<TransferResult> {
    this.ensureInitialized()
    this.validatePrivateKey(privateKey)
    this.validateTransferRecipients(recipients)

    const correlationId = generateCorrelationId()
    console.log(`[${correlationId}] Initiating transfer to ${recipients.length} recipients`)

    try {
      return await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(async () => {
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
        }, this.getRetryConfig())
      })
    } catch (error) {
      console.error(`[${correlationId}] Transfer failed:`, error)
      
      throw new MneeNetworkError(
        `Transfer failed: ${formatErrorMessage(error)}`,
        { recipients, correlationId, originalError: error }
      )
    }
  }

  /**
   * Validate transfer before execution
   */
  async validateTransfer(recipients: TransferRecipient[], privateKey: string): Promise<boolean> {
    this.ensureInitialized()
    
    try {
      this.validatePrivateKey(privateKey)
      this.validateTransferRecipients(recipients)

      // Additional validation: check if sender has sufficient balance
      // This would require deriving the sender address from private key
      // For now, we'll do basic validation
      
      return true
    } catch (error) {
      console.error('Transfer validation failed:', error)
      return false
    }
  }

  /**
   * Get transaction status by ticket ID
   */
  async getTransactionStatus(ticketId: string): Promise<TransactionStatus> {
    this.ensureInitialized()
    
    if (!ticketId) {
      throw new MneeValidationError('Ticket ID is required')
    }

    const correlationId = generateCorrelationId()

    try {
      return await this.circuitBreaker.execute(async () => {
        return await retryWithBackoff(async () => {
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
        }, this.getRetryConfig())
      })
    } catch (error) {
      console.error(`[${correlationId}] Transaction status query failed:`, error)
      throw new MneeNetworkError(
        `Failed to get transaction status: ${formatErrorMessage(error)}`,
        { ticketId, correlationId, originalError: error }
      )
    }
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

  private getRetryConfig(): RetryConfig {
    return {
      maxAttempts: this.config?.retryAttempts || this.defaultRetryConfig.maxAttempts,
      baseDelay: this.config?.retryDelay || this.defaultRetryConfig.baseDelay,
      maxDelay: this.defaultRetryConfig.maxDelay,
      backoffMultiplier: this.defaultRetryConfig.backoffMultiplier
    }
  }

  private startBalancePolling(address: string): void {
    // Simple polling implementation - in production, you might want WebSocket subscriptions
    const pollInterval = 30000 // 30 seconds
    
    const poll = async () => {
      try {
        const balance = await this.getBalance(address)
        const callbacks = this.balanceSubscriptions.get(address)
        if (callbacks) {
          callbacks.forEach(callback => {
            try {
              callback(balance)
            } catch (error) {
              console.error('Balance callback error:', error)
            }
          })
        }
      } catch (error) {
        console.error(`Balance polling error for ${address}:`, error)
      }

      // Continue polling if there are still subscribers
      if (this.balanceSubscriptions.has(address)) {
        setTimeout(poll, pollInterval)
      }
    }

    // Start polling after a short delay
    setTimeout(poll, 1000)
  }
}