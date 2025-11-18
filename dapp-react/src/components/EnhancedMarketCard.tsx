import { Link } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAccount, useReadContract } from 'wagmi'
import { CryptoScoreMarketABI } from '../config/contracts'
import { shortenAddress } from '../utils/formatters'
import { useMatchData } from '../hooks/useMatchData'
import type { Market } from '../types'

interface EnhancedMarketCardProps {
  market: Market
  onQuickJoin?: (marketAddress: string, prediction: number) => void
}

interface PredictionDistribution {
  home: number
  draw: number
  away: number
  total: number
}

// Skeleton for loading state
export const EnhancedMarketCardSkeleton = () => (
  <div className="card animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-4 w-32 skeleton" />
      <div className="flex gap-2">
        <div className="h-5 w-16 skeleton rounded-full" />
        <div className="h-5 w-16 skeleton rounded-full" />
      </div>
    </div>
    <div className="flex items-center justify-between mb-6">
      <div className="team-display">
        <div className="w-16 h-16 skeleton rounded-lg" />
        <div className="h-5 w-24 skeleton" />
      </div>
      <div className="h-6 w-12 skeleton" />
      <div className="team-display">
        <div className="w-16 h-16 skeleton rounded-lg" />
        <div className="h-5 w-24 skeleton" />
      </div>
    </div>
    <div className="h-3 w-full skeleton rounded-full mb-4" />
    <div className="space-y-3">
      <div className="h-4 w-full skeleton" />
      <div className="h-4 w-full skeleton" />
    </div>
  </div>
)

// Calculate prediction distribution from participants
const usePredictionDistribution = (marketAddress: string): PredictionDistribution => {
  const { data: homeCount = 0n } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress as `0x${string}`,
    functionName: 'predictionCounts',
    args: [1],
  })

  const { data: drawCount = 0n } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress as `0x${string}`,
    functionName: 'predictionCounts',
    args: [3],
  })

  const { data: awayCount = 0n } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress as `0x${string}`,
    functionName: 'predictionCounts',
    args: [2],
  })

  const home = Number(homeCount)
  const draw = Number(drawCount)
  const away = Number(awayCount)
  const total = home + draw + away

  return { home, draw, away, total }
}

// Status badge component
const StatusBadge = ({ market, matchDate }: { market: Market, matchDate: Date }) => {
  if (market.resolved) {
    return <span className="badge badge-success">Resolved</span>
  }

  const now = new Date()
  const timeUntilStart = matchDate.getTime() - now.getTime()
  const hoursUntilStart = timeUntilStart / (1000 * 60 * 60)

  if (now > matchDate) {
    return <span className="badge badge-warning">Live</span>
  }

  if (hoursUntilStart < 2) {
    return <span className="badge badge-error animate-pulse">Ending Soon</span>
  }

  return <span className="badge badge-info">Open</span>
}

