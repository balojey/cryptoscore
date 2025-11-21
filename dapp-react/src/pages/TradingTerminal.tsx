import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { useRealtimeMarkets } from '../hooks/useRealtimeMarkets'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'
import MetricsBar from '../components/terminal/MetricsBar'
import TerminalHeader from '../components/terminal/TerminalHeader'
import MarketOverviewChart from '../components/terminal/MarketOverviewChart'
import FeaturedMarkets from '../components/terminal/FeaturedMarkets'
import type { Market } from '../types'

type Timeframe = '24h' | '7d' | '30d' | 'all'
type MetricType = 'tvl' | 'volume' | 'participants'

export function TradingTerminal() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('24h')
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tvl')

  // Fetch all markets for chart data
  const { data: marketsData, isLoading: isLoadingMarkets, refetch } = useReadContract({
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    abi: CryptoScoreDashboardABI,
    functionName: 'getMarketsDashboardPaginated',
    args: [BigInt(0), BigInt(1000), false], // Fetch up to 1000 markets
  })

  // Transform contract data to Market type
  const markets: Market[] = marketsData && Array.isArray(marketsData)
    ? marketsData.map((market: any) => ({
        marketAddress: market.marketAddress,
        matchId: market.matchId,
        entryFee: market.entryFee,
        creator: market.creator,
        participantsCount: market.participantsCount,
        resolved: market.resolved,
        isPublic: market.isPublic,
        startTime: market.startTime,
        homeCount: market.homeCount,
        awayCount: market.awayCount,
        drawCount: market.drawCount,
      }))
    : []

  // Integrate real-time updates with 10-second polling
  useRealtimeMarkets({
    enabled: true,
    interval: 10000,
    onUpdate: () => {
      // Refetch market data on updates
      refetch()
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
        {/* Terminal Header */}
        <TerminalHeader
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
        />

        {/* Metrics Bar */}
        <div
          className="mb-6 md:mb-8 animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <MetricsBar />
        </div>

        {/* Responsive Grid Layout: 2-column desktop, stacked mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 md:gap-8">
          {/* Main Panel (70% on desktop) */}
          <div className="space-y-6 md:space-y-8">
            {/* Market Overview Chart */}
            <div
              className="animate-slide-in-right"
              style={{ animationDelay: '0.2s' }}
            >
              {/* Metric Type Selector */}
              <div className="mb-4 flex justify-end">
                <div className="flex gap-2">
                  {(['tvl', 'volume', 'participants'] as MetricType[]).map(metric => (
                    <button
                      key={metric}
                      onClick={() => setSelectedMetric(metric)}
                      className="px-3 py-1.5 text-sm font-medium rounded transition-all capitalize hover-lift"
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
              <MarketOverviewChart
                markets={markets}
                selectedTimeframe={selectedTimeframe}
                selectedMetric={selectedMetric}
                isLoading={isLoadingMarkets}
              />
            </div>

            {/* Featured Markets */}
            <div
              className="animate-slide-in-right"
              style={{ animationDelay: '0.3s' }}
            >
              <FeaturedMarkets markets={markets} isLoading={isLoadingMarkets} />
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
