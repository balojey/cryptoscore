import type { Market } from '../../types'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useMatchData } from '../../hooks/useMatchData'

type BadgeType = 'hot' | 'ending-soon' | 'popular'

interface FeaturedMarket extends Market {
  badge: BadgeType
  badgeLabel: string
  poolSize: number
}

interface FeaturedMarketsProps {
  markets: Market[]
  isLoading?: boolean
  error?: string
  onRetry?: () => void
}

// Selection algorithm for featured markets
function selectFeaturedMarkets(markets: Market[]): FeaturedMarket[] {
  const now = Date.now()
  const featured: FeaturedMarket[] = []

  // Filter out resolved markets
  const activeMarkets = markets.filter(m => !m.resolved)

  // 1. Top 3 by pool size (Hot)
  const byPoolSize = [...activeMarkets]
    .sort((a, b) => {
      // Convert lamports to SOL for comparison
      const poolA = (Number(a.entryFee) * Number(a.participantsCount)) / 1_000_000_000
      const poolB = (Number(b.entryFee) * Number(b.participantsCount)) / 1_000_000_000
      return poolB - poolA
    })
    .slice(0, 3)
    .map(market => ({
      ...market,
      badge: 'hot' as BadgeType,
      badgeLabel: '🔥 Hot',
      poolSize: (Number(market.entryFee) * Number(market.participantsCount)) / 1_000_000_000,
    }))

  featured.push(...byPoolSize)

  // 2. Top 2 ending soon (< 24 hours)
  const endingSoon = activeMarkets
    .filter((m) => {
      const startTime = Number(m.startTime) * 1000
      const timeUntilStart = startTime - now
      const hoursUntilStart = timeUntilStart / (1000 * 60 * 60)
      return hoursUntilStart > 0 && hoursUntilStart < 24
    })
    .filter(m => !featured.some(f => f.marketAddress === m.marketAddress))
    .sort((a, b) => Number(a.startTime) - Number(b.startTime))
    .slice(0, 2)
    .map(market => ({
      ...market,
      badge: 'ending-soon' as BadgeType,
      badgeLabel: '⏰ Ending Soon',
      poolSize: (Number(market.entryFee) * Number(market.participantsCount)) / 1_000_000_000,
    }))

  featured.push(...endingSoon)

  // 3. Top 2 by participants (Popular)
  const byParticipants = [...activeMarkets]
    .filter(m => !featured.some(f => f.marketAddress === m.marketAddress))
    .sort((a, b) => Number(b.participantsCount) - Number(a.participantsCount))
    .slice(0, 2)
    .map(market => ({
      ...market,
      badge: 'popular' as BadgeType,
      badgeLabel: '👥 Popular',
      poolSize: (Number(market.entryFee) * Number(market.participantsCount)) / 1_000_000_000,
    }))

  featured.push(...byParticipants)

  // Limit to 7 total
  return featured.slice(0, 7)
}

