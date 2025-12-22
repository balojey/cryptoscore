/**
 * Automation Service for Enhanced Prediction System
 *
 * Handles automated market operations including:
 * - Match status synchronization with football-data API
 * - Automatic market resolution when matches finish
 * - Automated winnings calculation and distribution
 * - Creator reward calculation and distribution
 * - MNEE token transfers for winners and creators
 *
 * This service eliminates manual intervention by automating the complete
 * market lifecycle from creation to resolution and payout.
 */

import { DatabaseService } from './database-service'
import { UserService } from './user-service'
import { FootballDataService } from '../football-data'
import { MneeService } from '../mnee/mnee-service'
import type { Database } from '@/types/supabase'
import type { MatchStatus } from '@/config/football-data'
import type { TransferRecipient } from '../mnee/types'

type Market = Database['public']['Tables']['markets']['Row']
type Participant = Database['public']['Tables']['participants']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

/**
 * Result of winnings calculation for a market (amounts in MNEE atomic units)
 */
export interface WinningsCalculation {
  marketId: string
  totalPool: number // in MNEE atomic units
  platformFee: number // in MNEE atomic units
  creatorReward: number // in MNEE atomic units
  participantPool: number // in MNEE atomic units
  winners: Participant[]
  winningsPerWinner: number // in MNEE atomic units
}

/**
 * Result of a transaction operation with MNEE transfer details
 */
export interface TransactionResult {
  transactionId: string
  userId: string
  amount: number // in MNEE atomic units
  type: Transaction['type']
  success: boolean
  mneeTransferResult?: {
    ticketId?: string
    transactionId?: string
    status: 'pending' | 'success' | 'failed'
  }
  error?: string
}

/**
 * Result of market resolution process (amounts in MNEE atomic units)
 */
export interface ResolutionResult {
  marketId: string
  outcome: string
  winnersCount: number
  totalWinningsDistributed: number // in MNEE atomic units
  creatorReward: number // in MNEE atomic units
  platformFee: number // in MNEE atomic units
  transactionResults: TransactionResult[]
  success: boolean
  error?: string
}

/**
 * Status synchronization result for a single market
 */
export interface MarketStatusSyncResult {
  marketId: string
  matchId: number
  oldStatus: Market['status']
  newStatus: Market['status']
  updated: boolean
  error?: string
}

/**
 * Automation Service class
 *
 * Provides automated operations for the enhanced prediction system
 */
export class AutomationService {
  /**
   * Synchronize match statuses from football-data API
   * Updates market statuses to match current match states
   */
  static async syncMatchStatuses(): Promise<MarketStatusSyncResult[]> {
    try {
      // Get all active markets that need status monitoring
      const activeMarkets = await DatabaseService.getMarkets({
        status: 'SCHEDULED'
      })

      const results: MarketStatusSyncResult[] = []

      for (const market of activeMarkets) {
        try {
          if (!market.match_id) {
            throw new Error('Market has no match_id')
          }
          const result = await this.updateMarketStatus(market.match_id, market.status)
          results.push({
            marketId: market.id,
            matchId: market.match_id,
            oldStatus: market.status,
            newStatus: result.newStatus,
            updated: result.updated,
          })
        } catch (error) {
          results.push({
            marketId: market.id,
            matchId: market.match_id || 0,
            oldStatus: market.status,
            newStatus: market.status,
            updated: false,
            error: (error as Error).message,
          })
        }
      }

      return results
    } catch (error) {
      throw new Error(`Failed to sync match statuses: ${(error as Error).message}`)
    }
  }

