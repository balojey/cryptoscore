import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import type { Market } from '../../types'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from '../cards/EnhancedMarketCard'
import { useUserMarkets } from '../../hooks/useMarketData'

export function UserMarkets() {
  const { publicKey, connected } = useWallet()
  
  // Fetch user's markets
  const { data: marketDataList, isLoading } = useUserMarkets(publicKey?.toString())

  const userMarkets = useMemo(() => {
    if (!marketDataList || !publicKey)
      return []

    const now = Date.now() / 1000

    // Convert MarketData to Market format and filter
    const filtered = marketDataList
      .filter((marketData) => {
        // Exclude resolved markets
        if (marketData.status === 'Resolved' || marketData.status === 'Cancelled')
          return false

        // Only include markets that haven't started yet or are within 2 hours of ending
        // (Open, Ending Soon, or Live status)
        if (marketData.kickoffTime < now - 7200)
          return false

        return true
      })
      .map((marketData): Market => ({
        marketAddress: marketData.marketAddress, // Solana PublicKey as base58 string
        matchId: BigInt(marketData.matchId),
        entryFee: BigInt(marketData.entryFee),
        creator: marketData.creator, // Solana PublicKey as base58 string
        participantsCount: BigInt(marketData.participantCount),
        resolved: marketData.status === 'Resolved',
        isPublic: marketData.isPublic,
        startTime: BigInt(marketData.kickoffTime),
        homeCount: BigInt(marketData.homeCount),
        awayCount: BigInt(marketData.awayCount),
        drawCount: BigInt(marketData.drawCount),
      }))
      // Sort by start time (earliest first)
      .sort((a, b) => Number(a.startTime) - Number(b.startTime))

    return filtered
  }, [marketDataList, publicKey])

  // Don't render the component if the user is not connected.
  // The homepage will just show the hero and public markets.
  if (!connected) {
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-jakarta text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            My Active Markets
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <EnhancedMarketCardSkeleton key={i} />)}
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
          to="/dashboard"
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
