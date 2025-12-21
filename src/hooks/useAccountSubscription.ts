/**
 * useAccountSubscription - Hook for subscribing to account changes (Web2 Stub)
 *
 * This hook previously managed Solana account subscriptions.
 * Now it's a stub for the web2 migration.
 */

import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

export interface UseAccountSubscriptionOptions {
  accountAddress?: string
  enabled?: boolean
  onUpdate?: (data: any) => void
}

/**
 * Hook for subscribing to account changes (stub implementation)
 *
 * @param options - Subscription options
 */
export function useAccountSubscription(options: UseAccountSubscriptionOptions) {
  const queryClient = useQueryClient()
  const subscriptionIdRef = useRef<number | null>(null)

  const { accountAddress, enabled = true, onUpdate } = options

  useEffect(() => {
    // Don't subscribe if disabled or no account address
    if (!enabled || !accountAddress) {
      return
    }

    // TODO: Implement Supabase real-time subscription if needed
    console.log('Account subscription stub - implement Supabase real-time if needed for:', accountAddress)

    return () => {
      if (subscriptionIdRef.current !== null) {
        console.log('Unsubscribed from account:', accountAddress)
        subscriptionIdRef.current = null
      }
    }
  }, [accountAddress, enabled, queryClient, onUpdate])
}
