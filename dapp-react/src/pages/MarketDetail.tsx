import type { Address } from 'viem'
import type { Match } from '../types'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import PoolTrendChart from '../components/charts/PoolTrendChart'
import PredictionDistributionChart from '../components/charts/PredictionDistributionChart'
import MarketComments from '../components/MarketComments'
import SharePrediction from '../components/SharePrediction'
import Confetti from '../components/ui/Confetti'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI, CryptoScoreMarketABI } from '../config/contracts'
import { useMatchData } from '../hooks/useMatchData'
import { shortenAddress } from '../utils/formatters'

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

function MarketStats({ marketInfo, poolSize, participantsCount, marketStatus, isMatchStarted, winningTeamName }: any) {
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
      return <span className="badge badge-success">Resolved</span>
    if (isMatchStarted)
      return <span className="badge badge-warning">Live</span>
    return <span className="badge badge-info">Open</span>
  }

  return (
    <div className="card">
      <h3 className="card-title mb-4">Market Stats</h3>
      <div className="space-y-2">
        <InfoRow label="Status" value={getStatusBadge()} icon="mdi--check-circle-outline" />
        <InfoRow
          label="Pool Size"
          value={(
            <>
              <span className="font-mono">{poolSize.toFixed(2)}</span>
              {' '}
              <span style={{ color: 'var(--text-tertiary)' }}>PAS</span>
            </>
          )}
          icon="mdi--database-outline"
        />
        <InfoRow
          label="Entry Fee"
          value={(
            <>
              <span className="font-mono">{formatEther(marketInfo[3])}</span>
              {' '}
              <span style={{ color: 'var(--text-tertiary)' }}>PAS</span>
            </>
          )}
          icon="mdi--login"
        />
        <InfoRow label="Participants" value={participantsCount?.toString() ?? '0'} icon="mdi--account-group-outline" />
        <InfoRow
          label="Creator"
          value={(
            <a
              href={`https://blockscout-passet-hub.parity-testnet.parity.io/address/${marketInfo[2]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono hover:underline"
              style={{ color: 'var(--accent-cyan)' }}
            >
              {shortenAddress(marketInfo[2])}
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
    <button
      type="button"
      onClick={() => onSelect(outcome)}
      className="p-6 rounded-xl border-2 text-center transition-all w-full"
      style={{
        borderColor: selected ? 'var(--accent-cyan)' : 'var(--border-default)',
        background: selected ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-secondary)',
      }}
      onMouseEnter={(e) => {
        if (!selected)
          e.currentTarget.style.borderColor = 'var(--border-hover)'
      }}
      onMouseLeave={(e) => {
        if (!selected)
          e.currentTarget.style.borderColor = 'var(--border-default)'
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
    </button>
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
  const { marketAddress } = useParams<{ marketAddress: Address }>()
  const { address: userAddress } = useAccount()
  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract()

  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState<{ type: 'info' | 'success' | 'error', message: string } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const { data: marketInfo, isLoading: isLoadingInfo, error: infoError } = useReadContract({
    abi: CryptoScoreFactoryABI,
    address: CRYPTO_SCORE_FACTORY_ADDRESS,
    functionName: 'marketInfoByAddress',
    args: [marketAddress!],
    query: { enabled: !!marketAddress },
  })

  const { data: matchData, loading: isLoadingMatch, error: matchError } = useMatchData(
    marketInfo ? Number((marketInfo as any)[1]) : 0,
  )

  const { data: marketStatus, isLoading: isLoadingStatus } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'resolved',
    query: { enabled: !!marketAddress },
  })

  const { data: participantsCount, isLoading: isLoadingParticipants } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'getParticipantsCount',
    query: { enabled: !!marketAddress },
  })

  const { data: isParticipant } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'isParticipant',
    args: [userAddress!],
    query: { enabled: !!marketAddress && !!userAddress },
  })
  const isUserParticipant = Boolean(isParticipant)

  const { data: winningTeam } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'winner',
    query: { enabled: !!marketAddress && marketStatus === true },
  })

  const { data: entryFeeValue } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'entryFee',
    query: { enabled: !!marketAddress },
  })

  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isTxConfirmed)
      setActionStatus({ type: 'success', message: 'Transaction successful!' })
    if (isWritePending)
      setActionStatus({ type: 'info', message: 'Waiting for wallet confirmation...' })
    if (isTxConfirming)
      setActionStatus({ type: 'info', message: 'Confirming transaction...' })
  }, [isTxConfirmed, isWritePending, isTxConfirming])

  const handleAction = async (action: () => Promise<any>, errorMsg: string) => {
    setActionStatus(null)
    try {
      await action()
    }
    catch (e: any) {
      console.error(e)
      setActionStatus({ type: 'error', message: e.shortMessage || errorMsg })
    }
  }

  const handleJoinMarket = () => handleAction(async () => {
    if (selectedTeam === null) {
      setActionStatus({ type: 'error', message: 'Please select a team to predict.' })
      return
    }
    await writeContractAsync({
      abi: CryptoScoreMarketABI,
      address: marketAddress!,
      functionName: 'join',
      args: [selectedTeam],
      value: (marketInfo as any)?.[3],
    })
  }, 'Transaction failed.')

  const handleResolveMarket = () => handleAction(async () => {
    if (!matchData || (matchData as any).status !== 'FINISHED') {
      setActionStatus({ type: 'error', message: 'Match has not finished yet.' })
      return
    }
    const winnerTag = (matchData as any)?.score?.winner
    let outcome: number
    if (winnerTag === 'HOME_TEAM')
      outcome = 1
    else if (winnerTag === 'AWAY_TEAM')
      outcome = 2
    else outcome = 3

    await writeContractAsync({
      abi: CryptoScoreMarketABI,
      address: marketAddress!,
      functionName: 'resolve',
      args: [outcome],
    })
  }, 'Failed to resolve market.')

  const handleWithdraw = () => handleAction(async () => {
    await writeContractAsync({
      abi: CryptoScoreMarketABI,
      address: marketAddress!,
      functionName: 'withdraw',
    })
    // Trigger confetti on successful withdrawal
    setShowConfetti(true)
    setTimeout(() => setShowConfetti(false), 100)
  }, 'Failed to withdraw funds.')

  const isLoading = isLoadingInfo || isLoadingMatch || isLoadingStatus || isLoadingParticipants
  const isError = infoError || matchError

  if (isLoading)
    return <PageSkeleton />

  if (isError || !marketInfo || (marketInfo as any)[0] === '0x0000000000000000000000000000000000000000' || !matchData) {
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

  const [, , , , , startTime] = marketInfo as any
  const isMatchStarted = new Date() > new Date(Number(startTime) * 1000)
  const poolSize = entryFeeValue && participantsCount ? Number(participantsCount) * Number(formatEther(entryFeeValue as bigint)) : 0

  const getTeamName = (index: number) => {
    if (!matchData)
      return 'N/A'
    if (index === 1)
      return matchData.homeTeam.name
    if (index === 2)
      return matchData.awayTeam.name
    return 'Draw'
  }

  const renderButtons = () => {
    if (marketStatus) { // Resolved
      return (
        <div className="flex items-center gap-4">
          <button className="btn-secondary" disabled>Resolved</button>
          {isUserParticipant && (
            <button className="btn-success" onClick={handleWithdraw}>
              <span className="icon-[mdi--cash-multiple] w-5 h-5" />
              Withdraw
            </button>
          )}
        </div>
      )
    }

    if (isMatchStarted) {
      if (isUserParticipant && (matchData as any)?.status === 'FINISHED') {
        return (
          <button className="btn-primary" onClick={handleResolveMarket}>
            <span className="icon-[mdi--check-decagram] w-5 h-5" />
            Resolve Market
          </button>
        )
      }
      return <button className="btn-secondary" disabled>Market Closed</button>
    }

    return (
      <button
        className="btn-primary btn-lg"
        onClick={handleJoinMarket}
        disabled={selectedTeam === null || isUserParticipant}
      >
        <span className="icon-[mdi--login] w-5 h-5" />
        Join Market
      </button>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Confetti trigger={showConfetti} />
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/"
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
              <PredictionDistributionChart markets={[{
                marketAddress: marketAddress!,
                matchId: BigInt((marketInfo as any)[1]),
                creator: (marketInfo as any)[2],
                entryFee: (marketInfo as any)[3],
                isPublic: (marketInfo as any)[4],
                startTime: (marketInfo as any)[5],
                resolved: Boolean(marketStatus),
                participantsCount: participantsCount ? BigInt(participantsCount.toString()) : 0n,
              }]}
              />
              <PoolTrendChart markets={[{
                marketAddress: marketAddress!,
                matchId: BigInt((marketInfo as any)[1]),
                creator: (marketInfo as any)[2],
                entryFee: (marketInfo as any)[3],
                isPublic: (marketInfo as any)[4],
                startTime: (marketInfo as any)[5],
                resolved: Boolean(marketStatus),
                participantsCount: participantsCount ? BigInt(participantsCount.toString()) : 0n,
              }]}
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
              participantsCount={participantsCount}
              marketStatus={marketStatus}
              isMatchStarted={isMatchStarted}
              winningTeamName={getTeamName(Number(winningTeam))}
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
                <p>{actionStatus.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
