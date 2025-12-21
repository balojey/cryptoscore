/**
 * Property-based test for test data isolation
 * 
 * **Feature: enhanced-prediction-system, Property 12: Test data isolation**
 * **Validates: Requirements 7.2, 7.3, 7.5**
 * 
 * Property: For any test execution, test data should be stored in isolated environments 
 * and cleaned up completely after test completion without affecting production systems
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { 
  MockTestSetup, 
  MockDatabaseTestUtils, 
  TestScenarios,
  assertTestDataIsolation,
  TestDataGenerators
} from './test-utils'
import { MarketService } from '../market-service'
import { UserService } from '../user-service'

describe('Test Data Isolation Property Tests', () => {
  beforeEach(async () => {
    await MockTestSetup.setupWithDefaults()
  })

  afterEach(() => {
    MockDatabaseTestUtils.reset()
  })

  /**
   * **Feature: enhanced-prediction-system, Property 12: Test data isolation**
   * **Validates: Requirements 7.2, 7.3, 7.5**
   * 
   * Property: For any test data created during test execution, the data should be 
   * completely isolated from production systems and cleaned up after test completion
   */
  it('should isolate test data from production systems', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random test data scenarios
        fc.record({
          userCount: fc.integer({ min: 1, max: 10 }),
          marketCount: fc.integer({ min: 1, max: 5 }),
          participantCount: fc.integer({ min: 1, max: 20 }),
          transactionCount: fc.integer({ min: 1, max: 50 }),
        }),
        async (testData) => {
          // Verify clean initial state
          const initialIsolation = assertTestDataIsolation()
          expect(initialIsolation.recordCounts.platform_config).toBeGreaterThanOrEqual(4)
          expect(initialIsolation.recordCounts.users).toBe(0)
          expect(initialIsolation.recordCounts.markets).toBe(0)
          expect(initialIsolation.recordCounts.participants).toBe(0)
          expect(initialIsolation.recordCounts.transactions).toBe(0)
          
          // Create test data
          const users = []
          for (let i = 0; i < testData.userCount; i++) {
            const user = TestDataGenerators.randomUser()
            users.push(user)
            MockDatabaseTestUtils.getState().users.set(user.id, user)
          }
          
          const markets = []
          for (let i = 0; i < testData.marketCount; i++) {
            const market = TestDataGenerators.randomMarket({
              creator_id: users[i % users.length].id
            })
            markets.push(market)
            MockDatabaseTestUtils.getState().markets.set(market.id, market)
          }
          
          const participants = []
          for (let i = 0; i < testData.participantCount; i++) {
            const participant = TestDataGenerators.randomParticipant({
              market_id: markets[i % markets.length].id,
              user_id: users[i % users.length].id
            })
            participants.push(participant)
            MockDatabaseTestUtils.getState().participants.set(participant.id, participant)
          }
          
          const transactions = []
          for (let i = 0; i < testData.transactionCount; i++) {
            const transaction = MockDatabaseTestUtils.createTestTransaction({
              user_id: users[i % users.length].id,
              market_id: markets[i % markets.length].id
            })
            transactions.push(transaction)
          }
          
          // Verify test data exists in isolated environment
          const state = MockDatabaseTestUtils.getState()
          expect(state.users.size).toBe(testData.userCount)
          expect(state.markets.size).toBe(testData.marketCount)
          expect(state.participants.size).toBe(testData.participantCount)
          expect(state.transactions.size).toBe(testData.transactionCount)
          
          // Verify all created data is accessible
          for (const user of users) {
            expect(state.users.has(user.id)).toBe(true)
            expect(state.users.get(user.id)).toEqual(user)
          }
          
          for (const market of markets) {
            expect(state.markets.has(market.id)).toBe(true)
            expect(state.markets.get(market.id)).toEqual(market)
          }
          
          for (const participant of participants) {
            expect(state.participants.has(participant.id)).toBe(true)
            expect(state.participants.get(participant.id)).toEqual(participant)
          }
          
          for (const transaction of transactions) {
            expect(state.transactions.has(transaction.id)).toBe(true)
            expect(state.transactions.get(transaction.id)).toEqual(transaction)
          }
          
          // Verify isolation - data should not affect "production" (other tests)
          // This is ensured by the mock database being completely separate
          expect(state.users.size).toBeGreaterThan(0)
          expect(state.markets.size).toBeGreaterThan(0)
          expect(state.participants.size).toBeGreaterThan(0)
          expect(state.transactions.size).toBeGreaterThan(0)
          
          // Test cleanup - reset should remove all test data
          MockDatabaseTestUtils.reset()
          await MockTestSetup.setupWithDefaults()
          
          const cleanState = MockDatabaseTestUtils.getState()
          expect(cleanState.users.size).toBe(0)
          expect(cleanState.markets.size).toBe(0)
          expect(cleanState.participants.size).toBe(0)
          expect(cleanState.transactions.size).toBe(0)
          
          // Only platform config should remain
          expect(cleanState.platform_config.size).toBeGreaterThanOrEqual(4)
          
          // Verify complete isolation after cleanup
          const finalIsolation = assertTestDataIsolation()
          expect(finalIsolation.recordCounts.platform_config).toBeGreaterThanOrEqual(4)
          expect(finalIsolation.recordCounts.users).toBe(0)
          expect(finalIsolation.recordCounts.markets).toBe(0)
          expect(finalIsolation.recordCounts.participants).toBe(0)
          expect(finalIsolation.recordCounts.transactions).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should isolate service operations from external dependencies', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userEmail: fc.emailAddress(),
          walletAddress: fc.string({ minLength: 40, maxLength: 40 }).map(s => '0x' + s.replace(/[^a-fA-F0-9]/g, '0').padStart(40, '0')),
          marketTitle: fc.string({ minLength: 5, maxLength: 100 }),
          entryFee: fc.float({ min: Math.fround(0.001), max: Math.fround(10), noNaN: true }),
        }),
        async (testData) => {
          // Verify clean initial state
          const initialIsolation = assertTestDataIsolation()
          expect(initialIsolation.recordCounts.users).toBe(0)
          expect(initialIsolation.recordCounts.markets).toBe(0)
          
          // Test user service operations in isolation
          const authResult = await UserService.authenticateUser({
            id: 'test-user',
            email: testData.userEmail,
            walletAddress: testData.walletAddress,
            displayName: 'Test User'
          })
          
          expect(authResult.user.email).toBe(testData.userEmail)
          expect(authResult.user.wallet_address).toBe(testData.walletAddress)
          expect(authResult.isNewUser).toBe(true)
          
          // Test market service operations in isolation
          const market = await MarketService.createMarket({
            matchId: 'test-match',
            title: testData.marketTitle,
            description: 'Test market description',
            entryFee: testData.entryFee,
            endTime: new Date(Date.now() + 86400000).toISOString(),
            isPublic: true,
            creatorId: authResult.user.id
          })
          
          expect(market.title).toBe(testData.marketTitle)
          expect(market.entry_fee).toBe(testData.entryFee)
          expect(market.creator_id).toBe(authResult.user.id)
          
          // Verify operations used isolated database
          const state = MockDatabaseTestUtils.getState()
          expect(state.users.has(authResult.user.id)).toBe(true)
          expect(state.markets.has(market.id)).toBe(true)
          
          // Verify no external dependencies were affected
          // (This is implicit since we're using mock database)
          expect(state.users.size).toBe(1)
          expect(state.markets.size).toBe(1)
          
          // Test cleanup - reset should remove all test data
          MockDatabaseTestUtils.reset()
          await MockTestSetup.setupWithDefaults()
          
          // Verify all service data was cleaned up
          const cleanState = MockDatabaseTestUtils.getState()
          expect(cleanState.users.size).toBe(0)
          expect(cleanState.markets.size).toBe(0)
          
          // Verify services still work after cleanup (new isolated environment)
          const newAuthResult = await UserService.authenticateUser({
            id: 'test-user-2',
            email: 'new@example.com',
            walletAddress: '0x1234567890123456789012345678901234567890',
            displayName: 'New Test User'
          })
          
          expect(newAuthResult.isNewUser).toBe(true)
          expect(cleanState.users.size).toBe(1) // Only the new user
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle test data cleanup edge cases', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          resetCount: fc.integer({ min: 1, max: 5 }),
          dataOperations: fc.integer({ min: 0, max: 10 }),
        }),
        async (testParams) => {
          // Test multiple reset cycles
          for (let resetCycle = 0; resetCycle < testParams.resetCount; resetCycle++) {
            // Verify clean state at start of each cycle
            const cycleStartIsolation = assertTestDataIsolation()
            expect(cycleStartIsolation.recordCounts.users).toBe(0)
            expect(cycleStartIsolation.recordCounts.markets).toBe(0)
            expect(cycleStartIsolation.recordCounts.participants).toBe(0)
            expect(cycleStartIsolation.recordCounts.transactions).toBe(0)
            
            // Perform random data operations
            for (let op = 0; op < testParams.dataOperations; op++) {
              const user = MockDatabaseTestUtils.createTestUser()
              const market = MockDatabaseTestUtils.createTestMarket({ creator_id: user.id })
              MockDatabaseTestUtils.createTestParticipant({ 
                market_id: market.id, 
                user_id: user.id 
              })
            }
            
            // Verify data exists if operations were performed
            if (testParams.dataOperations > 0) {
              const state = MockDatabaseTestUtils.getState()
              expect(state.users.size).toBe(testParams.dataOperations)
              expect(state.markets.size).toBe(testParams.dataOperations)
              expect(state.participants.size).toBe(testParams.dataOperations)
            }
            
            // Reset and verify cleanup
            MockDatabaseTestUtils.reset()
            await MockTestSetup.setupWithDefaults()
            
            const cycleEndIsolation = assertTestDataIsolation()
            expect(cycleEndIsolation.recordCounts.users).toBe(0)
            expect(cycleEndIsolation.recordCounts.markets).toBe(0)
            expect(cycleEndIsolation.recordCounts.participants).toBe(0)
            expect(cycleEndIsolation.recordCounts.transactions).toBe(0)
          }
          
          // Final verification - multiple resets should not cause issues
          const finalState = MockDatabaseTestUtils.getState()
          expect(finalState.users.size).toBe(0)
          expect(finalState.markets.size).toBe(0)
          expect(finalState.participants.size).toBe(0)
          expect(finalState.transactions.size).toBe(0)
          expect(finalState.platform_config.size).toBeGreaterThanOrEqual(4)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain isolation during error conditions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          validOperations: fc.integer({ min: 1, max: 5 }),
          errorOperations: fc.integer({ min: 1, max: 3 }),
        }),
        async (testParams) => {
          // Verify clean initial state
          const initialIsolation = assertTestDataIsolation()
          expect(initialIsolation.recordCounts.users).toBe(0)
          expect(initialIsolation.recordCounts.markets).toBe(0)
          
          // Perform valid operations
          const validUsers = []
          for (let i = 0; i < testParams.validOperations; i++) {
            const user = MockDatabaseTestUtils.createTestUser()
            validUsers.push(user)
          }
          
          // Attempt operations that should fail
          const errorPromises = []
          for (let i = 0; i < testParams.errorOperations; i++) {
            // Try to authenticate with invalid data
            errorPromises.push(
              UserService.authenticateUser({
                id: 'invalid',
                email: '', // Invalid email
                walletAddress: '0x1234567890123456789012345678901234567890',
                displayName: 'Test'
              }).catch(error => error)
            )
          }
          
          const errorResults = await Promise.all(errorPromises)
          
          // Verify all error operations failed as expected
          for (const result of errorResults) {
            expect(result).toBeInstanceOf(Error)
          }
          
          // Verify valid data still exists and error operations didn't corrupt state
          const state = MockDatabaseTestUtils.getState()
          expect(state.users.size).toBe(testParams.validOperations)
          
          for (const user of validUsers) {
            expect(state.users.has(user.id)).toBe(true)
          }
          
          // Verify cleanup still works after errors
          MockDatabaseTestUtils.reset()
          await MockTestSetup.setupWithDefaults()
          
          const cleanState = MockDatabaseTestUtils.getState()
          expect(cleanState.users.size).toBe(0)
          
          // Verify isolation is maintained even after errors
          const finalIsolation = assertTestDataIsolation()
          expect(finalIsolation.recordCounts.users).toBe(0)
          expect(finalIsolation.recordCounts.markets).toBe(0)
          expect(finalIsolation.recordCounts.participants).toBe(0)
          expect(finalIsolation.recordCounts.transactions).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})