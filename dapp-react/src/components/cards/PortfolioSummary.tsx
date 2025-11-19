import type { Market } from '../../types'
import { useMemo } from 'react'
import { formatEther } from 'viem'

interface PortfolioSummaryProps {
  markets: Market[]
  userAddress?: string
}

export default function PortfolioSummary({ markets, userAddress }: PortfolioSummaryProps) {
  const stats = useMemo(() => {
    if (!markets.length || !userAddress) {
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

    const activePositions = markets.filter(m => !m.resolved).length
    const resolvedPositions = markets.filter(m => m.resolved).length

    // Calculate total value (sum of entry fees paid)
    const totalValue = markets.reduce((sum, m) => {
      return sum + Number(formatEther(m.entryFee))
    }, 0)

    // For now, we'll estimate wins/losses based on resolved markets
    // In a real implementation, you'd fetch actual win/loss data from the contract
    const totalWins = Math.floor(resolvedPositions * 0.6) // Placeholder
    const totalLosses = resolvedPositions - totalWins
    const winRate = resolvedPositions > 0 ? (totalWins / resolvedPositions) * 100 : 0

    // Estimate P&L (placeholder calculation)
    const avgPoolSize = markets.reduce((sum, m) => {
      return sum + (Number(formatEther(m.entryFee)) * Number(m.participantsCount))
    }, 0) / markets.length || 0

    const estimatedWinnings = totalWins * (avgPoolSize * 0.95) // 95% after fees
    const totalSpent = totalValue
    const totalPnL = estimatedWinnings - totalSpent

    return {
      totalValue,
      activePositions,
      resolvedPositions,
      totalWins,
      totalLosses,
      winRate,
      totalPnL,
    }
  }, [markets, userAddress])

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
        label="Total Value"
        value={`${stats.totalValue.toFixed(2)} PAS`}
        icon="mdi--wallet-outline"
        color="var(--accent-cyan)"
        subtitle="Total invested"
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