// Compact market card for featured section
function FeaturedMarketCard({ market }: { market: FeaturedMarket }) {
  const { data: matchData, loading } = useMatchData(Number(market.matchId))

  if (loading) {
    return (
      <div
        className="p-4 rounded-lg animate-pulse"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 skeleton" />
          <div className="h-5 w-20 skeleton rounded-full" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 skeleton rounded" />
          <div className="h-4 w-8 skeleton" />
          <div className="w-10 h-10 skeleton rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-16 skeleton" />
          <div className="h-3 w-16 skeleton" />
        </div>
      </div>
    )
  }

  if (!matchData) {
    return null
  }

  const matchDate = new Date(matchData.utcDate)
  const badgeVariant = market.badge === 'hot' ? 'error' : market.badge === 'ending-soon' ? 'warning' : 'info'

  return (
    <Link
      to={`/markets/${market.marketAddress}`}
      className="block"
      style={{ textDecoration: 'none' }}
    >
      <div
        className="p-4 rounded-lg transition-all hover-lift"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Header with badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="icon-[mdi--trophy-outline] w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
            <p className="text-xs font-medium truncate max-w-[150px]" style={{ color: 'var(--text-secondary)' }}>
              {matchData.competition.name}
            </p>
          </div>
          <Badge variant={badgeVariant} className="text-[10px] px-2 py-0.5">
            {market.badgeLabel}
          </Badge>
        </div>

        {/* Teams - Compact horizontal layout */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img
              src={`https://corsproxy.io/?${matchData.homeTeam.crest}`}
              alt={matchData.homeTeam.name}
              className="w-10 h-10 object-contain rounded"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/40' }}
            />
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {matchData.homeTeam.shortName || matchData.homeTeam.tla}
            </span>
          </div>

          <span className="text-xs font-bold px-2" style={{ color: 'var(--text-tertiary)' }}>
            VS
          </span>

          <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
            <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {matchData.awayTeam.shortName || matchData.awayTeam.tla}
            </span>
            <img
              src={`https://corsproxy.io/?${matchData.awayTeam.crest}`}
              alt={matchData.awayTeam.name}
              className="w-10 h-10 object-contain rounded"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/40' }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <span className="icon-[mdi--database-outline] w-3.5 h-3.5" />
            <span className="font-mono">
              {market.poolSize.toFixed(2)}
              {' '}
              SOL
            </span>
          </div>
          <div className="flex items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <span className="icon-[mdi--account-group-outline] w-3.5 h-3.5" />
            <span>
              {Number(market.participantsCount)}
              {' '}
              players
            </span>
          </div>
          <div style={{ color: 'var(--text-tertiary)' }}>
            {matchDate.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>
    </Link>
  )
}

// Loading skeleton for featured markets
function FeaturedMarketsLoading() {
  return (
    <div className="space-y-3 animate-fade-in">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="p-4 rounded-lg"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 skeleton rounded" />
            <div className="h-5 w-20 skeleton rounded-full" />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 skeleton rounded" />
            <div className="h-4 w-8 skeleton rounded" />
            <div className="w-10 h-10 skeleton rounded" />
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16 skeleton rounded" />
            <div className="h-3 w-16 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Main FeaturedMarkets component
export default function FeaturedMarkets({ markets, isLoading, error, onRetry }: FeaturedMarketsProps) {
  // Apply selection algorithm
  const featuredMarkets = useMemo(() => {
    if (!markets || markets.length === 0)
      return []
    return selectFeaturedMarkets(markets)
  }, [markets])

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Featured Markets
          </h3>
          <span className="icon-[mdi--star-outline] w-5 h-5" style={{ color: 'var(--accent-amber)' }} />
        </div>

        {/* Loading state */}
        {isLoading && <FeaturedMarketsLoading />}

        {/* Error state */}
        {!isLoading && error && (
          <div
            className="text-center py-8 rounded-lg"
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--accent-red)',
            }}
          >
            <span className="icon-[mdi--alert-circle-outline] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--accent-red)' }} />
            <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Unable to load featured markets</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>
              {error}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 text-sm font-medium rounded transition-all hover-lift"
                style={{
                  background: 'var(--accent-cyan)',
                  color: 'var(--text-inverse)',
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="icon-[mdi--refresh] w-4 h-4" />
                  <span>Retry</span>
                </span>
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && featuredMarkets.length === 0 && (
          <div
            className="text-center py-8 rounded-lg"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
            }}
          >
            <span className="icon-[mdi--information-outline] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No featured markets available</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Check back soon for exciting markets!
            </p>
          </div>
        )}

        {/* Featured markets list */}
        {!isLoading && !error && featuredMarkets.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {featuredMarkets.map(market => (
              <FeaturedMarketCard key={market.marketAddress} market={market} />
            ))}
          </div>
        )}

        {/* View All Markets link */}
        {!isLoading && !error && featuredMarkets.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
            <Link
              to="/markets"
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all hover-lift font-medium"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--accent-cyan)',
              }}
            >
              <span>View All Markets</span>
              <span className="icon-[mdi--arrow-right] w-5 h-5" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
