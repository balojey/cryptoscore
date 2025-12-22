import type { Market } from '../../types'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { useMatchData } from '../../hooks/useMatchData'

type ChangeMetric = 'pool' | 'participants' | 'distribution'
type ChangeDirection = 'up' | 'down'

interface TopMover {
  market: Market
  change: number // Percentage or absolute change
  metric: ChangeMetric
  direction: ChangeDirection
  poolSize: number
}

interface TopMoversProps {
  markets: Market[]
  isLoading?: boolean
  error?: string
  onRetry?: () => void
}

// Calculate pool size changes (last 24h)
// Note: Since we don't have historical data, we'll use a heuristic based on recent activity
function calculateTopMovers(markets: Market[]): TopMover[] {
  const now = Math.floor(Date.now() / 1000)
  const oneDayAgo = now - 86400
  const movers: TopMover[] = []

  // Filter active markets (not resolved)
  const activeMarkets = markets.filter(m => !m.resolved)

  // 1. Markets with largest pool size increase (recent markets with high pools)
  const recentHighPoolMarkets = activeMarkets
    .filter(m => Number(m.startTime) >= oneDayAgo)
    .map((market) => {
      // Convert atomic units to MNEE
      const poolSize = (Number(market.entryFee) * Number(market.participantsCount)) / 100_000
      // Simulate change percentage based on pool size and participants
      const changePercent = Math.min(100, (Number(market.participantsCount) * 10))

      return {
        market,
        change: changePercent,
        metric: 'pool' as ChangeMetric,
        direction: 'up' as ChangeDirection,
        poolSize,
      }
    })
    .sort((a, b) => b.poolSize - a.poolSize)
    .slice(0, 2)

  movers.push(...recentHighPoolMarkets)

  // 2. Markets with most new participants (high participant count)
  const highParticipantMarkets = activeMarkets
    .filter(m => !movers.some(mover => mover.market.marketAddress === m.marketAddress))
    .filter(m => Number(m.participantsCount) > 0)
    .map((market) => {
      const participantChange = Number(market.participantsCount)

      return {
        market,
        change: participantChange,
        metric: 'participants' as ChangeMetric,
        direction: 'up' as ChangeDirection,
        poolSize: (Number(market.entryFee) * Number(market.participantsCount)) / 1_000_000_000,
      }
    })
    .sort((a, b) => b.change - a.change)
    .slice(0, 2)

  movers.push(...highParticipantMarkets)

  // 3. Markets with interesting prediction distribution shifts
  const distributionShiftMarkets = activeMarkets
    .filter(m => !movers.some(mover => mover.market.marketAddress === m.marketAddress))
    .filter((m) => {
      const total = Number(m.homeCount || 0n) + Number(m.awayCount || 0n) + Number(m.drawCount || 0n)
      return total > 0
    })
    .map((market) => {
      const home = Number(market.homeCount || 0n)
      const away = Number(market.awayCount || 0n)
      const draw = Number(market.drawCount || 0n)
      const total = home + away + draw

      // Calculate distribution variance (higher = more interesting)
      const homePercent = (home / total) * 100
      const awayPercent = (away / total) * 100
      const drawPercent = (draw / total) * 100

      // Calculate how "shifted" the distribution is (deviation from 33/33/33)
      const variance = Math.abs(homePercent - 33.33) + Math.abs(awayPercent - 33.33) + Math.abs(drawPercent - 33.33)

      return {
        market,
        change: variance,
        metric: 'distribution' as ChangeMetric,
        direction: 'up' as ChangeDirection,
        poolSize: (Number(market.entryFee) * Number(market.participantsCount)) / 1_000_000_000,
      }
    })
    .sort((a, b) => b.change - a.change)
    .slice(0, 1)

  movers.push(...distributionShiftMarkets)

  // Limit to top 5 movers
  return movers.slice(0, 5)
}

