import type { Market, MarketDashboardInfo } from '../types'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSOL } from '../utils/formatters'

interface RecentActivityProps {
  markets: (Market | MarketDashboardInfo)[]
  limit?: number
  isLoading?: boolean
  error?: string
  onRetry?: () => void
}

// Activity types based on market state
type ActivityType = 'create' | 'join' | 'resolve' | 'unresolved'

interface ActivityItem {
  market: Market | MarketDashboardInfo
  type: ActivityType
  timestamp: bigint
}

// Loading skeleton for recent activity
function RecentActivityLoading({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-fade-in">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-lg"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 skeleton rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 skeleton rounded" />
                  <div className="h-5 w-16 skeleton rounded-full" />
                </div>
                <div className="h-3 w-48 skeleton rounded" />
              </div>
            </div>
            <div className="h-3 w-12 skeleton rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RecentActivity({ markets, limit = 10, isLoading = false, error, onRetry }: RecentActivityProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const prevMarketsLengthRef = useRef(markets.length)
  // Auto-scroll to top on new activity
  useEffect(() => {
    if (markets.length > prevMarketsLengthRef.current && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    prevMarketsLengthRef.current = markets.length
  }, [markets.length])

  // Determine activity type based on market state
  const getActivityType = (market: Market | MarketDashboardInfo): ActivityType => {
    // First check if resolved - this takes priority
    if (market.resolved)
      return 'resolve'

    const now = Date.now()
    const startTime = Number(market.startTime) * 1000

    // If match has started but not resolved yet, it's unresolved (needs resolution)
    if (now > startTime)
      return 'unresolved'

    // If match hasn't started yet but has participants, show as joined
    if (Number(market.participantsCount) > 1)
      return 'join'

    // Otherwise it's just created
    return 'create'
  }

  // Create activity items with types
  const activities: ActivityItem[] = markets.map(market => ({
    market,
    type: getActivityType(market),
    timestamp: market.startTime,
  }))

  // Sort by timestamp (most recent first) and limit to 10
  const recentActivities = [...activities]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .slice(0, limit)

  // Get icon based on activity type
  const getActivityIcon = (type: ActivityType): string => {
    switch (type) {
      case 'create':
        return 'mdi--plus-circle'
      case 'join':
        return 'mdi--account-plus'
      case 'resolve':
        return 'mdi--check-circle'
      case 'unresolved':
        return 'mdi--alert-circle-outline'
      default:
        return 'mdi--clock-outline'
    }
  }

  // Get color based on activity type
  const getActivityColor = (type: ActivityType): string => {
    switch (type) {
      case 'create':
        return 'var(--accent-cyan)'
      case 'join':
        return 'var(--accent-purple)'
      case 'resolve':
        return 'var(--accent-green)'
      case 'unresolved':
        return 'var(--accent-red)'
      default:
        return 'var(--text-tertiary)'
    }
  }

  // Get label based on activity type
  const getActivityLabel = (type: ActivityType): string => {
    switch (type) {
      case 'create':
        return 'Created'
      case 'join':
        return 'Joined'
      case 'resolve':
        return 'Resolved'
      case 'unresolved':
        return 'Unresolved'
      default:
        return 'Activity'
    }
  }

  // Relative timestamp formatting
  const getTimeAgo = (timestamp: bigint): string => {
    const now = Date.now()
    const time = Number(timestamp) * 1000
    const diff = now - time

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    const weeks = Math.floor(diff / 604800000)

    if (weeks > 0)
      return `${weeks}w ago`
    if (days > 0)
      return `${days}d ago`
    if (hours > 0)
      return `${hours}h ago`
    if (minutes > 0)
      return `${minutes}m ago`
    if (seconds > 5)
      return `${seconds}s ago`
    return 'Just now'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Recent Activity</CardTitle>
        {!isLoading && !error && recentActivities.length > 0 && (
          <Link
            to="/dashboard"
            className="text-sm font-medium hover:underline"
            style={{ color: 'var(--accent-cyan)' }}
          >
            View All
          </Link>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        {/* Loading state */}
        {isLoading && <RecentActivityLoading count={5} />}

        {/* Error state */}
        {!isLoading && error && (
          <div className="text-center py-8">
            <span className="icon-[mdi--alert-circle-outline] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--accent-red)' }} />
            <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Unable to load activity</p>
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
        {!isLoading && !error && recentActivities.length === 0 && (
          <div className="text-center py-8">
            <span className="icon-[mdi--history] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No recent activity</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Markets will appear here once created
            </p>
          </div>
        )}

        {/* Activity list */}
        {!isLoading && !error && recentActivities.length > 0 && (
          <div className="space-y-3 max-h-[600px] overflow-y-auto animate-fade-in" ref={containerRef}>
            {recentActivities.map(({ market, type }) => (
              <Link
                key={market.marketAddress}
                to={`/markets/${market.marketAddress}`}
                className="block p-4 rounded-lg transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hover)'
                  e.currentTarget.style.transform = 'translateX(4px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)'
                  e.currentTarget.style.transform = 'translateX(0)'
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--bg-primary)' }}
                    >
                      <span
                        className={`icon-[${getActivityIcon(type)}] w-5 h-5`}
                        style={{ color: getActivityColor(type) }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-sm font-semibold truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Match #
                          {market.matchId.toString()}
                        </span>
                        <Badge
                          variant={
                            type === 'resolve'
                              ? 'success'
                              : type === 'unresolved'
                                ? 'error'
                                : type === 'join'
                                  ? 'info'
                                  : 'default'
                          }
                          className="text-[10px] px-2 py-0"
                        >
                          {getActivityLabel(type)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        <span className="icon-[mdi--account-group-outline] w-3 h-3" />
                        <span>
                          {Number(market.participantsCount)}
                          {' '}
                          participants
                        </span>
                        <span>•</span>
                        <span className="icon-[mdi--database-outline] w-3 h-3" />
                        <span>
                          {formatSOL(market.entryFee, 4, false)}
                          {' '}
                          SOL
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                      {getTimeAgo(market.startTime)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
