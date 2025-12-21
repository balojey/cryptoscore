import type { MarketProps } from '../../types'
import { useUnifiedWallet } from '../../contexts/UnifiedWalletContext'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useSupabaseMarketActions } from '../../hooks/useSupabaseMarketActions'
import { MarqueeText } from '../MarqueeText'
import { CompactWinningsDisplay } from '../WinningsDisplay'
import { useWinnings } from '../../hooks/useWinnings'
import { useSupabaseMarketData } from '../../hooks/useSupabaseMarketData'

export function Market({ match, userHasMarket, marketAddress, refetchMarkets }: MarketProps) {
  const { publicKey: userAddress } = useUnifiedWallet()
  const [isCreating, setIsCreating] = useState(false)
  const [newlyCreatedMarket, setNewlyCreatedMarket] = useState<{ matchId: number, address: string } | null>(null)
  const [entryFee, setEntryFee] = useState('0.1') // Default to 0.1 SOL
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transactionStatus, setTransactionStatus] = useState<{
    type: 'info' | 'success' | 'error'
    message: string
    signature?: string
  } | null>(null)

  const { createMarket, isLoading: isCreateMarketLoading } = useSupabaseMarketActions()

  // Handle transaction status changes
  useEffect(() => {
    if (transactionStatus?.type === 'success') {
      // Close dialog immediately on success
      const timer = setTimeout(() => {
        setIsCreating(false)
        setTransactionStatus(null)
        refetchMarkets()
      }, 2000) // Show success message for 2 seconds
      return () => clearTimeout(timer)
    }
    else if (transactionStatus?.type === 'error') {
      // Clear error after 5 seconds but keep dialog open
      const timer = setTimeout(() => {
        setTransactionStatus(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [transactionStatus, refetchMarkets])

  const getEffectiveMarketAddress = () => {
    // Priority 1: Newly created market in this component instance
    if (newlyCreatedMarket?.matchId === match.id) {
      return newlyCreatedMarket.address
    }
    // Priority 2: Address passed via props
    if (marketAddress) {
      return marketAddress
    }
    return undefined
  }

  const effectiveMarketAddress = getEffectiveMarketAddress()
  const hasMarket = userHasMarket || !!effectiveMarketAddress

  const handleCreateMarket = async () => {
    setError(null)
    setTransactionStatus(null)

    if (Number(entryFee) <= 0) {
      setError('Entry fee must be greater than 0.')
      return
    }

    if (!userAddress) {
      setError('Please connect your wallet first.')
      return
    }

    try {
      setTransactionStatus({ type: 'info', message: 'Initializing market...' })

      const kickoffTime = Math.floor(new Date(match.utcDate).getTime() / 1000)
      const endTime = kickoffTime + (2 * 60 * 60) // 2 hours after kickoff

      const marketId = await createMarket({
        matchId: match.id.toString(),
        title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
        description: `Prediction market for ${match.competition.name} match`,
        entryFee: Number(entryFee),
        endTime,
        isPublic,
      })
      console.log('Market ID: ', marketId)

      if (marketId) {
        setTransactionStatus({
          type: 'success',
          message: 'Market created successfully!',
          signature: marketId,
        })

        // Set the newly created market
        setNewlyCreatedMarket({ matchId: match.id, address: marketId })
      }
      else {
        throw new Error('Market creation failed - no market ID returned')
      }
    }
    catch (e: any) {
      console.error('Failed to create market:', e)
      const errorMessage = e.message || 'Failed to create market.'
      setError(errorMessage)
      setTransactionStatus({
        type: 'error',
        message: errorMessage,
      })
    }
  }

  const isLoading = isCreateMarketLoading

  const TeamDisplay = ({ team }: { team: { name: string, crest: string } }) => (
    <div className="flex flex-col items-center gap-2 w-2/5 text-center min-w-0">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center p-2"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <img
          src={`https://corsproxy.io/?${team.crest}`}
          alt={team.name}
          className="w-full h-full object-contain"
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/50' }}
        />
      </div>
      <div className="w-full min-w-0" style={{ color: 'var(--text-primary)' }}>
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

      {/* Winnings Preview */}
      <WinningsPreview marketAddress={effectiveMarketAddress} />

      {/* Actions & Form */}
      <div className="min-h-[120px] flex flex-col justify-center">
        {hasMarket && (
          <div className="text-center mb-4">
            <p className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
              You already have a market for this match.
            </p>
            <Link to="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--accent-cyan)' }}>
              View your markets
            </Link>
          </div>
        )}

        <div className="text-center">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button
                variant="default"
                className="gap-2"
              >
                <span className="icon-[mdi--plus-circle-outline] w-4 h-4" />
                {hasMarket ? 'Create Another' : 'Create Market'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Prediction Market</DialogTitle>
                <DialogDescription>
                  Set up a new prediction market for
                  {' '}
                  {match.homeTeam.name}
                  {' '}
                  vs
                  {' '}
                  {match.awayTeam.name}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Entry Fee */}
                <div>
                  <label htmlFor={`entryFee-${match.id}`} className="font-sans text-xs font-medium mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                    Entry Fee (Tokens)
                  </label>
                  <Input
                    id={`entryFee-${match.id}`}
                    type="number"
                    step="0.001"
                    min="0.001"
                    max="100"
                    value={entryFee}
                    onChange={e => setEntryFee(e.target.value)}
                    placeholder="e.g., 0.1"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Minimum: 0.001 tokens
                    </p>
                    {Number(entryFee) > 0 && (
                      <p className="text-xs font-mono" style={{ color: 'var(--accent-cyan)' }}>
                        {Number(entryFee).toFixed(3)} tokens
                      </p>
                    )}
                  </div>
                </div>

                {/* Public Toggle */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`isPublic-${match.id}`}
                    checked={isPublic}
                    onCheckedChange={checked => setIsPublic(checked === true)}
                  />
                  <label htmlFor={`isPublic-${match.id}`} className="font-sans text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    Public Market
                  </label>
                </div>

                {/* Status Messages */}
                {error && (
                  <div
                    className="text-xs text-center p-3 rounded-lg"
                    style={{
                      background: 'rgba(255, 51, 102, 0.1)',
                      border: '1px solid var(--accent-red)',
                      color: 'var(--accent-red)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="icon-[mdi--alert-circle-outline] w-4 h-4" />
                      <p>{error}</p>
                    </div>
                  </div>
                )}
                {transactionStatus && (
                  <div
                    className="text-xs text-center p-3 rounded-lg space-y-2"
                    style={{
                      background: transactionStatus.type === 'success'
                        ? 'rgba(0, 255, 136, 0.1)'
                        : transactionStatus.type === 'error'
                          ? 'rgba(255, 51, 102, 0.1)'
                          : 'rgba(0, 212, 255, 0.1)',
                      border: `1px solid ${transactionStatus.type === 'success'
                        ? 'var(--accent-green)'
                        : transactionStatus.type === 'error'
                          ? 'var(--accent-red)'
                          : 'var(--accent-cyan)'}`,
                      color: transactionStatus.type === 'success'
                        ? 'var(--accent-green)'
                        : transactionStatus.type === 'error'
                          ? 'var(--accent-red)'
                          : 'var(--accent-cyan)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {transactionStatus.type === 'info' && <span className="icon-[mdi--loading] animate-spin w-4 h-4" />}
                      {transactionStatus.type === 'success' && <span className="icon-[mdi--check-circle-outline] w-4 h-4" />}
                      {transactionStatus.type === 'error' && <span className="icon-[mdi--alert-circle-outline] w-4 h-4" />}
                      <p>{transactionStatus.message}</p>
                    </div>
                    {transactionStatus.signature && (
                      <div className="pt-2 border-t" style={{ borderColor: 'currentColor', opacity: 0.3 }}>
                        <div className="text-xs flex items-center justify-center gap-1" style={{ color: 'var(--accent-cyan)' }}>
                          <span className="icon-[mdi--check-circle-outline] w-3 h-3" />
                          Market Created Successfully
                        </div>
                        <div
                          className="mt-1 p-2 rounded font-mono text-xs break-all"
                          style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          {transactionStatus.signature}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={handleCreateMarket}
                  disabled={isLoading || !!transactionStatus}
                  className="gap-2"
                >
                  {isLoading && <span className="icon-[mdi--loading] animate-spin w-4 h-4" />}
                  {transactionStatus?.type === 'success' && <span className="icon-[mdi--check-circle-outline] w-4 h-4" />}
                  <span>
                    {isLoading
                      ? 'Creating Market...'
                      : transactionStatus?.type === 'success'
                        ? 'Market Created!'
                        : 'Create Market'}
                  </span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact winnings preview component for market cards
 * Optimized for performance in list rendering
 */
function WinningsPreview({ marketAddress }: { marketAddress?: string }) {
  const { publicKey: userAddress } = useUnifiedWallet()
  
  // Only fetch market data if we have a market address
  const { data: marketData, isLoading: isLoadingMarket } = useSupabaseMarketData(marketAddress)
  
  // Only fetch winnings if we have market data
  const { winnings, isLoading: isLoadingWinnings } = useWinnings(
    marketAddress, 
    userAddress?.toString()
  )

  // Don't render anything if no market address (market not created yet)
  if (!marketAddress) {
    return (
      <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Create a market to see potential winnings
          </p>
        </div>
      </div>
    )
  }

  // Show loading state
  if (isLoadingMarket || isLoadingWinnings) {
    return (
      <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-4 h-4 bg-[var(--text-tertiary)] rounded opacity-20" />
          <div className="flex-1">
            <div className="h-3 bg-[var(--text-tertiary)] rounded w-2/3 opacity-20" />
            <div className="h-2 bg-[var(--text-tertiary)] rounded w-1/2 mt-1 opacity-20" />
          </div>
        </div>
      </div>
    )
  }

  // Show error state or no data
  if (!marketData || !winnings) {
    return (
      <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
        <div className="text-center">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Winnings data unavailable
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
      <CompactWinningsDisplay
        marketData={marketData}
        userAddress={userAddress?.toString()}
        winnings={winnings}
        className="text-xs"
      />
    </div>
  )
}
