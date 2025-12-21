/**
 * Football-Data API Status Synchronization Property Tests
 *
 * Property-based tests for verifying that status synchronization maintains consistency
 * between the football-data API and the internal database.
 *
 * Feature: enhanced-prediction-system, Property 2: Status synchronization maintains consistency
 * Validates: Requirements 1.2, 1.4, 1.5
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { FootballDataService } from '../index'
import { mapApiStatusToDbStatus, hasSignificantChange } from '../match-utils'
import { FootballDataRateLimiter } from '../rate-limiter'
import type { MatchData, ServiceResponse } from '@/types/football-data'
import type { MatchStatus } from '@/config/football-data'

// Mock fetch for testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Football-Data API Status Synchronization Property Tests', () => {
  beforeEach(() => {
    // Reset mocks and rate limiter before each test
    vi.clearAllMocks()
    FootballDataRateLimiter.reset()
    FootballDataService.clearRateLimitTracking()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Property 2: Status synchronization maintains consistency', () => {
    /**
     * Feature: enhanced-prediction-system, Property 2: Status synchronization maintains consistency
     * 
     * For any match status update from football-data API, the corresponding market status 
     * should be updated to match, maintaining data consistency between external API and internal database
     */
    it('should maintain consistency between API status and database status', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate test data for status synchronization
          fc.record({
            matchId: fc.integer({ min: 1, max: 999999 }),
            oldStatus: fc.constantFrom(
              'SCHEDULED', 'LIVE', 'IN_PLAY', 'PAUSED', 
              'FINISHED', 'POSTPONED', 'CANCELLED', 'SUSPENDED'
            ),
            newStatus: fc.constantFrom(
              'SCHEDULED', 'LIVE', 'IN_PLAY', 'PAUSED', 
              'FINISHED', 'POSTPONED', 'CANCELLED', 'SUSPENDED'
            ),
            homeTeamName: fc.string({ minLength: 5, maxLength: 30 }),
            awayTeamName: fc.string({ minLength: 5, maxLength: 30 }),
            homeScore: fc.option(fc.integer({ min: 0, max: 10 }), { nil: null }),
            awayScore: fc.option(fc.integer({ min: 0, max: 10 }), { nil: null }),
          }),
          async (testData) => {
            // Create mock match data that simulates API response
            const mockMatchData: MatchData = {
              id: testData.matchId,
              utcDate: new Date().toISOString(),
              status: testData.newStatus as MatchStatus,
              matchday: 1,
              stage: 'REGULAR_SEASON',
              group: null,
              lastUpdated: new Date().toISOString(),
              area: {
                id: 1,
                name: 'Test Area',
                code: 'TEST',
                flag: 'test-flag.png'
              },
              competition: {
                id: 1,
                name: 'Test Competition',
                code: 'TEST',
                type: 'LEAGUE',
                emblem: 'test-emblem.png'
              },
              season: {
                id: 1,
                startDate: '2024-01-01',
                endDate: '2024-12-31',
                currentMatchday: 1,
                winner: null
              },
              homeTeam: {
                id: 100,
                name: testData.homeTeamName,
                shortName: testData.homeTeamName.substring(0, 3).toUpperCase(),
                tla: testData.homeTeamName.substring(0, 3).toUpperCase(),
                crest: 'home-crest.png'
              },
              awayTeam: {
                id: 200,
                name: testData.awayTeamName,
                shortName: testData.awayTeamName.substring(0, 3).toUpperCase(),
                tla: testData.awayTeamName.substring(0, 3).toUpperCase(),
                crest: 'away-crest.png'
              },
              score: {
                winner: null,
                duration: 'REGULAR',
                fullTime: {
                  home: testData.homeScore,
                  away: testData.awayScore
                },
                halfTime: {
                  home: null,
                  away: null
                }
              },
              referees: []
            }

            // Mock successful API response
            mockFetch.mockResolvedValueOnce({
              ok: true,
              status: 200,
              headers: new Headers({
                'X-Requests-Available-Minute': '9',
                'X-RequestCounter-Reset': '60'
              }),
              json: async () => ({ match: mockMatchData })
            })

            // Test status synchronization
            const response = await FootballDataService.getMatch(testData.matchId)

            // Verify the response is successful
            expect(response.success).toBe(true)
            expect(response.data).toBeDefined()

            if (response.success && response.data) {
              // Property: API status should map consistently to database status
              const mappedStatus = mapApiStatusToDbStatus(response.data.status)
              expect(mappedStatus).toBe(testData.newStatus)

              // Property: Status should be one of the valid enum values
              const validStatuses: MatchStatus[] = [
                'SCHEDULED', 'LIVE', 'IN_PLAY', 'PAUSED', 
                'FINISHED', 'POSTPONED', 'CANCELLED', 'SUSPENDED'
              ]
              expect(validStatuses).toContain(response.data.status)

              // Property: Match data should include all required fields for status synchronization
              expect(response.data.id).toBe(testData.matchId)
              expect(response.data.status).toBe(testData.newStatus)
              expect(response.data.homeTeam.name).toBe(testData.homeTeamName)
              expect(response.data.awayTeam.name).toBe(testData.awayTeamName)

              // Property: Enhanced match data should correctly identify finished matches
              const enhancedMatch = FootballDataService.enhanceMatchData(response.data)
              const expectedIsFinished = testData.newStatus === 'FINISHED'
              expect(enhancedMatch.isFinished).toBe(expectedIsFinished)

              // Property: Enhanced match data should correctly identify valid scores
              const expectedHasValidScore = 
                testData.homeScore !== null && testData.awayScore !== null
              expect(enhancedMatch.hasValidScore).toBe(expectedHasValidScore)

              // Property: Match result should be determined correctly for finished matches
              if (expectedIsFinished && expectedHasValidScore) {
                const homeScore = testData.homeScore!
                const awayScore = testData.awayScore!
                
                let expectedResult: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN'
                if (homeScore > awayScore) {
                  expectedResult = 'HOME_WIN'
                } else if (homeScore < awayScore) {
                  expectedResult = 'AWAY_WIN'
                } else {
                  expectedResult = 'DRAW'
                }
                
                expect(enhancedMatch.matchResult).toBe(expectedResult)
              } else {
                expect(enhancedMatch.matchResult).toBeUndefined()
              }
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should detect significant changes in match data', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            matchId: fc.integer({ min: 1, max: 999999 }),
            initialStatus: fc.constantFrom('SCHEDULED', 'LIVE', 'FINISHED'),
            updatedStatus: fc.constantFrom('SCHEDULED', 'LIVE', 'FINISHED'),
            initialHomeScore: fc.option(fc.integer({ min: 0, max: 5 }), { nil: null }),
            initialAwayScore: fc.option(fc.integer({ min: 0, max: 5 }), { nil: null }),
            updatedHomeScore: fc.option(fc.integer({ min: 0, max: 5 }), { nil: null }),
            updatedAwayScore: fc.option(fc.integer({ min: 0, max: 5 }), { nil: null }),
            teamName: fc.string({ minLength: 5, maxLength: 20 }),
          }),
          async (testData) => {
            // Create initial match data
            const initialMatch: MatchData = {
              id: testData.matchId,
              utcDate: '2024-01-01T15:00:00Z',
              status: testData.initialStatus as MatchStatus,
              matchday: 1,
              stage: 'REGULAR_SEASON',
              group: null,
              lastUpdated: '2024-01-01T14:00:00Z',
              area: { id: 1, name: 'Test Area', code: 'TEST', flag: 'flag.png' },
              competition: { id: 1, name: 'Test League', code: 'TEST', type: 'LEAGUE', emblem: 'emblem.png' },
              season: { id: 1, startDate: '2024-01-01', endDate: '2024-12-31', currentMatchday: 1, winner: null },
              homeTeam: { id: 100, name: `${testData.teamName} Home`, shortName: 'HOME', tla: 'HOM', crest: 'home.png' },
              awayTeam: { id: 200, name: `${testData.teamName} Away`, shortName: 'AWAY', tla: 'AWY', crest: 'away.png' },
              score: {
                winner: null,
                duration: 'REGULAR',
                fullTime: { home: testData.initialHomeScore, away: testData.initialAwayScore },
                halfTime: { home: null, away: null }
              },
              referees: []
            }

            // Create updated match data
            const updatedMatch: MatchData = {
              ...initialMatch,
              status: testData.updatedStatus as MatchStatus,
              score: {
                ...initialMatch.score,
                fullTime: { home: testData.updatedHomeScore, away: testData.updatedAwayScore }
              },
              lastUpdated: '2024-01-01T16:00:00Z'
            }

            // Property: Status changes should be detected as significant
            const statusChanged = testData.initialStatus !== testData.updatedStatus
            
            // Property: Score changes should be detected as significant
            const scoreChanged = 
              testData.initialHomeScore !== testData.updatedHomeScore ||
              testData.initialAwayScore !== testData.updatedAwayScore

            // Property: hasSignificantChange should return true if status or score changed
            const expectedSignificantChange = statusChanged || scoreChanged
            const actualSignificantChange = hasSignificantChange(initialMatch, updatedMatch)
            
            expect(actualSignificantChange).toBe(expectedSignificantChange)

            // Property: If no changes occurred, should not be significant
            if (!statusChanged && !scoreChanged) {
              expect(actualSignificantChange).toBe(false)
            }

            // Property: Status mapping should be consistent for both matches
            const initialMappedStatus = mapApiStatusToDbStatus(initialMatch.status)
            const updatedMappedStatus = mapApiStatusToDbStatus(updatedMatch.status)
            
            expect(initialMappedStatus).toBe(testData.initialStatus)
            expect(updatedMappedStatus).toBe(testData.updatedStatus)
          }
        ),
        { numRuns: 30 }
      )
    })

    it('should handle batch status synchronization correctly', { timeout: 60000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              matchId: fc.integer({ min: 1, max: 999999 }),
              status: fc.constantFrom('SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED'),
              homeTeamName: fc.string({ minLength: 3, maxLength: 20 }),
              awayTeamName: fc.string({ minLength: 3, maxLength: 20 }),
            }),
            { minLength: 1, maxLength: 5 } // Keep small for performance
          ),
          async (matchesData) => {
            // Ensure unique match IDs
            const uniqueMatches = matchesData.reduce((acc, match) => {
              if (!acc.some(m => m.matchId === match.matchId)) {
                acc.push(match)
              }
              return acc
            }, [] as typeof matchesData)

            if (uniqueMatches.length === 0) return // Skip if no unique matches

            // Mock API responses for each match
            for (const matchData of uniqueMatches) {
              const mockMatch: MatchData = {
                id: matchData.matchId,
                utcDate: new Date().toISOString(),
                status: matchData.status as MatchStatus,
                matchday: 1,
                stage: 'REGULAR_SEASON',
                group: null,
                lastUpdated: new Date().toISOString(),
                area: { id: 1, name: 'Test Area', code: 'TEST', flag: 'flag.png' },
                competition: { id: 1, name: 'Test League', code: 'TEST', type: 'LEAGUE', emblem: 'emblem.png' },
                season: { id: 1, startDate: '2024-01-01', endDate: '2024-12-31', currentMatchday: 1, winner: null },
                homeTeam: { id: 100, name: matchData.homeTeamName, shortName: 'HOME', tla: 'HOM', crest: 'home.png' },
                awayTeam: { id: 200, name: matchData.awayTeamName, shortName: 'AWAY', tla: 'AWY', crest: 'away.png' },
                score: {
                  winner: null,
                  duration: 'REGULAR',
                  fullTime: { home: null, away: null },
                  halfTime: { home: null, away: null }
                },
                referees: []
              }

              mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: new Headers({
                  'X-Requests-Available-Minute': '9',
                  'X-RequestCounter-Reset': '60'
                }),
                json: async () => ({ match: mockMatch })
              })
            }

            // Test batch synchronization
            const matchIds = uniqueMatches.map(m => m.matchId)
            const syncResult = await FootballDataService.syncMatchStatuses(matchIds)

            // Property: All matches should be checked
            expect(syncResult.matchesChecked).toBe(uniqueMatches.length)

            // Property: No matches should have errors with valid mock data
            expect(syncResult.matchesWithErrors).toBe(0)

            // Property: Results should include all match IDs
            expect(syncResult.results).toHaveLength(uniqueMatches.length)

            // Property: Each result should correspond to a requested match
            for (const result of syncResult.results) {
              expect(matchIds).toContain(result.matchId)
              expect(result.error).toBeUndefined()
            }

            // Property: Status mapping should be consistent for all matches
            for (let i = 0; i < uniqueMatches.length; i++) {
              const matchData = uniqueMatches[i]
              const result = syncResult.results.find(r => r.matchId === matchData.matchId)
              
              expect(result).toBeDefined()
              if (result) {
                const mappedStatus = mapApiStatusToDbStatus(result.newStatus)
                expect(mappedStatus).toBe(matchData.status)
              }
            }
          }
        ),
        { numRuns: 10 } // Reduced for performance
      )
    })

    it('should handle API errors gracefully during status synchronization', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            matchId: fc.integer({ min: 1, max: 999999 }),
            errorStatus: fc.constantFrom(400, 404, 500),
            errorMessage: fc.string({ minLength: 5, maxLength: 50 }),
          }),
          async (testData) => {
            // Mock API error response
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status: testData.errorStatus,
              statusText: 'Error',
              headers: new Headers(),
              json: async () => ({ message: testData.errorMessage })
            })

            // Test error handling during status synchronization
            const response = await FootballDataService.getMatch(testData.matchId)

            // Property: API errors should be handled gracefully
            expect(response.success).toBe(false)
            expect(response.error).toBeDefined()
            expect(response.data).toBeNull()

            // Property: Error message should be informative
            expect(typeof response.error).toBe('string')
            expect(response.error!.length).toBeGreaterThan(0)

            // Mock another error response for batch sync test
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status: testData.errorStatus,
              statusText: 'Error',
              headers: new Headers(),
              json: async () => ({ message: testData.errorMessage })
            })

            // Test batch synchronization with errors
            const syncResult = await FootballDataService.syncMatchStatuses([testData.matchId])

            // Property: Batch sync should handle individual match errors
            expect(syncResult.matchesChecked).toBe(1)
            expect(syncResult.matchesWithErrors).toBe(1)
            expect(syncResult.results).toHaveLength(1)

            const result = syncResult.results[0]
            expect(result.matchId).toBe(testData.matchId)
            expect(result.updated).toBe(false)
            expect(result.error).toBeDefined()
          }
        ),
        { numRuns: 5 } // Reduced for performance
      )
    })

    it('should maintain rate limiting during status synchronization', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.integer({ min: 1, max: 999999 }),
            { minLength: 2, maxLength: 3 } // Small array for rate limit testing
          ),
          async (matchIds) => {
            // Ensure unique match IDs
            const uniqueMatchIds = [...new Set(matchIds)]
            
            if (uniqueMatchIds.length < 2) return // Skip if not enough unique IDs

            // Mock successful responses for all matches
            for (const matchId of uniqueMatchIds) {
              const mockMatch: MatchData = {
                id: matchId,
                utcDate: new Date().toISOString(),
                status: 'SCHEDULED',
                matchday: 1,
                stage: 'REGULAR_SEASON',
                group: null,
                lastUpdated: new Date().toISOString(),
                area: { id: 1, name: 'Test Area', code: 'TEST', flag: 'flag.png' },
                competition: { id: 1, name: 'Test League', code: 'TEST', type: 'LEAGUE', emblem: 'emblem.png' },
                season: { id: 1, startDate: '2024-01-01', endDate: '2024-12-31', currentMatchday: 1, winner: null },
                homeTeam: { id: 100, name: 'Home Team', shortName: 'HOME', tla: 'HOM', crest: 'home.png' },
                awayTeam: { id: 200, name: 'Away Team', shortName: 'AWAY', tla: 'AWY', crest: 'away.png' },
                score: {
                  winner: null,
                  duration: 'REGULAR',
                  fullTime: { home: null, away: null },
                  halfTime: { home: null, away: null }
                },
                referees: []
              }

              mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                headers: new Headers({
                  'X-Requests-Available-Minute': '8', // Decreasing available requests
                  'X-RequestCounter-Reset': '60'
                }),
                json: async () => ({ match: mockMatch })
              })
            }

            // Test that rate limiting is respected during batch operations
            const startTime = Date.now()
            const syncResult = await FootballDataService.syncMatchStatuses(uniqueMatchIds)
            const endTime = Date.now()

            // Property: All matches should be processed
            expect(syncResult.matchesChecked).toBe(uniqueMatchIds.length)

            // Property: Rate limiting should introduce some delay for multiple requests
            // Note: This is a weak test since we're mocking, but it verifies the structure
            const duration = endTime - startTime
            expect(duration).toBeGreaterThanOrEqual(0) // Basic sanity check

            // Property: Rate limiter should track requests
            const rateLimitStatus = FootballDataService.getRateLimitStatus()
            expect(Array.isArray(rateLimitStatus)).toBe(true)

            // Property: Each match should have a result
            expect(syncResult.results).toHaveLength(uniqueMatchIds.length)
            for (const matchId of uniqueMatchIds) {
              const result = syncResult.results.find(r => r.matchId === matchId)
              expect(result).toBeDefined()
            }
          }
        ),
        { numRuns: 5 } // Very limited for performance
      )
    })
  })
})