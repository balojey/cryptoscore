import { useState } from 'react'
import { useRealtimeMarkets } from '../hooks/useRealtimeMarkets'

type Timeframe = '24h' | '7d' | '30d' | 'all'
type MetricType = 'tvl' | 'volume' | 'participants'

export function TradingTerminal() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('24h')
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tvl')

  // Integrate real-time updates with 10-second polling
  useRealtimeMarkets({
    enabled: true,
    interval: 10000,
    onUpdate: () => {
      // Data will be automatically refetched via query invalidation
      console.log('Trading terminal data updated')
    },
  })

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Terminal Container */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Terminal Header - Placeholder for Task 4 */}
        <div
          className="mb-6 md:mb-8 p-4 md:p-6 rounded-lg animate-fade-in"
          style={{
            background: 'var(--bg-elevated)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl md:text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                Trading Terminal
              </h1>
              <span
                className="flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full animate-pulse"
                style={{
                  background: 'var(--accent-green)',
                  color: 'var(--text-inverse)',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-white" />
                LIVE
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Timeframe Selector */}
              <div className="flex gap-2">
                {(['24h', '7d', '30d', 'all'] as Timeframe[]).map(timeframe => (
                  <button
                    key={timeframe}
                    onClick={() => setSelectedTimeframe(timeframe)}
                    className="px-3 py-1.5 text-sm font-medium rounded transition-all"
                    style={{
                      background: selectedTimeframe === timeframe ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                      color: selectedTimeframe === timeframe ? 'var(--text-inverse)' : 'var(--text-secondary)',
                      border: `1px solid ${selectedTimeframe === timeframe ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
                    }}
                  >
                    {timeframe === 'all' ? 'All Time' : timeframe.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Bar - Placeholder for Task 3 */}
        <div
          className="mb-6 md:mb-8 animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Markets', value: '0', icon: '📊' },
              { label: 'Total Value Locked', value: '0 PAS', icon: '🔒' },
              { label: 'Active Traders', value: '0', icon: '👥' },
              { label: '24h Volume', value: '0 PAS', icon: '📈' },
            ].map(metric => (
              <div
                key={metric.label}
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-elevated)',
                  boxShadow: 'var(--shadow-md)',
                  border: `1px solid var(--border-default)`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {metric.label}
                  </span>
                  <span className="text-xl">{metric.icon}</span>
                </div>
                <div
                  className="text-2xl font-bold font-mono"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Responsive Grid Layout: 2-column desktop, stacked mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 md:gap-8">
          {/* Main Panel (70% on desktop) */}
          <div className="space-y-6 md:space-y-8">
            {/* Market Overview Chart - Placeholder for Task 5 */}
            <div
              className="p-4 md:p-6 rounded-lg animate-slide-in-right"
              style={{
                background: 'var(--bg-elevated)',
                boxShadow: 'var(--shadow-lg)',
                animationDelay: '0.2s',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3
                  className="text-xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Market Overview
                </h3>
                {/* Metric Type Selector */}
                <div className="flex gap-2">
                  {(['tvl', 'volume', 'participants'] as MetricType[]).map(metric => (
                    <button
                      key={metric}
                      onClick={() => setSelectedMetric(metric)}
                      className="px-3 py-1.5 text-sm font-medium rounded transition-all capitalize"
                      style={{
                        background: selectedMetric === metric ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                        color: selectedMetric === metric ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        border: `1px solid ${selectedMetric === metric ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
                      }}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
              </div>
              {/* Chart placeholder */}
              <div
                className="h-64 md:h-80 flex items-center justify-center rounded"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid var(--border-default)`,
                }}
              >
                <p style={{ color: 'var(--text-tertiary)' }}>
                  Chart will be implemented in Task 5
                </p>
              </div>
            </div>

            {/* Featured Markets - Placeholder for Task 6 */}
            <div
              className="p-4 md:p-6 rounded-lg animate-slide-in-right"
              style={{
                background: 'var(--bg-elevated)',
                boxShadow: 'var(--shadow-lg)',
                animationDelay: '0.3s',
              }}
            >
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Featured Markets
              </h3>
              <div
                className="h-48 flex items-center justify-center rounded"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid var(--border-default)`,
                }}
              >
                <p style={{ color: 'var(--text-tertiary)' }}>
                  Featured markets will be implemented in Task 6
                </p>
              </div>
            </div>
          </div>

          {/* Side Panel (30% on desktop) */}
          <div className="space-y-6 md:space-y-8">
            {/* Top Movers - Placeholder for Task 7 */}
            <div
              className="p-4 md:p-6 rounded-lg animate-slide-in-right"
              style={{
                background: 'var(--bg-elevated)',
                boxShadow: 'var(--shadow-lg)',
                animationDelay: '0.4s',
              }}
            >
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Top Movers
              </h3>
              <div
                className="h-48 flex items-center justify-center rounded"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid var(--border-default)`,
                }}
              >
                <p style={{ color: 'var(--text-tertiary)' }}>
                  Top movers will be implemented in Task 7
                </p>
              </div>
            </div>

            {/* Recent Activity - Placeholder for Task 8 */}
            <div
              className="p-4 md:p-6 rounded-lg animate-slide-in-right"
              style={{
                background: 'var(--bg-elevated)',
                boxShadow: 'var(--shadow-lg)',
                animationDelay: '0.5s',
              }}
            >
              <h3
                className="text-xl font-semibold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Recent Activity
              </h3>
              <div
                className="h-48 flex items-center justify-center rounded"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid var(--border-default)`,
                }}
              >
                <p style={{ color: 'var(--text-tertiary)' }}>
                  Recent activity will be implemented in Task 8
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
