/**
 * Mock Database Service for Testing
 * 
 * Provides an in-memory database implementation that simulates Supabase operations
 * without requiring external dependencies or affecting production data.
 */

import { v4 as uuidv4 } from 'uuid'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Market = Tables['markets']['Row']
type Participant = Tables['participants']['Row']
type Transaction = Tables['transactions']['Row']
type PlatformConfig = Tables['platform_config']['Row']

/**
 * Mock database error for simulating database failures
 */
export class MockDatabaseError extends Error {
  code: string
  
  constructor(message: string, code: string = 'MOCK_ERROR') {
    super(message)
    this.name = 'MockDatabaseError'
    this.code = code
  }
}

/**
 * In-memory database storage
 */
interface MockDatabase {
  users: Map<string, User>
  markets: Map<string, Market>
  participants: Map<string, Participant>
  transactions: Map<string, Transaction>
  platform_config: Map<string, PlatformConfig>
}

/**
 * Mock subscription for real-time functionality
 */
export class MockSubscription {
  private callbacks: ((payload: any) => void)[] = []
  
  constructor(private channel: string) {}
  
  on(event: string, config: any, callback: (payload: any) => void) {
    this.callbacks.push(callback)
    return this
  }
  
  subscribe() {
    return Promise.resolve({ status: 'SUBSCRIBED' })
  }
  
  unsubscribe() {
    this.callbacks = []
    return Promise.resolve({ status: 'CLOSED' })
  }
  
  // Simulate real-time event
  simulateEvent(payload: any) {
    this.callbacks.forEach(callback => callback(payload))
  }
}

/**
 * Mock Supabase client that simulates database operations
 */
export class MockSupabaseClient {
  private database: MockDatabase = {
    users: new Map(),
    markets: new Map(),
    participants: new Map(),
    transactions: new Map(),
    platform_config: new Map(),
  }
  
  private subscriptions: Map<string, MockSubscription> = new Map()
  
  /**
   * Reset the database to empty state
   */
  reset() {
    this.database = {
      users: new Map(),
      markets: new Map(),
      participants: new Map(),
      transactions: new Map(),
      platform_config: new Map(),
    }
    this.subscriptions.clear()
  }
  
  /**
   * Seed the database with initial data
   */
  seed(data: Partial<MockDatabase>) {
    if (data.users) {
      data.users.forEach((user, id) => this.database.users.set(id, user))
    }
    if (data.markets) {
      data.markets.forEach((market, id) => this.database.markets.set(id, market))
    }
    if (data.participants) {
      data.participants.forEach((participant, id) => this.database.participants.set(id, participant))
    }
    if (data.transactions) {
      data.transactions.forEach((transaction, id) => this.database.transactions.set(id, transaction))
    }
    if (data.platform_config) {
      data.platform_config.forEach((config, key) => this.database.platform_config.set(key, config))
    }
  }
  
  /**
   * Get current database state (for testing)
   */
  getState(): MockDatabase {
    return this.database
  }
  
  /**
   * Mock table operations
   */
  from(table: string) {
    return new MockTable(table, this.database)
  }
  
  /**
   * Mock RPC operations
   */
  rpc(functionName: string, params: any) {
    if (functionName === 'resolve_market') {
      return this.mockResolveMarket(params.market_id_param, params.winning_outcome)
    }
    
    return Promise.resolve({ data: null, error: new MockDatabaseError(`Unknown RPC function: ${functionName}`) })
  }
  
  /**
   * Mock real-time subscriptions
   */
  channel(name: string) {
    if (!this.subscriptions.has(name)) {
      this.subscriptions.set(name, new MockSubscription(name))
    }
    return this.subscriptions.get(name)!
  }
  
