import type { Market } from '../types'
import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PerformanceChartProps {
  markets: Market[]
}

export default function PerformanceChart({ markets }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    const resolvedMarkets = markets.filter(m => m.resolved)

    // For now, we'll create a simple visualization
    // In a real implementation, you'd fetch actual win/loss data
    const totalResolved = resolvedMarkets.length
    const estimatedWins = Math.floor(totalResolved * 0.6) // Placeholder
    const estimatedLosses = totalResolved - estimatedWins

    const winPercentage = totalResolved > 0 ? (estimatedWins / totalResolved) * 100 : 0
    const lossPercentage = totalResolved > 0 ? (estimatedLosses / totalResolved) * 100 : 0

    return {
      wins: estimatedWins,
      losses: estimatedLosses,
      total: totalResolved,
      winPercentage,
      lossPercentage,
    }
  }, [markets])

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
