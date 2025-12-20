/**
 * Market Data Hook (Web2 Migration)
 * 
 * This hook previously fetched market data from Solana blockchain.
 * Now it's a stub that will be replaced with Supabase operations.
 */

import { useQuery } from '@tanstack/react-query'

export interface Participant {
  id: string // UUID from Supabase
  user_id: string // User UUID
  prediction: 'Home' | 'Draw' | 'Away'
  entry_amount: number
  potential_winnings: number
  actual_winnings?: number | null
  joined_at: string // ISO timestamp
}

export interface MarketData {
  id: string // UUID from Supabase
  creator_id: string // User UUID
  matchId: string
  title: string
  description: string
  entry_fee: number
  end_time: string // ISO timestamp
  status: 'active' | 'resolved' | 'cancelled'
  resolution_outcome: 'Home' | 'Draw' | 'Away' | null
  total_pool: number
  platform_fee_percentage: number
  created_at: string
  updated_at: string
  participantCount: number
  homeCount: number
  drawCount: number
  awayCount: number
  participants?: Participant[]
}

/**
 * Hook for fetching detailed information for a specific market (stub)
 */
export function useMarketData(marketId?: string) {
  return useQuery({
    queryKey: ['market', 'details', marketId],
    queryFn: async (): Promise<MarketData | null> => {
      if (!marketId) {
        return null
      }

      // TODO: Implement Supabase market data fetching
      console.log('Fetching market data for:', marketId)
      
      // Return mock data for now
      return {
        id: marketId,
        creator_id: 'mock_creator_uuid',
        matchId: 'mock_match',
        title: 'Mock Market',
        description: 'Mock market description',
        entry_fee: 1.0,
        end_time: new Date(Date.now() + 7200000).toISOString(),
        status: 'active',
        resolution_outcome: null,
        total_pool: 5.0,
        platform_fee_percentage: 0.05,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        participantCount: 5,
        homeCount: 2,
        drawCount: 1,
        awayCount: 2,
      }
    },
    enabled: !!marketId,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching all markets (stub)
 */
export function useAllMarkets() {
  return useQuery({
    queryKey: ['markets', 'all'],
    queryFn: async (): Promise<MarketData[]> => {
      // TODO: Implement Supabase all markets fetching
      console.log('Fetching all markets')
      return []
    },
    staleTime: 30000,
    refetchInterval: 30000,
  })
}

/**
 * Hook for fetching markets for a specific user (stub)
 */
export function useUserMarkets(userId?: string) {
  return useQuery({
    queryKey: ['markets', 'user', userId],
    queryFn: async (): Promise<MarketData[]> => {
      if (!userId) {
        return []
      }

      // TODO: Implement Supabase user markets fetching
      console.log('Fetching user markets for:', userId)
      return []
    },
    enabled: !!userId,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching markets where user has made a prediction (stub)
 */
export function useUserParticipantMarkets(userId?: string) {
  return useQuery({
    queryKey: ['markets', 'participant', userId],
    queryFn: async (): Promise<MarketData[]> => {
      if (!userId) {
        return []
      }

      // TODO: Implement Supabase participant markets fetching
      console.log('Fetching participant markets for:', userId)
      return []
    },
    enabled: !!userId,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching user statistics (stub)
 */
export function useUserStats(userId?: string) {
  return useQuery({
    queryKey: ['user', 'stats', userId],
    queryFn: async () => {
      if (!userId) {
        return null
      }

      // TODO: Implement Supabase user stats fetching
      console.log('Fetching user stats for:', userId)
      return {
        user_id: userId,
        totalMarkets: 0,
        totalWins: 0,
        totalEarnings: 0,
        currentStreak: 0,
      }
    },
    enabled: !!userId,
    staleTime: 30000,
  })
}