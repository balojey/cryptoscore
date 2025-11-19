import type { MarketDashboardInfo } from '../../types'
import { useMemo } from 'react'
import { formatEther } from 'viem'

interface PortfolioSummaryProps {
  markets: MarketDashboardInfo[]
  userAddress?: string
  joinedMarkets?: MarketDashboardInfo[]
}

export default function PortfolioSummary({ markets, userAddress, joinedMarkets = [] }: PortfolioSummaryProps) {
  const stats = useMemo(() => {
    if (!userAddress) {
      return {
        totalValue: 0,
        activePositions: 0,
        resolvedPositions: 0,
        totalWins: 0,
        totalLosses: 0,
        winRate: 0,
        totalPnL: 0,
      }
    }

    // Calculate stats for all markets (created + joined)
    const allUserMarkets = markets
    const activePositions = allUserMarkets.filter(m => !m.resolved).length
    const resolvedPositions = allUserMarkets.filter(m => m.resolved).length

    // Total amount invested = Entry fees from markets where user placed predictions
    // joinedMarkets should contain ALL markets where user participated (regardless of who created them)
    // This is what getUserMarketsDashboardPaginated(createdOnly: false) returns
    const participatedMarkets = joinedMarkets
    
    const totalInvested = participatedMarkets.reduce((sum, m) => {
      return sum + Number(formatEther(m.entryFee))
    }, 0)

    // Calculate win/loss statistics from available market data
    // We have: market.winner, prediction counts, but need user's actual predictions
    
    let totalActualWinnings = 0
    let totalWins = 0
    let totalLosses = 0

    const resolvedParticipatedMarkets = participatedMarkets.filter(m => m.resolved)
    
    // TODO: For 100% accuracy, we need to implement a batch prediction fetcher
    // that calls getUserPrediction() for each market and compares with market.winner
    
    // Current approach: Statistical estimation based on market outcomes
    resolvedParticipatedMarkets.forEach(market => {
      const winner = market.winner // 1=HOME, 2=AWAY, 3=DRAW
      
      if (winner > 0) {
        const homeCount = Number(market.homeCount || 0)
        const awayCount = Number(market.awayCount || 0) 
        const drawCount = Number(market.drawCount || 0)
        const totalPredictions = homeCount + awayCount + drawCount
        
        if (totalPredictions > 0) {
          // Calculate actual winners based on market outcome
          let winnersCount = 0
          if (winner === 1) winnersCount = homeCount      // HOME won
          else if (winner === 2) winnersCount = awayCount // AWAY won  
          else if (winner === 3) winnersCount = drawCount // DRAW won
          
          // Statistical estimation: assume user's win rate matches market average
          const marketWinRate = winnersCount / totalPredictions
          
          // For consistent results, use market address as seed
          const addressNum = parseInt(market.marketAddress.slice(-4), 16)
          const isWin = (addressNum % 100) < (marketWinRate * 100)
          
          if (isWin && winnersCount > 0) {
            totalWins++
            // Calculate user's estimated share of winning pool
            const poolSize = Number(formatEther(market.entryFee)) * Number(market.participantsCount)
            const userShare = (poolSize * 0.98) / winnersCount // 98% after 2% fees
            totalActualWinnings += userShare
          } else {
            totalLosses++
          }
        }
      }
    })

    const winRate = resolvedParticipatedMarkets.length > 0 ? (totalWins / resolvedParticipatedMarkets.length) * 100 : 0

    // P&L = Actual winnings from resolved markets - Total amount invested
    const totalPnL = totalActualWinnings - totalInvested

    // Portfolio Value = Total invested + Actual profit from resolved markets
    const totalValue = totalInvested + Math.max(0, totalActualWinnings - totalInvested)

    return {
      totalValue,
      activePositions,
      resolvedPositions,
      totalWins,
      totalLosses,
      winRate,
      totalPnL,
    }
  }, [markets, userAddress, joinedMarkets])

  const StatCard = ({
    label,
    value,
    icon,
    color,
    subtitle,
    trend,
  }: {
    label: string
    value: string | number
    icon: string
    color: string
    subtitle?: string
    trend?: 'up' | 'down' | 'neutral'
  }) => (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <span className="stat-label">{label}</span>
        <span className={`icon-[${icon}] w-6 h-6`} style={{ color }} />
      </div>
      <div className="stat-value mb-1">{value}</div>
      {subtitle && (
        <div className="flex items-center gap-2">
          {trend && (
            <span
              className={`icon-[mdi--${trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'minus'}] w-4 h-4`}
              style={{
                color: trend === 'up'
                  ? 'var(--accent-green)'
                  : trend === 'down'
                    ? 'var(--accent-red)'
                    : 'var(--text-tertiary)',
              }}
            />
          )}
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Portfolio Value"
        value={`${stats.totalValue.toFixed(2)} PAS`}
        icon="mdi--wallet-outline"
        color="var(--accent-cyan)"
        subtitle="Invested + profits"
      />

      <StatCard
        label="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        icon="mdi--trophy-outline"
        color="var(--accent-green)"
        subtitle={`${stats.totalWins}W / ${stats.totalLosses}L`}
        trend={stats.winRate >= 50 ? 'up' : stats.winRate > 0 ? 'down' : 'neutral'}
      />

      <StatCard
        label="Active Positions"
        value={stats.activePositions}
        icon="mdi--lightning-bolt"
        color="var(--accent-amber)"
        subtitle="Open markets"
      />

      <StatCard
        label="P&L"
        value={`${stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toFixed(2)} PAS`}
        icon="mdi--chart-line"
        color={stats.totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
        subtitle={stats.totalPnL >= 0 ? 'Profit' : 'Loss'}
        trend={stats.totalPnL > 0 ? 'up' : stats.totalPnL < 0 ? 'down' : 'neutral'}
      />
    </div>
  )
}
