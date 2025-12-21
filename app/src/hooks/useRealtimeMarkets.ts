import type { Market } from '../types'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRealtimeNotifications } from './useRealtimeNotifications'
import { useAutomatedOperationNotifications } from './useAutomatedOperationNotifications'
import { useSupabaseRealtimeMarkets } from './useSupabaseRealtimeMarkets'

interface RealtimeOptions {
  enabled?: boolean
  interval?: number
  onUpdate?: () => void
  markets?: Market[]
  useWebSocket?: boolean // Legacy option - ignored in web2 migration
  factoryAddress?: string // Legacy option - ignored in web2 migration
}

export function useRealtimeMarkets(options: RealtimeOptions = {}) {
  const {
    enabled = true,
    interval = 10000, // Kept for backward compatibility but not used
    onUpdate,
    markets = [],
    useWebSocket = true, // Ignored - always use Supabase
    factoryAddress, // Ignored in web2 migration
  } = options
  const queryClient = useQueryClient()
  const [isWebSocketFallback, setIsWebSocketFallback] = useState(false)

  // Extract market IDs from market objects (assuming marketAddress maps to database ID)
  const marketIds = markets.map(market => market.marketAddress).filter(Boolean)

  // Use Supabase real-time subscriptions instead of Solana WebSocket
  const supabaseRealtime = useSupabaseRealtimeMarkets({
    marketIds,
    enabled,
    onMarketUpdate: (marketId, eventType) => {
      console.log('Market update detected:', marketId, eventType)
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      onUpdate?.()
    },
    onParticipantUpdate: (marketId, participantId, eventType) => {
      console.log('Participant update detected:', marketId, participantId, eventType)
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      onUpdate?.()
    },
    onConnectionStatusChange: (status) => {
      if (status === 'connected') {
        marketToast.webSocketConnected()
      } else if (status === 'disconnected') {
        marketToast.webSocketDisconnected()
      } else if (status === 'error') {
        marketToast.error('Real-time connection error')
      }
    },
  })

  // Real-time notifications for market events (updated to work with Supabase)
  useRealtimeNotifications({
    enabled,
    markets,
    onMarketUpdate: (marketAddress) => {
      console.log('Market update notification:', marketAddress)
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketAddress] })
    },
    onNewMarket: (market) => {
      console.log('New market notification:', market.marketAddress)
      queryClient.invalidateQueries({ queryKey: ['markets'] })
    },
    onMarketResolved: (market) => {
      console.log('Market resolved notification:', market.marketAddress)
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onNewParticipant: (marketAddress, count) => {
      console.log('New participants joined notification:', marketAddress, count)
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketAddress] })
    },
  })

  // Automated operation notifications for enhanced prediction system
  useAutomatedOperationNotifications({
    enabled,
    onMarketResolved: (marketId, outcome) => {
      console.log('Automated market resolution:', marketId, outcome)
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
    },
    onWinningsDistributed: (userId, amount, marketId) => {
      console.log('Automated winnings distribution:', userId, amount, marketId)
      queryClient.invalidateQueries({ queryKey: ['user', 'portfolio', userId] })
      queryClient.invalidateQueries({ queryKey: ['participant', 'multiple', marketId, userId] })
    },
    onCreatorRewardDistributed: (userId, amount, marketId) => {
      console.log('Automated creator reward distribution:', userId, amount, marketId)
      queryClient.invalidateQueries({ queryKey: ['user', 'portfolio', userId] })
    },
  })

  /**
   * Log warning if legacy WebSocket options are used
   */
  useEffect(() => {
    if (useWebSocket === false) {
      console.warn('useWebSocket=false is ignored in web2 migration. Supabase real-time is always used.')
    }
    if (factoryAddress) {
      console.warn('factoryAddress is ignored in web2 migration. Supabase handles all real-time updates.')
    }
  }, [useWebSocket, factoryAddress])

  return {
    isPolling: false, // No polling needed with Supabase real-time
    isWebSocketActive: supabaseRealtime.isSupabaseConnected,
    isWebSocketFallback: false, // No fallback needed with Supabase
    interval: 0, // Not used with real-time subscriptions
    webSocketStatus: {
      marketConnected: supabaseRealtime.isSupabaseConnected,
      factoryConnected: supabaseRealtime.isSupabaseConnected,
      marketSubscriptions: supabaseRealtime.subscribedMarketCount,
      factorySubscriptions: supabaseRealtime.isSupabaseConnected ? 1 : 0,
      reconnectAttempts: 0, // Supabase handles reconnection automatically
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

  newPredictions: (count: number) => {
    toast.success(`${count} new predictions placed!`, {
      description: '🎯 Multiple predictions are coming in',
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

  // Automated operation notifications
  automatedResolution: (marketTitle: string) => {
    toast.success('Market automatically resolved!', {
      description: `🤖 ${marketTitle} has been resolved automatically`,
      duration: 5000,
    })
  },

  automatedDistribution: (amount: number, currency: string = 'USDC') => {
    toast.success('Winnings distributed!', {
      description: `💰 ${amount} ${currency} has been automatically transferred to your account`,
      duration: 6000,
    })
  },

  automatedCreatorReward: (amount: number, currency: string = 'USDC') => {
    toast.success('Creator reward received!', {
      description: `🎉 ${amount} ${currency} creator reward has been transferred`,
      duration: 5000,
    })
  },

  multiplePredictionsUpdate: (marketTitle: string, predictionCount: number) => {
    toast.info('Multiple predictions updated', {
      description: `📊 ${predictionCount} predictions updated for ${marketTitle}`,
      duration: 3000,
    })
  },
}
