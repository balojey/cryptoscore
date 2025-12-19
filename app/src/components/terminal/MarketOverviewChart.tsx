import type { Market } from '../../types'
import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useCurrency } from '@/hooks/useCurrency'
import { ErrorBoundary } from '../ErrorBoundary'

type ChartType = 'tvl' | 'volume' | 'participants'
type Timeframe = '24h' | '7d' | '30d' | 'all'

interface MarketOverviewChartProps {
  markets: Market[]
  selectedTimeframe: Timeframe
  selectedMetric: ChartType
  isLoading?: boolean
  error?: string
  onRetry?: () => void
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label, metricType, currency, formatCurrency }: any) {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const lamports = payload[0].payload.lamports
    let formattedValue: string

    if (metricType === 'tvl' || metricType === 'volume') {
      // Use formatCurrency for monetary values
      formattedValue = formatCurrency(lamports, { showSOLEquivalent: currency !== 'SOL' })
    }
    else if (metricType === 'participants') {
      formattedValue = `${value.toFixed(0)} traders`
    }
    else {
      formattedValue = value.toFixed(2)
    }

    return (
      <div
        className="px-3 py-2 rounded-lg"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: 'var(--accent-cyan)' }}>
          {formattedValue}
        </p>
      </div>
    )
  }
  return null
}

// Loading Skeleton Component
function ChartSkeleton() {
  return (
    <div
      className="p-4 md:p-6 rounded-lg animate-fade-in"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 skeleton rounded" />
          <div className="flex gap-2">
            <div className="h-8 w-16 skeleton rounded" />
            <div className="h-8 w-16 skeleton rounded" />
            <div className="h-8 w-20 skeleton rounded" />
          </div>
        </div>
        <div className="h-64 md:h-80 skeleton rounded" />
      </div>
    </div>
  )
}

