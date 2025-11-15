import type { Address } from 'viem'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { formatEther } from 'viem'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI, CryptoScoreMarketABI } from '../config/contracts'
import { shortenAddress } from '../utils/formatters'
import { useMatchData } from '../hooks/useMatchData'

export function MarketDetail() {
  const { marketAddress } = useParams<{ marketAddress: Address }>()
  const { address: userAddress } = useAccount()
  const { writeContractAsync, data: hash, isPending: isWritePending } = useWriteContract()

  const [selectedTeam, setSelectedTeam] = useState<number | null>(null)
  const [actionStatus, setActionStatus] = useState('')

  const { data: marketInfo, isLoading: isLoadingInfo, error: infoError } = useReadContract({
    abi: CryptoScoreFactoryABI,
    address: CRYPTO_SCORE_FACTORY_ADDRESS,
    functionName: 'marketInfoByAddress',
    args: [marketAddress!],
    query: {
      enabled: !!marketAddress,
    },
  })

  const { data: matchData, loading: isLoadingMatch, error: matchError } = useMatchData(
    marketInfo ? Number((marketInfo as any)[1]) : 0,
  )

  const { data: marketStatus, isLoading: isLoadingStatus, error: statusError } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'resolved',
    query: {
      enabled: !!marketAddress,
    },
  })

  const { data: participantsCount, isLoading: isLoadingParticipants } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'getParticipantsCount',
    query: {
      enabled: !!marketAddress,
    },
  })

  const { data: isParticipant } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'isParticipant',
    args: [userAddress!],
    query: {
      enabled: !!marketAddress && !!userAddress,
    },
  })
  // normalize unknown returned type to a boolean for safe usage in JSX/conditionals
  const isUserParticipant = Boolean(isParticipant)

  const { data: winningTeam } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'winner',
    query: {
      enabled: !!marketAddress && marketStatus === true,
    },
  })

  const { data: totalVolume } = useReadContract({
    abi: CryptoScoreMarketABI,
    address: marketAddress,
    functionName: 'entryFee', // This is entryFee per person, total volume is entryFee * participants
    query: {
      enabled: !!marketAddress,
    },
  })

  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isTxConfirmed)
      setActionStatus('Transaction successful!')
  }, [isTxConfirmed])

  const handleJoinMarket = async () => {
    if (selectedTeam === null) {
      setActionStatus('Please select a team to predict.')
      return
    }
    try {
      setActionStatus('Sending transaction...')
      await writeContractAsync({
        abi: CryptoScoreMarketABI,
        address: marketAddress!,
        functionName: 'join',
        args: [selectedTeam],
        value: (marketInfo as any)?.[3], // entryFee
      })
    }
    catch (e) {
      console.error(e)
      setActionStatus('Transaction failed.')
    }
  }

  const handleResolveMarket = async () => {
    if (!matchData) {
      setActionStatus('Match data not available.')
      return
    }

    const status = (matchData as any).status
    if (status !== 'FINISHED') {
      setActionStatus('Match has not finished yet.')
      return
    }

    // Determine winner:
    // contract expects: 1 = home, 2 = away, 3 = draw
    let outcome: number
    const winnerTag = (matchData as any)?.score?.winner
    if (winnerTag) {
      if (winnerTag === 'HOME_TEAM') outcome = 1
      else if (winnerTag === 'AWAY_TEAM') outcome = 2
      else outcome = 3
    }
    else {
      const full = (matchData as any)?.score?.fullTime ?? {}
      const home = Number(full.homeTeam ?? 0)
      const away = Number(full.awayTeam ?? 0)
      if (home > away) outcome = 1
      else if (away > home) outcome = 2
      else outcome = 3
    }

    try {
      setActionStatus('Resolving market...')
      await writeContractAsync({
        abi: CryptoScoreMarketABI,
        address: marketAddress!,
        functionName: 'resolve',
        args: [outcome],
      })
    }
    catch (e) {
      console.error(e)
      setActionStatus('Failed to resolve market.')
    }
  }

  const handleWithdraw = async () => {
    try {
      setActionStatus('Withdrawing funds...')
      await writeContractAsync({
        abi: CryptoScoreMarketABI,
        address: marketAddress!,
        functionName: 'withdraw',
      })
    }
    catch (e) {
      console.error(e)
      setActionStatus('Failed to withdraw funds.')
    }
  }

  const isLoading = isLoadingInfo || isLoadingStatus || isLoadingParticipants || isLoadingMatch
  const isError = infoError || statusError || matchError

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  if (isError || !marketInfo || (marketInfo as any)[0] === '0x0000000000000000000000000000000000000000' || !matchData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div role="alert" className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>Error: Market not found or failed to load details.</span>
        </div>
      </div>
    )
  }

  const [, , creator, entryFee, , startTime] = marketInfo as any
  const matchDate = new Date(Number(startTime) * 1000)
  const isMatchStarted = new Date() > matchDate
  const poolSize = totalVolume && participantsCount ? Number(participantsCount) * Number(formatEther(totalVolume as bigint)) : 0

  const getTeamName = (index: number) => {
    if (!matchData)
      return 'N/A'
    if (index === 0)
      return matchData.homeTeam.name
    if (index === 1)
      return matchData.awayTeam.name
    return 'Draw'
  }

  const renderButtons = () => {
    if (marketStatus) { // Resolved
      if (isUserParticipant) {
        return (
          <div className="flex items-center gap-4">
            <button className="btn btn-disabled">Resolved</button>
            <button className="btn btn-primary" onClick={handleWithdraw}>Withdraw</button>
          </div>
        )
      }
      return <button className="btn btn-disabled">Market Resolved</button>
    }

    if (isMatchStarted) {
      if (userAddress === creator)
        return <button className="btn btn-primary" onClick={handleResolveMarket}>Resolve Market</button>

      return <button className="btn btn-disabled">Market Closed</button>
    }

    return <button className="btn btn-primary" onClick={handleJoinMarket} disabled={selectedTeam === null || isUserParticipant}>Join Market</button>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold">{matchData.competition.name} - Matchday {matchData.matchday}</h2>
            <p className="text-sm text-gray-500">{new Date(matchData.utcDate).toLocaleString()}</p>
          </div>

          <div className="flex justify-around items-center mb-6">
            <div className="text-center">
              <img src={matchData.homeTeam.crest} alt={matchData.homeTeam.name} className="w-24 h-24 mx-auto mb-2" />
              <h1 className="text-3xl font-bold">{matchData.homeTeam.name}</h1>
            </div>
            <div className="text-5xl font-extrabold">VS</div>
            <div className="text-center">
              <img src={matchData.awayTeam.crest} alt={matchData.awayTeam.name} className="w-24 h-24 mx-auto mb-2" />
              <h1 className="text-3xl font-bold">{matchData.awayTeam.name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <span className="font-semibold">Status:</span>
              {' '}
              {marketStatus ? <span className="badge badge-success">Resolved</span> : isMatchStarted ? <span className="badge badge-warning">Closed</span> : <span className="badge badge-info">Open</span>}
            </div>
            <div>
              <span className="font-semibold">Match Starts:</span>
              {' '}
              {matchDate.toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Market Creator:</span>
              {' '}
              <a href={`https://blockscout-passet-hub.parity-testnet.parity.io/address/${creator}`} target="_blank" rel="noopener noreferrer" className="link link-hover">{shortenAddress(creator)}</a>
            </div>
            <div>
              <span className="font-semibold">Entry Fee:</span>
              {' '}
              {formatEther(entryFee)}
              {' '}
              PAS
            </div>
            <div>
              <span className="font-semibold">Pool Size:</span>
              {' '}
              {poolSize.toFixed(4)}
              {' '}
              PAS
            </div>
            <div>
              <span className="font-semibold">Participants:</span>
              {' '}
              {participantsCount?.toString() ?? '0'}
            </div>
            {!!marketStatus && (
              <div>
                <span className="font-semibold">Winning Team:</span>
                {' '}
                {getTeamName(Number(winningTeam))}
              </div>
            )}
          </div>

          {!marketStatus && !isMatchStarted && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Your Prediction</h2>
              <div className="join">
                <button className={`btn join-item ${selectedTeam === 0 ? 'btn-active' : ''}`} onClick={() => setSelectedTeam(0)}>
                  {matchData.homeTeam.name}
                  {' '}
                  Wins
                </button>
                <button className={`btn join-item ${selectedTeam === 2 ? 'btn-active' : ''}`} onClick={() => setSelectedTeam(2)}>Draw</button>
                <button className={`btn join-item ${selectedTeam === 1 ? 'btn-active' : ''}`} onClick={() => setSelectedTeam(1)}>
                  {matchData.awayTeam.name}
                  {' '}
                  Wins
                </button>
              </div>
              {isUserParticipant && <p className="text-success mt-2">You have already joined this market.</p>}
            </div>
          )}

          <div className="card-actions justify-end">
            {renderButtons()}
          </div>

          {(isWritePending || isTxConfirming) && (
            <div className="mt-4 text-info flex items-center gap-2">
              <span className="loading loading-spinner loading-sm" />
              <span>{isTxConfirming ? 'Confirming transaction...' : 'Waiting for wallet confirmation...'}</span>
            </div>
          )}
          {actionStatus && !isWritePending && !isTxConfirming && (
            <div className={`mt-4 ${isTxConfirmed ? 'text-success' : 'text-error'}`}>{actionStatus}</div>
          )}
        </div>
      </div>
    </div>
  )
}
