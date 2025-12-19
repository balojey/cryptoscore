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
}

/**
 * Market participation parameters
 */
export interface JoinMarketParams {
  marketId: string
  userId: string
  prediction: 'Home' | 'Draw' | 'Away'
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
    // Get platform fee percentage from config (default to 5%)
    const platformConfig = await DatabaseService.getPlatformConfig('platform_fee_percentage')
    const platformFeePercentage = platformConfig?.value as number || 5

    const marketData: MarketInsert = {
      creator_id: params.creatorId,
      title: params.title,
      description: params.description,
      entry_fee: params.entryFee,
      end_time: params.endTime,
      status: 'active',
      total_pool: 0, // Will be updated as participants join
      platform_fee_percentage: platformFeePercentage,
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

    if (market.status !== 'active') {
      throw new Error('Market is not active')
    }

    if (new Date(market.end_time) < new Date()) {
      throw new Error('Market has ended')
    }

    // Check if user already participated
    const existingParticipation = await DatabaseService.getUserMarketParticipation(
      params.userId,
      params.marketId
    )
    if (existingParticipation) {
      throw new Error('User has already joined this market')
    }

    // Get current participants to calculate potential winnings
    const currentParticipants = await DatabaseService.getMarketParticipants(params.marketId)
    const totalParticipants = currentParticipants.length
    const newTotalPool = market.total_pool + params.entryAmount

    // Calculate potential winnings (simplified: total pool minus platform fee)
    const platformFee = newTotalPool * (market.platform_fee_percentage / 100)
    const winnerPool = newTotalPool - platformFee
    
    // Estimate potential winnings assuming equal distribution among winners
    // This is a simplified calculation - actual winnings depend on final participant distribution
    const estimatedWinners = Math.max(1, Math.floor(totalParticipants / 3)) // Rough estimate
    const potentialWinnings = winnerPool / estimatedWinners

    // Create participant record
    const participant = await DatabaseService.joinMarket({
      market_id: params.marketId,
      user_id: params.userId,
      prediction: params.prediction,
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
      description: `Joined market with ${params.prediction} prediction`,
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
    
    // Find winners
    const winners = participants.filter(p => p.prediction === params.outcome)
    const totalPool = market.total_pool
    const platformFee = totalPool * (market.platform_fee_percentage / 100)
    const winnerPool = totalPool - platformFee

    // Calculate winnings per winner
    const winningsPerWinner = winners.length > 0 ? winnerPool / winners.length : 0

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
      await DatabaseService.supabase
        .from('participants')
        .update({ actual_winnings: actualWinnings })
        .eq('id', participant.id)

      // Create winnings transaction record (even if 0)
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

    // Create platform fee transaction if there are fees
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
}