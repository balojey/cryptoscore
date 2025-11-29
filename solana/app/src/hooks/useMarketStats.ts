import { useQuery } from '@tanstack/react-query'
import { useSolanaProgram } from './useSolanaProgram'

export interface MarketStats {
  totalMarkets: number
  openMarkets: number
  liveMarkets: number
  resolvedMarkets: number
  totalParticipants: number
  totalVolume: number // in lamports
}

/**
 * Hook for fetching aggregated market statistics from the Dashboard program
 * Uses the getMarketStats instruction which returns AggregatedStats
 */
export function useMarketStats() {
  const { dashboardProgram, isReady } = useSolanaProgram()

  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async (): Promise<MarketStats> => {
      if (!dashboardProgram || !isReady) {
        return {
          totalMarkets: 0,
          openMarkets: 0,
          liveMarkets: 0,
          resolvedMarkets: 0,
          totalParticipants: 0,
          totalVolume: 0,
        }
      }

      try {
        // Call the getMarketStats instruction
        // This is a view-only call that doesn't require accounts
        const stats = await dashboardProgram.methods
          .getMarketStats()
          .view()

        return {
          totalMarkets: stats.totalMarkets,
          openMarkets: stats.openMarkets,
          liveMarkets: stats.liveMarkets,
          resolvedMarkets: stats.resolvedMarkets,
          totalParticipants: stats.totalParticipants,
          totalVolume: Number(stats.totalVolume),
        }
      }
      catch (error) {
        console.error('Error fetching market stats:', error)
        // Return zeros on error to prevent UI breaking
        return {
          totalMarkets: 0,
          openMarkets: 0,
          liveMarkets: 0,
          resolvedMarkets: 0,
          totalParticipants: 0,
          totalVolume: 0,
        }
      }
    },
    enabled: isReady && !!dashboardProgram,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
