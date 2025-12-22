import { supabase } from '@/config/supabase'
import type { Database } from '@/types/supabase'
import { mneeToAtomic, atomicToMnee } from './mnee-utils'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type Market = Tables['markets']['Row']
type Participant = Tables['participants']['Row']
type Transaction = Tables['transactions']['Row']
type PlatformConfig = Tables['platform_config']['Row']
type MneeBalance = Tables['mnee_balances']['Row']

export class DatabaseService {
  // Expose supabase client for advanced operations
  static get supabase() {
    return supabase
  }

  // User operations
  static async createUser(userData: Tables['users']['Insert']): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('wallet_address', walletAddress)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 is "not found"
    return data
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updateUser(userId: string, updates: Tables['users']['Update']): Promise<User> {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
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
    let query = supabase.from('markets').select()

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
    const { data, error } = await supabase
      .from('markets')
      .select()
      .eq('id', marketId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async updateMarket(marketId: string, updates: Tables['markets']['Update']): Promise<Market> {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('participants')
      .insert(participantData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getMarketParticipants(marketId: string): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('participants')
      .select()
      .eq('market_id', marketId)
      .order('joined_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getUserParticipation(userId: string): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('participants')
      .select(`
        *,
        markets (*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getUserMarketParticipation(userId: string, marketId: string): Promise<Participant | null> {
    const { data, error } = await supabase
      .from('participants')
      .select()
      .eq('user_id', userId)
      .eq('market_id', marketId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  /**
   * Get all predictions for a user in a specific market
   * Supports multiple predictions per user (up to 3, one per outcome)
   */
  static async getUserMarketPredictions(userId: string, marketId: string): Promise<Participant[]> {
    const { data, error } = await supabase
      .from('participants')
      .select()
      .eq('user_id', userId)
      .eq('market_id', marketId)
      .order('joined_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async updateParticipant(participantId: string, updates: Tables['participants']['Update']): Promise<Participant> {
    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', transactionId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async getMarketTransactions(marketId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .eq('market_id', marketId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getTransactionsByStatus(status: Transaction['status'], limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  static async getTransactionById(transactionId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .eq('id', transactionId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Platform configuration operations
  static async getPlatformConfig(key: string): Promise<PlatformConfig | null> {
    const { data, error } = await supabase
      .from('platform_config')
      .select()
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async setPlatformConfig(key: string, value: any): Promise<PlatformConfig> {
    const { data, error } = await supabase
      .from('platform_config')
      .upsert({ key, value })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getAllPlatformConfig(): Promise<PlatformConfig[]> {
    const { data, error } = await supabase
      .from('platform_config')
      .select()
      .order('key')

    if (error) throw error
    return data || []
  }

  // MNEE Balance operations
  static async updateMneeBalanceCache(
    userId: string,
    address: string,
    balanceAtomic: number
  ): Promise<MneeBalance> {
    const balanceDecimal = atomicToMnee(balanceAtomic)
    
    const { data, error } = await supabase
      .from('mnee_balances')
      .upsert({
        user_id: userId,
        address,
        balance_atomic: balanceAtomic,
        balance_decimal: balanceDecimal,
        last_updated: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getMneeBalanceCache(userId: string, address: string): Promise<MneeBalance | null> {
    const { data, error } = await supabase
      .from('mnee_balances')
      .select()
      .eq('user_id', userId)
      .eq('address', address)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async getUserMneeBalances(userId: string): Promise<MneeBalance[]> {
    const { data, error } = await supabase
      .from('mnee_balances')
      .select()
      .eq('user_id', userId)
      .order('last_updated', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async deleteMneeBalanceCache(userId: string, address: string): Promise<void> {
    const { error } = await supabase
      .from('mnee_balances')
      .delete()
      .eq('user_id', userId)
      .eq('address', address)

    if (error) throw error
  }

  // Enhanced transaction operations with MNEE support
  static async createTransactionWithMnee(transactionData: Tables['transactions']['Insert'] & {
    mneeTransactionId?: string
    ticketId?: string
  }): Promise<Transaction> {
    // Set default status and metadata if not provided
    const enhancedTransactionData = {
      status: 'PENDING' as const,
      metadata: null,
      ...transactionData,
      mnee_transaction_id: transactionData.mneeTransactionId || null,
      ticket_id: transactionData.ticketId || null,
      created_at: transactionData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert(enhancedTransactionData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getTransactionByMneeId(mneeTransactionId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .eq('mnee_transaction_id', mneeTransactionId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  static async getTransactionByTicketId(ticketId: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select()
      .eq('ticket_id', ticketId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  // Enhanced query methods that return both atomic and decimal amounts
  static async getMarketWithAmounts(marketId: string): Promise<(Market & {
    entry_fee_mnee: number
    total_pool_mnee: number
  }) | null> {
    const market = await this.getMarketById(marketId)
    if (!market) return null

    return {
      ...market,
      entry_fee_mnee: atomicToMnee(market.entry_fee),
      total_pool_mnee: atomicToMnee(market.total_pool)
    }
  }

  static async getParticipantWithAmounts(participantId: string): Promise<(Participant & {
    entry_amount_mnee: number
    potential_winnings_mnee: number
    actual_winnings_mnee: number | null
  }) | null> {
    const { data, error } = await supabase
      .from('participants')
      .select()
      .eq('id', participantId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    return {
      ...data,
      entry_amount_mnee: atomicToMnee(data.entry_amount),
      potential_winnings_mnee: atomicToMnee(data.potential_winnings),
      actual_winnings_mnee: data.actual_winnings ? atomicToMnee(data.actual_winnings) : null
    }
  }

  static async getTransactionWithAmounts(transactionId: string): Promise<(Transaction & {
    amount_mnee: number
  }) | null> {
    const transaction = await this.getTransactionById(transactionId)
    if (!transaction) return null

    return {
      ...transaction,
      amount_mnee: atomicToMnee(transaction.amount)
    }
  }

  // Market resolution
  // Note: Manual resolution is deprecated in favor of automated resolution
  static async resolveMarket(marketId: string, winningOutcome: string): Promise<void> {
    throw new Error('Manual market resolution has been disabled. Markets are now resolved automatically.')
  }

  // Real-time subscriptions
  static subscribeToMarkets(callback: (payload: any) => void) {
    return supabase
      .channel('markets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'markets' },
        callback
      )
      .subscribe()
  }

  static subscribeToMarketParticipants(marketId: string, callback: (payload: any) => void) {
    return supabase
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
    return supabase
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

  /**
   * Subscribe to automated operations for real-time notifications
   * Listens for automated resolution and distribution events
   */
  static subscribeToAutomatedOperations(callback: (payload: any) => void) {
    return supabase
      .channel('automated-operations')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'markets',
          filter: 'status=eq.FINISHED'
        },
        callback
      )
      .subscribe()
  }

  /**
   * Subscribe to user's multiple predictions across all markets
   * Enhanced for multiple predictions per user support
   */
  static subscribeToUserPredictions(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user-${userId}-predictions`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'participants',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }

  /**
   * Subscribe to user's MNEE balance changes
   */
  static subscribeToUserMneeBalances(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user-${userId}-mnee-balances`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'mnee_balances',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  }
}