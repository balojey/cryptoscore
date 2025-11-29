import { useQuery } from '@tanstack/react-query'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useSolanaProgram } from './useSolanaProgram'

/**
 * Hook to check if user has rewards to withdraw from a market
 */
export function useUserRewards(marketAddress?: string) {
  const { publicKey } = useWallet()
  const { marketProgram, isReady } = useSolanaProgram()

  return useQuery({
    queryKey: ['user', 'rewards', marketAddress, publicKey?.toString()],
    queryFn: async () => {
      if (!marketProgram || !isReady || !marketAddress || !publicKey) {
        return {
          hasRewards: false,
          hasWithdrawn: false,
          canWithdraw: false,
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
        
        // Fetch market account to check if resolved and get outcome
        const market = await marketProgram.account.market.fetch(marketPubkey)
        
        // Check if user is a winner
        const isWinner = market.outcome && (
          ('home' in market.outcome && 'home' in participant.prediction) ||
          ('draw' in market.outcome && 'draw' in participant.prediction) ||
          ('away' in market.outcome && 'away' in participant.prediction)
        )

        const isResolved = 'resolved' in market.status
        const hasWithdrawn = participant.hasWithdrawn
        const canWithdraw = isResolved && isWinner && !hasWithdrawn

        return {
          hasRewards: isWinner && !hasWithdrawn,
          hasWithdrawn,
          canWithdraw,
          isWinner: Boolean(isWinner),
          isResolved,
        }
      } catch (error) {
        // Account doesn't exist - user hasn't joined this market
        return {
          hasRewards: false,
          hasWithdrawn: false,
          canWithdraw: false,
          isWinner: false,
          isResolved: false,
        }
      }
    },
    enabled: isReady && !!marketProgram && !!marketAddress && !!publicKey,
    staleTime: 5000,
    refetchInterval: 5000,
  })
}
