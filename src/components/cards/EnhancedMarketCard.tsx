import type { Market } from '../../types'
import { Link } from 'react-router-dom'
import { useUnifiedWallet } from '../../contexts/UnifiedWalletContext'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { UserPredictionBadge } from '@/components/ui/UserPredictionBadge'
import { useMnee } from '@/hooks/useMnee'
import { useSupabaseMarketData, useSupabaseUserParticipantMarkets } from '../../hooks/useSupabaseMarketData'
import { useMatchData } from '../../hooks/useMatchData'
import { useSupabaseParticipantData } from '../../hooks/useSupabaseParticipantData'
import { formatCurrency, formatSOL, formatWithSOLEquivalent, shortenAddress } from '../../utils/formatters'
import { determinePredictionOutcome } from '../../utils/prediction-outcome'
import { PotentialWinningsDisplay } from '../market/PotentialWinningsDisplay'

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
export function EnhancedMarketCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardContent>
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
      </CardContent>
    </Card>
  )
}

// Calculate prediction distribution from participants
function usePredictionDistribution(marketAddress: string): PredictionDistribution {
  const { data: marketData } = useSupabaseMarketData(marketAddress)

  if (!marketData) {
    return { home: 0, draw: 0, away: 0, total: 0 }
  }

  const home = marketData.homeCount || 0
  const away = marketData.awayCount || 0
  const draw = marketData.drawCount || 0
  const total = home + away + draw

  return { home, draw, away, total }
}

// Status badge component
function StatusBadge({ market, matchDate, matchStatus }: { market: Market, matchDate: Date, matchStatus?: string }) {
  if (market.resolved) {
    return <Badge variant="success">Resolved</Badge>
  }

  const now = new Date()
  const timeUntilStart = matchDate.getTime() - now.getTime()
  const hoursUntilStart = timeUntilStart / (1000 * 60 * 60)

  // Check if match has ended but market is not resolved
  if (matchStatus === 'FINISHED') {
    return <Badge variant="warning">Unresolved</Badge>
  }

  if (now > matchDate) {
    return <Badge variant="warning">Live</Badge>
  }

  if (hoursUntilStart < 2) {
    return <Badge variant="error" className="animate-pulse">Ending Soon</Badge>
  }

  return <Badge variant="info">Open</Badge>
}

// Prediction distribution bar
function PredictionBar({
  distribution,
  homeTeam,
  awayTeam,
}: {
  distribution: PredictionDistribution
  homeTeam: string
  awayTeam: string
}) {
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
            {homePercent.toFixed(0)}
            %
          </div>
          <div style={{ color: 'var(--text-tertiary)' }}>HOME</div>
        </div>
        <div className="text-center">
          <div style={{ color: 'var(--accent-amber)' }} className="font-bold">
            {drawPercent.toFixed(0)}
            %
          </div>
          <div style={{ color: 'var(--text-tertiary)' }}>DRAW</div>
        </div>
        <div className="text-center">
          <div style={{ color: 'var(--accent-red)' }} className="font-bold">
            {awayPercent.toFixed(0)}
            %
          </div>
          <div style={{ color: 'var(--text-tertiary)' }}>AWAY</div>
        </div>
      </div>
    </div>
  )
}

