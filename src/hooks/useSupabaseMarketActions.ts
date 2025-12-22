/**
 * Supabase Market Actions Hook
 *
 * Replaces Solana-based market actions with Supabase database operations
 * while maintaining the same interface and user experience.
 */

import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MarketService } from '../lib/supabase/market-service'
import { UserService } from '../lib/supabase/user-service'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import { useMnee } from '../hooks/useMnee'

export type MatchOutcomeType = 'Home' | 'Draw' | 'Away'

export interface CreateMarketParams {
  matchId: string
  title: string
  description: string
  entryFee: number // in MNEE tokens (will be converted to atomic units)
  endTime: number // Unix timestamp
  isPublic: boolean
  homeTeamId?: number
  homeTeamName?: string
  awayTeamId?: number
  awayTeamName?: string
}

export interface JoinMarketParams {
  marketId: string
  prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN'
}

export interface ResolveMarketParams {
  marketId: string
  outcome: MatchOutcomeType
}

export interface CreateSimilarMarketParams {
  matchId: string
  title: string
  description: string
  entryFee: number
  isPublic: boolean
}

/**
 * Hook for performing market actions with Supabase backend
 * Maintains same interface as original Solana-based hook
 */
export function useSupabaseMarketActions() {
  const { publicKey, user } = useUnifiedWallet()
  const { refreshBalance } = useMnee()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [lastOperationId, setLastOperationId] = useState<string | null>(null)

  /**
   * Get current user from Supabase or create if needed
   */
  const getCurrentUser = useCallback(async () => {
    if (!user || !publicKey) {
      throw new Error('Wallet not connected')
    }

    // Get user data from Crossmint
    const walletAddress = publicKey
    const email = user.email || `${walletAddress}@crossmint.local`

    // Authenticate/create user in Supabase
    const { user: supabaseUser } = await UserService.authenticateUser({
      id: user.userId,
      email,
      walletAddress,
      displayName: user.displayName,
    })

    return supabaseUser
  }, [user, publicKey])

  /**
   * Create a new prediction market
   */
  const createMarket = useCallback(async (params: CreateMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setLastOperationId(null)

    try {
      // Show preparing transaction toast
      toast.info('Creating market', {
        description: 'Setting up your prediction market...',
      })

      // Get current user
      const user = await getCurrentUser()

      // Convert Unix timestamp to ISO string
      const endTime = new Date(params.endTime * 1000).toISOString()

      // Extract team IDs and names from matchId if not provided
      // For now, we'll use placeholder values if not provided
      const homeTeamId = params.homeTeamId || 0
      const homeTeamName = params.homeTeamName || 'Home Team'
      const awayTeamId = params.awayTeamId || 0
      const awayTeamName = params.awayTeamName || 'Away Team'

      // Create market in Supabase
      const market = await MarketService.createMarket({
        matchId: params.matchId,
        title: params.title,
        description: params.description,
        entryFee: params.entryFee,
        endTime,
        isPublic: params.isPublic,
        creatorId: user.id,
        homeTeamId,
        homeTeamName,
        awayTeamId,
        awayTeamName,
      })

      setLastOperationId(market.id)

      // Handle success with toast notification and cache invalidation
      toast.success('Market created successfully!', {
        description: 'Your market is now live and ready for participants',
      })

      // Refresh MNEE balance after successful market creation
      setTimeout(() => {
        refreshBalance()
      }, 1000)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['user-markets'] })

      return market.id
    }
    catch (error: any) {
      console.error('[createMarket] Error occurred:', error)

      const errorMessage = error.message || 'Failed to create market'
      toast.error('Market creation failed', {
        description: errorMessage,
      })

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [publicKey, getCurrentUser, queryClient])

  /**
   * Create a similar market with pre-filled parameters
   */
  const createSimilarMarket = useCallback(async (params: CreateSimilarMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    // Calculate end time (24 hours from now)
    const endTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60)

    // Reuse the existing createMarket logic
    return await createMarket({
      matchId: params.matchId,
      title: params.title,
      description: params.description,
      entryFee: params.entryFee,
      endTime,
      isPublic: params.isPublic,
    })
  }, [createMarket, publicKey])

  /**
   * Join an existing market with a prediction
   */
  const joinMarket = useCallback(async (params: JoinMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setLastOperationId(null)

    try {
      // Show preparing transaction toast
      toast.info('Joining market', {
        description: 'Recording your prediction...',
      })

      // Get current user
      const user = await getCurrentUser()

      // Get market data to determine entry amount
      const market = await MarketService.getMarketById(params.marketId)
      if (!market) {
        throw new Error('Market not found')
      }

      // Join market in Supabase (entry_fee is stored in atomic units, convert to MNEE tokens)
      const participant = await MarketService.joinMarket({
        marketId: params.marketId,
        userId: user.id,
        prediction: params.prediction,
        entryAmount: (market.entry_fee || 0) / 100000, // Convert atomic units to MNEE tokens, handle null
      })

      setLastOperationId(participant.id)

      // Handle success
      toast.success('Joined market successfully!', {
        description: `Your ${params.prediction} prediction has been recorded`,
      })

      // Refresh MNEE balance after successful market join
      setTimeout(() => {
        refreshBalance()
      }, 1000)

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', params.marketId] })
      queryClient.invalidateQueries({ queryKey: ['participant', params.marketId, user.id] })
      queryClient.invalidateQueries({ queryKey: ['user-markets'] })

      return participant.id
    }
    catch (error: any) {
      console.error('[joinMarket] Error occurred:', error)

      const errorMessage = error.message || 'Failed to join market'
      toast.error('Failed to join market', {
        description: errorMessage,
      })

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [publicKey, getCurrentUser, queryClient])

  /**
   * Resolve a market with the match outcome
   * @deprecated Manual resolution is deprecated in favor of automated resolution
   */
  const resolveMarket = useCallback(async (_params: ResolveMarketParams) => {
    throw new Error('Manual market resolution has been disabled. Markets are now resolved automatically.')
  }, [])

  /**
   * Withdraw rewards from a resolved market
   * @deprecated Manual withdrawal is deprecated in favor of automated distribution
   */
  const withdrawRewards = useCallback(async (_marketId: string) => {
    throw new Error('Manual withdrawal has been disabled. Winnings are automatically distributed when markets resolve.')
  }, [])

  /**
   * Get operation link (placeholder for future blockchain integration)
   */
  const getExplorerLink = useCallback((operationId: string) => {
    // In the future, this could link to a transaction explorer for MNEE tokens
    // For now, return a placeholder
    return `#operation-${operationId}`
  }, [])

  return {
    createMarket,
    createSimilarMarket,
    joinMarket,
    resolveMarket,
    withdrawRewards,
    getExplorerLink,
    isLoading,
    lastOperationId,
    // Legacy compatibility
    txSignature: lastOperationId,
    estimatedFee: null,
    simulationResult: null,
  }
}