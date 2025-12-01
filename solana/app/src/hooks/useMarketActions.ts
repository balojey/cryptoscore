import { useCallback, useState } from 'react'
import { toast } from 'react-hot-toast'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useSolanaConnection } from './useSolanaConnection'
import { TransactionBuilder, type FeeEstimate } from '../lib/solana/transaction-builder'
import { InstructionEncoder } from '../lib/solana/instruction-encoder'
import { PDAUtils } from '../lib/solana/pda-utils'
import { SolanaErrorHandler } from '../lib/solana/error-handler'
import { SolanaUtils } from '../lib/solana/utils'
import { FACTORY_PROGRAM_ID, MARKET_PROGRAM_ID } from '../config/programs'
import { PredictionChoice, MatchOutcome } from '../types/solana-program-types'

export type MatchOutcomeType = 'Home' | 'Draw' | 'Away'

export interface CreateMarketParams {
  matchId: string
  entryFee: number // in lamports
  kickoffTime: number
  endTime: number
  isPublic: boolean
}

export interface JoinMarketParams {
  marketAddress: string
  prediction: MatchOutcomeType
}

export interface ResolveMarketParams {
  marketAddress: string
  outcome: MatchOutcomeType
}

/**
 * Hook for performing market actions (create, join, resolve, withdraw)
 * Handles transaction signing, confirmation, and loading states
 */
export interface SimulationResult {
  success: boolean
  logs?: string[]
  error?: string
}

