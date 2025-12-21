/**
 * Market Service for Supabase Integration
 *
 * Handles market creation, participation, resolution, and data retrieval
 * replacing Solana program functionality with database operations.
 */

import { DatabaseService } from './database-service'
import type { Database } from '@/types/supabase'

type Market = Database['public']['Tables']['markets']['Row']
type MarketInsert = Database['public']['Tables']['markets']['Insert']
type MarketUpdate = Database['public']['Tables']['markets']['Update']
type Participant = Database['public']['Tables']['participants']['Row']
type ParticipantInsert = Database['public']['Tables']['participants']['Insert']

/**
 * Market creation parameters
 */
export interface CreateMarketParams {
  matchId: string
  title: string
  description: string
  entryFee: number // in decimal format (e.g., 0.1 for 0.1 SOL equivalent)
  endTime: string // ISO timestamp
  isPublic: boolean
  creatorId: string
  homeTeamId: number
  homeTeamName: string
  awayTeamId: number
  awayTeamName: string
}

/**
 * Market participation parameters
 */
export interface JoinMarketParams {
  marketId: string
  userId: string
  prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN'
  entryAmount: number
}

/**
 * Market resolution parameters
 */
export interface ResolveMarketParams {
  marketId: string
  outcome: 'Home' | 'Draw' | 'Away'
}

/**
 * Market filters for querying
 */
export interface MarketFilters {
  status?: Market['status']
  creatorId?: string
  matchId?: string
  isPublic?: boolean
  limit?: number
  offset?: number
}

/**
 * Market Service class
 *
 * Provides methods for managing prediction markets with Supabase backend
 */
export class MarketService {
  /**
   * Create a new prediction market
   *
   * @param params - Market creation parameters
   * @returns Created market data
   */
  static async createMarket(params: CreateMarketParams): Promise<Market> {
    // Get platform fee percentage from config (default to 0.03 for 3%)
    const platformConfig = await DatabaseService.getPlatformConfig('default_platform_fee_percentage')
    const platformFeePercentage = platformConfig?.value ? parseFloat(platformConfig.value as string) : 0.03

    // Get creator reward percentage from config (default to 0.02 for 2%)
    const creatorRewardConfig = await DatabaseService.getPlatformConfig('default_creator_reward_percentage')
    const creatorRewardPercentage = creatorRewardConfig?.value ? parseFloat(creatorRewardConfig.value as string) : 0.02

    const marketData: MarketInsert = {
      creator_id: params.creatorId,
      match_id: parseInt(params.matchId),
      home_team_id: params.homeTeamId,
      home_team_name: params.homeTeamName,
      away_team_id: params.awayTeamId,
      away_team_name: params.awayTeamName,
      title: params.title,
      description: params.description,
      entry_fee: params.entryFee,
      end_time: params.endTime,
      status: 'SCHEDULED',
      total_pool: 0, // Will be updated as participants join
      platform_fee_percentage: platformFeePercentage,
      creator_reward_percentage: creatorRewardPercentage,
    }

    const market = await DatabaseService.createMarket(marketData)

    // Create initial transaction record for market creation
    await DatabaseService.createTransaction({
      user_id: params.creatorId,
      market_id: market.id,
      type: 'market_entry',
      amount: 0, // Market creation is free
      description: `Created market: ${params.title}`,
    })

    return market
  }

