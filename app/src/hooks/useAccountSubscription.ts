/**
 * useAccountSubscription - Hook for subscribing to account changes via WebSocket
 *
 * Subscribes to market account changes and updates React Query cache in real-time.
 */

import { PublicKey } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { AccountDecoder } from '../lib/solana/account-decoder'
import { useSolanaConnection } from './useSolanaConnection'

export interface UseAccountSubscriptionOptions {
  accountAddress?: string
  enabled?: boolean
  onUpdate?: (data: any) => void
}

/**
 * Hook for subscribing to market account changes
 *
 * @param options - Subscription options
 */
export function useAccountSubscription(options: UseAccountSubscriptionOptions) {
  const { connection } = useSolanaConnection()
  const queryClient = useQueryClient()
  const subscriptionIdRef = useRef<number | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { accountAddress, enabled = true, onUpdate } = options

  useEffect(() => {
    // Don't subscribe if disabled or no account address
    if (!enabled || !accountAddress) {
      return
    }

    let isSubscribed = true

    const subscribe = async () => {
      try {
        const publicKey = new PublicKey(accountAddress)

        // Subscribe to market account changes using connection.onAccountChange
        const subscriptionId = connection.onAccountChange(
          publicKey,
          (accountInfo, context) => {
            if (!isSubscribed)
              return

            try {
              // Decode updated account data using AccountDecoder
              const market = AccountDecoder.decodeMarket(accountInfo.data)

              console.log('Account updated:', accountAddress, 'Slot:', context.slot)

              // Update React Query cache when changes detected
              queryClient.setQueryData(['market', 'details', accountAddress], (oldData: any) => {
                if (!oldData)
                  return oldData

                return {
                  ...oldData,
                  creator: market.creator.toString(),
                  matchId: market.matchId,
                  entryFee: Number(market.entryFee),
                  kickoffTime: Number(market.kickoffTime),
                  endTime: Number(market.endTime),
                  status: parseMarketStatus(market.status),
                  outcome: parseOutcome(market.outcome),
                  totalPool: Number(market.totalPool),
                  participantCount: Number(market.participantCount),
                  homeCount: Number(market.homeCount),
                  drawCount: Number(market.drawCount),
                  awayCount: Number(market.awayCount),
                  isPublic: market.isPublic,
                }
              })

              // Invalidate related queries
              queryClient.invalidateQueries({ queryKey: ['markets'] })

              // Call custom update handler if provided
              if (onUpdate) {
                onUpdate(market)
              }
            }
            catch (error) {
              console.error('Error decoding account update:', error)
            }
          },
          'confirmed',
        )

        subscriptionIdRef.current = subscriptionId
        console.log('Subscribed to account:', accountAddress, 'ID:', subscriptionId)
      }
      catch (error) {
        console.error('Error subscribing to account:', error)

        // Handle WebSocket disconnections and reconnections
        if (isSubscribed) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...')
            subscribe()
          }, 5000) // Retry after 5 seconds
        }
      }
    }

    subscribe()

    // Unsubscribe on component unmount
    return () => {
      isSubscribed = false

      if (subscriptionIdRef.current !== null) {
        connection.removeAccountChangeListener(subscriptionIdRef.current)
        console.log('Unsubscribed from account:', accountAddress)
        subscriptionIdRef.current = null
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [connection, accountAddress, enabled, queryClient, onUpdate])
}

// Helper functions
function parseMarketStatus(status: number): 'Open' | 'Live' | 'Resolved' | 'Cancelled' {
  switch (status) {
    case 0: return 'Open'
    case 1: return 'Live'
    case 2: return 'Resolved'
    case 3: return 'Cancelled'
    default: return 'Open'
  }
}

function parseOutcome(outcome: number): 'Home' | 'Draw' | 'Away' | null {
  switch (outcome) {
    case 0: return null // None
    case 1: return 'Home'
    case 2: return 'Draw'
    case 3: return 'Away'
    default: return null
  }
}
