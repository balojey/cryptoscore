/**
 * Test Utilities for Mock Database
 * 
 * Provides utilities for setting up test data, managing test isolation,
 * and common test scenarios.
 */

import { beforeEach, afterEach, vi } from 'vitest'
import { MockDatabaseTestUtils, mockSupabaseClient } from './mock-database'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Market = Tables['markets']['Row']
type Participant = Tables['participants']['Row']
type Transaction = Tables['transactions']['Row']
type PlatformConfig = Tables['platform_config']['Row']

/**
 * Test scenario builders for common use cases
 */
export class TestScenarios {
  /**
   * Create a complete market scenario with creator, participants, and transactions
   */
  static async createMarketScenario(options: {
    participantCount?: number
    marketStatus?: Market['status']
    withTransactions?: boolean
  } = {}) {
    const { participantCount = 3, marketStatus = 'active', withTransactions = true } = options
    
    // Create market creator
    const creator = MockDatabaseTestUtils.createTestUser({
      display_name: 'Market Creator',
      email: 'creator@example.com',
    })
    
    // Create market
    const market = MockDatabaseTestUtils.createTestMarket({
      creator_id: creator.id,
      status: marketStatus,
      title: 'Test Football Match',
      description: 'Manchester United vs Liverpool',
      entry_fee: 0.1,
      total_pool: participantCount * 0.1,
    })
    
    // Create participants
    const participants: Participant[] = []
    const users: User[] = [creator]
    
    for (let i = 0; i < participantCount; i++) {
      const user = MockDatabaseTestUtils.createTestUser({
        display_name: `Participant ${i + 1}`,
        email: `participant${i + 1}@example.com`,
      })
      users.push(user)
      
      const predictions = ['Home', 'Draw', 'Away']
      const participant = MockDatabaseTestUtils.createTestParticipant({
        market_id: market.id,
        user_id: user.id,
        prediction: predictions[i % predictions.length],
        entry_amount: 0.1,
        potential_winnings: 0.2,
      })
      participants.push(participant)
    }
    
    // Create transactions if requested
    const transactions: Transaction[] = []
    if (withTransactions) {
      // Market creation transaction
      transactions.push(MockDatabaseTestUtils.createTestTransaction({
        user_id: creator.id,
        market_id: market.id,
        type: 'market_entry',
        amount: 0,
        description: `Created market: ${market.title}`,
      }))
      
      // Participant entry transactions
      for (const participant of participants) {
        transactions.push(MockDatabaseTestUtils.createTestTransaction({
          user_id: participant.user_id,
          market_id: market.id,
          type: 'market_entry',
          amount: participant.entry_amount,
          description: `Joined market with ${participant.prediction} prediction`,
        }))
      }
    }
    
    return {
      creator,
      market,
      participants,
      users,
      transactions,
    }
  }
  
