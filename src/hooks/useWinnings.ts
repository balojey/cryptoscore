/**
 * useWinnings - Reactive hook for winnings calculations
 *
 * Combines market data, participant data, and match data to provide
 * comprehensive winnings information with caching and error handling.
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { WinningsCalculator, type WinningsCalculationParams, type WinningsResult } from '../utils/winnings-calculator'
import { WinningsErrorHandler, type WinningsError } from '../utils/winnings-error-handler'
import { useMarketData } from './useMarketData'
import { useParticipantData } from './useParticipantData'
import { useMatchData } from './useMatchData'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'

/**
 * Result interface for useWinnings hook
 */
export interface UseWinningsResult {
  /** Calculated winnings result */
  winnings: WinningsResult | null
  /** Loading state for any dependent data */
  isLoading: boolean
  /** Error message if calculation fails */
  error: string | null
  /** Function to manually refetch all dependent data */
  refetch: () => void
  /** Individual loading states for debugging */
  loadingStates: {
    market: boolean
    participant: boolean
    match: boolean
  }
  /** Individual error states for debugging */
  errorStates: {
    market: string | null
    participant: string | null
    match: string | null
    calculation: string | null
  }
  /** Whether the hook is in a recoverable error state */
  isRecoverable: boolean
  /** Structured error information */
  structuredError: WinningsError | null
}

