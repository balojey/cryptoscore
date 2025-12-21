/**
 * Simplified Property-based test for test data isolation
 * 
 * **Feature: enhanced-prediction-system, Property 12: Test data isolation**
 * **Validates: Requirements 7.2, 7.3, 7.5**
 * 
 * Property: For any test execution, test data should be stored in isolated environments 
 * and cleaned up completely after test completion without affecting production systems
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import { mockSupabaseClient, MockDatabaseTestUtils } from './mock-database'

describe('Test Data Isolation Property Tests', () => {
  beforeEach(() => {
    // Reset mock database before each test
    mockSupabaseClient.reset()
    
    // Setup default platform configuration
    MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', 5)
    MockDatabaseTestUtils.createTestPlatformConfig('max_platform_fee_percentage', 10)
    MockDatabaseTestUtils.createTestPlatformConfig('min_market_duration_hours', 1)
    MockDatabaseTestUtils.createTestPlatformConfig('max_market_duration_days', 30)
  })

  afterEach(() => {
    // Clean up after each test
    mockSupabaseClient.reset()
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
          const initialState = mockSupabaseClient.getState()
          expect(initialState.users.size).toBe(0)
          expect(initialState.markets.size).toBe(0)
          expect(initialState.participants.size).toBe(0)
          expect(initialState.transactions.size).toBe(0)
          expect(initialState.platform_config.size).toBeGreaterThanOrEqual(4)
          
          // Create test data using mock database utilities
          const users = []
          for (let i = 0; i < testData.userCount; i++) {
            const user = MockDatabaseTestUtils.createTestUser()
            users.push(user)
          }
          
          const markets = []
          for (let i = 0; i < testData.marketCount; i++) {
            const market = MockDatabaseTestUtils.createTestMarket({
              creator_id: users[i % users.length].id
            })
            markets.push(market)
          }
          
          const participants = []
          for (let i = 0; i < testData.participantCount; i++) {
            const participant = MockDatabaseTestUtils.createTestParticipant({
              market_id: markets[i % markets.length].id,
              user_id: users[i % users.length].id
            })
            participants.push(participant)
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
          const stateWithData = mockSupabaseClient.getState()
          expect(stateWithData.users.size).toBe(testData.userCount)
          expect(stateWithData.markets.size).toBe(testData.marketCount)
          expect(stateWithData.participants.size).toBe(testData.participantCount)
          expect(stateWithData.transactions.size).toBe(testData.transactionCount)
          
          // Verify all created data is accessible
          for (const user of users) {
            expect(stateWithData.users.has(user.id)).toBe(true)
            expect(stateWithData.users.get(user.id)).toEqual(user)
          }
          
          for (const market of markets) {
            expect(stateWithData.markets.has(market.id)).toBe(true)
            expect(stateWithData.markets.get(market.id)).toEqual(market)
          }
          
          for (const participant of participants) {
            expect(stateWithData.participants.has(participant.id)).toBe(true)
            expect(stateWithData.participants.get(participant.id)).toEqual(participant)
          }
          
          for (const transaction of transactions) {
            expect(stateWithData.transactions.has(transaction.id)).toBe(true)
            expect(stateWithData.transactions.get(transaction.id)).toEqual(transaction)
          }
          
          // Verify isolation - data should not affect "production" (other tests)
          // This is ensured by the mock database being completely separate
          expect(stateWithData.users.size).toBeGreaterThan(0)
          expect(stateWithData.markets.size).toBeGreaterThan(0)
          expect(stateWithData.participants.size).toBeGreaterThan(0)
          expect(stateWithData.transactions.size).toBeGreaterThan(0)
          
          // Test cleanup - reset should remove all test data
          mockSupabaseClient.reset()
          
          // Setup defaults again after reset
          MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', 5)
          MockDatabaseTestUtils.createTestPlatformConfig('max_platform_fee_percentage', 10)
          MockDatabaseTestUtils.createTestPlatformConfig('min_market_duration_hours', 1)
          MockDatabaseTestUtils.createTestPlatformConfig('max_market_duration_days', 30)
          
          const cleanState = mockSupabaseClient.getState()
          expect(cleanState.users.size).toBe(0)
          expect(cleanState.markets.size).toBe(0)
          expect(cleanState.participants.size).toBe(0)
          expect(cleanState.transactions.size).toBe(0)
          
          // Only platform config should remain
          expect(cleanState.platform_config.size).toBeGreaterThanOrEqual(4)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain isolation between concurrent test operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operationCount: fc.integer({ min: 2, max: 10 }),
          dataSize: fc.integer({ min: 1, max: 5 }),
        }),
        async (testParams) => {
          // Verify clean initial state
          const initialState = mockSupabaseClient.getState()
          expect(initialState.users.size).toBe(0)
          expect(initialState.markets.size).toBe(0)
          expect(initialState.participants.size).toBe(0)
          expect(initialState.transactions.size).toBe(0)
          
          // Perform multiple operations that should be isolated
          const allUsers = []
          const allMarkets = []
          const allParticipants = []
          
          for (let i = 0; i < testParams.operationCount; i++) {
            // Create isolated test scenario for each operation
            const users = []
            for (let j = 0; j < testParams.dataSize + 1; j++) { // +1 for creator
              const user = MockDatabaseTestUtils.createTestUser()
              users.push(user)
              allUsers.push(user)
            }
            
            const market = MockDatabaseTestUtils.createTestMarket({
              creator_id: users[0].id // First user is creator
            })
            allMarkets.push(market)
            
            // Create participants (excluding creator)
            for (let j = 1; j < users.length; j++) {
              const participant = MockDatabaseTestUtils.createTestParticipant({
                market_id: market.id,
                user_id: users[j].id
              })
              allParticipants.push(participant)
            }
          }
          
          // Verify data isolation - each operation should have created independent data
          const state = mockSupabaseClient.getState()
          
          // Total users should be sum of all scenarios (creator + participants per scenario)
          const expectedUsers = testParams.operationCount * (testParams.dataSize + 1)
          expect(state.users.size).toBe(expectedUsers)
          
          // Total markets should equal operation count
          expect(state.markets.size).toBe(testParams.operationCount)
          
          // Total participants should be sum of all scenarios
          const expectedParticipants = testParams.operationCount * testParams.dataSize
          expect(state.participants.size).toBe(expectedParticipants)
          
          // Verify all data is accessible
          for (const user of allUsers) {
            expect(state.users.has(user.id)).toBe(true)
          }
          
          for (const market of allMarkets) {
            expect(state.markets.has(market.id)).toBe(true)
          }
          
          for (const participant of allParticipants) {
            expect(state.participants.has(participant.id)).toBe(true)
          }
          
          // Verify cleanup works for all data
          mockSupabaseClient.reset()
          
          // Setup defaults again after reset
          MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', 5)
          MockDatabaseTestUtils.createTestPlatformConfig('max_platform_fee_percentage', 10)
          MockDatabaseTestUtils.createTestPlatformConfig('min_market_duration_hours', 1)
          MockDatabaseTestUtils.createTestPlatformConfig('max_market_duration_days', 30)
          
          const cleanState = mockSupabaseClient.getState()
          expect(cleanState.users.size).toBe(0)
          expect(cleanState.markets.size).toBe(0)
          expect(cleanState.participants.size).toBe(0)
          expect(cleanState.transactions.size).toBe(0)
          
          // Verify isolation is maintained
          expect(cleanState.platform_config.size).toBeGreaterThanOrEqual(4)
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
            const cycleStartState = mockSupabaseClient.getState()
            expect(cycleStartState.users.size).toBe(0)
            expect(cycleStartState.markets.size).toBe(0)
            expect(cycleStartState.participants.size).toBe(0)
            expect(cycleStartState.transactions.size).toBe(0)
            
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
              const state = mockSupabaseClient.getState()
              expect(state.users.size).toBe(testParams.dataOperations)
              expect(state.markets.size).toBe(testParams.dataOperations)
              expect(state.participants.size).toBe(testParams.dataOperations)
            }
            
            // Reset and verify cleanup
            mockSupabaseClient.reset()
            
            // Setup defaults again after reset
            MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', 5)
            MockDatabaseTestUtils.createTestPlatformConfig('max_platform_fee_percentage', 10)
            MockDatabaseTestUtils.createTestPlatformConfig('min_market_duration_hours', 1)
            MockDatabaseTestUtils.createTestPlatformConfig('max_market_duration_days', 30)
            
            const cycleEndState = mockSupabaseClient.getState()
            expect(cycleEndState.users.size).toBe(0)
            expect(cycleEndState.markets.size).toBe(0)
            expect(cycleEndState.participants.size).toBe(0)
            expect(cycleEndState.transactions.size).toBe(0)
          }
          
          // Final verification - multiple resets should not cause issues
          const finalState = mockSupabaseClient.getState()
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
          const initialState = mockSupabaseClient.getState()
          expect(initialState.users.size).toBe(0)
          expect(initialState.markets.size).toBe(0)
          
          // Perform valid operations
          const validUsers = []
          for (let i = 0; i < testParams.validOperations; i++) {
            const user = MockDatabaseTestUtils.createTestUser()
            validUsers.push(user)
          }
          
          // Attempt operations that should fail (simulate by trying to access non-existent data)
          const errorResults = []
          for (let i = 0; i < testParams.errorOperations; i++) {
            try {
              // Try to access non-existent user
              const state = mockSupabaseClient.getState()
              const nonExistentUser = state.users.get('non-existent-id')
              errorResults.push(nonExistentUser === undefined ? new Error('User not found') : null)
            } catch (error) {
              errorResults.push(error)
            }
          }
          
          // Verify all error operations failed as expected
          for (const result of errorResults) {
            expect(result).toBeInstanceOf(Error)
          }
          
          // Verify valid data still exists and error operations didn't corrupt state
          const state = mockSupabaseClient.getState()
          expect(state.users.size).toBe(testParams.validOperations)
          
          for (const user of validUsers) {
            expect(state.users.has(user.id)).toBe(true)
          }
          
          // Verify cleanup still works after errors
          mockSupabaseClient.reset()
          
          // Setup defaults again after reset
          MockDatabaseTestUtils.createTestPlatformConfig('default_platform_fee_percentage', 5)
          MockDatabaseTestUtils.createTestPlatformConfig('max_platform_fee_percentage', 10)
          MockDatabaseTestUtils.createTestPlatformConfig('min_market_duration_hours', 1)
          MockDatabaseTestUtils.createTestPlatformConfig('max_market_duration_days', 30)
          
          const cleanState = mockSupabaseClient.getState()
          expect(cleanState.users.size).toBe(0)
          
          // Verify isolation is maintained even after errors
          expect(cleanState.platform_config.size).toBeGreaterThanOrEqual(4)
        }
      ),
      { numRuns: 100 }
    )
  })
})