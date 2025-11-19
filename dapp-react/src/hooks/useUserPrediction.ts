import { useAccount, useReadContract } from 'wagmi'
import { CryptoScoreMarketABI } from '../config/contracts'

/**
 * Hook to get the user's prediction for a specific market
 * @param marketAddress The market contract address
 * @returns The user's prediction (0=NONE, 1=HOME, 2=AWAY, 3=DRAW)
 */
export function useUserPrediction(marketAddress: `0x${string}` | undefined) {
  const { address } = useAccount()

  const { data: prediction, isLoading, error } = useReadContract({
    address: marketAddress,
    abi: CryptoScoreMarketABI,
    functionName: 'getUserPrediction',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(marketAddress && address),
      staleTime: 30_000, // Cache for 30 seconds
    },
  })

  const predictionNames = ['NONE', 'HOME', 'AWAY', 'DRAW'] as const
  const predictionName = prediction !== undefined ? predictionNames[Number(prediction)] : 'NONE'

  return {
    prediction: Number(prediction || 0),
    predictionName,
    isLoading,
    error,
    hasJoined: prediction !== undefined && Number(prediction) > 0,
  }
}
