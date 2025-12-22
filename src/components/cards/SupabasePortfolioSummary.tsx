/**
 * Supabase Portfolio Summary Component
 * 
 * Replaces PortfolioSummary.tsx with Supabase-based data fetching
 * for portfolio metrics and statistics.
 */

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { useMnee } from '@/hooks/useMnee'
import { useSupabasePortfolioSummary, useSupabaseUserBalance } from '@/hooks/useSupabaseDashboardData'
import type { SupabaseMarketDashboardInfo } from '@/hooks/useSupabaseDashboardData'

interface SupabasePortfolioSummaryProps {
  userId?: string
  allMarkets?: SupabaseMarketDashboardInfo[]
}

export default function SupabasePortfolioSummary({ 
  userId, 
  allMarkets = [] 
}: SupabasePortfolioSummaryProps) {
  const { formatCurrency, currency } = useCurrency()
  
  // Fetch portfolio summary from Supabase
  const { 
    data: portfolioData, 
    isLoading: isLoadingPortfolio 
  } = useSupabasePortfolioSummary(userId)

  // Fetch user balance from Supabase
  const { 
    data: userBalance, 
    isLoading: isLoadingBalance 
  } = useSupabaseUserBalance(userId)

  // Calculate additional stats from market data
  const additionalStats = useMemo(() => {
    if (!userId || allMarkets.length === 0) {
      return {
        totalValue: 0,
        activePositions: 0,
        claimableWinnings: 0,
      }
    }

    // Calculate active positions (markets user joined that are still active)
    const activePositions = allMarkets.filter(market => 
      market.status === 'active' && market.userParticipation
    ).length

    // Calculate claimable winnings (resolved markets where user won but hasn't withdrawn)
    const claimableWinnings = allMarkets
      .filter(market => 
        market.status === 'resolved' && 
        market.userParticipation?.actual_winnings && 
        market.userParticipation.actual_winnings > 0
      )
      .reduce((sum, market) => sum + (market.userParticipation?.actual_winnings || 0), 0)

    // Calculate total portfolio value
    // Active positions: entry amounts at risk
    const activePositionsValue = allMarkets
      .filter(market => market.status === 'active' && market.userParticipation)
      .reduce((sum, market) => sum + (market.userParticipation?.entry_amount || 0), 0)

    const totalValue = activePositionsValue + claimableWinnings

    return {
      totalValue,
      activePositions,
      claimableWinnings,
    }
  }, [userId, allMarkets])

  // Show loading state
  if (isLoadingPortfolio || isLoadingBalance) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-300 rounded mb-3"></div>
                <div className="h-8 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Use portfolio data or fallback to calculated stats
  const stats = portfolioData ? {
    totalValue: additionalStats.totalValue,
    activePositions: additionalStats.activePositions,
    totalWinnings: portfolioData.total_winnings,
    totalSpent: portfolioData.total_spent,
    netProfitLoss: portfolioData.net_profit_loss,
    marketsParticipated: portfolioData.total_markets_joined,
    marketsWon: Math.floor((portfolioData.win_rate / 100) * portfolioData.total_resolved_positions),
    winRate: portfolioData.win_rate,
    activeMarkets: portfolioData.total_active_positions,
  } : {
    totalValue: 0,
    activePositions: 0,
    totalWinnings: 0,
    totalSpent: 0,
    netProfitLoss: 0,
    marketsParticipated: 0,
    marketsWon: 0,
    winRate: 0,
    activeMarkets: 0,
  }

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

  // Format portfolio value (convert from decimal to lamports for display)
  const portfolioValueLamports = stats.totalValue * 1_000_000_000
  const portfolioValueFormatted = formatCurrency(portfolioValueLamports, { showSymbol: true })
  const portfolioValueSubtitle = currency !== 'SOL'
    ? formatCurrency(portfolioValueLamports, { targetCurrency: 'SOL', showSymbol: true })
    : 'Invested + claimable'

  // Format P&L (convert from decimal to lamports for display)
  const pnlLamports = Math.abs(stats.netProfitLoss) * 1_000_000_000
  const pnlSign = stats.netProfitLoss >= 0 ? '+' : '-'
  const pnlFormatted = `${pnlSign}${formatCurrency(pnlLamports, { showSymbol: true })}`
  const pnlSubtitle = currency !== 'SOL'
    ? formatCurrency(pnlLamports, { targetCurrency: 'SOL', showSymbol: true })
    : stats.netProfitLoss >= 0 ? 'Profit' : 'Loss'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Portfolio Value"
        value={portfolioValueFormatted}
        icon="mdi--wallet-outline"
        color="var(--accent-cyan)"
        subtitle={portfolioValueSubtitle}
      />

      <StatCard
        label="Win Rate"
        value={`${stats.winRate.toFixed(1)}%`}
        icon="mdi--trophy-outline"
        color="var(--accent-green)"
        subtitle={`${stats.marketsWon}W / ${stats.marketsParticipated - stats.marketsWon}L`}
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
        value={pnlFormatted}
        icon="mdi--chart-line"
        color={stats.netProfitLoss >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}
        subtitle={pnlSubtitle}
        trend={stats.netProfitLoss > 0 ? 'up' : stats.netProfitLoss < 0 ? 'down' : 'neutral'}
      />
    </div>
  )
}