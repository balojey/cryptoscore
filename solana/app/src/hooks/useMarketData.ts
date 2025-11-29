import { useQuery } from '@tanstack/react-query'
import { PublicKey } from '@solana/web3.js'
import { useSolanaConnection } from './useSolanaConnection'
import { AccountDecoder } from '../lib/solana/account-decoder'
import { MARKET_PROGRAM_ID } from '../config/programs'
import { PDAUtils } from '../lib/solana/pda-utils'

export interface Participant {
  user: string
  prediction: number
  amount: number
}

export interface MarketData {
  marketAddress: string
  creator: string
  matchId: string
  entryFee: number
  kickoffTime: number
  endTime: number
  status: 'Open' | 'Live' | 'Resolved' | 'Cancelled'
  outcome: 'Home' | 'Draw' | 'Away' | null
  totalPool: number
  participantCount: number
  homeCount: number
  drawCount: number
  awayCount: number
  isPublic: boolean
  participants?: Participant[]
}

// Helper to convert status enum from account data
function parseMarketStatus(status: number): 'Open' | 'Live' | 'Resolved' | 'Cancelled' {
  switch (status) {
    case 0: return 'Open'
    case 1: return 'Live'
    case 2: return 'Resolved'
    case 3: return 'Cancelled'
    default: return 'Open'
  }
}

// Helper to convert outcome enum from account data
function parseOutcome(outcome: number): 'Home' | 'Draw' | 'Away' | null {
  switch (outcome) {
    case 0: return null // None
    case 1: return 'Home'
    case 2: return 'Draw'
    case 3: return 'Away'
    default: return null
  }
}

/**
 * Hook for fetching detailed information for a specific market
 */
