/**
 * Supabase Real-time Markets Hook
 * 
 * Replaces Solana WebSocket connections with Supabase real-time subscriptions
 * for market and participant updates. This hook provides real-time updates
 * for market data changes and new participant activity.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type MarketRow = Database['public']['Tables']['markets']['Row']
type ParticipantRow = Database['public']['Tables']['participants']['Row']

interface SupabaseRealtimeOptions {
  marketIds?: string[]
  enabled?: boolean
  useSolanaWebSocket?: boolean // Legacy option - ignored in web2 migration
  onMarketUpdate?: (marketId: string, eventType: string) => void
  onParticipantUpdate?: (marketId: string, participantId: string, eventType: string) => void
  onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'error') => void
}

interface RealtimeStatus {
  updateSource: 'supabase' | 'solana' | 'polling'
  isSupabaseConnected: boolean
  isSolanaConnected: boolean
  lastUpdateSource: 'supabase' | 'solana' | null
  lastUpdateType: 'market' | 'participant' | null
  lastUpdateTime: number | null
  subscribedMarketCount: number
  connectionStatus: 'connected' | 'disconnected' | 'error'
}

/**
 * Hook for managing Supabase real-time subscriptions to market and participant changes
 * 
 * This hook replaces Solana WebSocket functionality with Supabase real-time subscriptions,
 * providing live updates for market data and participant activity.
 */
