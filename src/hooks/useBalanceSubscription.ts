/**
 * Hook for managing MNEE balance subscriptions
 * 
 * Provides easy access to real-time balance updates with error handling
 */

import { useCallback, useEffect, useState } from 'react'
import { useMnee } from '@/contexts/MneeContext'
import type { BalanceSubscriptionOptions } from '@/lib/mnee/types'

export interface UseBalanceSubscriptionOptions extends BalanceSubscriptionOptions {
  autoEnable?: boolean
  onBalanceChange?: (balance: number, decimalBalance: number) => void
  onError?: (error: string) => void
}

export interface UseBalanceSubscriptionReturn {
  isSubscribed: boolean
  subscriptionError: string | null
  enable: (options?: BalanceSubscriptionOptions) => void
  disable: () => void
  toggle: () => void
  clearError: () => void
}

/**
 * Hook for managing balance subscriptions with additional features
 */
export function useBalanceSubscription(
  options: UseBalanceSubscriptionOptions = {}
): UseBalanceSubscriptionReturn {
  const {
    isSubscribedToBalance,
    subscriptionError,
    enableBalanceSubscription,
    disableBalanceSubscription,
    clearErrors,
    balance,
    decimalBalance
  } = useMnee()

  const {
    autoEnable = true,
    onBalanceChange,
    onError,
    ...subscriptionOptions
  } = options

  const [lastBalance, setLastBalance] = useState<number | null>(null)

  /**
   * Enable subscription with custom options
   */
  const enable = useCallback((customOptions?: BalanceSubscriptionOptions) => {
    const finalOptions = { ...subscriptionOptions, ...customOptions }
    enableBalanceSubscription(finalOptions)
  }, [enableBalanceSubscription, subscriptionOptions])

  /**
   * Disable subscription
   */
  const disable = useCallback(() => {
    disableBalanceSubscription()
  }, [disableBalanceSubscription])

  /**
   * Toggle subscription state
   */
  const toggle = useCallback(() => {
    if (isSubscribedToBalance) {
      disable()
    } else {
      enable()
    }
  }, [isSubscribedToBalance, enable, disable])

  /**
   * Clear subscription errors
   */
  const clearError = useCallback(() => {
    clearErrors()
  }, [clearErrors])

  /**
   * Auto-enable subscription if requested
   */
  useEffect(() => {
    if (autoEnable && !isSubscribedToBalance && !subscriptionError) {
      enable()
    }
  }, [autoEnable, isSubscribedToBalance, subscriptionError, enable])

  /**
   * Handle balance changes
   */
  useEffect(() => {
    if (balance !== null && decimalBalance !== null && balance !== lastBalance) {
      setLastBalance(balance)
      onBalanceChange?.(balance, decimalBalance)
    }
  }, [balance, decimalBalance, lastBalance, onBalanceChange])

  /**
   * Handle subscription errors
   */
  useEffect(() => {
    if (subscriptionError) {
      onError?.(subscriptionError)
    }
  }, [subscriptionError, onError])

  return {
    isSubscribed: isSubscribedToBalance,
    subscriptionError,
    enable,
    disable,
    toggle,
    clearError
  }
}

/**
 * Hook for simple balance change notifications
 */
export function useBalanceChangeNotification(
  callback: (balance: number, decimalBalance: number) => void,
  options?: Omit<UseBalanceSubscriptionOptions, 'onBalanceChange'>
) {
  return useBalanceSubscription({
    ...options,
    onBalanceChange: callback
  })
}

/**
 * Hook for balance subscription with toast notifications
 */
export function useBalanceSubscriptionWithToasts(
  options?: UseBalanceSubscriptionOptions
) {
  return useBalanceSubscription({
    enableNotifications: true,
    ...options,
    onError: (error) => {
      // Import toast dynamically to avoid SSR issues
      import('sonner').then(({ toast }) => {
        toast.error('Balance Subscription Error', {
          description: error,
          duration: 5000
        })
      }).catch(console.error)
      
      options?.onError?.(error)
    }
  })
}