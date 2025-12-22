/**
 * User Service for Supabase Integration
 *
 * Handles user authentication, profile management, and session persistence
 * with Crossmint authentication and Supabase database storage.
 * Updated to handle MNEE balance caching and atomic units.
 */

import { DatabaseService } from './database-service'
import { atomicToMnee } from './mnee-utils'
import type { Database } from '@/types/supabase'

type User = Database['public']['Tables']['users']['Row']
type UserInsert = Database['public']['Tables']['users']['Insert']
type UserUpdate = Database['public']['Tables']['users']['Update']

/**
 * Crossmint user data structure
 */
export interface CrossmintUser {
  id: string
  email?: string
  walletAddress?: string
  displayName?: string
}

/**
 * Authentication result
 */
export interface AuthResult {
  user: User
  isNewUser: boolean
}

/**
 * User Service class
 *
 * Provides methods for managing user authentication and profiles
 * with Crossmint and Supabase integration.
 */
export class UserService {
  /**
   * Create or update user profile after Crossmint authentication
   *
   * This method is called after successful Crossmint authentication to
   * ensure the user exists in the Supabase database with current information.
   *
   * @param crossmintUser - User data from Crossmint authentication
   * @returns Authentication result with user data and new user flag
   */
  static async authenticateUser(crossmintUser: CrossmintUser): Promise<AuthResult> {
    if (!crossmintUser.email) {
      throw new Error('Email is required for user authentication')
    }

    if (!crossmintUser.walletAddress) {
      throw new Error('EVM wallet address is required for user authentication')
    }

    // Check if user already exists by email
    let existingUser = await DatabaseService.getUserByEmail(crossmintUser.email)

    if (existingUser) {
      // Update existing user with latest information
      const updates: UserUpdate = {
        wallet_address: crossmintUser.walletAddress,
        display_name: crossmintUser.displayName || existingUser.display_name,
        updated_at: new Date().toISOString(),
      }

      const updatedUser = await DatabaseService.updateUser(existingUser.id, updates)

      return {
        user: updatedUser,
        isNewUser: false,
      }
    }

    // Check if user exists by wallet address (in case email changed)
    existingUser = await DatabaseService.getUserByWalletAddress(crossmintUser.walletAddress)

    if (existingUser) {
      // Update existing user with new email
      const updates: UserUpdate = {
        email: crossmintUser.email,
        display_name: crossmintUser.displayName || existingUser.display_name,
        updated_at: new Date().toISOString(),
      }

      const updatedUser = await DatabaseService.updateUser(existingUser.id, updates)

      return {
        user: updatedUser,
        isNewUser: false,
      }
    }

    // Create new user
    const newUserData: UserInsert = {
      wallet_address: crossmintUser.walletAddress,
      email: crossmintUser.email,
      display_name: crossmintUser.displayName || null,
    }

    const newUser = await DatabaseService.createUser(newUserData)

    return {
      user: newUser,
      isNewUser: true,
    }
  }

  /**
   * Update user profile information
   *
   * @param userId - User ID to update
   * @param updates - Profile updates to apply
   * @returns Updated user data
   */
  static async updateProfile(userId: string, updates: {
    displayName?: string
    email?: string
  }): Promise<User> {
    const userUpdates: UserUpdate = {
      updated_at: new Date().toISOString(),
    }

    if (updates.displayName !== undefined) {
      userUpdates.display_name = updates.displayName
    }

    if (updates.email !== undefined) {
      userUpdates.email = updates.email
    }

    return await DatabaseService.updateUser(userId, userUpdates)
  }

  /**
   * Get user by ID
   *
   * @param userId - User ID to retrieve
   * @returns User data or null if not found
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await DatabaseService.supabase
        .from('users')
        .select()
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data
    } catch (error) {
      console.error('[UserService] Error getting user by ID:', error)
      return null
    }
  }

  /**
   * Get user by email
   *
   * @param email - Email address to search for
   * @returns User data or null if not found
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    return await DatabaseService.getUserByEmail(email)
  }

  /**
   * Get user by wallet address
   *
   * @param walletAddress - EVM wallet address to search for
   * @returns User data or null if not found
   */
  static async getUserByWalletAddress(walletAddress: string): Promise<User | null> {
    return await DatabaseService.getUserByWalletAddress(walletAddress)
  }

  /**
   * Validate EVM wallet address format
   *
   * @param address - Wallet address to validate
   * @returns True if address is valid EVM format
   */
  static isValidEvmAddress(address: string): boolean {
    // EVM addresses are 42 characters long and start with 0x
    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/
    return evmAddressRegex.test(address)
  }

  /**
   * Get user portfolio summary
   *
   * @param userId - User ID to get portfolio for
   * @returns Portfolio summary with participation and transaction data (amounts in MNEE tokens)
   */
  static async getUserPortfolio(userId: string): Promise<{
    totalMarkets: number
    activeMarkets: number
    totalWinnings: number // in MNEE tokens
    totalSpent: number // in MNEE tokens
    winRate: number
    totalWinningsAtomic: number // in atomic units
    totalSpentAtomic: number // in atomic units
  }> {
    // Get user participation data
    const participation = await DatabaseService.getUserParticipation(userId)
    
    // Get user transaction data
    const transactions = await DatabaseService.getUserTransactions(userId)

    const totalMarkets = participation.length
    const activeMarkets = participation.filter(p => 
      (p as any).markets?.status === 'active'
    ).length

    const totalWinningsAtomic = transactions
      .filter(t => t.type === 'winnings')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalSpentAtomic = transactions
      .filter(t => t.type === 'market_entry')
      .reduce((sum, t) => sum + t.amount, 0)

    const resolvedMarkets = participation.filter(p => 
      (p as any).markets?.status === 'resolved'
    )
    const wonMarkets = resolvedMarkets.filter(p => p.actual_winnings && p.actual_winnings > 0)
    const winRate = resolvedMarkets.length > 0 ? wonMarkets.length / resolvedMarkets.length : 0

    return {
      totalMarkets,
      activeMarkets,
      totalWinnings: atomicToMnee(totalWinningsAtomic),
      totalSpent: atomicToMnee(totalSpentAtomic),
      winRate,
      totalWinningsAtomic,
      totalSpentAtomic,
    }
  }

  /**
   * Update user's MNEE balance cache
   *
   * @param userId - User ID
   * @param address - EVM wallet address
   * @param balanceAtomic - Balance in atomic units
   */
  static async updateMneeBalance(userId: string, address: string, balanceAtomic: number): Promise<void> {
    await DatabaseService.updateMneeBalanceCache(userId, address, balanceAtomic)
  }

  /**
   * Get user's cached MNEE balance
   *
   * @param userId - User ID
   * @param address - EVM wallet address
   * @returns Cached balance or null if not found
   */
  static async getMneeBalance(userId: string, address: string) {
    return await DatabaseService.getMneeBalanceCache(userId, address)
  }

  /**
   * Get all cached MNEE balances for a user
   *
   * @param userId - User ID
   * @returns Array of cached balances
   */
  static async getAllMneeBalances(userId: string) {
    return await DatabaseService.getUserMneeBalances(userId)
  }

  /**
   * Delete user account and all associated data
   *
   * @param userId - User ID to delete
   */
  static async deleteUser(userId: string): Promise<void> {
    // Note: This should cascade delete all related data due to foreign key constraints
    const { error } = await DatabaseService.supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) throw error
  }
}