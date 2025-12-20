/**
 * Optimized Dashboard Queries for Supabase
 * 
 * Provides efficient database queries with proper indexing
 * for dashboard and portfolio functionality.
 */

import { DatabaseService } from './database-service'
import type { Database } from '@/types/supabase'

type Market = Database['public']['Tables']['markets']['Row']
type Participant = Database['public']['Tables']['participants']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']

/**
 * Enhanced market data with aggregated statistics
 */
export interface DashboardMarketData extends Market {
  participant_count: number
  home_count: number
  draw_count: number
  away_count: number
  user_participation?: Participant
}

/**
 * Portfolio statistics aggregated from database
 */
export interface PortfolioStats {
  total_markets_created: number
  total_markets_joined: number
  total_active_positions: number
  total_resolved_positions: number
  total_winnings: number
  total_spent: number
  net_profit_loss: number
  win_rate: number
  claimable_winnings: number
}

/**
 * Dashboard Queries class
 * 
 * Provides optimized database queries for dashboard functionality
 * with proper indexing and efficient data aggregation.
 */
export class DashboardQueries {
  /**
   * Get user's dashboard data with optimized queries
   * 
   * Uses efficient joins and aggregations to minimize database round trips
   * 
   * @param userId - User ID to fetch data for
   * @returns Dashboard data with created and joined markets
   */
  static async getUserDashboardData(userId: string): Promise<{
    createdMarkets: DashboardMarketData[]
    joinedMarkets: DashboardMarketData[]
    allInvolvedMarkets: DashboardMarketData[]
  }> {
    // Single query to get all markets with participant counts and user participation
    const { data: marketsData, error } = await DatabaseService.supabase
      .from('markets')
      .select(`
        *,
        participants!inner (
          id,
          user_id,
          prediction,
          entry_amount,
          potential_winnings,
          actual_winnings,
          joined_at
        )
      `)
      .or(`creator_id.eq.${userId},participants.user_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Process the data to create enhanced market objects
    const marketMap = new Map<string, DashboardMarketData>()

    marketsData?.forEach((market: any) => {
      const marketId = market.id
      
      if (!marketMap.has(marketId)) {
        // Initialize market data
        marketMap.set(marketId, {
          ...market,
          participant_count: 0,
          home_count: 0,
          draw_count: 0,
          away_count: 0,
          participants: undefined, // Remove the participants array from the response
        })
      }

      const enhancedMarket = marketMap.get(marketId)!
      
      // Process participants
      if (market.participants) {
        const participants = Array.isArray(market.participants) ? market.participants : [market.participants]
        
        participants.forEach((participant: Participant) => {
          enhancedMarket.participant_count++
          
          // Count predictions
          switch (participant.prediction) {
            case 'Home':
              enhancedMarket.home_count++
              break
            case 'Draw':
              enhancedMarket.draw_count++
              break
            case 'Away':
              enhancedMarket.away_count++
              break
          }
          
          // Track user's participation
          if (participant.user_id === userId) {
            enhancedMarket.user_participation = participant
          }
        })
      }
    })

    const allMarkets = Array.from(marketMap.values())

    // Categorize markets
    const createdMarkets = allMarkets.filter(market => market.creator_id === userId)
    const joinedMarkets = allMarkets.filter(market => market.user_participation !== undefined)
    const allInvolvedMarkets = allMarkets // Already filtered by the query

    return {
      createdMarkets,
      joinedMarkets,
      allInvolvedMarkets,
    }
  }

  /**
   * Get user's portfolio statistics with single aggregated query
   * 
   * @param userId - User ID to calculate stats for
   * @returns Aggregated portfolio statistics
   */
  static async getUserPortfolioStats(userId: string): Promise<PortfolioStats> {
    // Get aggregated transaction data
    const { data: transactionStats, error: transactionError } = await DatabaseService.supabase
      .rpc('get_user_transaction_stats', { user_id_param: userId })

    if (transactionError) {
      console.warn('Transaction stats RPC not available, falling back to manual calculation')
      return await this.calculatePortfolioStatsManually(userId)
    }

    // Get aggregated participation data
    const { data: participationStats, error: participationError } = await DatabaseService.supabase
      .rpc('get_user_participation_stats', { user_id_param: userId })

    if (participationError) {
      console.warn('Participation stats RPC not available, falling back to manual calculation')
      return await this.calculatePortfolioStatsManually(userId)
    }

    return {
      total_markets_created: participationStats?.total_markets_created || 0,
      total_markets_joined: participationStats?.total_markets_joined || 0,
      total_active_positions: participationStats?.total_active_positions || 0,
      total_resolved_positions: participationStats?.total_resolved_positions || 0,
      total_winnings: transactionStats?.total_winnings || 0,
      total_spent: transactionStats?.total_spent || 0,
      net_profit_loss: (transactionStats?.total_winnings || 0) - (transactionStats?.total_spent || 0),
      win_rate: participationStats?.win_rate || 0,
      claimable_winnings: participationStats?.claimable_winnings || 0,
    }
  }

  /**
   * Fallback method to calculate portfolio stats manually
   * Used when database functions are not available
   * 
   * @param userId - User ID to calculate stats for
   * @returns Manually calculated portfolio statistics
   */
  private static async calculatePortfolioStatsManually(userId: string): Promise<PortfolioStats> {
    // Get user transactions
    const transactions = await DatabaseService.getUserTransactions(userId, 1000)
    
    // Get user participation
    const participation = await DatabaseService.getUserParticipation(userId)

    // Calculate transaction stats
    let totalWinnings = 0
    let totalSpent = 0

    transactions.forEach(transaction => {
      switch (transaction.type) {
        case 'winnings':
        case 'creator_reward':
          totalWinnings += transaction.amount
          break
        case 'market_entry':
          totalSpent += transaction.amount
          break
      }
    })

    // Calculate participation stats
    const totalMarketsJoined = participation.length
    const activePositions = participation.filter(p => 
      (p as any).markets?.status === 'active'
    ).length
    const resolvedPositions = participation.filter(p => 
      (p as any).markets?.status === 'resolved'
    ).length
    const wonPositions = participation.filter(p => 
      p.actual_winnings && p.actual_winnings > 0
    ).length
    const claimableWinnings = participation
      .filter(p => p.actual_winnings && p.actual_winnings > 0)
      .reduce((sum, p) => sum + (p.actual_winnings || 0), 0)

    // Get created markets count
    const createdMarkets = await DatabaseService.getMarkets({ creatorId: userId })
    const totalMarketsCreated = createdMarkets.length

    const winRate = resolvedPositions > 0 ? (wonPositions / resolvedPositions) * 100 : 0

    return {
      total_markets_created: totalMarketsCreated,
      total_markets_joined: totalMarketsJoined,
      total_active_positions: activePositions,
      total_resolved_positions: resolvedPositions,
      total_winnings: totalWinnings,
      total_spent: totalSpent,
      net_profit_loss: totalWinnings - totalSpent,
      win_rate: winRate,
      claimable_winnings: claimableWinnings,
    }
  }

  /**
   * Get recent activity for user dashboard
   * 
   * @param userId - User ID to get activity for
   * @param limit - Number of recent activities to return
   * @returns Recent market activities
   */
  static async getUserRecentActivity(userId: string, limit = 10): Promise<{
    type: 'created' | 'joined' | 'won' | 'resolved'
    market: Market
    timestamp: string
    amount?: number
  }[]> {
    // Get recent transactions with market data
    const { data: recentTransactions, error } = await DatabaseService.supabase
      .from('transactions')
      .select(`
        *,
        markets (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    // Transform transactions to activity items
    const activities = recentTransactions?.map((transaction: any) => {
      let type: 'created' | 'joined' | 'won' | 'resolved'
      
      switch (transaction.type) {
        case 'market_entry':
          type = transaction.markets?.creator_id === userId ? 'created' : 'joined'
          break
        case 'winnings':
          type = 'won'
          break
        case 'creator_reward':
          type = 'resolved'
          break
        default:
          type = 'joined'
      }

      return {
        type,
        market: transaction.markets,
        timestamp: transaction.created_at,
        amount: transaction.amount,
      }
    }) || []

    return activities
  }

  /**
   * Get market performance data for charts
   * 
   * @param userId - User ID to get performance for
   * @returns Performance data over time
   */
  static async getUserPerformanceData(userId: string): Promise<{
    date: string
    profit_loss: number
    cumulative_pnl: number
  }[]> {
    const { data: performanceData, error } = await DatabaseService.supabase
      .rpc('get_user_performance_over_time', { user_id_param: userId })

    if (error) {
      console.warn('Performance RPC not available, returning empty data')
      return []
    }

    return performanceData || []
  }
}

/**
 * Database optimization recommendations
 * 
 * The following indexes should be created for optimal performance:
 * 
 * 1. Markets table:
 *    - CREATE INDEX idx_markets_creator_id ON markets(creator_id);
 *    - CREATE INDEX idx_markets_status ON markets(status);
 *    - CREATE INDEX idx_markets_created_at ON markets(created_at DESC);
 * 
 * 2. Participants table:
 *    - CREATE INDEX idx_participants_user_id ON participants(user_id);
 *    - CREATE INDEX idx_participants_market_id ON participants(market_id);
 *    - CREATE INDEX idx_participants_prediction ON participants(prediction);
 *    - CREATE INDEX idx_participants_joined_at ON participants(joined_at DESC);
 * 
 * 3. Transactions table:
 *    - CREATE INDEX idx_transactions_user_id ON transactions(user_id);
 *    - CREATE INDEX idx_transactions_type ON transactions(type);
 *    - CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
 * 
 * 4. Composite indexes:
 *    - CREATE INDEX idx_markets_creator_status ON markets(creator_id, status);
 *    - CREATE INDEX idx_participants_user_market ON participants(user_id, market_id);
 *    - CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
 */