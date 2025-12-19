/**
 * Supabase Participant Data Hook
 *
 * Replaces Solana-based participant data fetching with Supabase database queries
 * while maintaining the same interface and data structure.
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
 * Hook for fetching participant data for a specific market and user
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

        // Get user's participation in this market
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

// Export alias for backward compatibility
export const useParticipantData = useSupabaseParticipantData