  /**
   * Mock market resolution RPC function
   */
  private async mockResolveMarket(marketId: string, winningOutcome: string) {
    const market = this.database.markets.get(marketId)
    if (!market) {
      return { data: null, error: new MockDatabaseError('Market not found', 'PGRST116') }
    }
    
    // Update market status
    const updatedMarket = {
      ...market,
      status: 'resolved' as const,
      resolution_outcome: winningOutcome,
      updated_at: new Date().toISOString(),
    }
    this.database.markets.set(marketId, updatedMarket)
    
    return { data: null, error: null }
  }
  
  /**
   * Simulate real-time event for testing
   */
  simulateRealtimeEvent(channel: string, payload: any) {
    const subscription = this.subscriptions.get(channel)
    if (subscription) {
      subscription.simulateEvent(payload)
    }
  }
}

/**
 * Mock table operations
 */
class MockTable {
  constructor(
    private tableName: string,
    private database: MockDatabase
  ) {}
  
  private getTable(): Map<string, any> {
    switch (this.tableName) {
      case 'users': return this.database.users
      case 'markets': return this.database.markets
      case 'participants': return this.database.participants
      case 'transactions': return this.database.transactions
      case 'platform_config': return this.database.platform_config
      default: throw new MockDatabaseError(`Unknown table: ${this.tableName}`)
    }
  }
  
  /**
   * Mock INSERT operation
   */
  insert(data: any) {
    return {
      select: () => ({
        single: () => {
          const table = this.getTable()
          const id = data.id || uuidv4()
          const timestamp = new Date().toISOString()
          
          // Handle participants table unique constraint validation
          if (this.tableName === 'participants') {
            // Check for existing prediction with same market_id, user_id, and prediction
            for (const participant of table.values()) {
              if (participant.market_id === data.market_id && 
                  participant.user_id === data.user_id && 
                  participant.prediction === data.prediction) {
                return Promise.resolve({ 
                  data: null, 
                  error: new MockDatabaseError('duplicate key value violates unique constraint "unique_market_user_prediction"', '23505') 
                })
              }
            }
            
            // Check prediction limit (max 3 per user per market)
            const userParticipants = Array.from(table.values()).filter(
              p => p.market_id === data.market_id && p.user_id === data.user_id
            )
            if (userParticipants.length >= 3) {
              return Promise.resolve({ 
                data: null, 
                error: new MockDatabaseError('User cannot place more than 3 predictions per market', 'P0001') 
              })
            }
          }
          
          const record = {
            ...data,
            id,
            created_at: data.created_at || timestamp,
            updated_at: data.updated_at || timestamp,
          }
          
          // Handle participants table special case (uses joined_at instead of created_at)
          if (this.tableName === 'participants') {
            record.joined_at = data.joined_at || timestamp
          }
          
          // Handle platform_config special case (uses key instead of id)
          if (this.tableName === 'platform_config') {
            record.updated_at = timestamp
            table.set(data.key, record)
          } else {
            table.set(id, record)
          }
          
          return Promise.resolve({ data: record, error: null })
        }
      })
    }
  }
  
  /**
   * Mock SELECT operation
   */
  select(columns = '*') {
    return new MockSelectBuilder(this.tableName, this.database, columns)
  }
  
