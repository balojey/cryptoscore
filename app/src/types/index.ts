/**
 * Unified Type Definitions for CryptoScore Web2 Migration
 * 
 * This file consolidates all type definitions for the Supabase-based architecture,
 * replacing the previous Solana-based types.
 */

// Re-export Supabase database types
export type {
  Database,
  User,
  Market as SupabaseMarket,
  Participant as SupabaseParticipant,
  Transaction,
  PlatformConfig,
  CreateUser,
  CreateMarket,
  CreateParticipant,
  CreateTransaction,
  UpdateUser,
  UpdateMarket,
  UpdateParticipant,
} from './supabase'

// Football API types (unchanged)
export interface Match {
  id: number
  utcDate: string
  status: string
  matchday: number
  stage: string
  group: string | null
  lastUpdated: string
  area: {
    id: number
    name: string
    code: string
    flag: string
  }
  competition: {
    id: number
    name: string
    code: string
    type: string
    emblem: string
  }
  season: {
    id: number
    startDate: string
    endDate: string
    currentMatchday: number
    winner: string | null
  }
  homeTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  awayTeam: {
    id: number
    name: string
    shortName: string
    tla: string
    crest: string
  }
  score: {
    winner: string | null
    duration: string
    fullTime: {
      home: number | null
      away: number | null
    }
    halfTime: {
      home: number | null
      away: number | null
    }
  }
  odds: {
    msg: string
  }
  referees: any[]
}

// Enhanced match data with analysis
export interface EnhancedMatchData extends Match {
  matchResult?: 'Home' | 'Draw' | 'Away'
  isFinished: boolean
  hasValidScore: boolean
}

// Application-specific types
export interface User {
  id: string
  wallet_address: string // EVM wallet address
  email: string
  display_name?: string | null
  created_at: string
  updated_at: string
}

export interface Market {
  id: string
  creator_id: string
  title: string
  description: string
  entry_fee: number
  end_time: string
  status: 'active' | 'resolved' | 'cancelled'
  resolution_outcome?: 'Home' | 'Draw' | 'Away' | null
  total_pool: number
  platform_fee_percentage: number
  created_at: string
  updated_at: string
  // Computed fields
  participantCount?: number
  homeCount?: number
  drawCount?: number
  awayCount?: number
  participants?: Participant[]
}

export interface Participant {
  id: string
  market_id: string
  user_id: string
  prediction: 'Home' | 'Draw' | 'Away'
  entry_amount: number
  potential_winnings: number
  actual_winnings?: number | null
  joined_at: string
}

export interface Transaction {
  id: string
  user_id: string
  market_id?: string | null
  type: 'market_entry' | 'winnings' | 'platform_fee' | 'creator_reward'
  amount: number
  description: string
  created_at: string
}

// Dashboard and analytics types
export interface MarketDashboardInfo extends Market {
  matchId: string // Match ID from football API
  participantsCount: number
  homeCount: number
  awayCount: number
  drawCount: number
}

export interface UserStats {
  user_id: string
  totalMarkets: number
  totalWins: number
  totalEarnings: number
  currentStreak: number
  winRate: number
  averageWinnings: number
  totalSpent: number
  netProfit: number
}

export interface DashboardData {
  totalMarkets: number
  activeMarkets: number
  resolvedMarkets: number
  totalUsers: number
  totalVolume: number
  platformFees: number
  recentMarkets: Market[]
  topUsers: UserStats[]
}

// Component prop types
export interface MarketCardProps {
  market: Market
  variant?: 'default' | 'compact'
  showActions?: boolean
}

export interface MarketProps {
  match: Match
  userHasMarket: boolean
  marketId?: string
  refetchMarkets: () => void
}

export interface ParticipantCardProps {
  participant: Participant
  market: Market
  showWinnings?: boolean
}

// Form and input types
export interface CreateMarketFormData {
  title: string
  description: string
  matchId: string
  entry_fee: number
  end_time: string
}

export interface JoinMarketFormData {
  prediction: 'Home' | 'Draw' | 'Away'
  entry_amount: number
}

export interface ResolveMarketFormData {
  outcome: 'Home' | 'Draw' | 'Away'
}

// API response types
export interface ApiResponse<T> {
  data: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter and query types
export interface MarketFilters {
  status?: Market['status']
  creator_id?: string
  search?: string
  matchId?: string
  startDate?: string
  endDate?: string
}

export interface ParticipantFilters {
  market_id?: string
  user_id?: string
  prediction?: 'Home' | 'Draw' | 'Away'
  hasWinnings?: boolean
}

export interface TransactionFilters {
  user_id?: string
  market_id?: string
  type?: Transaction['type']
  startDate?: string
  endDate?: string
}

// Real-time subscription types
export interface RealtimeMarketUpdate {
  type: 'market_created' | 'market_updated' | 'market_resolved' | 'participant_joined'
  market: Market
  participant?: Participant
  timestamp: string
}

export interface RealtimeNotification {
  id: string
  user_id: string
  type: 'market_resolved' | 'winnings_available' | 'market_ending_soon'
  title: string
  message: string
  data?: any
  read: boolean
  created_at: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

export interface ValidationError {
  field: string
  message: string
}

// Currency and formatting types
export interface CurrencyConfig {
  symbol: string
  decimals: number
  format: (amount: number) => string
}

// Theme and UI types
export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeConfig {
  mode: ThemeMode
  primaryColor: string
  accentColor: string
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  wallet_address: string
  display_name?: string
  isAuthenticated: boolean
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

// Crossmint integration types
export interface CrossmintUser {
  id: string
  email: string
  wallets: {
    ethereum?: string
    polygon?: string
  }
}

export interface CrossmintConfig {
  clientApiKey: string
  environment: 'staging' | 'production'
  chain: 'ethereum' | 'polygon'
}