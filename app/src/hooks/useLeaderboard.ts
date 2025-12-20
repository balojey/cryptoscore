/**
 * useLeaderboard - Hook for fetching leaderboard data (Web2 Migration)
 *
 * This hook previously fetched leaderboard data from Solana blockchain.
 * Now it's a stub that will be replaced with Supabase operations.
 */

import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

export interface UserStatsData {
  user: string
  totalMarkets: number
  totalWins: number
  totalEarnings: number
  currentStreak: number
  winRate: number
  netProfit: number
  totalWagered: number
  totalWon: number
}

/**
 * Hook for fetching leaderboard data (stub)
 */
export function useLeaderboard() {
  const fetchLeaderboardData = useCallback(async (): Promise<UserStatsData[]> => {
    // TODO: Implement Supabase leaderboard data fetching
    console.log('Fetching leaderboard data')
    return []
  }, [])

  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboardData,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  })
}