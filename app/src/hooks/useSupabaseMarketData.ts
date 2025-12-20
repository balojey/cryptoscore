/**
 * Supabase Market Data Hooks
 *
 * Replaces Solana-based market data fetching with Supabase database queries
 * while maintaining the same interface and data structure.
 */

import { useQuery } from '@tanstack/react-query'
import { MarketService } from '../lib/supabase/market-service'
import { DatabaseService } from '../lib/supabase/database-service'
import { UserService } from '../lib/supabase/user-service'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import { queryKeys, prefetchHelpers } from '../config/query-client'

export interface Participant {
  user: string
  prediction: 'Home' | 'Draw' | 'Away'
  amount: number
}

export interface MarketData {
  marketAddress: string // Using market ID as address for compatibility
  creator: string
  matchId: string
  entryFee: number
  kickoffTime: number // Derived from match data
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

// Helper to convert Supabase status to expected format
function parseMarketStatus(status: 'active' | 'resolved' | 'cancelled'): 'Open' | 'Live' | 'Resolved' | 'Cancelled' {
  switch (status) {
    case 'active': return 'Open'
    case 'resolved': return 'Resolved'
    case 'cancelled': return 'Cancelled'
    default: return 'Open'
  }
}

// Helper to convert outcome string to expected format
function parseOutcome(outcome: string | null): 'Home' | 'Draw' | 'Away' | null {
  if (!outcome) return null
  return outcome as 'Home' | 'Draw' | 'Away'
}

/**
 * Hook for fetching detailed information for a specific market
 */
export function useSupabaseMarketData(marketId?: string) {
  return useQuery({
    queryKey: queryKeys.markets.detail(marketId || ''),
    queryFn: async (): Promise<MarketData | null> => {
      if (!marketId) {
        return null
      }

      try {
        // Get market data
        const market = await MarketService.getMarketById(marketId)
        if (!market) {
          console.warn('Market not found:', marketId)
          return null
        }

        // Get market statistics
        const stats = await MarketService.getMarketStats(marketId)

        // Convert end_time to Unix timestamp
        const endTime = Math.floor(new Date(market.end_time).getTime() / 1000)
        
        // For kickoff time, we'll use a reasonable default since it's not stored in our schema
        // In a real implementation, this would come from the match data
        const kickoffTime = endTime - (2 * 60 * 60) // 2 hours before end time

        return {
          marketAddress: market.id,
          creator: market.creator_id,
          matchId: marketId, // Using market ID as match ID for now
          entryFee: market.entry_fee,
          kickoffTime,
          endTime,
          status: parseMarketStatus(market.status),
          outcome: parseOutcome(market.resolution_outcome),
          totalPool: market.total_pool,
          participantCount: stats.totalParticipants,
          homeCount: stats.homeCount,
          drawCount: stats.drawCount,
          awayCount: stats.awayCount,
          isPublic: true, // All markets are public in current schema
        }
      }
      catch (error) {
        console.error('Error fetching market details:', error)
        return null
      }
    },
    enabled: !!marketId,
    staleTime: 1000 * 60 * 2, // 2 minutes - market details change less frequently
    gcTime: 1000 * 60 * 10, // 10 minutes cache time
  })
}

/**
 * Hook for fetching all markets
 */
export function useSupabaseAllMarkets() {
  return useQuery({
    queryKey: queryKeys.markets.list({}),
    queryFn: async (): Promise<MarketData[]> => {
      try {
        // Fetch all markets
        const markets = await MarketService.getMarkets({
          limit: 100, // Reasonable limit
        })

        // Convert to expected format
        const marketData: MarketData[] = []

        for (const market of markets) {
          try {
            // Get market statistics
            const stats = await MarketService.getMarketStats(market.id)

            // Convert timestamps
            const endTime = Math.floor(new Date(market.end_time).getTime() / 1000)
            const kickoffTime = endTime - (2 * 60 * 60) // 2 hours before end time

            marketData.push({
              marketAddress: market.id,
              creator: market.creator_id,
              matchId: market.id, // Using market ID as match ID
              entryFee: market.entry_fee,
              kickoffTime,
              endTime,
              status: parseMarketStatus(market.status),
              outcome: parseOutcome(market.resolution_outcome),
              totalPool: market.total_pool,
              participantCount: stats.totalParticipants,
              homeCount: stats.homeCount,
              drawCount: stats.drawCount,
              awayCount: stats.awayCount,
              isPublic: true,
            })
          }
          catch (statsError) {
            console.warn('Failed to get stats for market:', market.id, statsError)
            // Skip markets that fail to get stats
          }
        }

        // Sort by creation time (newest first)
        marketData.sort((a, b) => b.endTime - a.endTime)

        return marketData
      }
      catch (error) {
        console.error('Error fetching all markets:', error)
        return []
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - market lists change less frequently
    gcTime: 1000 * 60 * 15, // 15 minutes cache time
  })
}

/**
 * Hook for fetching markets for a specific user
 * Returns markets where user is either creator OR participant
 */
export function useSupabaseUserMarkets(userAddress?: string) {
  const { publicKey } = useUnifiedWallet()

  return useQuery({
    queryKey: ['markets', 'user', userAddress],
    queryFn: async (): Promise<MarketData[]> => {
      if (!userAddress) {
        return []
      }

      try {
        // Get user from Supabase by wallet address
        const user = await UserService.getUserByWalletAddress(userAddress)
        if (!user) {
          return []
        }

        // Get markets created by user
        const createdMarkets = await MarketService.getUserCreatedMarkets(user.id)
        
        // Get markets where user participated
        const participatedMarkets = await MarketService.getUserParticipatedMarkets(user.id)

        // Combine and deduplicate
        const allMarkets = new Map<string, any>()
        
        // Add created markets
        for (const market of createdMarkets) {
          allMarkets.set(market.id, market)
        }
        
        // Add participated markets
        for (const marketWithParticipation of participatedMarkets) {
          allMarkets.set(marketWithParticipation.id, marketWithParticipation)
        }

        // Convert to expected format
        const userMarkets: MarketData[] = []

        for (const market of allMarkets.values()) {
          try {
            // Get market statistics
            const stats = await MarketService.getMarketStats(market.id)

            // Convert timestamps
            const endTime = Math.floor(new Date(market.end_time).getTime() / 1000)
            const kickoffTime = endTime - (2 * 60 * 60)

            userMarkets.push({
              marketAddress: market.id,
              creator: market.creator_id,
              matchId: market.id,
              entryFee: market.entry_fee,
              kickoffTime,
              endTime,
              status: parseMarketStatus(market.status),
              outcome: parseOutcome(market.resolution_outcome),
              totalPool: market.total_pool,
              participantCount: stats.totalParticipants,
              homeCount: stats.homeCount,
              drawCount: stats.drawCount,
              awayCount: stats.awayCount,
              isPublic: true,
            })
          }
          catch (statsError) {
            console.warn('Failed to get stats for user market:', market.id, statsError)
          }
        }

        // Sort by end time (newest first)
        userMarkets.sort((a, b) => b.endTime - a.endTime)

        return userMarkets
      }
      catch (error) {
        console.error('Error fetching user markets:', error)
        return []
      }
    },
    enabled: !!userAddress,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching markets where user has made a prediction (has Participant record)
 */
export function useSupabaseUserParticipantMarkets(userAddress?: string) {
  return useQuery({
    queryKey: ['markets', 'participant', userAddress],
    queryFn: async (): Promise<MarketData[]> => {
      if (!userAddress) {
        return []
      }

      try {
        // Get user from Supabase by wallet address
        const user = await UserService.getUserByWalletAddress(userAddress)
        if (!user) {
          return []
        }

        // Get markets where user participated
        const participatedMarkets = await MarketService.getUserParticipatedMarkets(user.id)

        // Convert to expected format
        const participantMarkets: MarketData[] = []

        for (const marketWithParticipation of participatedMarkets) {
          try {
            // Get market statistics
            const stats = await MarketService.getMarketStats(marketWithParticipation.id)

            // Convert timestamps
            const endTime = Math.floor(new Date(marketWithParticipation.end_time).getTime() / 1000)
            const kickoffTime = endTime - (2 * 60 * 60)

            participantMarkets.push({
              marketAddress: marketWithParticipation.id,
              creator: marketWithParticipation.creator_id,
              matchId: marketWithParticipation.id,
              entryFee: marketWithParticipation.entry_fee,
              kickoffTime,
              endTime,
              status: parseMarketStatus(marketWithParticipation.status),
              outcome: parseOutcome(marketWithParticipation.resolution_outcome),
              totalPool: marketWithParticipation.total_pool,
              participantCount: stats.totalParticipants,
              homeCount: stats.homeCount,
              drawCount: stats.drawCount,
              awayCount: stats.awayCount,
              isPublic: true,
            })
          }
          catch (statsError) {
            console.warn('Failed to get stats for participant market:', marketWithParticipation.id, statsError)
          }
        }

        // Sort by end time (newest first)
        participantMarkets.sort((a, b) => b.endTime - a.endTime)

        return participantMarkets
      }
      catch (error) {
        console.error('Error fetching participant markets:', error)
        return []
      }
    },
    enabled: !!userAddress,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching user statistics
 */
export function useSupabaseUserStats(userAddress?: string) {
  return useQuery({
    queryKey: ['user', 'stats', userAddress],
    queryFn: async () => {
      if (!userAddress) {
        return null
      }

      try {
        // Get user from Supabase by wallet address
        const user = await UserService.getUserByWalletAddress(userAddress)
        if (!user) {
          return null
        }

        // Get user portfolio summary
        const portfolio = await UserService.getUserPortfolio(user.id)

        return {
          user: userAddress,
          totalMarkets: portfolio.totalMarkets,
          totalWins: Math.floor(portfolio.totalMarkets * portfolio.winRate), // Approximate wins
          totalEarnings: portfolio.totalWinnings,
          currentStreak: 0, // Not implemented in current schema
        }
      }
      catch (error) {
        console.error('Error fetching user stats:', error)
        return null
      }
    },
    enabled: !!userAddress,
    staleTime: 30000, // 30 seconds
  })
}

// Export aliases for backward compatibility
export const useMarketData = useSupabaseMarketData
export const useAllMarkets = useSupabaseAllMarkets
export const useUserMarkets = useSupabaseUserMarkets
export const useUserParticipantMarkets = useSupabaseUserParticipantMarkets
export const useUserStats = useSupabaseUserStats