export function useMarketActions() {
  const { connection, publicKey, sendTransaction } = useSolanaConnection()
  const queryClient = useQueryClient()
  const [isLoading, setIsLoading] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [estimatedFee, setEstimatedFee] = useState<FeeEstimate | null>(null)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)

  /**
   * Simulate a transaction before sending
   * Logs results and returns simulation outcome
   */
  const simulateBeforeSend = useCallback(async (
    transaction: any,
    operationName: string
  ): Promise<boolean> => {
    console.log(`Simulating ${operationName} transaction...`)
    
    const simulation = await SolanaUtils.simulateTransaction(connection, transaction)
    setSimulationResult(simulation)

    if (simulation.success) {
      console.log(`✅ ${operationName} simulation successful`)
      if (simulation.logs && simulation.logs.length > 0) {
        console.log('Simulation logs:', simulation.logs)
      }
      return true
    }
    else {
      console.error(`❌ ${operationName} simulation failed:`, simulation.error)
      if (simulation.logs && simulation.logs.length > 0) {
        console.error('Simulation logs:', simulation.logs)
      }
      
      // Warn user about simulation failure
      const shouldProceed = window.confirm(
        `Transaction simulation failed: ${simulation.error}\n\n` +
        'This transaction may fail on-chain. Do you want to proceed anyway?\n\n' +
        'Click OK to proceed or Cancel to abort.'
      )
      
      return shouldProceed
    }
  }, [connection])

  /**
   * Create a new prediction market
   */
  const createMarket = useCallback(async (params: CreateMarketParams) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const factoryProgramId = new PublicKey(FACTORY_PROGRAM_ID)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)
      
      // Derive Factory and Market PDAs using PDAUtils
      const factoryPdaUtils = new PDAUtils(factoryProgramId)
      const marketPdaUtils = new PDAUtils(marketProgramId)
      
      const { pda: factoryPda } = await factoryPdaUtils.findFactoryPDA()
      const { pda: marketPda } = await marketPdaUtils.findMarketPDA(factoryPda, params.matchId)

      console.log('Factory PDA:', factoryPda.toString())
      console.log('Market PDA:', marketPda.toString())

      // Build instruction using InstructionEncoder
      const encoder = new InstructionEncoder(marketProgramId)
      const createMarketInstruction = encoder.createMarket(
        {
          matchId: params.matchId,
          entryFee: BigInt(params.entryFee),
          kickoffTime: BigInt(params.kickoffTime),
          endTime: BigInt(params.endTime),
          isPublic: params.isPublic,
        },
        {
          factory: factoryPda,
          market: marketPda,
          creator: publicKey,
          systemProgram: SystemProgram.programId,
        }
      )

      // Build transaction using TransactionBuilder
      const builder = new TransactionBuilder({
        computeUnitLimit: 200000,
        computeUnitPrice: 1,
      })
      
      builder.addInstruction(createMarketInstruction)

      // Estimate fee before building final transaction
      const feeEstimate = await builder.previewFee(connection, publicKey)
      setEstimatedFee(feeEstimate)

      if (feeEstimate.success) {
        console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
      }
      else {
        console.warn('Fee estimation failed:', feeEstimate.error)
        // Continue with transaction even if fee estimation fails
      }

      const transaction = await builder.build(connection)
      transaction.feePayer = publicKey

      // Simulate transaction before sending
      const shouldProceed = await simulateBeforeSend(transaction, 'createMarket')
      if (!shouldProceed) {
        toast.error('Transaction cancelled by user')
        return null
      }

      // Send transaction using wallet adapter (handles signing internally)
      const signature = await sendTransaction(transaction, connection)

      console.log('Transaction sent:', signature)

      // Confirm transaction with retry logic
      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)
      
      if (!confirmed) {
        throw new Error('Transaction confirmation failed')
      }

      setTxSignature(signature)
      
      // Handle success with toast notification and cache invalidation
      toast.success('Market created successfully!')
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      
      return signature
    }
    catch (error: any) {
      // Handle errors with SolanaErrorHandler
      SolanaErrorHandler.logError(error, 'createMarket')
      const errorMessage = SolanaErrorHandler.getUserMessage(error)
      toast.error(errorMessage)
      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, sendTransaction, queryClient, simulateBeforeSend])

  /**
   * Join an existing market with a prediction
   */
  const joinMarket = useCallback(async (params: JoinMarketParams) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const marketPubkey = new PublicKey(params.marketAddress)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

      // Derive participant PDA using PDAUtils
      const pdaUtils = new PDAUtils(marketProgramId)
      const { pda: participantPda } = await pdaUtils.findParticipantPDA(marketPubkey, publicKey)

      console.log('Participant PDA:', participantPda.toString())

      // Convert prediction to enum value
      const predictionValue = params.prediction === 'Home' 
        ? PredictionChoice.Home 
        : params.prediction === 'Draw' 
          ? PredictionChoice.Draw 
          : PredictionChoice.Away

      // Build instruction using InstructionEncoder
      const encoder = new InstructionEncoder(marketProgramId)
      const joinMarketInstruction = encoder.joinMarket(
        { prediction: predictionValue },
        {
          market: marketPubkey,
          participant: participantPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        }
      )

      // Build and send transaction
      const builder = new TransactionBuilder({
        computeUnitLimit: 200000,
        computeUnitPrice: 1,
      })
      
      builder.addInstruction(joinMarketInstruction)

      // Estimate fee before building final transaction
      const feeEstimate = await builder.previewFee(connection, publicKey)
      setEstimatedFee(feeEstimate)

      if (feeEstimate.success) {
        console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
      }
      else {
        console.warn('Fee estimation failed:', feeEstimate.error)
      }

      const transaction = await builder.build(connection)
      transaction.feePayer = publicKey

      // Simulate transaction before sending
      const shouldProceed = await simulateBeforeSend(transaction, 'joinMarket')
      if (!shouldProceed) {
        toast.error('Transaction cancelled by user')
        return null
      }

      const signature = await sendTransaction(transaction, connection)

      console.log('Transaction sent:', signature)

      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)
      
      if (!confirmed) {
        throw new Error('Transaction confirmation failed')
      }

      setTxSignature(signature)
      
      // Handle success and errors appropriately
      toast.success('Joined market successfully!')
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', params.marketAddress] })
      
      return signature
    }
    catch (error: any) {
      SolanaErrorHandler.logError(error, 'joinMarket')
      const errorMessage = SolanaErrorHandler.getUserMessage(error)
      toast.error(errorMessage)
      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, sendTransaction, queryClient, simulateBeforeSend])

  /**
   * Resolve a market with the match outcome
   */
  const resolveMarket = useCallback(async (params: ResolveMarketParams) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const marketPubkey = new PublicKey(params.marketAddress)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

      // Convert outcome to enum value
      const outcomeValue = params.outcome === 'Home' 
        ? MatchOutcome.Home 
        : params.outcome === 'Draw' 
          ? MatchOutcome.Draw 
          : MatchOutcome.Away

      // Build instruction using InstructionEncoder
      const encoder = new InstructionEncoder(marketProgramId)
      const resolveMarketInstruction = encoder.resolveMarket(
        { outcome: outcomeValue },
        {
          market: marketPubkey,
          resolver: publicKey,
        }
      )

      // Build and send transaction
      const builder = new TransactionBuilder({
        computeUnitLimit: 200000,
        computeUnitPrice: 1,
      })
      
      builder.addInstruction(resolveMarketInstruction)

      // Estimate fee before building final transaction
      const feeEstimate = await builder.previewFee(connection, publicKey)
      setEstimatedFee(feeEstimate)

      if (feeEstimate.success) {
        console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
      }
      else {
        console.warn('Fee estimation failed:', feeEstimate.error)
      }

      const transaction = await builder.build(connection)
      transaction.feePayer = publicKey

      // Simulate transaction before sending
      const shouldProceed = await simulateBeforeSend(transaction, 'resolveMarket')
      if (!shouldProceed) {
        toast.error('Transaction cancelled by user')
        return null
      }

      const signature = await sendTransaction(transaction, connection)

      console.log('Transaction sent:', signature)

      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)
      
      if (!confirmed) {
        throw new Error('Transaction confirmation failed')
      }

      setTxSignature(signature)
      
      // Handle success and errors appropriately
      toast.success('Market resolved successfully!')
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', params.marketAddress] })
      
      return signature
    }
    catch (error: any) {
      SolanaErrorHandler.logError(error, 'resolveMarket')
      const errorMessage = SolanaErrorHandler.getUserMessage(error)
      toast.error(errorMessage)
      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, sendTransaction, queryClient, simulateBeforeSend])

  /**
   * Withdraw rewards from a resolved market
   */
  const withdrawRewards = useCallback(async (marketAddress: string) => {
    if (!publicKey || !sendTransaction) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      const marketPubkey = new PublicKey(marketAddress)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

      // Derive participant PDA using PDAUtils
      const pdaUtils = new PDAUtils(marketProgramId)
      const { pda: participantPda } = await pdaUtils.findParticipantPDA(marketPubkey, publicKey)

      console.log('Participant PDA:', participantPda.toString())

      // Build instruction using InstructionEncoder
      const encoder = new InstructionEncoder(marketProgramId)
      const withdrawInstruction = encoder.withdraw({
        market: marketPubkey,
        participant: participantPda,
        user: publicKey,
        systemProgram: SystemProgram.programId,
      })

      // Build and send transaction
      const builder = new TransactionBuilder({
        computeUnitLimit: 200000,
        computeUnitPrice: 1,
      })
      
      builder.addInstruction(withdrawInstruction)

      // Estimate fee before building final transaction
      const feeEstimate = await builder.previewFee(connection, publicKey)
      setEstimatedFee(feeEstimate)

      if (feeEstimate.success) {
        console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
      }
      else {
        console.warn('Fee estimation failed:', feeEstimate.error)
      }

      const transaction = await builder.build(connection)
      transaction.feePayer = publicKey

      // Simulate transaction before sending
      const shouldProceed = await simulateBeforeSend(transaction, 'withdrawRewards')
      if (!shouldProceed) {
        toast.error('Transaction cancelled by user')
        return null
      }

      const signature = await sendTransaction(transaction, connection)

      console.log('Transaction sent:', signature)

      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)
      
      if (!confirmed) {
        throw new Error('Transaction confirmation failed')
      }

      setTxSignature(signature)
      
      // Handle success with celebration and cache invalidation
      toast.success('🎉 Rewards withdrawn successfully!')
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketAddress] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      
      return signature
    }
    catch (error: any) {
      SolanaErrorHandler.logError(error, 'withdrawRewards')
      const errorMessage = SolanaErrorHandler.getUserMessage(error)
      toast.error(errorMessage)
      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, sendTransaction, queryClient, simulateBeforeSend])

  /**
   * Get Solana Explorer link for a transaction
   */
  const getExplorerLink = useCallback((signature: string) => {
    const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
    return SolanaUtils.getExplorerUrl(signature, network as any)
  }, [])

  return {
    createMarket,
    joinMarket,
    resolveMarket,
    withdrawRewards,
    getExplorerLink,
    isLoading,
    txSignature,
    estimatedFee,
    simulationResult,
  }
}
