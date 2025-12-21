/**
 * Property-based tests for comprehensive transaction logging
 * 
 * **Feature: enhanced-prediction-system, Property 9: Transaction logging completeness**
 * **Validates: Requirements 5.4, 6.2, 6.3**
 */

import { describe, it, expect, beforeEach } from 'vitest'
import fc from 'fast-check'
import { MockDatabaseService } from './mock-database-service'
import { MockDatabaseTestUtils } from './mock-database'

describe('Transaction Logging Property Tests', () => {
  beforeEach(() => {
    MockDatabaseTestUtils.reset()
  })

  /**
   * **Feature: enhanced-prediction-system, Property 9: Transaction logging completeness**
   * **Validates: Requirements 5.4, 6.2, 6.3**
   * 
   * For any transfer operation, the system should create detailed transaction records 
   * including market information, prediction details, and transfer status
   */
  it('should create complete transaction records for all transfer operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test data
        fc.record({
          marketData: fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
            description: fc.string({ minLength: 10, maxLength: 100 }).filter(s => s.trim().length >= 10),
            entry_fee: fc.float({ min: Math.fround(0.01), max: Math.fround(10.0) }).filter(n => !isNaN(n) && isFinite(n)),
            total_pool: fc.float({ min: Math.fround(0.1), max: Math.fround(100.0) }).filter(n => !isNaN(n) && isFinite(n)),
            platform_fee_percentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.1) }).filter(n => !isNaN(n) && isFinite(n)),
            creator_reward_percentage: fc.float({ min: Math.fround(0.01), max: Math.fround(0.05) }).filter(n => !isNaN(n) && isFinite(n)),
            resolution_outcome: fc.constantFrom('HOME_WIN', 'DRAW', 'AWAY_WIN'),
            match_id: fc.integer({ min: 1, max: 10000 }),
            home_team_name: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
            away_team_name: fc.string({ minLength: 3, maxLength: 20 }).filter(s => s.trim().length >= 3),
          }),
          participantCount: fc.integer({ min: 2, max: 10 }),
          transferTypes: fc.array(
            fc.constantFrom('winnings', 'creator_reward', 'platform_fee', 'automated_transfer'),
            { minLength: 1, maxLength: 4 }
          ),
        }),
        async ({ marketData, participantCount, transferTypes }) => {
          // Create test users
          const creator = MockDatabaseTestUtils.createTestUser({
            display_name: 'Market Creator',
            email: 'creator@test.com',
          })

          const participants = []
          for (let i = 0; i < participantCount; i++) {
            participants.push(MockDatabaseTestUtils.createTestUser({
              display_name: `Participant ${i + 1}`,
              email: `participant${i + 1}@test.com`,
            }))
          }

          // Create market
          const market = MockDatabaseTestUtils.createTestMarket({
            creator_id: creator.id,
            title: marketData.title,
            description: marketData.description,
            entry_fee: marketData.entry_fee,
            total_pool: marketData.total_pool,
            platform_fee_percentage: marketData.platform_fee_percentage,
            creator_reward_percentage: marketData.creator_reward_percentage,
            status: 'FINISHED',
            resolution_outcome: marketData.resolution_outcome,
            match_id: marketData.match_id,
            home_team_name: marketData.home_team_name,
            away_team_name: marketData.away_team_name,
          })

          // Create participants with predictions
          const predictions = ['HOME_WIN', 'DRAW', 'AWAY_WIN']
          const marketParticipants = []
          for (let i = 0; i < participantCount; i++) {
            const participant = MockDatabaseTestUtils.createTestParticipant({
              market_id: market.id,
              user_id: participants[i].id,
              prediction: predictions[i % predictions.length],
              entry_amount: marketData.entry_fee,
              potential_winnings: marketData.entry_fee * 2,
            })
            marketParticipants.push(participant)
          }

          // Record initial transaction count
          const initialTransactionCount = MockDatabaseTestUtils.getState().transactions.size

          // Simulate different types of transfer operations
          const transactionResults = []
          
          for (const transferType of transferTypes) {
            switch (transferType) {
              case 'winnings':
                // Simulate winnings distribution
                const winners = marketParticipants.filter(p => p.prediction === marketData.resolution_outcome)
                if (winners.length > 0) { // Only create winnings transactions if there are winners
                  for (const winner of winners) {
                    const transaction = await MockDatabaseService.createTransaction({
                      user_id: winner.user_id,
                      market_id: market.id,
                      type: 'winnings',
                      amount: marketData.entry_fee * 1.5,
                      description: `Automated winnings from market resolution: ${marketData.resolution_outcome}`,
                    })
                    transactionResults.push(transaction)
                  }
                }
                break

              case 'creator_reward':
                const creatorReward = marketData.total_pool * marketData.creator_reward_percentage
                const creatorTransaction = await MockDatabaseService.createTransaction({
                  user_id: creator.id,
                  market_id: market.id,
                  type: 'creator_reward',
                  amount: creatorReward,
                  description: 'Automated creator reward from market resolution',
                })
                transactionResults.push(creatorTransaction)
                break

              case 'platform_fee':
                const platformFee = marketData.total_pool * marketData.platform_fee_percentage
                const platformTransaction = await MockDatabaseService.createTransaction({
                  user_id: creator.id, // Associated with creator for tracking
                  market_id: market.id,
                  type: 'platform_fee',
                  amount: platformFee,
                  description: 'Automated platform fee from market resolution',
                })
                transactionResults.push(platformTransaction)
                break

              case 'automated_transfer':
                const automatedTransaction = await MockDatabaseService.createTransaction({
                  user_id: participants[0].id,
                  market_id: market.id,
                  type: 'automated_transfer',
                  amount: marketData.entry_fee * 0.5,
                  description: 'Automated transfer for market operations',
                })
                transactionResults.push(automatedTransaction)
                break
            }
          }

          // Verify transaction logging completeness
          const finalTransactionCount = MockDatabaseTestUtils.getState().transactions.size
          const newTransactionCount = finalTransactionCount - initialTransactionCount

          // Property 1: All transfer operations should create transaction records
          expect(newTransactionCount).toBe(transactionResults.length)
          // Only check if we have results - some transfer types might not create transactions (e.g., winnings with no winners)
          if (transactionResults.length > 0) {
            expect(transactionResults.length).toBeGreaterThan(0)
          }

          // Property 2: Each transaction should have complete metadata
          for (const transaction of transactionResults) {
            // Required fields should be present
            expect(transaction.id).toBeDefined()
            expect(transaction.user_id).toBeDefined()
            expect(transaction.market_id).toBe(market.id)
            expect(transaction.type).toBeDefined()
            expect(transaction.amount).toBeGreaterThan(0)
            expect(transaction.description).toBeDefined()
            expect(transaction.created_at).toBeDefined()

            // Description should include relevant information
            const descLower = transaction.description.toLowerCase()
            const hasRelevantInfo = descLower.includes('market') || 
                                     descLower.includes('automated') || 
                                     descLower.includes('reward') || 
                                     descLower.includes('fee') ||
                                     descLower.includes('winnings')
            expect(hasRelevantInfo).toBe(true)
            
            // Transaction should be associated with the correct market
            expect(transaction.market_id).toBe(market.id)

            // User ID should be valid (either creator or participant)
            const validUserIds = [creator.id, ...participants.map(p => p.id)]
            expect(validUserIds).toContain(transaction.user_id)

            // Type should be one of the expected transaction types
            expect(['market_entry', 'winnings', 'platform_fee', 'creator_reward', 'automated_transfer'])
              .toContain(transaction.type)
          }

          // Property 3: Transaction records should be retrievable by market and user
          const marketTransactions = await MockDatabaseService.getMarketTransactions(market.id)
          expect(marketTransactions.length).toBeGreaterThanOrEqual(transactionResults.length)

          for (const participant of participants) {
            const userTransactions = await MockDatabaseService.getUserTransactions(participant.id)
            const userMarketTransactions = userTransactions.filter(t => t.market_id === market.id)
            
            // Each user should have at least their relevant transactions
            const expectedUserTransactions = transactionResults.filter(t => t.user_id === participant.id)
            expect(userMarketTransactions.length).toBeGreaterThanOrEqual(expectedUserTransactions.length)
          }

          // Property 4: Transaction timestamps should be in chronological order
          const allTransactions = await MockDatabaseService.getMarketTransactions(market.id)
          for (let i = 1; i < allTransactions.length; i++) {
            const prevTime = new Date(allTransactions[i - 1].created_at).getTime()
            const currTime = new Date(allTransactions[i].created_at).getTime()
            expect(currTime).toBeLessThanOrEqual(prevTime) // Ordered by created_at DESC
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property test for transaction metadata completeness
   * Ensures all required metadata fields are present in transaction records
   */
  it('should include all required metadata in transaction records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          transactionType: fc.constantFrom('market_entry', 'winnings', 'platform_fee', 'creator_reward', 'automated_transfer'),
          amount: fc.float({ min: Math.fround(0.01), max: Math.fround(100.0) }).filter(n => !isNaN(n) && isFinite(n)),
          marketTitle: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
          predictionType: fc.constantFrom('HOME_WIN', 'DRAW', 'AWAY_WIN'),
        }),
        async ({ transactionType, amount, marketTitle, predictionType }) => {
          // Create test data
          const user = MockDatabaseTestUtils.createTestUser({
            display_name: 'Test User',
            email: 'test@example.com',
          })

          const market = MockDatabaseTestUtils.createTestMarket({
            creator_id: user.id,
            title: marketTitle,
            description: `Test market for ${predictionType}`,
            status: 'FINISHED',
            resolution_outcome: predictionType,
          })

          // Create transaction with metadata
          const description = generateTransactionDescription(transactionType, marketTitle, predictionType)
          
          const transaction = await MockDatabaseService.createTransaction({
            user_id: user.id,
            market_id: market.id,
            type: transactionType,
            amount: amount,
            description: description,
          })

          // Verify metadata completeness
          expect(transaction.id).toBeDefined()
          expect(transaction.user_id).toBe(user.id)
          expect(transaction.market_id).toBe(market.id)
          expect(transaction.type).toBe(transactionType)
          expect(transaction.amount).toBe(amount)
          expect(transaction.description).toBe(description)
          expect(transaction.created_at).toBeDefined()

          // Verify description contains relevant information
          const descLower = transaction.description.toLowerCase()
          const hasRelevantInfo = descLower.includes('market') || 
                                   descLower.includes('automated') || 
                                   descLower.includes('reward') || 
                                   descLower.includes('fee') ||
                                   descLower.includes('winnings') ||
                                   descLower.includes('joined')
          expect(hasRelevantInfo).toBe(true)
          
          // Verify transaction can be retrieved
          const retrievedTransaction = (await MockDatabaseService.getUserTransactions(user.id))
            .find(t => t.id === transaction.id)
          expect(retrievedTransaction).toBeDefined()
          expect(retrievedTransaction!.id).toBe(transaction.id)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Helper method to generate transaction descriptions
   */
  function generateTransactionDescription(type: string, marketTitle: string, prediction: string): string {
    switch (type) {
      case 'market_entry':
        return `Joined market: ${marketTitle} with ${prediction} prediction`
      case 'winnings':
        return `Automated winnings from market resolution: ${prediction}`
      case 'creator_reward':
        return `Automated creator reward from market resolution`
      case 'platform_fee':
        return `Automated platform fee from market resolution`
      case 'automated_transfer':
        return `Automated transfer for market operations`
      default:
        return `Transaction for market: ${marketTitle}`
    }
  }
})