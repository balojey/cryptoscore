/**
 * Property-based tests for User Service
 * 
 * Tests authentication data persistence and user profile management
 * using property-based testing with fast-check and mock database.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { UserService, type CrossmintUser } from '../user-service'
import { MockTestSetup, MockDatabaseTestUtils } from './test-utils'

describe('UserService Property Tests', () => {
  beforeEach(async () => {
    await MockTestSetup.setupWithDefaults()
  })

  afterEach(() => {
    MockDatabaseTestUtils.reset()
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

          // Test authentication for new user
          const result = await UserService.authenticateUser(crossmintUser)

          // Verify user data persistence
          expect(result.user).toBeDefined()
          expect(result.user.wallet_address).toBe(crossmintUser.walletAddress)
          expect(result.user.email).toBe(crossmintUser.email)
          expect(result.isNewUser).toBe(true)

          // Verify user exists in database
          const storedUser = await UserService.getUserByEmail(crossmintUser.email!)
          expect(storedUser).toEqual(result.user)

          // Verify user can be found by wallet address
          const userByWallet = await UserService.getUserByWalletAddress(crossmintUser.walletAddress!)
          expect(userByWallet).toEqual(result.user)
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
          email: fc.emailAddress().map(email => `${Date.now()}-${Math.random()}-${email}`), // Ensure unique emails
          walletAddress: fc.string({ minLength: 40, maxLength: 40 }).map(s => '0x' + s.replace(/[^a-fA-F0-9]/g, '0').padStart(40, '0')),
          displayName: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)),
        }),
        async (crossmintUser: CrossmintUser) => {
          // Manually reset database for this iteration to ensure isolation
          MockDatabaseTestUtils.reset()
          await MockTestSetup.setupWithDefaults()
          
          // Create existing user first with the SAME email as crossmintUser
          const existingUser = MockDatabaseTestUtils.createTestUser({
            email: crossmintUser.email!,
            wallet_address: crossmintUser.walletAddress!,
            display_name: 'Old Name',
          })

          // Ensure the user was created with the correct email
          expect(existingUser.email).toBe(crossmintUser.email)

          // Test authentication for existing user
          const result = await UserService.authenticateUser(crossmintUser)

          // Verify user data was updated
          expect(result.user).toBeDefined()
          expect(result.user.wallet_address).toBe(crossmintUser.walletAddress)
          expect(result.user.email).toBe(crossmintUser.email)
          expect(result.isNewUser).toBe(false)
          expect(result.user.id).toBe(existingUser.id) // Same user ID

          // Verify display name was updated if provided
          if (crossmintUser.displayName) {
            expect(result.user.display_name).toBe(crossmintUser.displayName)
          }

          // Verify updated timestamp is newer or equal (updates can be very fast)
          expect(new Date(result.user.updated_at).getTime()).toBeGreaterThanOrEqual(
            new Date(existingUser.updated_at).getTime()
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

  it('should handle user profile updates correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          displayName: fc.option(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0)),
          email: fc.option(fc.emailAddress()),
        }),
        async (updates) => {
          // Create test user
          const user = MockDatabaseTestUtils.createTestUser()

          // Test profile update
          const result = await UserService.updateProfile(user.id, updates)

          // Verify updates were applied
          expect(result.id).toBe(user.id)
          if (updates.displayName !== undefined) {
            expect(result.display_name).toBe(updates.displayName)
          }
          if (updates.email !== undefined) {
            expect(result.email).toBe(updates.email)
          }

          // Verify updated timestamp is newer (allow for same timestamp if update was very fast)
          expect(new Date(result.updated_at).getTime()).toBeGreaterThanOrEqual(
            new Date(user.updated_at).getTime()
          )

          // Verify user can still be found
          const updatedUser = await UserService.getUserById(user.id)
          expect(updatedUser).toEqual(result)
        }
      ),
      { numRuns: 100 }
    )
  })
})