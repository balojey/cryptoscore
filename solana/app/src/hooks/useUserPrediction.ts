import { useQuery } from '@tanstack/react-query'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSolanaProgram } from './useSolanaProgram'

/**
 * Hook to get user's prediction for a specific market
 */
export function useUserPrediction(marketAddress?: string) {
  const { publicKey } = useWallet()
  const { marketProgram, isReady } = useSolanaProgram()

  const { data } = useQuery({
    queryKey: ['user', 'prediction', marketAddress, publicKey?.toString()],
    queryFn: async () => {
      if (!marketProgram || !isReady || !marketAddress || !publicKey) {
        return {
          predictionName: 'NONE' as const,
          hasJoined: false,
          prediction: null,
        }
      }

      try {
        const marketPubkey = new PublicKey(marketAddress)
        
        // Derive participant PDA
        const [participantPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('participant'),
            marketPubkey.toBuffer(),
            publicKey.toBuffer()
          ],
          marketProgram.programId
        )

        // Fetch participant account
        const participant = await marketProgram.account.participant.fetch(participantPda)

        // Convert prediction enum to string
        let predictionName: 'HOME' | 'AWAY' | 'DRAW' | 'NONE' = 'NONE'
        if ('home' in participant.prediction) {
          predictionName = 'HOME'
        } else if ('draw' in participant.prediction) {
          predictionName = 'DRAW'
        } else if ('away' in participant.prediction) {
          predictionName = 'AWAY'
        }

        return {
          predictionName,
          hasJoined: true,
          prediction: participant.prediction,
        }
      } catch (error) {
        // Account doesn't exist - user hasn't joined this market
        return {
          predictionName: 'NONE' as const,
          hasJoined: false,
          prediction: null,
        }
      }
    },
    enabled: isReady && !!marketProgram && !!marketAddress && !!publicKey,
    staleTime: 5000,
    refetchInterval: 5000,
  })

  return data || {
    predictionName: 'NONE' as const,
    hasJoined: false,
    prediction: null,
  }
}