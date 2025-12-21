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
      getMarketParticipants: MockDatabaseService.getMarketParticipants,
      getMarketTransactions: MockDatabaseService.getMarketTransactions,
      createMarket: async (params: any) => {
        // Get platform fee percentage from config (default to 5%)
        const platformConfig = await MockDatabaseService.getPlatformConfig('default_platform_fee_percentage')
        const platformFeePercentage = platformConfig?.value ? parseFloat(platformConfig.value as string) : 5

        const marketData = {
          creator_id: params.creatorId,
          title: params.title,
          description: params.description,
          entry_fee: params.entryFee,
          end_time: params.endTime,
          status: 'active' as const,
          total_pool: 0,
          platform_fee_percentage: platformFeePercentage,
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

        if (market.status !== 'active') {
          throw new Error('Market is not active')
        }

        // Check if user already participated
        const existingParticipation = await MockDatabaseService.getUserMarketParticipation(
          params.userId,
          params.marketId
        )
        if (existingParticipation) {
          throw new Error('User has already joined this market')
        }

        // Get current participants to calculate potential winnings
        const currentParticipants = await MockDatabaseService.getMarketParticipants(params.marketId)
        const newTotalPool = market.total_pool + params.entryAmount

        // Use the same fee structure (95% participant pool)
        const newParticipantPool = (newTotalPool * 9500) / 10000
        
        // Count current predictions for the same outcome
        const currentPredictionCount = currentParticipants.filter(p => p.prediction === params.prediction).length
        
        // Calculate potential winnings: divide participant pool by total people who will have this prediction
        const totalWithSamePrediction = currentPredictionCount + 1 // Including this new participant
        const potentialWinnings = newParticipantPool / totalWithSamePrediction

        // Create participant record
        const participant = await MockDatabaseService.joinMarket({
          market_id: params.marketId,
          user_id: params.userId,
          prediction: params.prediction,
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
          description: `Joined market with ${params.prediction} prediction`,
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