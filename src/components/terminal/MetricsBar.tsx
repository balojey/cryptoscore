import type { MarketData } from '../../hooks/useSupabaseMarketData'
import { useMemo } from 'react'
import { useMnee } from '../../hooks/useMnee'
import { useSupabaseAllMarkets } from '../../hooks/useSupabaseMarketData'
import AnimatedNumber from '../ui/AnimatedNumber'

interface MetricCardProps {
  label: string
  value: number
  suffix?: string
  icon: string
  trend?: string
  isLoading?: boolean
  solEquivalent?: string
}

function MetricCard({ label, value, suffix = '', icon, trend, isLoading, solEquivalent }: MetricCardProps) {
  // Determine decimal places based on metric type
  const getDecimals = () => {
    // Integer metrics (no decimals)
    if (label === 'Total Markets' || label === 'Active Traders') {
      return 0
    }
    // SOL values (4 decimals)
    if (suffix.includes('SOL') || suffix.includes('◎')) {
      return 4
    }
    // Currency values (2 decimals)
    return 2
  }

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
                  decimals={getDecimals()}
                />
                {suffix && <span className="text-lg ml-1">{suffix}</span>}
              </>
            )}
      </div>
      {solEquivalent && !isLoading && (
        <div
          className="text-xs font-medium mt-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {solEquivalent}
        </div>
      )}
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
  totalValueLockedLamports: number
  activeTraders: number
  volume24hLamports: number
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
  // Fetch all markets from Solana - this already includes all details
  const { data: marketsData, isLoading } = useSupabaseAllMarkets()
  const { currency, convertFromLamports } = useCurrency()

  // Calculate metrics from market data
  const metrics: TerminalMetrics = useMemo(() => {
    if (!marketsData || !Array.isArray(marketsData) || marketsData.length === 0) {
      return {
        totalMarkets: 0,
        totalValueLockedLamports: 0,
        activeTraders: 0,
        volume24hLamports: 0,
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

    // Calculate TVL (sum of all totalPool values) - keep in lamports
    const totalPoolLamports = marketsData.reduce((sum: number, market: MarketData) => {
      return sum + market.totalPool
    }, 0)

    // Calculate unique active traders (creators)
    const uniqueTraders = new Set<string>()
    marketsData.forEach((market: MarketData) => {
      uniqueTraders.add(market.creator.toLowerCase())
    })
    const activeTraders = uniqueTraders.size

    // Calculate 24h volume and trends
    let volume24h = 0
    let volumePrevious24h = 0
    let markets24h = 0
    let marketsPrevious24h = 0
    let tvl24h = 0
    let tvlPrevious24h = 0

    marketsData.forEach((market: MarketData) => {
      const poolSize = market.totalPool
      const kickoffTime = market.kickoffTime

      if (kickoffTime >= oneDayAgo) {
        volume24h += poolSize
        markets24h += 1
        tvl24h += poolSize
      }
      else if (kickoffTime >= twoDaysAgo) {
        volumePrevious24h += poolSize
        marketsPrevious24h += 1
        tvlPrevious24h += poolSize
      }
    })

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
    if (tvlPrevious24h > 0) {
      const trend = ((tvl24h - tvlPrevious24h) / tvlPrevious24h) * 100
      tvlTrend = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`
    }
    else if (tvl24h > 0) {
      tvlTrend = '+100%'
    }

    let volumeTrend = '+0%'
    if (volumePrevious24h > 0) {
      const trend = ((volume24h - volumePrevious24h) / volumePrevious24h) * 100
      volumeTrend = `${trend >= 0 ? '+' : ''}${trend.toFixed(1)}%`
    }
    else if (volume24h > 0) {
      volumeTrend = '+100%'
    }

    // Trader trend (simplified - based on recent market creation activity)
    const traderTrend = markets24h > marketsPrevious24h ? '+15%' : markets24h < marketsPrevious24h ? '-5%' : '+0%'

    return {
      totalMarkets,
      totalValueLockedLamports: totalPoolLamports,
      activeTraders,
      volume24hLamports: volume24h,
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

  // Format monetary values with currency conversion
  const tvlValue = showError ? 0 : convertFromLamports(metrics.totalValueLockedLamports)
  const volumeValue = showError ? 0 : convertFromLamports(metrics.volume24hLamports)

  // Get currency symbol
  const currencySymbol = currency === 'SOL' ? '◎' : currency === 'USD' ? '$' : '₦'
  const currencySuffix = ` ${currencySymbol}`

  // Generate SOL equivalents for non-SOL currencies
  const tvlSolEquivalent = currency !== 'SOL' && !showError
    ? `◎${(metrics.totalValueLockedLamports / 1_000_000_000).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL`
    : undefined

  const volumeSolEquivalent = currency !== 'SOL' && !showError
    ? `◎${(metrics.volume24hLamports / 1_000_000_000).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL`
    : undefined

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
        value={tvlValue}
        suffix={currencySuffix}
        icon="🔒"
        trend={showError ? undefined : metrics.trends.tvl}
        isLoading={isLoading}
        solEquivalent={tvlSolEquivalent}
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
        value={volumeValue}
        suffix={currencySuffix}
        icon="📈"
        trend={showError ? undefined : metrics.trends.volume}
        isLoading={isLoading}
        solEquivalent={volumeSolEquivalent}
      />
    </div>
  )
}
