import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import type { Market } from '../types'

interface RecentActivityProps {
  markets: Market[]
  limit?: number
}

export default function RecentActivity({ markets, limit = 5 }: RecentActivityProps) {
  // Sort by start time (most recent first) and limit
  const recentMarkets = [...markets]
    .sort((a, b) => Number(b.startTime) - Number(a.startTime))
    .slice(0, limit)

  if (recentMarkets.length === 0) {
    return (
      <div className="card">
        <h3 className="card-title mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <span className="icon-[mdi--history] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No recent activity</p>
        </div>
      </div>
    )
  }

  const getActivityIcon = (market: Market) => {
    if (market.resolved) return 'mdi--check-circle'
    const now = new Date()
    const startTime = new Date(Number(market.startTime) * 1000)
    if (now > startTime) return 'mdi--lightning-bolt'
    return 'mdi--clock-outline'
  }

  const getActivityColor = (market: Market) => {
    if (market.resolved) return 'var(--accent-green)'
    const now = new Date()
    const startTime = new Date(Number(market.startTime) * 1000)
    if (now > startTime) return 'var(--accent-amber)'
    return 'var(--accent-cyan)'
  }

  const getActivityLabel = (market: Market) => {
    if (market.resolved) return 'Resolved'
    const now = new Date()
    const startTime = new Date(Number(market.startTime) * 1000)
    if (now > startTime) return 'Live'
    return 'Upcoming'
  }

  const getTimeAgo = (timestamp: bigint) => {
    const now = Date.now()
    const time = Number(timestamp) * 1000
    const diff = now - time

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-title">Recent Activity</h3>
        <Link 
          to="/my-markets"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--accent-cyan)' }}
        >
          View All
        </Link>
      </div>

      <div className="space-y-3">
        {recentMarkets.map((market) => (
          <Link
            key={market.marketAddress}
            to={`/market/${market.marketAddress}`}
            className="block p-4 rounded-lg transition-all"
            style={{ 
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)'
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
                    className={`icon-[${getActivityIcon(market)}] w-5 h-5`}
                    style={{ color: getActivityColor(market) }}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-sm font-semibold truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Match #{market.matchId.toString()}
                    </span>
                    <span 
                      className="badge badge-sm"
                      style={{
                        background: `${getActivityColor(market)}20`,
                        color: getActivityColor(market),
                        border: `1px solid ${getActivityColor(market)}40`
                      }}
                    >
                      {getActivityLabel(market)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="icon-[mdi--account-group-outline] w-3 h-3" />
                    <span>{Number(market.participantsCount)} participants</span>
                    <span>•</span>
                    <span className="icon-[mdi--database-outline] w-3 h-3" />
                    <span>{formatEther(market.entryFee)} PAS</span>
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
    </div>
  )
}