  /**
   * Create a resolved market scenario with winnings distributed
   */
  static async createResolvedMarketScenario(winningOutcome: 'Home' | 'Draw' | 'Away' = 'Home') {
    const scenario = await this.createMarketScenario({ 
      participantCount: 6, 
      marketStatus: 'resolved',
      withTransactions: true 
    })
    
    // Update market with resolution
    const resolvedMarket = {
      ...scenario.market,
      status: 'resolved' as const,
      resolution_outcome: winningOutcome,
    }
    MockDatabaseTestUtils.getState().markets.set(scenario.market.id, resolvedMarket)
    
    // Calculate and distribute winnings
    const winners = scenario.participants.filter(p => p.prediction === winningOutcome)
    const totalPool = scenario.market.total_pool
    const platformFee = Math.floor((totalPool * 300) / 10000) // 3%
    const creatorReward = Math.floor((totalPool * 200) / 10000) // 2%
    const winnerPool = Math.floor((totalPool * 9500) / 10000) // 95%
    const winningsPerWinner = winners.length > 0 ? Math.floor(winnerPool / winners.length) : 0
    
    // Update participants with actual winnings
    for (const participant of scenario.participants) {
      const actualWinnings = participant.prediction === winningOutcome ? winningsPerWinner : 0
      const updatedParticipant = {
        ...participant,
        actual_winnings: actualWinnings,
      }
      MockDatabaseTestUtils.getState().participants.set(participant.id, updatedParticipant)
    }
    
    // Add winnings transactions
    const additionalTransactions: Transaction[] = []
    for (const winner of winners) {
      additionalTransactions.push(MockDatabaseTestUtils.createTestTransaction({
        user_id: winner.user_id,
        market_id: scenario.market.id,
        type: 'winnings',
        amount: winningsPerWinner,
        description: `Winnings from market resolution: ${winningOutcome}`,
      }))
    }
    
    // Add creator reward transaction
    if (creatorReward > 0) {
      additionalTransactions.push(MockDatabaseTestUtils.createTestTransaction({
        user_id: scenario.creator.id,
        market_id: scenario.market.id,
        type: 'creator_reward',
        amount: creatorReward,
        description: 'Creator reward from market resolution',
      }))
    }
    
    // Add platform fee transaction
    if (platformFee > 0) {
      additionalTransactions.push(MockDatabaseTestUtils.createTestTransaction({
        user_id: scenario.creator.id,
        market_id: scenario.market.id,
        type: 'platform_fee',
        amount: platformFee,
        description: 'Platform fee from market resolution',
      }))
    }
    
    return {
      ...scenario,
      market: resolvedMarket,
      winningOutcome,
      winners,
      winningsPerWinner,
      platformFee,
      creatorReward,
      additionalTransactions,
    }
  }
  
  /**
   * Create a user with complete portfolio data
   */
  static async createUserPortfolioScenario() {
    const user = MockDatabaseTestUtils.createTestUser({
      display_name: 'Portfolio User',
      email: 'portfolio@example.com',
    })
    
    // Create multiple markets where user participated
    const markets: Market[] = []
    const participants: Participant[] = []
    const transactions: Transaction[] = []
    
    for (let i = 0; i < 5; i++) {
      const market = MockDatabaseTestUtils.createTestMarket({
        creator_id: user.id,
        title: `Market ${i + 1}`,
        status: i < 3 ? 'resolved' : 'active',
        resolution_outcome: i < 3 ? (i % 2 === 0 ? 'Home' : 'Away') : null,
      })
      markets.push(market)
      
      const participant = MockDatabaseTestUtils.createTestParticipant({
        market_id: market.id,
        user_id: user.id,
        prediction: i % 2 === 0 ? 'Home' : 'Away',
        entry_amount: 0.1,
        potential_winnings: 0.2,
        actual_winnings: market.status === 'resolved' ? (i % 2 === 0 ? 0.15 : 0) : null,
      })
      participants.push(participant)
      
      // Entry transaction
      transactions.push(MockDatabaseTestUtils.createTestTransaction({
        user_id: user.id,
        market_id: market.id,
        type: 'market_entry',
        amount: 0.1,
        description: `Joined ${market.title}`,
      }))
      
      // Winnings transaction for resolved markets
      if (market.status === 'resolved' && participant.actual_winnings! > 0) {
        transactions.push(MockDatabaseTestUtils.createTestTransaction({
          user_id: user.id,
          market_id: market.id,
          type: 'winnings',
          amount: participant.actual_winnings!,
          description: `Winnings from ${market.title}`,
        }))
      }
    }
    
    return {
      user,
      markets,
      participants,
      transactions,
    }
  }
}

/**
 * Mock setup utilities for tests
 */
export class MockTestSetup {
  /**
   * Setup mock database with default platform configuration
   */
  static async setupWithDefaults() {
    MockDatabaseTestUtils.reset()
    
    // Add default platform configuration
    MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', 5)
    MockDatabaseTestUtils.createTestPlatformConfig('max_platform_fee_percentage', 10)
    MockDatabaseTestUtils.createTestPlatformConfig('min_market_duration_hours', 1)
    MockDatabaseTestUtils.createTestPlatformConfig('max_market_duration_days', 30)
  }
  
