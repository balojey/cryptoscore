
import React, { useEffect, useState } from 'react'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import { Link, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/hooks/useCurrency'
import PredictionDistributionChart from '../components/charts/PredictionDistributionChart'
import SharePrediction from '../components/SharePrediction'
import Confetti from '../components/ui/Confetti'
import { getAccountExplorerUrl } from '../config/programs'
import { useSupabaseMarketActions } from '../hooks/useSupabaseMarketActions'
import { useSupabaseMarketData } from '../hooks/useSupabaseMarketData'
import { useMatchData, type EnhancedMatchData } from '../hooks/useMatchData'
import { useSupabaseParticipantData } from '../hooks/useSupabaseParticipantData'
import { useResolutionEligibility } from '../hooks/useResolutionEligibility'
import { useWinnings } from '../hooks/useWinnings'
import { formatCurrency, formatWithSOLEquivalent, shortenAddress } from '../utils/formatters'
import { CreateSimilarMarketDialog, type CreateSimilarMarketParams } from '../components/CreateSimilarMarketDialog'
import { WinningsDisplay } from '../components/WinningsDisplay'
import { PotentialWinningsDisplay } from '../components/market/PotentialWinningsDisplay'

// --- SUB-COMPONENTS ---

function MatchHeader({ 
  matchData, 
  marketAddress, 
  userAddress, 
  isUserParticipant, 
  selectedTeam, 
  isMatchStarted, 
  onShowCreateSimilarDialog 
}: { 
  matchData: EnhancedMatchData
  marketAddress: string
  userAddress: any
  isUserParticipant: boolean
  selectedTeam: number | null
  isMatchStarted: boolean
  onShowCreateSimilarDialog: () => void
}) {
  const getMatchStatusBadge = () => {
    if (matchData.isFinished) {
      if (matchData.hasValidScore) {
        return <Badge variant="success">Final Score</Badge>
      } else {
        return <Badge variant="warning">Finished</Badge>
      }
    }
    
    if (matchData.status === 'IN_PLAY' || matchData.status === 'LIVE') {
      return <Badge variant="warning">Live</Badge>
    }
    
    return <Badge variant="info">Scheduled</Badge>
  }

  const getScoreDisplay = () => {
    if (matchData.hasValidScore) {
      return (
        <div className="font-jakarta text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold pt-2 sm:pt-4 lg:pt-6 flex items-center gap-1 sm:gap-2 lg:gap-4" style={{ color: 'var(--text-primary)' }}>
          <span>{matchData.score.fullTime.home}</span>
          <span style={{ color: 'var(--text-tertiary)' }} className="text-lg sm:text-xl lg:text-2xl xl:text-4xl">-</span>
          <span>{matchData.score.fullTime.away}</span>
        </div>
      )
    }
    
    return (
      <div className="font-jakarta text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold pt-2 sm:pt-4 lg:pt-6" style={{ color: 'var(--text-tertiary)' }}>
        VS
      </div>
    )
  }

  const getMatchResultIndicator = () => {
    if (!matchData.isFinished || !matchData.hasValidScore || !matchData.matchResult) {
      return null
    }

    const resultColor = matchData.matchResult === 'Home' 
      ? 'var(--accent-green)' 
      : matchData.matchResult === 'Away' 
        ? 'var(--accent-red)' 
        : 'var(--accent-amber)'

    return (
      <div className="text-center mt-4">
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
          style={{ 
            background: `${resultColor}20`,
            color: resultColor,
            border: `1px solid ${resultColor}40`
          }}
        >
          <span className="icon-[mdi--trophy] w-4 h-4" />
          {matchData.matchResult === 'Draw' ? 'Draw' : `${matchData.matchResult} Team Wins`}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="text-center mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="icon-[mdi--trophy-outline] w-5 h-5" style={{ color: 'var(--accent-amber)' }} />
            <p className="font-sans text-sm sm:text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
              {matchData.competition.name}
            </p>
          </div>
          <div className="sm:ml-2">
            {getMatchStatusBadge()}
          </div>
        </div>
        <p className="font-sans text-xs sm:text-sm px-4" style={{ color: 'var(--text-tertiary)' }}>
          {new Date(matchData.utcDate).toLocaleString('en-US', { 
            dateStyle: window.innerWidth < 640 ? 'short' : 'full', 
            timeStyle: 'short' 
          })}
        </p>
      </div>
      <div className="flex items-center justify-around gap-2 sm:gap-4">
        <div className="flex flex-col items-center gap-2 sm:gap-3 w-1/3 text-center">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 rounded-xl flex items-center justify-center p-2 sm:p-3 lg:p-4"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <img
              src={`https://corsproxy.io/?${matchData.homeTeam.crest}`}
              alt={matchData.homeTeam.name}
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-jakarta font-bold text-sm sm:text-lg lg:text-2xl xl:text-3xl px-1" style={{ color: 'var(--text-primary)' }}>
            {matchData.homeTeam.name}
          </h2>
        </div>
        <div className="flex-shrink-0">
          {getScoreDisplay()}
        </div>
        <div className="flex flex-col items-center gap-2 sm:gap-3 w-1/3 text-center">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-28 lg:h-28 rounded-xl flex items-center justify-center p-2 sm:p-3 lg:p-4"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <img
              src={`https://corsproxy.io/?${matchData.awayTeam.crest}`}
              alt={matchData.awayTeam.name}
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-jakarta font-bold text-sm sm:text-lg lg:text-2xl xl:text-3xl px-1" style={{ color: 'var(--text-primary)' }}>
            {matchData.awayTeam.name}
          </h2>
        </div>
      </div>
      {getMatchResultIndicator()}
      
      {/* Social Features */}
      <div className="flex items-center justify-center gap-3 mt-6">
        <SharePrediction
          marketAddress={marketAddress}
          matchInfo={{
            homeTeam: matchData.homeTeam.name,
            awayTeam: matchData.awayTeam.name,
            competition: matchData.competition.name,
          }}
          prediction={
            isUserParticipant && selectedTeam
              ? (selectedTeam === 1 ? 'HOME' : selectedTeam === 2 ? 'AWAY' : 'DRAW')
              : undefined
          }
        />
        <Button
          variant="outline"
          onClick={onShowCreateSimilarDialog}
          className="gap-2"
          disabled={!userAddress || isMatchStarted}
          title={isMatchStarted ? "Cannot create similar market after match has started" : "Create a similar market for this match"}
        >
          <span className="icon-[mdi--content-copy] w-4 h-4" />
          <span className="hidden xs:inline">Create Similar</span>
          <span className="xs:hidden">Similar</span>
        </Button>
      </div>
    </div>
  )
}

function WinningsSection({ 
  marketAddress, 
  userAddress, 
  marketData, 
  participantData, 
  matchData 
}: {
  marketAddress: string
  userAddress?: string
  marketData: any
  participantData?: any
  matchData: EnhancedMatchData
}) {
  const { winnings, isLoading, error } = useWinnings(marketAddress, userAddress)

  // Don't show section if no winnings data and user is not connected
  if (!userAddress && !winnings) {
    return null
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="animate-pulse">
          <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/3 mb-3" />
          <div className="h-16 bg-[var(--bg-secondary)] rounded" />
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
        <h4 className="font-sans text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Winnings Information
        </h4>
        <div className="text-sm text-[var(--accent-red)] p-3 rounded-lg" style={{ background: 'var(--error-bg)' }}>
          Error loading winnings: {error}
        </div>
      </div>
    )
  }

  // Don't show if no winnings data
  if (!winnings) {
    return null
  }

  return (
    <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
      <h4 className="font-sans text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
        Winnings Information
      </h4>
      <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
        <WinningsDisplay
          marketData={marketData}
          participantData={participantData}
          userAddress={userAddress}
          matchData={matchData}
          winnings={winnings}
          variant="compact"
        />
      </div>
    </div>
  )
}

interface MarketStatsProps {
  marketInfo: any
  poolSize: number
  participantsCount: bigint | number | undefined
  marketStatus: boolean | undefined
  isMatchStarted: boolean
  winningTeamName: string
  homeCount: bigint | number | undefined
  awayCount: bigint | number | undefined
  drawCount: bigint | number | undefined
  userPrediction: string
  userHasJoined: boolean
  matchData: EnhancedMatchData
  entryFeeValue: number
  currency: 'SOL' | 'USD' | 'NGN'
  exchangeRates: { SOL_USD: number, SOL_NGN: number } | null
  marketAddress: string
  userAddress?: string
  marketData: any
  participantData?: any
}

function MarketStats({ marketInfo, poolSize, participantsCount, marketStatus, isMatchStarted, winningTeamName, homeCount, awayCount, drawCount, userPrediction, userHasJoined, matchData, entryFeeValue, currency, exchangeRates, marketAddress, userAddress, marketData, participantData }: MarketStatsProps) {
  const InfoRow = ({ label, value, valueClass, icon }: { label: string, value: React.ReactNode, valueClass?: string, icon: string }) => (
    <div className="info-row">
      <div className="info-label">
        <span className={`icon-[${icon}] w-5 h-5`} />
        <span>{label}</span>
      </div>
      <span className={`info-value ${valueClass || ''}`}>{value}</span>
    </div>
  )

  const getStatusBadge = () => {
    if (marketStatus)
      return <Badge variant="success">Resolved</Badge>
    // Check if match has ended but market is not resolved
    if (matchData.isFinished)
      return <Badge variant="warning">Unresolved</Badge>
    if (isMatchStarted)
      return <Badge variant="warning">Live</Badge>
    return <Badge variant="info">Open</Badge>
  }

  const getUserPredictionOutcome = () => {
    if (!userHasJoined || !userPrediction || !matchData.isFinished || !matchData.hasValidScore || !matchData.matchResult) {
      return null
    }

    const isCorrect = userPrediction.toUpperCase() === matchData.matchResult.toUpperCase()
    
    return (
      <InfoRow
        label="Prediction Outcome"
        value={(
          <div className="flex items-center gap-2">
            <span
              className={`icon-[${isCorrect ? 'mdi--check-circle' : 'mdi--close-circle'}] w-4 h-4`}
              style={{ color: isCorrect ? 'var(--accent-green)' : 'var(--accent-red)' }}
            />
            <span
              className="font-sans font-bold text-sm"
              style={{ color: isCorrect ? 'var(--accent-green)' : 'var(--accent-red)' }}
            >
              {isCorrect ? 'Correct' : 'Incorrect'}
            </span>
          </div>
        )}
        icon={isCorrect ? 'mdi--trophy' : 'mdi--close'}
      />
    )
  }

  // Calculate prediction percentages
  const totalPredictions = Number(homeCount || 0) + Number(awayCount || 0) + Number(drawCount || 0)
  const homePercentage = totalPredictions > 0 ? Math.round((Number(homeCount || 0) / totalPredictions) * 100) : 0
  const awayPercentage = totalPredictions > 0 ? Math.round((Number(awayCount || 0) / totalPredictions) * 100) : 0
  const drawPercentage = totalPredictions > 0 ? Math.round((Number(drawCount || 0) / totalPredictions) * 100) : 0

  return (
    <div className="card">
      <h3 className="card-title mb-4">Market Stats</h3>
      <div className="space-y-2">
        <InfoRow label="Status" value={getStatusBadge()} icon="mdi--check-circle-outline" />
        <InfoRow
          label="Pool Size"
          value={(
            <div className="text-right">
              <div className="font-mono">{formatCurrency(poolSize, currency, exchangeRates, { decimals: 2 })}</div>
              {currency !== 'SOL' && (
                <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {formatWithSOLEquivalent(poolSize, currency, exchangeRates).equivalent}
                </div>
              )}
            </div>
          )}
          icon="mdi--database-outline"
        />
        <InfoRow
          label="Entry Fee"
          value={(
            <div className="text-right">
              <div className="font-mono">{formatCurrency(entryFeeValue, currency, exchangeRates, { decimals: currency === 'SOL' ? 4 : 2 })}</div>
              {currency !== 'SOL' && (
                <div className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  {formatWithSOLEquivalent(entryFeeValue, currency, exchangeRates).equivalent}
                </div>
              )}
            </div>
          )}
          icon="mdi--login"
        />
        <InfoRow label="Participants" value={participantsCount ? String(participantsCount) : '0'} icon="mdi--account-group-outline" />
        <InfoRow
          label="Creator"
          value={(
            <a
              href={getAccountExplorerUrl(marketInfo.creator || '')}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:underline"
              style={{ color: 'var(--accent-cyan)' }}
            >
              {shortenAddress(marketInfo.creator || '')}
            </a>
          )}
          icon="mdi--account-edit-outline"
        />
        {marketStatus && (
          <InfoRow
            label="Winning Outcome"
            value={winningTeamName}
            valueClass="stat-value-success"
            icon="mdi--trophy-outline"
          />
        )}
        {userHasJoined && userPrediction && (
          <InfoRow
            label="Your Prediction"
            value={(
              <span
                className="font-sans font-bold"
                style={{
                  color: userPrediction === 'HOME'
                    ? 'var(--accent-green)'
                    : userPrediction === 'AWAY'
                      ? 'var(--accent-red)'
                      : 'var(--accent-amber)',
                }}
              >
                {userPrediction}
              </span>
            )}
            icon={userPrediction === 'HOME'
              ? 'mdi--home'
              : userPrediction === 'AWAY'
                ? 'mdi--airplane-takeoff'
                : 'mdi--equal'}
          />
        )}
        {getUserPredictionOutcome()}
      </div>

      {/* Winnings Information */}
      <WinningsSection 
        marketAddress={marketAddress}
        userAddress={userAddress}
        marketData={marketData}
        participantData={participantData}
        matchData={matchData}
      />

      {/* User's Prediction */}
      {userHasJoined && (
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
          <h4 className="font-sans text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Your Prediction
          </h4>
          <div
            className="p-4 rounded-xl border-2 text-center"
            style={{
              borderColor: userPrediction === 'HOME'
                ? 'var(--accent-green)'
                : userPrediction === 'AWAY'
                  ? 'var(--accent-red)'
                  : 'var(--accent-amber)',
              background: userPrediction === 'HOME'
                ? 'rgba(0, 255, 136, 0.1)'
                : userPrediction === 'AWAY'
                  ? 'rgba(255, 51, 102, 0.1)'
                  : 'rgba(255, 184, 0, 0.1)',
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span
                className={`icon-[${
                  userPrediction === 'HOME'
                    ? 'mdi--home'
                    : userPrediction === 'AWAY'
                      ? 'mdi--airplane-takeoff'
                      : 'mdi--equal'
                }] w-5 h-5`}
                style={{
                  color: userPrediction === 'HOME'
                    ? 'var(--accent-green)'
                    : userPrediction === 'AWAY'
                      ? 'var(--accent-red)'
                      : 'var(--accent-amber)',
                }}
              />
              <span
                className="font-sans text-lg font-bold"
                style={{
                  color: userPrediction === 'HOME'
                    ? 'var(--accent-green)'
                    : userPrediction === 'AWAY'
                      ? 'var(--accent-red)'
                      : 'var(--accent-amber)',
                }}
              >
                {userPrediction}
              </span>
            </div>
            <p className="font-sans text-xs" style={{ color: 'var(--text-secondary)' }}>
              You predicted this outcome
            </p>
          </div>
        </div>
      )}

      {/* Prediction Distribution Visualization */}
      {totalPredictions > 0 && (
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-default)' }}>
          <h4 className="font-sans text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
            Prediction Distribution
          </h4>
          <div className="space-y-3">
            {/* HOME */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs font-medium flex items-center" style={{ color: 'var(--text-secondary)' }}>
                  <span className="icon-[mdi--home] w-4 h-4 inline-block mr-1" style={{ color: 'var(--accent-green)' }} />
                  HOME
                  {userPrediction === 'HOME' && (
                    <span
                      className="ml-2 px-2 py-0.5 text-xs rounded-full font-bold"
                      style={{
                        background: 'var(--accent-green)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      YOU
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent-green)' }}>
                  {homePercentage}
                  %
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className={`h-full transition-all duration-300 ${userPrediction === 'HOME' ? 'animate-pulse' : ''}`}
                  style={{
                    width: `${homePercentage}%`,
                    background: userPrediction === 'HOME' ? 'var(--accent-green)' : 'var(--accent-green)',
                    boxShadow: userPrediction === 'HOME' ? '0 0 8px var(--accent-green)' : 'none',
                  }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {Number(homeCount || 0)}
                {' '}
                prediction
                {Number(homeCount || 0) !== 1 ? 's' : ''}
              </div>
            </div>

            {/* AWAY */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs font-medium flex items-center" style={{ color: 'var(--text-secondary)' }}>
                  <span className="icon-[mdi--airplane-takeoff] w-4 h-4 inline-block mr-1" style={{ color: 'var(--accent-red)' }} />
                  AWAY
                  {userPrediction === 'AWAY' && (
                    <span
                      className="ml-2 px-2 py-0.5 text-xs rounded-full font-bold"
                      style={{
                        background: 'var(--accent-red)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      YOU
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent-red)' }}>
                  {awayPercentage}
                  %
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className={`h-full transition-all duration-300 ${userPrediction === 'AWAY' ? 'animate-pulse' : ''}`}
                  style={{
                    width: `${awayPercentage}%`,
                    background: 'var(--accent-red)',
                    boxShadow: userPrediction === 'AWAY' ? '0 0 8px var(--accent-red)' : 'none',
                  }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {Number(awayCount || 0)}
                {' '}
                prediction
                {Number(awayCount || 0) !== 1 ? 's' : ''}
              </div>
            </div>

            {/* DRAW */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-sans text-xs font-medium flex items-center" style={{ color: 'var(--text-secondary)' }}>
                  <span className="icon-[mdi--equal] w-4 h-4 inline-block mr-1" style={{ color: 'var(--accent-amber)' }} />
                  DRAW
                  {userPrediction === 'DRAW' && (
                    <span
                      className="ml-2 px-2 py-0.5 text-xs rounded-full font-bold"
                      style={{
                        background: 'var(--accent-amber)',
                        color: 'var(--bg-primary)',
                      }}
                    >
                      YOU
                    </span>
                  )}
                </span>
                <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent-amber)' }}>
                  {drawPercentage}
                  %
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
                <div
                  className={`h-full transition-all duration-300 ${userPrediction === 'DRAW' ? 'animate-pulse' : ''}`}
                  style={{
                    width: `${drawPercentage}%`,
                    background: 'var(--accent-amber)',
                    boxShadow: userPrediction === 'DRAW' ? '0 0 8px var(--accent-amber)' : 'none',
                  }}
                />
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {Number(drawCount || 0)}
                {' '}
                prediction
                {Number(drawCount || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionPanelWinnings({
  marketAddress,
  userAddress,
  marketData,
  participantData,
  matchData,
  selectedTeam,
  isUserParticipant
}: {
  marketAddress: string
  userAddress?: string
  marketData: any
  participantData?: any
  matchData: EnhancedMatchData
  selectedTeam: number | null
  isUserParticipant: boolean
}) {
  const { winnings, isLoading } = useWinnings(marketAddress, userAddress)

  // Don't show if no user
  if (!userAddress) {
    return null
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="mb-4 p-3 rounded-lg animate-pulse" style={{ background: 'var(--bg-secondary)' }}>
        <div className="h-4 bg-[var(--bg-primary)] rounded w-1/2 mb-2" />
        <div className="h-6 bg-[var(--bg-primary)] rounded w-3/4" />
      </div>
    )
  }

  // For resolved markets, show actual winnings if user participated
  if (marketData?.status === 'Resolved') {
    if (isUserParticipant && winnings) {
      return (
        <div className="mb-4">
          <WinningsDisplay
            marketData={marketData}
            participantData={participantData}
            userAddress={userAddress}
            matchData={matchData}
            winnings={winnings}
            variant="compact"
          />
        </div>
      )
    }
    // Don't show anything for resolved markets if user didn't participate or has no winnings
    return null
  }

  // For unresolved markets, show winnings if available
  if (winnings && winnings.type !== 'none') {
    return (
      <div className="mb-4">
        <WinningsDisplay
          marketData={marketData}
          participantData={participantData}
          userAddress={userAddress}
          matchData={matchData}
          winnings={winnings}
          variant="compact"
        />
      </div>
    )
  }

  // Show potential winnings preview for non-participants in unresolved markets
  if (!isUserParticipant && marketData) {
    const selectedPrediction = selectedTeam === 1 ? 'Home' : selectedTeam === 2 ? 'Away' : selectedTeam === 3 ? 'Draw' : undefined
    
    return (
      <PotentialWinningsDisplay 
        marketData={marketData}
        selectedPrediction={selectedPrediction}
        className="mb-4"
      />
    )
  }

  return null
}



function ActionPanel({ matchData, marketStatus, isMatchStarted, isUserParticipant, selectedTeam, setSelectedTeam, renderButtons, marketAddress, userAddress, marketData, participantData }: {
  matchData: EnhancedMatchData
  marketStatus: boolean
  isMatchStarted: boolean
  isUserParticipant: boolean
  selectedTeam: number | null
  setSelectedTeam: (team: number | null) => void
  renderButtons: () => React.ReactNode
  marketAddress: string
  userAddress?: string
  marketData: any
  participantData?: any
}) {
  if (marketStatus || isMatchStarted) {
    return (
      <div className="card text-center">
        <h3 className="card-title mb-4">Market Concluded</h3>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          This market is either live or has been resolved. No further predictions can be made.
        </p>
        
        {/* Show winnings for resolved markets */}
        <ActionPanelWinnings 
          marketAddress={marketAddress}
          userAddress={userAddress}
          marketData={marketData}
          participantData={participantData}
          matchData={matchData}
          selectedTeam={selectedTeam}
          isUserParticipant={isUserParticipant}
        />
        
        {renderButtons()}
      </div>
    )
  }

  const OutcomeButton = ({ team, outcome, selected, onSelect, disabled }: any) => (
    <Button
      variant="ghost"
      onClick={() => !disabled && onSelect(outcome)}
      disabled={disabled}
      className="p-6 rounded-xl border-2 text-center transition-all w-full h-auto flex-col"
      style={{
        borderColor: selected ? 'var(--accent-cyan)' : 'var(--border-default)',
        background: selected ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-secondary)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <div
        className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-3 p-2"
        style={{ background: 'var(--bg-primary)' }}
      >
        <img
          src={`https://corsproxy.io/?${team?.crest}`}
          alt={team?.name}
          className="w-full h-full object-contain"
        />
      </div>
      <p className="font-sans font-semibold text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>
        PREDICT
      </p>
      <h4 className="font-jakarta font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
        {team?.name || 'Draw'}
      </h4>
    </Button>
  )

  return (
    <div className="card">
      <h3 className="card-title mb-2">Place Your Prediction</h3>
      <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
        Select the outcome you believe will happen. You can only join once.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <OutcomeButton team={matchData.homeTeam} outcome={1} selected={selectedTeam === 1} onSelect={setSelectedTeam} disabled={isUserParticipant} />
        <OutcomeButton team={{ name: 'Draw', crest: 'https://api.dicebear.com/7.x/initials/svg?seed=Draw' }} outcome={3} selected={selectedTeam === 3} onSelect={setSelectedTeam} disabled={isUserParticipant} />
        <OutcomeButton team={matchData.awayTeam} outcome={2} selected={selectedTeam === 2} onSelect={setSelectedTeam} disabled={isUserParticipant} />
      </div>
      {isUserParticipant && (
        <div className="text-center text-sm font-medium mb-4" style={{ color: 'var(--accent-green)' }}>
          ✓ You have already joined this market.
        </div>
      )}
      
      {/* Winnings Preview for Action Panel */}
      <ActionPanelWinnings 
        marketAddress={marketAddress}
        userAddress={userAddress}
        marketData={marketData}
        participantData={participantData}
        matchData={matchData}
        selectedTeam={selectedTeam}
        isUserParticipant={isUserParticipant}
      />
      
      <div className="flex justify-end">
        {renderButtons()}
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="w-1/4 h-6 skeleton rounded mb-12" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card h-64"><div className="w-full h-full skeleton rounded-lg" /></div>
          <div className="card h-80"><div className="w-full h-full skeleton rounded-lg" /></div>
        </div>
        <div className="lg:col-span-1">
          <div className="card h-96"><div className="w-full h-full skeleton rounded-lg" /></div>
        </div>
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---

export function MarketDetail() {
  const { marketAddress } = useParams<{ marketAddress: string }>()
  const { publicKey: userAddress } = useUnifiedWallet()
  const { joinMarket, resolveMarket, withdrawRewards, createSimilarMarket, getExplorerLink, isLoading, lastOperationId } = useSupabaseMarketActions()
  const { data: marketData, isLoading: isLoadingMarket, error: marketError, refetch: refetchMarket } = useSupabaseMarketData(marketAddress)
  const { currency, exchangeRates } = useCurrency()

  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState<{
    type: 'info' | 'success' | 'error'
    message: string
    signature?: string
  } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showCreateSimilarDialog, setShowCreateSimilarDialog] = useState(false)

  // Scroll to top when component mounts or market address changes
  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0)
  }, [marketAddress])

  // Extract match data from market data
  const { data: matchData, loading: isLoadingMatch, error: matchError } = useMatchData(
    marketData ? Number(marketData.matchId) : 0,
  )

  // Scroll to top once data is loaded to ensure MatchHeader is visible
  useEffect(() => {
    if (matchData && marketData && !isLoadingMarket && !isLoadingMatch) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        window.scrollTo(0, 0)
      }, 100)
    }
  }, [matchData, marketData, isLoadingMarket, isLoadingMatch])

  // Get user's prediction and rewards
  const { data: participantData } = useSupabaseParticipantData(marketAddress, userAddress?.toString())

  // Derive prediction info from participant data
  const hasJoined = !!participantData
  const predictionName = participantData?.prediction?.toUpperCase() || 'NONE'

  // Calculate reward eligibility based on participant data and market data
  const isUserWinner = marketData?.status === 'Resolved'
    && participantData
    && marketData.outcome
    && participantData.prediction === marketData.outcome
  const hasUserWithdrawn = participantData?.hasWithdrawn || false
  const canUserWithdraw = isUserWinner && !hasUserWithdrawn

  // Market info
  const marketInfo = marketData ? {
    creator: marketData.creator,
    matchId: marketData.matchId,
    entryFee: marketData.entryFee, // Already in lamports from the hook
    isPublic: marketData.isPublic,
    startTime: marketData.kickoffTime,
  } : null

  // Check if user is the creator
  const isCreator = userAddress && marketInfo?.creator === userAddress.toBase58()

  // Determine resolution eligibility
  const resolutionEligibility = useResolutionEligibility({
    matchData,
    marketStatus: marketData?.status === 'Resolved',
    isUserCreator: !!isCreator,
    isUserParticipant: hasJoined,
    userPrediction: participantData?.prediction as 'Home' | 'Draw' | 'Away' | undefined,
    userAddress: userAddress?.toString()
  })

  // Debug logging
  useEffect(() => {
    console.log('Market Detail Debug:', {
      participantData,
      hasJoined,
      predictionName,
      userAddress: userAddress?.toString(),
      marketAddress,
      marketOutcome: marketData?.outcome,
      marketStatus: marketData?.status,
      isUserWinner,
      hasUserWithdrawn,
      canUserWithdraw,
      resolutionEligibility,
    })
  }, [participantData, hasJoined, predictionName, userAddress, marketAddress, marketData, isUserWinner, hasUserWithdrawn, canUserWithdraw, resolutionEligibility])

  const marketStatus = marketData?.status === 'Resolved'
  const participantsCount = marketData?.participantCount || 0
  const isUserParticipant = hasJoined
  const winningTeam = marketData?.outcome === 'Home' ? 1 : marketData?.outcome === 'Away' ? 2 : marketData?.outcome === 'Draw' ? 3 : null
  const entryFeeValue = marketData?.entryFee || 0 // Already in lamports
  const homeCount = marketData?.homeCount || 0
  const awayCount = marketData?.awayCount || 0
  const drawCount = marketData?.drawCount || 0

  // Update action status based on operation state
  useEffect(() => {
    if (lastOperationId) {
      setActionStatus({
        type: 'success',
        message: 'Operation successful!',
        signature: lastOperationId,
      })
      // Refetch market data after successful operation
      refetchMarket()
    }
    if (isLoading) {
      setActionStatus({ type: 'info', message: 'Processing operation...' })
    }
  }, [lastOperationId, isLoading, refetchMarket])

  // Clear action status after some time
  useEffect(() => {
    if (actionStatus?.type === 'success' || actionStatus?.type === 'error') {
      const timer = setTimeout(() => {
        setActionStatus(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [actionStatus])

  const handleAction = async (action: () => Promise<string | null>, errorMsg: string) => {
    setActionStatus(null)
    try {
      const signature = await action()
      if (signature) {
        setActionStatus({
          type: 'success',
          message: 'Transaction successful!',
          signature,
        })
      }
    }
    catch (e: any) {
      console.error(e)
      setActionStatus({ type: 'error', message: e.message || errorMsg })
    }
  }

  const handleJoinMarket = () => handleAction(async () => {
    // Prevent rejoining if user has already joined
    if (isUserParticipant) {
      setActionStatus({ type: 'error', message: 'You have already joined this market.' })
      return null
    }
    if (selectedTeam === null) {
      setActionStatus({ type: 'error', message: 'Please select a team to predict.' })
      return null
    }
    if (!marketAddress) {
      setActionStatus({ type: 'error', message: 'Market address not found.' })
      return null
    }

    const prediction = selectedTeam === 1 ? 'Home' : selectedTeam === 2 ? 'Away' : 'Draw'
    return await joinMarket({
      marketId: marketAddress!, // Using marketAddress as marketId for Supabase
      prediction: prediction as 'Home' | 'Draw' | 'Away',
    })
  }, 'Failed to join market.')

  const handleResolveMarket = () => handleAction(async () => {
    if (!resolutionEligibility.canResolve) {
      setActionStatus({ type: 'error', message: resolutionEligibility.reason })
      return null
    }
    if (!marketAddress) {
      setActionStatus({ type: 'error', message: 'Market address not found.' })
      return null
    }
    if (!matchData?.matchResult) {
      setActionStatus({ type: 'error', message: 'Match result not available.' })
      return null
    }

    return await resolveMarket({
      marketId: marketAddress!,
      outcome: matchData.matchResult,
    })
  }, 'Failed to resolve market.')

  const handleWithdraw = () => handleAction(async () => {
    if (!marketAddress) {
      setActionStatus({ type: 'error', message: 'Market address not found.' })
      return null
    }

    const operationId = await withdrawRewards(marketAddress)
    if (operationId) {
      // Trigger confetti on successful withdrawal
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 100)
    }
    return operationId
  }, 'Failed to withdraw funds.')

  const handleCreateSimilarMarket = async (params: CreateSimilarMarketParams) => {
    try {
      const operationId = await createSimilarMarket(params)
      if (operationId) {
        setActionStatus({
          type: 'success',
          message: 'Similar market created successfully!',
          signature: operationId,
        })
        // Navigate to the new market or provide link
        // Note: We would need the new market address to navigate, which isn't returned by the current implementation
        // For now, we'll just show success message
      }
    } catch (error: any) {
      console.error('Failed to create similar market:', error)
      setActionStatus({
        type: 'error',
        message: error.message || 'Failed to create similar market',
      })
    }
  }

  const isLoadingData = isLoadingMarket || isLoadingMatch
  const isError = marketError || matchError

  if (isLoadingData)
    return <PageSkeleton />

  if (isError || !marketData || !matchData) {
    return (
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
        <div
          className="px-4 py-3 rounded-[16px] text-center"
          style={{
            background: 'var(--error-bg)',
            border: '1px solid var(--error-border)',
            color: 'var(--error)',
          }}
          role="alert"
        >
          <h4 className="font-bold">Market Not Found</h4>
          <p>The requested market does not exist or failed to load.</p>
        </div>
      </div>
    )
  }

  const startTime = marketData?.kickoffTime || 0
  const isMatchStarted = new Date() > new Date(startTime * 1000)
  const poolSize = marketData?.totalPool || 0

  const getTeamName = (index: number) => {
    if (!matchData)
      return 'N/A'
    if (index === 1)
      return matchData.homeTeam.name
    if (index === 2)
      return matchData.awayTeam.name
    return 'Draw'
  }

  const renderButtons = (): React.ReactNode => {
    if (marketStatus) { // Resolved
      // Note: Creator fee withdrawal is not implemented in the Solana program yet
      // Only show withdraw button for winning participants
      const showWithdrawButton = canUserWithdraw && !hasUserWithdrawn

      // Show withdrawn status only if user was a winner and has withdrawn
      const showWithdrawnStatus = isUserWinner && hasUserWithdrawn

      return (
        <div className="flex items-center gap-4">
          <Button variant="secondary" disabled>Resolved</Button>
          {showWithdrawButton
            ? (
                <Button variant="success" onClick={handleWithdraw} className="gap-2" disabled={isLoading}>
                  <span className="icon-[mdi--cash-multiple] w-5 h-5" />
                  {isLoading ? 'Withdrawing...' : 'Withdraw Rewards'}
                </Button>
              )
            : null}
          {showWithdrawnStatus
            ? (
                <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--accent-green)' }}>
                  <span className="icon-[mdi--check-circle] w-5 h-5" />
                  <span>Withdrawn</span>
                </div>
              )
            : null}
          {!isUserWinner && isUserParticipant && !isCreator
            ? (
                <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
                  <span className="icon-[mdi--close-circle] w-5 h-5" />
                  <span>Not a winner</span>
                </div>
              )
            : null}

        </div>
      )
    }

    if (isMatchStarted) {
      // Show resolve button based on eligibility logic
      if (resolutionEligibility.showResolveButton) {
        return (
          <Button 
            variant="default" 
            onClick={handleResolveMarket} 
            className="gap-2"
            disabled={!resolutionEligibility.canResolve}
          >
            <span className="icon-[mdi--check-decagram] w-5 h-5" />
            Resolve Market
          </Button>
        )
      }
      
      // Show why user can't resolve if they're a participant or creator
      if ((isUserParticipant || isCreator) && !resolutionEligibility.showResolveButton) {
        return (
          <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
            <span className="icon-[mdi--information-outline] w-5 h-5" />
            <span>{resolutionEligibility.reason}</span>
          </div>
        )
      }
      
      return <Button variant="secondary" disabled>Market Closed</Button>
    }

    return (
      <Button
        variant={isUserParticipant ? 'secondary' : 'default'}
        size="lg"
        onClick={handleJoinMarket}
        disabled={selectedTeam === null || isUserParticipant || isLoading || !userAddress}
        className="gap-2"
      >
        {isUserParticipant
          ? (
              <>
                <span className="icon-[mdi--check-circle] w-5 h-5" />
                Already Joined
              </>
            )
          : (
              <>
                <span className="icon-[mdi--login] w-5 h-5" />
                {isLoading ? 'Joining...' : !userAddress ? 'Connect Wallet' : 'Join Market'}
              </>
            )}
      </Button>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Confetti trigger={showConfetti} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/markets"
            className="text-sm font-medium flex items-center gap-2 hover:underline"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <span className="icon-[mdi--arrow-left]" />
            Back to All Markets
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <MatchHeader 
              matchData={matchData}
              marketAddress={marketAddress!}
              userAddress={userAddress}
              isUserParticipant={isUserParticipant}
              selectedTeam={selectedTeam}
              isMatchStarted={isMatchStarted}
              onShowCreateSimilarDialog={() => setShowCreateSimilarDialog(true)}
            />
            <ActionPanel
              matchData={matchData}
              marketStatus={marketStatus}
              isMatchStarted={isMatchStarted}
              isUserParticipant={isUserParticipant}
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              renderButtons={renderButtons}
              marketAddress={marketAddress!}
              userAddress={userAddress?.toString()}
              marketData={marketData}
              participantData={participantData}
            />

            {/* Data Visualizations */}
            <div className="grid grid-cols-1 gap-6">
              <PredictionDistributionChart markets={marketData
                ? [{
                    marketAddress: marketAddress!,
                    matchId: BigInt(marketData.matchId),
                    creator: marketData.creator,
                    entryFee: BigInt(marketData.entryFee),
                    isPublic: marketData.isPublic,
                    startTime: BigInt(marketData.kickoffTime),
                    resolved: marketData.status === 'Resolved',
                    participantsCount: BigInt(marketData.participantCount),
                    homeCount: BigInt(marketData.homeCount),
                    awayCount: BigInt(marketData.awayCount),
                    drawCount: BigInt(marketData.drawCount),
                  }]
                : []}
              />
            </div>

          </div>
          <div className="lg:col-span-1">
            <MarketStats
              marketInfo={marketInfo}
              poolSize={poolSize}
              participantsCount={participantsCount as bigint | number | undefined}
              marketStatus={Boolean(marketStatus)}
              isMatchStarted={isMatchStarted}
              winningTeamName={getTeamName(Number(winningTeam))}
              homeCount={homeCount as bigint | number | undefined}
              awayCount={awayCount as bigint | number | undefined}
              drawCount={drawCount as bigint | number | undefined}
              userPrediction={predictionName}
              userHasJoined={hasJoined}
              matchData={matchData}
              entryFeeValue={entryFeeValue}
              currency={currency}
              exchangeRates={exchangeRates}
              marketAddress={marketAddress!}
              userAddress={userAddress?.toString()}
              marketData={marketData}
              participantData={participantData}
            />
            {actionStatus && (
              <div
                className="mt-6 p-4 rounded-xl text-sm font-medium flex items-start gap-3"
                style={{
                  background: actionStatus.type === 'info'
                    ? 'var(--info-bg)'
                    : actionStatus.type === 'success'
                      ? 'var(--success-bg)'
                      : 'var(--error-bg)',
                  border: `1px solid ${actionStatus.type === 'info'
                    ? 'var(--info-border)'
                    : actionStatus.type === 'success'
                      ? 'var(--success-border)'
                      : 'var(--error-border)'}`,
                  color: actionStatus.type === 'info'
                    ? 'var(--info)'
                    : actionStatus.type === 'success'
                      ? 'var(--success)'
                      : 'var(--error)',
                }}
              >
                {actionStatus.type === 'info' && <span className="icon-[mdi--information-outline] w-5 h-5 mt-0.5" />}
                {actionStatus.type === 'success' && <span className="icon-[mdi--check-circle-outline] w-5 h-5 mt-0.5" />}
                {actionStatus.type === 'error' && <span className="icon-[mdi--alert-circle-outline] w-5 h-5 mt-0.5" />}
                <div className="flex-1">
                  <p>{actionStatus.message}</p>
                  {actionStatus.signature && (
                    <a
                      href={getExplorerLink(actionStatus.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline mt-1 block"
                      style={{ color: 'var(--accent-cyan)' }}
                    >
                      View Transaction on Solana Explorer
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Similar Market Dialog */}
        <CreateSimilarMarketDialog
          open={showCreateSimilarDialog}
          onOpenChange={setShowCreateSimilarDialog}
          matchData={matchData}
          onCreateMarket={handleCreateSimilarMarket}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
