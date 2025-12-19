/**
 * DEPRECATED: This hook uses Anchor framework which has been removed.
 *
 * This hook is kept for backward compatibility but will not function correctly
 * without Anchor. Consider implementing an Anchor-free version using:
 * - lib/solana/account-decoder.ts for decoding UserStats accounts
 * - Connection.getProgramAccounts() for fetching all UserStats
 */

import { useConnection } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'

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
 * @deprecated Anchor framework removed - this hook will not function
 * Hook for fetching leaderboard data from UserStats accounts
 * Fetches all UserStats accounts from the Dashboard program
 */
export function useLeaderboard(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { connection } = useConnection()
  const wallet = useUnifiedWallet()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000

  const fetchLeaderboardData = useCallback(async (): Promise<UserStatsData[]> => {
    console.warn('useLeaderboard: Anchor framework has been removed. This hook will not function correctly.')
    console.warn('Please implement an Anchor-free version using lib/solana/account-decoder.ts')
    return []
  }, [connection, wallet])

  return useQuery({
    queryKey: ['leaderboard', 'stats'],
    queryFn: fetchLeaderboardData,
    enabled,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * @deprecated Anchor framework removed - this hook will not function
 * Hook for fetching a specific user's stats
 */
export function useUserStats(userAddress?: string, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { connection } = useConnection()
  const wallet = useUnifiedWallet()

  const fetchUserStats = useCallback(async (): Promise<UserStatsData | null> => {
    console.warn('useUserStats: Anchor framework has been removed. This hook will not function correctly.')
    return null
  }, [connection, wallet, userAddress])

  return useQuery({
    queryKey: ['userStats', userAddress],
    queryFn: fetchUserStats,
    enabled: enabled && !!userAddress,
    staleTime: 15000, // 15 seconds
    retry: 1, // Only retry once for user stats
  })
}
