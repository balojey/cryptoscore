import type { MarketDashboardInfo } from '../../types'
import { useMemo } from 'react'
import { formatEther } from 'viem'
import { useReadContracts } from 'wagmi'
import { Card, CardContent } from '@/components/ui/card'
import { CryptoScoreMarketABI } from '../../config/contracts'

interface PortfolioSummaryProps {
  userAddress?: string
  joinedMarkets?: MarketDashboardInfo[]
}

export default function PortfolioSummary({ userAddress, joinedMarkets = [] }: PortfolioSummaryProps) {
  // Fetch user predictions and rewards for all joined markets
  const contractCalls = useMemo(() => {
    if (!userAddress || joinedMarkets.length === 0)
      return []

    const calls = joinedMarkets.flatMap(market => [
      {
        address: market.marketAddress,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getUserPrediction' as const,
        args: [userAddress] as const,
      },
      {
        address: market.marketAddress,
        abi: CryptoScoreMarketABI as any,
        functionName: 'rewards' as const,
        args: [userAddress] as const,
      },
    ])

    return calls
  }, [userAddress, joinedMarkets])

  const { data: contractData } = useReadContracts({
    contracts: contractCalls,
    query: {
      enabled: contractCalls.length > 0,
    },
  })

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

    // Active positions = markets user joined that are still open (not resolved)
    const activePositions = joinedMarkets.filter(m => !m.resolved).length
    const resolvedPositions = joinedMarkets.filter(m => m.resolved).length

    // Parse contract data to get predictions and rewards
    const userMarketData = joinedMarkets.map((market, index) => {
      const predictionResult = contractData?.[index * 2]
      const rewardResult = contractData?.[index * 2 + 1]

      return {
        market,
        prediction: predictionResult?.status === 'success' ? Number(predictionResult.result) : 0,
        reward: rewardResult?.status === 'success' ? rewardResult.result as bigint : 0n,
      }
    })

    // Calculate total invested (entry fees for all participated markets)
    const totalInvested = joinedMarkets.reduce((sum, m) => {
      return sum + Number(formatEther(m.entryFee))
    }, 0)

    // Calculate total claimable rewards
    const totalClaimableRewards = userMarketData.reduce((sum, data) => {
      return sum + Number(formatEther(data.reward))
    }, 0)

    // Calculate wins and losses based on actual predictions
    let totalWins = 0
    let totalLosses = 0
    let totalActualWinnings = 0

    const resolvedMarkets = userMarketData.filter(data => data.market.resolved)

    resolvedMarkets.forEach((data) => {
      const { market, prediction, reward } = data
      const winner = market.winner // 1=HOME, 2=AWAY, 3=DRAW, 0=NONE

      // If market is resolved and has a winner
      if (winner > 0 && prediction > 0) {
        // Check if user's prediction matches the winner
        if (prediction === winner) {
          totalWins++
          totalActualWinnings += Number(formatEther(reward))
        }
        else {
          totalLosses++
        }
      }
    })

    const winRate = resolvedMarkets.length > 0 ? (totalWins / resolvedMarkets.length) * 100 : 0

    // P&L = Total winnings (claimed + claimable) - Total invested
    const totalPnL = totalActualWinnings + totalClaimableRewards - totalInvested

    // Portfolio Value = Value in active positions + Claimable rewards
    // Active positions value = entry fees for unresolved markets
    const activePositionsValue = joinedMarkets
      .filter(m => !m.resolved)
      .reduce((sum, m) => sum + Number(formatEther(m.entryFee)), 0)

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
  }, [userAddress, joinedMarkets, contractData])

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
