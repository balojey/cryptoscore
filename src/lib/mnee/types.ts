// MNEE service types and interfaces

import type { Environment } from '@mnee/ts-sdk'

export interface MneeBalance {
  address: string
  amount: number // atomic units
  decimalAmount: number // MNEE tokens
  lastUpdated: number
}

export interface TransferRecipient {
  address: string
  amount: number // MNEE tokens
}

export interface TransferResult {
  ticketId?: string
  transactionId?: string
  status: 'pending' | 'success' | 'failed'
  error?: string
}

export interface MneeConfiguration {
  environment: Environment
  apiKey: string
  feeAddress: string
  fees: FeeTier[]
}

export interface FeeTier {
  min: number // atomic units
  max: number // atomic units
  fee: number // atomic units
}

export interface FormatOptions {
  includeSymbol?: boolean
  decimals?: number
}

export interface HistoryOptions {
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}

export interface TransactionHistory {
  id: string
  from: string
  to: string
  amount: number // atomic units
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  ticketId?: string
}

export interface TransactionStatus {
  ticketId: string
  status: 'pending' | 'confirmed' | 'failed'
  confirmations: number
  timestamp: number
  error?: string
}

export type BalanceCallback = (balance: MneeBalance) => void

export interface MneeServiceInterface {
  // Configuration
  initialize(config: MneeConfig): Promise<void>
  getConfig(): Promise<MneeConfiguration>
  
  // Balance Operations
  getBalance(address: string): Promise<MneeBalance>
  getBalances(addresses: string[]): Promise<MneeBalance[]>
  subscribeToBalance(address: string, callback: BalanceCallback): () => void
  
  // Transfer Operations
  transfer(recipients: TransferRecipient[], privateKey: string): Promise<TransferResult>
  validateTransfer(recipients: TransferRecipient[], privateKey: string): Promise<boolean>
  
  // Transaction Management
  getTransactionStatus(ticketId: string): Promise<TransactionStatus>
  getTransactionHistory(address: string, options?: HistoryOptions): Promise<TransactionHistory[]>
  
  // Unit Conversion
  toAtomicUnits(mneeAmount: number): number
  fromAtomicUnits(atomicAmount: number): number
  formatMneeAmount(atomicAmount: number, options?: FormatOptions): string
}

export interface MneeConfig {
  apiKey: string
  environment: Environment
  feeAddress?: string
  retryAttempts?: number
  retryDelay?: number
  circuitBreakerThreshold?: number
  circuitBreakerTimeout?: number
}

export interface RetryConfig {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  timeout: number
  monitoringPeriod: number
}

export class MneeError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'MneeError'
  }
}

export class MneeNetworkError extends MneeError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details)
    this.name = 'MneeNetworkError'
  }
}

export class MneeValidationError extends MneeError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'MneeValidationError'
  }
}

export class MneeConfigurationError extends MneeError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details)
    this.name = 'MneeConfigurationError'
  }
}