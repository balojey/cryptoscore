/**
 * WinningsDisplayExample - Example component demonstrating WinningsDisplay usage
 *
 * Shows different winnings states and variants for testing and documentation.
 */

import { useState } from 'react'
import { WinningsDisplay, CompactWinningsDisplay, DetailedWinningsDisplay } from '../WinningsDisplay'
import type { WinningsResult } from '@/utils/winnings-calculator'
import type { MarketData } from '@/hooks/useMarketData'
import type { ParticipantData } from '@/hooks/useParticipantData'
import type { EnhancedMatchData } from '@/hooks/useMatchData'

/**
 * Mock data for examples
 */
const mockMarketData: MarketData = {
  id: 'mock-market-uuid',
  creator_id: 'mock-creator-uuid',
  matchId: '12345',
  title: 'Mock Market',
  description: 'Mock market description',
  entry_fee: 0.1,
  end_time: new Date(Date.now() + 3600000).toISOString(),
  status: 'active',
  resolution_outcome: null,
  total_pool: 1.0,
  platform_fee_percentage: 0.05,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  participantCount: 10,
  homeCount: 4,
  drawCount: 2,
  awayCount: 4,
}

const mockParticipantData: ParticipantData = {
  id: 'mock-participant-uuid',
  market_id: 'mock-market-uuid',
  user_id: 'mock-user-uuid',
  prediction: 'Home',
  entry_amount: 0.1,
  potential_winnings: 0.19,
  actual_winnings: null,
  joined_at: new Date().toISOString(),
}

const mockMatchData: EnhancedMatchData = {
  id: 12345,
  homeTeam: {
    id: 1,
    name: 'Team A',
    shortName: 'TEA',
    tla: 'TEA',
    crest: 'team-a.png'
  },
  awayTeam: {
    id: 2,
    name: 'Team B',
    shortName: 'TEB',
    tla: 'TEB',
    crest: 'team-b.png'
  },
  competition: {
    id: 1,
    name: 'Test League',
    code: 'TL',
    type: 'LEAGUE',
    emblem: 'league.png'
  },
  score: {
    winner: null,
    duration: 'REGULAR',
    fullTime: { home: null, away: null },
    halfTime: { home: null, away: null }
  },
  startTime: new Date(Date.now() + 3600000),
  isFinished: false,
  matchResult: undefined,
}

/**
 * Example winnings results for different states
 */
const exampleWinnings: Record<string, WinningsResult> = {
  potential: {
    type: 'potential',
    amount: 250000000, // 0.25 SOL
    status: 'eligible',
    message: 'Potential winnings for your Home prediction',
    displayVariant: 'info',
    icon: 'Target',
  },
  
  actualWin: {
    type: 'actual',
    amount: 237500000, // 0.2375 SOL (95% of pool / 4 winners)
    breakdown: {
      participantWinnings: 237500000,
      totalPool: 1000000000,
      winnerCount: 4,
    },
    status: 'won',
    message: 'You won! Correct Home prediction',
    displayVariant: 'success',
    icon: 'Trophy',
  },
  
  creatorReward: {
    type: 'creator_reward',
    amount: 20000000, // 0.02 SOL (2% of pool)
    status: 'distributed',
    message: 'Creator reward has been distributed',
    displayVariant: 'success',
    icon: 'CheckCircle',
  },
  
  creatorParticipant: {
    type: 'potential',
    amount: 257500000, // 0.2575 SOL (participant + creator)
    breakdown: {
      participantWinnings: 237500000,
      creatorReward: 20000000,
      totalPool: 1000000000,
    },
    status: 'eligible',
    message: 'Potential winnings (Home prediction + creator reward)',
    displayVariant: 'info',
    icon: 'Crown',
  },
  
  loss: {
    type: 'none',
    amount: 0,
    status: 'lost',
    message: 'Your Home prediction was incorrect',
    displayVariant: 'error',
    icon: 'X',
  },
  
  pending: {
    type: 'actual',
    amount: 237500000,
    breakdown: {
      participantWinnings: 237500000,
      totalPool: 1000000000,
      winnerCount: 4,
    },
    status: 'pending',
    message: 'Match ended! You won Home + creator reward (pending resolution)',
    displayVariant: 'warning',
    icon: 'Clock',
  },
}