  /**
   * Update a single market's status based on football-data API
   */
  static async updateMarketStatus(matchId: number, currentStatus: Market['status']): Promise<{
    newStatus: Market['status']
    updated: boolean
  }> {
    try {
      // Get match status from football-data API
      const matchResponse = await FootballDataService.getMatch(matchId)
      
      if (!matchResponse.success) {
        throw new Error(`Failed to get match data: ${matchResponse.error}`)
      }

      const apiStatus = matchResponse.data.status
      const newStatus = this.mapApiStatusToDbStatus(apiStatus)

      // Only update if status has changed
      if (newStatus !== currentStatus) {
        // Find the market by match_id
        const markets = await DatabaseService.getMarkets()
        const market = markets.find(m => m.match_id === matchId)
        
        if (!market) {
          throw new Error(`Market not found for match ID: ${matchId}`)
        }

        await DatabaseService.updateMarket(market.id, {
          status: newStatus,
          updated_at: new Date().toISOString(),
        })

        return { newStatus, updated: true }
      }

      return { newStatus: currentStatus, updated: false }
    } catch (error) {
      throw new Error(`Failed to update market status: ${(error as Error).message}`)
    }
  }

  /**
   * Map football-data API status to database status
   */
  private static mapApiStatusToDbStatus(apiStatus: MatchStatus): Market['status'] {
    switch (apiStatus) {
      case 'SCHEDULED':
        return 'SCHEDULED'
      case 'LIVE':
      case 'IN_PLAY':
      case 'PAUSED':
        return 'LIVE'
      case 'FINISHED':
        return 'FINISHED'
      case 'POSTPONED':
        return 'POSTPONED'
      case 'CANCELLED':
      case 'SUSPENDED':
        return 'CANCELLED'
      default:
        return 'SCHEDULED'
    }
  }

  /**
   * Resolve all finished markets automatically
   * Checks for markets with FINISHED status that haven't been resolved yet
   */
  static async resolveFinishedMarkets(): Promise<ResolutionResult[]> {
    try {
      // Get all finished markets that haven't been resolved yet
      const allFinishedMarkets = await DatabaseService.getMarkets({
        status: 'FINISHED'
      })
      
      // Filter to only include markets that haven't been resolved yet
      const finishedMarkets = allFinishedMarkets.filter(market => !market.resolution_outcome)

      const results: ResolutionResult[] = []

      for (const market of finishedMarkets) {
        try {
          const result = await this.resolveMarket(market)
          results.push(result)
        } catch (error) {
          results.push({
            marketId: market.id,
            outcome: 'ERROR',
            winnersCount: 0,
            totalWinningsDistributed: 0,
            creatorReward: 0,
            platformFee: 0,
            transactionResults: [],
            success: false,
            error: (error as Error).message,
          })
        }
      }

      return results
    } catch (error) {
      throw new Error(`Failed to resolve finished markets: ${(error as Error).message}`)
    }
  }

  /**
   * Resolve a single market automatically
   */
  private static async resolveMarket(market: Market): Promise<ResolutionResult> {
    try {
      if (!market.match_id) {
        throw new Error('Market has no match_id')
      }
      
      // Get match result from football-data API
      const matchResponse = await FootballDataService.getMatch(market.match_id)
      
      if (!matchResponse.success) {
        throw new Error(`Failed to get match result: ${matchResponse.error}`)
      }

      const match = matchResponse.data
      const outcome = this.determineMatchOutcome(match)

      if (!outcome) {
        throw new Error('Match outcome could not be determined')
      }

      // Update market with resolution outcome FIRST
      await DatabaseService.updateMarket(market.id, {
        status: 'FINISHED',
        resolution_outcome: outcome,
        updated_at: new Date().toISOString(),
      })

      // Calculate winnings (now that market has resolution_outcome)
      const winningsCalc = await this.calculateWinnings(market.id)

      // Distribute winnings and rewards
      const distributionResults = await this.distributeWinnings(market.id)

      return {
        marketId: market.id,
        outcome,
        winnersCount: winningsCalc.winners.length,
        totalWinningsDistributed: winningsCalc.winners.length * winningsCalc.winningsPerWinner,
        creatorReward: winningsCalc.creatorReward,
        platformFee: winningsCalc.platformFee,
        transactionResults: distributionResults,
        success: true,
      }
    } catch (error) {
      throw new Error(`Failed to resolve market: ${(error as Error).message}`)
    }
  }

