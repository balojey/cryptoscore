/**
 * DEPRECATED: This hook uses Anchor framework which has been removed.
 *
 * Use hooks/useMarketData.ts (useAllMarkets) for Anchor-free market fetching.
 */

import type { Market } from '../types'
import { useQuery } from '@tanstack/react-query'

/**
 * @deprecated Use useAllMarkets from hooks/useMarketData.ts instead
 * Hook for fetching all markets from the Dashboard program
 * Uses the getAllMarkets instruction with filtering and sorting options
 */
export function useAllMarketsQuery(options: {
  filterStatus?: number | null
  filterVisibility?: boolean | null
  sortBy?: 'CreationTime' | 'PoolSize' | 'ParticipantCount' | 'EndingSoon'
  page?: number
  pageSize?: number
  enabled?: boolean
} = {}) {
  const {
    filterStatus = null,
    filterVisibility = null,
    sortBy = 'CreationTime',
    page = 0,
    pageSize = 100,
    enabled = true,
  } = options

  return useQuery({
    queryKey: ['markets', 'all', filterStatus, filterVisibility, sortBy, page, pageSize],
    queryFn: async (): Promise<Market[]> => {
      console.warn('useAllMarketsQuery: Anchor framework has been removed. Use useAllMarkets from hooks/useMarketData.ts instead.')
      return []
    },
    enabled: false, // Disabled since Anchor is removed
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * @deprecated Use useAllMarkets from hooks/useMarketData.ts instead
 * Hook for fetching featured/public markets only
 * Convenience wrapper around useAllMarketsQuery
 */
export function useFeaturedMarkets(options: {
  sortBy?: 'CreationTime' | 'PoolSize' | 'ParticipantCount' | 'EndingSoon'
  pageSize?: number
  enabled?: boolean
} = {}) {
  console.warn('useFeaturedMarkets: Anchor framework has been removed. Use useAllMarkets from hooks/useMarketData.ts instead.')
  return useAllMarketsQuery({
    filterStatus: 0, // Only open markets
    filterVisibility: true, // Only public markets
    sortBy: options.sortBy || 'EndingSoon',
    page: 0,
    pageSize: options.pageSize || 6,
    enabled: false, // Disabled since Anchor is removed
  })
}
