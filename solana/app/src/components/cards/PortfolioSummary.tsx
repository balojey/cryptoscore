import type { MarketDashboardInfo } from '../../types'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card, CardContent } from '@/components/ui/card'
import { useMarketData } from '../../hooks/useMarketData'
import { formatSOL } from '../../utils/formatters'

interface PortfolioSummaryProps {
  userAddress?: string
  joinedMarkets?: MarketDashboardInfo[]
}

export default function PortfolioSummary({ userAddress, joinedMarkets = [] }: PortfolioSummaryProps) {
  const { publicKey } = useWallet()
  const walletAddress = userAddress || publicKey?.toString()

  // For now, we'll use a simplified approach since we don't have the full Solana integration yet
  // This will be enhanced when the Solana hooks are fully implemented
  const { data: portfolioData } = useQuery({
    queryKey: ['portfolioData', walletAddress, joinedMarkets.map(m => m.marketAddress).join(',')],
    queryFn: async () => {
      if (!walletAddress || joinedMarkets.length === 0) {
        return {
          userMarketData: [],
          withdrawnRewards: {},
        }
      }

      // TODO: Implement Solana-specific data fetching
      // For now, return mock data structure
      const userMarketData = joinedMarkets.map(market => ({
        market,
        prediction: 0, // Will be fetched from Solana program
        reward: 0, // Will be fetched from Solana program
        hasWithdrawn: false, // Will be fetched from Solana program
      }))

      return {
        userMarketData,
        withdrawnRewards: {} as Record<string, number>,
      }
    },
    enabled: !!walletAddress && joinedMarkets.length > 0,
    staleTime: 30000, // Cache for 30 seconds
  })

  const stats = useMemo(() => {
    if (!walletAddress) {
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

    // Active positions = markets user joined that are still open (not resolved)
    const activePositions = joinedMarkets.filter(m => !m.resolved).length
    const resolvedPositions = joinedMarkets.filter(m => m.resolved).length

    const userMarketData = portfolioData?.userMarketData || []
    const withdrawnRewards = portfolioData?.withdrawnRewards || {}

    // Calculate total invested (entry fees for all participated markets) - convert from lamports to SOL
    const totalInvested = joinedMarkets.reduce((sum, m) => {
      return sum + (m.entryFee / 1_000_000_000) // Convert lamports to SOL
    }, 0)

    // Calculate total claimable rewards (not yet withdrawn) - convert from lamports to SOL
    const totalClaimableRewards = userMarketData.reduce((sum, data) => {
      return sum + (data.reward / 1_000_000_000) // Convert lamports to SOL
    }, 0)

    // Calculate total withdrawn rewards (already claimed) - convert from lamports to SOL
    const totalWithdrawnRewards = Object.values(withdrawnRewards).reduce((sum, amount) => {
      return sum + (amount / 1_000_000_000) // Convert lamports to SOL
    }, 0)

    // Calculate wins and losses based on actual predictions
    let totalWins = 0
    let totalLosses = 0

    const resolvedMarkets = userMarketData.filter(data => data.market.resolved)

    resolvedMarkets.forEach((data) => {
      const { market, prediction } = data
      const winner = market.winner // 1=HOME, 2=AWAY, 3=DRAW, 0=NONE

      // If market is resolved and has a winner
      if (winner > 0 && prediction > 0) {
        // Check if user's prediction matches the winner
        if (prediction === winner) {
          totalWins++
        }
        else {
          totalLosses++
        }
      }
    })

    const winRate = resolvedMarkets.length > 0 ? (totalWins / resolvedMarkets.length) * 100 : 0

    // P&L = (Withdrawn rewards + Claimable rewards) - Total invested
    // This gives the true profit/loss including both claimed and unclaimed winnings
    const totalPnL = (totalWithdrawnRewards + totalClaimableRewards) - totalInvested

    // Portfolio Value = Value in active positions + Claimable rewards
    // Active positions value = entry fees for unresolved markets
    const activePositionsValue = joinedMarkets
      .filter(m => !m.resolved)
      .reduce((sum, m) => sum + (m.entryFee / 1_000_000_000), 0) // Convert lamports to SOL

    const totalValue = activePositionsValue + totalClaimableRewards

    return {
      totalValue,
      activePositions,
      resolvedPositions,
      totalWins,
      totalLosses,
      winRate,
      totalPnL,
    }
  }, [walletAddress, joinedMarkets, portfolioData])

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
    <Card>
      <CardContent>
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
      </CardContent>
    </Card>
  )

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Portfolio Value"
        value={formatSOL(stats.totalValue * 1_000_000_000, 2)} // Convert back to lamports for formatting
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
        value={`${stats.totalPnL >= 0 ? '+' : ''}${formatSOL(Math.abs(stats.totalPnL) * 1_000_000_000, 2, false)} SOL`}
        icon="mdi--chart-line"
        color={stats.totalPnL >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
        subtitle={stats.totalPnL >= 0 ? 'Profit' : 'Loss'}
        trend={stats.totalPnL > 0 ? 'up' : stats.totalPnL < 0 ? 'down' : 'neutral'}
      />
    </div>
  )
}
