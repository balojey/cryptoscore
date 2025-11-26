import type { Market } from '../../types'
import type { FilterOptions } from './MarketFilters'
import { useMemo, useState } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI, CryptoScoreMarketABI } from '../../config/contracts'
import { useFilteredMarkets } from '../../hooks/useFilteredMarkets'
import { useRealtimeMarkets } from '../../hooks/useRealtimeMarkets'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from '../cards/EnhancedMarketCard'
import VirtualMarketList from '../VirtualMarketList'
import MarketFilters from './MarketFilters'

const PAGE_SIZE = 12 // Can increase now since we're not hitting gas limits

export default function PublicMarkets() {
  const { address } = useAccount()
  const [currentPage, setCurrentPage] = useState(0)
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    sortBy: 'newest',
  })

  // Get all markets from factory (lightweight call)
  const { data: factoryMarkets, isLoading: isLoadingFactory, isError, error, refetch } = useReadContract({
    address: CRYPTO_SCORE_FACTORY_ADDRESS as `0x${string}`,
    abi: CryptoScoreFactoryABI,
    functionName: 'getAllMarkets',
  })

  // Filter public markets and exclude user's own markets
  const publicMarketAddresses = useMemo(() => {
    if (!factoryMarkets || !Array.isArray(factoryMarkets)) return []
    
    return factoryMarkets
      .filter((m: any) => m.isPublic && (!address || m.creator.toLowerCase() !== address.toLowerCase()))
      .map((m: any) => m.marketAddress)
  }, [factoryMarkets, address])

  // Paginate addresses
  const paginatedAddresses = useMemo(() => {
    const start = currentPage * PAGE_SIZE
    const end = start + PAGE_SIZE
    return publicMarketAddresses.slice(start, end)
  }, [publicMarketAddresses, currentPage])

  // Fetch detailed data for current page markets
  const marketContracts = useMemo(() => {
    return paginatedAddresses.flatMap((addr: string) => [
      {
        address: addr as `0x${string}`,
        abi: CryptoScoreMarketABI as any,
        functionName: 'resolved' as const,
      },
      {
        address: addr as `0x${string}`,
        abi: CryptoScoreMarketABI as any,
        functionName: 'winner' as const,
      },
      {
        address: addr as `0x${string}`,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getParticipantsCount' as const,
      },
      {
        address: addr as `0x${string}`,
        abi: CryptoScoreMarketABI as any,
        functionName: 'getPredictionCounts' as const,
      },
    ])
  }, [paginatedAddresses])

  const { data: marketDetails, isLoading: isLoadingDetails } = useReadContracts({
    contracts: marketContracts,
    query: {
      enabled: paginatedAddresses.length > 0,
    },
  })

  // Combine factory data with market details
  const markets = useMemo(() => {
    if (!factoryMarkets || !marketDetails || !Array.isArray(factoryMarkets)) return []

    const result: Market[] = []
    
    paginatedAddresses.forEach((addr: string, idx: number) => {
      const factoryInfo = (factoryMarkets as any[]).find((m: any) => m.marketAddress === addr)
      if (!factoryInfo) return

      const baseIdx = idx * 4
      const resolved = marketDetails[baseIdx]?.result as boolean
      const participantsCount = marketDetails[baseIdx + 2]?.result as bigint
      const predictionCounts = marketDetails[baseIdx + 3]?.result as [bigint, bigint, bigint]

      result.push({
        marketAddress: addr as `0x${string}`,
        matchId: BigInt(factoryInfo.matchId?.toString() || '0'),
        creator: factoryInfo.creator,
        entryFee: BigInt(factoryInfo.entryFee?.toString() || '0'),
        resolved: resolved ?? false,
        participantsCount: participantsCount ? BigInt(participantsCount.toString()) : BigInt(0),
        isPublic: factoryInfo.isPublic,
        startTime: BigInt(factoryInfo.startTime?.toString() || '0'),
        homeCount: predictionCounts ? BigInt(predictionCounts[0]?.toString() || '0') : BigInt(0),
        awayCount: predictionCounts ? BigInt(predictionCounts[1]?.toString() || '0') : BigInt(0),
        drawCount: predictionCounts ? BigInt(predictionCounts[2]?.toString() || '0') : BigInt(0),
      })
    })

    return result
  }, [factoryMarkets, marketDetails, paginatedAddresses])

  const isLoading = isLoadingFactory || isLoadingDetails

  // Enable real-time updates
  useRealtimeMarkets({
    enabled: true,
    interval: 10000, // Poll every 10 seconds
    onUpdate: () => {
      refetch()
    },
  })

  const totalPages = Math.ceil(publicMarketAddresses.length / PAGE_SIZE)
  const hasMore = currentPage < totalPages - 1
  const hasPrev = currentPage > 0

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (hasPrev) {
      setCurrentPage(prev => prev - 1)
    }
  }

  // Apply filters and sorting - MUST be called before any conditional returns
  const filteredMarkets = useFilteredMarkets(markets, filters)

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
    console.error('Contract read error:', error)
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
        <p className="text-sm">{(error as any)?.shortMessage || (error as any)?.message || 'Failed to load markets. Please try again later.'}</p>
      </div>
    )
  }

  if (!isLoading && publicMarketAddresses.length === 0) {
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
            Page {currentPage + 1} of {totalPages}
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
