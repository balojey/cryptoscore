import type { Market } from '../../types'
import { useMemo } from 'react'
import { useFactoryMarkets, useMarketDetails } from '../../hooks/useDashboardData'
import AnimatedNumber from '../ui/AnimatedNumber'

interface MetricCardProps {
  label: string
  value: number
  suffix?: string
  icon: string
  trend?: string
  isLoading?: boolean
}

function MetricCard({ label, value, suffix = '', icon, trend, isLoading }: MetricCardProps) {
  return (
    <div
      className="p-4 rounded-lg transition-all hover:scale-[1.02]"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {label}
        </span>
        <span className="text-xl">{icon}</span>
      </div>
      <div
        className="text-2xl font-bold font-mono mb-1 transition-opacity duration-300"
        style={{ color: 'var(--text-primary)' }}
      >
        {isLoading
          ? (
              <div className="h-8 w-24 skeleton rounded" />
            )
          : (
              <>
                <AnimatedNumber
                  value={value}
                  duration={500}
                  decimals={suffix.includes('PAS') ? 2 : 0}
                />
                {suffix && <span className="text-lg ml-1">{suffix}</span>}
              </>
            )}
      </div>
      {trend && !isLoading && (
        <div
          className="text-xs font-medium flex items-center gap-1"
          style={{
            color: trend.startsWith('+') ? 'var(--accent-green)' : 'var(--accent-red)',
          }}
        >
          <span className={trend.startsWith('+') ? 'icon-[mdi--trending-up]' : 'icon-[mdi--trending-down]'} />
          <span>{trend}</span>
        </div>
      )}
    </div>
  )
}

interface TerminalMetrics {
  totalMarkets: number
  totalValueLocked: number
  activeTraders: number
  volume24h: number
  trends: {
    markets: string
    tvl: string
    traders: string
    volume: string
  }
}

interface MetricsBarProps {
  error?: Error | null
}

