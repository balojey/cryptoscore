import type { TransferRecipient, TransferResult, FormatOptions, BalanceSubscriptionOptions } from '@/lib/mnee/types'
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import { MneeService } from '@/lib/mnee/mnee-service'
import { MneeErrorHandler } from '@/lib/mnee/error-handler'
import type { UserFriendlyError } from '@/lib/mnee/error-handler'
import { getNotificationService } from '@/lib/mnee/notification-service'
import { MNEE_SDK_CONFIG, MNEE_UNITS } from '@/config/mnee'
import { useUnifiedWallet } from './UnifiedWalletContext'
import { UserService } from '@/lib/supabase/user-service'
import type { Database } from '@/types/supabase'
import { toast } from 'sonner'

type User = Database['public']['Tables']['users']['Row']

export interface MneeContextType {
  // Balance State
  balance: number | null // atomic units
  decimalBalance: number | null // MNEE tokens
  isLoadingBalance: boolean
  balanceError: string | null
  
  // User State
  supabaseUser: User | null
  isLoadingUser: boolean
  
  // Configuration
  isInitialized: boolean
  
  // Real-time Updates
  isSubscribedToBalance: boolean
  subscriptionError: string | null
  
  // Error Handling
  lastError: UserFriendlyError | null
  errorHistory: UserFriendlyError[]
  
  // Operations
  refreshBalance(): Promise<void>
  transfer(recipients: TransferRecipient[]): Promise<TransferResult>
  
  // Subscription Management
  enableBalanceSubscription(options?: BalanceSubscriptionOptions): void
  disableBalanceSubscription(): void
  
  // Formatting
  formatAmount(atomicAmount: number, options?: FormatOptions): string
  parseAmount(mneeAmount: string): number
  toAtomicUnits(mneeAmount: number): number
  fromAtomicUnits(atomicAmount: number): number
  
  // Error Handling
  clearErrors(): void
  retryLastOperation(): Promise<void>
  getErrorStats(): any
}

const MneeContext = createContext<MneeContextType | undefined>(undefined)

