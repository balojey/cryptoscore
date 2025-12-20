/**
 * useParticipantData - Hook for fetching participant data (Web2 Migration)
 *
 * This hook previously fetched participant data from Solana blockchain.
 * Now it's a stub that will be replaced with Supabase operations.
 */

import { useQuery } from '@tanstack/react-query'

export interface ParticipantData {
  market: string
  user: string
  prediction: 'Home' | 'Draw' | 'Away'
  hasWithdrawn: boolean
  joinedAt: number
}

/**
 * Hook for fetching participant data for a specific market and user (stub)
 *
 * @param marketAddress - Market address
 * @param userAddress - User address (optional, defaults to connected wallet)
 */
export function useParticipantData(marketAddress?: string, userAddress?: string) {
  return useQuery({
    queryKey: ['participant', marketAddress, userAddress],
    queryFn: async (): Promise<ParticipantData | null> => {
      if (!marketAddress || !userAddress) {
        return null
      }

      // TODO: Implement Supabase participant data fetching
      console.log('Fetching participant data for market:', marketAddress, 'user:', userAddress)
      
      // Return mock data for now
      return {
        market: marketAddress,
        user: userAddress,
        prediction: 'Home',
        hasWithdrawn: false,
        joinedAt: Date.now() - 3600000, // 1 hour ago
      }
    },
    enabled: !!marketAddress && !!userAddress,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}