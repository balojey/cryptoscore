import type { FilterOptions } from '../components/market/MarketFilters'
import { useState } from 'react'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import { Link } from 'react-router-dom'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from '../components/cards/EnhancedMarketCard'
import SupabasePortfolioSummary from '../components/cards/SupabasePortfolioSummary'
import PoolTrendChart from '../components/charts/PoolTrendChart'
import PredictionDistributionChart from '../components/charts/PredictionDistributionChart'
import MarketFilters from '../components/market/MarketFilters'
import PerformanceChart from '../components/PerformanceChart'
import RecentActivity from '../components/RecentActivity'
import VirtualMarketList from '../components/VirtualMarketList'
import { useSupabaseDashboardData } from '../hooks/useSupabaseDashboardData'
import { useFilteredMarkets } from '../hooks/useFilteredMarkets'
import { UserService } from '../lib/supabase/user-service'
import { useQuery } from '@tanstack/react-query'
import type { SupabaseMarketDashboardInfo } from '../hooks/useSupabaseDashboardData'

// Transform Supabase market data to legacy format for compatibility with existing components
function transformToLegacyMarketFormat(market: SupabaseMarketDashboardInfo) {
  return {
    marketAddress: market.id,
    matchId: BigInt(0), // Not used in Supabase version
    entryFee: BigInt(Math.floor(market.entry_fee * 1_000_000_000)), // Convert to lamports
    creator: market.creator_id,
    participantsCount: BigInt(market.participantsCount),
    resolved: market.status === 'resolved',
    isPublic: true, // All markets are public in Supabase version
    startTime: BigInt(Math.floor(new Date(market.created_at).getTime() / 1000)),
    homeCount: BigInt(market.homeCount),
    awayCount: BigInt(market.awayCount),
    drawCount: BigInt(market.drawCount),
    totalPool: BigInt(Math.floor(market.total_pool * 1_000_000_000)), // Convert to lamports
    status: market.status,
    outcome: market.resolution_outcome,
  }
}

function MarketList({ markets, isLoading, emptyMessage, emptyIcon }: {
  markets: SupabaseMarketDashboardInfo[]
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
    const legacyMarkets = markets.map(transformToLegacyMarketFormat)
    return <VirtualMarketList markets={legacyMarkets} columns={3} />
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {markets.map(market => (
        <EnhancedMarketCard 
          market={transformToLegacyMarketFormat(market)} 
          key={market.id} 
        />
      ))}
    </div>
  )
}

export function Dashboard() {
  const { publicKey, walletType, connected } = useUnifiedWallet()
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created')
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    sortBy: 'newest',
  })

  // Get user ID from wallet address
  const { data: userData } = useQuery({
    queryKey: ['user-by-wallet', publicKey?.toString()],
    queryFn: async () => {
      if (!publicKey) return null
      return await UserService.getUserByWalletAddress(publicKey.toString())
    },
    enabled: !!publicKey,
  })

  const userId = userData?.id

  // Fetch dashboard data using Supabase
  const {
    createdMarkets,
    joinedMarkets,
    allInvolvedMarkets,
    isLoading,
  } = useSupabaseDashboardData(userId)

  // Apply filters to markets
  const filteredCreatedMarkets = useFilteredMarkets<SupabaseMarketDashboardInfo>(
    createdMarkets.map(transformToLegacyMarketFormat), 
    filters
  ).map((legacyMarket, index) => createdMarkets[index]).filter(Boolean)

  const filteredJoinedMarkets = useFilteredMarkets<SupabaseMarketDashboardInfo>(
    joinedMarkets.map(transformToLegacyMarketFormat), 
    filters
  ).map((legacyMarket, index) => joinedMarkets[index]).filter(Boolean)

  // Show loading state if user is logged in with Crossmint but wallet is still being created
  if (walletType === 'crossmint' && !publicKey) {
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
            <span className="icon-[mdi--loading] w-12 h-12 animate-spin" style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h1 className="font-jakarta text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Setting Up Your Wallet
          </h1>
          <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
            Please wait while we create your embedded wallet...
          </p>
        </div>
      </div>
    )
  }

  // Show connect prompt if no wallet is connected
  if (!connected || !publicKey) {
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
              to="/"
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
          <SupabasePortfolioSummary
            userId={userId}
            allMarkets={allInvolvedMarkets}
          />
        </div>

        {/* Recent Activity & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RecentActivity markets={allInvolvedMarkets.map(transformToLegacyMarketFormat)} limit={5} />
          <PerformanceChart markets={allInvolvedMarkets.map(transformToLegacyMarketFormat)} />
        </div>

        {/* Advanced Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <PredictionDistributionChart markets={allInvolvedMarkets.map(transformToLegacyMarketFormat)} />
          <PoolTrendChart markets={allInvolvedMarkets.map(transformToLegacyMarketFormat)} />
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