  /**
   * Mock UPDATE operation
   */
  update(data: any) {
    return {
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => {
            const table = this.getTable()
            let record: any = null
            
            if (this.tableName === 'platform_config' && column === 'key') {
              record = table.get(value)
            } else {
              for (const [id, item] of table.entries()) {
                if ((item as any)[column] === value) {
                  record = item
                  break
                }
              }
            }
            
            if (!record) {
              return Promise.resolve({ 
                data: null, 
                error: new MockDatabaseError('Record not found', 'PGRST116') 
              })
            }
            
            const updatedRecord = {
              ...record,
              ...data,
              updated_at: new Date().toISOString(),
            }
            
            if (this.tableName === 'platform_config') {
              table.set(record.key, updatedRecord)
            } else {
              table.set(record.id, updatedRecord)
            }
            
            return Promise.resolve({ data: updatedRecord, error: null })
          }
        })
      })
    }
  }
  
  /**
   * Mock DELETE operation
   */
  delete() {
    return {
      eq: (column: string, value: any) => {
        const table = this.getTable()
        let deleted = false
        
        if (this.tableName === 'platform_config' && column === 'key') {
          deleted = table.delete(value)
        } else {
          for (const [id, item] of table.entries()) {
            if ((item as any)[column] === value) {
              table.delete(id)
              deleted = true
              break
            }
          }
        }
        
        return Promise.resolve({ 
          error: deleted ? null : new MockDatabaseError('Record not found', 'PGRST116') 
        })
      }
    }
  }
  
  /**
   * Mock UPSERT operation
   */
  upsert(data: any) {
    return {
      select: () => ({
        single: () => {
          const table = this.getTable()
          const timestamp = new Date().toISOString()
          
          if (this.tableName === 'platform_config') {
            const record = {
              ...data,
              updated_at: timestamp,
            }
            table.set(data.key, record)
            return Promise.resolve({ data: record, error: null })
          }
          
          // For other tables, treat as insert
          const id = data.id || uuidv4()
          const record = {
            ...data,
            id,
            created_at: data.created_at || timestamp,
            updated_at: timestamp,
          }
          
          table.set(id, record)
          return Promise.resolve({ data: record, error: null })
        }
      })
    }
  }
}

/**
 * Mock SELECT query builder
 */
class MockSelectBuilder {
  private filters: Array<{ column: string, operator: string, value: any }> = []
  private orderBy: { column: string, ascending: boolean } | null = null
  private limitValue: number | null = null
  private rangeStart: number | null = null
  private rangeEnd: number | null = null
  
  constructor(
    private tableName: string,
    private database: MockDatabase,
    private columns: string
  ) {}
  
  private getTable(): Map<string, any> {
    switch (this.tableName) {
      case 'users': return this.database.users
      case 'markets': return this.database.markets
      case 'participants': return this.database.participants
      case 'transactions': return this.database.transactions
      case 'platform_config': return this.database.platform_config
      default: throw new MockDatabaseError(`Unknown table: ${this.tableName}`)
    }
  }
  
  eq(column: string, value: any) {
    this.filters.push({ column, operator: 'eq', value })
    return this
  }
  
  order(column: string, options: { ascending?: boolean } = {}) {
    this.orderBy = { column, ascending: options.ascending !== false }
    return this
  }
  
  limit(count: number) {
    this.limitValue = count
    return this
  }
  
  range(start: number, end: number) {
    this.rangeStart = start
    this.rangeEnd = end
    return this
  }
  
  single() {
    return this.execute().then(result => {
      if (result.error) return result
      
      const data = result.data as any[]
      if (data.length === 0) {
        return { data: null, error: new MockDatabaseError('Record not found', 'PGRST116') }
      }
      if (data.length > 1) {
        return { data: null, error: new MockDatabaseError('Multiple records found') }
      }
      
      return { data: data[0], error: null }
    })
  }
  
  private async execute() {
    try {
      const table = this.getTable()
      let records = Array.from(table.values())
      
      // Apply filters
      for (const filter of this.filters) {
        records = records.filter(record => {
          const recordValue = (record as any)[filter.column]
          switch (filter.operator) {
            case 'eq':
              return recordValue === filter.value
            default:
              return true
          }
        })
      }
      
      // Apply ordering
      if (this.orderBy) {
        records.sort((a, b) => {
          const aValue = (a as any)[this.orderBy!.column]
          const bValue = (b as any)[this.orderBy!.column]
          
          let comparison = 0
          if (aValue < bValue) comparison = -1
          else if (aValue > bValue) comparison = 1
          
          return this.orderBy!.ascending ? comparison : -comparison
        })
      }
      
      // Apply range/limit
      if (this.rangeStart !== null && this.rangeEnd !== null) {
        records = records.slice(this.rangeStart, this.rangeEnd + 1)
      } else if (this.limitValue !== null) {
        records = records.slice(0, this.limitValue)
      }
      
      return { data: records, error: null }
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof MockDatabaseError ? error : new MockDatabaseError(String(error)) 
      }
    }
  }
  
  then(onFulfilled?: any, onRejected?: any) {
    return this.execute().then(onFulfilled, onRejected)
  }
}

