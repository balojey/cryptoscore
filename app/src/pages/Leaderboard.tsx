import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import AnimatedNumber from '../components/ui/AnimatedNumber'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { shortenAddress } from '../utils/formatters'

type LeaderboardTab = 'winRate' | 'earnings' | 'active' | 'streak'

export function Leaderboard() {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('winRate')

  // Fetch leaderboard data from UserStats accounts
  const { data: leaderboardData, isLoading } = useLeaderboard({ enabled: true })

  const sortedData = useMemo(() => {
    if (!leaderboardData || leaderboardData.length === 0) {
      return []
    }

    const data = [...leaderboardData]

    switch (activeTab) {
      case 'winRate':
        // Sort by win rate (highest first), filter users with at least 1 market
        return data
          .filter(t => t.totalMarkets > 0)
          .sort((a, b) => b.winRate - a.winRate)
      case 'earnings':
        // Sort by net profit (highest first)
        return data.sort((a, b) => {
          const aProfit = Number(a.netProfit) / LAMPORTS_PER_SOL
          const bProfit = Number(b.netProfit) / LAMPORTS_PER_SOL
          return bProfit - aProfit
        })
      case 'active':
        // Sort by total markets (most active first)
        return data.sort((a, b) => b.totalMarkets - a.totalMarkets)
      case 'streak':
        // Sort by best streak (highest first)
        return data
          .filter(t => t.bestStreak > 0)
          .sort((a, b) => b.bestStreak - a.bestStreak)
      default:
        return data
    }
  }, [leaderboardData, activeTab])

  const TabButton = ({
    tab,
    label,
    icon,
  }: {
    tab: LeaderboardTab
    label: string
    icon: string
  }) => {
    const isActive = activeTab === tab
    return (
      <Button
        variant={isActive ? 'default' : 'secondary'}
        size="sm"
        onClick={() => setActiveTab(tab)}
        className="gap-2"
      >
        <span className={`icon-[${icon}] w-4 h-4`} />
        <span>{label}</span>
      </Button>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1)
      return '🥇'
    if (rank === 2)
      return '🥈'
    if (rank === 3)
      return '🥉'
    return `#${rank}`
  }

  const getRankColor = (rank: number) => {
    if (rank === 1)
      return 'var(--accent-amber)'
    if (rank === 2)
      return 'var(--text-tertiary)'
    if (rank === 3)
      return 'var(--accent-red)'
    return 'var(--text-secondary)'
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/markets"
            className="text-sm font-medium flex items-center gap-2 mb-3 hover:underline"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            <span className="icon-[mdi--arrow-left]" />
            Back to Markets
          </Link>
          <div className="flex items-center gap-3">
            <span className="icon-[mdi--trophy] w-10 h-10" style={{ color: 'var(--accent-amber)' }} />
            <h1 className="font-jakarta text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Leaderboard
            </h1>
          </div>
          <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
            Top traders on CryptoScore
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <TabButton tab="winRate" label="Win Rate" icon="mdi--trophy-outline" />
          <TabButton tab="earnings" label="Earnings" icon="mdi--cash-multiple" />
          <TabButton tab="active" label="Most Active" icon="mdi--fire" />
          <TabButton tab="streak" label="Best Streak" icon="mdi--lightning-bolt" />
        </div>

        {/* Leaderboard Table */}
        <Card>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array.from({ length: 10 })].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
                    <div className="w-12 h-12 skeleton rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 w-32 skeleton rounded mb-2" />
                      <div className="h-3 w-24 skeleton rounded" />
                    </div>
                    <div className="h-6 w-20 skeleton rounded" />
                  </div>
                ))}
              </div>
            ) : sortedData.length === 0 ? (
              <div className="text-center py-16">
                <span className="icon-[mdi--trophy-broken] w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No leaderboard data yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedData.slice(0, 50).map((trader, index) => {
                  const rank = index + 1
                  const netProfitSOL = Number(trader.netProfit) / LAMPORTS_PER_SOL
                  const totalWageredSOL = Number(trader.totalWagered) / LAMPORTS_PER_SOL
                  const totalWonSOL = Number(trader.totalWon) / LAMPORTS_PER_SOL

                  return (
                    <div
                      key={trader.address}
                      className="flex items-center gap-4 p-4 rounded-lg transition-all"
                      style={{ background: 'var(--bg-secondary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    >
                      {/* Rank */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg"
                            style={{
                              background: rank <= 3 ? `${getRankColor(rank)}20` : 'var(--bg-primary)',
                              color: getRankColor(rank),
                            }}
                          >
                            {getRankIcon(rank)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Rank #
                            {rank}
                          </p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Trader Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {shortenAddress(trader.address)}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {trader.totalMarkets}
                          {' '}
                          markets •
                          {' '}
                          {trader.wins + trader.losses}
                          {' '}
                          resolved
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="text-right">
                        {activeTab === 'winRate' && (
                          <div>
                            <div className="font-bold text-lg" style={{ color: 'var(--accent-green)' }}>
                              <AnimatedNumber value={trader.winRate} decimals={1} suffix="%" />
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {trader.wins}
                              W /
                              {' '}
                              {trader.losses}
                              L
                            </div>
                          </div>
                        )}
                        {activeTab === 'earnings' && (
                          <div>
                            <div
                              className="font-bold text-lg"
                              style={{ color: netProfitSOL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}
                            >
                              <AnimatedNumber
                                value={netProfitSOL}
                                decimals={2}
                                suffix=" SOL"
                              />
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              {totalWageredSOL.toFixed(2)}
                              {' '}
                              wagered •
                              {' '}
                              {totalWonSOL.toFixed(2)}
                              {' '}
                              won
                            </div>
                          </div>
                        )}
                        {activeTab === 'active' && (
                          <div>
                            <div className="font-bold text-lg" style={{ color: 'var(--accent-cyan)' }}>
                              {trader.totalMarkets}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              markets participated
                            </div>
                          </div>
                        )}
                        {activeTab === 'streak' && (
                          <div>
                            <div className="font-bold text-lg" style={{ color: 'var(--accent-amber)' }}>
                              {trader.bestStreak}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                              best streak
                              {trader.currentStreak !== 0 && (
                                <>
                                  {' '}
                                  •
                                  {' '}
                                  {trader.currentStreak > 0 ? '+' : ''}
                                  {trader.currentStreak}
                                  {' '}
                                  current
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
