/**
 * useUserParticipantData - Hook for fetching user participant data (Web2 Migration)
 *
 * This hook previously fetched user participant data from Solana blockchain.
 * Now it's a stub that will be replaced with Supabase operations.
 */

import { useQuery } from '@tanstack/react-query'

export interface UserParticipantData {
  market: string
  user: string
  prediction: 'Home' | 'Draw' | 'Away'
  hasWithdrawn: boolean
  joinedAt: number
  entryAmount: number
  potentialWinnings: number
}

/**
 * Hook for fetching all participant data for a user (stub)
 *
 * @param userAddress - User address
 */
export function useUserParticipantData(userAddress?: string) {
  return useQuery({
    queryKey: ['user', 'participants', userAddress],
    queryFn: async (): Promise<UserParticipantData[]> => {
      if (!userAddress) {
        return []
      }

      // TODO: Implement Supabase user participant data fetching
      console.log('Fetching user participant data for:', userAddress)
      return []
    },
    enabled: !!userAddress,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}