import { describe, it, expect } from 'vitest'
import { WinningsCalculator } from '../winnings-calculator'
import type { MarketData } from '../../hooks/useMarketData'

describe('Winnings Calculation Fix - User Scenario', () => {
  it('should calculate correct potential winnings for the described scenario', () => {
    // Scenario: Market with 0.1 SOL entry fee, 3 people joined
    // Person 1: Home, Person 2: Away, Person 3: Draw
    // 4th user wants to see potential winnings
    const marketData: MarketData = {
      id: 'test-market-id',
      creator_id: 'test-creator-address',
      matchId: 'test-match-123',
      title: 'Test Market',
      description: 'Test market description',
      entry_fee: 100000000, // 0.1 SOL in lamports
      end_time: new Date(Date.now() + 7200000).toISOString(),
      status: 'active',
      resolution_outcome: null,
      total_pool: 300000000, // 3 * 0.1 SOL = 0.3 SOL
      platform_fee_percentage: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participantCount: 3,
      homeCount: 1, // Person 1
      drawCount: 1, // Person 3
      awayCount: 1 // Person 2
    }

    // Calculate potential winnings for 4th user joining with Home prediction
    const homeWinnings = WinningsCalculator.calculatePotentialWinnings(marketData, 'Home')
    
    // Expected calculation:
    // New total pool: 0.3 + 0.1 = 0.4 SOL = 400,000,000 lamports
    // Participant pool (95%): 400,000,000 * 0.95 = 380,000,000 lamports
    // Home predictions after user joins: 1 + 1 = 2
    // Winnings per Home winner: 380,000,000 / 2 = 190,000,000 lamports (0.19 SOL)
    
    const expectedNewTotalPool = 300000000 + 100000000 // 0.4 SOL
    const expectedParticipantPool = Math.floor((expectedNewTotalPool * 9500) / 10000) // 95%
    const expectedWinningsPerWinner = Math.floor(expectedParticipantPool / 2) // 2 Home predictions
    
    expect(homeWinnings).toBe(expectedWinningsPerWinner)
    expect(homeWinnings).toBe(190000000) // 0.19 SOL
  })

  it('should calculate correct potential winnings when 5th user joins after 4th', () => {
    // Scenario continues: 4th user joined with Home, now 5th user wants to join with Home too
    const marketDataAfter4thUser: MarketData = {
      id: 'test-market-id',
      creator_id: 'test-creator-address',
      matchId: 'test-match-123',
      title: 'Test Market',
      description: 'Test market description',
      entry_fee: 100000000, // 0.1 SOL in lamports
      end_time: new Date(Date.now() + 7200000).toISOString(),
      status: 'active',
      resolution_outcome: null,
      total_pool: 400000000, // 4 * 0.1 SOL = 0.4 SOL
      platform_fee_percentage: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participantCount: 4,
      homeCount: 2, // Person 1 + 4th user
      drawCount: 1, // Person 3
      awayCount: 1 // Person 2
    }

    // Calculate potential winnings for 5th user joining with Home prediction
    const homeWinnings = WinningsCalculator.calculatePotentialWinnings(marketDataAfter4thUser, 'Home')
    
    // Expected calculation:
    // New total pool: 0.4 + 0.1 = 0.5 SOL = 500,000,000 lamports
    // Participant pool (95%): 500,000,000 * 0.95 = 475,000,000 lamports
    // Home predictions after user joins: 2 + 1 = 3
    // Winnings per Home winner: 475,000,000 / 3 = 158,333,333 lamports (~0.158 SOL)
    
    const expectedNewTotalPool = 400000000 + 100000000 // 0.5 SOL
    const expectedParticipantPool = Math.floor((expectedNewTotalPool * 9500) / 10000) // 95%
    const expectedWinningsPerWinner = Math.floor(expectedParticipantPool / 3) // 3 Home predictions
    
    expect(homeWinnings).toBe(expectedWinningsPerWinner)
    expect(homeWinnings).toBe(158333333) // ~0.158 SOL
  })

  it('should show higher potential winnings for unpredicted outcomes', () => {
    // Market with only Home and Away predictions, no Draw predictions yet
    const marketData: MarketData = {
      id: 'test-market-id',
      creator_id: 'test-creator-address',
      matchId: 'test-match-123',
      title: 'Test Market',
      description: 'Test market description',
      entry_fee: 100000000, // 0.1 SOL in lamports
      end_time: new Date(Date.now() + 7200000).toISOString(),
      status: 'active',
      resolution_outcome: null,
      total_pool: 300000000, // 3 * 0.1 SOL = 0.3 SOL
      platform_fee_percentage: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participantCount: 3,
      homeCount: 2,
      drawCount: 0, // No Draw predictions yet
      awayCount: 1
    }

    const drawWinnings = WinningsCalculator.calculatePotentialWinnings(marketData, 'Draw')
    
    // Expected calculation:
    // New total pool: 0.3 + 0.1 = 0.4 SOL = 400,000,000 lamports
    // Participant pool (95%): 400,000,000 * 0.95 = 380,000,000 lamports
    // Draw predictions after user joins: 0 + 1 = 1 (user would be the only one)
    // User gets full participant pool: 380,000,000 lamports (0.38 SOL)
    
    const expectedNewTotalPool = 300000000 + 100000000 // 0.4 SOL
    const expectedParticipantPool = Math.floor((expectedNewTotalPool * 9500) / 10000) // 95%
    
    expect(drawWinnings).toBe(expectedParticipantPool)
    expect(drawWinnings).toBe(380000000) // 0.38 SOL
  })
})