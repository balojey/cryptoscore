import type { Market, MarketDashboardInfo } from '../../types'
import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface PoolTrendChartProps {
  markets: (Market | MarketDashboardInfo)[]
}

export default function PoolTrendChart({ markets }: PoolTrendChartProps) {
  const chartData = useMemo(() => {
    if (!markets || markets.length === 0)
      return []

    // Sort markets by start time
    const sortedMarkets = [...markets].sort((a, b) =>
      Number(a.startTime) - Number(b.startTime),
    )

    // Group by date and calculate average pool size
    const dataByDate = new Map<string, { total: number, count: number }>()

    sortedMarkets.forEach((market) => {
      const date = new Date(Number(market.startTime) * 1000)
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
      const poolSize = (Number(market.entryFee) / 1_000_000_000) * Number(market.participantsCount)

      const existing = dataByDate.get(dateKey) || { total: 0, count: 0 }
      dataByDate.set(dateKey, {
        total: existing.total + poolSize,
        count: existing.count + 1,
      })
    })

    // Convert to chart data
    return Array.from(dataByDate.entries()).map(([date, data]) => ({
      date,
      avgPool: Number((data.total / data.count).toFixed(2)),
      totalPool: Number(data.total.toFixed(2)),
      markets: data.count,
    }))
  }, [markets])

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title mb-4">Pool Size Trends</h3>
        <div className="text-center py-8">
          <span className="icon-[mdi--chart-line] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No trend data available</p>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="px-3 py-2 rounded-lg"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: 'var(--accent-cyan)' }}>
            Avg Pool:
            {' '}
            {payload[0].value}
            {' '}
            SOL
          </p>
          <p className="text-xs" style={{ color: 'var(--accent-green)' }}>
            Total:
            {' '}
            {payload[1].value}
            {' '}
            SOL
          </p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Markets:
            {' '}
            {payload[0].payload.markets}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card">
      <h3 className="card-title mb-4">Pool Size Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
          <XAxis
            dataKey="date"
            stroke="var(--text-tertiary)"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="var(--text-tertiary)"
            style={{ fontSize: '12px' }}
            label={{
              value: 'SOL',
              angle: -90,
              position: 'insideLeft',
              style: { fill: 'var(--text-tertiary)' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}
          />
          <Line
            type="monotone"
            dataKey="avgPool"
            stroke="#00D4FF"
            strokeWidth={2}
            name="Avg Pool"
            dot={{ fill: '#00D4FF', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="totalPool"
            stroke="#00FF88"
            strokeWidth={2}
            name="Total Pool"
            dot={{ fill: '#00FF88', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
