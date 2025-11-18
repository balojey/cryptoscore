import { useEffect, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from './EnhancedMarketCard'
import { Market } from '../types'

const PAGE_SIZE = 6

export default function PublicMarkets() {
  const { address } = useAccount()
  const [offset, setOffset] = useState(0)
  const [markets, setMarkets] = useState<Market[]>([])
  const [hasMore, setHasMore] = useState(true)

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    abi: CryptoScoreDashboardABI,
    functionName: 'getMarketsDashboardPaginated',
    args: [BigInt(offset), BigInt(PAGE_SIZE), true], // Fetching only public markets
  })

  useEffect(() => {
    if (data && Array.isArray(data)) {
      // The contract might return fewer than PAGE_SIZE on the last page
      setHasMore(data.length === PAGE_SIZE)

      // Filter out markets where the creator is the current user, if address is available
      const filteredData = address
        ? data.filter((market: any) => market.creator.toLowerCase() !== address.toLowerCase())
        : data

      setMarkets(filteredData as Market[])
    }
  }, [data, address])

  useEffect(() => {
    refetch()
  }, [offset, refetch])

  const handleNextPage = () => {
    if (hasMore) {
      setOffset(prev => prev + PAGE_SIZE)
    }
  }

  const handlePrevPage = () => {
    setOffset(prev => Math.max(0, prev - PAGE_SIZE))
  }

  const PaginationButton = ({ onClick, disabled, children }: { onClick: () => void, disabled: boolean, children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-secondary btn-sm"
    >
      {children}
    </button>
  )

  if (isLoading && markets.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(PAGE_SIZE)].map((_, i) => <EnhancedMarketCardSkeleton key={i} />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div 
        className="px-6 py-4 rounded-[16px] text-center" 
        style={{ 
          background: 'var(--error-bg)', 
          border: '1px solid var(--error-border)',
          color: 'var(--error)'
        }}
        role="alert"
      >
        <h4 className="font-bold mb-1">Error Loading Markets</h4>
        <p className="text-sm">{(error as any)?.shortMessage || 'An unexpected error occurred.'}</p>
      </div>
    )
  }

  if (!isLoading && markets.length === 0 && offset === 0) {
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
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {markets.map((m, i) => (
          <EnhancedMarketCard
            key={`${m.marketAddress}-${i}`}
            market={m}
          />
        ))}
      </div>

      <div className="flex justify-center items-center gap-4 mt-12">
        <PaginationButton onClick={handlePrevPage} disabled={offset === 0 || isLoading}>
          <span className="icon-[mdi--arrow-left] w-5 h-5" />
          <span>Previous</span>
        </PaginationButton>
        <PaginationButton onClick={handleNextPage} disabled={!hasMore || isLoading}>
          <span>Next</span>
          <span className="icon-[mdi--arrow-right] w-5 h-5" />
        </PaginationButton>
      </div>
    </div>
  )
}
