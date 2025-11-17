import { useEffect, useState } from 'react'
import { parseEther, parseEventLogs } from 'viem'
import { useAccount, useReadContract, useTransactionReceipt, useWriteContract } from 'wagmi'
import { Link } from 'react-router-dom'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI } from '../config/contracts'
import { MarqueeText } from './MarqueeText'
import { MarketProps } from '../types'

export function Market({ match, userHasMarket, marketAddress, refetchMarkets }: MarketProps) {
  const { address: userAddress } = useAccount()
  const [isCreating, setIsCreating] = useState(false)
  const [newlyCreatedMarket, setNewlyCreatedMarket] = useState<{ matchId: number, address: `0x${string}` } | null>(null)
  const [entryFee, setEntryFee] = useState('100')
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { data: txHash, writeContract, isPending: isCreateMarketLoading, error: writeContractError } = useWriteContract()
  const { data: receipt, isLoading: isTxLoading, isSuccess: isTxSuccess } = useTransactionReceipt({
    hash: txHash,
  })

  // When a market is created, parse the logs to find the new market address
  useEffect(() => {
    if (isTxSuccess && receipt) {
      const logs = parseEventLogs({
        abi: CryptoScoreFactoryABI,
        logs: receipt.logs,
        eventName: 'MarketCreated',
      }) as any[]

      const marketLog = logs.find((log: any) => log.args?.matchId === BigInt(match.id) && log.args?.creator === userAddress)

      if (marketLog?.args?.marketAddress) {
        setNewlyCreatedMarket({ matchId: match.id, address: marketLog.args.marketAddress as `0x${string}` })
      }
      // Refetch markets to update the parent state
      refetchMarkets()
      setIsCreating(false)
    }
  }, [isTxSuccess, receipt, refetchMarkets, match.id, userAddress])

  // Fallback: If userHasMarket is true but address is missing, fetch it directly
  const { data: fetchedMarkets } = useReadContract({
    address: CRYPTO_SCORE_FACTORY_ADDRESS,
    abi: CryptoScoreFactoryABI,
    functionName: 'getMarkets',
    args: [match.id],
    query: {
      enabled: userHasMarket && !marketAddress,
    },
  })

  const getEffectiveMarketAddress = () => {
    // Priority 1: Newly created market in this component instance
    if (newlyCreatedMarket?.matchId === match.id) {
      return newlyCreatedMarket.address
    }
    // Priority 2: Address passed via props
    if (marketAddress) {
      return marketAddress
    }
    // Priority 3: Fallback fetch for existing markets
    if (Array.isArray(fetchedMarkets) && fetchedMarkets.length > 0) {
      return fetchedMarkets[0] // Assuming the first market is the relevant one
    }
    return undefined
  }

  const effectiveMarketAddress = getEffectiveMarketAddress()
  const hasMarket = userHasMarket || !!effectiveMarketAddress

  const handleCreateMarket = () => {
    setError(null)
    if (Number(entryFee) <= 0) {
      setError('Entry fee must be greater than 0.')
      return
    }

    try {
      const entryFeeWei = parseEther(entryFee)
      const startTime = Math.floor(new Date(match.utcDate).getTime() / 1000)

      writeContract({
        address: CRYPTO_SCORE_FACTORY_ADDRESS,
        abi: CryptoScoreFactoryABI,
        functionName: 'createMarket',
        args: [match.id, entryFeeWei, isPublic, startTime],
      })
    }
    catch (e) {
      setError('Invalid entry fee value.')
      console.error(e)
    }
  }

  const isLoading = isCreateMarketLoading || isTxLoading

  const TeamDisplay = ({ team }: { team: { name: string, crest: string } }) => (
    <div className="flex flex-col items-center gap-2 w-2/5 text-center">
      <img src={'https://corsproxy.io/?' + team.crest} alt={team.name} className="w-12 h-12 object-contain" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/50' }} />
      <MarqueeText text={team.name} threshold={10} className="font-sans font-bold text-base text-[#1E293B]" />
    </div>
  )

  return (
    <div className="bg-white rounded-[16px] shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col p-5 border border-slate-100">
      {/* Match Info */}
      <div className="flex-grow">
        <div className="flex items-start justify-between gap-2">
          <TeamDisplay team={match.homeTeam} />
          <div className="flex flex-col items-center pt-4">
            <span className="font-sans text-xs font-bold text-slate-400">VS</span>
            <span className="font-sans text-xs text-slate-400 mt-2">{new Date(match.utcDate).toLocaleDateString()}</span>
            <span className="font-sans text-xs text-slate-400">{new Date(match.utcDate).toLocaleTimeString()}</span>
          </div>
          <TeamDisplay team={match.awayTeam} />
        </div>
        <p className="text-center font-sans text-xs text-slate-400 mt-2 truncate">{match.competition.name}</p>
      </div>

      {/* Divider */}
      <hr className="my-4 border-slate-100" />

      {/* Actions & Form */}
      <div className="min-h-[140px] flex flex-col justify-center">
        {hasMarket && (
          <div className="text-center mb-4">
            <p className="font-sans text-sm text-slate-600">You already have similar market(s).</p>
            <Link to="/my-markets" className="text-sm text-[#0A84FF] hover:underline">
              View your markets
            </Link>
          </div>
        )}

        {!isCreating
          ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="inline-flex items-center justify-center gap-2 h-10 px-6 bg-[#0A84FF] text-white rounded-[12px] font-sans text-sm font-bold uppercase tracking-wider transition-all hover:bg-blue-600 active:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                {hasMarket ? 'Create Another' : 'Create Market'}
              </button>
            </div>
            )
          : (
            <div className="space-y-4 animate-fade-in">
              {/* Entry Fee */}
              <div>
                <label htmlFor={`entryFee-${match.id}`} className="font-sans text-xs font-medium text-slate-600">Entry Fee (PAS)</label>
                <input
                  id={`entryFee-${match.id}`}
                  type="number"
                  value={entryFee}
                  onChange={e => setEntryFee(e.target.value)}
                  placeholder="e.g., 100"
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-[12px] text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
                />
              </div>
              {/* Public Toggle */}
              <div className="flex items-center gap-2">
                <input
                  id={`isPublic-${match.id}`}
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#0A84FF] focus:ring-[#0A84FF]"
                />
                <label htmlFor={`isPublic-${match.id}`} className="font-sans text-sm text-slate-700">Public Market</label>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button onClick={handleCreateMarket} disabled={isLoading} className="flex-1 inline-flex items-center justify-center gap-2 h-10 px-4 bg-[#0BC95A] text-white rounded-[12px] font-sans text-sm font-bold uppercase tracking-wider transition-all hover:bg-green-600 disabled:bg-slate-300">
                  {isLoading && <span className="icon-[mdi--loading] animate-spin" />}
                  <span>{isLoading ? 'Creating...' : 'Confirm'}</span>
                </button>
                <button onClick={() => setIsCreating(false)} className="h-10 px-4 rounded-[12px] font-sans text-sm font-medium text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
              </div>
              {error && <p className="text-xs text-center text-[#DC2626]">{error}</p>}
              {writeContractError && <p className="text-xs text-center text-[#DC2626]">{(writeContractError as any).shortMessage || 'Transaction failed.'}</p>}
            </div>
            )}
      </div>
    </div>
  )
}
