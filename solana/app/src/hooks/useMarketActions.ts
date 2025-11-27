import { useCallback, useState } from 'react'
import { toast } from 'react-hot-toast'
// import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useSolanaProgram } from './useSolanaProgram'

export type MatchOutcome = 'Home' | 'Draw' | 'Away'

export interface CreateMarketParams {
  matchId: string
  entryFee: number // in SOL
  kickoffTime: number
  endTime: number
  isPublic: boolean
}

export interface JoinMarketParams {
  marketAddress: string
  prediction: MatchOutcome
}

export interface ResolveMarketParams {
  marketAddress: string
  outcome: MatchOutcome
}

/**
 * Hook for performing market actions (create, join, resolve, withdraw)
 * Handles transaction signing, confirmation, and loading states
 */
export function useMarketActions() {
  const { factoryProgram, marketProgram, wallet, provider } = useSolanaProgram()
  const [isLoading, setIsLoading] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  /**
   * Create a new prediction market
   */
  const createMarket = useCallback(async (_params: CreateMarketParams) => {
    if (!factoryProgram || !provider || !wallet.publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      // TODO: Implement after Factory Program is deployed
      // Convert entry fee from SOL to lamports
      // const entryFeeLamports = params.entryFee * LAMPORTS_PER_SOL

      // Derive market PDA
      // const [marketPda] = PublicKey.findProgramAddressSync(
      //   [
      //     Buffer.from('market'),
      //     factoryProgram.programId.toBuffer(),
      //     Buffer.from(params.matchId)
      //   ],
      //   marketProgram.programId
      // )

      // Call create_market instruction
      // const tx = await factoryProgram.methods
      //   .createMarket(
      //     params.matchId,
      //     new BN(entryFeeLamports),
      //     new BN(params.kickoffTime),
      //     new BN(params.endTime),
      //     params.isPublic
      //   )
      //   .accounts({
      //     factory: factoryPda,
      //     market: marketPda,
      //     creator: wallet.publicKey,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .rpc()

      // setTxSignature(tx)
      // toast.success('Market created successfully!')
      // return tx

      toast('Market creation not yet implemented')
      return null
    }
    catch (error: any) {
      console.error('Error creating market:', error)
      toast.error(error.message || 'Failed to create market')
      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [factoryProgram, provider, wallet.publicKey])

  /**
   * Join an existing market with a prediction
   */
  const joinMarket = useCallback(async (_params: JoinMarketParams) => {
    if (!marketProgram || !provider || !wallet.publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      // TODO: Implement after Market Program is deployed
      // const marketPubkey = new PublicKey(params.marketAddress)

      // Fetch market to get entry fee
      // const market = await marketProgram.account.market.fetch(marketPubkey)

      // Derive participant PDA
      // const [participantPda] = PublicKey.findProgramAddressSync(
      //   [
      //     Buffer.from('participant'),
      //     marketPubkey.toBuffer(),
      //     wallet.publicKey.toBuffer()
      //   ],
      //   marketProgram.programId
      // )

      // Convert prediction to enum
      // const predictionEnum = { [params.prediction.toLowerCase()]: {} }

      // Call join_market instruction
      // const tx = await marketProgram.methods
      //   .joinMarket(predictionEnum)
      //   .accounts({
      //     market: marketPubkey,
      //     participant: participantPda,
      //     user: wallet.publicKey,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .rpc()

      // setTxSignature(tx)
      // toast.success('Joined market successfully!')
      // return tx

      toast('Join market not yet implemented')
      return null
    }
    catch (error: any) {
      console.error('Error joining market:', error)
      toast.error(error.message || 'Failed to join market')
      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [marketProgram, provider, wallet.publicKey])

  /**
   * Resolve a market with the match outcome
   */
  const resolveMarket = useCallback(async (_params: ResolveMarketParams) => {
    if (!marketProgram || !provider || !wallet.publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      // TODO: Implement after Market Program is deployed
      // const marketPubkey = new PublicKey(params.marketAddress)

      // Convert outcome to enum
      // const outcomeEnum = { [params.outcome.toLowerCase()]: {} }

      // Call resolve_market instruction
      // const tx = await marketProgram.methods
      //   .resolveMarket(outcomeEnum)
      //   .accounts({
      //     market: marketPubkey,
      //     authority: wallet.publicKey,
      //   })
      //   .rpc()

      // setTxSignature(tx)
      // toast.success('Market resolved successfully!')
      // return tx

      toast('Resolve market not yet implemented')
      return null
    }
    catch (error: any) {
      console.error('Error resolving market:', error)
      toast.error(error.message || 'Failed to resolve market')
      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [marketProgram, provider, wallet.publicKey])

  /**
   * Withdraw rewards from a resolved market
   */
  const withdrawRewards = useCallback(async (_marketAddress: string) => {
    if (!marketProgram || !provider || !wallet.publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      // TODO: Implement after Market Program is deployed
      // const marketPubkey = new PublicKey(marketAddress)

      // Derive participant PDA
      // const [participantPda] = PublicKey.findProgramAddressSync(
      //   [
      //     Buffer.from('participant'),
      //     marketPubkey.toBuffer(),
      //     wallet.publicKey.toBuffer()
      //   ],
      //   marketProgram.programId
      // )

      // Call withdraw instruction
      // const tx = await marketProgram.methods
      //   .withdraw()
      //   .accounts({
      //     market: marketPubkey,
      //     participant: participantPda,
      //     user: wallet.publicKey,
      //     systemProgram: SystemProgram.programId,
      //   })
      //   .rpc()

      // setTxSignature(tx)
      // toast.success('Rewards withdrawn successfully!')
      // return tx

      toast('Withdraw rewards not yet implemented')
      return null
    }
    catch (error: any) {
      console.error('Error withdrawing rewards:', error)
      toast.error(error.message || 'Failed to withdraw rewards')
      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [marketProgram, provider, wallet.publicKey])

  /**
   * Get Solana Explorer link for a transaction
   */
  const getExplorerLink = useCallback((signature: string) => {
    const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
    const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`
    return `https://explorer.solana.com/tx/${signature}${cluster}`
  }, [])

  return {
    createMarket,
    joinMarket,
    resolveMarket,
    withdrawRewards,
    getExplorerLink,
    isLoading,
    txSignature,
  }
}
