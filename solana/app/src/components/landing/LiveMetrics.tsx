import type { Market } from '../../types'
import { memo, useEffect, useMemo, useState } from 'react'
import { formatEther } from 'viem'
import { useReadContract, useReadContracts } from 'wagmi'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI, CryptoScoreMarketABI } from '../../config/contracts'
import { useRealtimeMarkets } from '../../hooks/useRealtimeMarkets'
import ErrorBanner from '../terminal/ErrorBanner'
import AnimatedNumber from '../ui/AnimatedNumber'

interface MetricCardProps {
  label: string
  value: number
  suffix?: string
  icon: string
  color: string
  decimals?: number
  isLoading?: boolean
}

const MetricCard = memo(({ label, value, suffix = '', icon, color, decimals = 0, isLoading }: MetricCardProps) => {
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
})

export default function LiveMetrics() {
  const [showError, setShowError] = useState(true)
  const [cachedData, setCachedData] = useState<Market[] | null>(null)

  // Fetch all markets from factory
  const { data: factoryMarkets, isLoading: isLoadingFactory, isError: isFactoryError, refetch: refetchFactory } = useReadContract({
    address: CRYPTO_SCORE_FACTORY_ADDRESS,
    abi: CryptoScoreFactoryABI,
    functionName: 'getAllMarkets',
  })

  // Get market addresses for detailed data
  const marketAddresses = useMemo(() => {
    if (!factoryMarkets || !Array.isArray(factoryMarkets))
      return []
    return factoryMarkets.map((market: any) => market.marketAddress as `0x${string}`)
  }, [factoryMarkets])

  // Fetch detailed data from individual market contracts
  const { data: marketDetails, isLoading: isLoadingDetails, isError: isDetailsError } = useReadContracts({
    contracts: marketAddresses.flatMap(address => [
      {
        address,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getParticipantsCount',
      },
      {
        address,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getPredictionCounts',
      },
      {
        address,
        abi: CryptoScoreMarketABI as any,
        functionName: 'resolved',
      },
    ]),
  })

  // Combine factory data with market details
  const marketsData = useMemo(() => {
    if (!factoryMarkets || !Array.isArray(factoryMarkets) || !marketDetails)
      return null

    return factoryMarkets.map((factoryMarket: any, index: number) => {
      const detailsIndex = index * 3
      const participantsCount = marketDetails[detailsIndex]?.result as bigint | undefined
      const predictionCounts = marketDetails[detailsIndex + 1]?.result as [bigint, bigint, bigint] | undefined
      const resolved = marketDetails[detailsIndex + 2]?.result as boolean | undefined

      return {
        marketAddress: factoryMarket.marketAddress,
        matchId: factoryMarket.matchId,
        entryFee: factoryMarket.entryFee,
        creator: factoryMarket.creator,
        participantsCount: participantsCount || BigInt(0),
        resolved: resolved || false,
        isPublic: factoryMarket.isPublic,
        startTime: factoryMarket.startTime,
        homeCount: predictionCounts?.[0] || BigInt(0),
        awayCount: predictionCounts?.[1] || BigInt(0),
        drawCount: predictionCounts?.[2] || BigInt(0),
      } as Market
    })
  }, [factoryMarkets, marketDetails])

  const isLoading = isLoadingFactory || isLoadingDetails
  const isError = isFactoryError || isDetailsError
  const refetch = refetchFactory

  // Cache successful data fetches
  useEffect(() => {
    if (marketsData && Array.isArray(marketsData) && marketsData.length > 0) {
      setCachedData(marketsData)
    }
  }, [marketsData])

  // Enable real-time updates with polling
  useRealtimeMarkets({
    enabled: !isError,
    interval: 10000, // Poll every 10 seconds
    onUpdate: () => {
      refetch()
    },
  })

  // Use cached data if available and current fetch failed
  const dataToUse = (isError && cachedData) ? cachedData : (marketsData as Market[] | undefined)

  const metrics = useMemo(() => {
    if (!dataToUse || !Array.isArray(dataToUse)) {
      return {
        totalMarkets: 0,
        totalValueLocked: 0,
        activeTraders: 0,
        marketsResolved: 0,
      }
    }

    const markets = dataToUse

    // Total markets (all markets)
    const totalMarkets = markets.length

    // Total Value Locked (sum of all pool sizes: entryFee * participantsCount)
    const totalValueLocked = markets.reduce((sum, market) => {
      const poolSize = Number(formatEther(BigInt(market.entryFee))) * Number(market.participantsCount)
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
  }, [dataToUse])

  const handleRetry = () => {
    setShowError(true)
    refetch()
  }

  const handleDismiss = () => {
    setShowError(false)
  }

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

        {/* Error Banner */}
        {isError && showError && (
          <ErrorBanner
            message={cachedData
              ? 'Unable to fetch latest metrics. Showing cached data.'
              : 'Unable to load platform metrics. Please try again.'}
            type={cachedData ? 'warning' : 'error'}
            onRetry={handleRetry}
            onDismiss={handleDismiss}
          />
        )}

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
