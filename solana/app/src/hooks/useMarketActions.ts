import { useCallback, useState } from 'react'
import { toast } from 'react-hot-toast'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'
import { useSolanaProgram } from './useSolanaProgram'

export type MatchOutcome = 'Home' | 'Draw' | 'Away'

export interface CreateMarketParams {
  matchId: string
  entryFee: number // in lamports
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
  const createMarket = useCallback(async (params: CreateMarketParams) => {
    if (!factoryProgram || !marketProgram || !provider || !wallet.publicKey) {
      const missingItems = []
      if (!factoryProgram) missingItems.push('factoryProgram')
      if (!marketProgram) missingItems.push('marketProgram')
      if (!provider) missingItems.push('provider')
      if (!wallet.publicKey) missingItems.push('wallet')
      
      const errorMsg = `Missing: ${missingItems.join(', ')}`
      console.error('Cannot create market:', errorMsg)
      toast.error('Wallet not connected or programs not initialized')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      console.log('Factory Program ID:', factoryProgram.programId.toString())
      console.log('Market Program ID:', marketProgram.programId.toString())
      
      // Derive Factory PDA
      const [factoryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('factory')],
        factoryProgram.programId
      )

      // Derive Market Registry PDA
      const [marketRegistryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('market_registry'),
          factoryPda.toBuffer(),
          Buffer.from(params.matchId)
        ],
        factoryProgram.programId
      )

      // Derive Market PDA (from Market program)
      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('market'),
          factoryPda.toBuffer(),
          Buffer.from(params.matchId)
        ],
        marketProgram.programId
      )

      // Step 1: Initialize the Market account
      const initMarketTx = await marketProgram.methods
        .initializeMarket(
          params.matchId,
          new BN(params.entryFee),
          new BN(params.kickoffTime),
          new BN(params.endTime),
          params.isPublic
        )
        .accounts({
          market: marketPda,
          factory: factoryPda,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log('Market initialized:', initMarketTx)

      // Step 2: Register the market in the Factory
      const createMarketTx = await factoryProgram.methods
        .createMarket(
          params.matchId,
          new BN(params.entryFee),
          new BN(params.kickoffTime),
          new BN(params.endTime),
          params.isPublic
        )
        .accounts({
          factory: factoryPda,
          marketRegistry: marketRegistryPda,
          marketAccount: marketPda,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log('Market registered in factory:', createMarketTx)

      setTxSignature(createMarketTx)
      toast.success('Market created successfully!')
      return createMarketTx
    }
    catch (error: any) {
      console.error('Error creating market:', error)
      toast.error(error.message || 'Failed to create market')
      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [factoryProgram, marketProgram, provider, wallet.publicKey])

  /**
   * Join an existing market with a prediction
   */
  const joinMarket = useCallback(async (params: JoinMarketParams) => {
    if (!marketProgram || !provider || !wallet.publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const marketPubkey = new PublicKey(params.marketAddress)

      // Derive participant PDA
      const [participantPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('participant'),
          marketPubkey.toBuffer(),
          wallet.publicKey.toBuffer()
        ],
        marketProgram.programId
      )

      // Convert prediction to enum format expected by Anchor
      const predictionEnum = params.prediction === 'Home' 
        ? { home: {} } 
        : params.prediction === 'Draw' 
          ? { draw: {} } 
          : { away: {} }

      // Call joinMarket instruction
      const tx = await marketProgram.methods
        .joinMarket(predictionEnum)
        .accounts({
          market: marketPubkey,
          participant: participantPda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      setTxSignature(tx)
      toast.success('Joined market successfully!')
      return tx
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
  const resolveMarket = useCallback(async (params: ResolveMarketParams) => {
    if (!marketProgram || !provider || !wallet.publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const marketPubkey = new PublicKey(params.marketAddress)

      // Convert outcome to enum format expected by Anchor
      const outcomeEnum = params.outcome === 'Home' 
        ? { home: {} } 
        : params.outcome === 'Draw' 
          ? { draw: {} } 
          : { away: {} }

      // Call resolveMarket instruction
      const tx = await marketProgram.methods
        .resolveMarket(outcomeEnum)
        .accounts({
          market: marketPubkey,
          creator: wallet.publicKey,
        })
        .rpc()

      setTxSignature(tx)
      toast.success('Market resolved successfully!')
      return tx
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
  const withdrawRewards = useCallback(async (marketAddress: string) => {
    if (!marketProgram || !provider || !wallet.publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const marketPubkey = new PublicKey(marketAddress)

      // Derive participant PDA
      const [participantPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('participant'),
          marketPubkey.toBuffer(),
          wallet.publicKey.toBuffer()
        ],
        marketProgram.programId
      )

      // Call withdrawRewards instruction
      const tx = await marketProgram.methods
        .withdrawRewards()
        .accounts({
          market: marketPubkey,
          participant: participantPda,
          user: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      setTxSignature(tx)
      toast.success('Rewards withdrawn successfully!')
      return tx
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
