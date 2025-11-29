import type { Market } from '../types'
import { useQuery } from '@tanstack/react-query'
import { useSolanaProgram } from './useSolanaProgram'

/**
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

  const { dashboardProgram, isReady } = useSolanaProgram()

  return useQuery({
    queryKey: ['markets', 'all', filterStatus, filterVisibility, sortBy, page, pageSize],
    queryFn: async (): Promise<Market[]> => {
      if (!dashboardProgram || !isReady) {
        return []
      }

      try {
        // Map sortBy string to enum format expected by the program
        const sortOption = { [sortBy.charAt(0).toLowerCase() + sortBy.slice(1)]: {} }

        // Call the getAllMarkets instruction
        const marketSummaries = await dashboardProgram.methods
          .getAllMarkets(
            filterStatus, // null or status number (0=Open, 1=Live, 2=Resolved, 3=Cancelled)
            filterVisibility, // null or boolean (true=public only, false=private only)
            sortOption, // { creationTime: {} } | { poolSize: {} } | { participantCount: {} } | { endingSoon: {} }
            page,
            pageSize,
          )
          .view()

        // Transform MarketSummary to Market type
        const markets: Market[] = marketSummaries.map((summary) => {
          // Parse matchId from string to bigint
          const matchId = BigInt(summary.matchId)

          return {
            marketAddress: summary.marketAddress.toString(),
            matchId,
            entryFee: BigInt(summary.entryFee.toString()),
            creator: summary.creator.toString(),
            participantsCount: BigInt(summary.participantCount),
            resolved: summary.status === 2, // Status 2 = Resolved
            isPublic: summary.isPublic,
            startTime: BigInt(summary.kickoffTime.toString()),
            homeCount: BigInt(summary.homeCount),
            awayCount: BigInt(summary.awayCount),
            drawCount: BigInt(summary.drawCount),
          }
        })

        return markets
      }
      catch (error) {
        console.error('Error fetching all markets:', error)
        return []
      }
    },
    enabled: enabled && isReady && !!dashboardProgram,
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook for fetching featured/public markets only
 * Convenience wrapper around useAllMarketsQuery
 */
export function useFeaturedMarkets(options: {
  sortBy?: 'CreationTime' | 'PoolSize' | 'ParticipantCount' | 'EndingSoon'
  pageSize?: number
  enabled?: boolean
} = {}) {
  return useAllMarketsQuery({
    filterStatus: 0, // Only open markets
    filterVisibility: true, // Only public markets
    sortBy: options.sortBy || 'EndingSoon',
    page: 0,
    pageSize: options.pageSize || 6,
    enabled: options.enabled,
  })
}
