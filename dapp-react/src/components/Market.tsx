import { useWriteContract, useTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { CRYPTO_SCORE_FACTORY_ADDRESS, CryptoScoreFactoryABI } from '../config/contracts'
import type { Match } from './Markets'

interface MarketProps {
  match: Match
  userHasMarket: boolean
  refetchMarkets: () => void
}

export function Market({ match, userHasMarket, refetchMarkets }: MarketProps) {
  // Hook for writing to the createMarket function
  const { data: txHash, writeContract, isPending: isCreateMarketLoading } = useWriteContract()

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
    // Hardcoded values for entry fee and public status
    const entryFee = parseEther('0.01') // 0.01 ETH
    const isPublic = true
    // Convert match date to Unix timestamp in seconds
    const startTime = Math.floor(new Date(match.utcDate).getTime() / 1000)

    writeContract({
      address: CRYPTO_SCORE_FACTORY_ADDRESS,
      abi: CryptoScoreFactoryABI,
      functionName: 'createMarket',
      args: [match.id, entryFee, isPublic, startTime],
    })
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
          <button onClick={handleCreateMarket} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Market'}
          </button>
          )}
      {isTxSuccess && <p>Market created successfully!</p>}
    </div>
  )
}