/**
 * Property-based tests for User Service
 * 
 * Tests authentication data persistence and user profile management
 * using property-based testing with fast-check.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'

// Mock DatabaseService before importing
vi.mock('../database-service', () => ({
  DatabaseService: {
    supabase: {
      from: () => ({
        insert: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }),
        select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: () => ({ select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
        delete: () => ({ eq: () => ({ error: null }) }),
      }),
    },
    createUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserByWalletAddress: vi.fn(),
    updateUser: vi.fn(),
  },
}))

import { UserService, type CrossmintUser } from '../user-service'
import { DatabaseService } from '../database-service'

describe('UserService Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * **Feature: web2-migration, Property 4: Authentication Data Persistence**
   * **Validates: Requirements 2.5**
   * 
   * Property: For any successful user login, the system should create or update 
   * a user profile record in Supabase containing the EVM wallet address
   */
  it('should persist authentication data for any valid Crossmint user', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for valid Crossmint user data
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          walletAddress: fc.string({ minLength: 40, maxLength: 40 }).map(s => '0x' + s.replace(/[^a-fA-F0-9]/g, '0').padStart(40, '0')),
          displayName: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)),
        }),
        async (crossmintUser: CrossmintUser) => {
          // Ensure wallet address is valid EVM format
          const validWalletAddress = UserService.isValidEvmAddress(crossmintUser.walletAddress!)
          expect(validWalletAddress).toBe(true)

          // Mock database responses for new user creation
          const mockUser = {
            id: 'user-123',
            wallet_address: crossmintUser.walletAddress!,
            email: crossmintUser.email!,
            display_name: crossmintUser.displayName || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Mock getUserByEmail to return null (new user)
          vi.mocked(DatabaseService.getUserByEmail).mockResolvedValue(null)
          // Mock getUserByWalletAddress to return null (new user)
          vi.mocked(DatabaseService.getUserByWalletAddress).mockResolvedValue(null)
          // Mock createUser to return the new user
          vi.mocked(DatabaseService.createUser).mockResolvedValue(mockUser)

          // Test authentication
          const result = await UserService.authenticateUser(crossmintUser)

          // Verify user data persistence
          expect(result.user).toBeDefined()
          expect(result.user.wallet_address).toBe(crossmintUser.walletAddress)
          expect(result.user.email).toBe(crossmintUser.email)
          expect(result.isNewUser).toBe(true)

          // Verify database operations were called correctly
          expect(DatabaseService.getUserByEmail).toHaveBeenCalledWith(crossmintUser.email)
          expect(DatabaseService.createUser).toHaveBeenCalledWith({
            wallet_address: crossmintUser.walletAddress,
            email: crossmintUser.email,
            display_name: crossmintUser.displayName || null,
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should update existing user data when user already exists', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.emailAddress(),
          walletAddress: fc.string({ minLength: 40, maxLength: 40 }).map(s => '0x' + s.replace(/[^a-fA-F0-9]/g, '0').padStart(40, '0')),
          displayName: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)),
        }),
        async (crossmintUser: CrossmintUser) => {
          // Mock existing user
          const existingUser = {
            id: 'existing-user-123',
            wallet_address: crossmintUser.walletAddress!,
            email: crossmintUser.email!,
            display_name: 'Old Name',
            created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            updated_at: new Date(Date.now() - 86400000).toISOString(),
          }

          const updatedUser = {
            ...existingUser,
            display_name: crossmintUser.displayName || existingUser.display_name,
            updated_at: new Date().toISOString(),
          }

          // Mock getUserByEmail to return existing user
          vi.mocked(DatabaseService.getUserByEmail).mockResolvedValue(existingUser)
          // Mock updateUser to return updated user
          vi.mocked(DatabaseService.updateUser).mockResolvedValue(updatedUser)

          // Test authentication
          const result = await UserService.authenticateUser(crossmintUser)

          // Verify user data was updated
          expect(result.user).toBeDefined()
          expect(result.user.wallet_address).toBe(crossmintUser.walletAddress)
          expect(result.user.email).toBe(crossmintUser.email)
          expect(result.isNewUser).toBe(false)

          // Verify database operations were called correctly
          expect(DatabaseService.getUserByEmail).toHaveBeenCalledWith(crossmintUser.email)
          expect(DatabaseService.updateUser).toHaveBeenCalledWith(
            existingUser.id,
            expect.objectContaining({
              wallet_address: crossmintUser.walletAddress,
              display_name: crossmintUser.displayName || existingUser.display_name,
            })
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate EVM wallet address format correctly', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          // Valid EVM addresses
          fc.string({ minLength: 40, maxLength: 40 }).map(s => '0x' + s.replace(/[^a-fA-F0-9]/g, '0').padStart(40, '0')),
          // Invalid addresses
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 39 }), // Too short
            fc.string({ minLength: 43, maxLength: 100 }), // Too long
            fc.string({ minLength: 42, maxLength: 42 }).filter(s => !s.startsWith('0x')), // Wrong prefix
            fc.constant(''), // Empty string
            fc.constant('0x'), // Just prefix
          )
        ),
        (address: string) => {
          const isValid = UserService.isValidEvmAddress(address)
          const expectedValid = /^0x[a-fA-F0-9]{40}$/.test(address)
          expect(isValid).toBe(expectedValid)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle authentication errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          email: fc.oneof(fc.constant(''), fc.constant(undefined as any)), // Invalid email
          walletAddress: fc.option(fc.string({ minLength: 40, maxLength: 40 }).map(s => '0x' + s.replace(/[^a-fA-F0-9]/g, '0').padStart(40, '0'))),
          displayName: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)),
        }),
        async (invalidUser: CrossmintUser) => {
          // Test should throw error for invalid user data
          await expect(UserService.authenticateUser(invalidUser)).rejects.toThrow()
        }
      ),
      { numRuns: 50 }
    )
  })
})