export function useSupabaseRealtimeMarkets(options: SupabaseRealtimeOptions = {}): RealtimeStatus {
  const {
    marketIds = [],
    enabled = true,
    useSolanaWebSocket = false, // Ignored - always use Supabase
    onMarketUpdate,
    onParticipantUpdate,
    onConnectionStatusChange,
  } = options

  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastUpdateSource, setLastUpdateSource] = useState<'supabase' | 'solana' | null>(null)
  const [lastUpdateType, setLastUpdateType] = useState<'market' | 'participant' | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null)

  // Refs to maintain state across re-renders
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)
  const marketIdsRef = useRef<string[]>([])

  /**
   * Handle market table changes from Supabase real-time
   */
  const handleMarketChange = useCallback((payload: RealtimePostgresChangesPayload<MarketRow>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    const marketId = newRecord?.id || oldRecord?.id

    if (!marketId) return

    console.log('Supabase market update:', { eventType, marketId, newRecord })

    // Update tracking state
    setLastUpdateSource('supabase')
    setLastUpdateType('market')
    setLastUpdateTime(Date.now())

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
    queryClient.invalidateQueries({ queryKey: ['markets'] })

    // Call callback if provided
    onMarketUpdate?.(marketId, eventType)
  }, [queryClient, onMarketUpdate])

  /**
   * Handle participant table changes from Supabase real-time
   */
  const handleParticipantChange = useCallback((payload: RealtimePostgresChangesPayload<ParticipantRow>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    const participantId = newRecord?.id || oldRecord?.id
    const marketId = newRecord?.market_id || oldRecord?.market_id

    if (!participantId || !marketId) return

    console.log('Supabase participant update:', { eventType, participantId, marketId, newRecord })

    // Update tracking state
    setLastUpdateSource('supabase')
    setLastUpdateType('participant')
    setLastUpdateTime(Date.now())

    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
    queryClient.invalidateQueries({ queryKey: ['market', 'participants', marketId] })
    queryClient.invalidateQueries({ queryKey: ['user', 'participation'] })

    // Call callback if provided
    onParticipantUpdate?.(marketId, participantId, eventType)
  }, [queryClient, onParticipantUpdate])

  /**
   * Set up Supabase real-time subscriptions
   */
  const setupSubscriptions = useCallback(async () => {
    if (!enabled || isSubscribedRef.current) return

    try {
      // Create a single channel for all real-time updates
      const channel = supabase.channel('market-updates')

      // Subscribe to markets table changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'markets',
        },
        handleMarketChange
      )

      // Subscribe to participants table changes
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
        },
        handleParticipantChange
      )

      // Subscribe to the channel
      const subscriptionResult = await channel.subscribe()

      if (subscriptionResult === 'SUBSCRIBED') {
        channelRef.current = channel
        isSubscribedRef.current = true
        setConnectionStatus('connected')
        onConnectionStatusChange?.('connected')
        console.log('Supabase real-time subscriptions established')
      } else {
        throw new Error(`Subscription failed with status: ${subscriptionResult}`)
      }
    } catch (error) {
      console.error('Failed to set up Supabase real-time subscriptions:', error)
      setConnectionStatus('error')
      onConnectionStatusChange?.('error')
    }
  }, [enabled, handleMarketChange, handleParticipantChange, onConnectionStatusChange])

  /**
   * Clean up Supabase subscriptions
   */
  const cleanupSubscriptions = useCallback(async () => {
    if (channelRef.current && isSubscribedRef.current) {
      try {
        await channelRef.current.unsubscribe()
        supabase.removeChannel(channelRef.current)
        console.log('Supabase real-time subscriptions cleaned up')
      } catch (error) {
        console.error('Error cleaning up Supabase subscriptions:', error)
      }
    }

    channelRef.current = null
    isSubscribedRef.current = false
    setConnectionStatus('disconnected')
    onConnectionStatusChange?.('disconnected')
  }, [onConnectionStatusChange])

  /**
   * Set up subscriptions when enabled or market IDs change
   */
  useEffect(() => {
    // Check if market IDs actually changed to avoid unnecessary re-subscriptions
    const marketIdsChanged = JSON.stringify(marketIds.sort()) !== JSON.stringify(marketIdsRef.current.sort())
    
    if (enabled && (marketIdsChanged || !isSubscribedRef.current)) {
      marketIdsRef.current = [...marketIds]
      
      // Clean up existing subscriptions first
      if (isSubscribedRef.current) {
        cleanupSubscriptions()
      }
      
      // Set up new subscriptions
      setupSubscriptions()
    } else if (!enabled && isSubscribedRef.current) {
      cleanupSubscriptions()
    }
  }, [enabled, marketIds.join(','), setupSubscriptions, cleanupSubscriptions])

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      cleanupSubscriptions()
    }
  }, [cleanupSubscriptions])

  /**
   * Log warning if Solana WebSocket is requested (should not happen in web2 migration)
   */
  useEffect(() => {
    if (useSolanaWebSocket) {
      console.warn('Solana WebSocket requested but ignored in web2 migration. Using Supabase real-time instead.')
    }
  }, [useSolanaWebSocket])

  return {
    updateSource: 'supabase', // Always Supabase in web2 migration
    isSupabaseConnected: connectionStatus === 'connected',
    isSolanaConnected: false, // Never true in web2 migration
    lastUpdateSource,
    lastUpdateType,
    lastUpdateTime,
    subscribedMarketCount: marketIds.length,
    connectionStatus,
  }
}

/**
 * Simplified hook that provides the same interface as the original real-time markets hook
 * but uses Supabase instead of Solana WebSocket connections
 */
export function useRealtimeMarketsSupabase(options: {
  enabled?: boolean
  markets?: Array<{ marketAddress: string }>
  factoryAddress?: string
  onUpdate?: () => void
} = {}) {
  const { enabled = true, markets = [], onUpdate } = options
  
  // Extract market IDs from market objects (assuming marketAddress maps to database ID)
  const marketIds = markets.map(m => m.marketAddress).filter(Boolean)

  const realtimeStatus = useSupabaseRealtimeMarkets({
    marketIds,
    enabled,
    onMarketUpdate: () => onUpdate?.(),
    onParticipantUpdate: () => onUpdate?.(),
  })

  return {
    isPolling: false, // No polling needed with real-time subscriptions
    isWebSocketActive: realtimeStatus.isSupabaseConnected,
    isWebSocketFallback: false,
    interval: 0,
    webSocketStatus: {
      marketConnected: realtimeStatus.isSupabaseConnected,
      factoryConnected: realtimeStatus.isSupabaseConnected,
      marketSubscriptions: realtimeStatus.subscribedMarketCount,
      factorySubscriptions: realtimeStatus.isSupabaseConnected ? 1 : 0,
      reconnectAttempts: 0,
    },
  }
}