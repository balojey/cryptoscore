import { formatEther } from 'viem'
import { useReadContract } from 'wagmi'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../../config/contracts'
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
        {isLoading ? (
          <div className="h-8 w-24 skeleton rounded" />
        ) : (
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
  // Fetch all markets to calculate metrics
  const { data: marketsData, isLoading } = useReadContract({
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    abi: CryptoScoreDashboardABI,
    functionName: 'getMarketsDashboardPaginated',
    args: [BigInt(0), BigInt(1000), false], // Fetch up to 1000 markets (both public and private)
  })

  // Calculate metrics from market data
  const metrics: TerminalMetrics = {
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

  if (marketsData && Array.isArray(marketsData)) {
    const now = Math.floor(Date.now() / 1000)
    const oneDayAgo = now - 86400
    const twoDaysAgo = now - 172800

    metrics.totalMarkets = marketsData.length

    // Calculate TVL (sum of all pool sizes)
    const tvlBigInt = marketsData.reduce((sum: bigint, market: any) => {
      const poolSize = BigInt(market.entryFee) * BigInt(market.participantsCount)
      return sum + poolSize
    }, 0n)
    metrics.totalValueLocked = Number.parseFloat(formatEther(tvlBigInt))

    // Calculate unique active traders
    const uniqueTraders = new Set<string>()
    marketsData.forEach((market: any) => {
      uniqueTraders.add(market.creator.toLowerCase())
    })
    metrics.activeTraders = uniqueTraders.size

    // Calculate 24h volume and trends
    let volume24h = 0n
    let volumePrevious24h = 0n
    let markets24h = 0
    let marketsPrevious24h = 0
    let tvl24h = 0n
    let tvlPrevious24h = 0n

    marketsData.forEach((market: any) => {
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

    metrics.volume24h = Number.parseFloat(formatEther(volume24h))

    // Calculate trend percentages
    if (marketsPrevious24h > 0) {
      const marketsTrend = ((markets24h - marketsPrevious24h) / marketsPrevious24h) * 100
      metrics.trends.markets = `${marketsTrend >= 0 ? '+' : ''}${marketsTrend.toFixed(1)}%`
    }
    else if (markets24h > 0) {
      metrics.trends.markets = '+100%'
    }

    if (tvlPrevious24h > 0n) {
      const tvlTrend = ((Number(tvl24h) - Number(tvlPrevious24h)) / Number(tvlPrevious24h)) * 100
      metrics.trends.tvl = `${tvlTrend >= 0 ? '+' : ''}${tvlTrend.toFixed(1)}%`
    }
    else if (tvl24h > 0n) {
      metrics.trends.tvl = '+100%'
    }

    if (volumePrevious24h > 0n) {
      const volumeTrend = ((Number(volume24h) - Number(volumePrevious24h)) / Number(volumePrevious24h)) * 100
      metrics.trends.volume = `${volumeTrend >= 0 ? '+' : ''}${volumeTrend.toFixed(1)}%`
    }
    else if (volume24h > 0n) {
      metrics.trends.volume = '+100%'
    }

    // Trader trend (simplified - based on recent market creation activity)
    const traderTrend = markets24h > marketsPrevious24h ? '+15%' : markets24h < marketsPrevious24h ? '-5%' : '+0%'
    metrics.trends.traders = traderTrend
  }

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
        suffix=" PAS"
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
        suffix=" PAS"
        icon="📈"
        trend={showError ? undefined : metrics.trends.volume}
        isLoading={isLoading}
      />
    </div>
  )
}
