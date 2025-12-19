/**
 * Example component demonstrating fee estimation usage
 * This shows how to integrate fee estimation into transaction flows
 */

import { useState } from 'react'
import { useMarketActions } from '../../hooks/useMarketActions'
import { FeeEstimateDisplay } from '../FeeEstimateDisplay'

export function FeeEstimationExample() {
  const { createMarket, estimatedFee, isLoading } = useMarketActions()
  const [showFeeDetails, setShowFeeDetails] = useState(false)

  const handleCreateMarket = async () => {
    // Fee estimation happens automatically inside useMarketActions
    // The estimatedFee will be updated before the transaction is sent
    const result = await createMarket({
      matchId: 'example-match-123',
      entryFee: 1000000, // 0.001 SOL in lamports
      kickoffTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      endTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
      isPublic: true,
    })

    if (result) {
      console.log('Market created with transaction:', result)
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="card-title">Fee Estimation Example</h2>

      <div className="space-y-2">
        <p style={{ color: 'var(--text-secondary)' }}>
          This example demonstrates automatic fee estimation before transactions.
        </p>

        {/* Display fee estimate */}
        {estimatedFee && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
            <FeeEstimateDisplay
              feeEstimate={estimatedFee}
              isEstimating={isLoading}
              showDetails={showFeeDetails}
            />

            <button
              onClick={() => setShowFeeDetails(!showFeeDetails)}
              className="btn-secondary btn-sm mt-2"
            >
              {showFeeDetails ? 'Hide' : 'Show'}
              {' '}
              Details
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleCreateMarket}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? 'Creating Market...' : 'Create Example Market'}
      </button>

      <div className="text-xs space-y-1" style={{ color: 'var(--text-tertiary)' }}>
        <p>• Fee estimation happens automatically before each transaction</p>
        <p>• Estimates are updated when network conditions change</p>
        <p>• Failed estimations are handled gracefully</p>
        <p>• Transactions proceed even if estimation fails</p>
      </div>
    </div>
  )
}
