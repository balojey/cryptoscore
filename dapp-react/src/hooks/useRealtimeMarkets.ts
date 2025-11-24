import type { Market } from '../types'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface RealtimeOptions {
  enabled?: boolean
  interval?: number
  onUpdate?: () => void
  markets?: Market[]
}

export function useRealtimeMarkets(options: RealtimeOptions = {}) {
  const { enabled = true, interval = 10000, onUpdate, markets = [] } = options
  const queryClient = useQueryClient()
  const previousMarketsRef = useRef<Market[]>([])
  const notificationCooldownRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!enabled)
      return

    const intervalId = setInterval(() => {
      // Invalidate all market-related queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['readContract'] })

      onUpdate?.()
    }, interval)

    return () => clearInterval(intervalId)
  }, [enabled, interval, queryClient, onUpdate])

  // Detect significant market events and show toast notifications
  useEffect(() => {
    if (!enabled || markets.length === 0 || previousMarketsRef.current.length === 0)
      return

    const previousMarkets = previousMarketsRef.current
    const currentMarkets = markets

    // Create map for quick lookup
    const previousMap = new Map(previousMarkets.map(m => [m.marketAddress, m]))

    // Detect new markets
    const newMarkets = currentMarkets.filter(m => !previousMap.has(m.marketAddress))
    if (newMarkets.length > 0 && newMarkets.length <= 3) {
      newMarkets.forEach((market) => {
        const cooldownKey = `new-${market.marketAddress}`
        if (!notificationCooldownRef.current.has(cooldownKey)) {
          marketToast.newMarket()
          notificationCooldownRef.current.add(cooldownKey)
          // Remove from cooldown after 5 minutes
          setTimeout(() => notificationCooldownRef.current.delete(cooldownKey), 300000)
        }
      })
    }

    // Detect markets with new participants
    currentMarkets.forEach((current) => {
      const previous = previousMap.get(current.marketAddress)
      if (previous) {
        const prevParticipants = Number(previous.participantsCount)
        const currParticipants = Number(current.participantsCount)

        // New participant joined
        if (currParticipants > prevParticipants) {
          const cooldownKey = `join-${current.marketAddress}-${currParticipants}`
          if (!notificationCooldownRef.current.has(cooldownKey)) {
            marketToast.newParticipant(currParticipants - prevParticipants)
            notificationCooldownRef.current.add(cooldownKey)
            // Remove from cooldown after 2 minutes
            setTimeout(() => notificationCooldownRef.current.delete(cooldownKey), 120000)
          }
        }
      }
    })

    // Detect resolved markets
    currentMarkets.forEach((current) => {
      const previous = previousMap.get(current.marketAddress)
      if (previous && !previous.resolved && current.resolved) {
        const cooldownKey = `resolve-${current.marketAddress}`
        if (!notificationCooldownRef.current.has(cooldownKey)) {
          marketToast.marketResolved()
          notificationCooldownRef.current.add(cooldownKey)
          // Remove from cooldown after 10 minutes
          setTimeout(() => notificationCooldownRef.current.delete(cooldownKey), 600000)
        }
      }
    })

    // Detect markets starting soon (within 1 hour)
    const now = Math.floor(Date.now() / 1000)
    const oneHourFromNow = now + 3600
    currentMarkets.forEach((market) => {
      const startTime = Number(market.startTime)
      if (!market.resolved && startTime > now && startTime <= oneHourFromNow) {
        const cooldownKey = `starting-${market.marketAddress}`
        if (!notificationCooldownRef.current.has(cooldownKey)) {
          const minutesUntilStart = Math.floor((startTime - now) / 60)
          if (minutesUntilStart <= 60 && minutesUntilStart > 0) {
            marketToast.marketStarting(minutesUntilStart)
            notificationCooldownRef.current.add(cooldownKey)
            // Remove from cooldown after 30 minutes
            setTimeout(() => notificationCooldownRef.current.delete(cooldownKey), 1800000)
          }
        }
      }
    })
  }, [enabled, markets])

  // Update previous markets reference
  useEffect(() => {
    if (markets.length > 0) {
      previousMarketsRef.current = markets
    }
  }, [markets])

  return {
    isPolling: enabled,
    interval,
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

  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
    })
  },
}
