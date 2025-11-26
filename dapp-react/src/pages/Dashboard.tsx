import type { FilterOptions } from '../components/market/MarketFilters'
import type { MarketDashboardInfo } from '../types'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from '../components/cards/EnhancedMarketCard'
import PortfolioSummary from '../components/cards/PortfolioSummary'
import PoolTrendChart from '../components/charts/PoolTrendChart'
import PredictionDistributionChart from '../components/charts/PredictionDistributionChart'
import MarketFilters from '../components/market/MarketFilters'
import PerformanceChart from '../components/PerformanceChart'
import RecentActivity from '../components/RecentActivity'
import VirtualMarketList from '../components/VirtualMarketList'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI, CryptoScoreMarketABI } from '../config/contracts'
import { useFilteredMarkets } from '../hooks/useFilteredMarkets'

function MarketList({ markets, isLoading, emptyMessage, emptyIcon }: {
  markets: MarketDashboardInfo[]
  isLoading: boolean
  emptyMessage: string
  emptyIcon: string
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array.from({ length: 6 })].map((_, i) => <EnhancedMarketCardSkeleton key={i} />)}
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div
        className="text-center py-16 border-2 border-dashed rounded-xl"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <span className={`icon-[${emptyIcon}] w-16 h-16 mx-auto mb-4`} style={{ color: 'var(--text-tertiary)' }} />
        <p className="font-sans text-lg" style={{ color: 'var(--text-secondary)' }}>
          {emptyMessage}
        </p>
        <Link
          to="/markets"
          className="inline-flex items-center gap-2 mt-6 btn-primary"
        >
          <span className="icon-[mdi--magnify] w-5 h-5" />
          <span>Explore Markets</span>
        </Link>
      </div>
    )
  }

  // Use virtual scrolling for large lists (>20 markets)
  if (markets.length > 20) {
    return <VirtualMarketList markets={markets} columns={3} />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {markets.map(market => (
        <EnhancedMarketCard market={market} key={market.marketAddress} />
      ))}
    </div>
  )
}