/**
 * Hook for reactive winnings calculations
 *
 * Automatically fetches and combines market data, participant data, and match data
 * to provide comprehensive winnings information. Includes caching, memoization,
 * and proper error handling.
 *
 * @param marketAddress - Market address to calculate winnings for
 * @param userAddress - Optional user address (defaults to connected wallet)
 * @returns Winnings calculation result with loading states and error handling
 *
 * @example
 * ```tsx
 * function WinningsDisplay({ marketAddress }: { marketAddress: string }) {
 *   const { winnings, isLoading, error } = useWinnings(marketAddress)
 *
 *   if (isLoading) return <div>Loading winnings...</div>
 *   if (error) return <div>Error: {error}</div>
 *   if (!winnings) return <div>No winnings data</div>
 *
 *   return (
 *     <div>
 *       <p>Type: {winnings.type}</p>
 *       <p>Amount: {winnings.amount} lamports</p>
 *       <p>Status: {winnings.status}</p>
 *       <p>{winnings.message}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useWinnings(
  marketAddress?: string,
  userAddress?: string
): UseWinningsResult {
  const { walletAddress } = useUnifiedWallet()

  // Use provided userAddress or connected wallet address
  const effectiveUserAddress = userAddress || walletAddress

  // Fetch market data
  const {
    data: marketData,
    isLoading: isLoadingMarket,
    error: marketError,
    refetch: refetchMarket,
  } = useMarketData(marketAddress)

  // Fetch participant data (only if user is connected)
  const {
    data: participantData,
    isLoading: isLoadingParticipant,
    error: participantError,
    refetch: refetchParticipant,
  } = useParticipantData(marketAddress, effectiveUserAddress || undefined)

  // Extract match ID from market data for match data fetching
  const matchId = useMemo(() => {
    if (!marketData?.matchId) return undefined
    
    // Parse match ID - it might be a string or number
    const parsed = parseInt(marketData.matchId, 10)
    return isNaN(parsed) ? undefined : parsed
  }, [marketData?.matchId])

  // Fetch match data (only if we have a valid match ID)
  const {
    data: matchData,
    loading: isLoadingMatch,
    error: matchError,
  } = useMatchData(matchId || 0) // Provide default value for undefined

  // Manual refetch function for match data (useMatchData doesn't return refetch)
  const refetchMatch = useMemo(() => {
    // useMatchData doesn't expose refetch, so we return a no-op
    // The hook will automatically refetch when matchId changes
    return () => {
      console.log('Match data refetch requested - will refetch on next render')
    }
  }, [])

  // Combine all loading states
  const isLoading = useMemo(() => {
    return isLoadingMarket || isLoadingParticipant || isLoadingMatch
  }, [isLoadingMarket, isLoadingParticipant, isLoadingMatch])

  // Combine all errors with priority handling
  const error = useMemo(() => {
    // Market error is critical - can't calculate without market data
    if (marketError) return `Market data error: ${String(marketError)}`
    
    // Participant and match errors are less critical
    const nonCriticalErrors = [participantError, matchError].filter(Boolean).map(String)
    if (nonCriticalErrors.length > 0) {
      return `Data warning: ${nonCriticalErrors.join('; ')}`
    }
    
    return null
  }, [marketError, participantError, matchError])

  // Determine if errors are recoverable
  const isRecoverable = useMemo(() => {
    // Market errors are not recoverable - we need market data
    if (marketError) return false
    
    // Participant and match errors are recoverable - we can show basic info
    return true
  }, [marketError])

  // Individual error states for debugging
  const errorStates = useMemo(() => ({
    market: marketError ? String(marketError) : null,
    participant: participantError ? String(participantError) : null,
    match: matchError ? String(matchError) : null,
    calculation: null as string | null, // Will be set by the query
  }), [marketError, participantError, matchError])

  // Combined refetch function
  const refetch = useMemo(() => {
    return () => {
      refetchMarket()
      refetchParticipant()
      refetchMatch()
    }
  }, [refetchMarket, refetchParticipant, refetchMatch])

  // Loading states for debugging
  const loadingStates = useMemo(() => ({
    market: isLoadingMarket,
    participant: isLoadingParticipant,
    match: isLoadingMatch,
  }), [isLoadingMarket, isLoadingParticipant, isLoadingMatch])

  // Calculate winnings using TanStack Query for caching and memoization
  const winningsQuery = useQuery({
    queryKey: [
      'winnings',
      marketAddress,
      effectiveUserAddress,
      marketData?.status,
      marketData?.outcome,
      marketData?.totalPool,
      marketData?.participantCount,
      participantData?.prediction,
      participantData?.hasWithdrawn,
      matchData?.isFinished,
      matchData?.matchResult,
    ],
    queryFn: (): WinningsResult | null => {
      // Don't calculate if we don't have market data
      if (!marketData) {
        return null
      }

      // Prepare calculation parameters
      const params: WinningsCalculationParams = {
        marketData,
        participantData,
        userAddress: effectiveUserAddress || undefined,
        matchData,
      }

      try {
        // Validate market data before calculation
        if (!WinningsCalculator.validateMarketData(marketData)) {
          throw new Error('Invalid market data structure')
        }

        // Use WinningsCalculator to compute winnings
        const result = WinningsCalculator.calculateWinnings(params)
        
        console.log('[useWinnings] Calculated winnings:', {
          marketAddress,
          userAddress: effectiveUserAddress,
          marketStatus: marketData.status,
          participantPrediction: participantData?.prediction,
          matchResult: matchData?.matchResult,
          result,
        })

        return result
      } catch (calculationError) {
        console.error('[useWinnings] Calculation error:', calculationError)
        
        // Use error handler for structured error handling
        const winningsError = WinningsErrorHandler.classifyError(
          calculationError as Error,
          {
            marketAddress: marketAddress || undefined,
            userAddress: effectiveUserAddress || undefined,
            operation: 'winnings_calculation',
          }
        )
        
        // Note: errorStates will be updated in the return statement
        
        // Return appropriate fallback result
        return WinningsErrorHandler.createFallbackResult(winningsError, marketData)
      }
    },
    enabled: !!marketData && !marketError, // Only run if we have market data and no critical errors
    staleTime: 10000, // 10 seconds - same as market data
    gcTime: 300000, // 5 minutes - keep in cache longer for performance
    retry: (failureCount, error) => {
      // Don't retry validation errors
      if (error?.message?.includes('Invalid market data')) {
        return false
      }
      
      // Retry calculation errors up to 2 times
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
    refetchInterval: (data) => {
      // Don't auto-refetch if there are errors
      if (error || !data || !marketData) return false
      
      // Refetch open markets more frequently
      if (marketData.status === 'Open') {
        return 15000 // 15 seconds
      }
      
      // Refetch live markets waiting for match results
      if (marketData.status === 'Live' && !matchData?.isFinished) {
        return 30000 // 30 seconds
      }
      
      // Don't auto-refetch resolved markets
      return false
    },
    refetchOnWindowFocus: false, // Prevent excessive refetching
    refetchOnReconnect: true, // Refetch when network reconnects
  })

  // Create structured error if there's a query error
  const structuredError = useMemo(() => {
    if (winningsQuery.error) {
      return WinningsErrorHandler.classifyError(
        winningsQuery.error as Error,
        {
          marketAddress: marketAddress || undefined,
          userAddress: effectiveUserAddress || undefined,
          operation: 'winnings_query',
        }
      )
    }
    return null
  }, [winningsQuery.error, marketAddress, effectiveUserAddress])

  // Return combined result with comprehensive error handling
  return useMemo(() => ({
    winnings: winningsQuery.data || null,
    isLoading: isLoading || winningsQuery.isLoading,
    error: error || (winningsQuery.error ? String(winningsQuery.error) : null),
    refetch: () => {
      refetch()
      winningsQuery.refetch()
    },
    loadingStates,
    errorStates: {
      ...errorStates,
      calculation: winningsQuery.error ? String(winningsQuery.error) : errorStates.calculation,
    },
    isRecoverable,
    structuredError,
  }), [
    winningsQuery.data,
    winningsQuery.isLoading,
    winningsQuery.error,
    winningsQuery.refetch,
    isLoading,
    error,
    refetch,
    loadingStates,
    errorStates,
    isRecoverable,
    structuredError,
  ])
}

/**
 * Hook for calculating potential winnings for a specific prediction
 *
 * Useful for showing potential winnings before a user joins a market.
 * Does not require user authentication or participation data.
 *
 * @param marketAddress - Market address
 * @param prediction - Prediction to calculate winnings for
 * @returns Potential winnings amount in lamports
 *
 * @example
 * ```tsx
 * function PredictionOption({ marketAddress, prediction }: Props) {
 *   const { potentialWinnings, isLoading } = usePotentialWinnings(marketAddress, prediction)
 *
 *   return (
 *     <div>
 *       <p>Prediction: {prediction}</p>
 *       <p>Potential Winnings: {potentialWinnings} lamports</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function usePotentialWinnings(
  marketAddress?: string,
  prediction?: 'Home' | 'Draw' | 'Away'
) {
  const { data: marketData, isLoading } = useMarketData(marketAddress)

  return useQuery({
    queryKey: ['potential-winnings', marketAddress, prediction, marketData?.totalPool, marketData?.participantCount],
    queryFn: () => {
      if (!marketData || !prediction) {
        return 0
      }

      return WinningsCalculator.calculatePotentialWinnings(marketData, prediction)
    },
    enabled: !!marketData && !!prediction,
    staleTime: 10000,
    select: (data) => ({
      potentialWinnings: data,
      isLoading,
    }),
  })
}

/**
 * Hook for calculating average potential winnings across all predictions
 *
 * Useful for showing users the expected return regardless of which prediction they choose.
 * Provides better decision-making information for non-participants.
 *
 * @param marketAddress - Market address
 * @returns Average potential winnings and breakdown by prediction
 *
 * @example
 * ```tsx
 * function MarketOverview({ marketAddress }: Props) {
 *   const { averageWinnings, breakdown, explanation, isLoading } = useAveragePotentialWinnings(marketAddress)
 *
 *   return (
 *     <div>
 *       <p>Average Potential Winnings: {averageWinnings} lamports</p>
 *       <p>Home: {breakdown.Home}, Draw: {breakdown.Draw}, Away: {breakdown.Away}</p>
 *       <p>{explanation}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAveragePotentialWinnings(marketAddress?: string) {
  const { data: marketData, isLoading } = useMarketData(marketAddress)

  return useQuery({
    queryKey: ['average-potential-winnings', marketAddress, marketData?.totalPool, marketData?.participantCount, marketData?.homeCount, marketData?.drawCount, marketData?.awayCount],
    queryFn: () => {
      if (!marketData) {
        return {
          average: 0,
          breakdown: { Home: 0, Draw: 0, Away: 0 },
          explanation: 'Market data not available'
        }
      }

      return WinningsCalculator.calculateAveragePotentialWinnings(marketData)
    },
    enabled: !!marketData,
    staleTime: 10000,
    select: (data) => ({
      averageWinnings: data.average,
      breakdown: data.breakdown,
      explanation: data.explanation,
      isLoading,
    }),
  })
}

/**
 * Hook for batch winnings calculations across multiple markets
 *
 * Useful for portfolio views or market lists where you need winnings
 * information for multiple markets efficiently.
 *
 * @param marketAddresses - Array of market addresses
 * @param userAddress - Optional user address (defaults to connected wallet)
 * @returns Array of winnings results
 *
 * @example
 * ```tsx
 * function PortfolioView({ marketAddresses }: Props) {
 *   const { winningsResults, isLoading } = useBatchWinnings(marketAddresses)
 *
 *   return (
 *     <div>
 *       {winningsResults.map((result, index) => (
 *         <div key={marketAddresses[index]}>
 *           <p>Market: {marketAddresses[index]}</p>
 *           <p>Winnings: {result?.amount || 0} lamports</p>
 *         </div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useBatchWinnings(
  marketAddresses: string[] = [],
  userAddress?: string
) {
  const { walletAddress } = useUnifiedWallet()
  const effectiveUserAddress = userAddress || walletAddress

  return useQuery({
    queryKey: ['batch-winnings', marketAddresses, effectiveUserAddress],
    queryFn: async () => {
      // This would require implementing batch data fetching
      // For now, return empty array as placeholder
      // In a real implementation, you'd fetch all market data in parallel
      // and calculate winnings for each market
      return marketAddresses.map(() => null)
    },
    enabled: marketAddresses.length > 0 && !!effectiveUserAddress,
    staleTime: 15000,
    select: (data) => ({
      winningsResults: data,
      isLoading: false, // Placeholder
    }),
  })
}