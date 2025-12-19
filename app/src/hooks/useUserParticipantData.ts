import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { MARKET_PROGRAM_ID } from '../config/programs'
import { AccountDecoder } from '../lib/solana/account-decoder'
import { useSolanaConnection } from './useSolanaConnection'

export interface UserParticipantData {
  marketAddress: string
  user: string
  prediction: number // 0=Home, 1=Draw, 2=Away
  joinedAt: number
  hasWithdrawn: boolean
}

/**
 * Hook for fetching user's participant data across all markets
 * Returns the user's predictions and participation details
 */
export function useUserParticipantData(userAddress?: string) {
  const { connection } = useSolanaConnection()

  return useQuery({
    queryKey: ['user', 'participants', userAddress],
    queryFn: async (): Promise<UserParticipantData[]> => {
      if (!userAddress) {
        return []
      }

      try {
        const userPubkey = new PublicKey(userAddress)
        const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

        // Fetch all Participant accounts where user is the participant
        const participantAccounts = await connection.getProgramAccounts(marketProgramId, {
          filters: [
            {
              dataSize: 83, // Participant::LEN = 83 bytes
            },
            {
              memcmp: {
                offset: 40, // Skip discriminator (8) + market pubkey (32) to get to user field
                bytes: userPubkey.toBase58(),
              },
            },
          ],
        })

        const participants: UserParticipantData[] = []

        for (const { account } of participantAccounts) {
          try {
            const participant = AccountDecoder.decodeParticipant(account.data)

            participants.push({
              marketAddress: participant.market.toString(),
              user: participant.user.toString(),
              prediction: participant.prediction,
              joinedAt: Number(participant.joinedAt),
              hasWithdrawn: participant.hasWithdrawn,
            })
          }
          catch (decodeError) {
            console.warn('Failed to decode participant account:', decodeError)
          }
        }

        return participants
      }
      catch (error) {
        console.error('Error fetching user participant data:', error)
        return []
      }
    },
    enabled: !!userAddress,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000,
  })
}
