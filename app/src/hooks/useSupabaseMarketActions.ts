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

export type MatchOutcomeType = 'Home' | 'Draw' | 'Away'

export interface CreateMarketParams {
  matchId: string
  title: string
  description: string
  entryFee: number // in decimal format (e.g., 0.1)
  endTime: number // Unix timestamp
  isPublic: boolean
}

export interface JoinMarketParams {
  marketId: string
  prediction: MatchOutcomeType
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
  const { publicKey, crossmintWallet } = useUnifiedWallet()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [lastOperationId, setLastOperationId] = useState<string | null>(null)

  /**
   * Get current user from Supabase or create if needed
   */
  const getCurrentUser = useCallback(async () => {
    if (!crossmintWallet || !publicKey) {
      throw new Error('Wallet not connected')
    }

    // Get user data from Crossmint
    const walletAddress = publicKey.toString()
    const email = crossmintWallet.email || `${walletAddress}@crossmint.local`

    // Authenticate/create user in Supabase
    const { user } = await UserService.authenticateUser({
      id: walletAddress,
      email,
      walletAddress,
      displayName: crossmintWallet.displayName,
    })

    return user
  }, [crossmintWallet, publicKey])

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

      // Create market in Supabase
      const market = await MarketService.createMarket({
        matchId: params.matchId,
        title: params.title,
        description: params.description,
        entryFee: params.entryFee,
        endTime,
        isPublic: params.isPublic,
        creatorId: user.id,
      })

      setLastOperationId(market.id)

      // Handle success with toast notification and cache invalidation
      toast.success('Market created successfully!', {
        description: 'Your market is now live and ready for participants',
      })

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

      // Join market in Supabase
      const participant = await MarketService.joinMarket({
        marketId: params.marketId,
        userId: user.id,
        prediction: params.prediction,
        entryAmount: market.entry_fee,
      })

      setLastOperationId(participant.id)

      // Handle success
      toast.success('Joined market successfully!', {
        description: `Your ${params.prediction} prediction has been recorded`,
      })

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
   */
  const resolveMarket = useCallback(async (params: ResolveMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setLastOperationId(null)

    try {
      // Show preparing transaction toast
      toast.info('Resolving market', {
        description: 'Processing market resolution and calculating winnings...',
      })

      // Get current user
      const user = await getCurrentUser()

      // Check if user can resolve this market
      const canResolve = await MarketService.canUserResolveMarket(params.marketId, user.id)
      if (!canResolve) {
        throw new Error('You are not authorized to resolve this market')
      }

      // Resolve market in Supabase
      await MarketService.resolveMarket({
        marketId: params.marketId,
        outcome: params.outcome,
      })

      setLastOperationId(params.marketId)

      // Handle success
      toast.success('Market resolved successfully!', {
        description: `Market resolved with outcome: ${params.outcome}. Winnings have been distributed.`,
      })

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', params.marketId] })
      queryClient.invalidateQueries({ queryKey: ['user-markets'] })

      return params.marketId
    }
    catch (error: any) {
      console.error('[resolveMarket] Error occurred:', error)

      const errorMessage = error.message || 'Failed to resolve market'
      toast.error('Failed to resolve market', {
        description: errorMessage,
      })

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [publicKey, getCurrentUser, queryClient])

  /**
   * Withdraw rewards from a resolved market
   * Note: In Supabase version, winnings are automatically calculated and recorded
   * This function is kept for interface compatibility but doesn't perform actual withdrawal
   */
  const withdrawRewards = useCallback(async (marketId: string) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setLastOperationId(null)

    try {
      // Get current user
      const user = await getCurrentUser()

      // Get user's participation in this market
      const participation = await MarketService.getUserMarketParticipation(user.id, marketId)
      if (!participation) {
        throw new Error('You did not participate in this market')
      }

      if (!participation.actual_winnings || participation.actual_winnings <= 0) {
        throw new Error('No winnings available for withdrawal')
      }

      setLastOperationId(marketId)

      // In a real implementation, this would trigger actual token/currency transfer
      // For now, we just show success since winnings are already recorded in the database
      toast.success('🎉 Rewards available!', {
        description: `Your winnings of ${participation.actual_winnings.toFixed(4)} are recorded and ready for future token integration`,
      })

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
      queryClient.invalidateQueries({ queryKey: ['participant', marketId, user.id] })
      queryClient.invalidateQueries({ queryKey: ['user'] })

      return marketId
    }
    catch (error: any) {
      console.error('[withdrawRewards] Error occurred:', error)

      const errorMessage = error.message || 'Failed to process rewards'
      toast.error('Failed to process rewards', {
        description: errorMessage,
      })

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [publicKey, getCurrentUser, queryClient])

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