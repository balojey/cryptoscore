import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract } from 'wagmi'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'
import MarketCard, { MarketCardSkeleton } from './MarketCard'
import { Market } from '../types'

export function UserMarkets() {
  const { address, isConnected } = useAccount()

  const { data: userCreatedMarkets, isLoading: isLoadingCreated } = useReadContract({
    abi: CryptoScoreDashboardABI,
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    functionName: 'getUserMarketsDashboardPaginated',
    args: [address, 0, 10, true], // Fetch up to 10 of the user's most recent markets
    query: { enabled: !!address },
  }) as { data: Market[] | undefined, isLoading: boolean }

  const { data: userJoinedMarkets, isLoading: isLoadingJoined } = useReadContract({
    abi: CryptoScoreDashboardABI,
    address: CRYPTO_SCORE_DASHBOARD_ADDRESS,
    functionName: 'getUserMarketsDashboardPaginated',
    args: [address, 0, 10, false], // Fetch up to 10 of the user's most recent markets
    query: { enabled: !!address },
  }) as { data: Market[] | undefined, isLoading: boolean }

  const userMarkets = useMemo(() => {
    if (!userCreatedMarkets && !userJoinedMarkets) return []

    const combinedMarkets = [
      ...(userCreatedMarkets || []),
      ...(userJoinedMarkets || []),
    ]

    // Remove duplicates based on marketAddress
    const uniqueMarketsMap = new Map<string, Market>()
    combinedMarkets.forEach(market => {
      uniqueMarketsMap.set(market.marketAddress, market)
    })

    // Convert back to array and sort by creation date (assuming market has a creationDate property)
    const uniqueMarkets = Array.from(uniqueMarketsMap.values())
    uniqueMarkets.sort((a, b) => Number(b.startTime) - Number(a.startTime))

    return uniqueMarkets
  }, [userCreatedMarkets, userJoinedMarkets])

  // Don't render the component if the user is not connected.
  // The homepage will just show the hero and public markets.
  if (!isConnected) {
    return null
  }

  // Loading state
  if (isLoadingCreated || isLoadingJoined) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-jakarta text-3xl font-bold text-[#1E293B]">My Active Markets</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <MarketCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  // Empty state
  if (!userMarkets || userMarkets.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-jakarta text-3xl font-bold text-[#1E293B]">My Active Markets</h2>
        </div>
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-[16px]">
          <span className="icon-[mdi--cards-outline] w-16 h-16 text-slate-300 mx-auto" />
          <p className="mt-4 font-sans text-lg text-slate-600">You haven't joined or created any markets yet.</p>
          <p className="font-sans text-sm text-slate-400">Explore the open markets below to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-jakarta text-3xl font-bold text-[#1E293B]">My Active Markets</h2>
        <Link
          to="/my-markets"
          className="flex items-center gap-2 text-sm font-bold text-[#0A84FF] hover:underline"
        >
          <span>View All</span>
          <span className="icon-[mdi--arrow-right]" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Show the 3 most recent markets */}
        {userMarkets.slice(0, 3).map(market => (
          <MarketCard market={market} key={market.marketAddress} variant="compact" />
        ))}
      </div>
    </div>
  )
}