// Prediction distribution bar
const PredictionBar = ({ 
  distribution, 
  homeTeam, 
  awayTeam 
}: { 
  distribution: PredictionDistribution
  homeTeam: string
  awayTeam: string
}) => {
  if (distribution.total === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          No predictions yet. Be the first!
        </p>
      </div>
    )
  }

  const homePercent = (distribution.home / distribution.total) * 100
  const drawPercent = (distribution.draw / distribution.total) * 100
  const awayPercent = (distribution.away / distribution.total) * 100

  return (
    <div className="space-y-3">
      {/* Visual Bar */}
      <div className="prediction-bar">
        {homePercent > 0 && (
          <div 
            className="prediction-segment prediction-segment-home" 
            style={{ width: `${homePercent}%` }}
            title={`${homeTeam}: ${homePercent.toFixed(1)}%`}
          />
        )}
        {drawPercent > 0 && (
          <div 
            className="prediction-segment prediction-segment-draw" 
            style={{ width: `${drawPercent}%` }}
            title={`Draw: ${drawPercent.toFixed(1)}%`}
          />
        )}
        {awayPercent > 0 && (
          <div 
            className="prediction-segment prediction-segment-away" 
            style={{ width: `${awayPercent}%` }}
            title={`${awayTeam}: ${awayPercent.toFixed(1)}%`}
          />
        )}
      </div>

      {/* Percentage Labels */}
      <div className="grid grid-cols-3 gap-2 text-xs font-mono">
        <div className="text-center">
          <div style={{ color: 'var(--accent-cyan)' }} className="font-bold">
            {homePercent.toFixed(0)}%
          </div>
          <div style={{ color: 'var(--text-tertiary)' }}>HOME</div>
        </div>
        <div className="text-center">
          <div style={{ color: 'var(--accent-amber)' }} className="font-bold">
            {drawPercent.toFixed(0)}%
          </div>
          <div style={{ color: 'var(--text-tertiary)' }}>DRAW</div>
        </div>
        <div className="text-center">
          <div style={{ color: 'var(--accent-red)' }} className="font-bold">
            {awayPercent.toFixed(0)}%
          </div>
          <div style={{ color: 'var(--text-tertiary)' }}>AWAY</div>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedMarketCard({ market }: EnhancedMarketCardProps) {
  const { address: userAddress } = useAccount()
  const { data: matchData, loading, error } = useMatchData(Number(market.matchId))
  const distribution = usePredictionDistribution(market.marketAddress)

  const { data: isParticipant } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: market.marketAddress as `0x${string}`,
    functionName: 'isParticipant',
    args: [userAddress!],
    query: { enabled: !!userAddress },
  })
  
  const hasJoined = Boolean(isParticipant)

  if (loading) {
    return <EnhancedMarketCardSkeleton />
  }

  if (error || !matchData) {
    return (
      <div className="card" style={{ borderColor: 'var(--error-border)' }}>
        <div className="text-center py-8">
          <span className="icon-[mdi--alert-circle-outline] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--error)' }} />
          <h3 className="font-bold text-lg mb-2">Match Data Unavailable</h3>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Match ID: {market.matchId.toString()}
          </p>
        </div>
      </div>
    )
  }

  const matchDate = new Date(matchData.utcDate)
  const poolSize = Number(formatEther(market.entryFee)) * Number(market.participantsCount)
  const isOwner = userAddress?.toLowerCase() === market.creator.toLowerCase()

  return (
    <Link 
      to={`/market/${market.marketAddress}`}
      className="card block"
      style={{ textDecoration: 'none' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="icon-[mdi--trophy-outline] w-4 h-4" style={{ color: 'var(--accent-amber)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {matchData.competition.name}
            </p>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {matchDate.toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <StatusBadge market={market} matchDate={matchDate} />
          {market.isPublic ? (
            <span className="badge badge-info">Public</span>
          ) : (
            <span className="badge badge-neutral">Private</span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-6">
        <div className="team-display flex-1">
          <img 
            src={`https://corsproxy.io/?${matchData.homeTeam.crest}`}
            alt={matchData.homeTeam.name}
            className="team-logo"
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64' }}
          />
          <h3 className="team-name text-base">{matchData.homeTeam.name}</h3>
        </div>
        
        <div className="px-4">
          <span className="text-2xl font-bold" style={{ color: 'var(--text-tertiary)' }}>VS</span>
        </div>
        
        <div className="team-display flex-1">
          <img 
            src={`https://corsproxy.io/?${matchData.awayTeam.crest}`}
            alt={matchData.awayTeam.name}
            className="team-logo"
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/64' }}
          />
          <h3 className="team-name text-base">{matchData.awayTeam.name}</h3>
        </div>
      </div>

      {/* Prediction Distribution */}
      <div className="mb-6">
        <PredictionBar 
          distribution={distribution}
          homeTeam={matchData.homeTeam.name}
          awayTeam={matchData.awayTeam.name}
        />
      </div>

      {/* Market Stats */}
      <div className="space-y-2 mb-4">
        <div className="info-row py-2">
          <div className="info-label">
            <span className="icon-[mdi--database-outline] w-4 h-4" />
            <span>Pool Size</span>
          </div>
          <div className="info-value font-mono">
            {poolSize.toFixed(2)} <span style={{ color: 'var(--text-tertiary)' }}>PAS</span>
          </div>
        </div>
        
        <div className="info-row py-2">
          <div className="info-label">
            <span className="icon-[mdi--account-group-outline] w-4 h-4" />
            <span>Participants</span>
          </div>
          <div className="info-value">
            {Number(market.participantsCount)}
            {distribution.total > 0 && (
              <span style={{ color: 'var(--text-tertiary)' }} className="ml-2 text-xs">
                ({distribution.total} predictions)
              </span>
            )}
          </div>
        </div>

        <div className="info-row py-2">
          <div className="info-label">
            <span className="icon-[mdi--login] w-4 h-4" />
            <span>Entry Fee</span>
          </div>
          <div className="info-value font-mono">
            {formatEther(market.entryFee)} <span style={{ color: 'var(--text-tertiary)' }}>PAS</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="icon-[mdi--account-edit-outline] w-4 h-4" />
          <span className="font-mono">{shortenAddress(market.creator)}</span>
          {isOwner && (
            <span className="badge badge-sm" style={{ background: 'var(--accent-purple-glow)', color: 'var(--accent-purple)' }}>
              You
            </span>
          )}
        </div>
        
        {hasJoined && (
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--accent-green)' }}>
            <span className="icon-[mdi--check-circle] w-4 h-4" />
            <span>Joined</span>
          </div>
        )}
      </div>
    </Link>
  )
}
