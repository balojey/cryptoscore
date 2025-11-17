import type { Address } from 'viem'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI, CryptoScoreMarketABI } from '../config/contracts'
import { shortenAddress } from '../utils/formatters'
import { useMatchData } from '../hooks/useMatchData'
import type { Match } from '../types'

// --- SUB-COMPONENTS ---

const MatchHeader = ({ matchData }: { matchData: Match }) => (
  <div className="bg-white rounded-[16px] shadow-md p-8 border border-slate-100">
    <div className="text-center mb-6">
      <p className="font-sans text-base font-medium text-slate-500">{matchData.competition.name}</p>
      <p className="font-sans text-sm text-slate-400">{new Date(matchData.utcDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
    </div>
    <div className="flex items-center justify-around">
      <div className="flex flex-col items-center gap-4 w-1/3 text-center">
        <img src={'https://corsproxy.io/?' + matchData.homeTeam.crest} alt={matchData.homeTeam.name} className="w-24 h-24 object-contain" />
        <h2 className="font-jakarta font-bold text-3xl text-[#1E293B]">{matchData.homeTeam.name}</h2>
      </div>
      <div className="font-jakarta text-5xl font-bold text-slate-300 pt-6">VS</div>
      <div className="flex flex-col items-center gap-4 w-1/3 text-center">
        <img src={'https://corsproxy.io/?' + matchData.awayTeam.crest} alt={matchData.awayTeam.name} className="w-24 h-24 object-contain" />
        <h2 className="font-jakarta font-bold text-3xl text-[#1E293B]">{matchData.awayTeam.name}</h2>
      </div>
    </div>
  </div>
)

const MarketStats = ({ marketInfo, poolSize, participantsCount, marketStatus, isMatchStarted, winningTeamName }: any) => {
  const InfoRow = ({ label, value, valueClass, icon }: { label: string, value: React.ReactNode, valueClass?: string, icon: string }) => (
    <div className="flex items-center justify-between text-sm py-3 border-b border-slate-100">
      <div className="flex items-center gap-3 text-slate-500">
        <span className={`icon-[${icon}] w-5 h-5`} />
        <span>{label}</span>
      </div>
      <span className={`font-semibold text-[#1E293B] ${valueClass}`}>{value}</span>
    </div>
  )

  const getStatusBadge = () => {
    if (marketStatus) return <div className="px-2 py-1 text-xs font-bold text-white bg-[#16A34A] rounded">Resolved</div>
    if (isMatchStarted) return <div className="px-2 py-1 text-xs font-bold text-white bg-[#F59E0B] rounded">Live</div>
    return <div className="px-2 py-1 text-xs font-bold text-white bg-[#0EA5E9] rounded">Open</div>
  }

  return (
    <div className="bg-white rounded-[16px] shadow-md p-6 border border-slate-100">
      <h3 className="font-jakarta text-2xl font-bold text-[#1E293B] mb-4">Market Stats</h3>
      <div className="space-y-2">
        <InfoRow label="Status" value={getStatusBadge()} icon="mdi--check-circle-outline" />
        <InfoRow label="Pool Size" value={<>{poolSize.toFixed(2)} <span className="font-normal text-slate-400">PAS</span></>} icon="mdi--database-outline" />
        <InfoRow label="Entry Fee" value={<>{formatEther(marketInfo[3])} <span className="font-normal text-slate-400">PAS</span></>} icon="mdi--login" />
        <InfoRow label="Participants" value={participantsCount?.toString() ?? '0'} icon="mdi--account-group-outline" />
        <InfoRow label="Creator" value={<a href={`https://blockscout-passet-hub.parity-testnet.parity.io/address/${marketInfo[2]}`} target="_blank" rel="noopener noreferrer" className="font-mono link link-hover text-[#0A84FF]">{shortenAddress(marketInfo[2])}</a>} icon="mdi--account-edit-outline" />
        {marketStatus && <InfoRow label="Winning Outcome" value={winningTeamName} valueClass="text-[#16A34A]" icon="mdi--trophy-outline" />}
      </div>
    </div>
  )
}

const ActionPanel = ({ matchData, marketStatus, isMatchStarted, isUserParticipant, selectedTeam, setSelectedTeam, renderButtons }: any) => {
  if (marketStatus || isMatchStarted) {
    return (
      <div className="bg-white rounded-[16px] shadow-md p-8 border border-slate-100 text-center">
        <h3 className="font-jakarta text-2xl font-bold text-[#1E293B] mb-4">Market Concluded</h3>
        <p className="text-slate-500 mb-6">This market is either live or has been resolved. No further predictions can be made.</p>
        {renderButtons()}
      </div>
    )
  }

  const OutcomeButton = ({ team, outcome, selected, onSelect }: any) => (
    <button
      type="button"
      onClick={() => onSelect(outcome)}
      className={`p-6 rounded-[14px] border-2 text-center transition-all w-full
        ${selected
          ? 'border-[#0A84FF] bg-blue-50'
          : 'border-slate-200 bg-slate-50 hover:border-slate-400'
        }`}
    >
      <img src={'https://corsproxy.io/?' + team?.crest} alt={team?.name} className="w-16 h-16 object-contain mx-auto mb-3" />
      <p className="font-sans font-semibold text-slate-600">Predict</p>
      <h4 className="font-jakarta font-bold text-xl text-[#1E293B]">{team?.name || 'Draw'}</h4>
    </button>
  )

  return (
    <div className="bg-white rounded-[16px] shadow-md p-8 border border-slate-100">
      <h3 className="font-jakarta text-2xl font-bold text-[#1E293B] mb-2">Place Your Prediction</h3>
      <p className="text-slate-500 mb-6">Select the outcome you believe will happen. You can only join once.</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <OutcomeButton team={matchData.homeTeam} outcome={1} selected={selectedTeam === 1} onSelect={setSelectedTeam} />
        <OutcomeButton team={{ name: 'Draw', crest: 'https://api.dicebear.com/7.x/initials/svg?seed=Draw' }} outcome={3} selected={selectedTeam === 3} onSelect={setSelectedTeam} />
        <OutcomeButton team={matchData.awayTeam} outcome={2} selected={selectedTeam === 2} onSelect={setSelectedTeam} />
      </div>
      {isUserParticipant && <div className="text-center text-sm font-medium text-[#16A34A] mb-4">You have already joined this market.</div>}
      <div className="flex justify-end">
        {renderButtons()}
      </div>
    </div>
  )
}

const PageSkeleton = () => (
  <div className="container mx-auto px-4 py-8 animate-pulse">
    <div className="w-1/4 h-6 bg-slate-200 rounded mb-12" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-[16px] shadow-md p-8 h-64 border border-slate-100"><div className="w-full h-full bg-slate-200 rounded-lg" /></div>
        <div className="bg-white rounded-[16px] shadow-md p-8 h-80 border border-slate-100"><div className="w-full h-full bg-slate-200 rounded-lg" /></div>
      </div>
      <div className="lg:col-span-1">
        <div className="bg-white rounded-[16px] shadow-md p-6 h-96 border border-slate-100"><div className="w-full h-full bg-slate-200 rounded-lg" /></div>
      </div>
    </div>
  </div>
)

// --- MAIN COMPONENT ---

export function MarketDetail() {
  const { marketAddress } = useParams<{ marketAddress: Address }>()
  const { address: userAddress } = useAccount()
  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract()

  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState<{ type: 'info' | 'success' | 'error', message: string } | null>(null)

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
    if (isTxConfirmed) setActionStatus({ type: 'success', message: 'Transaction successful!' })
    if (isWritePending) setActionStatus({ type: 'info', message: 'Waiting for wallet confirmation...' })
    if (isTxConfirming) setActionStatus({ type: 'info', message: 'Confirming transaction...' })
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
    if (winnerTag === 'HOME_TEAM') outcome = 1
    else if (winnerTag === 'AWAY_TEAM') outcome = 2
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
  }, 'Failed to withdraw funds.')

  const isLoading = isLoadingInfo || isLoadingMatch || isLoadingStatus || isLoadingParticipants
  const isError = infoError || matchError

  if (isLoading) return <PageSkeleton />

  if (isError || !marketInfo || (marketInfo as any)[0] === '0x0000000000000000000000000000000000000000' || !matchData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-[16px] text-center" role="alert">
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
    if (!matchData) return 'N/A'
    if (index === 1) return matchData.homeTeam.name
    if (index === 2) return matchData.awayTeam.name
    return 'Draw'
  }

  const renderButtons = () => {
    const buttonClass = "flex items-center justify-center gap-2 h-12 px-8 text-white rounded-[12px] font-sans text-base font-bold uppercase tracking-wider transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    const primaryButton = `${buttonClass} bg-[#0A84FF] hover:bg-blue-600 active:bg-blue-700 shadow-blue-500/20 hover:shadow-blue-500/30`
    const successButton = `${buttonClass} bg-[#0BC95A] hover:bg-green-600 active:bg-green-700 shadow-green-500/20 hover:shadow-green-500/30`
    const disabledButton = `${buttonClass} bg-slate-300 shadow-none`

    if (marketStatus) { // Resolved
      return (
        <div className="flex items-center gap-4">
          <button className={disabledButton} disabled>Resolved</button>
          {isUserParticipant && <button className={successButton} onClick={handleWithdraw}>Withdraw</button>}
        </div>
      )
    }

    if (isMatchStarted) {
      if (isUserParticipant && (matchData as any)?.status === 'FINISHED') return <button className={primaryButton} onClick={handleResolveMarket}>Resolve Market</button>
      return <button className={disabledButton} disabled>Market Closed</button>
    }

    return <button className={primaryButton} onClick={handleJoinMarket} disabled={selectedTeam === null || isUserParticipant}>Join Market</button>
  }

  return (
    <div className="bg-[#F5F7FA] min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="text-sm font-medium text-slate-500 hover:text-[#0A84FF] flex items-center gap-2">
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
              <div className={`mt-6 p-4 rounded-[12px] text-sm font-medium flex items-start gap-3
                ${actionStatus.type === 'info' && 'bg-blue-100 text-blue-800'}
                ${actionStatus.type === 'success' && 'bg-green-100 text-green-800'}
                ${actionStatus.type === 'error' && 'bg-red-100 text-red-800'}
              `}>
                {(actionStatus.type === 'info') && <span className="icon-[mdi--information-outline] w-5 h-5 mt-0.5" />}
                {(actionStatus.type === 'success') && <span className="icon-[mdi--check-circle-outline] w-5 h-5 mt-0.5" />}
                {(actionStatus.type === 'error') && <span className="icon-[mdi--alert-circle-outline] w-5 h-5 mt-0.5" />}
                <p>{actionStatus.message}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
