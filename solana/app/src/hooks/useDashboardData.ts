import type { Market, MarketDashboardInfo } from '../types'
import { PublicKey } from '@solana/web3.js'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { DASHBOARD_PROGRAM_ID, DashboardIDL, FactoryIDL, MarketIDL } from '../config/programs'

export interface DashboardData {
  createdMarkets: MarketDashboardInfo[]
  joinedMarkets: MarketDashboardInfo[]
  allInvolvedMarkets: MarketDashboardInfo[]
  isLoading: boolean
  error: Error | null
}

/**
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

      console.log('Fetching user dashboard data from Solana program:', {
        programId: DASHBOARD_PROGRAM_ID,
        userAddress,
      })

      // Create provider and program instance
      const userPubkey = new PublicKey(userAddress)
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      const dashboardProgram = new Program(DashboardIDL as any, provider)

      // Call getUserMarkets view function from Dashboard IDL
      // This returns an array of MarketSummary objects
      const allUserMarkets: any[] = await dashboardProgram.methods
        .getUserMarkets(
          userPubkey,
          null, // filterStatus - null means all statuses
          { creationTime: {} }, // sortBy - sort by creation time
          0, // page
          100 // pageSize
        )
        .view()

      console.log('Fetched user markets:', allUserMarkets.length)

      // Helper function to convert market status enum to resolved boolean
      const isResolved = (status: number): boolean => {
        // Status enum: 0=Open, 1=Live, 2=Resolved, 3=Cancelled
        return status === 2
      }

      // Helper function to convert outcome enum to winner number
      const getWinner = (outcome: any): number => {
        if (!outcome) return 0
        // MatchOutcome enum: Home=0, Draw=1, Away=2
        if (outcome.home !== undefined) return 1
        if (outcome.draw !== undefined) return 3
        if (outcome.away !== undefined) return 2
        return 0
      }

      // Helper to parse matchId (can be string or number)
      const parseMatchId = (matchId: any): bigint => {
        if (typeof matchId === 'string') {
          return BigInt(matchId)
        }
        return BigInt(matchId.toString())
      }

      // Separate created vs joined markets
      const createdMarkets: MarketDashboardInfo[] = allUserMarkets
        .filter((m: any) => m.creator.toString() === userAddress)
        .map((market: any) => ({
          marketAddress: market.marketAddress.toString(),
          matchId: parseMatchId(market.matchId),
          creator: market.creator.toString(),
          entryFee: BigInt(market.entryFee.toString()),
          resolved: isResolved(market.status),
          winner: getWinner(market.outcome),
          participantsCount: BigInt(market.participantCount),
          isPublic: market.isPublic,
          startTime: BigInt(market.kickoffTime.toString()),
          homeCount: BigInt(market.homeCount),
          awayCount: BigInt(market.awayCount),
          drawCount: BigInt(market.drawCount),
        }))

      const joinedMarkets: MarketDashboardInfo[] = allUserMarkets
        .filter((m: any) => m.creator.toString() !== userAddress)
        .map((market: any) => ({
          marketAddress: market.marketAddress.toString(),
          matchId: parseMatchId(market.matchId),
          creator: market.creator.toString(),
          entryFee: BigInt(market.entryFee.toString()),
          resolved: isResolved(market.status),
          winner: getWinner(market.outcome),
          participantsCount: BigInt(market.participantCount),
          isPublic: market.isPublic,
          startTime: BigInt(market.kickoffTime.toString()),
          homeCount: BigInt(market.homeCount),
          awayCount: BigInt(market.awayCount),
          drawCount: BigInt(market.drawCount),
        }))

      console.log('Created markets:', createdMarkets.length, 'Joined markets:', joinedMarkets.length)

      return {
        createdMarkets,
        joinedMarkets,
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
    try {
      // Rate limiting: ensure minimum delay between requests
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime.current
      if (timeSinceLastFetch < rateLimitDelay) {
        const waitTime = rateLimitDelay - timeSinceLastFetch
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
      lastFetchTime.current = Date.now()

      console.log('Fetching dashboard data from Solana program:', {
        programId: DASHBOARD_PROGRAM_ID,
        page,
        pageSize,
        publicOnly,
      })

      // Create provider and program instance
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      const dashboardProgram = new Program(DashboardIDL as any, provider)

      // Call getAllMarkets view function from Dashboard IDL
      // Returns array of MarketSummary objects
      const markets: any[] = await dashboardProgram.methods
        .getAllMarkets(
          null, // filterStatus - null means all statuses
          publicOnly ? true : null, // filterVisibility
          { creationTime: {} }, // sortBy - sort by creation time
          page,
          Math.min(pageSize, 100) // Max 100 per page
        )
        .view()

      console.log('Fetched all markets:', markets.length)

      // Helper function to check if market is resolved
      const isResolved = (status: number): boolean => {
        // Status enum: 0=Open, 1=Live, 2=Resolved, 3=Cancelled
        return status === 2
      }

      // Helper to parse matchId (can be string or number)
      const parseMatchId = (matchId: any): bigint => {
        if (typeof matchId === 'string') {
          return BigInt(matchId)
        }
        return BigInt(matchId.toString())
      }

      // Transform MarketSummary to Market type
      return markets.map((market: any) => ({
        marketAddress: market.marketAddress.toString(),
        matchId: parseMatchId(market.matchId),
        creator: market.creator.toString(),
        entryFee: BigInt(market.entryFee.toString()),
        resolved: isResolved(market.status),
        participantsCount: BigInt(market.participantCount),
        isPublic: market.isPublic,
        startTime: BigInt(market.kickoffTime.toString()),
        homeCount: BigInt(market.homeCount),
        awayCount: BigInt(market.awayCount),
        drawCount: BigInt(market.drawCount),
      }))
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
    try {
      // Rate limiting
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime.current
      if (timeSinceLastFetch < rateLimitDelay) {
        await new Promise(resolve => setTimeout(resolve, rateLimitDelay - timeSinceLastFetch))
      }
      lastFetchTime.current = Date.now()

      console.log('Fetching factory markets from Solana program')

      // Create provider and program instance
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      const factoryProgram = new Program(FactoryIDL as any, provider)

      // Call getMarkets view function from Factory IDL
      // Note: Factory's getMarkets doesn't return data directly, it needs accounts
      // We need to fetch all MarketRegistry accounts instead
      const marketRegistries = await (factoryProgram.account as any).marketRegistry.all()

      console.log('Fetched factory market registries:', marketRegistries.length)

      // Fetch detailed market data for each registry entry
      const marketProgram = new Program(MarketIDL as any, provider)
      
      const markets = await Promise.all(
        marketRegistries.map(async (registry: { account: any, publicKey: PublicKey }) => {
          try {
            const registryData = registry.account
            const marketPubkey = registryData.marketAddress
            
            // Fetch market account data
            const marketAccount = await (marketProgram.account as any).market.fetch(marketPubkey)
            
            // Helper function to check if market is resolved
            const isResolved = (status: any): boolean => {
              return status.resolved !== undefined
            }

            // Helper to parse matchId (can be string or number)
            const parseMatchId = (matchId: any): bigint => {
              if (typeof matchId === 'string') {
                return BigInt(matchId)
              }
              return BigInt(matchId.toString())
            }
            
            return {
              marketAddress: marketPubkey.toString(),
              matchId: parseMatchId(registryData.matchId),
              creator: registryData.creator.toString(),
              entryFee: BigInt(marketAccount.entryFee.toString()),
              resolved: isResolved(marketAccount.status),
              participantsCount: BigInt(marketAccount.participantCount),
              isPublic: registryData.isPublic,
              startTime: BigInt(registryData.kickoffTime.toString()),
              homeCount: BigInt(marketAccount.homeCount),
              awayCount: BigInt(marketAccount.awayCount),
              drawCount: BigInt(marketAccount.drawCount),
            } as Market
          } catch (err) {
            console.warn(`Failed to fetch market ${registry.account.marketAddress.toString()}:`, err)
            return null
          }
        })
      )

      // Filter out failed fetches
      const validMarkets = markets.filter((m: Market | null): m is Market => m !== null)
      console.log('Valid markets fetched:', validMarkets.length)
      return validMarkets
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

      console.log('Fetching market details for:', marketAddresses.length, 'markets')

      // Create provider and program instance
      const provider = new AnchorProvider(
        connection,
        wallet as any,
        { commitment: 'confirmed' }
      )
      const marketProgram = new Program(MarketIDL as any, provider)

      // Fetch market account data for each address
      const marketDetails = await Promise.all(
        marketAddresses.map(async (address) => {
          try {
            const marketPubkey = new PublicKey(address)
            
            // Fetch market account using Anchor's fetch method
            const marketAccount = await (marketProgram.account as any).market.fetch(marketPubkey)
            
            // Helper function to check if market is resolved
            const isResolved = (status: any): boolean => {
              return status.resolved !== undefined
            }

            // Helper function to get outcome value
            const getOutcome = (outcome: any): number | undefined => {
              if (!outcome) return undefined
              if (outcome.home !== undefined) return 0
              if (outcome.draw !== undefined) return 1
              if (outcome.away !== undefined) return 2
              return undefined
            }

            // Helper to parse matchId (can be string or number)
            const parseMatchId = (matchId: any): bigint => {
              if (typeof matchId === 'string') {
                return BigInt(matchId)
              }
              return BigInt(matchId.toString())
            }
            
            return {
              marketAddress: address,
              matchId: parseMatchId(marketAccount.matchId),
              creator: marketAccount.creator.toString(),
              entryFee: BigInt(marketAccount.entryFee.toString()),
              resolved: isResolved(marketAccount.status),
              participantsCount: BigInt(marketAccount.participantCount),
              isPublic: marketAccount.isPublic,
              startTime: BigInt(marketAccount.kickoffTime.toString()),
              homeCount: BigInt(marketAccount.homeCount),
              awayCount: BigInt(marketAccount.awayCount),
              drawCount: BigInt(marketAccount.drawCount),
              totalPool: BigInt(marketAccount.totalPool.toString()),
              outcome: getOutcome(marketAccount.outcome),
            }
          } catch (err) {
            console.warn(`Failed to fetch market ${address}:`, err)
            return null
          }
        })
      )

      // Filter out failed fetches
      const validDetails = marketDetails.filter((m): m is any => m !== null)
      console.log('Valid market details fetched:', validDetails.length)
      return validDetails
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
