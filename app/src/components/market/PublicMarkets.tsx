import type { Market } from '../../types'
import type { FilterOptions } from './MarketFilters'
import { useMemo, useState } from 'react'
import { useUnifiedWallet } from '../../contexts/UnifiedWalletContext'
import { useFilteredMarkets } from '../../hooks/useFilteredMarkets'
import { useAllMarkets } from '../../hooks/useMarketData'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from '../cards/EnhancedMarketCard'
import VirtualMarketList from '../VirtualMarketList'
import MarketFilters from './MarketFilters'

const PAGE_SIZE = 12 // Can increase now since we're not hitting gas limits

export default function PublicMarkets() {
  const { publicKey } = useUnifiedWallet()
  const [currentPage, setCurrentPage] = useState(0)
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    sortBy: 'newest',
  })

  // Get all markets from Solana Dashboard program
  const { data: allMarketsData, isLoading, isError, error, refetch } = useAllMarkets()

  // Filter public markets and exclude user's own markets
  const markets = useMemo(() => {
    if (!allMarketsData || !Array.isArray(allMarketsData))
      return []

    return allMarketsData
      .filter((marketData) => {
        // Only show public markets
        if (!marketData.isPublic)
          return false

        // Exclude user's own markets
        if (publicKey && marketData.creator === publicKey.toString())
          return false

        return true
      })
      .map((marketData): Market => ({
        marketAddress: marketData.marketAddress,
        matchId: BigInt(marketData.matchId),
        creator: marketData.creator,
        entryFee: BigInt(marketData.entryFee),
        resolved: marketData.status === 'Resolved',
        participantsCount: BigInt(marketData.participantCount),
        isPublic: marketData.isPublic,
        startTime: BigInt(marketData.kickoffTime),
        homeCount: BigInt(marketData.homeCount),
        awayCount: BigInt(marketData.awayCount),
        drawCount: BigInt(marketData.drawCount),
      }))
  }, [allMarketsData, publicKey])

  // Apply filters and sorting
  const filteredMarkets = useFilteredMarkets(markets, filters)

  // Pagination controls
  const totalPages = Math.ceil(filteredMarkets.length / PAGE_SIZE)
  const hasMore = currentPage < totalPages - 1
  const hasPrev = currentPage > 0

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1)
      refetch()
    }
  }

  const handlePrevPage = () => {
    if (hasPrev) {
      setCurrentPage(prev => prev - 1)
      refetch()
    }
  }

  const PaginationButton = ({ onClick, disabled, children }: { onClick: () => void, disabled: boolean, children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-secondary"
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )

  if (isLoading && markets.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array.from({ length: 6 })].map((_, i) => <EnhancedMarketCardSkeleton key={i} />)}
      </div>
    )
  }

  if (isError) {
    console.error('Error loading markets:', error)
    return (
      <div
        className="px-6 py-4 rounded-[16px] text-center"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--accent-red)',
          color: 'var(--accent-red)',
        }}
        role="alert"
      >
        <h4 className="font-bold mb-1">Error Loading Markets</h4>
        <p className="text-sm">{(error as any)?.message || 'Failed to load markets. Please try again later.'}</p>
      </div>
    )
  }

  if (!isLoading && markets.length === 0) {
    return (
      <div
        className="text-center py-16 border-2 border-dashed rounded-[16px]"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <span className="icon-[mdi--database-off-outline] w-16 h-16 mx-auto" style={{ color: 'var(--text-tertiary)' }} />
        <p className="mt-4 font-sans text-xl font-semibold" style={{ color: 'var(--text-secondary)' }}>
          No Community Markets Found
        </p>
        <p className="font-sans text-base" style={{ color: 'var(--text-tertiary)' }}>
          Be the first to create one!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <MarketFilters filters={filters} onFilterChange={setFilters} />

      {/* Results Count */}
      {filteredMarkets.length > 0 && (
        <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Showing
          {' '}
          {filteredMarkets.length}
          {' '}
          {filteredMarkets.length === 1 ? 'market' : 'markets'}
        </div>
      )}

      {/* Market Grid - Use virtual scrolling for large lists */}
      {filteredMarkets.length > 20
        ? (
            <VirtualMarketList markets={filteredMarkets} columns={3} />
          )
        : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMarkets.map((m, i) => (
                <EnhancedMarketCard
                  key={`${m.marketAddress}-${i}`}
                  market={m}
                />
              ))}
            </div>
          )}

      {/* No Results */}
      {filteredMarkets.length === 0 && !isLoading && (
        <div
          className="text-center py-16 border-2 border-dashed rounded-xl"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <span className="icon-[mdi--filter-off-outline] w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
          <p className="font-sans text-lg mb-2" style={{ color: 'var(--text-secondary)' }}>
            No markets match your filters
          </p>
          <button
            type="button"
            onClick={() => setFilters({ status: 'all', sortBy: 'newest' })}
            className="btn-secondary btn-sm mt-4"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {filteredMarkets.length > 0 && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12">
          <PaginationButton onClick={handlePrevPage} disabled={!hasPrev || isLoading}>
            <span className="icon-[mdi--arrow-left] w-5 h-5" />
            <span>Previous</span>
          </PaginationButton>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Page
            {' '}
            {currentPage + 1}
            {' '}
            of
            {' '}
            {totalPages}
          </span>
          <PaginationButton onClick={handleNextPage} disabled={!hasMore || isLoading}>
            <span>Next</span>
            <span className="icon-[mdi--arrow-right] w-5 h-5" />
          </PaginationButton>
        </div>
      )}
    </div>
  )
}
