import { useQuery } from '@tanstack/react-query'
import { PublicKey } from '@solana/web3.js'
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

// Helper to convert status enum from IDL
function parseMarketStatus(status: number): 'Open' | 'Live' | 'Resolved' | 'Cancelled' {
  switch (status) {
    case 0: return 'Open'
    case 1: return 'Live'
    case 2: return 'Resolved'
    case 3: return 'Cancelled'
    default: return 'Open'
  }
}

// Helper to convert outcome enum from IDL
function parseOutcome(outcome: number | null): 'Home' | 'Draw' | 'Away' | null {
  if (outcome === null || outcome === undefined) return null
  switch (outcome) {
    case 0: return 'Home'
    case 1: return 'Draw'
    case 2: return 'Away'
    default: return null
  }
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

      try {
        const marketPubkey = new PublicKey(marketAddress)
        
        // Call getMarketDetails view function from Dashboard IDL
        const marketDetails = await dashboardProgram.methods
          .getMarketDetails(marketPubkey)
          .view()

        return {
          marketAddress: marketDetails.marketAddress.toString(),
          creator: marketDetails.creator.toString(),
          matchId: marketDetails.matchId,
          entryFee: marketDetails.entryFee.toNumber(),
          kickoffTime: marketDetails.kickoffTime.toNumber(),
          endTime: marketDetails.endTime.toNumber(),
          status: parseMarketStatus(marketDetails.status),
          outcome: parseOutcome(marketDetails.outcome),
          totalPool: marketDetails.totalPool.toNumber(),
          participantCount: marketDetails.participantCount,
          homeCount: marketDetails.homeCount,
          drawCount: marketDetails.drawCount,
          awayCount: marketDetails.awayCount,
          isPublic: marketDetails.isPublic,
        }
      } catch (error) {
        console.error('Error fetching market details:', error)
        return null
      }
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

      try {
        // Call getAllMarkets view function from Dashboard IDL
        // filterStatus: null (all statuses), filterVisibility: null (all), sortBy: CreationTime
        const marketSummaries = await dashboardProgram.methods
          .getAllMarkets(
            null, // filterStatus - null means all statuses
            null, // filterVisibility - null means all (public and private)
            { creationTime: {} }, // sortBy - sort by creation time (newest first)
            page,
            pageSize
          )
          .view()

        return marketSummaries.map((summary: any) => ({
          marketAddress: summary.marketAddress.toString(),
          creator: summary.creator.toString(),
          matchId: summary.matchId,
          entryFee: summary.entryFee.toNumber(),
          kickoffTime: summary.kickoffTime.toNumber(),
          endTime: summary.endTime.toNumber(),
          status: parseMarketStatus(summary.status),
          outcome: null, // Summary doesn't include outcome
          totalPool: summary.totalPool.toNumber(),
          participantCount: summary.participantCount,
          homeCount: summary.homeCount,
          drawCount: summary.drawCount,
          awayCount: summary.awayCount,
          isPublic: summary.isPublic,
        }))
      } catch (error) {
        console.error('Error fetching all markets:', error)
        return []
      }
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

      try {
        const userPubkey = new PublicKey(userAddress)
        
        // Call getUserMarkets view function from Dashboard IDL
        const marketSummaries = await dashboardProgram.methods
          .getUserMarkets(
            userPubkey,
            null, // filterStatus - null means all statuses
            { creationTime: {} }, // sortBy - sort by creation time
            0, // page
            100 // pageSize - get all user markets
          )
          .view()

        return marketSummaries.map((summary: any) => ({
          marketAddress: summary.marketAddress.toString(),
          creator: summary.creator.toString(),
          matchId: summary.matchId,
          entryFee: summary.entryFee.toNumber(),
          kickoffTime: summary.kickoffTime.toNumber(),
          endTime: summary.endTime.toNumber(),
          status: parseMarketStatus(summary.status),
          outcome: null,
          totalPool: summary.totalPool.toNumber(),
          participantCount: summary.participantCount,
          homeCount: summary.homeCount,
          drawCount: summary.drawCount,
          awayCount: summary.awayCount,
          isPublic: summary.isPublic,
        }))
      } catch (error) {
        console.error('Error fetching user markets:', error)
        return []
      }
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

      try {
        const userPubkey = new PublicKey(userAddress)
        
        // Derive UserStats PDA
        const [userStatsPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('user_stats'), userPubkey.toBuffer()],
          dashboardProgram.programId
        )
        
        // Fetch UserStats account
        const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda)

        return {
          user: userStats.user.toString(),
          totalMarkets: userStats.totalMarkets,
          wins: userStats.wins,
          losses: userStats.losses,
          totalWagered: userStats.totalWagered.toNumber(),
          totalWon: userStats.totalWon.toNumber(),
          currentStreak: userStats.currentStreak,
          bestStreak: userStats.bestStreak,
          lastUpdated: userStats.lastUpdated.toNumber(),
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
        // Return null if account doesn't exist yet (user hasn't participated in any markets)
        return null
      }
    },
    enabled: isReady && !!dashboardProgram && !!userAddress,
    staleTime: 30000, // 30 seconds
  })
}
