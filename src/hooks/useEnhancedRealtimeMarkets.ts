import type { Market } from '../types'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { marketToast, useRealtimeMarkets } from './useRealtimeMarkets'
import { useSupabaseRealtimeMarkets } from './useSupabaseRealtimeMarkets'
import { useAutomatedOperationNotifications } from './useAutomatedOperationNotifications'

interface EnhancedRealtimeOptions {
  enabled?: boolean
  markets?: Market[]
  factoryAddress?: string // Legacy option - ignored in web2 migration
  pollingInterval?: number // Legacy option - not used with Supabase real-time
  webSocketEnabled?: boolean // Legacy option - ignored in web2 migration
  onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'fallback') => void
  onMarketUpdate?: (marketAddress: string) => void
}

/**
 * Enhanced real-time markets hook that uses Supabase real-time subscriptions
 * instead of WebSocket and polling. Maintains backward compatibility with the original API.
 */
export function useEnhancedRealtimeMarkets(options: EnhancedRealtimeOptions = {}) {
  const {
    enabled = true,
    markets = [],
    factoryAddress, // Ignored in web2 migration
    pollingInterval = 10000, // Not used with real-time subscriptions
    webSocketEnabled = true, // Ignored - always use Supabase
    onConnectionStatusChange,
    onMarketUpdate,
  } = options

  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'fallback'>('disconnected')
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now())
  const statusReportedRef = useRef<string>('')

  // Extract market IDs for subscriptions
  const marketIds = markets.map(m => m.marketAddress).filter(Boolean)

  // Use Supabase real-time subscriptions instead of WebSocket
  const supabaseRealtime = useSupabaseRealtimeMarkets({
    marketIds,
    enabled,
    onMarketUpdate: (marketId, eventType) => {
      console.log(`Supabase market update: ${eventType} ${marketId}`)
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      
      onMarketUpdate?.(marketId)
      setLastUpdateTime(Date.now())
    },
    onParticipantUpdate: (marketId, participantId, eventType) => {
      console.log(`Supabase participant update: ${eventType} ${participantId} in ${marketId}`)
      
      // Enhanced cache invalidation for multiple predictions
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
      queryClient.invalidateQueries({ queryKey: ['market', 'participants', marketId] })
      queryClient.invalidateQueries({ queryKey: ['user', 'participation'] })
      
      // Invalidate multiple predictions cache
      queryClient.invalidateQueries({ queryKey: ['participant', 'multiple', marketId] })
      
      setLastUpdateTime(Date.now())
    },
    onConnectionStatusChange: (status) => {
      const mappedStatus = status === 'connected' ? 'connected' : 
                          status === 'error' ? 'fallback' : 'disconnected'
      
      if (mappedStatus !== connectionStatus) {
        setConnectionStatus(mappedStatus)
        onConnectionStatusChange?.(mappedStatus)

        // Show toast notifications for status changes
        if (statusReportedRef.current !== mappedStatus) {
          switch (mappedStatus) {
            case 'connected':
              if (statusReportedRef.current === 'disconnected' || statusReportedRef.current === 'fallback') {
                marketToast.webSocketConnected()
              }
              break
            case 'disconnected':
              if (statusReportedRef.current === 'connected') {
                marketToast.webSocketDisconnected()
              }
              break
            case 'fallback':
              marketToast.error('Real-time connection error')
              break
          }
          statusReportedRef.current = mappedStatus
        }
      }
    },
  })

  // Automated operation notifications for enhanced prediction system
  useAutomatedOperationNotifications({
    enabled,
    onMarketResolved: (marketId, outcome) => {
      console.log('Enhanced: Automated market resolution:', marketId, outcome)
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      setLastUpdateTime(Date.now())
    },
    onWinningsDistributed: (userId, amount, marketId) => {
      console.log('Enhanced: Automated winnings distribution:', userId, amount, marketId)
      queryClient.invalidateQueries({ queryKey: ['user', 'portfolio', userId] })
      queryClient.invalidateQueries({ queryKey: ['participant', 'multiple', marketId, userId] })
      setLastUpdateTime(Date.now())
    },
    onCreatorRewardDistributed: (userId, amount, marketId) => {
      console.log('Enhanced: Automated creator reward distribution:', userId, amount, marketId)
      queryClient.invalidateQueries({ queryKey: ['user', 'portfolio', userId] })
      setLastUpdateTime(Date.now())
    },
  })

  /**
   * Update connection status based on Supabase real-time status
   */
  useEffect(() => {
    const newStatus = supabaseRealtime.isSupabaseConnected ? 'connected' : 
                     supabaseRealtime.connectionStatus === 'error' ? 'fallback' : 'disconnected'
    
    if (newStatus !== connectionStatus) {
      setConnectionStatus(newStatus)
      onConnectionStatusChange?.(newStatus)
    }
  }, [supabaseRealtime.isSupabaseConnected, supabaseRealtime.connectionStatus, connectionStatus, onConnectionStatusChange])

  /**
   * Log warnings for legacy options
   */
  useEffect(() => {
    if (!webSocketEnabled) {
      console.warn('webSocketEnabled=false is ignored in web2 migration. Supabase real-time is always used.')
    }
    if (factoryAddress) {
      console.warn('factoryAddress is ignored in web2 migration. Supabase handles all real-time updates.')
    }
    if (pollingInterval !== 10000) {
      console.warn('pollingInterval is ignored in web2 migration. Supabase real-time provides instant updates.')
    }
  }, [webSocketEnabled, factoryAddress, pollingInterval])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      statusReportedRef.current = ''
    }
  }, [])

  return {
    // Connection status
    connectionStatus,
    isWebSocketActive: supabaseRealtime.isSupabaseConnected,
    isPollingActive: false, // No polling with Supabase real-time
    lastUpdateTime,

    // WebSocket details (mapped from Supabase for backward compatibility)
    webSocketStatus: {
      marketConnected: supabaseRealtime.isSupabaseConnected,
      factoryConnected: supabaseRealtime.isSupabaseConnected,
      marketSubscriptions: supabaseRealtime.subscribedMarketCount,
      factorySubscriptions: supabaseRealtime.isSupabaseConnected ? 1 : 0,
      marketReconnectAttempts: 0, // Supabase handles reconnection
      factoryReconnectAttempts: 0, // Supabase handles reconnection
    },

    // Polling details (not used but kept for compatibility)
    pollingStatus: {
      isActive: false,
      interval: 0,
    },

    // Manual controls
    forceRefresh: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setLastUpdateTime(Date.now())
    },

    // Subscription management (legacy API - not used with Supabase)
    subscribeToMarket: () => console.warn('subscribeToMarket is not needed with Supabase real-time'),
    unsubscribeFromMarket: () => console.warn('unsubscribeFromMarket is not needed with Supabase real-time'),
    subscribeToFactory: () => console.warn('subscribeToFactory is not needed with Supabase real-time'),
    unsubscribeFromFactory: () => console.warn('unsubscribeFromFactory is not needed with Supabase real-time'),
  }
}

/**
 * Simplified hook for components that just need basic real-time functionality
 * Updated to use Supabase instead of WebSocket
 */
export function useSimpleRealtimeMarkets(
  markets: Market[] = [],
  factoryAddress?: string, // Ignored in web2 migration
  webSocketEnabled: boolean = true, // Ignored - always use Supabase
) {
  const enhanced = useEnhancedRealtimeMarkets({
    markets,
    factoryAddress,
    webSocketEnabled,
  })

  return {
    isActive: enhanced.isWebSocketActive,
    connectionType: enhanced.connectionStatus,
    lastUpdate: enhanced.lastUpdateTime,
    forceRefresh: enhanced.forceRefresh,
  }
}
