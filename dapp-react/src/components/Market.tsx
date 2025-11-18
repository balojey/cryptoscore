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
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center p-2"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <img 
          src={'https://corsproxy.io/?' + team.crest} 
          alt={team.name} 
          className="w-full h-full object-contain" 
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/50' }} 
        />
      </div>
      <div style={{ color: 'var(--text-primary)' }}>
        <MarqueeText text={team.name} threshold={10} className="font-sans font-bold text-sm" />
      </div>
    </div>
  )

  return (
    <div className="card flex flex-col">
      {/* Match Info */}
      <div className="flex-grow">
        <div className="flex items-start justify-between gap-2">
          <TeamDisplay team={match.homeTeam} />
          <div className="flex flex-col items-center pt-4">
            <span className="font-sans text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>VS</span>
            <span className="font-sans text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(match.utcDate).toLocaleDateString()}
            </span>
            <span className="font-sans text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {new Date(match.utcDate).toLocaleTimeString()}
            </span>
          </div>
          <TeamDisplay team={match.awayTeam} />
        </div>
        <p className="text-center font-sans text-xs mt-2 truncate" style={{ color: 'var(--text-tertiary)' }}>
          {match.competition.name}
        </p>
      </div>

      {/* Divider */}
      <hr className="my-4" style={{ borderColor: 'var(--border-default)' }} />

      {/* Actions & Form */}
      <div className="min-h-[140px] flex flex-col justify-center">
        {hasMarket && (
          <div className="text-center mb-4">
            <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
              You already have a market for this match.
            </p>
            <Link to="/my-markets" className="text-sm hover:underline" style={{ color: 'var(--accent-cyan)' }}>
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
                className="btn-primary"
              >
                <span className="icon-[mdi--plus-circle-outline] w-4 h-4" />
                {hasMarket ? 'Create Another' : 'Create Market'}
              </button>
            </div>
            )
          : (
            <div className="space-y-4 animate-fade-in">
              {/* Entry Fee */}
              <div>
                <label htmlFor={`entryFee-${match.id}`} className="font-sans text-xs font-medium mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                  Entry Fee (PAS)
                </label>
                <input
                  id={`entryFee-${match.id}`}
                  type="number"
                  value={entryFee}
                  onChange={e => setEntryFee(e.target.value)}
                  placeholder="e.g., 100"
                  className="block w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              {/* Public Toggle */}
              <div className="flex items-center gap-2">
                <input
                  id={`isPublic-${match.id}`}
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded"
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                <label htmlFor={`isPublic-${match.id}`} className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Public Market
                </label>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCreateMarket} 
                  disabled={isLoading} 
                  className="flex-1 btn-success"
                >
                  {isLoading && <span className="icon-[mdi--loading] animate-spin" />}
                  <span>{isLoading ? 'Creating...' : 'Confirm'}</span>
                </button>
                <button 
                  onClick={() => setIsCreating(false)} 
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
              {error && (
                <p className="text-xs text-center" style={{ color: 'var(--error)' }}>
                  {error}
                </p>
              )}
              {writeContractError && (
                <p className="text-xs text-center" style={{ color: 'var(--error)' }}>
                  {(writeContractError as any).shortMessage || 'Transaction failed.'}
                </p>
              )}
            </div>
            )}
      </div>
    </div>
  )
}