// MoverCard sub-component
function MoverCard({ mover }: { mover: TopMover }) {
  const { data: matchData, loading } = useMatchData(Number(mover.market.matchId))

  if (loading) {
    return (
      <div
        className="p-3 rounded-lg animate-pulse"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-32 skeleton" />
          <div className="h-5 w-16 skeleton rounded" />
        </div>
        <div className="h-3 w-full skeleton mb-2" />
        <div className="h-2 w-full skeleton rounded-full" />
      </div>
    )
  }

  if (!matchData) {
    return null
  }

  // Calculate prediction distribution
  const home = Number(mover.market.homeCount || 0n)
  const away = Number(mover.market.awayCount || 0n)
  const draw = Number(mover.market.drawCount || 0n)
  const total = home + away + draw

  const homePercent = total > 0 ? (home / total) * 100 : 0
  const drawPercent = total > 0 ? (draw / total) * 100 : 0
  const awayPercent = total > 0 ? (away / total) * 100 : 0

  // Format change indicator
  const getChangeDisplay = () => {
    if (mover.metric === 'pool') {
      return `+${mover.change.toFixed(0)}% pool`
    }
    else if (mover.metric === 'participants') {
      return `+${mover.change} players`
    }
    else {
      return 'Hot distribution'
    }
  }

  const changeColor = mover.direction === 'up' ? 'var(--accent-green)' : 'var(--accent-red)'

  return (
    <Link
      to={`/markets/${mover.market.marketAddress}`}
      className="block"
      style={{ textDecoration: 'none' }}
    >
      <div
        className="p-3 rounded-lg transition-all hover-lift"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Header with teams and change indicator */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img
              src={`https://corsproxy.io/?${matchData.homeTeam.crest}`}
              alt={matchData.homeTeam.name}
              className="w-6 h-6 object-contain rounded flex-shrink-0"
              onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/24' }}
            />
            <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {matchData.homeTeam.tla}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>vs</span>
            <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
              {matchData.awayTeam.tla}
            </span>
          </div>

          {/* Change indicator */}
          <div
            className="flex items-center gap-1 text-xs font-bold flex-shrink-0"
            style={{ color: changeColor }}
          >
            <span className={mover.direction === 'up' ? 'icon-[mdi--trending-up]' : 'icon-[mdi--trending-down]'} />
            <span>{getChangeDisplay()}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
          <div className="flex items-center gap-1">
            <span className="icon-[mdi--database-outline] w-3 h-3" />
            <span className="font-mono">
              {mover.poolSize.toFixed(2)}
              {' '}
              MNEE
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="icon-[mdi--account-group-outline] w-3 h-3" />
            <span>{Number(mover.market.participantsCount)}</span>
          </div>
        </div>

        {/* Mini prediction distribution bar */}
        {total > 0 && (
          <div className="space-y-1">
            <div className="flex h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
              {homePercent > 0 && (
                <div
                  className="transition-all"
                  style={{
                    width: `${homePercent}%`,
                    background: 'var(--accent-cyan)',
                  }}
                  title={`HOME: ${homePercent.toFixed(1)}%`}
                />
              )}
              {drawPercent > 0 && (
                <div
                  className="transition-all"
                  style={{
                    width: `${drawPercent}%`,
                    background: 'var(--accent-amber)',
                  }}
                  title={`DRAW: ${drawPercent.toFixed(1)}%`}
                />
              )}
              {awayPercent > 0 && (
                <div
                  className="transition-all"
                  style={{
                    width: `${awayPercent}%`,
                    background: 'var(--accent-red)',
                  }}
                  title={`AWAY: ${awayPercent.toFixed(1)}%`}
                />
              )}
            </div>
            <div className="flex justify-between text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
              <span>
                {homePercent.toFixed(0)}
                %
              </span>
              <span>
                {drawPercent.toFixed(0)}
                %
              </span>
              <span>
                {awayPercent.toFixed(0)}
                %
              </span>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

// Loading skeleton
function TopMoversLoading() {
  return (
    <div className="space-y-3 animate-fade-in">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="p-3 rounded-lg"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-32 skeleton rounded" />
            <div className="h-5 w-16 skeleton rounded" />
          </div>
          <div className="h-3 w-full skeleton rounded mb-2" />
          <div className="h-2 w-full skeleton rounded-full" />
        </div>
      ))}
    </div>
  )
}

// Main TopMovers component
export default function TopMovers({ markets, isLoading, error, onRetry }: TopMoversProps) {
  // Calculate top movers
  const topMovers = useMemo(() => {
    if (!markets || markets.length === 0)
      return []
    return calculateTopMovers(markets)
  }, [markets])

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Top Movers
          </h3>
          <span className="icon-[mdi--chart-line] w-5 h-5" style={{ color: 'var(--accent-green)' }} />
        </div>

        {/* Loading state */}
        {isLoading && <TopMoversLoading />}

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
            <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Unable to load top movers</p>
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
        {!isLoading && !error && topMovers.length === 0 && (
          <div
            className="text-center py-8 rounded-lg"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
            }}
          >
            <span className="icon-[mdi--chart-line-variant] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No market activity yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
              Top movers will appear here
            </p>
          </div>
        )}

        {/* Top movers list */}
        {!isLoading && !error && topMovers.length > 0 && (
          <div className="space-y-3 animate-fade-in">
            {topMovers.map(mover => (
              <MoverCard key={mover.market.marketAddress} mover={mover} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
