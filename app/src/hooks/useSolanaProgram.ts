/**
 * DEPRECATED: This hook uses Anchor framework which has been removed.
 *
 * For new code, use the Anchor-free utilities:
 * - lib/solana/transaction-builder.ts for building transactions
 * - lib/solana/instruction-encoder.ts for encoding instructions
 * - lib/solana/account-decoder.ts for decoding accounts
 * - hooks/useMarketData.ts for fetching market data
 * - hooks/useMarketActions.ts for market operations
 *
 * This hook is kept for backward compatibility with legacy code only.
 */

import { useConnection } from '@solana/wallet-adapter-react'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'

/**
 * @deprecated Use Anchor-free utilities instead
 * Hook for managing Solana program instances
 * Provides program instances for Factory, Market, and Dashboard programs
 */
export function useSolanaProgram() {
  const { connection } = useConnection()
  const wallet = useUnifiedWallet()

  // DEPRECATED: Anchor provider and program instances removed
  // This hook now returns null values for backward compatibility
  // Migrate to Anchor-free utilities for new code

  const provider = null
  const factoryProgram = null
  const marketProgram = null
  const dashboardProgram = null

  return {
    connection,
    wallet,
    provider,
    factoryProgram,
    marketProgram,
    dashboardProgram,
    isReady: false, // Always false since Anchor is removed
  }
}
