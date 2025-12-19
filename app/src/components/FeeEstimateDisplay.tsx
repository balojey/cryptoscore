import type { FeeEstimate } from '../lib/solana/transaction-builder'
import { AlertCircle, Info } from 'lucide-react'
import { SolanaUtils } from '../lib/solana/utils'

interface FeeEstimateDisplayProps {
  feeEstimate: FeeEstimate | null
  isEstimating?: boolean
  showDetails?: boolean
  className?: string
}

/**
 * Component to display transaction fee estimates
 * Shows estimated fee in SOL with success/error states
 */
export function FeeEstimateDisplay({
  feeEstimate,
  isEstimating = false,
  showDetails = false,
  className = '',
}: FeeEstimateDisplayProps) {
  if (isEstimating) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-secondary)' }}>Estimating fee...</span>
      </div>
    )
  }

  if (!feeEstimate) {
    return null
  }

  if (!feeEstimate.success) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <AlertCircle size={16} style={{ color: 'var(--accent-amber)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          {feeEstimate.error || 'Fee estimation unavailable'}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      <Info size={16} style={{ color: 'var(--accent-cyan)' }} />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--text-secondary)' }}>Estimated fee:</span>
          <span style={{ color: 'var(--text-primary)' }} className="font-mono font-semibold">
            {SolanaUtils.formatFee(feeEstimate.fee)}
          </span>
        </div>
        {showDetails && (
          <span style={{ color: 'var(--text-tertiary)' }} className="text-xs">
            {feeEstimate.fee.toLocaleString()}
            {' '}
            lamports
          </span>
        )}
      </div>
    </div>
  )
}
