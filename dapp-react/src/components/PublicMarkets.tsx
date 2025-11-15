import { useEffect, useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'
import MarketCard, { MarketCardSkeleton } from './MarketCard'
import type { Market } from './MarketCard'

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
      className="flex items-center justify-center gap-2 h-11 px-6 bg-white text-slate-700 rounded-[12px] font-sans text-sm font-bold tracking-wider transition-all border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
    >
      {children}
    </button>
  )

  if (isLoading && markets.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(PAGE_SIZE)].map((_, i) => <MarketCardSkeleton key={i} />)}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-[16px] text-center" role="alert">
        <h4 className="font-bold mb-1">Error Loading Markets</h4>
        <p className="text-sm">{(error as any)?.shortMessage || 'An unexpected error occurred.'}</p>
      </div>
    )
  }

  if (!isLoading && markets.length === 0 && offset === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-[16px]">
        <span className="icon-[mdi--database-off-outline] w-16 h-16 text-slate-300 mx-auto" />
        <p className="mt-4 font-sans text-xl font-semibold text-slate-600">No Community Markets Found</p>
        <p className="font-sans text-base text-slate-400">Be the first to create one!</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {markets.map((m, i) => (
          <MarketCard
            key={`${m.marketAddress}-${i}`}
            market={m}
            variant="default"
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
