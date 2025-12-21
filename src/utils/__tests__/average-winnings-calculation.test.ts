import { describe, it, expect } from 'vitest'
import { WinningsCalculator } from '../winnings-calculator'
import type { MarketData } from '../../hooks/useMarketData'

describe('Average Potential Winnings Calculation', () => {
  it('should calculate correct average potential winnings for balanced market', () => {
    // Market with equal distribution: 1 Home, 1 Draw, 1 Away
    const marketData: MarketData = {
      marketAddress: 'test-market-address',
      creator: 'test-creator-address',
      matchId: 'test-match-123',
      entryFee: 100000000, // 0.1 SOL in lamports
      kickoffTime: Date.now() + 3600000,
      endTime: Date.now() + 7200000,
      status: 'Open',
      outcome: null,
      totalPool: 300000000, // 3 * 0.1 SOL = 0.3 SOL
      participantCount: 3,
      homeCount: 1,
      drawCount: 1,
      awayCount: 1,
      isPublic: true
    }

    const result = WinningsCalculator.calculateAveragePotentialWinnings(marketData)
    
    // Expected calculations:
    // New total pool: 0.3 + 0.1 = 0.4 SOL = 400,000,000 lamports
    // Participant pool (95%): 400,000,000 * 0.95 = 380,000,000 lamports
    
    // Home: 380,000,000 / (1 + 1) = 190,000,000 lamports
    // Draw: 380,000,000 / (1 + 1) = 190,000,000 lamports  
    // Away: 380,000,000 / (1 + 1) = 190,000,000 lamports
    // Average: (190,000,000 + 190,000,000 + 190,000,000) / 3 = 190,000,000 lamports
    
    expect(result.breakdown.Home).toBe(190000000)
    expect(result.breakdown.Draw).toBe(190000000)
    expect(result.breakdown.Away).toBe(190000000)
    expect(result.average).toBe(190000000)
    expect(result.explanation).toContain('0.400 SOL')
    expect(result.explanation).toContain('0.380 SOL')
  })

  it('should calculate correct average potential winnings for unbalanced market', () => {
    // Market with uneven distribution: 2 Home, 0 Draw, 1 Away
    const marketData: MarketData = {
      marketAddress: 'test-market-address',
      creator: 'test-creator-address',
      matchId: 'test-match-123',
      entryFee: 100000000, // 0.1 SOL in lamports
      kickoffTime: Date.now() + 3600000,
      endTime: Date.now() + 7200000,
      status: 'Open',
      outcome: null,
      totalPool: 300000000, // 3 * 0.1 SOL = 0.3 SOL
      participantCount: 3,
      homeCount: 2,
      drawCount: 0, // No Draw predictions yet
      awayCount: 1,
      isPublic: true
    }

    const result = WinningsCalculator.calculateAveragePotentialWinnings(marketData)
    
    // Expected calculations:
    // New total pool: 0.3 + 0.1 = 0.4 SOL = 400,000,000 lamports
    // Participant pool (95%): 400,000,000 * 0.95 = 380,000,000 lamports
    
    // Home: 380,000,000 / (2 + 1) = 126,666,666 lamports
    // Draw: 380,000,000 / (0 + 1) = 380,000,000 lamports (user would be only one)
    // Away: 380,000,000 / (1 + 1) = 190,000,000 lamports
    // Average: (126,666,666 + 380,000,000 + 190,000,000) / 3 = 232,222,222 lamports
    
    expect(result.breakdown.Home).toBe(126666666)
    expect(result.breakdown.Draw).toBe(380000000)
    expect(result.breakdown.Away).toBe(190000000)
    expect(result.average).toBe(232222222)
  })

  it('should handle empty market correctly', () => {
    // Market with no participants yet
    const marketData: MarketData = {
      marketAddress: 'test-market-address',
      creator: 'test-creator-address',
      matchId: 'test-match-123',
      entryFee: 100000000, // 0.1 SOL in lamports
      kickoffTime: Date.now() + 3600000,
      endTime: Date.now() + 7200000,
      status: 'Open',
      outcome: null,
      totalPool: 0,
      participantCount: 0,
      homeCount: 0,
      drawCount: 0,
      awayCount: 0,
      isPublic: true
    }

    const result = WinningsCalculator.calculateAveragePotentialWinnings(marketData)
    
    // For empty market, all predictions should return the entry fee
    expect(result.breakdown.Home).toBe(100000000)
    expect(result.breakdown.Draw).toBe(100000000)
    expect(result.breakdown.Away).toBe(100000000)
    expect(result.average).toBe(100000000)
    expect(result.explanation).toContain('No participants yet')
  })

  it('should show higher average when unpopular predictions are available', () => {
    // Market where most people chose Home, making Draw/Away more valuable
    const marketData: MarketData = {
      marketAddress: 'test-market-address',
      creator: 'test-creator-address',
      matchId: 'test-match-123',
      entryFee: 100000000, // 0.1 SOL in lamports
      kickoffTime: Date.now() + 3600000,
      endTime: Date.now() + 7200000,
      status: 'Open',
      outcome: null,
      totalPool: 500000000, // 5 * 0.1 SOL = 0.5 SOL
      participantCount: 5,
      homeCount: 4, // Most people chose Home
      drawCount: 0,
      awayCount: 1,
      isPublic: true
    }

    const result = WinningsCalculator.calculateAveragePotentialWinnings(marketData)
    
    // Expected calculations:
    // New total pool: 0.5 + 0.1 = 0.6 SOL = 600,000,000 lamports
    // Participant pool (95%): 600,000,000 * 0.95 = 570,000,000 lamports
    
    // Home: 570,000,000 / (4 + 1) = 114,000,000 lamports
    // Draw: 570,000,000 / (0 + 1) = 570,000,000 lamports (user would be only one)
    // Away: 570,000,000 / (1 + 1) = 285,000,000 lamports
    // Average: (114,000,000 + 570,000,000 + 285,000,000) / 3 = 323,000,000 lamports
    
    expect(result.breakdown.Home).toBe(114000000)
    expect(result.breakdown.Draw).toBe(570000000)
    expect(result.breakdown.Away).toBe(285000000)
    expect(result.average).toBe(323000000)
    
    // Average should be higher than the most popular choice (Home)
    expect(result.average).toBeGreaterThan(result.breakdown.Home)
  })
})