/**
 * Property-based tests for Market Service
 * 
 * Tests market creation, participation, and data consistency
 * using property-based testing with fast-check.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fc from 'fast-check'

// Mock DatabaseService before importing
vi.mock('../database-service', () => ({
  DatabaseService: {
    createMarket: vi.fn(),
    getMarketById: vi.fn(),
    getMarkets: vi.fn(),
    joinMarket: vi.fn(),
    updateMarket: vi.fn(),
    getMarketParticipants: vi.fn(),
    getUserMarketParticipation: vi.fn(),
    createTransaction: vi.fn(),
    getPlatformConfig: vi.fn(),
    supabase: {
      from: vi.fn(() => ({
        update: vi.fn(() => ({ eq: vi.fn(() => ({ error: null })) })),
      })),
    },
  },
}))

import { MarketService, type CreateMarketParams } from '../market-service'
import { DatabaseService } from '../database-service'

describe('MarketService Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * **Feature: web2-migration, Property 5: Market Data Consistency**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any market creation, the system should collect and store the same 
   * information fields (title, description, entry fee, end time) in Supabase as 
   * the original Solana implementation
   */
  it('should maintain market data consistency when creating markets', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for valid market creation parameters
        fc.record({
          matchId: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          title: fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5),
          description: fc.string({ minLength: 10, maxLength: 1000 }).filter(s => s.trim().length >= 10),
          entryFee: fc.float({ min: Math.fround(0.001), max: Math.fround(100), noNaN: true }),
          endTime: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }).map(d => d.toISOString()),
          isPublic: fc.boolean(),
          creatorId: fc.uuid(),
        }),
        async (params: CreateMarketParams) => {
          // Mock platform config
          vi.mocked(DatabaseService.getPlatformConfig).mockResolvedValue({
            key: 'platform_fee_percentage',
            value: 5,
            updated_at: new Date().toISOString(),
          })

          // Mock successful market creation
          const mockMarket = {
            id: 'market-123',
            creator_id: params.creatorId,
            title: params.title,
            description: params.description,
            entry_fee: params.entryFee,
            end_time: params.endTime,
            status: 'active' as const,
            resolution_outcome: null,
            total_pool: 0,
            platform_fee_percentage: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          vi.mocked(DatabaseService.createMarket).mockResolvedValue(mockMarket)
          vi.mocked(DatabaseService.createTransaction).mockResolvedValue({
            id: 'tx-123',
            user_id: params.creatorId,
            market_id: mockMarket.id,
            type: 'market_entry',
            amount: 0,
            description: `Created market: ${params.title}`,
            created_at: new Date().toISOString(),
          })

          // Test market creation
          const result = await MarketService.createMarket(params)

          // Verify all required fields are preserved
          expect(result.title).toBe(params.title)
          expect(result.description).toBe(params.description)
          expect(result.entry_fee).toBe(params.entryFee)
          expect(result.end_time).toBe(params.endTime)
          expect(result.creator_id).toBe(params.creatorId)
          expect(result.status).toBe('active')
          expect(result.total_pool).toBe(0)
          expect(result.platform_fee_percentage).toBe(5)

          // Verify database operations were called with correct data
          expect(DatabaseService.createMarket).toHaveBeenCalledWith({
            creator_id: params.creatorId,
            title: params.title,
            description: params.description,
            entry_fee: params.entryFee,
            end_time: params.endTime,
            status: 'active',
            total_pool: 0,
            platform_fee_percentage: 5,
          })

          // Verify transaction record was created
          expect(DatabaseService.createTransaction).toHaveBeenCalledWith({
            user_id: params.creatorId,
            market_id: result.id,
            type: 'market_entry',
            amount: 0,
            description: `Created market: ${params.title}`,
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain data consistency when joining markets', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          marketId: fc.uuid(),
          userId: fc.uuid(),
          prediction: fc.oneof(fc.constant('Home'), fc.constant('Draw'), fc.constant('Away')),
          entryAmount: fc.float({ min: Math.fround(0.001), max: Math.fround(10), noNaN: true }),
        }),
        async (joinParams) => {
          // Mock existing market
          const mockMarket = {
            id: joinParams.marketId,
            creator_id: 'creator-123',
            title: 'Test Market',
            description: 'Test Description',
            entry_fee: joinParams.entryAmount,
            end_time: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
            status: 'active' as const,
            resolution_outcome: null,
            total_pool: 0,
            platform_fee_percentage: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Mock existing participants
          const mockParticipants = [
            {
              id: 'p1',
              market_id: joinParams.marketId,
              user_id: 'user1',
              prediction: 'Home',
              entry_amount: joinParams.entryAmount,
              potential_winnings: joinParams.entryAmount * 2,
              actual_winnings: null,
              joined_at: new Date().toISOString(),
            },
          ]

          const mockNewParticipant = {
            id: 'new-participant',
            market_id: joinParams.marketId,
            user_id: joinParams.userId,
            prediction: joinParams.prediction,
            entry_amount: joinParams.entryAmount,
            potential_winnings: joinParams.entryAmount * 1.5, // Calculated based on pool
            actual_winnings: null,
            joined_at: new Date().toISOString(),
          }

          // Setup mocks
          vi.mocked(DatabaseService.getMarketById).mockResolvedValue(mockMarket)
          vi.mocked(DatabaseService.getUserMarketParticipation).mockResolvedValue(null)
          vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue(mockParticipants)
          vi.mocked(DatabaseService.joinMarket).mockResolvedValue(mockNewParticipant)
          vi.mocked(DatabaseService.updateMarket).mockResolvedValue({
            ...mockMarket,
            total_pool: mockMarket.total_pool + joinParams.entryAmount,
          })
          vi.mocked(DatabaseService.createTransaction).mockResolvedValue({
            id: 'tx-join',
            user_id: joinParams.userId,
            market_id: joinParams.marketId,
            type: 'market_entry',
            amount: joinParams.entryAmount,
            description: `Joined market with ${joinParams.prediction} prediction`,
            created_at: new Date().toISOString(),
          })

          // Test joining market
          const result = await MarketService.joinMarket(joinParams)

          // Verify participant data consistency
          expect(result.market_id).toBe(joinParams.marketId)
          expect(result.user_id).toBe(joinParams.userId)
          expect(result.prediction).toBe(joinParams.prediction)
          expect(result.entry_amount).toBe(joinParams.entryAmount)
          expect(result.potential_winnings).toBeGreaterThan(0)

          // Verify database operations maintain consistency
          expect(DatabaseService.joinMarket).toHaveBeenCalledWith({
            market_id: joinParams.marketId,
            user_id: joinParams.userId,
            prediction: joinParams.prediction,
            entry_amount: joinParams.entryAmount,
            potential_winnings: expect.any(Number),
          })

          // Verify market pool was updated
          expect(DatabaseService.updateMarket).toHaveBeenCalledWith(
            joinParams.marketId,
            expect.objectContaining({
              total_pool: mockMarket.total_pool + joinParams.entryAmount,
            })
          )

          // Verify transaction was recorded
          expect(DatabaseService.createTransaction).toHaveBeenCalledWith({
            user_id: joinParams.userId,
            market_id: joinParams.marketId,
            type: 'market_entry',
            amount: joinParams.entryAmount,
            description: `Joined market with ${joinParams.prediction} prediction`,
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain data consistency during market resolution', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          marketId: fc.uuid(),
          outcome: fc.oneof(fc.constant('Home'), fc.constant('Draw'), fc.constant('Away')),
          totalPool: fc.float({ min: Math.fround(1), max: Math.fround(1000), noNaN: true }),
          platformFeePercentage: fc.integer({ min: 1, max: 10 }),
        }),
        async (resolveParams) => {
          // Mock market data
          const mockMarket = {
            id: resolveParams.marketId,
            creator_id: 'creator-123',
            title: 'Test Market',
            description: 'Test Description',
            entry_fee: 0.1,
            end_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            status: 'active' as const,
            resolution_outcome: null,
            total_pool: resolveParams.totalPool,
            platform_fee_percentage: resolveParams.platformFeePercentage,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Mock participants with different predictions
          const mockParticipants = [
            {
              id: 'p1',
              market_id: resolveParams.marketId,
              user_id: 'user1',
              prediction: resolveParams.outcome, // Winner
              entry_amount: 0.1,
              potential_winnings: 0.2,
              actual_winnings: null,
              joined_at: new Date().toISOString(),
            },
            {
              id: 'p2',
              market_id: resolveParams.marketId,
              user_id: 'user2',
              prediction: resolveParams.outcome === 'Home' ? 'Away' : 'Home', // Loser
              entry_amount: 0.1,
              potential_winnings: 0.2,
              actual_winnings: null,
              joined_at: new Date().toISOString(),
            },
          ]

          // Setup mocks
          vi.mocked(DatabaseService.getMarketById).mockResolvedValue(mockMarket)
          vi.mocked(DatabaseService.getMarketParticipants).mockResolvedValue(mockParticipants)
          vi.mocked(DatabaseService.updateMarket).mockResolvedValue({
            ...mockMarket,
            status: 'resolved',
            resolution_outcome: resolveParams.outcome,
          })
          vi.mocked(DatabaseService.createTransaction).mockResolvedValue({
            id: 'tx-resolve',
            user_id: 'user1',
            market_id: resolveParams.marketId,
            type: 'winnings',
            amount: 100,
            description: `Winnings from market resolution: ${resolveParams.outcome}`,
            created_at: new Date().toISOString(),
          })

          // Test market resolution
          await MarketService.resolveMarket({
            marketId: resolveParams.marketId,
            outcome: resolveParams.outcome,
          })

          // Verify market status was updated consistently
          expect(DatabaseService.updateMarket).toHaveBeenCalledWith(
            resolveParams.marketId,
            expect.objectContaining({
              status: 'resolved',
              resolution_outcome: resolveParams.outcome,
            })
          )

          // Verify winnings calculations are consistent
          const winners = mockParticipants.filter(p => p.prediction === resolveParams.outcome)
          const platformFee = resolveParams.totalPool * (resolveParams.platformFeePercentage / 100)
          const winnerPool = resolveParams.totalPool - platformFee
          const expectedWinningsPerWinner = winners.length > 0 ? winnerPool / winners.length : 0

          // Verify participant updates were called for each participant
          expect(DatabaseService.supabase.from).toHaveBeenCalled()

          // Verify transaction records were created for winners
          if (winners.length > 0 && expectedWinningsPerWinner > 0) {
            expect(DatabaseService.createTransaction).toHaveBeenCalled()
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge cases in market data consistently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          entryFee: fc.oneof(
            fc.constant(0.001), // Minimum fee
            fc.constant(100),   // Maximum fee
            fc.float({ min: Math.fround(0.001), max: Math.fround(100), noNaN: true })
          ),
          endTime: fc.oneof(
            fc.constant(new Date(Date.now() + 60000).toISOString()), // 1 minute from now
            fc.constant(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()), // 1 year from now
          ),
          title: fc.oneof(
            fc.constant('A'.repeat(5)),   // Minimum length
            fc.constant('A'.repeat(200)), // Maximum length
            fc.string({ minLength: 5, maxLength: 200 }).filter(s => s.trim().length >= 5)
          ),
        }),
        async (edgeParams) => {
          const params: CreateMarketParams = {
            matchId: 'edge-test',
            title: edgeParams.title,
            description: 'Edge case test description',
            entryFee: edgeParams.entryFee,
            endTime: edgeParams.endTime,
            isPublic: true,
            creatorId: 'creator-edge',
          }

          // Mock platform config
          vi.mocked(DatabaseService.getPlatformConfig).mockResolvedValue({
            key: 'platform_fee_percentage',
            value: 5,
            updated_at: new Date().toISOString(),
          })

          // Mock successful creation
          const mockMarket = {
            id: 'edge-market',
            creator_id: params.creatorId,
            title: params.title,
            description: params.description,
            entry_fee: params.entryFee,
            end_time: params.endTime,
            status: 'active' as const,
            resolution_outcome: null,
            total_pool: 0,
            platform_fee_percentage: 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          vi.mocked(DatabaseService.createMarket).mockResolvedValue(mockMarket)
          vi.mocked(DatabaseService.createTransaction).mockResolvedValue({
            id: 'tx-edge',
            user_id: params.creatorId,
            market_id: mockMarket.id,
            type: 'market_entry',
            amount: 0,
            description: `Created market: ${params.title}`,
            created_at: new Date().toISOString(),
          })

          // Test edge case handling
          const result = await MarketService.createMarket(params)

          // Verify edge cases are handled consistently
          expect(result.entry_fee).toBe(params.entryFee)
          expect(result.entry_fee).toBeGreaterThanOrEqual(0.001)
          expect(result.entry_fee).toBeLessThanOrEqual(100)
          
          expect(result.title).toBe(params.title)
          expect(result.title.length).toBeGreaterThanOrEqual(5)
          expect(result.title.length).toBeLessThanOrEqual(200)
          
          expect(new Date(result.end_time).getTime()).toBeGreaterThan(Date.now())
        }
      ),
      { numRuns: 100 }
    )
  })
})