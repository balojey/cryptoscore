import type { FilterOptions } from '../components/market/MarketFilters'
import type { Market, MarketDashboardInfo } from '../types'
import { useMemo } from 'react'

export function useFilteredMarkets<T extends Market | MarketDashboardInfo>(markets: T[], filters: FilterOptions): T[] {
  return useMemo(() => {
    if (!markets || markets.length === 0)
      return []

    let filtered = [...markets]

    // Filter by status
    if (filters.status !== 'all') {
      const now = new Date()

      filtered = filtered.filter((market) => {
        const startTime = new Date(Number(market.startTime) * 1000)
        const isLive = now > startTime && !market.resolved

        switch (filters.status) {
          case 'open':
            return !market.resolved && now <= startTime
          case 'live':
            return isLive
          case 'resolved':
            return market.resolved
          default:
            return true
        }
      })
    }

    // Filter by public/private
    if (filters.isPublic !== undefined) {
      filtered = filtered.filter(market => market.isPublic === filters.isPublic)
    }

    // Filter by time range (when market starts - future markets)
    if (filters.timeRange && filters.timeRange !== 'all') {
      const now = Date.now() / 1000
      const dayInSeconds = 86400

      filtered = filtered.filter((market) => {
        const marketTime = Number(market.startTime)
        const timeUntilStart = marketTime - now

        // Only show markets that haven't started yet or started recently
        switch (filters.timeRange) {
          case 'today':
            // Markets starting within next 24 hours or started in last 24 hours
            return timeUntilStart <= dayInSeconds && timeUntilStart >= -dayInSeconds
          case 'week':
            // Markets starting within next 7 days or started in last 7 days
            return timeUntilStart <= dayInSeconds * 7 && timeUntilStart >= -dayInSeconds * 7
          case 'month':
            // Markets starting within next 30 days or started in last 30 days
            return timeUntilStart <= dayInSeconds * 30 && timeUntilStart >= -dayInSeconds * 30
          default:
            return true
        }
      })
    }

    // Filter by pool size
    if (filters.minPoolSize !== undefined) {
      filtered = filtered.filter((market) => {
        const poolSize = Number(market.entryFee) * Number(market.participantsCount)
        return poolSize >= filters.minPoolSize! * 1e18 // Convert to wei
      })
    }

    // Filter by entry fee
    if (filters.minEntryFee !== undefined) {
      filtered = filtered.filter((market) => {
        const entryFee = Number(market.entryFee) / 1e18 // Convert from wei
        return entryFee >= filters.minEntryFee!
      })
    }

    // Sort markets
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return Number(b.startTime) - Number(a.startTime)

        case 'ending-soon': {
          const now = Date.now() / 1000
          const aTimeLeft = Number(a.startTime) - now
          const bTimeLeft = Number(b.startTime) - now

          // Only consider markets that haven't started yet
          if (aTimeLeft > 0 && bTimeLeft > 0) {
            return aTimeLeft - bTimeLeft
          }
          if (aTimeLeft > 0)
            return -1
          if (bTimeLeft > 0)
            return 1
          return 0
        }

        case 'highest-pool': {
          const aPool = Number(a.entryFee) * Number(a.participantsCount)
          const bPool = Number(b.entryFee) * Number(b.participantsCount)
          return bPool - aPool
        }

        case 'most-participants':
          return Number(b.participantsCount) - Number(a.participantsCount)

        default:
          return 0
      }
    })

    return filtered
  }, [markets, filters])
}