  /**
   * Setup mock database with comprehensive test data
   */
  static async setupWithTestData() {
    await this.setupWithDefaults()
    
    // Create test scenarios
    const marketScenario = await TestScenarios.createMarketScenario()
    const resolvedScenario = await TestScenarios.createResolvedMarketScenario()
    const portfolioScenario = await TestScenarios.createUserPortfolioScenario()
    
    return {
      marketScenario,
      resolvedScenario,
      portfolioScenario,
    }
  }
}

/**
 * Vitest setup hooks for automatic test isolation
 */
export function setupMockDatabase() {
  beforeEach(async () => {
    // Reset database before each test
    MockDatabaseTestUtils.reset()
    
    // Setup default platform configuration
    await MockTestSetup.setupWithDefaults()
  })
  
  afterEach(() => {
    // Clean up after each test
    MockDatabaseTestUtils.reset()
    vi.clearAllMocks()
  })
}

/**
 * Assert test data isolation
 */
export function assertTestDataIsolation() {
  const state = MockDatabaseTestUtils.getState()
  
  // Check that all tables are empty or contain only expected test data
  const totalRecords = 
    state.users.size + 
    state.markets.size + 
    state.participants.size + 
    state.transactions.size
  
  // Platform config should have default entries
  const platformConfigCount = state.platform_config.size
  
  return {
    isEmpty: totalRecords === 0,
    hasOnlyDefaults: totalRecords === 0 && platformConfigCount >= 4,
    recordCounts: {
      users: state.users.size,
      markets: state.markets.size,
      participants: state.participants.size,
      transactions: state.transactions.size,
      platform_config: state.platform_config.size,
    },
  }
}

/**
 * Generate random test data for property-based testing
 */
export class TestDataGenerators {
  /**
   * Generate random user data
   */
  static randomUser(overrides: Partial<User> = {}): User {
    return {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      wallet_address: '0x' + Math.random().toString(16).substr(2, 40),
      email: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
      display_name: `User ${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
  }
  
  /**
   * Generate random market data
   */
  static randomMarket(overrides: Partial<Market> = {}): Market {
    const statuses: Market['status'][] = ['active', 'resolved', 'cancelled']
    return {
      id: `market-${Math.random().toString(36).substr(2, 9)}`,
      creator_id: `user-${Math.random().toString(36).substr(2, 9)}`,
      title: `Market ${Math.random().toString(36).substr(2, 8)}`,
      description: `Description ${Math.random().toString(36).substr(2, 20)}`,
      entry_fee: Math.round(Math.random() * 100) / 100,
      end_time: new Date(Date.now() + Math.random() * 86400000).toISOString(),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      resolution_outcome: Math.random() > 0.5 ? ['Home', 'Draw', 'Away'][Math.floor(Math.random() * 3)] : null,
      total_pool: Math.round(Math.random() * 1000) / 100,
      platform_fee_percentage: Math.round(Math.random() * 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
  }
  
  /**
   * Generate random participant data
   */
  static randomParticipant(overrides: Partial<Participant> = {}): Participant {
    const predictions = ['Home', 'Draw', 'Away']
    return {
      id: `participant-${Math.random().toString(36).substr(2, 9)}`,
      market_id: `market-${Math.random().toString(36).substr(2, 9)}`,
      user_id: `user-${Math.random().toString(36).substr(2, 9)}`,
      prediction: predictions[Math.floor(Math.random() * predictions.length)],
      entry_amount: Math.round(Math.random() * 100) / 100,
      potential_winnings: Math.round(Math.random() * 200) / 100,
      actual_winnings: Math.random() > 0.5 ? Math.round(Math.random() * 200) / 100 : null,
      joined_at: new Date().toISOString(),
      ...overrides,
    }
  }
}

// Export MockDatabaseTestUtils for backward compatibility
export { MockDatabaseTestUtils }