/**
 * Global mock database instance for tests
 */
export const mockSupabaseClient = new MockSupabaseClient()

/**
 * Test utilities for mock database setup and cleanup
 */
export class MockDatabaseTestUtils {
  /**
   * Reset database to clean state
   */
  static reset() {
    mockSupabaseClient.reset()
  }
  
  /**
   * Seed database with test data
   */
  static seed(data: Partial<MockDatabase>) {
    mockSupabaseClient.seed(data)
  }
  
  /**
   * Create test user
   */
  static createTestUser(overrides: Partial<User> = {}): User {
    const user: User = {
      id: uuidv4(),
      wallet_address: '0x' + Math.random().toString(16).substr(2, 40),
      email: `test${Math.random().toString(36).substr(2, 9)}@example.com`,
      display_name: `Test User ${Math.random().toString(36).substr(2, 5)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
    
    // Actually insert into the mock database
    const database = mockSupabaseClient.getState()
    database.users.set(user.id, user)
    return user
  }
  
  /**
   * Create test market
   */
  static createTestMarket(overrides: Partial<Market> = {}): Market {
    const market: Market = {
      id: uuidv4(),
      creator_id: uuidv4(),
      title: `Test Market ${Math.random().toString(36).substr(2, 5)}`,
      description: 'Test market description',
      entry_fee: 0.1,
      end_time: new Date(Date.now() + 86400000).toISOString(),
      status: 'active',
      resolution_outcome: null,
      total_pool: 0,
      platform_fee_percentage: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    }
    
    // Actually insert into the mock database
    const database = mockSupabaseClient.getState()
    database.markets.set(market.id, market)
    return market
  }
  
  /**
   * Create test participant
   */
  static createTestParticipant(overrides: Partial<Participant> = {}): Participant {
    const participant: Participant = {
      id: uuidv4(),
      market_id: uuidv4(),
      user_id: uuidv4(),
      prediction: 'Home',
      entry_amount: 0.1,
      potential_winnings: 0.2,
      actual_winnings: null,
      joined_at: new Date().toISOString(),
      ...overrides,
    }
    
    // Actually insert into the mock database
    const database = mockSupabaseClient.getState()
    database.participants.set(participant.id, participant)
    return participant
  }
  
  /**
   * Create test transaction
   */
  static createTestTransaction(overrides: Partial<Transaction> = {}): Transaction {
    const transaction: Transaction = {
      id: uuidv4(),
      user_id: uuidv4(),
      market_id: uuidv4(),
      type: 'market_entry',
      amount: 0.1,
      description: 'Test transaction',
      created_at: new Date().toISOString(),
      ...overrides,
    }
    
    // Actually insert into the mock database
    const database = mockSupabaseClient.getState()
    database.transactions.set(transaction.id, transaction)
    return transaction
  }
  
  /**
   * Create test platform config
   */
  static createTestPlatformConfig(key: string, value: any): PlatformConfig {
    const config: PlatformConfig = {
      key,
      value,
      updated_at: new Date().toISOString(),
    }
    
    // Actually insert into the mock database
    const database = mockSupabaseClient.getState()
    database.platform_config.set(key, config)
    return config
  }
  
  /**
   * Get current database state
   */
  static getState(): MockDatabase {
    return mockSupabaseClient.getState()
  }
  
  /**
   * Simulate real-time event
   */
  static simulateRealtimeEvent(channel: string, payload: any) {
    mockSupabaseClient.simulateRealtimeEvent(channel, payload)
  }
}