export function Dashboard() {
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created')
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    sortBy: 'newest',
  })

  // Fetch all markets from factory
  const { data: factoryMarkets, isLoading: isLoadingFactory } = useReadContract({
    address: CRYPTO_SCORE_FACTORY_ADDRESS as `0x${string}`,
    abi: CryptoScoreFactoryABI,
    functionName: 'getAllMarkets',
    query: { enabled: !!address && !!CRYPTO_SCORE_FACTORY_ADDRESS },
  })

  // Get all market addresses
  const marketAddresses = useMemo(() => {
    if (!factoryMarkets || !Array.isArray(factoryMarkets)) return []
    return factoryMarkets.map((m: any) => m.marketAddress as `0x${string}`)
  }, [factoryMarkets])

  // Check if user is a participant in each market
  const participantChecks = useMemo(() => {
    return marketAddresses.map((addr) => ({
      address: addr,
      abi: CryptoScoreMarketABI as any,
      functionName: 'isParticipant' as const,
      args: [address],
    }))
  }, [marketAddresses, address])

  const { data: participantResults, isLoading: isLoadingParticipants } = useReadContracts({
    contracts: participantChecks,
    query: {
      enabled: marketAddresses.length > 0 && !!address,
    },
  })

  // Fetch detailed data for all markets
  const marketContracts = useMemo(() => {
    return marketAddresses.flatMap((addr: `0x${string}`) => [
      {
        address: addr,
        abi: CryptoScoreMarketABI as any,
        functionName: 'resolved' as const,
      },
      {
        address: addr,
        abi: CryptoScoreMarketABI as any,
        functionName: 'winner' as const,
      },
      {
        address: addr,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getParticipantsCount' as const,
      },
      {
        address: addr,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getPredictionCounts' as const,
      },
    ])
  }, [marketAddresses])

  const { data: marketDetails, isLoading: isLoadingDetails } = useReadContracts({
    contracts: marketContracts,
    query: {
      enabled: marketAddresses.length > 0,
    },
  })

  const isLoading = isLoadingFactory || isLoadingParticipants || isLoadingDetails

  // Combine factory data with market details and participation info
  const { createdMarkets, joinedMarkets, allInvolvedMarkets } = useMemo(() => {
    if (!factoryMarkets || !marketDetails || !participantResults || !Array.isArray(factoryMarkets)) {
      return { createdMarkets: [], joinedMarkets: [], allInvolvedMarkets: [] }
    }

    const created: MarketDashboardInfo[] = []
    const joined: MarketDashboardInfo[] = []
    const allInvolved: MarketDashboardInfo[] = []
    const seenAddresses = new Set<string>()

    factoryMarkets.forEach((factoryInfo: any, idx: number) => {
      const addr = factoryInfo.marketAddress as `0x${string}`
      const baseIdx = idx * 4
      const resolved = marketDetails[baseIdx]?.result as boolean
      const winner = marketDetails[baseIdx + 1]?.result as number
      const participantsCount = marketDetails[baseIdx + 2]?.result as bigint
      const predictionCounts = marketDetails[baseIdx + 3]?.result as [bigint, bigint, bigint]
      const isParticipant = participantResults[idx]?.result as boolean

      const marketDashboard: MarketDashboardInfo = {
        marketAddress: addr,
        matchId: BigInt(factoryInfo.matchId?.toString() || '0'),
        creator: factoryInfo.creator,
        entryFee: BigInt(factoryInfo.entryFee?.toString() || '0'),
        resolved: resolved ?? false,
        winner: winner ?? 0,
        participantsCount: participantsCount ? BigInt(participantsCount.toString()) : BigInt(0),
        isPublic: factoryInfo.isPublic,
        startTime: BigInt(factoryInfo.startTime?.toString() || '0'),
        homeCount: predictionCounts ? BigInt(predictionCounts[0]?.toString() || '0') : BigInt(0),
        awayCount: predictionCounts ? BigInt(predictionCounts[1]?.toString() || '0') : BigInt(0),
        drawCount: predictionCounts ? BigInt(predictionCounts[2]?.toString() || '0') : BigInt(0),
      }

      // Check if user created this market
      const isCreator = address && factoryInfo.creator.toLowerCase() === address.toLowerCase()

      if (isCreator) {
        created.push(marketDashboard)
      }

      if (isParticipant) {
        joined.push(marketDashboard)
      }

      // Add to allInvolved if user is creator OR participant (deduplicated)
      if ((isCreator || isParticipant) && !seenAddresses.has(addr)) {
        allInvolved.push(marketDashboard)
        seenAddresses.add(addr)
      }
    })

    // Sort all arrays by startTime (newest first)
    const sortByTime = (a: MarketDashboardInfo, b: MarketDashboardInfo) => Number(b.startTime) - Number(a.startTime)
    created.sort(sortByTime)
    joined.sort(sortByTime)
    allInvolved.sort(sortByTime)

    return { createdMarkets: created, joinedMarkets: joined, allInvolvedMarkets: allInvolved }
  }, [factoryMarkets, marketDetails, participantResults, address])

  // Apply filters to markets
  const filteredCreatedMarkets = useFilteredMarkets<MarketDashboardInfo>(createdMarkets, filters)
  const filteredJoinedMarkets = useFilteredMarkets<MarketDashboardInfo>(joinedMarkets, filters)

  if (!address) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="text-center max-w-md mx-auto px-4">
          <div
            className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <span className="icon-[mdi--wallet-outline] w-12 h-12" style={{ color: 'var(--text-tertiary)' }} />
          </div>
          <h1 className="font-jakarta text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Connect Your Wallet
          </h1>
          <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
            Please connect your wallet to view your markets and portfolio.
          </p>
          <Link to="/" className="btn-primary btn-lg">
            <span className="icon-[mdi--home] w-5 h-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    )
  }

  const TabButton = ({
    label,
    value,
    activeValue,
    setActive,
    count,
    icon,
  }: {
    label: string
    value: typeof activeTab
    activeValue: typeof activeTab
    setActive: (v: typeof activeTab) => void
    count: number
    icon: string
  }) => {
    const isActive = activeValue === value
    return (
      <button
        type="button"
        onClick={() => setActive(value)}
        className="px-6 py-3 font-sans font-semibold text-base rounded-lg transition-all flex items-center gap-2"
        style={{
          background: isActive ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
          color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
          border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.borderColor = 'var(--border-hover)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.borderColor = 'var(--border-default)'
          }
        }}
      >
        <span className={`icon-[${icon}] w-5 h-5`} />
        <span>{label}</span>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-bold"
          style={{
            background: isActive ? 'rgba(0, 0, 0, 0.2)' : 'var(--bg-primary)',
            color: isActive ? 'var(--text-inverse)' : 'var(--text-tertiary)',
          }}
        >
          {count}
        </span>
      </button>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <Link
              to="/markets"
              className="text-sm font-medium flex items-center gap-2 mb-3 hover:underline"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
            >
              <span className="icon-[mdi--arrow-left]" />
              Back to Markets
            </Link>
            <h1 className="font-jakarta text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>
              My Portfolio
            </h1>
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="mb-8">
          <PortfolioSummary
            userAddress={address}
            joinedMarkets={joinedMarkets}
          />
        </div>

        {/* Recent Activity & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RecentActivity markets={allInvolvedMarkets} limit={5} />
          <PerformanceChart markets={allInvolvedMarkets} />
        </div>

        {/* Advanced Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PredictionDistributionChart markets={allInvolvedMarkets} />
          <PoolTrendChart markets={allInvolvedMarkets} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          <TabButton
            label="Created"
            value="created"
            activeValue={activeTab}
            setActive={setActiveTab}
            count={createdMarkets.length}
            icon="mdi--account-edit-outline"
          />
          <TabButton
            label="Joined"
            value="joined"
            activeValue={activeTab}
            setActive={setActiveTab}
            count={joinedMarkets.length}
            icon="mdi--account-group-outline"
          />
        </div>

        {/* Market Filters */}
        <div className="mb-6">
          <MarketFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Results Count */}
        {(activeTab === 'created' ? filteredCreatedMarkets : filteredJoinedMarkets).length > 0 && (
          <div className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Showing
            {' '}
            {activeTab === 'created' ? filteredCreatedMarkets.length : filteredJoinedMarkets.length}
            {' '}
            of
            {' '}
            {activeTab === 'created' ? createdMarkets.length : joinedMarkets.length}
            {' '}
            {(activeTab === 'created' ? filteredCreatedMarkets.length : filteredJoinedMarkets.length) === 1 ? 'market' : 'markets'}
          </div>
        )}

        {/* Market Lists */}
        <div className="space-y-8">
          {activeTab === 'created' && (
            <MarketList
              markets={filteredCreatedMarkets}
              isLoading={isLoading}
              emptyMessage={
                filters.status !== 'all' || filters.timeRange || filters.minPoolSize || filters.minEntryFee
                  ? 'No markets match your filters'
                  : 'You haven\'t created any markets yet.'
              }
              emptyIcon={
                filters.status !== 'all' || filters.timeRange || filters.minPoolSize || filters.minEntryFee
                  ? 'mdi--filter-off-outline'
                  : 'mdi--plus-circle-outline'
              }
            />
          )}
          {activeTab === 'joined' && (
            <MarketList
              markets={filteredJoinedMarkets}
              isLoading={isLoading}
              emptyMessage={
                filters.status !== 'all' || filters.timeRange || filters.minPoolSize || filters.minEntryFee
                  ? 'No markets match your filters'
                  : 'You haven\'t joined any markets yet.'
              }
              emptyIcon={
                filters.status !== 'all' || filters.timeRange || filters.minPoolSize || filters.minEntryFee
                  ? 'mdi--filter-off-outline'
                  : 'mdi--cards-outline'
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
