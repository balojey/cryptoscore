import { describe, it, expect } from 'vitest'
import { WinningsCalculator } from '../winnings-calculator'
import type { MarketData } from '../../hooks/useMarketData'

describe('Demo: Average Potential Winnings vs Individual Predictions', () => {
  it('should demonstrate the difference between old and new calculation approaches', () => {
    console.log('\n=== DEMO: Improved Potential Winnings Calculation ===\n')
    
    // Scenario: Market with uneven distribution
    const marketData: MarketData = {
      marketAddress: 'demo-market',
      creator: 'demo-creator',
      matchId: 'demo-match',
      entryFee: 100000000, // 0.1 SOL
      kickoffTime: Date.now() + 3600000,
      endTime: Date.now() + 7200000,
      status: 'Open',
      outcome: null,
      totalPool: 500000000, // 5 participants × 0.1 SOL = 0.5 SOL
      participantCount: 5,
      homeCount: 3, // Most popular prediction
      drawCount: 0, // No one chose Draw yet
      awayCount: 2,
      isPublic: true
    }

    console.log('📊 Market State:')
    console.log(`   Entry Fee: ${marketData.entryFee / 1e9} SOL`)
    console.log(`   Total Pool: ${marketData.totalPool / 1e9} SOL`)
    console.log(`   Participants: ${marketData.participantCount}`)
    console.log(`   Home: ${marketData.homeCount}, Draw: ${marketData.drawCount}, Away: ${marketData.awayCount}`)
    console.log('')

    // OLD APPROACH: Show only Home prediction (most popular)
    const homeWinnings = WinningsCalculator.calculatePotentialWinnings(marketData, 'Home')
    console.log('❌ OLD APPROACH (showing only Home prediction):')
    console.log(`   Potential Winnings: ${(homeWinnings / 1e9).toFixed(3)} SOL`)
    console.log(`   Problem: User doesn't see that Draw offers much higher returns!`)
    console.log('')

    // NEW APPROACH: Show average across all predictions with breakdown
    const averageResult = WinningsCalculator.calculateAveragePotentialWinnings(marketData)
    console.log('✅ NEW APPROACH (average across all predictions):')
    console.log(`   Average Potential Winnings: ${(averageResult.average / 1e9).toFixed(3)} SOL`)
    console.log('')
    console.log('   📈 Breakdown by prediction:')
    console.log(`   • Home: ${(averageResult.breakdown.Home / 1e9).toFixed(3)} SOL (${marketData.homeCount + 1} winners)`)
    console.log(`   • Draw: ${(averageResult.breakdown.Draw / 1e9).toFixed(3)} SOL (${marketData.drawCount + 1} winner - BEST!)`)
    console.log(`   • Away: ${(averageResult.breakdown.Away / 1e9).toFixed(3)} SOL (${marketData.awayCount + 1} winners)`)
    console.log('')
    console.log('   💡 Explanation:')
    console.log(`   ${averageResult.explanation}`)
    console.log('')

    // Verify the calculations are correct
    expect(averageResult.breakdown.Draw).toBeGreaterThan(averageResult.breakdown.Home)
    expect(averageResult.breakdown.Draw).toBeGreaterThan(averageResult.breakdown.Away)
    expect(averageResult.average).toBeGreaterThan(homeWinnings)

    console.log('🎯 Benefits of New Approach:')
    console.log('   1. Users see the full picture of potential returns')
    console.log('   2. Encourages strategic thinking about unpopular predictions')
    console.log('   3. Shows transparent calculation methodology')
    console.log('   4. Helps users make more informed decisions')
    console.log('   5. Average gives realistic expectation regardless of choice')
    console.log('')
    console.log('=== END DEMO ===\n')
  })

  it('should show how calculation changes with market evolution', () => {
    console.log('\n=== DEMO: Market Evolution Impact ===\n')
    
    // Initial market state
    const initialMarket: MarketData = {
      marketAddress: 'evolution-demo',
      creator: 'demo-creator',
      matchId: 'evolution-match',
      entryFee: 100000000, // 0.1 SOL
      kickoffTime: Date.now() + 3600000,
      endTime: Date.now() + 7200000,
      status: 'Open',
      outcome: null,
      totalPool: 100000000, // 1 participant
      participantCount: 1,
      homeCount: 1,
      drawCount: 0,
      awayCount: 0,
      isPublic: true
    }

    console.log('📈 Market Evolution:')
    console.log('')

    // Show progression as more users join
    const markets = [
      { ...initialMarket, totalPool: 100000000, participantCount: 1, homeCount: 1, drawCount: 0, awayCount: 0 },
      { ...initialMarket, totalPool: 300000000, participantCount: 3, homeCount: 2, drawCount: 0, awayCount: 1 },
      { ...initialMarket, totalPool: 500000000, participantCount: 5, homeCount: 3, drawCount: 1, awayCount: 1 },
      { ...initialMarket, totalPool: 800000000, participantCount: 8, homeCount: 4, drawCount: 2, awayCount: 2 }
    ]

    markets.forEach((market, index) => {
      const result = WinningsCalculator.calculateAveragePotentialWinnings(market)
      console.log(`   Stage ${index + 1}: ${market.participantCount} participants`)
      console.log(`   Average: ${(result.average / 1e9).toFixed(3)} SOL | Home: ${(result.breakdown.Home / 1e9).toFixed(3)} | Draw: ${(result.breakdown.Draw / 1e9).toFixed(3)} | Away: ${(result.breakdown.Away / 1e9).toFixed(3)}`)
    })

    console.log('')
    console.log('🔍 Observations:')
    console.log('   • Average potential winnings decrease as more participants join')
    console.log('   • Unpopular predictions (Draw) maintain higher potential returns')
    console.log('   • Users can see market dynamics and adjust strategy accordingly')
    console.log('')
    console.log('=== END EVOLUTION DEMO ===\n')
  })
})