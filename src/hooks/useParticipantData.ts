/**
 * useParticipantData - Hook for fetching participant data (Web2 Migration)
 *
 * This hook previously fetched participant data from Solana blockchain.
 * Now it's a stub that will be replaced with Supabase operations.
 */

import { useQuery } from '@tanstack/react-query'

export interface ParticipantData {
  id: string // UUID from Supabase
  market_id: string // Market UUID
  user_id: string // User UUID
  prediction: 'Home' | 'Draw' | 'Away'
  entry_amount: number
  potential_winnings: number
  actual_winnings?: number | null
  joined_at: string // ISO timestamp
}

/**
 * Hook for fetching participant data for a specific market and user (stub)
 *
 * @param marketId - Market UUID
 * @param userId - User UUID (optional, defaults to connected user)
 */
export function useParticipantData(marketId?: string, userId?: string) {
  return useQuery({
    queryKey: ['participant', marketId, userId],
    queryFn: async (): Promise<ParticipantData | null> => {
      if (!marketId || !userId) {
        return null
      }

      // TODO: Implement Supabase participant data fetching
      console.log('Fetching participant data for market:', marketId, 'user:', userId)
      
      // Return mock data for now
      return {
        id: 'mock_participant_uuid',
        market_id: marketId,
        user_id: userId,
        prediction: 'Home',
        entry_amount: 1.0,
        potential_winnings: 1.95,
        actual_winnings: null,
        joined_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      }
    },
    enabled: !!marketId && !!userId,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}