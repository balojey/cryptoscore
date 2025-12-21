// MNEE-specific type definitions
// Types for MNEE token operations and SDK integration

// Re-export SDK types for convenience
export type { 
  MNEEConfig, 
  Environment,
  SendMNEE,
  TransferResponse,
  TransferStatus,
  MNEEBalance,
  SdkConfig
} from '@mnee/ts-sdk'

// Import types for use in interfaces
import type { MNEEConfig, MNEEBalance, TransferResponse, TransferStatus } from '@mnee/ts-sdk'

// Application-specific MNEE types
export interface MneeBalance {
  address: string
  amount: number // atomic units
  decimalAmount: number // MNEE tokens
  lastUpdated: number
  isStale?: boolean
}

export interface MneeTransferRequest {
  recipients: MneeTransferRecipient[]
  privateKey: string
  metadata?: Record<string, any>
}

export interface MneeTransferRecipient {
  address: string
  amount: number // MNEE tokens (will be converted to atomic units)
  note?: string
}

export interface MneeTransferResult {
  ticketId?: string
  transactionId?: string
  status: 'pending' | 'success' | 'failed'
  error?: string
  timestamp: number
  recipients: MneeTransferRecipient[]
}

export interface MneeConfiguration {
  environment: 'production' | 'sandbox'
  apiKey: string
  platformFeeAddress: string
  fees: MneeFeeTier[]
}

export interface MneeFeeTier {
  min: number // atomic units
  max: number // atomic units
  fee: number // atomic units
}

export interface MneeTransactionHistory {
  id: string
  type: 'incoming' | 'outgoing'
  amount: number // atomic units
  address: string // counterparty address
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
  transactionId?: string
  ticketId?: string
  note?: string
}

export interface MneeFormatOptions {
  includeSymbol?: boolean
  decimals?: number
  prefix?: string
  suffix?: string
}

export interface MneeValidationResult {
  isValid: boolean
  error?: string
  warnings?: string[]
}

// Service interfaces
export interface MneeServiceInterface {
  // Configuration
  initialize(config: MneeConfiguration): Promise<void>
  getConfig(): Promise<MNEEConfig>
  isInitialized(): boolean
  
  // Balance Operations
  getBalance(address: string): Promise<MNEEBalance>
  getBalances(addresses: string[]): Promise<MNEEBalance[]>
  subscribeToBalance(address: string, callback: BalanceCallback): () => void
  refreshBalance(address: string): Promise<MNEEBalance>
  
  // Transfer Operations
  transfer(request: MneeTransferRequest): Promise<TransferResponse>
  validateTransfer(request: MneeTransferRequest): Promise<MneeValidationResult>
  estimateTransferFee(recipients: MneeTransferRecipient[]): Promise<number>
  
  // Transaction Management
  getTransactionStatus(ticketId: string): Promise<TransferStatus>
  getTransactionHistory(address: string, options?: HistoryOptions): Promise<MneeTransactionHistory[]>
  
  // Unit Conversion
  toAtomicUnits(mneeAmount: number): number
  fromAtomicUnits(atomicAmount: number): number
  formatMneeAmount(atomicAmount: number, options?: MneeFormatOptions): string
  parseMneeAmount(mneeAmountString: string): number
  
  // Validation
  validateAmount(atomicAmount: number): MneeValidationResult
  validateAddress(address: string): MneeValidationResult
}

// Context types
export interface MneeContextType {
  // Balance State
  balance: number | null // atomic units
  balanceDecimal: number | null // MNEE tokens
  isLoadingBalance: boolean
  balanceError: string | null
  
  // Configuration
  isInitialized: boolean
  config: MNEEConfig | null
  environment: 'production' | 'sandbox'
  
  // Operations
  refreshBalance(): Promise<void>
  transfer(recipients: MneeTransferRecipient[]): Promise<TransferResponse>
  
  // Formatting
  formatAmount(atomicAmount: number, options?: MneeFormatOptions): string
  parseAmount(mneeAmount: string): number
  
  // Validation
  validateAmount(atomicAmount: number): MneeValidationResult
  validateTransfer(recipients: MneeTransferRecipient[]): MneeValidationResult
  
  // Error Handling
  clearErrors(): void
}

// Callback types
export type BalanceCallback = (balance: MNEEBalance) => void
export type TransferCallback = (result: TransferResponse) => void
export type ErrorCallback = (error: Error) => void

// History options
export interface HistoryOptions {
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
  type?: 'incoming' | 'outgoing'
}

// Error types
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

export class MneeConfigurationError extends MneeError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details)
    this.name = 'MneeConfigurationError'
  }
}

export class MneeTransferError extends MneeError {
  constructor(message: string, details?: any) {
    super(message, 'TRANSFER_ERROR', details)
    this.name = 'MneeTransferError'
  }
}

export class MneeBalanceError extends MneeError {
  constructor(message: string, details?: any) {
    super(message, 'BALANCE_ERROR', details)
    this.name = 'MneeBalanceError'
  }
}

// Constants
export const MNEE_CONSTANTS = {
  ATOMIC_UNITS_PER_TOKEN: 100000,
  DEFAULT_DECIMALS: 5,
  SYMBOL: 'MNEE',
  MIN_TRANSFER_AMOUNT: 1000, // 0.01 MNEE in atomic units
  MAX_TRANSFER_AMOUNT: 100000000000, // 1,000,000 MNEE in atomic units
} as const

// Type guards
export function isMneeBalance(obj: any): obj is MneeBalance {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.address === 'string' &&
    typeof obj.amount === 'number' &&
    typeof obj.decimalAmount === 'number' &&
    typeof obj.lastUpdated === 'number'
  )
}

export function isMneeTransferResult(obj: any): obj is MneeTransferResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.status === 'string' &&
    ['pending', 'success', 'failed'].includes(obj.status) &&
    typeof obj.timestamp === 'number' &&
    Array.isArray(obj.recipients)
  )
}