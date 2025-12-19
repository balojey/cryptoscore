import type { Market } from '../types'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { marketToast } from './useRealtimeMarkets'

interface NotificationOptions {
  enabled?: boolean
  markets?: Market[]
  onMarketUpdate?: (marketAddress: string) => void
  onNewMarket?: (market: Market) => void
  onMarketResolved?: (market: Market) => void
  onNewParticipant?: (marketAddress: string, participantCount: number) => void
}

/**
 * Hook for managing real-time notifications based on market data changes
 * Detects significant events and displays appropriate toast notifications
 */
export function useRealtimeNotifications(options: NotificationOptions = {}) {
  const {
    enabled = true,
    markets = [],
    onMarketUpdate,
    onNewMarket,
    onMarketResolved,
    onNewParticipant,
  } = options

  const queryClient = useQueryClient()
  const previousMarketsRef = useRef<Market[]>([])
  const notificationCooldownRef = useRef<Set<string>>(new Set())
  const lastUpdateRef = useRef<number>(Date.now())

  /**
   * Add notification to cooldown to prevent spam
   */
  const addToCooldown = useCallback((key: string, duration: number = 300000) => {
    notificationCooldownRef.current.add(key)
    setTimeout(() => {
      notificationCooldownRef.current.delete(key)
    }, duration)
  }, [])

  /**
   * Check if notification is in cooldown
   */
  const isInCooldown = useCallback((key: string) => {
    return notificationCooldownRef.current.has(key)
  }, [])

  /**
   * Handle cache invalidation for specific market
   */
  const invalidateMarketCache = useCallback((marketAddress: string) => {
    queryClient.invalidateQueries({ queryKey: ['market', 'details', marketAddress] })
    queryClient.invalidateQueries({ queryKey: ['markets'] })
    queryClient.invalidateQueries({ queryKey: ['user'] })
  }, [queryClient])

  /**
   * Detect and notify about new markets
   */
  const detectNewMarkets = useCallback((currentMarkets: Market[], previousMarkets: Market[]) => {
    if (previousMarkets.length === 0)
      return // Skip on initial load

    const previousMap = new Map(previousMarkets.map(m => [m.marketAddress, m]))
    const newMarkets = currentMarkets.filter(m => !previousMap.has(m.marketAddress))

    if (newMarkets.length > 0 && newMarkets.length <= 3) {
      newMarkets.forEach((market) => {
        const cooldownKey = `new-market-${market.marketAddress}`
        if (!isInCooldown(cooldownKey)) {
          marketToast.newMarket()
          addToCooldown(cooldownKey, 300000) // 5 minutes
          onNewMarket?.(market)
          invalidateMarketCache(market.marketAddress)
        }
      })
    }
  }, [isInCooldown, addToCooldown, onNewMarket, invalidateMarketCache])

  /**
   * Detect and notify about new participants
   */
  const detectNewParticipants = useCallback((currentMarkets: Market[], previousMarkets: Market[]) => {
    const previousMap = new Map(previousMarkets.map(m => [m.marketAddress, m]))

    currentMarkets.forEach((current) => {
      const previous = previousMap.get(current.marketAddress)
      if (previous) {
        const prevParticipants = Number(previous.participantsCount || 0)
        const currParticipants = Number(current.participantsCount || 0)

        if (currParticipants > prevParticipants) {
          const cooldownKey = `participant-${current.marketAddress}-${currParticipants}`
          if (!isInCooldown(cooldownKey)) {
            const newParticipantCount = currParticipants - prevParticipants
            marketToast.newParticipant(newParticipantCount)
            addToCooldown(cooldownKey, 120000) // 2 minutes
            onNewParticipant?.(current.marketAddress, newParticipantCount)
            invalidateMarketCache(current.marketAddress)
          }
        }
      }
    })
  }, [isInCooldown, addToCooldown, onNewParticipant, invalidateMarketCache])

  /**
   * Detect and notify about resolved markets
   */
  const detectResolvedMarkets = useCallback((currentMarkets: Market[], previousMarkets: Market[]) => {
    const previousMap = new Map(previousMarkets.map(m => [m.marketAddress, m]))

    currentMarkets.forEach((current) => {
      const previous = previousMap.get(current.marketAddress)
      if (previous && !previous.resolved && current.resolved) {
        const cooldownKey = `resolved-${current.marketAddress}`
        if (!isInCooldown(cooldownKey)) {
          marketToast.marketResolved()
          addToCooldown(cooldownKey, 600000) // 10 minutes
          onMarketResolved?.(current)
          invalidateMarketCache(current.marketAddress)
        }
      }
    })
  }, [isInCooldown, addToCooldown, onMarketResolved, invalidateMarketCache])

  /**
   * Detect and notify about markets starting soon
   */
  const detectMarketsStartingSoon = useCallback((currentMarkets: Market[]) => {
    const now = Math.floor(Date.now() / 1000)
    const oneHourFromNow = now + 3600

    currentMarkets.forEach((market) => {
      const startTime = Number(market.startTime || 0)
      if (!market.resolved && startTime > now && startTime <= oneHourFromNow) {
        const cooldownKey = `starting-${market.marketAddress}`
        if (!isInCooldown(cooldownKey)) {
          const minutesUntilStart = Math.floor((startTime - now) / 60)
          if (minutesUntilStart <= 60 && minutesUntilStart > 0) {
            marketToast.marketStarting(minutesUntilStart)
            addToCooldown(cooldownKey, 1800000) // 30 minutes
          }
        }
      }
    })
  }, [isInCooldown, addToCooldown])

  /**
   * Detect general market updates (pool size, status changes, etc.)
   */
  const detectMarketUpdates = useCallback((currentMarkets: Market[], previousMarkets: Market[]) => {
    const previousMap = new Map(previousMarkets.map(m => [m.marketAddress, m]))
    const now = Date.now()

    // Only check for updates if enough time has passed since last update
    if (now - lastUpdateRef.current < 5000)
      return // Minimum 5 seconds between update notifications

    currentMarkets.forEach((current) => {
      const previous = previousMap.get(current.marketAddress)
      if (previous) {
        // Check for significant pool size changes (>10% increase)
        const prevPool = Number(previous.totalPool || 0)
        const currPool = Number(current.totalPool || 0)
        const poolIncrease = currPool - prevPool
        const poolIncreasePercent = prevPool > 0 ? (poolIncrease / prevPool) * 100 : 0

        if (poolIncreasePercent > 10 && poolIncrease > 0) {
          const cooldownKey = `pool-update-${current.marketAddress}`
          if (!isInCooldown(cooldownKey)) {
            onMarketUpdate?.(current.marketAddress)
            addToCooldown(cooldownKey, 60000) // 1 minute
            lastUpdateRef.current = now
          }
        }

        // Check for status changes
        if (previous.status !== current.status) {
          const cooldownKey = `status-${current.marketAddress}-${current.status}`
          if (!isInCooldown(cooldownKey)) {
            onMarketUpdate?.(current.marketAddress)
            addToCooldown(cooldownKey, 30000) // 30 seconds
            invalidateMarketCache(current.marketAddress)
          }
        }
      }
    })
  }, [isInCooldown, addToCooldown, onMarketUpdate, invalidateMarketCache])

  /**
   * Main effect to detect changes and trigger notifications
   */
  useEffect(() => {
    if (!enabled || markets.length === 0)
      return

    const previousMarkets = previousMarketsRef.current
    const currentMarkets = markets

    // Skip if no previous data (initial load)
    if (previousMarkets.length === 0) {
      previousMarketsRef.current = currentMarkets
      return
    }

    // Detect various types of changes
    detectNewMarkets(currentMarkets, previousMarkets)
    detectNewParticipants(currentMarkets, previousMarkets)
    detectResolvedMarkets(currentMarkets, previousMarkets)
    detectMarketsStartingSoon(currentMarkets)
    detectMarketUpdates(currentMarkets, previousMarkets)

    // Update previous markets reference
    previousMarketsRef.current = currentMarkets
  }, [
    enabled,
    markets,
    detectNewMarkets,
    detectNewParticipants,
    detectResolvedMarkets,
    detectMarketsStartingSoon,
    detectMarketUpdates,
  ])

  /**
   * Clear cooldowns on unmount
   */
  useEffect(() => {
    return () => {
      notificationCooldownRef.current.clear()
    }
  }, [])

  return {
    clearCooldowns: () => notificationCooldownRef.current.clear(),
    isInCooldown,
    addToCooldown,
  }
}
