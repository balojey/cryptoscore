import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { memo, useMemo } from 'react'
import { useCurrency } from '../../hooks/useCurrency'
import { useSupabaseAllMarkets } from '../../hooks/useSupabaseMarketData'
import AnimatedNumber from '../ui/AnimatedNumber'

interface MetricCardProps {
  label: string
  value: number
  suffix?: string
  icon: string
  color: string
  decimals?: number
  isLoading?: boolean
  solEquivalent?: string
}

const MetricCard = memo(({ label, value, suffix = '', icon, color, decimals = 0, isLoading, solEquivalent }: MetricCardProps) => {
  if (isLoading) {
    return (
      <div
        className="rounded-[16px] p-6 md:p-8 transition-all duration-300"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {label}
          </span>
          <span className={`icon-[${icon}] w-6 h-6 skeleton`} />
        </div>
        <div className="skeleton h-10 w-32 rounded-lg" />
      </div>
    )
  }

  return (
    <div
      className="rounded-[16px] p-6 md:p-8 transition-all duration-300 hover-lift"
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
          {label}
        </span>
        <span className={`icon-[${icon}] w-6 h-6`} style={{ color }} />
      </div>
      <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} duration={800} />
      </div>
      {solEquivalent && (
        <div
          className="text-sm font-medium mt-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {solEquivalent}
        </div>
      )}
    </div>
  )
})

export default function LiveMetrics() {
  // Fetch all markets and calculate statistics
  const { data: marketsData, isLoading } = useSupabaseAllMarkets()
  const { currency, convertFromLamports } = useCurrency()

  // Calculate metrics from market data
  const metrics = useMemo(() => {
    if (!marketsData || marketsData.length === 0) {
      return {
        totalMarkets: 0,
        totalValueLockedLamports: 0,
        activeTraders: 0,
        marketsResolved: 0,
      }
    }

    const now = Date.now() / 1000 // Current time in seconds

    let totalValueLockedLamports = 0
    let activeTraders = 0
    let marketsResolved = 0
    let activeMarkets = 0

    marketsData.forEach((market) => {
      // Count resolved markets
      if (market.status === 'Resolved') {
        marketsResolved++
      }
      // Count active markets (Open or Live)
      else if (market.status === 'Open' || market.status === 'Live') {
        activeMarkets++
      }

      // Sum total value locked (all markets for all time) - keep in lamports
      totalValueLockedLamports += market.totalPool

      // Sum unique participants
      activeTraders += market.participantCount
    })

    return {
      totalMarkets: activeMarkets,
      totalValueLockedLamports,
      activeTraders,
      marketsResolved,
    }
  }, [marketsData])

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2
            className="font-display text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Platform Statistics
          </h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Real-time metrics from the blockchain
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            label="Active Markets"
            value={metrics.totalMarkets}
            icon="mdi--chart-box-outline"
            color="var(--accent-cyan)"
            isLoading={isLoading}
          />
          <MetricCard
            label="Total Value Locked"
            value={convertFromLamports(metrics.totalValueLockedLamports)}
            suffix={currency === 'SOL' ? ' SOL' : currency === 'USD' ? ' USD' : ' NGN'}
            icon="mdi--safe-square-outline"
            color="var(--accent-green)"
            decimals={currency === 'SOL' ? 4 : 2}
            isLoading={isLoading}
            solEquivalent={
              currency !== 'SOL'
                ? `◎${(metrics.totalValueLockedLamports / LAMPORTS_PER_SOL).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} SOL`
                : undefined
            }
          />
          <MetricCard
            label="Active Traders"
            value={metrics.activeTraders}
            icon="mdi--account-group-outline"
            color="var(--accent-purple)"
            isLoading={isLoading}
          />
          <MetricCard
            label="Markets Resolved"
            value={metrics.marketsResolved}
            icon="mdi--check-circle-outline"
            color="var(--accent-amber)"
            isLoading={isLoading}
          />
        </div>
      </div>
    </section>
  )
}
