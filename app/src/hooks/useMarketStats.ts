/**
 * DEPRECATED: This hook uses Anchor framework which has been removed.
 *
 * Consider implementing an Anchor-free version by fetching and aggregating
 * market data using hooks/useMarketData.ts (useAllMarkets).
 */

import { useQuery } from '@tanstack/react-query'

export interface MarketStats {
  totalMarkets: number
  openMarkets: number
  liveMarkets: number
  resolvedMarkets: number
  totalParticipants: number
  totalVolume: number // in lamports
}

/**
 * @deprecated Anchor framework removed - implement using useAllMarkets instead
 * Hook for fetching aggregated market statistics from the Dashboard program
 * Uses the getMarketStats instruction which returns AggregatedStats
 */
export function useMarketStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<MarketStats> => {
      console.warn('useMarketStats: Anchor framework has been removed. Implement using useAllMarkets and aggregate data.')
      return {
        totalMarkets: 0,
        openMarkets: 0,
        liveMarkets: 0,
        resolvedMarkets: 0,
        totalParticipants: 0,
        totalVolume: 0,
      }
    },
    enabled: false, // Disabled since Anchor is removed
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
