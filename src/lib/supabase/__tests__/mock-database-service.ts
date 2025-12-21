/**
 * Mock Database Service
 * 
 * Implements the same interface as DatabaseService but uses in-memory storage
 * for testing without external dependencies.
 */

import { mockSupabaseClient, MockDatabaseError } from './mock-database'
import type { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Market = Tables['markets']['Row']
type Participant = Tables['participants']['Row']
type Transaction = Tables['transactions']['Row']
type PlatformConfig = Tables['platform_config']['Row']

export class MockDatabaseService {
  // Expose mock supabase client for advanced operations
  static get supabase() {
    return mockSupabaseClient
  }

  // User operations
  static async createUser(userData: Tables['users']['Insert']): Promise<User> {
    const { data, error } = await mockSupabaseClient
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    const { data, error } = await mockSupabaseClient
      .from('users')
      .select()
      .eq('wallet_address', walletAddress)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return data
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await mockSupabaseClient
      .from('users')
      .select()
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updateUser(userId: string, updates: Tables['users']['Update']): Promise<User> {
    const { data, error } = await mockSupabaseClient
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Market operations
  static async createMarket(marketData: Tables['markets']['Insert']): Promise<Market> {
    const { data, error } = await mockSupabaseClient
      .from('markets')
      .insert(marketData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getMarkets(filters?: {
    status?: Market['status']
    creatorId?: string
    limit?: number
    offset?: number
  }): Promise<Market[]> {
    let query = mockSupabaseClient.from('markets').select()

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.creatorId) {
      query = query.eq('creator_id', filters.creatorId)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async getMarketById(marketId: string): Promise<Market | null> {
    const { data, error } = await mockSupabaseClient
      .from('markets')
      .select()
      .eq('id', marketId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updateMarket(marketId: string, updates: Tables['markets']['Update']): Promise<Market> {
    const { data, error } = await mockSupabaseClient
      .from('markets')
      .update(updates)
      .eq('id', marketId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Participant operations
  static async joinMarket(participantData: Tables['participants']['Insert']): Promise<Participant> {
    const { data, error } = await mockSupabaseClient
      .from('participants')
      .insert(participantData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getMarketParticipants(marketId: string): Promise<Participant[]> {
    const { data, error } = await mockSupabaseClient
      .from('participants')
      .select()
      .eq('market_id', marketId)
      .order('joined_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getUserParticipation(userId: string): Promise<Participant[]> {
    // Mock the join with markets table
    const { data: participants, error } = await mockSupabaseClient
      .from('participants')
      .select()
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (error) throw error
    
    // Simulate the join by fetching market data for each participant
    const participantsWithMarkets = []
    for (const participant of participants || []) {
      const market = await this.getMarketById(participant.market_id)
      participantsWithMarkets.push({
        ...participant,
        markets: market,
      })
    }
    
    return participantsWithMarkets as any
  }

  static async getUserMarketParticipation(userId: string, marketId: string): Promise<Participant | null> {
    const { data, error } = await mockSupabaseClient
      .from('participants')
      .select()
      .eq('user_id', userId)
      .eq('market_id', marketId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updateParticipant(participantId: string, updates: Tables['participants']['Update']): Promise<Participant> {
    const { data, error } = await mockSupabaseClient
      .from('participants')
      .update(updates)
      .eq('id', participantId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Transaction operations
  static async createTransaction(transactionData: Tables['transactions']['Insert']): Promise<Transaction> {
    // Set default status and metadata if not provided
    const enhancedTransactionData = {
      status: 'PENDING' as const,
      metadata: null,
      ...transactionData,
      created_at: transactionData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await mockSupabaseClient
      .from('transactions')
      .insert(enhancedTransactionData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateTransactionStatus(transactionId: string, status: Transaction['status'], metadata?: any): Promise<Transaction> {
    const updates: Tables['transactions']['Update'] = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (metadata !== undefined) {
      updates.metadata = metadata
    }

    const { data, error } = await mockSupabaseClient
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await mockSupabaseClient
      .from('transactions')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async getMarketTransactions(marketId: string): Promise<Transaction[]> {
    const { data, error } = await mockSupabaseClient
      .from('transactions')
      .select()
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getTransactionsByStatus(status: Transaction['status'], limit = 50): Promise<Transaction[]> {
    const { data, error } = await mockSupabaseClient
      .from('transactions')
      .select()
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async getTransactionById(transactionId: string): Promise<Transaction | null> {
    const { data, error } = await mockSupabaseClient
      .from('transactions')
      .select()
      .eq('id', transactionId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Platform configuration operations
  static async getPlatformConfig(key: string): Promise<PlatformConfig | null> {
    const { data, error } = await mockSupabaseClient
      .from('platform_config')
      .select()
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async setPlatformConfig(key: string, value: any): Promise<PlatformConfig> {
    const { data, error } = await mockSupabaseClient
      .from('platform_config')
      .upsert({ key, value })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getAllPlatformConfig(): Promise<PlatformConfig[]> {
    const { data, error } = await mockSupabaseClient
      .from('platform_config')
      .select()
      .order('key')

    if (error) throw error
    return data || []
  }

  // Market resolution
  static async resolveMarket(marketId: string, winningOutcome: string): Promise<void> {
    const { error } = await mockSupabaseClient.rpc('resolve_market', {
      market_id_param: marketId,
      winning_outcome: winningOutcome,
    })

    if (error) throw error
  }

  // Real-time subscriptions
  static subscribeToMarkets(callback: (payload: any) => void) {
    return mockSupabaseClient
      .channel('markets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'markets' },
        callback
      )
      .subscribe()
  }

  static subscribeToMarketParticipants(marketId: string, callback: (payload: any) => void) {
    return mockSupabaseClient
      .channel(`market-${marketId}-participants`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'participants',
          filter: `market_id=eq.${marketId}`
        },
        callback
      )
      .subscribe()
  }

  static subscribeToUserTransactions(userId: string, callback: (payload: any) => void) {
    return mockSupabaseClient
      .channel(`user-${userId}-transactions`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}