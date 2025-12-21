import type { Market, MarketDashboardInfo } from '../../types'
import { useMemo } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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

    return [
      { 
        name: 'Home Win', 
        value: totalHome, 
        percentage: total > 0 ? ((totalHome / total) * 100).toFixed(1) : '0',
        color: 'var(--accent-green)'
      },
      { 
        name: 'Draw', 
        value: totalDraw, 
        percentage: total > 0 ? ((totalDraw / total) * 100).toFixed(1) : '0',
        color: 'var(--accent-amber)'
      },
      { 
        name: 'Away Win', 
        value: totalAway, 
        percentage: total > 0 ? ((totalAway / total) * 100).toFixed(1) : '0',
        color: 'var(--accent-red)'
      },
    ]
  }, [markets])

  const maxValue = Math.max(...chartData.map(d => d.value))
  const hasData = chartData.some(d => d.value > 0)

  if (!hasData) {
    return (
      <div className="card">
        <h3 className="card-title mb-4">Prediction Distribution</h3>
        <div className="text-center py-8">
          <span className="icon-[mdi--chart-bar] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No prediction data available</p>
        </div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div
          className="px-3 py-2 rounded-lg shadow-lg"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            {label}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {data.value} predictions ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }



  return (
    <div className="card">
      <h3 className="card-title mb-4">Prediction Distribution</h3>
      <div style={{ width: '100%', height: '320px' }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <XAxis 
              dataKey="name"
              tick={{ 
                fontSize: 12, 
                fill: 'var(--text-secondary)' 
              }}
              axisLine={{ stroke: 'var(--border-default)' }}
              tickLine={{ stroke: 'var(--border-default)' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              domain={[0, maxValue > 0 ? maxValue * 1.1 : 10]}
              tick={{ 
                fontSize: 12, 
                fill: 'var(--text-secondary)' 
              }}
              axisLine={{ stroke: 'var(--border-default)' }}
              tickLine={{ stroke: 'var(--border-default)' }}
              label={{
                value: 'Number of Predictions',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: 'var(--text-secondary)' }
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary stats below the chart */}
      <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          {chartData.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {item.name}
                </span>
              </div>
              <div className="font-mono text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {item.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {item.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