  /**
   * Determine match outcome from football-data API response
   */
  private static determineMatchOutcome(match: any): 'Home' | 'Draw' | 'Away' | null {
    if (!match.score || !match.score.fullTime) {
      return null
    }

    const homeScore = match.score.fullTime.home
    const awayScore = match.score.fullTime.away

    if (homeScore === null || awayScore === null) {
      return null
    }

    if (homeScore > awayScore) {
      return 'Home'
    } else if (awayScore > homeScore) {
      return 'Away'
    } else {
      return 'Draw'
    }
  }

  /**
   * Calculate winnings for a market
   */
  static async calculateWinnings(marketId: string): Promise<WinningsCalculation> {
    const market = await DatabaseService.getMarketById(marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    const participants = await DatabaseService.getMarketParticipants(marketId)
    
    // Use the same fee structure as MarketService
    const totalPool = market.total_pool || 0
    const platformFeePercentage = market.platform_fee_percentage || 0.03
    const creatorRewardPercentage = market.creator_reward_percentage || 0.02
    
    const platformFee = Math.floor(totalPool * platformFeePercentage)
    const creatorReward = Math.floor(totalPool * creatorRewardPercentage)
    const participantPool = totalPool - platformFee - creatorReward

    // Find winners (this will be determined during resolution)
    const winners = participants.filter(p => p.prediction === market.resolution_outcome)
    const winningsPerWinner = winners.length > 0 ? Math.floor(participantPool / winners.length) : 0

    return {
      marketId,
      totalPool,
      platformFee,
      creatorReward,
      participantPool,
      winners,
      winningsPerWinner,
    }
  }

  /**
   * Distribute winnings and creator rewards automatically with MNEE transfers
   */
  static async distributeWinnings(marketId: string): Promise<TransactionResult[]> {
    const market = await DatabaseService.getMarketById(marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    const winningsCalc = await this.calculateWinnings(marketId)
    const results: TransactionResult[] = []

    try {
      // Prepare MNEE transfers for winners
      const mneeTransfers: TransferRecipient[] = []
      
      // Distribute winnings to winners
      for (const winner of winningsCalc.winners) {
        try {
          // Update participant with actual winnings
          await DatabaseService.updateParticipant(winner.id, {
            actual_winnings: winningsCalc.winningsPerWinner,
          })

          // Get user's EVM address for MNEE transfer
          const user = await UserService.getUserById(winner.user_id)
          if (!user?.wallet_address) {
            throw new Error(`No EVM wallet address found for user ${winner.user_id}`)
          }

          // Add to MNEE transfer batch (convert atomic units to MNEE tokens)
          mneeTransfers.push({
            address: user.wallet_address,
            amount: winningsCalc.winningsPerWinner / 100000 // Convert atomic units to MNEE tokens
          })

          // Create winnings transaction with detailed metadata
          const winningsMetadata = {
            predictionId: winner.id,
            matchId: market.match_id,
            prediction: winner.prediction,
            entryAmount: winner.entry_amount,
            automatedTransfer: true,
            resolutionOutcome: market.resolution_outcome,
            mneeTransferPending: true,
          }

          const transaction = await DatabaseService.createTransaction({
            user_id: winner.user_id,
            market_id: marketId,
            type: 'winnings',
            amount: winningsCalc.winningsPerWinner,
            description: `Automated winnings from market resolution: ${market.resolution_outcome}`,
            status: 'PENDING',
            metadata: winningsMetadata,
          })

          results.push({
            transactionId: transaction.id,
            userId: winner.user_id,
            amount: winningsCalc.winningsPerWinner,
            type: 'winnings',
            success: true,
          })
        } catch (error) {
          results.push({
            transactionId: '',
            userId: winner.user_id,
            amount: winningsCalc.winningsPerWinner,
            type: 'winnings',
            success: false,
            error: (error as Error).message,
          })
        }
      }

      // Execute MNEE transfers if there are any winners
      if (mneeTransfers.length > 0) {
        try {
          await this.executeMneeTransfers(mneeTransfers, marketId, 'winnings')
          
          // Update all winner transactions to completed
          for (const result of results) {
            if (result.success && result.type === 'winnings') {
              await DatabaseService.updateTransactionStatus(result.transactionId, 'COMPLETED', {
                mneeTransferCompleted: true,
                completedAt: new Date().toISOString(),
              })
            }
          }
        } catch (error) {
          console.error('MNEE transfer failed for winners:', error)
          // Mark transactions as failed
          for (const result of results) {
            if (result.success && result.type === 'winnings') {
              await DatabaseService.updateTransactionStatus(result.transactionId, 'FAILED', {
                mneeTransferError: (error as Error).message,
                failedAt: new Date().toISOString(),
              })
              result.success = false
              result.error = `MNEE transfer failed: ${(error as Error).message}`
            }
          }
        }
      }

      // Distribute creator reward
      if (winningsCalc.creatorReward > 0) {
        try {
          const creatorRewardTransaction = await this.distributeCreatorReward(marketId)
          results.push(creatorRewardTransaction)
        } catch (error) {
          results.push({
            transactionId: '',
            userId: market.creator_id,
            amount: winningsCalc.creatorReward,
            type: 'creator_reward',
            success: false,
            error: (error as Error).message,
          })
        }
      }

      // Record platform fee transaction with detailed metadata
      if (winningsCalc.platformFee > 0) {
        try {
          const platformFeeMetadata = {
            marketId: marketId,
            matchId: market.match_id,
            totalPool: winningsCalc.totalPool,
            feePercentage: market.platform_fee_percentage,
            automatedTransfer: true,
          }

          const platformFeeTransaction = await DatabaseService.createTransaction({
            user_id: market.creator_id, // Associate with market creator for tracking
            market_id: marketId,
            type: 'platform_fee',
            amount: winningsCalc.platformFee,
            description: 'Automated platform fee from market resolution',
            status: 'PENDING',
            metadata: platformFeeMetadata,
          })

          // Mark platform fee transaction as completed
          await DatabaseService.updateTransactionStatus(platformFeeTransaction.id, 'COMPLETED', {
            ...platformFeeMetadata,
            completedAt: new Date().toISOString(),
          })

          results.push({
            transactionId: platformFeeTransaction.id,
            userId: market.creator_id,
            amount: winningsCalc.platformFee,
            type: 'platform_fee',
            success: true,
          })
        } catch (error) {
          results.push({
            transactionId: '',
            userId: market.creator_id,
            amount: winningsCalc.platformFee,
            type: 'platform_fee',
            success: false,
            error: (error as Error).message,
          })
        }
      }

      return results
    } catch (error) {
      throw new Error(`Failed to distribute winnings: ${(error as Error).message}`)
    }
  }

  /**
   * Calculate and distribute creator reward
   */
  static async calculateCreatorReward(marketId: string): Promise<number> {
    const market = await DatabaseService.getMarketById(marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    const creatorRewardPercentage = market.creator_reward_percentage || 0.02
    return Math.floor((market.total_pool || 0) * creatorRewardPercentage)
  }

  /**
   * Distribute creator reward with MNEE transfer
   */
  static async distributeCreatorReward(marketId: string): Promise<TransactionResult> {
    const market = await DatabaseService.getMarketById(marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    const creatorReward = await this.calculateCreatorReward(marketId)

    try {
      // Get creator's EVM address for MNEE transfer
      const creator = await UserService.getUserById(market.creator_id)
      if (!creator?.wallet_address) {
        throw new Error(`No EVM wallet address found for creator ${market.creator_id}`)
      }

      const creatorRewardMetadata = {
        marketId: marketId,
        matchId: market.match_id,
        totalPool: market.total_pool,
        rewardPercentage: market.creator_reward_percentage,
        automatedTransfer: true,
        mneeTransferPending: true,
      }

      const transaction = await DatabaseService.createTransaction({
        user_id: market.creator_id,
        market_id: marketId,
        type: 'creator_reward',
        amount: creatorReward,
        description: 'Automated creator reward from market resolution',
        status: 'PENDING',
        metadata: creatorRewardMetadata,
      })

      // Execute MNEE transfer for creator reward
      try {
        const mneeTransfers: TransferRecipient[] = [{
          address: creator.wallet_address,
          amount: creatorReward / 100000 // Convert atomic units to MNEE tokens
        }]

        await this.executeMneeTransfers(mneeTransfers, marketId, 'creator_reward')

        // Mark transaction as completed
        await DatabaseService.updateTransactionStatus(transaction.id, 'COMPLETED', {
          ...creatorRewardMetadata,
          mneeTransferCompleted: true,
          completedAt: new Date().toISOString(),
        })

        return {
          transactionId: transaction.id,
          userId: market.creator_id,
          amount: creatorReward,
          type: 'creator_reward',
          success: true,
        }
      } catch (error) {
        // Mark transaction as failed
        await DatabaseService.updateTransactionStatus(transaction.id, 'FAILED', {
          ...creatorRewardMetadata,
          mneeTransferError: (error as Error).message,
          failedAt: new Date().toISOString(),
        })

        return {
          transactionId: transaction.id,
          userId: market.creator_id,
          amount: creatorReward,
          type: 'creator_reward',
          success: false,
          error: `MNEE transfer failed: ${(error as Error).message}`,
        }
      }
    } catch (error) {
      return {
        transactionId: '',
        userId: market.creator_id,
        amount: creatorReward,
        type: 'creator_reward',
        success: false,
        error: (error as Error).message,
      }
    }
  }

  /**
   * Execute MNEE transfers using the MNEE service
   * @param transfers - Array of transfer recipients
   * @param marketId - Market ID for logging
   * @param transferType - Type of transfer for logging
   */
  private static async executeMneeTransfers(
    transfers: TransferRecipient[], 
    marketId: string, 
    transferType: 'winnings' | 'creator_reward'
  ): Promise<void> {
    try {
      // Initialize MNEE service (this should be done once at app startup)
      const mneeService = new MneeService()
      
      // Get platform private key from environment
      const platformPrivateKey = process.env.MNEE_PLATFORM_PRIVATE_KEY
      if (!platformPrivateKey) {
        throw new Error('Platform private key not configured for MNEE transfers')
      }

      // Execute the transfer
      const transferResult = await mneeService.transfer(transfers, platformPrivateKey)
      
      if (transferResult.status === 'failed') {
        throw new Error(`MNEE transfer failed: ${transferResult.error || 'Unknown error'}`)
      }

      console.log(`MNEE ${transferType} transfer initiated for market ${marketId}:`, {
        ticketId: transferResult.ticketId,
        recipientCount: transfers.length,
        totalAmount: transfers.reduce((sum, t) => sum + t.amount, 0)
      })

      // TODO: Implement transfer status monitoring
      // We could add a background job to monitor transfer status using transferResult.ticketId
      
    } catch (error) {
      console.error(`MNEE transfer execution failed for ${transferType}:`, error)
      throw error
    }
  }

  /**
   * Run complete automation cycle
   * Synchronizes statuses and resolves finished markets
   */
  static async runAutomationCycle(): Promise<{
    statusSyncResults: MarketStatusSyncResult[]
    resolutionResults: ResolutionResult[]
  }> {
    try {
      // First, sync all match statuses
      const statusSyncResults = await this.syncMatchStatuses()

      // Then, resolve any newly finished markets
      const resolutionResults = await this.resolveFinishedMarkets()

      return {
        statusSyncResults,
        resolutionResults,
      }
    } catch (error) {
      throw new Error(`Automation cycle failed: ${(error as Error).message}`)
    }
  }
}