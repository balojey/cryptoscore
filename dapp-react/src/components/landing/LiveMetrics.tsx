import { useMemo } from 'react'
import { useReadContract } from 'wagmi'
import { formatEther } from 'viem'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../../config/contracts'
import type { MarketDashboardInfo } from '../../types'
import AnimatedNumber from '../ui/AnimatedNumber'
import { useRealtimeMarkets } from '../../hooks/useRealtimeMarkets'

interface MetricCardProps {
  label: string
  value: number
  suffix?: string
  icon: string
  color: string
  decimals?: number
  isLoading?: boolean
}

function MetricCard({ label, value, suffix = '', icon, color, decimals = 0, isLoading }: MetricCardProps) {
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
    </div>
  )
}

export default function LiveMetrics() {
  // Fetch all markets to calculate metrics
  const { data: marketsData, isLoading, refetch } = useReadContract({
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    abi: CryptoScoreDashboardABI,
    functionName: 'getMarketsDashboardPaginated',
    args: [BigInt(0), BigInt(1000), false], // Fetch up to 1000 markets (both public and private)
  })

  // Enable real-time updates with polling
  useRealtimeMarkets({
    enabled: true,
    interval: 10000, // Poll every 10 seconds
    onUpdate: () => {
      refetch()
    },
  })

  const metrics = useMemo(() => {
    if (!marketsData || !Array.isArray(marketsData)) {
      return {
        totalMarkets: 0,
        totalValueLocked: 0,
        activeTraders: 0,
        marketsResolved: 0,
      }
    }

    const markets = marketsData as MarketDashboardInfo[]

    // Total markets (all markets)
    const totalMarkets = markets.length

    // Total Value Locked (sum of all pool sizes: entryFee * participantsCount)
    const totalValueLocked = markets.reduce((sum, market) => {
      const poolSize = Number(formatEther(market.entryFee)) * Number(market.participantsCount)
      return sum + poolSize
    }, 0)

    // Active traders (unique participants across all markets)
    // Note: This is an approximation since we don't have individual participant addresses
    // We'll use total participants count as a proxy
    const activeTraders = markets.reduce((sum, market) => {
      return sum + Number(market.participantsCount)
    }, 0)

    // Markets resolved
    const marketsResolved = markets.filter(market => market.resolved).length

    return {
      totalMarkets,
      totalValueLocked,
      activeTraders,
      marketsResolved,
    }
  }, [marketsData])

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            value={metrics.totalValueLocked}
            suffix=" PAS"
            icon="mdi--safe-square-outline"
            color="var(--accent-green)"
            decimals={2}
            isLoading={isLoading}
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
