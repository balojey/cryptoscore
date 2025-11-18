import type { MarketDashboardInfo } from '../types'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract } from 'wagmi'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from '../components/EnhancedMarketCard'
import PortfolioSummary from '../components/PortfolioSummary'
import RecentActivity from '../components/RecentActivity'
import PerformanceChart from '../components/PerformanceChart'
import PredictionDistributionChart from '../components/charts/PredictionDistributionChart'
import PoolTrendChart from '../components/charts/PoolTrendChart'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'

const MarketList = ({ markets, isLoading, emptyMessage, emptyIcon }: { 
  markets: MarketDashboardInfo[]
  isLoading: boolean
  emptyMessage: string
  emptyIcon: string
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => <EnhancedMarketCardSkeleton key={i} />)}
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
          to="/" 
          className="inline-flex items-center gap-2 mt-6 btn-primary"
        >
          <span className="icon-[mdi--magnify] w-5 h-5" />
          <span>Explore Markets</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {markets.map(market => (
        <EnhancedMarketCard market={market} key={market.marketAddress} />
      ))}
    </div>
  )
}

export function MyMarkets() {
  const { address } = useAccount()
  const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created')

  const { data: allInvolvedCreatedMarkets, isLoading: isLoadingCreated } = useReadContract({
    abi: CryptoScoreDashboardABI,
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    functionName: 'getUserMarketsDashboardPaginated',
    args: [address, 0, 100, true],
    query: { enabled: !!address },
  }) as { data: MarketDashboardInfo[] | undefined, isLoading: boolean }

  const { data: allInvolvedJoinedMarkets, isLoading: isLoadingJoined } = useReadContract({
    abi: CryptoScoreDashboardABI,
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    functionName: 'getUserMarketsDashboardPaginated',
    args: [address, 0, 100, false],
    query: { enabled: !!address },
  }) as { data: MarketDashboardInfo[] | undefined, isLoading: boolean }

  const allInvolvedMarkets = useMemo(() => {
      if (!allInvolvedCreatedMarkets && !allInvolvedJoinedMarkets) return []
  
      const combinedMarkets = [
        ...(allInvolvedCreatedMarkets || []),
        ...(allInvolvedJoinedMarkets || []),
      ]
  
      // Remove duplicates based on marketAddress
      const uniqueMarketsMap = new Map<string, MarketDashboardInfo>()
      combinedMarkets.forEach(market => {
        uniqueMarketsMap.set(market.marketAddress, market)
      })
  
      // Convert back to array and sort by starting date
      const uniqueMarkets = Array.from(uniqueMarketsMap.values())
      uniqueMarkets.sort((a, b) => Number(b.startTime) - Number(a.startTime))
  
      return uniqueMarkets
    }, [allInvolvedCreatedMarkets, allInvolvedJoinedMarkets])

  const { createdMarkets, joinedMarkets } = useMemo(() => {
    const created: MarketDashboardInfo[] = []
    const joined: MarketDashboardInfo[] = []

    if (allInvolvedMarkets && address) {
      allInvolvedMarkets.forEach((market) => {
        if (market.creator.toLowerCase() === address.toLowerCase()) {
          created.push(market)
        }
        else {
          joined.push(market)
        }
      })
    }
    return { createdMarkets: created, joinedMarkets: joined }
  }, [allInvolvedMarkets, address])



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
    icon
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
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-cyan)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
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
          <PortfolioSummary markets={allInvolvedMarkets} userAddress={address} />
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

        {/* Market Lists */}
        <div className="space-y-8">
          {activeTab === 'created' && (
            <MarketList
              markets={createdMarkets}
              isLoading={isLoadingCreated || isLoadingJoined}
              emptyMessage="You haven't created any markets yet."
              emptyIcon="mdi--plus-circle-outline"
            />
          )}
          {activeTab === 'joined' && (
            <MarketList
              markets={joinedMarkets}
              isLoading={isLoadingCreated || isLoadingJoined}
              emptyMessage="You haven't joined any markets yet."
              emptyIcon="mdi--cards-outline"
            />
          )}
        </div>
      </div>
    </div>
  )
}