export function MneeProvider({ children }: { children: React.ReactNode }) {
  const { walletAddress } = useUnifiedWallet()
  const [mneeService] = useState(() => new MneeService())
  const [notificationService] = useState(() => getNotificationService({
    enableToasts: true,
    enableBrowserNotifications: false, // Start with toasts only
    minAmountForNotification: MNEE_UNITS.toAtomicUnits(0.01)
  }))
  
  // State
  const [balance, setBalance] = useState<number | null>(null)
  const [decimalBalance, setDecimalBalance] = useState<number | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSubscribedToBalance, setIsSubscribedToBalance] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null)
  
  // Enhanced error handling state
  const [lastError, setLastError] = useState<UserFriendlyError | null>(null)
  const [errorHistory, setErrorHistory] = useState<UserFriendlyError[]>([])
  const [lastFailedOperation, setLastFailedOperation] = useState<(() => Promise<any>) | null>(null)
  
  // Supabase user state
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  
  // Subscription management
  const [balanceUnsubscribe, setBalanceUnsubscribe] = useState<(() => void) | null>(null)
  const [notificationUnsubscribe, setNotificationUnsubscribe] = useState<(() => void) | null>(null)

  /**
   * Fetch Supabase user by wallet address
   */
  const fetchSupabaseUser = useCallback(async () => {
    if (!walletAddress) {
      setSupabaseUser(null)
      return
    }

    setIsLoadingUser(true)
    try {
      const user = await UserService.getUserByWalletAddress(walletAddress)
      setSupabaseUser(user)
    } catch (error) {
      console.error('Failed to fetch Supabase user:', error)
      setSupabaseUser(null)
    } finally {
      setIsLoadingUser(false)
    }
  }, [walletAddress])

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
   * Handle errors with user-friendly messages
   */
  const handleError = useCallback((error: unknown, operation: string) => {
    const userFriendlyError = MneeErrorHandler.getUserFriendlyError(error, { operation })
    
    setLastError(userFriendlyError)
    setErrorHistory(prev => [userFriendlyError, ...prev].slice(0, 10)) // Keep last 10 errors
    
    // Show toast notification for user
    if (userFriendlyError.severity === 'high') {
      toast.error(userFriendlyError.title, {
        description: userFriendlyError.message,
        action: userFriendlyError.canRetry ? {
          label: 'Retry',
          onClick: () => retryLastOperation()
        } : undefined
      })
    } else if (userFriendlyError.severity === 'medium') {
      toast.warning(userFriendlyError.title, {
        description: userFriendlyError.message
      })
    }
    
    return userFriendlyError
  }, [])

  /**
   * Fetch balance for current user with enhanced error handling
   */
  const refreshBalance = useCallback(async () => {
    if (!isInitialized || !walletAddress) {
      return
    }

    setIsLoadingBalance(true)
    setBalanceError(null)
    setLastError(null)

    const operation = async () => {
      try {
        const balanceData = await mneeService.getBalance(walletAddress)
        
        // Update state with optimistic updates
        setBalance(balanceData.amount)
        setDecimalBalance(balanceData.decimalAmount)
        
        // Update database cache if user is available
        if (supabaseUser?.id) {
          try {
            const { DatabaseService } = await import('@/lib/supabase/database-service')
            await DatabaseService.updateMneeBalanceCache(supabaseUser.id, walletAddress, balanceData.amount)
          } catch (cacheError) {
            console.warn('Failed to update balance cache:', cacheError)
          }
        }
      } catch (error) {
        const userError = handleError(error, 'refreshBalance')
        setBalanceError(userError.message)
        throw error
      } finally {
        setIsLoadingBalance(false)
      }
    }

    setLastFailedOperation(() => operation)
    await operation()
  }, [mneeService, isInitialized, walletAddress, supabaseUser?.id, handleError])

  /**
   * Transfer MNEE tokens with enhanced error handling and optimistic updates
   */
  const transfer = useCallback(async (recipients: TransferRecipient[]): Promise<TransferResult> => {
    if (!isInitialized) {
      throw new Error('MNEE service not initialized')
    }

    // For now, we'll need to get the private key from the wallet context
    // This is a placeholder - in production, you'd use proper key management
    const privateKey = 'placeholder-private-key' // TODO: Implement proper private key access
    
    // Calculate total transfer amount for optimistic update
    const totalAmount = recipients.reduce((sum, recipient) => 
      sum + MNEE_UNITS.toAtomicUnits(recipient.amount), 0
    )
    
    // Store original balance for rollback
    const originalBalance = balance
    const originalDecimalBalance = decimalBalance
    
    const operation = async () => {
      try {
        // Optimistic update - subtract transfer amount immediately
        if (balance !== null && decimalBalance !== null) {
          const newBalance = balance - totalAmount
          const newDecimalBalance = MNEE_UNITS.fromAtomicUnits(newBalance)
          setBalance(newBalance)
          setDecimalBalance(newDecimalBalance)
        }
        
        const result = await mneeService.transfer(recipients, privateKey)
        
        // If transfer failed, rollback optimistic update
        if (result.status === 'failed') {
          setBalance(originalBalance)
          setDecimalBalance(originalDecimalBalance)
          
          const error = new Error(result.error || 'Transfer failed')
          handleError(error, 'transfer')
        } else {
          // Show success notification
          toast.success('Transfer Initiated', {
            description: `Transfer of ${MNEE_UNITS.formatMneeAmount(totalAmount)} MNEE has been initiated`
          })
          
          // Refresh balance after successful transfer to get accurate amount
          setTimeout(() => {
            refreshBalance()
          }, 2000)
        }
        
        return result
      } catch (error) {
        // Rollback optimistic update on error
        setBalance(originalBalance)
        setDecimalBalance(originalDecimalBalance)
        
        handleError(error, 'transfer')
        throw error
      }
    }

    setLastFailedOperation(() => operation)
    return await operation()
  }, [mneeService, isInitialized, refreshBalance, balance, decimalBalance, handleError])

  /**
   * Enable real-time balance subscription with enhanced error handling
   */
  const enableBalanceSubscription = useCallback((options?: BalanceSubscriptionOptions) => {
    if (!isInitialized || !walletAddress || isSubscribedToBalance) {
      return
    }

    try {
      setSubscriptionError(null)
      setLastError(null)
      
      // Subscribe to balance changes
      const unsubscribeBalance = mneeService.subscribeToBalance(
        walletAddress,
        (balanceData) => {
          setBalance(balanceData.amount)
          setDecimalBalance(balanceData.decimalAmount)
          
          // Update database cache if user is available
          if (supabaseUser?.id) {
            import('@/lib/supabase/database-service').then(({ DatabaseService }) => {
              DatabaseService.updateMneeBalanceCache(supabaseUser.id, walletAddress, balanceData.amount)
                .catch(error => console.warn('Failed to update balance cache:', error))
            })
          }
        },
        {
          enablePolling: true,
          pollingInterval: 30000, // 30 seconds
          enableNotifications: true,
          ...options
        }
      )
      
      // Subscribe to balance notifications
      const subscriptionService = mneeService.getBalanceSubscriptionService()
      const unsubscribeNotifications = subscriptionService.subscribeToNotifications(
        (notification) => {
          notificationService.showBalanceNotification(notification)
        }
      )
      
      setBalanceUnsubscribe(() => unsubscribeBalance)
      setNotificationUnsubscribe(() => unsubscribeNotifications)
      setIsSubscribedToBalance(true)
      
      console.log('Balance subscription enabled for:', walletAddress)
    } catch (error) {
      const userError = handleError(error, 'enableBalanceSubscription')
      setSubscriptionError(userError.message)
    }
  }, [mneeService, isInitialized, walletAddress, isSubscribedToBalance, supabaseUser?.id, notificationService, handleError])

  /**
   * Disable real-time balance subscription
   */
  const disableBalanceSubscription = useCallback(() => {
    if (balanceUnsubscribe) {
      balanceUnsubscribe()
      setBalanceUnsubscribe(null)
    }
    
    if (notificationUnsubscribe) {
      notificationUnsubscribe()
      setNotificationUnsubscribe(null)
    }
    
    setIsSubscribedToBalance(false)
    setSubscriptionError(null)
    
    console.log('Balance subscription disabled')
  }, [balanceUnsubscribe, notificationUnsubscribe])
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
    setSubscriptionError(null)
    setLastError(null)
    setLastFailedOperation(null)
  }, [])

  /**
   * Retry the last failed operation
   */
  const retryLastOperation = useCallback(async () => {
    if (!lastFailedOperation) {
      console.warn('No failed operation to retry')
      return
    }

    try {
      await lastFailedOperation()
      setLastFailedOperation(null)
      setLastError(null)
      toast.success('Operation Successful', {
        description: 'The operation completed successfully'
      })
    } catch (error) {
      console.error('Retry failed:', error)
      // Error is already handled by the operation itself
    }
  }, [lastFailedOperation])

  /**
   * Get error statistics from error handler
   */
  const getErrorStats = useCallback(() => {
    return MneeErrorHandler.getErrorStats()
  }, [])

  /**
   * Initialize service on mount
   */
  useEffect(() => {
    initializeService()
  }, [initializeService])

  /**
   * Fetch Supabase user when wallet address changes
   */
  useEffect(() => {
    fetchSupabaseUser()
  }, [fetchSupabaseUser])

  /**
   * Fetch balance when service is initialized and user has an address
   */
  useEffect(() => {
    if (isInitialized && walletAddress) {
      refreshBalance()
    }
  }, [isInitialized, walletAddress, refreshBalance])

  /**
   * Enable balance subscription when service is initialized and user has an address
   */
  useEffect(() => {
    if (isInitialized && walletAddress && !isSubscribedToBalance) {
      // Enable subscription with default options
      enableBalanceSubscription({
        enablePolling: true,
        pollingInterval: 30000,
        enableNotifications: true
      })
    }
    
    // Cleanup subscription when wallet address changes or component unmounts
    return () => {
      if (isSubscribedToBalance) {
        disableBalanceSubscription()
      }
    }
  }, [isInitialized, walletAddress, isSubscribedToBalance, enableBalanceSubscription, disableBalanceSubscription])

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
      supabaseUser,
      isLoadingUser,
      isInitialized,
      isSubscribedToBalance,
      subscriptionError,
      lastError,
      errorHistory,
      refreshBalance,
      transfer,
      enableBalanceSubscription,
      disableBalanceSubscription,
      formatAmount,
      parseAmount,
      toAtomicUnits,
      fromAtomicUnits,
      clearErrors,
      retryLastOperation,
      getErrorStats,
    }),
    [
      balance,
      decimalBalance,
      isLoadingBalance,
      balanceError,
      supabaseUser,
      isLoadingUser,
      isInitialized,
      isSubscribedToBalance,
      subscriptionError,
      lastError,
      errorHistory,
      refreshBalance,
      transfer,
      enableBalanceSubscription,
      disableBalanceSubscription,
      formatAmount,
      parseAmount,
      toAtomicUnits,
      fromAtomicUnits,
      clearErrors,
      retryLastOperation,
      getErrorStats,
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