import { describe, it, expect } from 'vitest'
import { WinningsCalculator } from '../../../utils/winnings-calculator'
import type { MarketData } from '../../../hooks/useMarketData'

const mockMarketData: MarketData = {
  id: 'test-market-id',
  creator_id: 'test-creator-address',
  matchId: 'test-match-123',
  title: 'Test Market',
  description: 'Test market description',
  entry_fee: 10000, // 0.1 MNEE in atomic units
  end_time: new Date(Date.now() + 7200000).toISOString(),
  status: 'active',
  resolution_outcome: null,
  total_pool: 30000, // 3 * 0.1 MNEE = 0.3 MNEE
  platform_fee_percentage: 5,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  participantCount: 3,
  homeCount: 1,
  drawCount: 1,
  awayCount: 1
}

describe('PotentialWinningsDisplay Logic', () => {
  it('should calculate correct average potential winnings for balanced market', () => {
    const result = WinningsCalculator.calculateAveragePotentialWinnings(mockMarketData)
    
    // All predictions should have same winnings (19000 atomic units each)
    expect(result.breakdown.Home).toBe(19000)
    expect(result.breakdown.Draw).toBe(19000)
    expect(result.breakdown.Away).toBe(19000)
    expect(result.average).toBe(19000)
    expect(result.explanation).toContain('0.40000 MNEE') // New total pool
    expect(result.explanation).toContain('0.38000 MNEE') // Participant pool
  })

  it('should show higher potential for unpopular predictions', () => {
    const unbalancedMarket: MarketData = {
      ...mockMarketData,
      homeCount: 2,
      drawCount: 0, // No Draw predictions yet
      awayCount: 1
    }

    const result = WinningsCalculator.calculateAveragePotentialWinnings(unbalancedMarket)
    
    // Draw should have highest winnings (user would be only one)
    expect(result.breakdown.Draw).toBeGreaterThan(result.breakdown.Home)
    expect(result.breakdown.Draw).toBeGreaterThan(result.breakdown.Away)
    
    // Home should have lowest winnings (most crowded)
    expect(result.breakdown.Home).toBeLessThan(result.breakdown.Away)
    
    // Average should be higher than the most popular choice
    expect(result.average).toBeGreaterThan(result.breakdown.Home)
  })

  it('should handle empty market correctly', () => {
    const emptyMarket: MarketData = {
      ...mockMarketData,
      total_pool: 0,
      participantCount: 0,
      homeCount: 0,
      drawCount: 0,
      awayCount: 0
    }

    const result = WinningsCalculator.calculateAveragePotentialWinnings(emptyMarket)
    
    // All predictions should return entry fee for empty market
    expect(result.breakdown.Home).toBe(10000)
    expect(result.breakdown.Draw).toBe(10000)
    expect(result.breakdown.Away).toBe(10000)
    expect(result.average).toBe(100000000)
    expect(result.explanation).toContain('No participants yet')
  })

  it('should provide informative explanation', () => {
    const result = WinningsCalculator.calculateAveragePotentialWinnings(mockMarketData)
    
    expect(result.explanation).toContain('Average of potential winnings')
    expect(result.explanation).toContain('Total pool after you join')
    expect(result.explanation).toContain('Participant pool (95%)')
    expect(result.explanation).toContain('Your winnings depend on how many others')
  })
})