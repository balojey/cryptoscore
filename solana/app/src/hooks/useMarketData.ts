import { useQuery } from '@tanstack/react-query'
// import { PublicKey } from '@solana/web3.js'
import { useSolanaProgram } from './useSolanaProgram'

export interface MarketData {
  marketAddress: string
  creator: string
  matchId: string
  entryFee: number
  kickoffTime: number
  endTime: number
  status: 'Open' | 'Live' | 'Resolved' | 'Cancelled'
  outcome: 'Home' | 'Draw' | 'Away' | null
  totalPool: number
  participantCount: number
  homeCount: number
  drawCount: number
  awayCount: number
  isPublic: boolean
}

/**
 * Hook for fetching market data from the Dashboard Program
 * Provides methods to query all markets, user markets, and specific market details
 */
export function useMarketData() {
  const { dashboardProgram, isReady } = useSolanaProgram()

  /**
   * Fetch all markets with pagination
   */
  const useAllMarkets = (page = 0, pageSize = 50) => {
    return useQuery({
      queryKey: ['markets', 'all', page, pageSize],
      queryFn: async (): Promise<MarketData[]> => {
        if (!dashboardProgram || !isReady) {
          return []
        }

        // TODO: Implement after Dashboard Program is deployed
        // Call get_all_markets instruction with pagination
        // const markets = await dashboardProgram.methods
        //   .getAllMarkets(page, pageSize)
        //   .accounts({})
        //   .view()

        // For now, return empty array
        return []
      },
      enabled: isReady && !!dashboardProgram,
      staleTime: 10000, // 10 seconds
      refetchInterval: 10000, // Refetch every 10 seconds
    })
  }

  /**
   * Fetch markets for a specific user
   */
  const useUserMarkets = (userAddress?: string) => {
    return useQuery({
      queryKey: ['markets', 'user', userAddress],
      queryFn: async (): Promise<MarketData[]> => {
        if (!dashboardProgram || !isReady || !userAddress) {
          return []
        }

        // TODO: Implement after Dashboard Program is deployed
        // Call get_user_markets instruction
        // const userPubkey = new PublicKey(userAddress)
        // const markets = await dashboardProgram.methods
        //   .getUserMarkets(userPubkey)
        //   .accounts({})
        //   .view()

        // For now, return empty array
        return []
      },
      enabled: isReady && !!dashboardProgram && !!userAddress,
      staleTime: 10000,
      refetchInterval: 10000,
    })
  }

  /**
   * Fetch detailed information for a specific market
   */
  const useMarketDetails = (marketAddress?: string) => {
    return useQuery({
      queryKey: ['market', 'details', marketAddress],
      queryFn: async (): Promise<MarketData | null> => {
        if (!dashboardProgram || !isReady || !marketAddress) {
          return null
        }

        // TODO: Implement after Dashboard Program is deployed
        // Call get_market_details instruction
        // const marketPubkey = new PublicKey(marketAddress)
        // const market = await dashboardProgram.methods
        //   .getMarketDetails(marketPubkey)
        //   .accounts({})
        //   .view()

        // For now, return null
        return null
      },
      enabled: isReady && !!dashboardProgram && !!marketAddress,
      staleTime: 5000,
      refetchInterval: 5000,
    })
  }

  /**
   * Fetch user statistics
   */
  const useUserStats = (userAddress?: string) => {
    return useQuery({
      queryKey: ['user', 'stats', userAddress],
      queryFn: async () => {
        if (!dashboardProgram || !isReady || !userAddress) {
          return null
        }

        // TODO: Implement after Dashboard Program is deployed
        // Fetch UserStats account for the user
        // const userPubkey = new PublicKey(userAddress)
        // const [userStatsPda] = PublicKey.findProgramAddressSync(
        //   [Buffer.from('user_stats'), userPubkey.toBuffer()],
        //   dashboardProgram.programId
        // )
        // const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda)

        // For now, return null
        return null
      },
      enabled: isReady && !!dashboardProgram && !!userAddress,
      staleTime: 30000, // 30 seconds
    })
  }

  return {
    useAllMarkets,
    useUserMarkets,
    useMarketDetails,
    useUserStats,
  }
}