/**
 * WinningsDisplayExample component
 */
export function WinningsDisplayExample() {
  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          WinningsDisplay Examples
        </h1>
        <p className="text-[var(--text-secondary)]">
          Demonstrating different winnings states and display variants
        </p>
      </div>

      {/* Compact variants */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Compact Display (for cards and lists)
        </h2>
        <div className="space-y-3 bg-[var(--bg-elevated)] p-4 rounded-lg">
          {Object.entries(exampleWinnings).map(([key, winnings]) => (
            <div key={key} className="border-b border-[var(--border-default)] pb-3 last:border-b-0 last:pb-0">
              <div className="text-sm font-medium text-[var(--text-secondary)] mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <CompactWinningsDisplay
                marketData={mockMarketData}
                participantData={key.includes('creator') || key === 'potential' || key === 'actualWin' || key === 'loss' || key === 'pending' ? mockParticipantData : undefined}
                userAddress="mock-user-address"
                matchData={mockMatchData}
                winnings={winnings}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Detailed variants */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Detailed Display (for market detail pages)
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(exampleWinnings).map(([key, winnings]) => (
            <div key={key}>
              <div className="text-sm font-medium text-[var(--text-secondary)] mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <DetailedWinningsDisplay
                marketData={mockMarketData}
                participantData={key.includes('creator') || key === 'potential' || key === 'actualWin' || key === 'loss' || key === 'pending' ? mockParticipantData : undefined}
                userAddress="mock-user-address"
                matchData={mockMatchData}
                winnings={winnings}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Responsive test */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Responsive Design Test
        </h2>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          <WinningsDisplay
            marketData={mockMarketData}
            participantData={mockParticipantData}
            userAddress="mock-user-address"
            matchData={mockMatchData}
            winnings={exampleWinnings.actualWin}
            variant="detailed"
            showBreakdown={true}
          />
          <WinningsDisplay
            marketData={mockMarketData}
            participantData={mockParticipantData}
            userAddress="mock-user-address"
            matchData={mockMatchData}
            winnings={exampleWinnings.creatorParticipant}
            variant="detailed"
            showBreakdown={true}
          />
          <WinningsDisplay
            marketData={mockMarketData}
            participantData={undefined}
            userAddress="mock-user-address"
            matchData={mockMatchData}
            winnings={exampleWinnings.creatorReward}
            variant="detailed"
            showBreakdown={false}
          />
        </div>
      </section>

      {/* Currency formatting test */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
          Currency Formatting Test
        </h2>
        <div className="bg-[var(--bg-elevated)] p-4 rounded-lg">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Test different amount sizes and edge cases
          </p>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {/* Very small amount */}
            <WinningsDisplay
              marketData={mockMarketData}
              participantData={mockParticipantData}
              userAddress="mock-user-address"
              matchData={mockMatchData}
              winnings={{
                ...exampleWinnings.potential,
                amount: 1000000, // 0.001 SOL
                message: 'Very small potential winnings',
              }}
              variant="detailed"
            />
            
            {/* Very large amount */}
            <WinningsDisplay
              marketData={mockMarketData}
              participantData={mockParticipantData}
              userAddress="mock-user-address"
              matchData={mockMatchData}
              winnings={{
                ...exampleWinnings.actualWin,
                amount: 1000000000000, // 1000 SOL
                message: 'Very large actual winnings',
              }}
              variant="detailed"
            />
            
            {/* Zero amount */}
            <WinningsDisplay
              marketData={mockMarketData}
              participantData={mockParticipantData}
              userAddress="mock-user-address"
              matchData={mockMatchData}
              winnings={{
                ...exampleWinnings.loss,
                amount: 0,
                message: 'No winnings (zero amount)',
              }}
              variant="detailed"
            />
          </div>
        </div>
      </section>
    </div>
  )
}