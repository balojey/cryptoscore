/**
 * Market Data Hook (Web2 Migration)
 * 
 * This hook previously fetched market data from Solana blockchain.
 * Now it's a stub that will be replaced with Supabase operations.
 */

import { useQuery } from '@tanstack/react-query'

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
 * Hook for fetching detailed information for a specific market (stub)
 */
export function useMarketData(marketAddress?: string) {
  return useQuery({
    queryKey: ['market', 'details', marketAddress],
    queryFn: async (): Promise<MarketData | null> => {
      if (!marketAddress) {
        return null
      }

      // TODO: Implement Supabase market data fetching
      console.log('Fetching market data for:', marketAddress)
      
      // Return mock data for now
      return {
        marketAddress,
        creator: 'mock_creator',
        matchId: 'mock_match',
        entryFee: 1000000,
        kickoffTime: Date.now() + 3600000,
        endTime: Date.now() + 7200000,
        status: 'Open',
        outcome: null,
        totalPool: 5000000,
        participantCount: 5,
        homeCount: 2,
        drawCount: 1,
        awayCount: 2,
        isPublic: true,
      }
    },
    enabled: !!marketAddress,
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
export function useUserMarkets(userAddress?: string) {
  return useQuery({
    queryKey: ['markets', 'user', userAddress],
    queryFn: async (): Promise<MarketData[]> => {
      if (!userAddress) {
        return []
      }

      // TODO: Implement Supabase user markets fetching
      console.log('Fetching user markets for:', userAddress)
      return []
    },
    enabled: !!userAddress,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching markets where user has made a prediction (stub)
 */
export function useUserParticipantMarkets(userAddress?: string) {
  return useQuery({
    queryKey: ['markets', 'participant', userAddress],
    queryFn: async (): Promise<MarketData[]> => {
      if (!userAddress) {
        return []
      }

      // TODO: Implement Supabase participant markets fetching
      console.log('Fetching participant markets for:', userAddress)
      return []
    },
    enabled: !!userAddress,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching user statistics (stub)
 */
export function useUserStats(userAddress?: string) {
  return useQuery({
    queryKey: ['user', 'stats', userAddress],
    queryFn: async () => {
      if (!userAddress) {
        return null
      }

      // TODO: Implement Supabase user stats fetching
      console.log('Fetching user stats for:', userAddress)
      return {
        user: userAddress,
        totalMarkets: 0,
        totalWins: 0,
        totalEarnings: 0,
        currentStreak: 0,
      }
    },
    enabled: !!userAddress,
    staleTime: 30000,
  })
}