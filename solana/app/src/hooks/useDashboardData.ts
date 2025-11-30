/**
 * DEPRECATED: This hook uses Anchor framework which has been removed.
 * 
 * This hook is kept for backward compatibility but will not function correctly
 * without Anchor. Consider implementing an Anchor-free version using:
 * - lib/solana/account-decoder.ts for decoding accounts
 * - Connection.getProgramAccounts() for fetching markets
 * - hooks/useMarketData.ts for Anchor-free market data fetching
 */

import type { Market, MarketDashboardInfo } from '../types'
import { PublicKey } from '@solana/web3.js'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { DASHBOARD_PROGRAM_ID } from '../config/programs'

export interface DashboardData {
  createdMarkets: MarketDashboardInfo[]
  joinedMarkets: MarketDashboardInfo[]
  allInvolvedMarkets: MarketDashboardInfo[]
  isLoading: boolean
  error: Error | null
}

/**
 * @deprecated Anchor framework removed - this hook will not function
 * Hook for fetching user dashboard data (created and joined markets)
 * Uses Solana Dashboard program's getUserMarkets view function
 */
export function useDashboardData(userAddress?: string): DashboardData {
  const { connection } = useConnection()
  const wallet = useWallet()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000 // Minimum 2 seconds between requests

  const fetchUserMarkets = useCallback(async (): Promise<{
    createdMarkets: MarketDashboardInfo[]
    joinedMarkets: MarketDashboardInfo[]
  }> => {
    console.warn('useDashboardData: Anchor framework has been removed. This hook will not function correctly.')
    console.warn('Use hooks/useMarketData.ts (useUserMarkets) for Anchor-free market fetching.')
    return {
      createdMarkets: [],
      joinedMarkets: [],
    }
  }, [connection, wallet, userAddress])

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'user', userAddress],
    queryFn: fetchUserMarkets,
    enabled: !!userAddress,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })

  // Combine and deduplicate markets
  const allInvolvedMarkets = (() => {
    if (!data)
      return []

    const combinedMarkets = [
      ...(data.createdMarkets || []),
      ...(data.joinedMarkets || []),
    ]

    // Remove duplicates based on marketAddress
    const uniqueMarketsMap = new Map<string, MarketDashboardInfo>()
    combinedMarkets.forEach((market) => {
      uniqueMarketsMap.set(market.marketAddress, market)
    })

    // Convert back to array and sort by starting date (newest first)
    const uniqueMarkets = Array.from(uniqueMarketsMap.values())
    uniqueMarkets.sort((a, b) => Number(b.startTime) - Number(a.startTime))

    return uniqueMarkets
  })()

  return {
    createdMarkets: data?.createdMarkets || [],
    joinedMarkets: data?.joinedMarkets || [],
    allInvolvedMarkets,
    isLoading,
    error: error as Error | null,
  }
}

/**
 * @deprecated Anchor framework removed - this hook will not function
 * Hook for fetching all markets from dashboard
 * Uses Solana Dashboard program's getAllMarkets view function
 */
export function useAllMarkets(options: {
  page?: number
  pageSize?: number
  publicOnly?: boolean
  enabled?: boolean
} = {}) {
  const { page = 0, pageSize = 100, publicOnly = false, enabled = true } = options
  const { connection } = useConnection()
  const wallet = useWallet()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000

  const fetchDashboardData = useCallback(async (): Promise<Market[]> => {
    console.warn('useAllMarkets: Anchor framework has been removed. This hook will not function correctly.')
    console.warn('Use hooks/useMarketData.ts (useAllMarkets) for Anchor-free market fetching.')
    return []
  }, [connection, wallet, page, pageSize, publicOnly])

  return useQuery({
    queryKey: ['dashboard', 'markets', page, pageSize, publicOnly],
    queryFn: fetchDashboardData,
    enabled,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * @deprecated Anchor framework removed - this hook will not function
 * Hook for fetching all markets from factory
 * Uses Solana Factory program's getMarkets view function
 * Used by MetricsBar component
 */
export function useFactoryMarkets(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { connection } = useConnection()
  const wallet = useWallet()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000

  const fetchFactoryMarkets = useCallback(async (): Promise<Market[]> => {
    console.warn('useFactoryMarkets: Anchor framework has been removed. This hook will not function correctly.')
    console.warn('Use hooks/useMarketData.ts (useAllMarkets) for Anchor-free market fetching.')
    return []
  }, [connection, wallet])

  return useQuery({
    queryKey: ['factory', 'markets'],
    queryFn: fetchFactoryMarkets,
    enabled,
    staleTime: 15000,
    refetchInterval: 30000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * @deprecated Anchor framework removed - this hook will not function
 * Hook for fetching detailed market data
 * Fetches Market account data from Solana for multiple addresses
 * Used by MetricsBar component
 */
export function useMarketDetails(marketAddresses: string[], options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { connection } = useConnection()
  const wallet = useWallet()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000

  const fetchMarketDetails = useCallback(async () => {
    console.warn('useMarketDetails: Anchor framework has been removed. This hook will not function correctly.')
    console.warn('Use hooks/useMarketData.ts (useMarketData) for Anchor-free market fetching.')
    return []
  }, [connection, wallet, marketAddresses])

  return useQuery({
    queryKey: ['markets', 'details', marketAddresses],
    queryFn: fetchMarketDetails,
    enabled: enabled && marketAddresses.length > 0,
    staleTime: 15000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
