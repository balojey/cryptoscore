/**
 * useParticipantData - Hook for fetching participant data for a market
 *
 * Fetches and decodes participant account data for the connected user.
 */

import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import { MARKET_PROGRAM_ID } from '../config/programs'
import { AccountDecoder } from '../lib/solana/account-decoder'
import { PDAUtils } from '../lib/solana/pda-utils'
import { useSolanaConnection } from './useSolanaConnection'

export interface ParticipantData {
  market: string
  user: string
  prediction: 'Home' | 'Draw' | 'Away'
  hasWithdrawn: boolean
  joinedAt: number
}

/**
 * Hook for fetching participant data for a specific market and user
 *
 * @param marketAddress - Market address
 * @param userAddress - User address (optional, defaults to connected wallet)
 */
export function useParticipantData(marketAddress?: string, userAddress?: string) {
  const { connection, publicKey } = useSolanaConnection()

  // Use provided userAddress or connected wallet
  const effectiveUserAddress = userAddress || publicKey?.toString()

  return useQuery({
    queryKey: ['participant', marketAddress, effectiveUserAddress],
    queryFn: async (): Promise<ParticipantData | null> => {
      if (!marketAddress || !effectiveUserAddress) {
        return null
      }

      try {
        const marketPubkey = new PublicKey(marketAddress)
        const userPubkey = new PublicKey(effectiveUserAddress)
        const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

        // Derive participant PDA for the connected user and market
        const pdaUtils = new PDAUtils(marketProgramId)
        const { pda: participantPda } = await pdaUtils.findParticipantPDA(marketPubkey, userPubkey)

        // Fetch participant account data
        const accountInfo = await connection.getAccountInfo(participantPda)

        // Handle cases where participant account doesn't exist
        if (!accountInfo || !accountInfo.data) {
          // User hasn't joined this market yet
          return null
        }

        // Decode using AccountDecoder.decodeParticipant
        const participant = AccountDecoder.decodeParticipant(accountInfo.data)

        return {
          market: participant.market.toString(),
          user: participant.user.toString(),
          prediction: parsePrediction(participant.prediction),
          hasWithdrawn: participant.hasWithdrawn,
          joinedAt: Number(participant.joinedAt),
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

// Helper to convert prediction enum
// Note: Rust enum is 0-indexed (Home=0, Draw=1, Away=2)
function parsePrediction(prediction: number): 'Home' | 'Draw' | 'Away' {
  switch (prediction) {
    case 0: return 'Home'
    case 1: return 'Draw'
    case 2: return 'Away'
    default: return 'Home'
  }
}
