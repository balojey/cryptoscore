import type { MneeBalance, TransferRecipient, TransferResult, FormatOptions } from '@/lib/mnee/types'
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import { MneeService } from '@/lib/mnee/mnee-service'
import { MNEE_SDK_CONFIG, MNEE_UNITS } from '@/config/mnee'
import { useUnifiedWallet } from './UnifiedWalletContext'

export interface MneeContextType {
  // Balance State
  balance: number | null // atomic units
  decimalBalance: number | null // MNEE tokens
  isLoadingBalance: boolean
  balanceError: string | null
  
  // Configuration
  isInitialized: boolean
  
  // Operations
  refreshBalance(): Promise<void>
  transfer(recipients: TransferRecipient[]): Promise<TransferResult>
  
  // Formatting
  formatAmount(atomicAmount: number, options?: FormatOptions): string
  parseAmount(mneeAmount: string): number
  toAtomicUnits(mneeAmount: number): number
  fromAtomicUnits(atomicAmount: number): number
  
  // Error Handling
  clearErrors(): void
}

const MneeContext = createContext<MneeContextType | undefined>(undefined)

export function MneeProvider({ children }: { children: React.ReactNode }) {
  const { evmAddress, privateKey } = useUnifiedWallet()
  const [mneeService] = useState(() => new MneeService())
  
  // State
  const [balance, setBalance] = useState<number | null>(null)
  const [decimalBalance, setDecimalBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  /**
   * Initialize MNEE service
   */
  const initializeService = useCallback(async () => {
    try {
      await mneeService.initialize(MNEE_SDK_CONFIG)
      setIsInitialized(true)
      console.log('MNEE service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize MNEE service:', error)
      setBalanceError(error instanceof Error ? error.message : 'Failed to initialize MNEE service')
    }
  }, [mneeService])

  /**
   * Fetch balance for current user
   */
  const refreshBalance = useCallback(async () => {
    if (!isInitialized || !evmAddress) {
      return
    }

    setIsLoadingBalance(true)
    setBalanceError(null)

    try {
      const balanceData = await mneeService.getBalance(evmAddress)
      setBalance(balanceData.amount)
      setDecimalBalance(balanceData.decimalAmount)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch balance'
      setBalanceError(errorMessage)
      console.error('Balance fetch error:', error)
    } finally {
      setIsLoadingBalance(false)
    }
  }, [mneeService, isInitialized, evmAddress])

  /**
   * Transfer MNEE tokens
   */
  const transfer = useCallback(async (recipients: TransferRecipient[]): Promise<TransferResult> => {
    if (!isInitialized || !privateKey) {
      throw new Error('MNEE service not initialized or no private key available')
    }

    try {
      const result = await mneeService.transfer(recipients, privateKey)
      
      // Refresh balance after successful transfer
      if (result.status === 'pending' || result.status === 'success') {
        // Wait a moment then refresh balance
        setTimeout(() => {
          refreshBalance()
        }, 2000)
      }
      
      return result
    } catch (error) {
      console.error('Transfer error:', error)
      throw error
    }
  }, [mneeService, isInitialized, privateKey, refreshBalance])

  /**
   * Format atomic units as MNEE token string
   */
  const formatAmount = useCallback((atomicAmount: number, options?: FormatOptions): string => {
    return MNEE_UNITS.formatMneeAmount(atomicAmount, options)
  }, [])

  /**
   * Parse MNEE amount string to atomic units
   */
  const parseAmount = useCallback((mneeAmount: string): number => {
    return MNEE_UNITS.parseMneeAmount(mneeAmount)
  }, [])

  /**
   * Convert MNEE tokens to atomic units
   */
  const toAtomicUnits = useCallback((mneeAmount: number): number => {
    return MNEE_UNITS.toAtomicUnits(mneeAmount)
  }, [])

  /**
   * Convert atomic units to MNEE tokens
   */
  const fromAtomicUnits = useCallback((atomicAmount: number): number => {
    return MNEE_UNITS.fromAtomicUnits(atomicAmount)
  }, [])

  /**
   * Clear error states
   */
  const clearErrors = useCallback(() => {
    setBalanceError(null)
  }, [])

  /**
   * Initialize service on mount
   */
  useEffect(() => {
    initializeService()
  }, [initializeService])

  /**
   * Fetch balance when service is initialized and user has an address
   */
  useEffect(() => {
    if (isInitialized && evmAddress) {
      refreshBalance()
    }
  }, [isInitialized, evmAddress, refreshBalance])

  /**
   * Set up balance subscription when user has an address
   */
  useEffect(() => {
    if (!isInitialized || !evmAddress) {
      return
    }

    const unsubscribe = mneeService.subscribeToBalance(evmAddress, (balanceData) => {
      setBalance(balanceData.amount)
      setDecimalBalance(balanceData.decimalAmount)
    })

    return unsubscribe
  }, [mneeService, isInitialized, evmAddress])

  /**
   * Clear localStorage cache from old currency system
   */
  useEffect(() => {
    // Clean up old currency system localStorage entries
    try {
      localStorage.removeItem('cryptoscore-exchange-rates')
      localStorage.removeItem('cryptoscore-currency')
    } catch (error) {
      console.warn('Failed to clear old currency cache:', error)
    }
  }, [])

  const value = useMemo(
    () => ({
      balance,
      decimalBalance,
      isLoadingBalance,
      balanceError,
      isInitialized,
      refreshBalance,
      transfer,
      formatAmount,
      parseAmount,
      toAtomicUnits,
      fromAtomicUnits,
      clearErrors,
    }),
    [
      balance,
      decimalBalance,
      isLoadingBalance,
      balanceError,
      isInitialized,
      refreshBalance,
      transfer,
      formatAmount,
      parseAmount,
      toAtomicUnits,
      fromAtomicUnits,
      clearErrors,
    ],
  )

  return <MneeContext value={value}>{children}</MneeContext>
}

export function useMnee() {
  const context = use(MneeContext)
  if (context === undefined) {
    throw new Error('useMnee must be used within a MneeProvider')
  }
  return context
}