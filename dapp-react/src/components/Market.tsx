import type { Match } from '../types'
import { useState } from 'react'
import { parseEther } from 'viem'
import { useTransactionReceipt, useWriteContract } from 'wagmi'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI } from '../config/contracts'

interface MarketProps {
  match: Match
  userHasMarket: boolean
  refetchMarkets: () => void
}

export function Market({ match, userHasMarket, refetchMarkets }: MarketProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [entryFee, setEntryFee] = useState('100')
  const [isPublic, setIsPublic] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Hook for writing to the createMarket function
  const { data: txHash, writeContract, isPending: isCreateMarketLoading, error: writeContractError } = useWriteContract()

  // Hook to wait for the transaction to be mined
  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useTransactionReceipt({
    hash: txHash,
    query: {
      enabled: !!txHash,
    },
  })

  if (isTxSuccess) {
    refetchMarkets()
  }

  const handleCreateMarket = () => {
    setError(null)
    // Validate entry fee
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
      setError('Invalid entry fee')
      console.log(e)
    }
  }
  const handleViewMarket = () => {
    // Placeholder for viewing market details
    // This could open a modal or navigate to a new page
    alert(`Viewing market for match ${match.id}`)
  }

  const isLoading = isCreateMarketLoading || isTxLoading

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', margin: '16px 0' }}>
      <h3>
        {match.homeTeam.name}
        {' '}
        vs
        {' '}
        {match.awayTeam.name}
      </h3>
      <p>
        Date:
        {new Date(match.utcDate).toLocaleString()}
      </p>
      <p>
        Competition:
        {match.competition.name}
      </p>
      {userHasMarket
        ? (
            <button onClick={handleViewMarket}>
              View Market
            </button>
          )
        : (
            <>
              {!isCreating
                ? (
                    <button onClick={() => setIsCreating(true)}>
                      Create Market
                    </button>
                  )
                : (
                    <div style={{ marginTop: '10px' }}>
                      <h4>Set Market Details</h4>
                      <div style={{ marginBottom: '10px' }}>
                        <label htmlFor="entryFee">
                          Entry Fee (PAS)
                          {' '}
                        </label>
                        <input
                          id="entryFee"
                          type="number"
                          value={entryFee}
                          onChange={e => setEntryFee(e.target.value)}
                          placeholder="e.g., 100"
                          style={{ marginLeft: '5px' }}
                        />
                      </div>
                      <div style={{ marginBottom: '10px' }}>
                        <label>
                          <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={e => setIsPublic(e.target.checked)}
                          />
                          Public Market
                        </label>
                        <span style={{ fontSize: '12px', marginLeft: '10px', cursor: 'pointer' }} title="Public markets are visible to everyone; private markets are accessible only via link">
                          ℹ️
                        </span>
                      </div>
                      <button onClick={handleCreateMarket} disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Confirm & Create'}
                      </button>
                      <button onClick={() => setIsCreating(false)} style={{ marginLeft: '10px' }}>
                        Cancel
                      </button>
                      {error && <p style={{ color: 'red' }}>{error}</p>}
                      {writeContractError && <p style={{ color: 'red' }}>{writeContractError.message}</p>}
                    </div>
                  )}
            </>
          )}
      {isTxSuccess && <p>Market created successfully!</p>}
    </div>
  )
}
