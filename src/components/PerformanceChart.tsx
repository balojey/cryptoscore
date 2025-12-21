import type { MarketDashboardInfo } from '../types'
import { useMemo } from 'react'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import { useUserParticipantData } from '../hooks/useUserParticipantData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PerformanceChartProps {
  markets: MarketDashboardInfo[]
}

export default function PerformanceChart({ markets }: PerformanceChartProps) {
  const { publicKey } = useUnifiedWallet()
  const { data: participantData } = useUserParticipantData(publicKey || undefined)

  // Calculate wins and losses from market data and participant predictions
  const chartData = useMemo(() => {
    const resolvedMarkets = markets.filter(m => m.resolved && m.outcome)

    if (resolvedMarkets.length === 0 || !publicKey || !participantData) {
      return {
        wins: 0,
        losses: 0,
        total: 0,
        winPercentage: 0,
        lossPercentage: 0,
      }
    }

    // Create a map of market address to user prediction
    const predictionMap = new Map<string, number>()
    participantData.forEach((participant) => {
      predictionMap.set(participant.marketAddress.toLowerCase(), participant.prediction)
    })

    let wins = 0
    let losses = 0

    resolvedMarkets.forEach((market) => {
      const userPrediction = predictionMap.get(market.marketAddress.toLowerCase())

      // Skip if user didn't participate in this market
      if (userPrediction === undefined)
        return

      // Convert outcome to prediction number for comparison
      // Prediction: 0=Home, 1=Draw, 2=Away
      // Outcome: 'Home', 'Draw', 'Away'
      let outcomeValue: number
      if (market.outcome === 'Home')
        outcomeValue = 0
      else if (market.outcome === 'Draw')
        outcomeValue = 1
      else if (market.outcome === 'Away')
        outcomeValue = 2
      else return // Skip if outcome is invalid

      // Check if user's prediction matches the outcome
      if (userPrediction === outcomeValue) {
        wins++
      }
      else {
        losses++
      }
    })

    const total = wins + losses
    const winPercentage = total > 0 ? (wins / total) * 100 : 0
    const lossPercentage = total > 0 ? (losses / total) * 100 : 0

    return {
      wins,
      losses,
      total,
      winPercentage,
      lossPercentage,
    }
  }, [markets, publicKey, participantData])

  if (chartData.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <span className="icon-[mdi--chart-line] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No resolved markets yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Overview</CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Win/Loss Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Win Rate
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--accent-green)' }}>
              {chartData.winPercentage.toFixed(1)}
              %
            </span>
          </div>
          <div className="h-8 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-secondary)' }}>
            {chartData.winPercentage > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${chartData.winPercentage}%`,
                  background: 'linear-gradient(90deg, var(--accent-green) 0%, var(--accent-cyan) 100%)',
                }}
              />
            )}
            {chartData.lossPercentage > 0 && (
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${chartData.lossPercentage}%`,
                  background: 'var(--accent-red)',
                }}
              />
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent-green)' }}>
              {chartData.wins}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Wins
            </div>
          </div>

          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--accent-red)' }}>
              {chartData.losses}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Losses
            </div>
          </div>

          <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {chartData.total}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Total
            </div>
          </div>
        </div>

        {/* Performance Indicator */}
        <div
          className="mt-6 p-4 rounded-lg"
          style={{
            background: chartData.winPercentage >= 50 ? 'var(--success-bg)' : 'var(--error-bg)',
            border: `1px solid ${chartData.winPercentage >= 50 ? 'var(--success-border)' : 'var(--error-border)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className={`icon-[mdi--${chartData.winPercentage >= 50 ? 'trending-up' : 'trending-down'}] w-5 h-5`}
              style={{ color: chartData.winPercentage >= 50 ? 'var(--accent-green)' : 'var(--accent-red)' }}
            />
            <span
              className="text-sm font-medium"
              style={{
                color: chartData.winPercentage >= 50 ? 'var(--accent-green)' : 'var(--accent-red)',
              }}
            >
              {chartData.winPercentage >= 50 ? 'Profitable' : 'Needs Improvement'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