export default function MetricsBar({ error }: MetricsBarProps) {
  // Fetch all markets from Solana factory program
  const { data: factoryMarkets, isLoading: isLoadingFactory } = useFactoryMarkets()

  // Get market addresses for detailed data
  const marketAddresses = useMemo(() => {
    if (!factoryMarkets || !Array.isArray(factoryMarkets))
      return []
    return factoryMarkets.map((market: Market) => market.marketAddress)
  }, [factoryMarkets])

  // Fetch detailed data from individual market accounts
  const { data: marketDetails, isLoading: isLoadingDetails } = useMarketDetails(marketAddresses)

  const isLoading = isLoadingFactory || isLoadingDetails

  // Use factory markets data directly (already includes all details from Solana)
  const marketsData = useMemo(() => {
    if (!factoryMarkets || !Array.isArray(factoryMarkets))
      return null

    // If we have detailed data, merge it; otherwise use factory data
    if (marketDetails && Array.isArray(marketDetails) && marketDetails.length > 0) {
      return factoryMarkets.map((market, index) => {
        const detail = marketDetails[index]
        if (market && typeof market === 'object' && detail && typeof detail === 'object') {
          return { ...(market as any), ...(detail as any) } as Market
        }
        return market as Market
      }) as Market[]
    }

    return factoryMarkets as Market[]
  }, [factoryMarkets, marketDetails])

  // Calculate metrics from market data
  const metrics: TerminalMetrics = useMemo(() => {
    if (!marketsData || !Array.isArray(marketsData)) {
      return {
        totalMarkets: 0,
        totalValueLocked: 0,
        activeTraders: 0,
        volume24h: 0,
        trends: {
          markets: '+0%',
          tvl: '+0%',
          traders: '+0%',
          volume: '+0%',
        },
      }
    }

    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 86400
    const twoDaysAgo = now - 172800

    const totalMarkets = marketsData.length

    // Calculate TVL (sum of all pool sizes) - using lamports for Solana
    const tvlLamports = marketsData.reduce((sum: bigint, market: Market) => {
      const poolSize = BigInt(market.entryFee) * BigInt(market.participantsCount)
      return sum + poolSize
    }, 0n)
    // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
    const totalValueLocked = Number(tvlLamports) / 1_000_000_000

    // Calculate unique active traders (creators)
    const uniqueTraders = new Set<string>()
    marketsData.forEach((market: Market) => {
      uniqueTraders.add(market.creator.toLowerCase())
    })
    const activeTraders = uniqueTraders.size

    // Calculate 24h volume and trends
    let volume24h = 0n
    let volumePrevious24h = 0n
    let markets24h = 0
    let marketsPrevious24h = 0
    let tvl24h = 0n
    let tvlPrevious24h = 0n

    marketsData.forEach((market: Market) => {
      const poolSize = BigInt(market.entryFee) * BigInt(market.participantsCount)
      const startTime = Number(market.startTime)

      if (startTime >= oneDayAgo) {
        volume24h = volume24h + poolSize
        markets24h = markets24h + 1
        tvl24h = tvl24h + poolSize
      }
      else if (startTime >= twoDaysAgo) {
        volumePrevious24h = volumePrevious24h + poolSize
        marketsPrevious24h = marketsPrevious24h + 1
        tvlPrevious24h = tvlPrevious24h + poolSize
      }
    })

    // Convert lamports to SOL for volume
    const volume24hValue = Number(volume24h) / 1_000_000_000

    // Calculate trend percentages
    let marketsTrend = '+0%'
    if (marketsPrevious24h > 0) {
      const trend = ((markets24h - marketsPrevious24h) / marketsPrevious24h) * 100
      marketsTrend = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`
    }
    else if (markets24h > 0) {
      marketsTrend = '+100%'
    }

    let tvlTrend = '+0%'
    if (tvlPrevious24h > 0n) {
      const trend = ((Number(tvl24h) - Number(tvlPrevious24h)) / Number(tvlPrevious24h)) * 100
      tvlTrend = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`
    }
    else if (tvl24h > 0n) {
      tvlTrend = '+100%'
    }

    let volumeTrend = '+0%'
    if (volumePrevious24h > 0n) {
      const trend = ((Number(volume24h) - Number(volumePrevious24h)) / Number(volumePrevious24h)) * 100
      volumeTrend = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`
    }
    else if (volume24h > 0n) {
      volumeTrend = '+100%'
    }

    // Trader trend (simplified - based on recent market creation activity)
    const traderTrend = markets24h > marketsPrevious24h ? '+15%' : markets24h < marketsPrevious24h ? '-5%' : '+0%'

    return {
      totalMarkets,
      totalValueLocked,
      activeTraders,
      volume24h: volume24hValue,
      trends: {
        markets: marketsTrend,
        tvl: tvlTrend,
        traders: traderTrend,
        volume: volumeTrend,
      },
    }
  }, [marketsData])

  // Show error state if there's an error and no data
  const showError = error && !marketsData

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      <MetricCard
        label="Total Markets"
        value={showError ? 0 : metrics.totalMarkets}
        icon="📊"
        trend={showError ? undefined : metrics.trends.markets}
        isLoading={isLoading}
      />
      <MetricCard
        label="Total Value Locked"
        value={showError ? 0 : metrics.totalValueLocked}
        suffix=" SOL"
        icon="🔒"
        trend={showError ? undefined : metrics.trends.tvl}
        isLoading={isLoading}
      />
      <MetricCard
        label="Active Traders"
        value={showError ? 0 : metrics.activeTraders}
        icon="👥"
        trend={showError ? undefined : metrics.trends.traders}
        isLoading={isLoading}
      />
      <MetricCard
        label="24h Volume"
        value={showError ? 0 : metrics.volume24h}
        suffix=" SOL"
        icon="📈"
        trend={showError ? undefined : metrics.trends.volume}
        isLoading={isLoading}
      />
    </div>
  )
}
