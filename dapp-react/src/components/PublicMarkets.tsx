import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'
import PublicMarketCard from './PublicMarketCard'

const PAGE_SIZE = 6

export default function PublicMarkets() {
  const { address } = useAccount()
  const [offset, setOffset] = useState(0)
  const [markets, setMarkets] = useState<any[]>([])
  const [hasMore, setHasMore] = useState(true)

  const { data, isLoading, isError, error, refetch } = useReadContract({
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    abi: CryptoScoreDashboardABI,
    functionName: 'getMarketsDashboardPaginated',
    args: [BigInt(offset), BigInt(PAGE_SIZE), true],
  })

  useEffect(() => {
    if (data && Array.isArray(data)) {
      if (data.length < PAGE_SIZE) {
        setHasMore(false)
      } else {
        setHasMore(true)
      }
      // Filter out markets created by the current user
      const filteredData = data.filter((market: any) => market.creator.toLowerCase() !== address?.toLowerCase())
      setMarkets(filteredData)
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">️ Community Markets</h1>

      {isError && (
        <div className="text-red-500 text-center">
          <p>Error loading markets:</p>
          <p className="text-sm">{error?.message}</p>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}

      {!isLoading && markets.length === 0 && (
        <p className="text-gray-500 text-center">No public markets yet!</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {markets.map((m, i) => (
          <PublicMarketCard
            key={i}
            marketAddress={m.marketAddress}
            matchId={m.matchId}
            entryFee={m.entryFee}
            creator={m.creator}
            participantsCount={m.participantsCount}
            resolved={m.resolved}
            startTime={m.startTime}
            isPublic={m.isPublic}
          />
        ))}
      </div>

      <div className="flex justify-center gap-3 mt-6">
        <button onClick={handlePrevPage} disabled={offset === 0 || isLoading} className="btn">
          Previous
        </button>
        <button onClick={handleNextPage} disabled={!hasMore || isLoading} className="btn">
          Next
        </button>
      </div>
    </div>
  )
}
