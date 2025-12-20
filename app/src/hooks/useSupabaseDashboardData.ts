/**
 * Supabase Dashboard Data Hook
 * 
 * Replaces useDashboardData.ts with Supabase-based data fetching
 * for portfolio and dashboard functionality using optimized queries.
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { DashboardQueries } from '@/lib/supabase/dashboard-queries'
import { DatabaseService } from '@/lib/supabase/database-service'
import type { DashboardMarketData, PortfolioStats } from '@/lib/supabase/dashboard-queries'
import type { Database } from '@/types/supabase'

type Market = Database['public']['Tables']['markets']['Row']
type Participant = Database['public']['Tables']['participants']['Row']

/**
 * Enhanced market data with participant information
 */
export interface SupabaseMarketDashboardInfo extends DashboardMarketData {
  participants: Participant[]
  homeCount: number
  drawCount: number
  awayCount: number
  participantsCount: number
}

export interface SupabaseDashboardData {
  createdMarkets: SupabaseMarketDashboardInfo[]
  joinedMarkets: SupabaseMarketDashboardInfo[]
  allInvolvedMarkets: SupabaseMarketDashboardInfo[]
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for fetching user dashboard data from Supabase with optimized queries
 * 
 * @param userId - User ID to fetch dashboard data for
 * @returns Dashboard data with created and joined markets
 */
export function useSupabaseDashboardData(userId?: string): SupabaseDashboardData {
  const { 
    data: dashboardData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['user-dashboard-data', userId],
    queryFn: async () => {
      if (!userId) return null
      return await DashboardQueries.getUserDashboardData(userId)
    },
    enabled: !!userId,
    staleTime: 30000, // Cache for 30 seconds
  })

  // Transform data to match expected interface
  const { createdMarkets, joinedMarkets, allInvolvedMarkets } = useMemo(() => {
    if (!dashboardData) {
      return {
        createdMarkets: [],
        joinedMarkets: [],
        allInvolvedMarkets: [],
      }
    }

    // Transform DashboardMarketData to SupabaseMarketDashboardInfo
    const transformMarket = (market: DashboardMarketData): SupabaseMarketDashboardInfo => ({
      ...market,
      participants: market.user_participation ? [market.user_participation] : [],
      homeCount: market.home_count,
      drawCount: market.draw_count,
      awayCount: market.away_count,
      participantsCount: market.participant_count,
    })

    return {
      createdMarkets: dashboardData.createdMarkets.map(transformMarket),
      joinedMarkets: dashboardData.joinedMarkets.map(transformMarket),
      allInvolvedMarkets: dashboardData.allInvolvedMarkets.map(transformMarket),
    }
  }, [dashboardData])

  return {
    createdMarkets,
    joinedMarkets,
    allInvolvedMarkets,
    isLoading,
    error: error as Error | null,
  }
}

/**
 * Hook for fetching user portfolio summary from Supabase with optimized queries
 * 
 * @param userId - User ID to fetch portfolio for
 * @returns Portfolio summary with P&L, win rate, etc.
 */
export function useSupabasePortfolioSummary(userId?: string) {
  return useQuery({
    queryKey: ['user-portfolio-summary', userId],
    queryFn: async () => {
      if (!userId) return null
      return await DashboardQueries.getUserPortfolioStats(userId)
    },
    enabled: !!userId,
    staleTime: 30000,
  })
}

/**
 * Hook for fetching user balance from Supabase with optimized queries
 * 
 * @param userId - User ID to fetch balance for
 * @returns User's current balance
 */
export function useSupabaseUserBalance(userId?: string) {
  return useQuery({
    queryKey: ['user-balance', userId],
    queryFn: async () => {
      if (!userId) return 0
      const stats = await DashboardQueries.getUserPortfolioStats(userId)
      return stats.net_profit_loss
    },
    enabled: !!userId,
    staleTime: 30000,
  })
}

/**
 * Hook for fetching all markets from Supabase with optimized queries
 * 
 * @param options - Query options
 * @returns All markets data
 */
export function useSupabaseAllMarkets(options: {
  page?: number
  pageSize?: number
  status?: Market['status']
  enabled?: boolean
} = {}) {
  const { page = 1, pageSize = 50, status, enabled = true } = options

  return useQuery({
    queryKey: ['all-markets', page, pageSize, status],
    queryFn: async () => {
      const offset = (page - 1) * pageSize
      return await DatabaseService.getMarkets({
        status,
        limit: pageSize,
        offset,
      })
    },
    enabled,
    staleTime: 30000,
  })
}