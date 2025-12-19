import type { Market, MarketDashboardInfo } from '../../types'
import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCurrency } from '@/hooks/useCurrency'

interface PoolTrendChartProps {
  markets: (Market | MarketDashboardInfo)[]
}

export default function PoolTrendChart({ markets }: PoolTrendChartProps) {
  const { currency, convertFromLamports, formatCurrency } = useCurrency()

  const chartData = useMemo(() => {
    if (!markets || markets.length === 0)
      return []

    // Sort markets by start time
    const sortedMarkets = [...markets].sort((a, b) =>
      Number(a.startTime) - Number(b.startTime),
    )

    // Group by date and calculate average pool size in lamports
    const dataByDate = new Map<string, { totalLamports: number, count: number }>()

    sortedMarkets.forEach((market) => {
      const date = new Date(Number(market.startTime) * 1000)
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      // Calculate pool size in lamports
      const poolSizeLamports = Number(market.entryFee) * Number(market.participantsCount)

      const existing = dataByDate.get(dateKey) || { totalLamports: 0, count: 0 }
      dataByDate.set(dateKey, {
        totalLamports: existing.totalLamports + poolSizeLamports,
        count: existing.count + 1,
      })
    })

    // Convert to chart data with currency conversion
    return Array.from(dataByDate.entries()).map(([date, data]) => {
      const avgLamports = data.totalLamports / data.count
      const totalLamports = data.totalLamports

      return {
        date,
        avgPool: Number(convertFromLamports(avgLamports).toFixed(currency === 'SOL' ? 4 : 2)),
        totalPool: Number(convertFromLamports(totalLamports).toFixed(currency === 'SOL' ? 4 : 2)),
        avgPoolLamports: avgLamports,
        totalPoolLamports: totalLamports,
        markets: data.count,
      }
    })
  }, [markets, convertFromLamports, currency])

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
      const avgPoolLamports = payload[0].payload.avgPoolLamports
      const totalPoolLamports = payload[0].payload.totalPoolLamports

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
            {formatCurrency(avgPoolLamports, { showSOLEquivalent: currency !== 'SOL' })}
          </p>
          <p className="text-xs" style={{ color: 'var(--accent-green)' }}>
            Total:
            {' '}
            {formatCurrency(totalPoolLamports, { showSOLEquivalent: currency !== 'SOL' })}
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
              value: currency,
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
