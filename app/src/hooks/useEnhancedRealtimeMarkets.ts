import type { Market } from '../types'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { marketToast, useRealtimeMarkets } from './useRealtimeMarkets'
import { useFactoryWebSocketSubscription, useMarketWebSocketSubscriptions } from './useSolanaWebSocket'

interface EnhancedRealtimeOptions {
  enabled?: boolean
  markets?: Market[]
  factoryAddress?: string
  pollingInterval?: number
  webSocketEnabled?: boolean
  onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'fallback') => void
  onMarketUpdate?: (marketAddress: string) => void
}

/**
 * Enhanced real-time markets hook that combines WebSocket and polling
 * with intelligent fallback and comprehensive error handling
 */
export function useEnhancedRealtimeMarkets(options: EnhancedRealtimeOptions = {}) {
  const {
    enabled = true,
    markets = [],
    factoryAddress,
    pollingInterval = 10000,
    webSocketEnabled = true,
    onConnectionStatusChange,
    onMarketUpdate,
  } = options

  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'fallback'>('disconnected')
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now())
  const statusReportedRef = useRef<string>('')

  // Extract market addresses for subscriptions
  const marketAddresses = markets.map(m => m.marketAddress).filter(Boolean)

  // WebSocket subscriptions
  const marketWebSocket = useMarketWebSocketSubscriptions(
    webSocketEnabled ? marketAddresses : [],
  )

  const factoryWebSocket = useFactoryWebSocketSubscription(
    webSocketEnabled ? factoryAddress : undefined,
  )

  // Fallback polling mechanism
  const realtimePolling = useRealtimeMarkets({
    enabled: enabled && (!webSocketEnabled || connectionStatus === 'fallback'),
    interval: pollingInterval,
    markets,
    useWebSocket: false, // Disable WebSocket in polling mode
    onUpdate: () => {
      setLastUpdateTime(Date.now())
      console.log('Polling update triggered')
    },
  })

  /**
   * Handle WebSocket account changes
   */
  const handleWebSocketAccountChange = useCallback((accountAddress: string, accountType: string, data: any) => {
    console.log(`WebSocket account change: ${accountType} ${accountAddress}`, data)

    // Invalidate relevant queries
    if (accountType === 'market') {
      queryClient.invalidateQueries({ queryKey: ['market', 'details', accountAddress] })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      onMarketUpdate?.(accountAddress)
    }
    else if (accountType === 'factory') {
      queryClient.invalidateQueries({ queryKey: ['markets'] })
    }

    setLastUpdateTime(Date.now())
  }, [queryClient, onMarketUpdate])

  /**
   * Monitor WebSocket connection status
   */
  useEffect(() => {
    if (!webSocketEnabled) {
      const newStatus = 'fallback'
      if (newStatus !== connectionStatus) {
        setConnectionStatus(newStatus)
        onConnectionStatusChange?.(newStatus)

        if (statusReportedRef.current !== newStatus) {
          marketToast.webSocketFallback()
          statusReportedRef.current = newStatus
        }
      }
      return
    }

    const isMarketConnected = marketAddresses.length === 0 || marketWebSocket.isConnected
    const isFactoryConnected = !factoryAddress || factoryWebSocket.isConnected
    const hasHighReconnectAttempts = marketWebSocket.reconnectAttempts >= 3 || factoryWebSocket.reconnectAttempts >= 3

    let newStatus: 'connected' | 'disconnected' | 'fallback'

    if (isMarketConnected && isFactoryConnected && !hasHighReconnectAttempts) {
      newStatus = 'connected'
    }
    else if (hasHighReconnectAttempts) {
      newStatus = 'fallback'
    }
    else {
      newStatus = 'disconnected'
    }

    if (newStatus !== connectionStatus) {
      setConnectionStatus(newStatus)
      onConnectionStatusChange?.(newStatus)

      // Show toast notifications for status changes
      if (statusReportedRef.current !== newStatus) {
        switch (newStatus) {
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
            marketToast.webSocketFallback()
            break
        }
        statusReportedRef.current = newStatus
      }
    }
  }, [
    webSocketEnabled,
    marketAddresses.length,
    marketWebSocket.isConnected,
    marketWebSocket.reconnectAttempts,
    factoryAddress,
    factoryWebSocket.isConnected,
    factoryWebSocket.reconnectAttempts,
    connectionStatus,
    onConnectionStatusChange,
  ])

  /**
   * Monitor WebSocket account changes
   */
  useEffect(() => {
    if (connectionStatus !== 'connected')
      return

    // Process market account changes
    marketWebSocket.accountChanges.forEach((change, address) => {
      handleWebSocketAccountChange(address, change.type, change.data)
    })

    // Process factory account changes
    if (factoryWebSocket.factoryData && factoryAddress) {
      handleWebSocketAccountChange(factoryAddress, 'factory', factoryWebSocket.factoryData)
    }
  }, [
    connectionStatus,
    marketWebSocket.accountChanges,
    factoryWebSocket.factoryData,
    factoryAddress,
    handleWebSocketAccountChange,
  ])

  /**
   * Health check for WebSocket connections
   */
  useEffect(() => {
    if (!webSocketEnabled || connectionStatus === 'fallback')
      return

    const healthCheckInterval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdateTime

      // If no updates for 60 seconds and we should be connected, trigger a manual refresh
      if (timeSinceLastUpdate > 60000 && connectionStatus === 'connected') {
        console.log('WebSocket health check: triggering manual refresh')
        queryClient.invalidateQueries({ queryKey: ['markets'] })
        setLastUpdateTime(now)
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(healthCheckInterval)
  }, [webSocketEnabled, connectionStatus, lastUpdateTime, queryClient])

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
    isWebSocketActive: connectionStatus === 'connected',
    isPollingActive: connectionStatus === 'fallback' || !webSocketEnabled,
    lastUpdateTime,

    // WebSocket details
    webSocketStatus: {
      marketConnected: marketWebSocket.isConnected,
      factoryConnected: factoryWebSocket.isConnected,
      marketSubscriptions: marketWebSocket.subscriptions.length,
      factorySubscriptions: factoryWebSocket.subscriptions.length,
      marketReconnectAttempts: marketWebSocket.reconnectAttempts,
      factoryReconnectAttempts: factoryWebSocket.reconnectAttempts,
    },

    // Polling details
    pollingStatus: {
      isActive: realtimePolling.isPolling,
      interval: pollingInterval,
    },

    // Manual controls
    forceRefresh: () => {
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      setLastUpdateTime(Date.now())
    },

    // Subscription management
    subscribeToMarket: marketWebSocket.subscribeToAccount,
    unsubscribeFromMarket: marketWebSocket.unsubscribeFromAccount,
    subscribeToFactory: factoryWebSocket.subscribeToAccount,
    unsubscribeFromFactory: factoryWebSocket.unsubscribeFromAccount,
  }
}

/**
 * Simplified hook for components that just need basic real-time functionality
 */
export function useSimpleRealtimeMarkets(
  markets: Market[] = [],
  factoryAddress?: string,
  webSocketEnabled: boolean = false, // Disabled by default until programs deployed
) {
  const enhanced = useEnhancedRealtimeMarkets({
    markets,
    factoryAddress,
    webSocketEnabled,
  })

  return {
    isActive: enhanced.isWebSocketActive || enhanced.isPollingActive,
    connectionType: enhanced.connectionStatus,
    lastUpdate: enhanced.lastUpdateTime,
    forceRefresh: enhanced.forceRefresh,
  }
}
