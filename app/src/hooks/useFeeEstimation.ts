import type { PublicKey, Transaction } from '@solana/web3.js'
import type { FeeEstimate } from '../lib/solana/transaction-builder'
import { useCallback, useEffect, useState } from 'react'
import { SolanaUtils } from '../lib/solana/utils'
import { useSolanaConnection } from './useSolanaConnection'

export interface UseFeeEstimationOptions {
  enabled?: boolean
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

/**
 * Hook for estimating transaction fees
 * Provides real-time fee estimates with automatic refresh capability
 */
export function useFeeEstimation(options: UseFeeEstimationOptions = {}) {
  const { enabled = true, autoRefresh = false, refreshInterval = 30000 } = options
  const { connection, publicKey } = useSolanaConnection()

  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  /**
   * Estimate fee for a transaction
   */
  const estimateFee = useCallback(async (transaction: Transaction, feePayer?: PublicKey): Promise<FeeEstimate> => {
    if (!enabled) {
      return {
        fee: 0,
        feeInSol: 0,
        success: false,
        error: 'Fee estimation is disabled',
      }
    }

    const payer = feePayer || publicKey
    if (!payer) {
      return {
        fee: 0,
        feeInSol: 0,
        success: false,
        error: 'No fee payer available',
      }
    }

    setIsEstimating(true)

    try {
      const fee = await SolanaUtils.estimateTransactionFee(connection, transaction)

      if (fee === null) {
        const estimate: FeeEstimate = {
          fee: 0,
          feeInSol: 0,
          success: false,
          error: 'Unable to estimate fee - network conditions may have changed',
        }
        setFeeEstimate(estimate)
        return estimate
      }

      const estimate: FeeEstimate = {
        fee,
        feeInSol: fee / 1_000_000_000,
        success: true,
      }

      setFeeEstimate(estimate)
      setLastUpdated(new Date())
      return estimate
    }
    catch (error) {
      const estimate: FeeEstimate = {
        fee: 0,
        feeInSol: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Fee estimation failed',
      }
      setFeeEstimate(estimate)
      return estimate
    }
    finally {
      setIsEstimating(false)
    }
  }, [connection, publicKey, enabled])

  /**
   * Refresh the current fee estimate
   */
  const refreshEstimate = useCallback(async (transaction: Transaction, feePayer?: PublicKey) => {
    return estimateFee(transaction, feePayer)
  }, [estimateFee])

  /**
   * Clear the current fee estimate
   */
  const clearEstimate = useCallback(() => {
    setFeeEstimate(null)
    setLastUpdated(null)
  }, [])

  /**
   * Auto-refresh fee estimate at specified interval
   */
  useEffect(() => {
    if (!autoRefresh || !feeEstimate || !enabled) {
      return
    }

    const intervalId = setInterval(() => {
      // Note: Auto-refresh requires the transaction to be stored
      // This is a placeholder - actual implementation would need transaction context
      console.log('Auto-refresh triggered - transaction context needed')
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [autoRefresh, refreshInterval, feeEstimate, enabled])

  /**
   * Format fee for display
   */
  const formatFee = useCallback((includeSymbol = true) => {
    if (!feeEstimate || !feeEstimate.success) {
      return includeSymbol ? '-- SOL' : '--'
    }
    return SolanaUtils.formatFee(feeEstimate.fee, includeSymbol)
  }, [feeEstimate])

  return {
    feeEstimate,
    isEstimating,
    lastUpdated,
    estimateFee,
    refreshEstimate,
    clearEstimate,
    formatFee,
  }
}