export default function EnhancedMarketCard({ market }: EnhancedMarketCardProps) {
  const { publicKey: userAddress } = useUnifiedWallet()
  const { data: matchData, loading, error } = useMatchData(Number(market.matchId))
  const distribution = usePredictionDistribution(market.marketAddress)
  const { data: userParticipantMarkets } = useSupabaseUserParticipantMarkets(userAddress?.toString())
  const { data: participantData } = useSupabaseParticipantData(market.marketAddress, userAddress?.toString())
  const { currency, exchangeRates } = useCurrency()

  // Check if user has joined this market
  const hasJoined = userParticipantMarkets?.some(
    m => m.marketAddress === market.marketAddress,
  ) || false

  // Determine prediction outcome for user
  const predictionOutcome = participantData 
    ? determinePredictionOutcome(participantData.prediction, matchData)
    : null

  if (loading) {
    return <EnhancedMarketCardSkeleton />
  }

  if (error || !matchData) {
    return (
      <Card style={{ borderColor: 'var(--error-border)' }}>
        <CardContent className="text-center">
          <span className="icon-[mdi--alert-circle-outline] w-12 h-12 mx-auto mb-3" style={{ color: 'var(--error)' }} />
          <h3 className="font-bold text-lg mb-2">Match Data Unavailable</h3>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Match ID:
            {' '}
            {market.matchId.toString()}
          </p>
        </CardContent>
      </Card>
    )
  }

  const matchDate = new Date(matchData.utcDate)
  const poolSize = (Number(market.entryFee) / 1_000_000_000) * Number(market.participantsCount) // Convert lamports to SOL
  const isOwner = userAddress?.toString() === market.creator

  return (
    <Link
      to={`/markets/${market.marketAddress}`}
      className="block"
      style={{ textDecoration: 'none' }}
    >
      <Card className="h-full card-glass">
        <CardContent className="pb-0">
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
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <StatusBadge market={market} matchDate={matchDate} matchStatus={matchData.status} />
              {market.isPublic
                ? (
                    <Badge variant="info">Public</Badge>
                  )
                : (
                    <Badge variant="neutral">Private</Badge>
                  )}
            </div>
          </div>

          {/* User Prediction Badge - Show prominently when user has joined */}
          {hasJoined && participantData && (
            <div className="mb-4 flex justify-center">
              <UserPredictionBadge
                prediction={participantData.prediction}
                homeTeam={matchData.homeTeam.name}
                awayTeam={matchData.awayTeam.name}
                isCorrect={predictionOutcome?.isCorrect}
                matchResult={predictionOutcome?.matchResult}
                isMatchFinished={matchData.isFinished && matchData.hasValidScore}
                className="shadow-sm"
              />
            </div>
          )}

          {/* Teams */}
          <div className="flex items-center justify-between mb-4">
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
              {matchData.isFinished && matchData.hasValidScore && matchData.score ? (
                <div className="text-center">
                  <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {matchData.score.fullTime.home} - {matchData.score.fullTime.away}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Final
                  </div>
                </div>
              ) : (
                <span className="text-2xl font-bold" style={{ color: 'var(--text-tertiary)' }}>VS</span>
              )}
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

          {/* Match Result Indicator - Show when match is finished */}
          {matchData.isFinished && matchData.hasValidScore && matchData.matchResult && (
            <div className="mb-4 text-center">
              <Badge 
                variant={matchData.matchResult === 'Draw' ? 'warning' : 'info'}
                className="text-xs"
              >
                {matchData.matchResult === 'Home' 
                  ? `${matchData.homeTeam.name} Won`
                  : matchData.matchResult === 'Away'
                  ? `${matchData.awayTeam.name} Won`
                  : 'Match Ended in Draw'
                }
              </Badge>
            </div>
          )}

          {/* Prediction Distribution */}
          <div className="mb-4">
            <PredictionBar
              distribution={distribution}
              homeTeam={matchData.homeTeam.name}
              awayTeam={matchData.awayTeam.name}
            />
          </div>

          {/* Potential Winnings - Show only for non-participants when market is open */}
          {!market.resolved && !hasJoined && (
            <div className="mb-4">
              <PotentialWinningsDisplay 
                marketData={{
                  marketAddress: market.marketAddress,
                  creator: market.creator,
                  matchId: market.matchId.toString(),
                  entryFee: Number(market.entryFee),
                  kickoffTime: 0, // Not needed for potential winnings calculation
                  endTime: 0, // Not needed for potential winnings calculation
                  status: market.resolved ? 'Resolved' : 'Open',
                  outcome: null, // Market is not resolved yet
                  totalPool: Math.floor(poolSize * 1_000_000_000), // Convert back to lamports
                  participantCount: Number(market.participantsCount),
                  homeCount: distribution.home,
                  drawCount: distribution.draw,
                  awayCount: distribution.away,
                  isPublic: market.isPublic,
                }}
                className="text-xs"
              />
            </div>
          )}

          {/* Market Stats */}
          <div className="space-y-2 mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="info-row py-2">
                  <div className="info-label">
                    <span className="icon-[mdi--database-outline] w-4 h-4" />
                    <span>Pool Size</span>
                  </div>
                  <div className="info-value font-mono">
                    <div>
                      {formatCurrency(Math.floor(poolSize * 1_000_000_000), currency, exchangeRates, { decimals: 2 })}
                    </div>
                    {currency !== 'SOL' && (
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {formatWithSOLEquivalent(Math.floor(poolSize * 1_000_000_000), currency, exchangeRates).equivalent}
                      </div>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total value locked in this market</p>
                {currency !== 'SOL' && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {formatSOL(poolSize * 1_000_000_000, 4)}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="info-row py-2">
                  <div className="info-label">
                    <span className="icon-[mdi--account-group-outline] w-4 h-4" />
                    <span>Participants</span>
                  </div>
                  <div className="info-value">
                    {Number(market.participantsCount)}
                    {distribution.total > 0 && (
                      <span style={{ color: 'var(--text-tertiary)' }} className="ml-2 text-xs">
                        (
                        {distribution.total}
                        {' '}
                        predictions)
                      </span>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Number of users who joined this market</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="info-row py-2">
                  <div className="info-label">
                    <span className="icon-[mdi--login] w-4 h-4" />
                    <span>Entry Fee</span>
                  </div>
                  <div className="info-value font-mono">
                    <div>
                      {formatCurrency(Number(market.entryFee), currency, exchangeRates, { decimals: currency === 'SOL' ? 4 : 2 })}
                    </div>
                    {currency !== 'SOL' && (
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {formatWithSOLEquivalent(Number(market.entryFee), currency, exchangeRates).equivalent}
                      </div>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cost to join and make a prediction</p>
                {currency !== 'SOL' && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {formatSOL(market.entryFee, 4)}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </div>

        </CardContent>

        {/* Footer */}
        <CardFooter>
          <div className="flex items-center justify-between w-full text-xs">
            <div className="flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
              <span className="icon-[mdi--account-edit-outline] w-4 h-4" />
              <span className="font-mono">{shortenAddress(market.creator)}</span>
              {isOwner && (
                <Badge variant="info" className="text-[10px] px-2 py-0">
                  You
                </Badge>
              )}
            </div>
            {hasJoined && (
              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--accent-green)' }}>
                <span className="icon-[mdi--check-circle] w-4 h-4" />
                <span>Joined</span>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
