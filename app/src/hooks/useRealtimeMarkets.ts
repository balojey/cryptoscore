import type { Market } from '../types'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRealtimeNotifications } from './useRealtimeNotifications'
import { useFactoryWebSocketSubscription, useMarketWebSocketSubscriptions } from './useSolanaWebSocket'

interface RealtimeOptions {
  enabled?: boolean
  interval?: number
  onUpdate?: () => void
  markets?: Market[]
  useWebSocket?: boolean
  factoryAddress?: string
}

export function useRealtimeMarkets(options: RealtimeOptions = {}) {
  const {
    enabled = true,
    interval = 10000,
    onUpdate,
    markets = [],
    useWebSocket = true,
    factoryAddress,
  } = options
  const queryClient = useQueryClient()
  const [isWebSocketFallback, setIsWebSocketFallback] = useState(false)

  // Extract market addresses for WebSocket subscriptions
  const marketAddresses = markets.map(market => market.marketAddress).filter(Boolean)

  // WebSocket subscriptions for real-time updates
  const marketWebSocket = useMarketWebSocketSubscriptions(
    useWebSocket && !isWebSocketFallback ? marketAddresses : [],
  )

  const factoryWebSocket = useFactoryWebSocketSubscription(
    useWebSocket && !isWebSocketFallback ? factoryAddress : undefined,
  )

  // Real-time notifications for market events
  useRealtimeNotifications({
    enabled,
    markets,
    onMarketUpdate: (marketAddress) => {
      console.log('Market update detected:', marketAddress)
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketAddress] })
    },
    onNewMarket: (market) => {
      console.log('New market detected:', market.marketAddress)
      queryClient.invalidateQueries({ queryKey: ['markets'] })
    },
    onMarketResolved: (market) => {
      console.log('Market resolved:', market.marketAddress)
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onNewParticipant: (marketAddress, count) => {
      console.log('New participants joined:', marketAddress, count)
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketAddress] })
    },
  })

  /**
   * Handle WebSocket account changes and invalidate cache
   */
  const handleWebSocketUpdate = useCallback((accountAddress: string, accountType: string) => {
    console.log(`WebSocket update received for ${accountType}:`, accountAddress)

    // Invalidate specific queries based on account type
    if (accountType === 'market') {
      queryClient.invalidateQueries({ queryKey: ['market', 'details', accountAddress] })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
    }
    else if (accountType === 'factory') {
      queryClient.invalidateQueries({ queryKey: ['markets'] })
    }

    // Trigger general update callback
    onUpdate?.()
  }, [queryClient, onUpdate])

  /**
   * Monitor WebSocket account changes for cache invalidation
   */
  useEffect(() => {
    if (!useWebSocket || isWebSocketFallback)
      return

    // Check for market account changes
    marketWebSocket.accountChanges.forEach((change, address) => {
      handleWebSocketUpdate(address, change.type)
    })

    // Check for factory account changes
    if (factoryWebSocket.factoryData) {
      handleWebSocketUpdate(factoryAddress || '', 'factory')
    }
  }, [
    marketWebSocket.accountChanges,
    factoryWebSocket.factoryData,
    handleWebSocketUpdate,
    useWebSocket,
    isWebSocketFallback,
    factoryAddress,
  ])

  /**
   * Fallback to polling when WebSocket is unavailable or fails
   */
  useEffect(() => {
    // Enable polling if WebSocket is disabled or has failed
    const shouldPoll = !enabled || !useWebSocket || isWebSocketFallback
      || (!marketWebSocket.isConnected && marketAddresses.length > 0)

    if (!shouldPoll)
      return

    const intervalId = setInterval(() => {
      // Invalidate all market-related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })

      onUpdate?.()
    }, interval)

    return () => clearInterval(intervalId)
  }, [
    enabled,
    interval,
    queryClient,
    onUpdate,
    useWebSocket,
    isWebSocketFallback,
    marketWebSocket.isConnected,
    marketAddresses.length,
  ])

  /**
   * Monitor WebSocket connection status and fallback to polling if needed
   */
  useEffect(() => {
    if (!useWebSocket)
      return

    // If WebSocket fails to connect or has too many reconnect attempts, fallback to polling
    const shouldFallback = (marketAddresses.length > 0 && !marketWebSocket.isConnected
      && marketWebSocket.reconnectAttempts >= 5)
    || (factoryAddress && !factoryWebSocket.isConnected
      && factoryWebSocket.reconnectAttempts >= 5)

    if (shouldFallback && !isWebSocketFallback) {
      console.warn('WebSocket connection failed, falling back to polling')
      setIsWebSocketFallback(true)
      marketToast.error('Real-time updates unavailable. Using polling fallback.')
    }
    else if (!shouldFallback && isWebSocketFallback) {
      // Reset fallback if WebSocket reconnects successfully
      setIsWebSocketFallback(false)
      console.log('WebSocket reconnected, disabling polling fallback')
    }
  }, [
    useWebSocket,
    marketAddresses.length,
    marketWebSocket.isConnected,
    marketWebSocket.reconnectAttempts,
    factoryAddress,
    factoryWebSocket.isConnected,
    factoryWebSocket.reconnectAttempts,
    isWebSocketFallback,
  ])

  return {
    isPolling: enabled && (!useWebSocket || isWebSocketFallback || !marketWebSocket.isConnected),
    isWebSocketActive: useWebSocket && !isWebSocketFallback && marketWebSocket.isConnected,
    isWebSocketFallback,
    interval,
    webSocketStatus: {
      marketConnected: marketWebSocket.isConnected,
      factoryConnected: factoryWebSocket.isConnected,
      marketSubscriptions: marketWebSocket.subscriptions.length,
      factorySubscriptions: factoryWebSocket.subscriptions.length,
      reconnectAttempts: Math.max(marketWebSocket.reconnectAttempts, factoryWebSocket.reconnectAttempts),
    },
  }
}

// Toast notification helpers
export const marketToast = {
  newMarket: () => {
    toast.success('New market created!', {
      description: '🎯 A new prediction market is now available',
      duration: 4000,
    })
  },

  newParticipant: (count: number = 1) => {
    toast.success(`${count} new ${count === 1 ? 'participant' : 'participants'} joined!`, {
      description: '👥 Market activity is heating up',
      duration: 3000,
    })
  },

  marketResolved: () => {
    toast.success('Market resolved!', {
      description: '✅ Results are in - check your winnings',
      duration: 5000,
    })
  },

  marketStarting: (minutes: number) => {
    toast.info(`Market starting in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}!`, {
      description: '⚡ Last chance to join',
      duration: 4000,
    })
  },

  marketUpdated: (marketAddress: string) => {
    toast.info('Market updated', {
      description: `📊 Real-time data refreshed for market ${marketAddress.slice(0, 8)}...`,
      duration: 2000,
    })
  },

  webSocketConnected: () => {
    toast.success('Real-time updates active', {
      description: '🔗 WebSocket connection established',
      duration: 3000,
    })
  },

  webSocketDisconnected: () => {
    toast.warning('Real-time updates paused', {
      description: '📡 Attempting to reconnect...',
      duration: 3000,
    })
  },

  webSocketFallback: () => {
    toast.info('Using polling fallback', {
      description: '🔄 WebSocket unavailable, polling every 10 seconds',
      duration: 4000,
    })
  },

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
    })
  },
}
