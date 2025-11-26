import type { Market, MarketDashboardInfo } from '../../types'
import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface PredictionDistributionChartProps {
  markets: (Market | MarketDashboardInfo)[]
}

export default function PredictionDistributionChart({ markets }: PredictionDistributionChartProps) {
  const chartData = useMemo(() => {
    // Aggregate prediction data across all markets using real contract data
    let totalHome = 0
    let totalDraw = 0
    let totalAway = 0

    markets.forEach((market) => {
      // Use real prediction counts from contract
      totalHome += Number(market.homeCount || 0)
      totalAway += Number(market.awayCount || 0)
      totalDraw += Number(market.drawCount || 0)
    })

    const total = totalHome + totalDraw + totalAway

    if (total === 0)
      return []

    return [
      { name: 'Home Win', value: totalHome, percentage: ((totalHome / total) * 100).toFixed(1) },
      { name: 'Draw', value: totalDraw, percentage: ((totalDraw / total) * 100).toFixed(1) },
      { name: 'Away Win', value: totalAway, percentage: ((totalAway / total) * 100).toFixed(1) },
    ]
  }, [markets])

  const COLORS = ['#00D4FF', '#FFB800', '#FF3366'] // Cyan, Amber, Red

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title mb-4">Prediction Distribution</h3>
        <div className="text-center py-8">
          <span className="icon-[mdi--chart-pie] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No prediction data available</p>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="px-3 py-2 rounded-lg"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {payload[0].name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {payload[0].value}
            {' '}
            predictions (
            {payload[0].payload.percentage}
            %)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="card">
      <h3 className="card-title mb-4">Prediction Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props: any) => `${props.name}: ${props.payload.percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              color: 'var(--text-secondary)',
              fontSize: '14px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
