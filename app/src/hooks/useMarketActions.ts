import type { FeeEstimate } from '../lib/solana/transaction-builder'
import { SolanaWallet } from '@crossmint/wallets-sdk'
import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import bs58 from 'bs58'
import { FACTORY_PROGRAM_ID, MARKET_PROGRAM_ID } from '../config/programs'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import { WALLET_ERROR_CODES, WalletErrorHandler } from '../lib/crossmint/wallet-error-handler'
import { AccountDecoder } from '../lib/solana/account-decoder'
import { SolanaErrorHandler } from '../lib/solana/error-handler'

import { InstructionEncoder } from '../lib/solana/instruction-encoder'
import { PDAUtils } from '../lib/solana/pda-utils'
import { TransactionBuilder } from '../lib/solana/transaction-builder'
import { TransactionSerializer } from '../lib/solana/transaction-serializer'
import { SolanaUtils } from '../lib/solana/utils'
import { MatchOutcome, PredictionChoice } from '../types/solana-program-types'

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

export interface CreateSimilarMarketParams {
  matchId: string
  entryFee: number // in lamports
  isPublic: boolean
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
  const { connection } = useConnection()
  const { publicKey, walletType, crossmintWallet, adapterWallet } = useUnifiedWallet()
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
    operationName: string,
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
        `Transaction simulation failed: ${simulation.error}\n\n`
        + 'This transaction may fail on-chain. Do you want to proceed anyway?\n\n'
        + 'Click OK to proceed or Cancel to abort.',
      )

      return shouldProceed
    }
  }, [connection])

  /**
   * Submit a transaction using the appropriate wallet method
   * Handles both Crossmint and adapter wallets with wallet-type-aware logic
   */
  const submitTransaction = useCallback(async (
    transaction: any,
    operationName: string,
  ): Promise<string> => {
    // Validate wallet connection
    if (!publicKey) {
      const error = WalletErrorHandler.parseError(
        new Error('Wallet not connected'),
        walletType,
        operationName,
      )
      throw error
    }

    // Log transaction submission details
    console.log(`[${operationName}] Submitting transaction with wallet type: ${walletType}`)
    TransactionSerializer.logDetails(transaction, operationName)

    try {
      // Handle Crossmint wallet transaction flow
      if (walletType === 'crossmint') {
        if (!crossmintWallet) {
          throw new Error('Crossmint wallet not available')
        }

        console.log(`[${operationName}] Using Crossmint wallet flow`)
        
        // Show user feedback - waiting for approval
        toast.info('Approve transaction', {
          description: 'Please approve the transaction in the popup',
        })

        // Create SolanaWallet instance from Crossmint wallet
        const solanaWallet = SolanaWallet.from(crossmintWallet)
        console.log(`[${operationName}] Created SolanaWallet instance`)

        // Ensure transaction has recent blockhash
        if (!transaction.recentBlockhash) {
          console.log(`[${operationName}] Fetching recent blockhash...`)
          const { blockhash } = await connection.getLatestBlockhash('confirmed')
          transaction.recentBlockhash = blockhash
          console.log(`[${operationName}] Set recent blockhash: ${blockhash}`)
        }

        // Log transaction details
        console.log(`[${operationName}] Transaction details:`, {
          size: `${TransactionSerializer.getSize(transaction)} bytes`,
          instructions: transaction.instructions.length,
          feePayer: transaction.feePayer?.toBase58(),
          recentBlockhash: transaction.recentBlockhash,
        })

        // Convert legacy Transaction to VersionedTransaction for Crossmint
        // Crossmint SDK expects VersionedTransaction type
        console.log(`[${operationName}] Converting to VersionedTransaction...`)
        const { blockhash } = await connection.getLatestBlockhash('confirmed')
        
        const messageV0 = new TransactionMessage({
          payerKey: publicKey,
          recentBlockhash: blockhash,
          instructions: transaction.instructions,
        }).compileToV0Message()
        
        const versionedTransaction = new VersionedTransaction(messageV0)
        
        console.log(`[${operationName}] Created VersionedTransaction`)

        // Send using Crossmint SDK with serialized transaction to avoid version conflicts
        // Serialize the transaction to base58 string (Solana standard)
        const serializedTransaction = bs58.encode(versionedTransaction.serialize())
        console.log(`[${operationName}] Serialized transaction (${serializedTransaction.length} chars)`)

        toast.info('Sending transaction', {
          description: 'Submitting to the network...',
        })
        
        try {
          const result = await solanaWallet.sendTransaction({
            serializedTransaction,
          })

          console.log(`[${operationName}] Crossmint response:`, result)

          // Extract signature from Crossmint response
          // The response contains: { hash, explorerLink, transactionId }
          const signature = result.hash || result.transactionId

          if (!signature) {
            throw new Error('No transaction signature returned from Crossmint')
          }

          console.log(`[${operationName}] Transaction signature: ${signature}`)
          console.log(`[${operationName}] Explorer link: ${result.explorerLink || 'N/A'}`)
          return signature
        }
        catch (crossmintError) {
          console.error(`[${operationName}] Crossmint sendTransaction error:`, crossmintError)
          
          // Log detailed error information
          if (crossmintError && typeof crossmintError === 'object') {
            console.error(`[${operationName}] Error details:`, {
              message: (crossmintError as any).message,
              code: (crossmintError as any).code,
              response: (crossmintError as any).response,
              stack: (crossmintError as any).stack,
            })
          }
          
          throw crossmintError
        }
      }

      // Handle adapter wallet transaction flow
      if (walletType === 'adapter') {
        if (!adapterWallet?.signTransaction) {
          throw new Error('Adapter wallet does not support transaction signing')
        }

        console.log(`[${operationName}] Using adapter wallet flow`)

        // Show user feedback - waiting for approval
        toast.info('Approve transaction', {
          description: 'Please approve the transaction in your wallet',
        })

        // Sign the transaction using adapter wallet
        const signedTx = await adapterWallet.signTransaction(transaction)

        // Send the signed transaction
        toast.info('Sending transaction', {
          description: 'Submitting to the network...',
        })
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })

        console.log(`[${operationName}] Transaction signature: ${signature}`)
        return signature
      }

      throw new Error('Unknown wallet type')
    }
    catch (error) {
      // Parse the error using appropriate handler based on wallet type
      const walletError = walletType === 'crossmint'
        ? WalletErrorHandler.parseCrossmintError(error, operationName)
        : WalletErrorHandler.parseError(error, walletType, operationName)

      // Log the error for debugging
      WalletErrorHandler.logError(walletError, operationName, walletType)

      // Get user-friendly error message
      const userMessage = WalletErrorHandler.getUserMessage(walletError)

      // Display user-friendly error message with toast (avoid duplicates)
      // Only show if not already a rejection or insufficient funds (handled elsewhere)
      if (walletError.code !== WALLET_ERROR_CODES.TRANSACTION_REJECTED 
          && walletError.code !== WALLET_ERROR_CODES.INSUFFICIENT_FUNDS) {
        toast.error(userMessage)
      }

      throw walletError
    }
  }, [publicKey, walletType, crossmintWallet, adapterWallet, connection])

  /**
   * Create a new prediction market
   */
  const createMarket = useCallback(async (params: CreateMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      // Show preparing transaction toast
      toast.info('Preparing transaction', {
        description: 'Building transaction...',
      })

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
        },
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

      // Submit transaction using wallet-type-aware method
      const signature = await submitTransaction(transaction, 'createMarket')

      console.log('Transaction sent:', signature)
      toast.info('Confirming transaction', {
        description: 'Waiting for network confirmation...',
      })

      // Confirm transaction with retry logic
      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)

      if (!confirmed) {
        const error = WalletErrorHandler.parseError(
          new Error('Transaction confirmation failed'),
          walletType,
          'createMarket',
        )
        throw error
      }

      setTxSignature(signature)

      // Handle success with toast notification and cache invalidation
      toast.success('Market created successfully!', {
        description: 'Your market is now live',
        action: {
          label: 'View',
          onClick: () => {
            window.open(SolanaUtils.getExplorerUrl(signature, import.meta.env.VITE_SOLANA_NETWORK || 'devnet'), '_blank')
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['markets'] })

      return signature
    }
    catch (error: any) {
      // Log detailed error information to console
      console.error('[createMarket] Error occurred:', error)

      // Check if it's already a WalletError (already parsed and logged)
      if (error.name === 'WalletError') {
        // Get user-friendly message based on error code
        const errorMessage = WalletErrorHandler.getUserMessage(error)
        
        // Display specific error message (avoid duplicates from submitTransaction)
        if (error.code === WALLET_ERROR_CODES.TRANSACTION_REJECTED) {
          toast.error('Transaction rejected', {
            description: 'You declined the transaction',
          })
        }
        else if (error.code === WALLET_ERROR_CODES.INSUFFICIENT_FUNDS) {
          toast.error('Insufficient funds', {
            description: 'You don\'t have enough SOL for this transaction',
          })
        }
        else if (error.code !== WALLET_ERROR_CODES.TRANSACTION_REJECTED 
                 && error.code !== WALLET_ERROR_CODES.INSUFFICIENT_FUNDS) {
          // Show error for other cases (not already shown by submitTransaction)
          toast.error('Market creation failed', {
            description: errorMessage,
          })
        }
        
        return null
      }

      // Handle non-WalletError errors
      SolanaErrorHandler.logError(error, 'createMarket')
      WalletErrorHandler.logError(error, 'createMarket', walletType)

      const walletError = WalletErrorHandler.parseError(error, walletType, 'createMarket')
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Display specific error message
      toast.error('Market creation failed', {
        description: errorMessage,
      })

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, queryClient, simulateBeforeSend, submitTransaction, walletType])

  /**
   * Create a similar market with pre-filled match ID
   */
  const createSimilarMarket = useCallback(async (params: CreateSimilarMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    // Calculate kickoff and end times based on match data
    // For similar markets, we use the same match timing
    const kickoffTime = Math.floor(Date.now() / 1000) + 300 // 5 minutes from now to allow setup
    const endTime = kickoffTime + (24 * 60 * 60) // 24 hours later

    // Reuse the existing createMarket logic with pre-filled parameters
    return await createMarket({
      matchId: params.matchId,
      entryFee: params.entryFee,
      kickoffTime,
      endTime,
      isPublic: params.isPublic,
    })
  }, [createMarket, publicKey])

  /**
   * Join an existing market with a prediction
   */
  const joinMarket = useCallback(async (params: JoinMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      // Show preparing transaction toast
      toast.info('Preparing transaction', {
        description: 'Building transaction...',
      })

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
        },
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

      // Submit transaction using wallet-type-aware method
      const signature = await submitTransaction(transaction, 'joinMarket')

      console.log('Transaction sent:', signature)
      toast.info('Confirming transaction', {
        description: 'Waiting for network confirmation...',
      })

      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)

      if (!confirmed) {
        const error = WalletErrorHandler.parseError(
          new Error('Transaction confirmation failed'),
          walletType,
          'joinMarket',
        )
        throw error
      }

      setTxSignature(signature)

      // Handle success and errors appropriately
      toast.success('Joined market successfully!', {
        description: 'Your prediction has been recorded',
        action: {
          label: 'View',
          onClick: () => {
            window.open(SolanaUtils.getExplorerUrl(signature, import.meta.env.VITE_SOLANA_NETWORK || 'devnet'), '_blank')
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', params.marketAddress] })
      queryClient.invalidateQueries({ queryKey: ['participant', params.marketAddress, publicKey.toString()] })

      return signature
    }
    catch (error: any) {
      // Log detailed error information to console
      console.error('[joinMarket] Error occurred:', error)

      // Check if it's already a WalletError (already parsed and logged)
      if (error.name === 'WalletError') {
        // Get user-friendly message based on error code
        const errorMessage = WalletErrorHandler.getUserMessage(error)
        
        // Display specific error message (avoid duplicates from submitTransaction)
        if (error.code === WALLET_ERROR_CODES.TRANSACTION_REJECTED) {
          toast.error('Transaction rejected', {
            description: 'You declined the transaction',
          })
        }
        else if (error.code === WALLET_ERROR_CODES.INSUFFICIENT_FUNDS) {
          toast.error('Insufficient funds', {
            description: 'You don\'t have enough SOL for this transaction',
          })
        }
        else if (error.code !== WALLET_ERROR_CODES.TRANSACTION_REJECTED 
                 && error.code !== WALLET_ERROR_CODES.INSUFFICIENT_FUNDS) {
          // Show error for other cases (not already shown by submitTransaction)
          toast.error('Failed to join market', {
            description: errorMessage,
          })
        }
        
        return null
      }

      // Handle non-WalletError errors
      SolanaErrorHandler.logError(error, 'joinMarket')
      WalletErrorHandler.logError(error, 'joinMarket', walletType)

      const walletError = WalletErrorHandler.parseError(error, walletType, 'joinMarket')
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Display specific error message
      toast.error('Failed to join market', {
        description: errorMessage,
      })

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, queryClient, simulateBeforeSend, submitTransaction, walletType])

  /**
   * Resolve a market with the match outcome
   */
  const resolveMarket = useCallback(async (params: ResolveMarketParams) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      // Show preparing transaction toast
      toast.info('Preparing transaction', {
        description: 'Building market resolution with on-chain fee distribution...',
      })

      const marketPubkey = new PublicKey(params.marketAddress)
      const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

      // Fetch market data to get creator and total pool for fee distribution
      const marketAccountInfo = await connection.getAccountInfo(marketPubkey)
      if (!marketAccountInfo || !marketAccountInfo.data) {
        throw new Error('Market account not found')
      }

      // Decode market data to get creator and total pool
      const marketData = AccountDecoder.decodeMarket(marketAccountInfo.data)
      const creatorAddress = marketData.creator
      const totalPool = marketData.totalPool

      console.log('Market data for fee distribution:', {
        creator: creatorAddress.toString(),
        totalPool: SolanaUtils.formatSol(Number(totalPool)),
        marketAddress: marketPubkey.toString()
      })

      // Get platform address for fee distribution
      const platformAddress = new PublicKey('2xUfnnyizenM7a9jWHtgxdCWCTE11afRUhX5YeFSrVTn')

      console.log('Market data for on-chain fee distribution:', {
        creator: creatorAddress.toString(),
        platform: platformAddress.toString(),
        totalPool: SolanaUtils.formatSol(Number(totalPool)),
        marketAddress: marketPubkey.toString()
      })

      // Convert outcome to enum value
      const outcomeValue = params.outcome === 'Home'
        ? MatchOutcome.Home
        : params.outcome === 'Draw'
          ? MatchOutcome.Draw
          : MatchOutcome.Away

      // Try to derive the participant PDA - if it exists, include it
      // The Rust program will validate if the resolver is authorized (creator or participant)
      const pdaUtils = new PDAUtils(marketProgramId)
      let participantPda: PublicKey | undefined

      try {
        const { pda } = await pdaUtils.findParticipantPDA(marketPubkey, publicKey)
        
        // Check if the participant account actually exists on-chain
        const accountInfo = await connection.getAccountInfo(pda)
        if (accountInfo && accountInfo.data.length > 0) {
          participantPda = pda
          console.log('Participant account exists, including PDA:', participantPda.toString())
        } else {
          console.log('Participant PDA derived but account does not exist on-chain')
        }
      } catch (error) {
        console.log('Could not derive participant PDA:', error)
      }

      // Build instruction using InstructionEncoder with on-chain fee distribution
      const encoder = new InstructionEncoder(marketProgramId)
      const resolveMarketInstruction = encoder.resolveMarket(
        { outcome: outcomeValue },
        {
          market: marketPubkey,
          resolver: publicKey,
          creator: creatorAddress,
          platform: platformAddress,
          participant: participantPda, // Optional - will be included if user is participant
        },
      )

      // Build transaction with standard compute limits (on-chain fee distribution is more efficient)
      const builder = new TransactionBuilder({
        computeUnitLimit: 200000, // Standard limit for single instruction
        computeUnitPrice: 1,
      })

      // Add the resolve market instruction (fees are distributed on-chain)
      builder.addInstruction(resolveMarketInstruction)

      console.log('Added resolve market instruction with on-chain fee distribution')

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

      // Submit transaction using wallet-type-aware method
      const signature = await submitTransaction(transaction, 'resolveMarket')

      console.log('Transaction sent:', signature)
      toast.info('Confirming transaction', {
        description: 'Waiting for network confirmation...',
      })

      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)

      if (!confirmed) {
        const error = WalletErrorHandler.parseError(
          new Error('Transaction confirmation failed'),
          walletType,
          'resolveMarket',
        )
        throw error
      }

      setTxSignature(signature)

      // Handle success with on-chain fee distribution messaging
      toast.success('Market resolved successfully!', {
        description: 'Fees automatically distributed on-chain to creator and platform',
        action: {
          label: 'View',
          onClick: () => {
            window.open(SolanaUtils.getExplorerUrl(signature, import.meta.env.VITE_SOLANA_NETWORK || 'devnet'), '_blank')
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', params.marketAddress] })

      return signature
    }
    catch (error: any) {
      // Log detailed error information to console
      console.error('[resolveMarket] Error occurred:', error)

      // Check if it's already a WalletError (already parsed and logged)
      if (error.name === 'WalletError') {
        // Get user-friendly message based on error code
        const errorMessage = WalletErrorHandler.getUserMessage(error)
        
        // Display specific error message (avoid duplicates from submitTransaction)
        if (error.code === WALLET_ERROR_CODES.TRANSACTION_REJECTED) {
          toast.error('Transaction rejected', {
            description: 'You declined the transaction',
          })
        }
        else if (error.code === WALLET_ERROR_CODES.INSUFFICIENT_FUNDS) {
          toast.error('Insufficient funds', {
            description: 'You don\'t have enough SOL for this transaction',
          })
        }
        else if (error.code !== WALLET_ERROR_CODES.TRANSACTION_REJECTED 
                 && error.code !== WALLET_ERROR_CODES.INSUFFICIENT_FUNDS) {
          // Show error for other cases (not already shown by submitTransaction)
          toast.error('Failed to resolve market', {
            description: errorMessage,
          })
        }
        
        return null
      }

      // Handle non-WalletError errors
      SolanaErrorHandler.logError(error, 'resolveMarket')
      WalletErrorHandler.logError(error, 'resolveMarket', walletType)

      const walletError = WalletErrorHandler.parseError(error, walletType, 'resolveMarket')
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Display specific error message
      toast.error('Failed to resolve market', {
        description: errorMessage,
      })

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, queryClient, simulateBeforeSend, submitTransaction, walletType])

  /**
   * Withdraw rewards from a resolved market
   */
  const withdrawRewards = useCallback(async (marketAddress: string) => {
    if (!publicKey) {
      toast.error('Wallet not connected')
      return null
    }

    setIsLoading(true)
    setTxSignature(null)

    try {
      // Show preparing transaction toast
      toast.info('Preparing transaction', {
        description: 'Building transaction...',
      })

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

      // Submit transaction using wallet-type-aware method
      const signature = await submitTransaction(transaction, 'withdrawRewards')

      console.log('Transaction sent:', signature)
      toast.info('Confirming transaction', {
        description: 'Waiting for network confirmation...',
      })

      const confirmed = await SolanaUtils.confirmTransaction(connection, signature)

      if (!confirmed) {
        const error = WalletErrorHandler.parseError(
          new Error('Transaction confirmation failed'),
          walletType,
          'withdrawRewards',
        )
        throw error
      }

      setTxSignature(signature)

      // Handle success with celebration and cache invalidation
      toast.success('🎉 Rewards withdrawn successfully!', {
        description: 'Your winnings have been transferred to your wallet',
        action: {
          label: 'View',
          onClick: () => {
            window.open(SolanaUtils.getExplorerUrl(signature, import.meta.env.VITE_SOLANA_NETWORK || 'devnet'), '_blank')
          },
        },
      })
      queryClient.invalidateQueries({ queryKey: ['markets'] })
      queryClient.invalidateQueries({ queryKey: ['market', 'details', marketAddress] })
      queryClient.invalidateQueries({ queryKey: ['participant', marketAddress, publicKey.toString()] })
      queryClient.invalidateQueries({ queryKey: ['user'] })

      return signature
    }
    catch (error: any) {
      // Log detailed error information to console
      console.error('[withdrawRewards] Error occurred:', error)

      // Check if it's already a WalletError (already parsed and logged)
      if (error.name === 'WalletError') {
        // Get user-friendly message based on error code
        const errorMessage = WalletErrorHandler.getUserMessage(error)
        
        // Display specific error message (avoid duplicates from submitTransaction)
        if (error.code === WALLET_ERROR_CODES.TRANSACTION_REJECTED) {
          toast.error('Transaction rejected', {
            description: 'You declined the transaction',
          })
        }
        else if (error.code === WALLET_ERROR_CODES.INSUFFICIENT_FUNDS) {
          toast.error('Insufficient funds', {
            description: 'You don\'t have enough SOL for this transaction',
          })
        }
        else if (error.code !== WALLET_ERROR_CODES.TRANSACTION_REJECTED 
                 && error.code !== WALLET_ERROR_CODES.INSUFFICIENT_FUNDS) {
          // Show error for other cases (not already shown by submitTransaction)
          toast.error('Failed to withdraw rewards', {
            description: errorMessage,
          })
        }
        
        return null
      }

      // Handle non-WalletError errors
      SolanaErrorHandler.logError(error, 'withdrawRewards')
      WalletErrorHandler.logError(error, 'withdrawRewards', walletType)

      const walletError = WalletErrorHandler.parseError(error, walletType, 'withdrawRewards')
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Display specific error message
      toast.error('Failed to withdraw rewards', {
        description: errorMessage,
      })

      return null
    }
    finally {
      setIsLoading(false)
    }
  }, [connection, publicKey, queryClient, simulateBeforeSend, submitTransaction, walletType])

  /**
   * Get Solana Explorer link for a transaction
   */
  const getExplorerLink = useCallback((signature: string) => {
    const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
    return SolanaUtils.getExplorerUrl(signature, network as any)
  }, [])

  return {
    createMarket,
    createSimilarMarket,
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
