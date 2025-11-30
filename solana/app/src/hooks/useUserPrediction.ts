/**
 * DEPRECATED: This hook uses Anchor framework which has been removed.
 * 
 * Use hooks/useParticipantData.ts for Anchor-free participant data fetching.
 */

import { useQuery } from '@tanstack/react-query'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'

/**
 * @deprecated Use useParticipantData instead
 * Hook to get user's prediction for a specific market
 */
export function useUserPrediction(marketAddress?: string) {
  const { publicKey } = useWallet()

  const { data } = useQuery({
    queryKey: ['user', 'prediction', marketAddress, publicKey?.toString()],
    queryFn: async () => {
      console.warn('useUserPrediction: Anchor framework has been removed. Use useParticipantData instead.')
      return {
        predictionName: 'NONE' as const,
        hasJoined: false,
        prediction: null,
      }
    },
    enabled: false, // Disabled since Anchor is removed
    staleTime: 5000,
    refetchInterval: 5000,
  })

  return data || {
    predictionName: 'NONE' as const,
    hasJoined: false,
    prediction: null,
  }
}