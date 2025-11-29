import type { MarketDashboardInfo } from '../types'
import { useConnection } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { DASHBOARD_PROGRAM_ID } from '../config/programs'

// Note: These will be used after program deployment
// import { PublicKey } from '@solana/web3.js'
// import { Program } from '@coral-xyz/anchor'
// import { DashboardIDL } from '../config/programs'

export interface DashboardData {
  createdMarkets: MarketDashboardInfo[]
  joinedMarkets: MarketDashboardInfo[]
  allInvolvedMarkets: MarketDashboardInfo[]
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for fetching user dashboard data (created and joined markets)
 * This replaces the Polkadot useReadContract calls with Solana program queries
 */
export function useDashboardData(userAddress?: string): DashboardData {
  const { connection } = useConnection()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000 // Minimum 2 seconds between requests

  const fetchUserMarkets = useCallback(async (): Promise<{
    createdMarkets: MarketDashboardInfo[]
    joinedMarkets: MarketDashboardInfo[]
  }> => {
    try {
      if (!userAddress) {
        return {
          createdMarkets: [],
          joinedMarkets: [],
        }
      }

      // Rate limiting: ensure minimum delay between requests
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime.current
      if (timeSinceLastFetch < rateLimitDelay) {
        const waitTime = rateLimitDelay - timeSinceLastFetch
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
      lastFetchTime.current = Date.now()

      // TODO: Implement after Dashboard Program is deployed
      // This will replace the Polkadot getUserMarketsDashboardPaginated calls
      
      // const userPubkey = new PublicKey(userAddress)
      // const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
      // const program = new Program(DashboardIDL, DASHBOARD_PROGRAM_ID, provider)
      
      // Fetch created markets (markets where user is the creator)
      // const createdMarketsData = await program.methods
      //   .getUserMarketsDashboardPaginated(userPubkey, 0, 100, true)
      //   .accounts({})
      //   .view()

      // Fetch joined markets (markets where user has placed predictions)
      // const joinedMarketsData = await program.methods
      //   .getUserMarketsDashboardPaginated(userPubkey, 0, 100, false)
      //   .accounts({})
      //   .view()

      // Transform Solana program data to MarketDashboardInfo format
      // const createdMarkets: MarketDashboardInfo[] = createdMarketsData.map(market => ({
      //   marketAddress: market.publicKey.toString(),
      //   matchId: market.matchId,
      //   creator: market.creator.toString(),
      //   entryFee: market.entryFee,
      //   resolved: market.resolved,
      //   winner: market.winner,
      //   participantsCount: market.participantCount,
      //   isPublic: market.isPublic,
      //   startTime: market.kickoffTime,
      //   homeCount: market.homeCount,
      //   awayCount: market.awayCount,
      //   drawCount: market.drawCount,
      // }))

      // const joinedMarkets: MarketDashboardInfo[] = joinedMarketsData.map(market => ({
      //   marketAddress: market.publicKey.toString(),
      //   matchId: market.matchId,
      //   creator: market.creator.toString(),
      //   entryFee: market.entryFee,
      //   resolved: market.resolved,
      //   winner: market.winner,
      //   participantsCount: market.participantCount,
      //   isPublic: market.isPublic,
      //   startTime: market.kickoffTime,
      //   homeCount: market.homeCount,
      //   awayCount: market.awayCount,
      //   drawCount: market.drawCount,
      // }))

      console.log('Fetching user dashboard data from Solana program:', {
        programId: DASHBOARD_PROGRAM_ID,
        userAddress,
      })

      // Placeholder: Return empty arrays until program is deployed
      // This prevents the app from crashing during migration
      return {
        createdMarkets: [],
        joinedMarkets: [],
      }
    }
    catch (error) {
      const errorMessage = error?.toString() || ''
      
      // Handle rate limiting gracefully
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.warn('Rate limit hit, will retry with backoff')
        return {
          createdMarkets: [],
          joinedMarkets: [],
        }
      }
      
      console.error('Error fetching user dashboard data:', error)
      throw error
    }
  }, [connection, userAddress])

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
 * Hook for fetching all markets from dashboard
 * Replaces the Polkadot useReadContract for dashboard.getMarketsDashboardPaginated
 */
export function useAllMarkets(options: {
  offset?: number
  limit?: number
  publicOnly?: boolean
  enabled?: boolean
} = {}) {
  const { offset = 0, limit = 1000, publicOnly = false, enabled = true } = options
  const { connection } = useConnection()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000

  const fetchDashboardData = useCallback(async (): Promise<MarketDashboardInfo[]> => {
    try {
      // Rate limiting: ensure minimum delay between requests
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime.current
      if (timeSinceLastFetch < rateLimitDelay) {
        const waitTime = rateLimitDelay - timeSinceLastFetch
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
      lastFetchTime.current = Date.now()

      // TODO: Replace with actual Anchor program call after deployment
      // const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
      // const program = new Program(DashboardIDL, DASHBOARD_PROGRAM_ID, provider)
      // const markets = await program.methods
      //   .getMarketsDashboardPaginated(offset, limit, publicOnly)
      //   .accounts({ dashboard: dashboardPDA })
      //   .view()
      
      console.log('Fetching dashboard data from Solana program:', {
        programId: DASHBOARD_PROGRAM_ID,
        offset,
        limit,
        publicOnly,
      })

      // Placeholder: Return empty array until program is deployed
      return []
    }
    catch (error) {
      const errorMessage = error?.toString() || ''
      
      // Handle rate limiting gracefully
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.warn('Rate limit hit, will retry with backoff')
        return []
      }
      
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }, [connection, offset, limit, publicOnly])

  return useQuery({
    queryKey: ['dashboard', 'markets', offset, limit, publicOnly],
    queryFn: fetchDashboardData,
    enabled,
    staleTime: 15000, // 15 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Hook for fetching all markets from factory
 * Replaces the Polkadot useReadContract for factory.getAllMarkets
 * Used by MetricsBar component
 */
export function useFactoryMarkets(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { connection } = useConnection()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000

  const fetchFactoryMarkets = useCallback(async (): Promise<MarketDashboardInfo[]> => {
    try {
      // Rate limiting
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime.current
      if (timeSinceLastFetch < rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay - timeSinceLastFetch))
      }
      lastFetchTime.current = Date.now()

      // TODO: Replace with actual Anchor program call after deployment
      // const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
      // const program = new Program(FactoryIDL, FACTORY_PROGRAM_ID, provider)
      // const markets = await program.methods
      //   .getAllMarkets()
      //   .accounts({})
      //   .view()
      
      console.log('Fetching factory markets from Solana program')
      
      // Placeholder: Return empty array until program is deployed
      return []
    }
    catch (error) {
      const errorMessage = error?.toString() || ''
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.warn('Rate limit hit on factory markets')
        return []
      }
      console.error('Error fetching factory markets:', error)
      throw error
    }
  }, [connection])

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
 * Hook for fetching detailed market data
 * Replaces the Polkadot useReadContracts for multiple market calls
 * Used by MetricsBar component
 */
export function useMarketDetails(marketAddresses: string[], options: { enabled?: boolean } = {}) {
  const { enabled = true } = options
  const { connection } = useConnection()
  const lastFetchTime = useRef<number>(0)
  const rateLimitDelay = 2000

  const fetchMarketDetails = useCallback(async () => {
    try {
      if (marketAddresses.length === 0) {
        return []
      }

      // Rate limiting
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime.current
      if (timeSinceLastFetch < rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay - timeSinceLastFetch))
      }
      lastFetchTime.current = Date.now()

      // TODO: Replace with actual Anchor program calls after deployment
      // Fetch market account data for each address
      // const marketDetails = await Promise.all(
      //   marketAddresses.map(async (address) => {
      //     const marketPubkey = new PublicKey(address)
      //     const program = new Program(MarketIDL, MARKET_PROGRAM_ID, provider)
      //     return await program.account.market.fetch(marketPubkey)
      //   })
      // )
      
      console.log('Fetching market details for:', marketAddresses.length, 'markets')
      
      // Placeholder: Return empty array until program is deployed
      return []
    }
    catch (error) {
      const errorMessage = error?.toString() || ''
      if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
        console.warn('Rate limit hit on market details')
        return []
      }
      console.error('Error fetching market details:', error)
      throw error
    }
  }, [connection, marketAddresses])

  return useQuery({
    queryKey: ['markets', 'details', marketAddresses],
    queryFn: fetchMarketDetails,
    enabled: enabled && marketAddresses.length > 0,
    staleTime: 15000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}