  /**
   * Join a market with a prediction
   *
   * @param params - Market participation parameters
   * @returns Participant data
   */
  static async joinMarket(params: JoinMarketParams): Promise<Participant> {
    // Get market data to validate and calculate winnings
    const market = await DatabaseService.getMarketById(params.marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    if (market.status !== 'SCHEDULED') {
      throw new Error('Market is not active')
    }

    if (new Date(market.end_time) < new Date()) {
      throw new Error('Market has ended')
    }

    // Check if user already has this specific prediction
    const existingParticipants = await DatabaseService.getMarketParticipants(params.marketId)
    const userParticipants = existingParticipants.filter(p => p.user_id === params.userId)
    
    // Map prediction values for database storage
    const dbPrediction = params.prediction === 'HOME_WIN' ? 'Home' : 
                        params.prediction === 'AWAY_WIN' ? 'Away' : 'Draw'
    
    // Check for duplicate prediction
    const duplicatePrediction = userParticipants.find(p => p.prediction === dbPrediction)
    if (duplicatePrediction) {
      throw new Error(`User has already placed a ${params.prediction} prediction on this market`)
    }

    // Check prediction limit (max 3 per user per market)
    if (userParticipants.length >= 3) {
      throw new Error('User cannot place more than 3 predictions per market')
    }

    // Get current participants to calculate potential winnings using same logic as WinningsCalculator
    const currentParticipants = await DatabaseService.getMarketParticipants(params.marketId)
    const newTotalPool = market.total_pool + params.entryAmount

    // Use the same fee structure as WinningsCalculator (95% participant pool)
    const newParticipantPool = Math.floor((newTotalPool * 9500) / 10000)
    
    // Count current predictions for the same outcome
    const currentPredictionCount = currentParticipants.filter(p => p.prediction === dbPrediction).length
    
    // Calculate potential winnings: if no one has made this prediction yet, user gets full participant pool
    // Otherwise, divide by the number of people who will have made this prediction (including this user)
    const potentialWinnings = currentPredictionCount === 0 
      ? newParticipantPool 
      : Math.floor(newParticipantPool / (currentPredictionCount + 1))

    // Create participant record
    const participant = await DatabaseService.joinMarket({
      market_id: params.marketId,
      user_id: params.userId,
      prediction: dbPrediction,
      entry_amount: params.entryAmount,
      potential_winnings: potentialWinnings,
    })

    // Update market total pool
    await DatabaseService.updateMarket(params.marketId, {
      total_pool: newTotalPool,
      updated_at: new Date().toISOString(),
    })

    // Create transaction record
    await DatabaseService.createTransaction({
      user_id: params.userId,
      market_id: params.marketId,
      type: 'market_entry',
      amount: params.entryAmount,
      description: `Joined market with ${dbPrediction} prediction`,
    })

    return participant
  }

  /**
   * Resolve a market with the winning outcome
   *
   * @param params - Market resolution parameters
   */
  static async resolveMarket(params: ResolveMarketParams): Promise<void> {
    const market = await DatabaseService.getMarketById(params.marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    if (market.status !== 'active') {
      throw new Error('Market is not active')
    }

    // Get all participants
    const participants = await DatabaseService.getMarketParticipants(params.marketId)
    
    // Use the same fee structure as the original WinningsCalculator
    const totalPool = market.total_pool
    const creatorFee = Math.floor((totalPool * 200) / 10000) // 2% in basis points
    const platformFee = Math.floor((totalPool * 300) / 10000) // 3% in basis points
    const participantPool = Math.floor((totalPool * 9500) / 10000) // 95% in basis points
    
    // Find winners and calculate winnings using the same logic as WinningsCalculator
    const winners = participants.filter(p => p.prediction === params.outcome)
    const winningsPerWinner = winners.length > 0 ? Math.floor(participantPool / winners.length) : 0

    // Update market status
    await DatabaseService.updateMarket(params.marketId, {
      status: 'resolved',
      resolution_outcome: params.outcome,
      updated_at: new Date().toISOString(),
    })

    // Update participant winnings and create transaction records
    for (const participant of participants) {
      const actualWinnings = participant.prediction === params.outcome ? winningsPerWinner : 0
      
      // Update participant with actual winnings
      await DatabaseService.updateParticipant(participant.id, {
        actual_winnings: actualWinnings,
      })

      // Create winnings transaction record for winners
      if (actualWinnings > 0) {
        await DatabaseService.createTransaction({
          user_id: participant.user_id,
          market_id: params.marketId,
          type: 'winnings',
          amount: actualWinnings,
          description: `Winnings from market resolution: ${params.outcome}`,
        })
      }
    }

    // Create creator reward transaction
    if (creatorFee > 0) {
      await DatabaseService.createTransaction({
        user_id: market.creator_id,
        market_id: params.marketId,
        type: 'creator_reward',
        amount: creatorFee,
        description: `Creator reward from market resolution`,
      })
    }

    // Create platform fee transaction
    if (platformFee > 0) {
      await DatabaseService.createTransaction({
        user_id: market.creator_id, // Associate with market creator for tracking
        market_id: params.marketId,
        type: 'platform_fee',
        amount: platformFee,
        description: `Platform fee from market resolution`,
      })
    }
  }

  /**
   * Get markets with optional filters
   *
   * @param filters - Optional filters to apply
   * @returns Array of markets
   */
  static async getMarkets(filters?: MarketFilters): Promise<Market[]> {
    return await DatabaseService.getMarkets(filters)
  }

  /**
   * Get market by ID
   *
   * @param marketId - Market ID to retrieve
   * @returns Market data or null if not found
   */
  static async getMarketById(marketId: string): Promise<Market | null> {
    return await DatabaseService.getMarketById(marketId)
  }

  /**
   * Get markets created by a specific user
   *
   * @param userId - User ID to filter by
   * @returns Array of markets created by the user
   */
  static async getUserCreatedMarkets(userId: string): Promise<Market[]> {
    return await DatabaseService.getMarkets({ creatorId: userId })
  }

  /**
   * Get markets where user has participated
   *
   * @param userId - User ID to filter by
   * @returns Array of markets with user participation
   */
  static async getUserParticipatedMarkets(userId: string): Promise<(Market & { participation: Participant })[]> {
    const participation = await DatabaseService.getUserParticipation(userId)
    
    return participation.map(p => ({
      ...(p as any).markets,
      participation: p,
    })).filter(m => m.id) // Filter out any invalid records
  }

  /**
   * Get market statistics
   *
   * @param marketId - Market ID to get stats for
   * @returns Market statistics including participant counts by prediction
   */
  static async getMarketStats(marketId: string): Promise<{
    totalParticipants: number
    homeCount: number
    drawCount: number
    awayCount: number
    totalPool: number
  }> {
    const participants = await DatabaseService.getMarketParticipants(marketId)
    
    const homeCount = participants.filter(p => p.prediction === 'Home').length
    const drawCount = participants.filter(p => p.prediction === 'Draw').length
    const awayCount = participants.filter(p => p.prediction === 'Away').length
    const totalPool = participants.reduce((sum, p) => sum + p.entry_amount, 0)

    return {
      totalParticipants: participants.length,
      homeCount,
      drawCount,
      awayCount,
      totalPool,
    }
  }

  /**
   * Check if user can resolve a market
   *
   * @param marketId - Market ID to check
   * @param userId - User ID to check permissions for
   * @returns True if user can resolve the market
   */
  static async canUserResolveMarket(marketId: string, userId: string): Promise<boolean> {
    const market = await DatabaseService.getMarketById(marketId)
    if (!market) return false

    // Only market creator can resolve for now
    // In the future, this could be extended to include platform admins
    return market.creator_id === userId
  }

  /**
   * Get user's participation in a specific market
   *
   * @param userId - User ID
   * @param marketId - Market ID
   * @returns Participant data or null if not participating
   */
  static async getUserMarketParticipation(userId: string, marketId: string): Promise<Participant | null> {
    return await DatabaseService.getUserMarketParticipation(userId, marketId)
  }

  /**
   * Get user's multiple predictions in a specific market
   *
   * @param userId - User ID
   * @param marketId - Market ID
   * @returns Array of participant data for the user in the market
   */
  static async getUserMarketPredictions(userId: string, marketId: string): Promise<Participant[]> {
    const allParticipants = await DatabaseService.getMarketParticipants(marketId)
    return allParticipants.filter(p => p.user_id === userId)
  }

  /**
   * Update market status and other fields
   *
   * @param marketId - Market ID to update
   * @param updates - Fields to update
   * @returns Updated market data
   */
  static async updateMarket(marketId: string, updates: MarketUpdate): Promise<Market> {
    return await DatabaseService.updateMarket(marketId, updates)
  }

  /**
   * Get market participants
   *
   * @param marketId - Market ID
   * @returns Array of participants
   */
  static async getMarketParticipants(marketId: string): Promise<Participant[]> {
    return await DatabaseService.getMarketParticipants(marketId)
  }

  /**
   * Cancel a market (only by creator, only if no participants)
   *
   * @param marketId - Market ID to cancel
   * @param userId - User ID requesting cancellation
   */
  static async cancelMarket(marketId: string, userId: string): Promise<void> {
    const market = await DatabaseService.getMarketById(marketId)
    if (!market) {
      throw new Error('Market not found')
    }

    if (market.creator_id !== userId) {
      throw new Error('Only market creator can cancel')
    }

    if (market.status !== 'active') {
      throw new Error('Can only cancel active markets')
    }

    const participants = await DatabaseService.getMarketParticipants(marketId)
    if (participants.length > 0) {
      throw new Error('Cannot cancel market with participants')
    }

    await DatabaseService.updateMarket(marketId, {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
  }

  /**
   * Calculate user balance from all transactions
   *
   * @param userId - User ID to calculate balance for
   * @returns User's current balance
   */
  static async getUserBalance(userId: string): Promise<number> {
    const transactions = await DatabaseService.getUserTransactions(userId)
    
    let balance = 0
    for (const transaction of transactions) {
      switch (transaction.type) {
        case 'winnings':
        case 'creator_reward':
          balance += transaction.amount
          break
        case 'market_entry':
          balance -= transaction.amount
          break
        case 'platform_fee':
          // Platform fees are deducted from winnings, not user balance
          break
      }
    }
    
    return balance
  }

  /**
   * Get user's portfolio summary
   *
   * @param userId - User ID to get portfolio for
   * @returns Portfolio summary with P&L, win rate, etc.
   */
  static async getUserPortfolio(userId: string): Promise<{
    totalWinnings: number
    totalSpent: number
    netProfitLoss: number
    marketsParticipated: number
    marketsWon: number
    winRate: number
    activeMarkets: number
  }> {
    const transactions = await DatabaseService.getUserTransactions(userId)
    const participation = await DatabaseService.getUserParticipation(userId)
    
    let totalWinnings = 0
    let totalSpent = 0
    let creatorRewards = 0
    
    for (const transaction of transactions) {
      switch (transaction.type) {
        case 'winnings':
          totalWinnings += transaction.amount
          break
        case 'creator_reward':
          creatorRewards += transaction.amount
          break
        case 'market_entry':
          totalSpent += transaction.amount
          break
      }
    }
    
    const marketsParticipated = participation.length
    const marketsWon = participation.filter(p => p.actual_winnings && p.actual_winnings > 0).length
    const activeMarkets = participation.filter(p => p.actual_winnings === null).length
    const winRate = marketsParticipated > 0 ? (marketsWon / marketsParticipated) * 100 : 0
    const netProfitLoss = totalWinnings + creatorRewards - totalSpent
    
    return {
      totalWinnings: totalWinnings + creatorRewards,
      totalSpent,
      netProfitLoss,
      marketsParticipated,
      marketsWon,
      winRate,
      activeMarkets
    }
  }
}