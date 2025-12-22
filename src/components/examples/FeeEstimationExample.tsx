/**
 * Example component demonstrating fee estimation usage
 * This shows how to integrate fee estimation into transaction flows
 */

import { useState } from 'react'
import { useSupabaseMarketActions } from '../../hooks/useSupabaseMarketActions'
import { FeeEstimateDisplay } from '../FeeEstimateDisplay'

export function FeeEstimationExample() {
  const { createMarket, isLoading } = useSupabaseMarketActions()
  const [showFeeDetails, setShowFeeDetails] = useState(false)

  const handleCreateMarket = async () => {
    // Database operations don't require fee estimation
    const result = await createMarket({
      matchId: 'example-match-123',
      title: 'Example Match Market',
      description: 'This is an example prediction market for demonstration purposes',
      entryFee: 0.001, // 0.001 MNEE equivalent in decimal format
      endTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
      isPublic: true,
    })

    if (result) {
      console.log('Market created with ID:', result)
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="card-title">Fee Estimation Example</h2>

      <div className="space-y-2">
        <p style={{ color: 'var(--text-secondary)' }}>
          This example demonstrates automatic fee estimation before transactions.
        </p>

        {/* Note: Database operations don't require fee estimation */}
        <div className="p-4 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Database operations are instant and don't require blockchain fees.
            Future MNEE token integration will restore fee estimation.
          </p>
        </div>
      </div>

      <button
        onClick={handleCreateMarket}
        disabled={isLoading}
        className="btn-primary"
      >
        {isLoading ? 'Creating Market...' : 'Create Example Market'}
      </button>

      <div className="text-xs space-y-1" style={{ color: 'var(--text-tertiary)' }}>
        <p>• Database operations are instant and free</p>
        <p>• No blockchain fees required for market participation</p>
        <p>• Future MNEE token integration will restore transaction fees</p>
        <p>• All market data is stored in Supabase database</p>
      </div>
    </div>
  )
}
