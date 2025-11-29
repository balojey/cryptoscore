import { useCallback, useRef } from 'react'
import { PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { DASHBOARD_PROGRAM_ID, DashboardIDL } from '../config/programs'

export interface UserStatsData {
  address: string
  totalMarkets: number
  wins: number
  losses: number
  totalWagered: bigint
  totalWon: bigint
  currentStreak: number
  bestStreak: number
  lastUpdated: bigint
  winRate: number
  netProfit: bigint
}

/**
 * Hook for fetching leaderboard data from UserStats accounts
 * Fetches all UserStats accounts from the Dashboard program
 */
export function useLeaderboard(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { connection } = useConnection()
  const wallet = useWallet()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000

  const fetchLeaderboardData = useCallback(async (): Promise<UserStatsData[]> => {
    try {
      // Rate limiting
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime.current
      if (timeSinceLastFetch < rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay - timeSinceLastFetch))
      }
      lastFetchTime.current = Date.now()

      console.log('Fetching leaderboard data from Dashboard program')

      // Create provider and program instance
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      const dashboardProgram = new Program(DashboardIDL as any, provider)

      // Fetch all UserStats accounts
      const userStatsAccounts = await (dashboardProgram.account as any).userStats.all()

      console.log('Fetched UserStats accounts:', userStatsAccounts.length)

      // Transform to UserStatsData
      const leaderboardData: UserStatsData[] = userStatsAccounts.map((account: any) => {
        const stats = account.account
        const totalMarkets = stats.totalMarkets
        const wins = stats.wins
        const losses = stats.losses
        const totalWagered = BigInt(stats.totalWagered.toString())
        const totalWon = BigInt(stats.totalWon.toString())
        
        // Calculate win rate
        const winRate = totalMarkets > 0 ? (wins / totalMarkets) * 100 : 0
        
        // Calculate net profit
        const netProfit = totalWon - totalWagered

        return {
          address: stats.user.toString(),
          totalMarkets,
          wins,
          losses,
          totalWagered,
          totalWon,
          currentStreak: stats.currentStreak,
          bestStreak: stats.bestStreak,
          lastUpdated: BigInt(stats.lastUpdated.toString()),
          winRate,
          netProfit,
        }
      })

      // Filter out users with no activity
      const activeUsers = leaderboardData.filter(user => user.totalMarkets > 0)

      console.log('Active users:', activeUsers.length)
      return activeUsers
    }
    catch (error) {
      const errorMessage = error?.toString() || ''
      
      // Handle rate limiting gracefully
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.warn('Rate limit hit on leaderboard data')
        return []
      }
      
      console.error('Error fetching leaderboard data:', error)
      throw error
    }
  }, [connection, wallet])

  return useQuery({
    queryKey: ['leaderboard', 'stats'],
    queryFn: fetchLeaderboardData,
    enabled,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook for fetching a specific user's stats
 */
export function useUserStats(userAddress?: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { connection } = useConnection()
  const wallet = useWallet()

  const fetchUserStats = useCallback(async (): Promise<UserStatsData | null> => {
    try {
      if (!userAddress) {
        return null
      }

      console.log('Fetching user stats for:', userAddress)

      // Create provider and program instance
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      const dashboardProgram = new Program(DashboardIDL as any, provider)

      // Derive UserStats PDA
      const userPubkey = new PublicKey(userAddress)
      const [userStatsPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_stats'), userPubkey.toBuffer()],
        new PublicKey(DASHBOARD_PROGRAM_ID)
      )

      // Fetch UserStats account
      const stats = await (dashboardProgram.account as any).userStats.fetch(userStatsPda)

      const totalMarkets = stats.totalMarkets
      const wins = stats.wins
      const losses = stats.losses
      const totalWagered = BigInt(stats.totalWagered.toString())
      const totalWon = BigInt(stats.totalWon.toString())
      
      // Calculate win rate
      const winRate = totalMarkets > 0 ? (wins / totalMarkets) * 100 : 0
      
      // Calculate net profit
      const netProfit = totalWon - totalWagered

      return {
        address: stats.user.toString(),
        totalMarkets,
        wins,
        losses,
        totalWagered,
        totalWon,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        lastUpdated: BigInt(stats.lastUpdated.toString()),
        winRate,
        netProfit,
      }
    }
    catch (error) {
      // Account might not exist yet
      console.warn('User stats not found for:', userAddress)
      return null
    }
  }, [connection, wallet, userAddress])

  return useQuery({
    queryKey: ['userStats', userAddress],
    queryFn: fetchUserStats,
    enabled: enabled && !!userAddress,
    staleTime: 15000, // 15 seconds
    retry: 1, // Only retry once for user stats
  })
}
