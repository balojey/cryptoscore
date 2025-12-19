/**
 * Dashboard data hooks using Anchor-free implementation
 * Fetches market data using Connection.getProgramAccounts() and AccountDecoder
 */

import type { MarketDashboardInfo } from '../types'
import { useMemo } from 'react'
import { useAllMarkets as useAllMarketsData, useUserMarkets as useUserMarketsData, useUserParticipantMarkets } from './useMarketData'

export interface DashboardData {
  createdMarkets: MarketDashboardInfo[]
  joinedMarkets: MarketDashboardInfo[]
  allInvolvedMarkets: MarketDashboardInfo[]
  isLoading: boolean
  error: Error | null
}

/**
 * Helper to transform MarketData to MarketDashboardInfo
 */
function transformToMarketDashboardInfo(marketData: any): MarketDashboardInfo {
  return {
    marketAddress: marketData.marketAddress,
    matchId: BigInt(marketData.matchId || '0'),
    entryFee: BigInt(marketData.entryFee),
    creator: marketData.creator,
    participantsCount: BigInt(marketData.participantCount),
    resolved: marketData.status === 'Resolved',
    isPublic: marketData.isPublic,
    startTime: BigInt(marketData.kickoffTime),
    homeCount: BigInt(marketData.homeCount),
    awayCount: BigInt(marketData.awayCount),
    drawCount: BigInt(marketData.drawCount),
    totalPool: BigInt(marketData.totalPool),
    status: marketData.status,
    outcome: marketData.outcome,
  }
}

/**
 * Hook for fetching user dashboard data (created and joined markets)
 * Uses useUserMarkets to fetch markets where user is creator OR participant
 */
export function useDashboardData(userAddress?: string): DashboardData {
  const { data: userMarketsData, isLoading, error } = useUserMarketsData(userAddress)
  const { data: participantMarkets } = useUserParticipantMarkets(userAddress)

  // Transform and categorize markets
  const { createdMarkets, joinedMarkets, allInvolvedMarkets } = useMemo(() => {
    console.log('[useDashboardData] User address:', userAddress)
    console.log('[useDashboardData] User markets data:', userMarketsData)
    console.log('[useDashboardData] Participant markets:', participantMarkets)

    if (!userMarketsData || userMarketsData.length === 0 || !userAddress) {
      console.log('[useDashboardData] No data or user address')
      return {
        createdMarkets: [],
        joinedMarkets: [],
        allInvolvedMarkets: [],
      }
    }

    // Transform all markets
    const transformed = userMarketsData.map(transformToMarketDashboardInfo)
    console.log('[useDashboardData] Transformed markets:', transformed)

    // Create a set of market addresses where user has made a prediction (has Participant account)
    const participantMarketSet = new Set(
      (participantMarkets || []).map(m => m.marketAddress.toLowerCase()),
    )

    // Created markets: where user is the creator
    const created = transformed.filter(m =>
      m.creator.toLowerCase() === userAddress.toLowerCase(),
    )

    // Joined markets: where user has a Participant account (made a prediction)
    // This can include markets they created if they also joined them
    const joined = transformed.filter(m =>
      participantMarketSet.has(m.marketAddress.toLowerCase()),
    )

    console.log('[useDashboardData] Created markets:', created.length, created.map(m => ({ addr: m.marketAddress, creator: m.creator })))
    console.log('[useDashboardData] Joined markets:', joined.length, joined.map(m => ({ addr: m.marketAddress, creator: m.creator })))
    console.log('[useDashboardData] User address for comparison:', userAddress)

    // Combine and deduplicate for all involved markets
    const uniqueMarketsMap = new Map<string, MarketDashboardInfo>()
    transformed.forEach((market) => {
      uniqueMarketsMap.set(market.marketAddress, market)
    })

    // Sort by start time (newest first)
    const allMarkets = Array.from(uniqueMarketsMap.values())
    allMarkets.sort((a, b) => Number(b.startTime) - Number(a.startTime))

    return {
      createdMarkets: created,
      joinedMarkets: joined,
      allInvolvedMarkets: allMarkets,
    }
  }, [userMarketsData, participantMarkets, userAddress])

  return {
    createdMarkets,
    joinedMarkets,
    allInvolvedMarkets,
    isLoading,
    error: error as Error | null,
  }
}

/**
 * Hook for fetching all markets
 * Uses useAllMarkets from useMarketData with filtering options
 */
export function useAllMarkets(options: {
  page?: number
  pageSize?: number
  publicOnly?: boolean
  enabled?: boolean
} = {}) {
  const { publicOnly = false } = options
  const { data: marketsData, isLoading, error, refetch } = useAllMarketsData()

  // Transform and filter markets
  const markets = useMemo(() => {
    if (!marketsData || marketsData.length === 0)
      return []

    let filtered = marketsData

    // Filter by visibility if requested
    if (publicOnly) {
      filtered = filtered.filter(m => m.isPublic)
    }

    // Transform to Market type
    return filtered.map(m => ({
      marketAddress: m.marketAddress,
      matchId: BigInt(m.matchId || '0'),
      entryFee: BigInt(m.entryFee),
      creator: m.creator,
      participantsCount: BigInt(m.participantCount),
      resolved: m.status === 'Resolved',
      isPublic: m.isPublic,
      startTime: BigInt(m.kickoffTime),
      homeCount: BigInt(m.homeCount),
      awayCount: BigInt(m.awayCount),
      drawCount: BigInt(m.drawCount),
    }))
  }, [marketsData, publicOnly])

  return {
    data: markets,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching all markets from factory
 * Alias for useAllMarkets for backward compatibility
 */
export function useFactoryMarkets(options: { enabled?: boolean } = {}) {
  return useAllMarkets(options)
}

/**
 * Hook for fetching detailed market data for multiple addresses
 * Returns all markets and filters by the provided addresses
 */
export function useMarketDetails(marketAddresses: string[], options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { data: allMarketsData, isLoading, error } = useAllMarketsData()

  const markets = useMemo(() => {
    if (!allMarketsData || marketAddresses.length === 0)
      return []

    // Filter markets by addresses
    const addressSet = new Set(marketAddresses)
    return allMarketsData
      .filter(m => addressSet.has(m.marketAddress))
      .map(transformToMarketDashboardInfo)
  }, [allMarketsData, marketAddresses])

  return {
    data: markets,
    isLoading: enabled ? isLoading : false,
    error,
  }
}