export default function MarketOverviewChart({
  markets,
  selectedTimeframe,
  selectedMetric,
  isLoading = false,
  error,
  onRetry,
}: MarketOverviewChartProps) {
  // Chart type selector state (internal to component)
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line')
  const { currency, convertFromLamports, formatCurrency } = useCurrency()

  // Transform market data into chart-compatible format
  const chartData = useMemo(() => {
    if (!markets || markets.length === 0) {
      return []
    }

    // Filter markets by timeframe
    const now = Math.floor(Date.now() / 1000)
    const timeframeSeconds = {
      '24h': 86400,
      '7d': 604800,
      '30d': 2592000,
      'all': Number.POSITIVE_INFINITY,
    }[selectedTimeframe]

    const cutoffTime = now - timeframeSeconds
    const filteredMarkets = markets.filter(market =>
      Number(market.startTime) >= cutoffTime,
    )

    if (filteredMarkets.length === 0) {
      return []
    }

    // Sort markets by start time
    const sortedMarkets = [...filteredMarkets].sort((a, b) =>
      Number(a.startTime) - Number(b.startTime),
    )

    // Group data by date
    const dataByDate = new Map<string, {
      tvlLamports: number
      volumeLamports: number
      participants: number
      count: number
    }>()

    sortedMarkets.forEach((market) => {
      const date = new Date(Number(market.startTime) * 1000)
      let dateKey: string

      // Format date based on timeframe
      if (selectedTimeframe === '24h') {
        // Show hourly for 24h
        dateKey = date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          hour12: true,
        })
      }
      else if (selectedTimeframe === '7d') {
        // Show daily for 7d
        dateKey = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      }
      else {
        // Show weekly/monthly for 30d and all
        dateKey = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      }

      // Calculate pool size in lamports
      const poolSizeLamports = Number(market.entryFee) * Number(market.participantsCount)
      const participants = Number(market.participantsCount)

      const existing = dataByDate.get(dateKey) || {
        tvlLamports: 0,
        volumeLamports: 0,
        participants: 0,
        count: 0,
      }

      dataByDate.set(dateKey, {
        tvlLamports: existing.tvlLamports + poolSizeLamports,
        volumeLamports: existing.volumeLamports + poolSizeLamports,
        participants: existing.participants + participants,
        count: existing.count + 1,
      })
    })

    // Convert to chart data array
    const chartDataArray = Array.from(dataByDate.entries()).map(([date, data]) => {
      let lamports: number
      let value: number

      switch (selectedMetric) {
        case 'tvl':
          // Cumulative TVL
          lamports = data.tvlLamports
          value = convertFromLamports(lamports)
          break
        case 'volume':
          // Total volume for the period
          lamports = data.volumeLamports
          value = convertFromLamports(lamports)
          break
        case 'participants':
          // Total participants (not monetary)
          lamports = 0
          value = data.participants
          break
        default:
          lamports = 0
          value = 0
      }

      return {
        date,
        value: Number(value.toFixed(currency === 'SOL' ? 4 : 2)),
        lamports,
        label: date,
      }
    })

    // For TVL, make it cumulative
    if (selectedMetric === 'tvl') {
      let cumulativeLamports = 0
      return chartDataArray.map((point) => {
        cumulativeLamports += point.lamports
        const cumulativeValue = convertFromLamports(cumulativeLamports)
        return {
          ...point,
          value: Number(cumulativeValue.toFixed(currency === 'SOL' ? 4 : 2)),
          lamports: cumulativeLamports,
        }
      })
    }

    return chartDataArray
  }, [markets, selectedTimeframe, selectedMetric, convertFromLamports, currency])

  // Show loading skeleton
  if (isLoading) {
    return <ChartSkeleton />
  }

  // Error state
  if (error) {
    return (
      <div
        className="p-6 rounded-lg"
        style={{
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Market Overview
          </h3>
        </div>
        <div
          className="h-64 md:h-80 flex flex-col items-center justify-center rounded"
          style={{
            background: 'var(--bg-secondary)',
            border: `2px solid var(--accent-red)`,
          }}
        >
          <span
            className="icon-[mdi--alert-circle-outline] w-16 h-16 mb-4"
            style={{ color: 'var(--accent-red)' }}
          />
          <p
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Unable to load chart data
          </p>
          <p
            className="text-sm mb-4 text-center max-w-md"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {error}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 text-sm font-medium rounded transition-all hover-lift"
              style={{
                background: 'var(--accent-cyan)',
                color: 'var(--text-inverse)',
              }}
            >
              <span className="flex items-center gap-2">
                <span className="icon-[mdi--refresh] w-4 h-4" />
                <span>Retry</span>
              </span>
            </button>
          )}
        </div>
      </div>
    )
  }

  // Empty state
  if (chartData.length === 0) {
    return (
      <div
        className="p-6 rounded-lg"
        style={{
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Market Overview
          </h3>
          <div className="flex gap-2">
            {(['line', 'bar', 'area'] as const).map(type => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className="px-3 py-1.5 text-sm font-medium rounded transition-all capitalize"
                style={{
                  background: chartType === type ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                  color: chartType === type ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: `1px solid ${chartType === type ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
                }}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        <div
          className="h-64 md:h-80 flex flex-col items-center justify-center rounded"
          style={{
            background: 'var(--bg-secondary)',
            border: `1px solid var(--border-default)`,
          }}
        >
          <span
            className="icon-[mdi--chart-line] w-16 h-16 mb-4"
            style={{ color: 'var(--text-tertiary)' }}
          />
          <p
            className="text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            No market data available
          </p>
          <p
            className="text-sm mt-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Create markets to see trends and analytics
          </p>
        </div>
      </div>
    )
  }

  // Determine chart title based on metric
  const chartTitle = {
    tvl: 'Total Value Locked Over Time',
    volume: 'Market Volume',
    participants: 'Participant Growth',
  }[selectedMetric]

  // Render appropriate chart based on selected type
  const renderChart = () => {
    // Validate chart data before rendering
    if (!chartData || chartData.length === 0) {
      return null
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    }

    const axisProps = {
      xAxis: {
        dataKey: 'date',
        stroke: 'var(--text-tertiary)',
        style: { fontSize: '12px' },
      },
      yAxis: {
        stroke: 'var(--text-tertiary)',
        style: { fontSize: '12px' },
      },
    }

    try {
      switch (chartType) {
        case 'bar':
          return (
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis {...axisProps.xAxis} />
              <YAxis {...axisProps.yAxis} />
              <Tooltip content={<CustomTooltip metricType={selectedMetric} currency={currency} formatCurrency={formatCurrency} />} />
              <Bar
                dataKey="value"
                fill="var(--accent-cyan)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          )

        case 'area':
          return (
            <AreaChart {...commonProps}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis {...axisProps.xAxis} />
              <YAxis {...axisProps.yAxis} />
              <Tooltip content={<CustomTooltip metricType={selectedMetric} currency={currency} formatCurrency={formatCurrency} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--accent-cyan)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          )

        case 'line':
        default:
          return (
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
              <XAxis {...axisProps.xAxis} />
              <YAxis {...axisProps.yAxis} />
              <Tooltip content={<CustomTooltip metricType={selectedMetric} currency={currency} formatCurrency={formatCurrency} />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--accent-cyan)"
                strokeWidth={2}
                dot={{ fill: 'var(--accent-cyan)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )
      }
    }
    catch (error) {
      console.error('Chart rendering error:', error)
      return null
    }
  }

  return (
    <div
      className="p-4 md:p-6 rounded-lg animate-fade-in"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-lg)',
      }}
      role="region"
      aria-label={`Market overview chart showing ${chartTitle}`}
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3
          className="text-xl font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {chartTitle}
        </h3>

        {/* Chart Type Selector */}
        <div className="flex gap-2" role="radiogroup" aria-label="Select chart type">
          {(['line', 'bar', 'area'] as const).map(type => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className="px-3 py-1.5 text-sm font-medium rounded transition-all capitalize hover-lift"
              style={{
                background: chartType === type ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                color: chartType === type ? 'var(--text-inverse)' : 'var(--text-secondary)',
                border: `1px solid ${chartType === type ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
              }}
              role="radio"
              aria-checked={chartType === type}
              aria-label={`${type} chart`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <ErrorBoundary
        fallback={(
          <div
            className="h-64 md:h-80 flex flex-col items-center justify-center rounded"
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--accent-red)',
            }}
          >
            <span
              className="icon-[mdi--alert-circle-outline] w-12 h-12 mb-3"
              style={{ color: 'var(--accent-red)' }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Chart rendering error
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Unable to display chart data
            </p>
          </div>
        )}
      >
        <ResponsiveContainer width="100%" height={window.innerWidth < 768 ? 300 : 400}>
          {renderChart()}
        </ResponsiveContainer>
      </ErrorBoundary>
    </div>
  )
}
