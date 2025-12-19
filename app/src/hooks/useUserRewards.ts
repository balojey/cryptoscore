/**
 * DEPRECATED: This hook uses Anchor framework which has been removed.
 *
 * Use hooks/useParticipantData.ts combined with hooks/useMarketData.ts
 * for Anchor-free reward checking.
 */

import { useQuery } from '@tanstack/react-query'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'

/**
 * @deprecated Use useParticipantData and useMarketData instead
 * Hook to check if user has rewards to withdraw from a market
 */
export function useUserRewards(marketAddress?: string) {
  const { publicKey } = useUnifiedWallet()

  return useQuery({
    queryKey: ['user', 'rewards', marketAddress, publicKey?.toString()],
    queryFn: async () => {
      console.warn('useUserRewards: Anchor framework has been removed. Use useParticipantData and useMarketData instead.')
      return {
        hasRewards: false,
        hasWithdrawn: false,
        canWithdraw: false,
        isWinner: false,
        isResolved: false,
      }
    },
    enabled: false, // Disabled since Anchor is removed
    staleTime: 5000,
    refetchInterval: 5000,
  })
}
