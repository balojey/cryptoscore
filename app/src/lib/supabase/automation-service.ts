/**
 * Automation Service for Enhanced Prediction System
 *
 * Handles automated market operations including:
 * - Match status synchronization with football-data API
 * - Automatic market resolution when matches finish
 * - Automated winnings calculation and distribution
 * - Creator reward calculation and distribution
 *
 * This service eliminates manual intervention by automating the complete
 * market lifecycle from creation to resolution and payout.
 */

import { DatabaseService } from './database-service'
import { FootballDataService } from '../football-data'
import type { Database } from '@/types/supabase'
import type { MatchStatus } from '@/config/football-data'

type Market = Database['public']['Tables']['markets']['Row']
type Participant = Database['public']['Tables']['participants']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

/**
 * Result of winnings calculation for a market
 */
export interface WinningsCalculation {
  marketId: string
  totalPool: number
  platformFee: number
  creatorReward: number
  participantPool: number
  winners: Participant[]
  winningsPerWinner: number
}

/**
 * Result of a transaction operation
 */
export interface TransactionResult {
  transactionId: string
  userId: string
  amount: number
  type: Transaction['type']
  success: boolean
  error?: string
}

/**
 * Result of market resolution process
 */
export interface ResolutionResult {
  marketId: string
  outcome: string
  winnersCount: number
  totalWinningsDistributed: number
  creatorReward: number
  platformFee: number
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
            matchId: market.match_id,
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
      case 'TIMED':
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

      // Calculate winnings
      const winningsCalc = await this.calculateWinnings(market.id)

      // Distribute winnings and rewards
      const distributionResults = await this.distributeWinnings(market.id)

      // Update market status to resolved
      await DatabaseService.updateMarket(market.id, {
        status: 'resolved',
        resolution_outcome: outcome,
        updated_at: new Date().toISOString(),
      })

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
    const totalPool = market.total_pool
    const platformFeePercentage = market.platform_fee_percentage || 0.03
    const creatorRewardPercentage = market.creator_reward_percentage || 0.02
    
    const platformFee = totalPool * platformFeePercentage
    const creatorReward = totalPool * creatorRewardPercentage
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
   * Distribute winnings and creator rewards automatically
   */
  static async distributeWinnings(marketId: string): Promise<TransactionResult[]> {
    const market = await DatabaseService.getMarketById(marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    const winningsCalc = await this.calculateWinnings(marketId)
    const results: TransactionResult[] = []

    try {
      // Distribute winnings to winners
      for (const winner of winningsCalc.winners) {
        try {
          // Update participant with actual winnings
          await DatabaseService.updateParticipant(winner.id, {
            actual_winnings: winningsCalc.winningsPerWinner,
          })

          // Create winnings transaction with detailed metadata
          const winningsMetadata = {
            predictionId: winner.id,
            matchId: market.match_id,
            prediction: winner.prediction,
            entryAmount: winner.entry_amount,
            automatedTransfer: true,
            resolutionOutcome: market.resolution_outcome,
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

          // Mark transaction as completed
          await DatabaseService.updateTransactionStatus(transaction.id, 'COMPLETED', {
            ...winningsMetadata,
            completedAt: new Date().toISOString(),
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
    return market.total_pool * creatorRewardPercentage
  }

  /**
   * Distribute creator reward
   */
  static async distributeCreatorReward(marketId: string): Promise<TransactionResult> {
    const market = await DatabaseService.getMarketById(marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    const creatorReward = await this.calculateCreatorReward(marketId)

    try {
      const creatorRewardMetadata = {
        marketId: marketId,
        matchId: market.match_id,
        totalPool: market.total_pool,
        rewardPercentage: market.creator_reward_percentage,
        automatedTransfer: true,
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

      // Mark transaction as completed
      await DatabaseService.updateTransactionStatus(transaction.id, 'COMPLETED', {
        ...creatorRewardMetadata,
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