/**
 * Supabase Participant Data Hook
 *
 * Replaces Solana-based participant data fetching with Supabase database queries
 * while maintaining the same interface and data structure.
 * 
 * Enhanced to support multiple predictions per user per market.
 */

import { useQuery } from '@tanstack/react-query'
import { DatabaseService } from '../lib/supabase/database-service'
import { UserService } from '../lib/supabase/user-service'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'

export interface ParticipantData {
  market: string
  user: string
  prediction: 'Home' | 'Draw' | 'Away'
  hasWithdrawn: boolean
  joinedAt: number
  entryAmount: number
  potentialWinnings: number
  actualWinnings?: number
}

/**
 * Multiple predictions data structure for enhanced prediction system
 */
export interface MultipleParticipantData {
  market: string
  user: string
  predictions: ParticipantData[]
  totalStaked: number
  totalPotentialWinnings: number
  totalActualWinnings?: number
}

/**
 * Hook for fetching participant data for a specific market and user
 * Returns the first prediction for backward compatibility
 *
 * @param marketId - Market ID (using marketAddress parameter name for compatibility)
 * @param userAddress - User wallet address (optional, defaults to connected wallet)
 */
export function useSupabaseParticipantData(marketAddress?: string, userAddress?: string) {
  const { publicKey } = useUnifiedWallet()

  // Use provided userAddress or connected wallet
  const effectiveUserAddress = userAddress || publicKey?.toString()

  return useQuery({
    queryKey: ['participant', marketAddress, effectiveUserAddress],
    queryFn: async (): Promise<ParticipantData | null> => {
      if (!marketAddress || !effectiveUserAddress) {
        return null
      }

      try {
        // Get user from Supabase by wallet address
        const user = await UserService.getUserByWalletAddress(effectiveUserAddress)
        if (!user) {
          return null
        }

        // Get user's participation in this market (backward compatibility - return first prediction)
        const participation = await DatabaseService.getUserMarketParticipation(user.id, marketAddress)
        if (!participation) {
          return null
        }

        // Convert joined_at to Unix timestamp
        const joinedAt = Math.floor(new Date(participation.joined_at).getTime() / 1000)

        return {
          market: marketAddress,
          user: effectiveUserAddress,
          prediction: participation.prediction as 'Home' | 'Draw' | 'Away',
          hasWithdrawn: false, // In Supabase version, winnings are automatically recorded
          joinedAt,
          entryAmount: participation.entry_amount,
          potentialWinnings: participation.potential_winnings,
          actualWinnings: participation.actual_winnings || undefined,
        }
      }
      catch (error) {
        console.error('Error fetching participant data:', error)
        return null
      }
    },
    enabled: !!marketAddress && !!effectiveUserAddress,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching all predictions for a user in a specific market
 * Enhanced for multiple predictions per user support
 *
 * @param marketId - Market ID
 * @param userAddress - User wallet address (optional, defaults to connected wallet)
 */
export function useSupabaseMultipleParticipantData(marketAddress?: string, userAddress?: string) {
  const { publicKey } = useUnifiedWallet()

  // Use provided userAddress or connected wallet
  const effectiveUserAddress = userAddress || publicKey?.toString()

  return useQuery({
    queryKey: ['participant', 'multiple', marketAddress, effectiveUserAddress],
    queryFn: async (): Promise<MultipleParticipantData | null> => {
      if (!marketAddress || !effectiveUserAddress) {
        return null
      }

      try {
        // Get user from Supabase by wallet address
        const user = await UserService.getUserByWalletAddress(effectiveUserAddress)
        if (!user) {
          return null
        }

        // Get all user's predictions in this market
        const participations = await DatabaseService.getUserMarketPredictions(user.id, marketAddress)
        if (!participations || participations.length === 0) {
          return null
        }

        // Convert to ParticipantData format
        const predictions: ParticipantData[] = participations.map(participation => {
          const joinedAt = Math.floor(new Date(participation.joined_at).getTime() / 1000)
          
          return {
            market: marketAddress,
            user: effectiveUserAddress,
            prediction: participation.prediction as 'Home' | 'Draw' | 'Away',
            hasWithdrawn: false, // In Supabase version, winnings are automatically recorded
            joinedAt,
            entryAmount: participation.entry_amount,
            potentialWinnings: participation.potential_winnings,
            actualWinnings: participation.actual_winnings || undefined,
          }
        })

        // Calculate totals
        const totalStaked = predictions.reduce((sum, p) => sum + p.entryAmount, 0)
        const totalPotentialWinnings = predictions.reduce((sum, p) => sum + p.potentialWinnings, 0)
        const totalActualWinnings = predictions.reduce((sum, p) => sum + (p.actualWinnings || 0), 0)

        return {
          market: marketAddress,
          user: effectiveUserAddress,
          predictions,
          totalStaked,
          totalPotentialWinnings,
          totalActualWinnings: totalActualWinnings > 0 ? totalActualWinnings : undefined,
        }
      }
      catch (error) {
        console.error('Error fetching multiple participant data:', error)
        return null
      }
    },
    enabled: !!marketAddress && !!effectiveUserAddress,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000,
  })
}

// Export alias for backward compatibility
export const useParticipantData = useSupabaseParticipantData