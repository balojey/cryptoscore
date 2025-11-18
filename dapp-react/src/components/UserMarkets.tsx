import type { Market } from '../types'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAccount, useReadContract } from 'wagmi'
import { CRYPTO_SCORE_DASHBOARD_ADDRESS, CryptoScoreDashboardABI } from '../config/contracts'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from './EnhancedMarketCard'

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
    if (!userCreatedMarkets && !userJoinedMarkets)
      return []

    const combinedMarkets = [
      ...(userCreatedMarkets || []),
      ...(userJoinedMarkets || []),
    ]

    // Remove duplicates based on marketAddress
    const uniqueMarketsMap = new Map<string, Market>()
    combinedMarkets.forEach((market) => {
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
          <h2 className="font-jakarta text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Active Markets
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array.from({ length: 3 })].map((_, i) => <EnhancedMarketCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  // Empty state
  if (!userMarkets || userMarkets.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-jakarta text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Active Markets
          </h2>
        </div>
        <div
          className="text-center py-12 border-2 border-dashed rounded-[16px]"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <span className="icon-[mdi--cards-outline] w-16 h-16 mx-auto" style={{ color: 'var(--text-tertiary)' }} />
          <p className="mt-4 font-sans text-lg" style={{ color: 'var(--text-secondary)' }}>
            You haven't joined or created any markets yet.
          </p>
          <p className="font-sans text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Explore the open markets below to get started!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-jakarta text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          My Active Markets
        </h2>
        <Link
          to="/my-markets"
          className="flex items-center gap-2 text-sm font-bold hover:underline"
          style={{ color: 'var(--accent-cyan)' }}
        >
          <span>View All</span>
          <span className="icon-[mdi--arrow-right]" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Show the 3 most recent markets */}
        {userMarkets.slice(0, 3).map(market => (
          <EnhancedMarketCard market={market} key={market.marketAddress} />
        ))}
      </div>
    </div>
  )
}
