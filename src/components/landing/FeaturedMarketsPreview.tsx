import type { MarketData } from '../../hooks/useSupabaseMarketData'
import type { Market } from '../../types'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSupabaseAllMarkets, useSupabaseUserParticipantMarkets } from '../../hooks/useSupabaseMarketData'
import { useUnifiedWallet } from '../../contexts/UnifiedWalletContext'
import EnhancedMarketCard, { EnhancedMarketCardSkeleton } from '../cards/EnhancedMarketCard'
import ErrorBanner from '../terminal/ErrorBanner'

// Helper to transform MarketData to Market type
function transformMarketData(marketData: MarketData): Market {
  return {
    marketAddress: marketData.marketAddress,
    matchId: BigInt(marketData.matchId),
    entryFee: BigInt(marketData.entryFee),
    creator: marketData.creator,
    participantsCount: BigInt(marketData.participantCount),
    resolved: marketData.status === 'Resolved',
    isPublic: marketData.isPublic,
    startTime: BigInt(marketData.kickoffTime),
    homeCount: BigInt(marketData.homeCount),
    awayCount: BigInt(marketData.awayCount),
    drawCount: BigInt(marketData.drawCount),
  }
}

// Main component
export default function FeaturedMarketsPreview() {
  const [showError, setShowError] = useState(true)
  const [cachedMarkets, setCachedMarkets] = useState<Market[] | null>(null)

  // Get current user's wallet
  const { walletAddress } = useUnifiedWallet()

  // Fetch all markets using the new Anchor-free hook
  const { data: marketsData, isLoading, isError, refetch } = useSupabaseAllMarkets()

  // Fetch markets where user is a participant (to check access to private markets)
  const { data: userParticipantMarkets } = useSupabaseUserParticipantMarkets(walletAddress || undefined)

  // Transform market data to expected format and filter private markets
  const transformedMarkets = useMemo(() => {
    if (!marketsData || !Array.isArray(marketsData))
      return null

    // Create a set of market addresses where user is a participant
    const userParticipantMarketAddresses = new Set(
      userParticipantMarkets?.map(m => m.marketAddress) || []
    )

    // Filter out private markets that user isn't authorized to see
    const filteredMarkets = marketsData.filter((marketData) => {
      // Show all public markets
      if (marketData.isPublic) {
        return true
      }

      // For private markets, only show if:
      // 1. User is the creator
      // 2. User is a participant
      if (walletAddress) {
        const isCreator = marketData.creator.toLowerCase() === walletAddress.toLowerCase()
        const isParticipant = userParticipantMarketAddresses.has(marketData.marketAddress)
        return isCreator || isParticipant
      }

      // Hide private markets from unauthenticated users
      return false
    })

    return filteredMarkets.map(transformMarketData)
  }, [marketsData, walletAddress, userParticipantMarkets])

  // Cache successful data fetches
  useEffect(() => {
    if (transformedMarkets && transformedMarkets.length > 0) {
      setCachedMarkets(transformedMarkets)
    }
  }, [transformedMarkets])

  // Use cached data if available and current fetch failed
  const dataToUse = (isError && cachedMarkets) ? cachedMarkets : transformedMarkets

  const handleRetry = () => {
    setShowError(true)
    refetch().catch(console.error)
  }

  const handleDismiss = () => {
    setShowError(false)
  }

  // Select featured markets based on criteria with fallback strategy
  const selectFeaturedMarkets = (markets: Market[]): Market[] => {
    if (!markets || markets.length === 0)
      return []

    const now = new Date()
    const featured: Market[] = []
    const used = new Set<string>()

    // Helper to add market if not already used
    const addMarket = (market: Market) => {
      if (!used.has(market.marketAddress)) {
        featured.push(market)
        used.add(market.marketAddress)
        return true
      }
      return false
    }

    // Strategy 1: Try to get open markets (not resolved and not started yet)
    const openMarkets = markets.filter((m) => {
      const startTime = new Date(Number(m.startTime) * 1000)
      return !m.resolved && startTime > now
    })

    if (openMarkets.length > 0) {
      // 1. Top 2 markets ending soon (< 24 hours)
      const endingSoon = openMarkets
        .map((m) => {
          const startTime = new Date(Number(m.startTime) * 1000)
          const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
          return { market: m, hoursUntilStart }
        })
        .filter(({ hoursUntilStart }) => hoursUntilStart < 24 && hoursUntilStart > 0)
        .sort((a, b) => a.hoursUntilStart - b.hoursUntilStart)
        .slice(0, 2)

      endingSoon.forEach(({ market }) => addMarket(market))

      // 2. Top markets by pool size (if we need more)
      if (featured.length < 6) {
        const byPoolSize = [...openMarkets]
          .sort((a, b) => {
            const poolA = Number(a.entryFee) * Number(a.participantsCount)
            const poolB = Number(b.entryFee) * Number(b.participantsCount)
            return poolB - poolA
          })
          .slice(0, 6 - featured.length)

        byPoolSize.forEach(market => addMarket(market))
      }

      // 3. Recently created markets (if we need more)
      if (featured.length < 6) {
        const recentMarkets = [...openMarkets]
          .sort((a, b) => Number(b.startTime) - Number(a.startTime))
          .slice(0, 6 - featured.length)

        recentMarkets.forEach(market => addMarket(market))
      }
    }

    // Strategy 2: If no open markets, show live markets (started but not resolved)
    if (featured.length === 0) {
      const liveMarkets = markets.filter((m) => {
        const startTime = new Date(Number(m.startTime) * 1000)
        return !m.resolved && startTime <= now
      })

      if (liveMarkets.length > 0) {
        // Sort by pool size and take top 6
        const topLive = [...liveMarkets]
          .sort((a, b) => {
            const poolA = Number(a.entryFee) * Number(a.participantsCount)
            const poolB = Number(b.entryFee) * Number(b.participantsCount)
            return poolB - poolA
          })
          .slice(0, 6)

        topLive.forEach(market => addMarket(market))
      }
    }

    // Strategy 3: If no open or live markets, show recently resolved markets
    if (featured.length === 0) {
      const resolvedMarkets = markets.filter(m => m.resolved)

      if (resolvedMarkets.length > 0) {
        // Sort by pool size and take top 6
        const topResolved = [...resolvedMarkets]
          .sort((a, b) => {
            const poolA = Number(a.entryFee) * Number(a.participantsCount)
            const poolB = Number(b.entryFee) * Number(b.participantsCount)
            return poolB - poolA
          })
          .slice(0, 6)

        topResolved.forEach(market => addMarket(market))
      }
    }

    // Strategy 4: Last resort - show any markets available
    if (featured.length === 0 && markets.length > 0) {
      const anyMarkets = [...markets]
        .sort((a, b) => {
          const poolA = Number(a.entryFee) * Number(a.participantsCount)
          const poolB = Number(b.entryFee) * Number(b.participantsCount)
          return poolB - poolA
        })
        .slice(0, 6)

      anyMarkets.forEach(market => addMarket(market))
    }

    // Return up to 6 featured markets
    return featured.slice(0, 6)
  }

  const featuredMarkets = dataToUse ? selectFeaturedMarkets(dataToUse) : []

  // Determine section title based on market types
  const getSectionTitle = () => {
    if (featuredMarkets.length === 0)
      return 'Live Markets'

    const now = new Date()
    const hasOpenMarkets = featuredMarkets.some((m) => {
      const startTime = new Date(Number(m.startTime) * 1000)
      return !m.resolved && startTime > now
    })

    const hasLiveMarkets = featuredMarkets.some((m) => {
      const startTime = new Date(Number(m.startTime) * 1000)
      return !m.resolved && startTime <= now
    })

    const allResolved = featuredMarkets.every(m => m.resolved)

    if (hasOpenMarkets)
      return 'Featured Markets'
    if (hasLiveMarkets)
      return 'Live Markets'
    if (allResolved)
      return 'Recently Resolved Markets'
    return 'Markets'
  }

  const sectionTitle = getSectionTitle()

  if (isLoading) {
    return (
      <section className="py-16 md:py-24" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Featured Markets
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Join thousands of traders predicting match outcomes
            </p>
          </div>

          {/* Loading Skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array.from({ length: 3 })].map((_, i) => (
              <EnhancedMarketCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Show empty state only if no error and no markets
  if (!isLoading && !isError && featuredMarkets.length === 0) {
    return (
      <section className="py-16 md:py-24" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Featured Markets
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Join thousands of traders predicting match outcomes
            </p>
          </div>

          {/* Empty State */}
          <div className="text-center py-12">
            <span className="icon-[mdi--database-off-outline] w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
            <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
              No active markets available right now
            </p>
            <Link to="/markets" className="btn-primary">
              <span className="icon-[mdi--plus-circle-outline] w-5 h-5" />
              <span>Create a Market</span>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // Show error state with retry if error and no cached data
  if (isError && !cachedMarkets && !isLoading) {
    return (
      <section className="py-16 md:py-24" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              Featured Markets
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Join thousands of traders predicting match outcomes
            </p>
          </div>

          {/* Error State */}
          <div className="max-w-2xl mx-auto">
            <ErrorBanner
              message="Unable to load featured markets. Please check your connection and try again."
              type="error"
              onRetry={handleRetry}
            />
          </div>

          {/* Fallback CTA */}
          <div className="text-center py-12">
            <Link to="/markets" className="btn-primary">
              <span>Browse All Markets</span>
              <span className="icon-[mdi--arrow-right] w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 md:py-24" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {sectionTitle}
          </h2>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Join thousands of traders predicting match outcomes
          </p>
        </div>

        {/* Error Banner - Show if error but we have cached data */}
        {isError && cachedMarkets && showError && (
          <div className="max-w-4xl mx-auto mb-8">
            <ErrorBanner
              message="Unable to fetch latest markets. Showing cached data."
              type="warning"
              onRetry={handleRetry}
              onDismiss={handleDismiss}
            />
          </div>
        )}

        {/* Markets Grid - Responsive */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-slide-in-up">
          {featuredMarkets.map((market, index) => (
            <div
              key={market.marketAddress}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <EnhancedMarketCard market={market} />
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Link to="/markets" className="btn-primary btn-lg">
            <span>View All Markets</span>
            <span className="icon-[mdi--arrow-right] w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
