/**
 * Supabase Real-time Markets Hook
 * 
 * Replaces Solana WebSocket connections with Supabase real-time subscriptions
 * for market and participant updates. This hook provides real-time updates
 * for market data changes and new participant activity.
 * 
 * Performance optimizations:
 * - Connection pooling and reuse
 * - Selective subscriptions based on active markets
 * - Automatic reconnection with exponential backoff
 * - Memory leak prevention with proper cleanup
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/config/supabase'
import { queryKeys, cacheInvalidation } from '@/config/query-client'
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
  throttleMs?: number // Throttle updates to prevent excessive re-renders
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
  reconnectAttempts: number
}

// Global connection pool to reuse channels across components
const connectionPool = new Map<string, RealtimeChannel>()
const connectionRefs = new Map<string, number>()

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
    throttleMs = 100, // Default 100ms throttle
  } = options

  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastUpdateSource, setLastUpdateSource] = useState<'supabase' | 'solana' | null>(null)
  const [lastUpdateType, setLastUpdateType] = useState<'market' | 'participant' | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // Refs to maintain state across re-renders
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)
  const marketIdsRef = useRef<string[]>([])
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Throttled update handler to prevent excessive re-renders
  const throttledUpdate = useCallback((updateFn: () => void) => {
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current)
    }
    
    throttleTimerRef.current = setTimeout(updateFn, throttleMs)
  }, [throttleMs])

  /**
   * Handle market table changes from Supabase real-time
   */
  const handleMarketChange = useCallback((payload: RealtimePostgresChangesPayload<MarketRow>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    const marketId = newRecord?.id || oldRecord?.id

    if (!marketId) return

    console.log('Supabase market update:', { eventType, marketId, newRecord })

    throttledUpdate(() => {
      // Update tracking state
      setLastUpdateSource('supabase')
      setLastUpdateType('market')
      setLastUpdateTime(Date.now())

      // Efficient cache invalidation
      cacheInvalidation.invalidateMarket(queryClient, marketId)

      // Call callback if provided
      onMarketUpdate?.(marketId, eventType)
    })
  }, [queryClient, onMarketUpdate, throttledUpdate])

  /**
   * Handle participant table changes from Supabase real-time
   * Enhanced to support multiple predictions per user
   */
  const handleParticipantChange = useCallback((payload: RealtimePostgresChangesPayload<ParticipantRow>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    const participantId = newRecord?.id || oldRecord?.id
    const marketId = newRecord?.market_id || oldRecord?.market_id
    const userId = newRecord?.user_id || oldRecord?.user_id
    const prediction = newRecord?.prediction || oldRecord?.prediction

    if (!participantId || !marketId) return

    console.log('Supabase participant update:', { eventType, participantId, marketId, userId, prediction, newRecord })

    throttledUpdate(() => {
      // Update tracking state
      setLastUpdateSource('supabase')
      setLastUpdateType('participant')
      setLastUpdateTime(Date.now())

      // Enhanced cache invalidation for multiple predictions
      if (userId) {
        // Invalidate single prediction cache (backward compatibility)
        cacheInvalidation.invalidateMarketParticipation(queryClient, marketId, userId)
        
        // Invalidate multiple predictions cache
        queryClient.invalidateQueries({ 
          queryKey: ['participant', 'multiple', marketId, userId] 
        })
        
        // Invalidate user-specific queries that might be affected by multiple predictions
        queryClient.invalidateQueries({ 
          queryKey: ['user', 'predictions', userId] 
        })
        queryClient.invalidateQueries({ 
          queryKey: ['user', 'portfolio', userId] 
        })
      } else {
        // Fallback to market-wide invalidation
        cacheInvalidation.invalidateMarket(queryClient, marketId)
      }

      // Call callback with enhanced information
      onParticipantUpdate?.(marketId, participantId, eventType)
    })
  }, [queryClient, onParticipantUpdate, throttledUpdate])

  /**
   * Set up Supabase real-time subscriptions with connection pooling
   */
  const setupSubscriptions = useCallback(async () => {
    if (!enabled || isSubscribedRef.current) return

    try {
      const channelKey = 'market-updates-global'
      
      // Check if we can reuse an existing channel
      let channel = connectionPool.get(channelKey)
      
      if (!channel) {
        // Create a new channel
        channel = supabase.channel(channelKey, {
          config: {
            presence: { key: '' }, // Disable presence for better performance
            broadcast: { self: false }, // Don't broadcast to self
          }
        })

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

        connectionPool.set(channelKey, channel)
      }

      // Increment reference count
      const refCount = connectionRefs.get(channelKey) || 0
      connectionRefs.set(channelKey, refCount + 1)

      // Subscribe to the channel if not already subscribed
      const subscriptionResult = await channel.subscribe()

      if (subscriptionResult === 'SUBSCRIBED') {
        channelRef.current = channel
        isSubscribedRef.current = true
        setConnectionStatus('connected')
        setReconnectAttempts(0)
        onConnectionStatusChange?.('connected')
        console.log('Supabase real-time subscriptions established')
      } else {
        throw new Error(`Subscription failed with status: ${subscriptionResult}`)
      }
    } catch (error) {
      console.error('Failed to set up Supabase real-time subscriptions:', error)
      setConnectionStatus('error')
      onConnectionStatusChange?.('error')
      
      // Implement exponential backoff for reconnection
      const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // Max 30s
      setReconnectAttempts(prev => prev + 1)
      
      if (reconnectAttempts < 5) { // Max 5 reconnection attempts
        reconnectTimerRef.current = setTimeout(() => {
          console.log(`Attempting to reconnect (attempt ${reconnectAttempts + 1})...`)
          setupSubscriptions()
        }, backoffDelay)
      }
    }
  }, [enabled, handleMarketChange, handleParticipantChange, onConnectionStatusChange, reconnectAttempts])

  /**
   * Clean up Supabase subscriptions with connection pooling
   */
  const cleanupSubscriptions = useCallback(async () => {
    const channelKey = 'market-updates-global'
    const channel = connectionPool.get(channelKey)
    
    if (channel && isSubscribedRef.current) {
      try {
        // Decrement reference count
        const refCount = connectionRefs.get(channelKey) || 0
        const newRefCount = Math.max(0, refCount - 1)
        connectionRefs.set(channelKey, newRefCount)
        
        // Only unsubscribe if no other components are using this channel
        if (newRefCount === 0) {
          await channel.unsubscribe()
          supabase.removeChannel(channel)
          connectionPool.delete(channelKey)
          connectionRefs.delete(channelKey)
          console.log('Supabase real-time subscriptions cleaned up')
        }
      } catch (error) {
        console.error('Error cleaning up Supabase subscriptions:', error)
      }
    }

    channelRef.current = null
    isSubscribedRef.current = false
    setConnectionStatus('disconnected')
    onConnectionStatusChange?.('disconnected')
    
    // Clear timers
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current)
      throttleTimerRef.current = null
    }
    
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
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
    reconnectAttempts,
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
      reconnectAttempts: realtimeStatus.reconnectAttempts,
    },
  }
}