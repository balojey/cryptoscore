import type { Match } from '../types'
import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PoolTrendChart from '../components/charts/PoolTrendChart'
import PredictionDistributionChart from '../components/charts/PredictionDistributionChart'
import MarketComments from '../components/MarketComments'
import SharePrediction from '../components/SharePrediction'
import Confetti from '../components/ui/Confetti'
import { useMatchData } from '../hooks/useMatchData'
import { useMarketData } from '../hooks/useMarketData'
import { useMarketActions } from '../hooks/useMarketActions'
import { useUserPrediction } from '../hooks/useUserPrediction'
import { useUserRewards } from '../hooks/useUserRewards'
import { shortenAddress, formatSOL } from '../utils/formatters'
import { getAccountExplorerUrl } from '../config/programs'

// --- SUB-COMPONENTS ---

function MatchHeader({ matchData }: { matchData: Match }) {
  return (
    <div className="card">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="icon-[mdi--trophy-outline] w-5 h-5" style={{ color: 'var(--accent-amber)' }} />
          <p className="font-sans text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
            {matchData.competition.name}
          </p>
        </div>
        <p className="font-sans text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {new Date(matchData.utcDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
        </p>
      </div>
      <div className="flex items-center justify-around">
        <div className="flex flex-col items-center gap-4 w-1/3 text-center">
          <div
            className="w-28 h-28 rounded-xl flex items-center justify-center p-4"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <img
              src={`https://corsproxy.io/?${matchData.homeTeam.crest}`}
              alt={matchData.homeTeam.name}
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-jakarta font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
            {matchData.homeTeam.name}
          </h2>
        </div>
        <div className="font-jakarta text-5xl font-bold pt-6" style={{ color: 'var(--text-tertiary)' }}>
          VS
        </div>
        <div className="flex flex-col items-center gap-4 w-1/3 text-center">
          <div
            className="w-28 h-28 rounded-xl flex items-center justify-center p-4"
            style={{ background: 'var(--bg-secondary)' }}
          >
            <img
              src={`https://corsproxy.io/?${matchData.awayTeam.crest}`}
              alt={matchData.awayTeam.name}
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="font-jakarta font-bold text-3xl" style={{ color: 'var(--text-primary)' }}>
            {matchData.awayTeam.name}
          </h2>
        </div>
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
  matchData: Match
  entryFeeValue: number
}

function MarketStats({ marketInfo, poolSize, participantsCount, marketStatus, isMatchStarted, winningTeamName, homeCount, awayCount, drawCount, userPrediction, userHasJoined, matchData, entryFeeValue }: MarketStatsProps) {
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
    if ((matchData as any)?.status === 'FINISHED')
      return <Badge variant="warning">Unresolved</Badge>
    if (isMatchStarted)
      return <Badge variant="warning">Live</Badge>
    return <Badge variant="info">Open</Badge>
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
            <span className="font-mono">{formatSOL(poolSize, 2)}</span>
          )}
          icon="mdi--database-outline"
        />
        <InfoRow
          label="Entry Fee"
          value={(
            <span className="font-mono">{formatSOL(entryFeeValue, 4)}</span>
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
      </div>

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

function ActionPanel({ matchData, marketStatus, isMatchStarted, isUserParticipant, selectedTeam, setSelectedTeam, renderButtons }: any) {
  if (marketStatus || isMatchStarted) {
    return (
      <div className="card text-center">
        <h3 className="card-title mb-4">Market Concluded</h3>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          This market is either live or has been resolved. No further predictions can be made.
        </p>
        {renderButtons()}
      </div>
    )
  }

  const OutcomeButton = ({ team, outcome, selected, onSelect }: any) => (
    <Button
      variant="ghost"
      onClick={() => onSelect(outcome)}
      className="p-6 rounded-xl border-2 text-center transition-all w-full h-auto flex-col"
      style={{
        borderColor: selected ? 'var(--accent-cyan)' : 'var(--border-default)',
        background: selected ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-secondary)',
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
        <OutcomeButton team={matchData.homeTeam} outcome={1} selected={selectedTeam === 1} onSelect={setSelectedTeam} />
        <OutcomeButton team={{ name: 'Draw', crest: 'https://api.dicebear.com/7.x/initials/svg?seed=Draw' }} outcome={3} selected={selectedTeam === 3} onSelect={setSelectedTeam} />
        <OutcomeButton team={matchData.awayTeam} outcome={2} selected={selectedTeam === 2} onSelect={setSelectedTeam} />
      </div>
      {isUserParticipant && (
        <div className="text-center text-sm font-medium mb-4" style={{ color: 'var(--accent-green)' }}>
          ✓ You have already joined this market.
        </div>
      )}
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
  const { publicKey: userAddress } = useWallet()
  const { joinMarket, resolveMarket, withdrawRewards, getExplorerLink, isLoading, txSignature } = useMarketActions()
  const { data: marketData, isLoading: isLoadingMarket, error: marketError, refetch: refetchMarket } = useMarketData(marketAddress)

  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState<{ 
    type: 'info' | 'success' | 'error'
    message: string
    signature?: string 
  } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Extract match data from market data
  const { data: matchData, loading: isLoadingMatch, error: matchError } = useMatchData(
    marketData ? Number(marketData.matchId) : 0,
  )

  // Get user's prediction and rewards
  const { predictionName, hasJoined } = useUserPrediction(marketAddress)
  const { data: rewardsData } = useUserRewards(marketAddress)

  // Market info
  const marketInfo = marketData ? {
    creator: marketData.creator,
    matchId: marketData.matchId,
    entryFee: marketData.entryFee, // Already in lamports from the hook
    isPublic: marketData.isPublic,
    startTime: marketData.kickoffTime,
  } : null

  const marketStatus = marketData?.status === 'Resolved'
  const participantsCount = marketData?.participantCount || 0
  const isUserParticipant = hasJoined
  const winningTeam = marketData?.outcome === 'Home' ? 1 : marketData?.outcome === 'Away' ? 2 : marketData?.outcome === 'Draw' ? 3 : null
  const entryFeeValue = marketData?.entryFee || 0 // Already in lamports
  const homeCount = marketData?.homeCount || 0
  const awayCount = marketData?.awayCount || 0
  const drawCount = marketData?.drawCount || 0
  const userRewardBalance = rewardsData?.hasRewards ? 1 : 0 // Simplified check

  // Update action status based on transaction state
  useEffect(() => {
    if (txSignature) {
      setActionStatus({ 
        type: 'success', 
        message: 'Transaction successful!',
        signature: txSignature
      })
      // Refetch market data after successful transaction
      refetchMarket()
    }
    if (isLoading) {
      setActionStatus({ type: 'info', message: 'Processing transaction...' })
    }
  }, [txSignature, isLoading, refetchMarket])

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
          signature 
        })
      }
    }
    catch (e: any) {
      console.error(e)
      setActionStatus({ type: 'error', message: e.message || errorMsg })
    }
  }

  const handleJoinMarket = () => handleAction(async () => {
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
      marketAddress,
      prediction: prediction as 'Home' | 'Draw' | 'Away'
    })
  }, 'Failed to join market.')

  const handleResolveMarket = () => handleAction(async () => {
    if (!matchData || (matchData as any).status !== 'FINISHED') {
      setActionStatus({ type: 'error', message: 'Match has not finished yet.' })
      return null
    }
    if (!marketAddress) {
      setActionStatus({ type: 'error', message: 'Market address not found.' })
      return null
    }

    const winnerTag = (matchData as any)?.score?.winner
    let outcome: 'Home' | 'Away' | 'Draw'
    if (winnerTag === 'HOME_TEAM')
      outcome = 'Home'
    else if (winnerTag === 'AWAY_TEAM')
      outcome = 'Away'
    else 
      outcome = 'Draw'

    return await resolveMarket({
      marketAddress,
      outcome
    })
  }, 'Failed to resolve market.')

  const handleWithdraw = () => handleAction(async () => {
    if (!marketAddress) {
      setActionStatus({ type: 'error', message: 'Market address not found.' })
      return null
    }

    const signature = await withdrawRewards(marketAddress)
    if (signature) {
      // Trigger confetti on successful withdrawal
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 100)
    }
    return signature
  }, 'Failed to withdraw funds.')

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
      // Use the rewards data from the hook
      const userIsWinner = rewardsData?.isWinner || false
      const canWithdraw = rewardsData?.canWithdraw || false
      const hasWithdrawn = rewardsData?.hasWithdrawn || false

      return (
        <div className="flex items-center gap-4">
          <Button variant="secondary" disabled>Resolved</Button>
          {userIsWinner && canWithdraw
            ? (
                <Button variant="success" onClick={handleWithdraw} className="gap-2" disabled={isLoading}>
                  <span className="icon-[mdi--cash-multiple] w-5 h-5" />
                  {isLoading ? 'Withdrawing...' : 'Withdraw Rewards'}
                </Button>
              )
            : null}
          {userIsWinner && hasWithdrawn
            ? (
                <div className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--accent-green)' }}>
                  <span className="icon-[mdi--check-circle] w-5 h-5" />
                  <span>Withdrawn</span>
                </div>
              )
            : null}
          {!userIsWinner && isUserParticipant
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
      if (isUserParticipant && (matchData as any)?.status === 'FINISHED') {
        return (
          <Button variant="default" onClick={handleResolveMarket} className="gap-2">
            <span className="icon-[mdi--check-decagram] w-5 h-5" />
            Resolve Market
          </Button>
        )
      }
      return <Button variant="secondary" disabled>Market Closed</Button>
    }

    return (
      <Button
        variant="default"
        size="lg"
        onClick={handleJoinMarket}
        disabled={selectedTeam === null || isUserParticipant || isLoading || !userAddress}
        className="gap-2"
      >
        <span className="icon-[mdi--login] w-5 h-5" />
        {isLoading ? 'Joining...' : isUserParticipant ? 'Already Joined' : !userAddress ? 'Connect Wallet' : 'Join Market'}
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
            <MatchHeader matchData={matchData} />
            <ActionPanel
              matchData={matchData}
              marketStatus={marketStatus}
              isMatchStarted={isMatchStarted}
              isUserParticipant={isUserParticipant}
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              renderButtons={renderButtons}
            />

            {/* Data Visualizations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PredictionDistributionChart markets={marketData ? [{
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
              }] : []}
              />
              <PoolTrendChart markets={marketData ? [{
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
              }] : []}
              />
            </div>

            {/* Social Features */}
            <div className="flex items-center gap-4">
              <SharePrediction
                marketAddress={marketAddress!}
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
            </div>

            <MarketComments marketAddress={marketAddress!} />
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
      </div>
    </div>
  )
}