export function useMarketData(marketAddress?: string) {
  const { connection, isConnected } = useSolanaConnection()

  return useQuery({
    queryKey: ['market', 'details', marketAddress],
    queryFn: async (): Promise<MarketData | null> => {
      if (!marketAddress) {
        return null
      }

      try {
        const marketPubkey = new PublicKey(marketAddress)
        
        // Fetch market account using connection.getAccountInfo
        const accountInfo = await connection.getAccountInfo(marketPubkey)
        
        // Handle account not found
        if (!accountInfo || !accountInfo.data) {
          console.warn('Market account not found:', marketAddress)
          return null
        }

        // Decode account data using AccountDecoder
        const market = AccountDecoder.decodeMarket(accountInfo.data)

        return {
          marketAddress: marketPubkey.toString(),
          creator: market.creator.toString(),
          matchId: market.matchId,
          entryFee: Number(market.entryFee),
          kickoffTime: Number(market.kickoffTime),
          endTime: Number(market.endTime),
          status: parseMarketStatus(market.status),
          outcome: parseOutcome(market.outcome),
          totalPool: Number(market.totalPool),
          participantCount: Number(market.participantCount),
          homeCount: Number(market.homeCount),
          drawCount: Number(market.drawCount),
          awayCount: Number(market.awayCount),
          isPublic: market.isPublic,
        }
      } catch (error) {
        console.error('Error fetching market details:', error)
        return null
      }
    },
    enabled: !!marketAddress,
    staleTime: 10000, // 10 seconds
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching all markets
 */
export function useAllMarkets() {
  const { connection } = useSolanaConnection()

  return useQuery({
    queryKey: ['markets', 'all'],
    queryFn: async (): Promise<MarketData[]> => {
      try {
        const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)
        
        // Fetch all market accounts using connection.getProgramAccounts
        const accounts = await connection.getProgramAccounts(marketProgramId, {
          filters: [
            {
              // Filter by account size (markets have a specific size)
              dataSize: 200, // Approximate size, adjust based on actual account structure
            },
          ],
        })

        // Decode each account using AccountDecoder
        const markets: MarketData[] = []
        
        for (const { pubkey, account } of accounts) {
          try {
            const market = AccountDecoder.decodeMarket(account.data)
            
            markets.push({
              marketAddress: pubkey.toString(),
              creator: market.creator.toString(),
              matchId: market.matchId,
              entryFee: Number(market.entryFee),
              kickoffTime: Number(market.kickoffTime),
              endTime: Number(market.endTime),
              status: parseMarketStatus(market.status),
              outcome: parseOutcome(market.outcome),
              totalPool: Number(market.totalPool),
              participantCount: Number(market.participantCount),
              homeCount: Number(market.homeCount),
              drawCount: Number(market.drawCount),
              awayCount: Number(market.awayCount),
              isPublic: market.isPublic,
            })
          } catch (decodeError) {
            console.warn('Failed to decode market account:', pubkey.toString(), decodeError)
            // Skip accounts that fail to decode
          }
        }

        // Sort by kickoff time (newest first)
        markets.sort((a, b) => b.kickoffTime - a.kickoffTime)

        return markets
      } catch (error) {
        console.error('Error fetching all markets:', error)
        return []
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

/**
 * Hook for fetching markets for a specific user
 */
export function useUserMarkets(userAddress?: string) {
  const { connection } = useSolanaConnection()

  return useQuery({
    queryKey: ['markets', 'user', userAddress],
    queryFn: async (): Promise<MarketData[]> => {
      if (!userAddress) {
        return []
      }

      try {
        const userPubkey = new PublicKey(userAddress)
        const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)
        
        // Fetch all market accounts
        const accounts = await connection.getProgramAccounts(marketProgramId, {
          filters: [
            {
              dataSize: 200, // Approximate size
            },
          ],
        })

        // Decode and filter markets where user is creator or participant
        const userMarkets: MarketData[] = []
        
        for (const { pubkey, account } of accounts) {
          try {
            const market = AccountDecoder.decodeMarket(account.data)
            
            // Check if user is the creator
            if (market.creator.equals(userPubkey)) {
              userMarkets.push({
                marketAddress: pubkey.toString(),
                creator: market.creator.toString(),
                matchId: market.matchId,
                entryFee: Number(market.entryFee),
                kickoffTime: Number(market.kickoffTime),
                endTime: Number(market.endTime),
                status: parseMarketStatus(market.status),
                outcome: parseOutcome(market.outcome),
                totalPool: Number(market.totalPool),
                participantCount: Number(market.participantCount),
                homeCount: Number(market.homeCount),
                drawCount: Number(market.drawCount),
                awayCount: Number(market.awayCount),
                isPublic: market.isPublic,
              })
            }
          } catch (decodeError) {
            console.warn('Failed to decode market account:', pubkey.toString(), decodeError)
          }
        }

        // Sort by kickoff time (newest first)
        userMarkets.sort((a, b) => b.kickoffTime - a.kickoffTime)

        return userMarkets
      } catch (error) {
        console.error('Error fetching user markets:', error)
        return []
      }
    },
    enabled: !!userAddress,
    staleTime: 10000,
    refetchInterval: 10000,
  })
}

/**
 * Hook for fetching user statistics
 */
export function useUserStats(userAddress?: string) {
  const { connection } = useSolanaConnection()

  return useQuery({
    queryKey: ['user', 'stats', userAddress],
    queryFn: async () => {
      if (!userAddress) {
        return null
      }

      try {
        const userPubkey = new PublicKey(userAddress)
        const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)
        
        // Derive UserStats PDA
        const pdaUtils = new PDAUtils(marketProgramId)
        const { pda: userStatsPda } = await pdaUtils.findUserStatsPDA(userPubkey)
        
        // Fetch UserStats account
        const accountInfo = await connection.getAccountInfo(userStatsPda)
        
        if (!accountInfo || !accountInfo.data) {
          // Return null if account doesn't exist yet (user hasn't participated in any markets)
          return null
        }

        // Decode UserStats account
        const userStats = AccountDecoder.decodeUserStats(accountInfo.data)

        return {
          user: userStats.user.toString(),
          totalMarkets: Number(userStats.totalMarkets),
          totalWins: Number(userStats.totalWins),
          totalEarnings: Number(userStats.totalEarnings),
          currentStreak: Number(userStats.currentStreak),
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
        return null
      }
    },
    enabled: !!userAddress,
    staleTime: 30000, // 30 seconds
  })
}
