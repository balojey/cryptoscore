import type { Market } from '../types'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useReadContract } from 'wagmi'
import { ErrorBoundary } from '../components/ErrorBoundary'
import RecentActivity from '../components/RecentActivity'
import CachedDataBanner from '../components/terminal/CachedDataBanner'
import ErrorBanner from '../components/terminal/ErrorBanner'
import FeaturedMarkets from '../components/terminal/FeaturedMarkets'
import MarketOverviewChart from '../components/terminal/MarketOverviewChart'
import MetricsBar from '../components/terminal/MetricsBar'
import TerminalHeader from '../components/terminal/TerminalHeader'
import TopMovers from '../components/terminal/TopMovers'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'
import { useRealtimeMarkets } from '../hooks/useRealtimeMarkets'

type Timeframe = '24h' | '7d' | '30d' | 'all'
type MetricType = 'tvl' | 'volume' | 'participants'

export function TradingTerminal() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('24h')
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tvl')
  const [errorDismissed, setErrorDismissed] = useState(false)
  const [cachedMarkets, setCachedMarkets] = useState<Market[]>([])
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState<Date | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Fetch all markets for chart data
  const { data: marketsData, isLoading: isLoadingMarkets, error: fetchError, refetch } = useReadContract({
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    abi: CryptoScoreDashboardABI,
    functionName: 'getMarketsDashboardPaginated',
    args: [BigInt(0), BigInt(1000), false], // Fetch up to 1000 markets
  })

  // Transform contract data to Market type - memoized to prevent infinite loops
  const markets: Market[] = useMemo(() => {
    if (!marketsData || !Array.isArray(marketsData)) {
      return []
    }

    return marketsData.map((market: any) => ({
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
  }, [marketsData])

  // Cache successful data fetches
  useEffect(() => {
    if (markets.length > 0 && !fetchError) {
      setCachedMarkets(markets)
      setLastSuccessfulFetch(new Date())
      retryCountRef.current = 0
      setErrorDismissed(false)
    }
  }, [markets.length, fetchError]) // Only depend on length to avoid infinite loops

  // Determine which data to display (live or cached)
  const displayMarkets = markets.length > 0 ? markets : cachedMarkets
  const hasError = fetchError && !errorDismissed
  const showCachedBanner = fetchError && cachedMarkets.length > 0 && lastSuccessfulFetch

  // Handle retry with exponential backoff
  const handleRetry = async () => {
    if (retryCountRef.current < maxRetries) {
      retryCountRef.current += 1
      setErrorDismissed(false)
      await refetch()
    }
    else {
      // Max retries reached, show user-friendly message
      setErrorDismissed(true)
    }
  }

  // Integrate real-time updates with 10-second polling
  useRealtimeMarkets({
    enabled: !fetchError, // Disable polling if there's an error
    interval: 10000,
    markets: displayMarkets, // Pass markets for event detection
    onUpdate: () => {
      // Refetch market data on updates
      refetch()
    },
  })

  // Determine error message based on error type
  const getErrorMessage = (): string => {
    if (!fetchError)
      return ''

    const errorString = fetchError.toString().toLowerCase()

    if (errorString.includes('network') || errorString.includes('fetch')) {
      return 'Network connection failed. Please check your internet connection.'
    }
    if (errorString.includes('timeout')) {
      return 'Request timed out. The network may be slow or unavailable.'
    }
    if (errorString.includes('rate limit') || errorString.includes('429')) {
      return 'API rate limit reached. Please wait a moment before retrying.'
    }
    if (errorString.includes('contract')) {
      return 'Unable to connect to smart contract. Please check your wallet connection.'
    }

    return 'Unable to load market data. Please try again.'
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Terminal Container */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Terminal Header */}
        <TerminalHeader
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
        />

        {/* Error Banner */}
        {hasError && !showCachedBanner && (
          <ErrorBanner
            message={getErrorMessage()}
            onRetry={retryCountRef.current < maxRetries ? handleRetry : undefined}
            onDismiss={() => setErrorDismissed(true)}
            type="error"
          />
        )}

        {/* Cached Data Banner */}
        {showCachedBanner && (
          <CachedDataBanner
            lastUpdated={lastSuccessfulFetch!}
            onRefresh={handleRetry}
          />
        )}

        {/* Metrics Bar */}
        <div
          className="mb-6 md:mb-8 animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <MetricsBar error={fetchError} />
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
              <ErrorBoundary>
                <MarketOverviewChart
                  markets={displayMarkets}
                  selectedTimeframe={selectedTimeframe}
                  selectedMetric={selectedMetric}
                  isLoading={isLoadingMarkets && !cachedMarkets.length}
                  error={fetchError && !cachedMarkets.length ? getErrorMessage() : undefined}
                  onRetry={handleRetry}
                />
              </ErrorBoundary>
            </div>

            {/* Featured Markets */}
            <div
              className="animate-slide-in-right"
              style={{ animationDelay: '0.3s' }}
            >
              <ErrorBoundary>
                <FeaturedMarkets
                  markets={displayMarkets}
                  isLoading={isLoadingMarkets && !cachedMarkets.length}
                  error={fetchError && !cachedMarkets.length ? getErrorMessage() : undefined}
                  onRetry={handleRetry}
                />
              </ErrorBoundary>
            </div>
          </div>

          {/* Side Panel (30% on desktop) */}
          <div className="space-y-6 md:space-y-8">
            {/* Top Movers */}
            <div
              className="animate-slide-in-right"
              style={{ animationDelay: '0.4s' }}
            >
              <ErrorBoundary>
                <TopMovers
                  markets={displayMarkets}
                  isLoading={isLoadingMarkets && !cachedMarkets.length}
                  error={fetchError && !cachedMarkets.length ? getErrorMessage() : undefined}
                  onRetry={handleRetry}
                />
              </ErrorBoundary>
            </div>

            {/* Recent Activity */}
            <div
              className="animate-slide-in-right"
              style={{ animationDelay: '0.5s' }}
            >
              <ErrorBoundary>
                <RecentActivity
                  markets={displayMarkets}
                  limit={10}
                  isLoading={isLoadingMarkets && !cachedMarkets.length}
                  error={fetchError && !cachedMarkets.length ? getErrorMessage() : undefined}
                  onRetry={handleRetry}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
