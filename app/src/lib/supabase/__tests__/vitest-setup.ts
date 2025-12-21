/**
 * Vitest Setup for Mock Database Testing
 * 
 * Configures the test environment to use mock database services
 * and ensures proper test isolation.
 */

import { vi } from 'vitest'
import { mockSupabaseClient } from './mock-database'
import { MockDatabaseService } from './mock-database-service'

// Mock the Supabase client globally
vi.mock('@/config/supabase', () => ({
  supabase: mockSupabaseClient,
  DB_CONFIG: {
    poolSize: 10,
    timeout: 30000,
  },
  REALTIME_CONFIG: {
    eventsPerSecond: 10,
    heartbeatInterval: 30000,
  },
  PLATFORM_CONFIG: {
    feePercentage: 5.0,
    minMarketDurationHours: 1,
    maxMarketDurationDays: 30,
  },
}))

// Mock the DatabaseService to use MockDatabaseService
vi.mock('../database-service', () => ({
  DatabaseService: MockDatabaseService,
}))

// Mock the MarketService to use MockDatabaseService
vi.mock('../market-service', async () => {
  const actual = await vi.importActual('../market-service')
  return {
    ...actual,
    MarketService: {
      ...actual.MarketService,
      // Override methods to use MockDatabaseService
      getUserTransactions: MockDatabaseService.getUserTransactions,
      getMarketTransactions: MockDatabaseService.getMarketTransactions,
      createMarket: async (params: any) => {
        // Get platform fee percentage from config (default to 0.03 for 3%)
        const platformConfig = await MockDatabaseService.getPlatformConfig('default_platform_fee_percentage')
        const platformFeePercentage = platformConfig?.value ? parseFloat(platformConfig.value as string) : 0.03

        // Get creator reward percentage from config (default to 0.02 for 2%)
        const creatorRewardConfig = await MockDatabaseService.getPlatformConfig('default_creator_reward_percentage')
        const creatorRewardPercentage = creatorRewardConfig?.value ? parseFloat(creatorRewardConfig.value as string) : 0.02

        const marketData = {
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
          status: 'SCHEDULED' as const,
          total_pool: 0,
          platform_fee_percentage: platformFeePercentage,
          creator_reward_percentage: creatorRewardPercentage,
        }

        const market = await MockDatabaseService.createMarket(marketData)

        // Create initial transaction record for market creation
        await MockDatabaseService.createTransaction({
          user_id: params.creatorId,
          market_id: market.id,
          type: 'market_entry',
          amount: 0,
          description: `Created market: ${params.title}`,
        })

        return market
      },
      joinMarket: async (params: any) => {
        // Get market data to validate
        const market = await MockDatabaseService.getMarketById(params.marketId)
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
        const existingParticipants = await MockDatabaseService.getMarketParticipants(params.marketId)
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

        // Get current participants to calculate potential winnings
        const currentParticipants = await MockDatabaseService.getMarketParticipants(params.marketId)
        const newTotalPool = market.total_pool + params.entryAmount

        // Use the same fee structure (95% participant pool)
        const newParticipantPool = Math.max(1, Math.floor((newTotalPool * 9500) / 10000))
        
        // Count current predictions for the same outcome
        const currentPredictionCount = currentParticipants.filter(p => p.prediction === dbPrediction).length
        
        // Calculate potential winnings: if no one has made this prediction yet, user gets full participant pool
        // Otherwise, divide by the number of people who will have made this prediction (including this user)
        const potentialWinnings = currentPredictionCount === 0 
          ? newParticipantPool 
          : Math.max(1, Math.floor(newParticipantPool / (currentPredictionCount + 1)))

        // Create participant record
        const participant = await MockDatabaseService.joinMarket({
          market_id: params.marketId,
          user_id: params.userId,
          prediction: dbPrediction,
          entry_amount: params.entryAmount,
          potential_winnings: potentialWinnings,
        })

        // Update market total pool
        await MockDatabaseService.updateMarket(params.marketId, {
          total_pool: newTotalPool,
          updated_at: new Date().toISOString(),
        })

        // Create transaction record
        await MockDatabaseService.createTransaction({
          user_id: params.userId,
          market_id: params.marketId,
          type: 'market_entry',
          amount: params.entryAmount,
          description: `Joined market with ${dbPrediction} prediction`,
        })

        return participant
      },
      resolveMarket: async (params: any) => {
        const market = await MockDatabaseService.getMarketById(params.marketId)
        if (!market) {
          throw new Error('Market not found')
        }

        if (market.status !== 'active') {
          throw new Error('Market is not active')
        }

        // Get all participants
        const participants = await MockDatabaseService.getMarketParticipants(params.marketId)
        
        // Use the same fee structure
        const totalPool = market.total_pool
        const creatorFee = (totalPool * 200) / 10000 // 2%
        const platformFee = (totalPool * 300) / 10000 // 3%
        const participantPool = (totalPool * 9500) / 10000 // 95%
        
        // Find winners and calculate winnings
        const winners = participants.filter(p => p.prediction === params.outcome)
        const winningsPerWinner = winners.length > 0 ? participantPool / winners.length : 0

        // Update market status
        await MockDatabaseService.updateMarket(params.marketId, {
          status: 'resolved',
          resolution_outcome: params.outcome,
          updated_at: new Date().toISOString(),
        })

        // Update participant winnings and create transaction records
        for (const participant of participants) {
          const actualWinnings = participant.prediction === params.outcome ? winningsPerWinner : 0
          
          // Update participant with actual winnings
          await MockDatabaseService.updateParticipant(participant.id, {
            actual_winnings: actualWinnings,
          })

          // Create winnings transaction record for winners
          if (actualWinnings > 0) {
            await MockDatabaseService.createTransaction({
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
          await MockDatabaseService.createTransaction({
            user_id: market.creator_id,
            market_id: params.marketId,
            type: 'creator_reward',
            amount: creatorFee,
            description: `Creator reward from market resolution`,
          })
        }

        // Create platform fee transaction
        if (platformFee > 0) {
          await MockDatabaseService.createTransaction({
            user_id: market.creator_id,
            market_id: params.marketId,
            type: 'platform_fee',
            amount: platformFee,
            description: `Platform fee from market resolution`,
          })
        }
      },
      getMarketById: MockDatabaseService.getMarketById,
      updateMarket: MockDatabaseService.updateMarket,
      getMarketParticipants: MockDatabaseService.getMarketParticipants,
      getUserMarketPredictions: async (userId: string, marketId: string) => {
        const allParticipants = await MockDatabaseService.getMarketParticipants(marketId)
        return allParticipants.filter(p => p.user_id === userId)
      },
      getMarketStats: async (marketId: string) => {
        const participants = await MockDatabaseService.getMarketParticipants(marketId)
        
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
      },
    }
  }
})

// Mock UUID generation for consistent test results
vi.mock('uuid', () => ({
  v4: () => `test-uuid-${Math.random().toString(36).substr(2, 9)}`,
}))

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: console.warn,
  error: console.error,
}