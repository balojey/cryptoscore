import { useQuery } from '@tanstack/react-query'
// import { PublicKey } from '@solana/web3.js'
import { useSolanaProgram } from './useSolanaProgram'

export interface Participant {
  user: string
  prediction: number
  amount: number
}

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
  participants?: Participant[]
}

/**
 * Hook for fetching detailed information for a specific market
 */
export function useMarketData(marketAddress?: string) {
  const { dashboardProgram, isReady } = useSolanaProgram()

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
 * Hook for fetching all markets with pagination
 */
export function useAllMarkets(page = 0, pageSize = 50) {
  const { dashboardProgram, isReady } = useSolanaProgram()

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
 * Hook for fetching markets for a specific user
 */
export function useUserMarkets(userAddress?: string) {
  const { dashboardProgram, isReady } = useSolanaProgram()

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
 * Hook for fetching user statistics
 */
export function useUserStats(userAddress?: string) {
  const { dashboardProgram, isReady } = useSolanaProgram()

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
