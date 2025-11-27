import { AnchorProvider } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
// import { Program } from '@coral-xyz/anchor'
import { useMemo } from 'react'

/**
 * Hook for managing Solana program instances
 * Provides program instances for Factory, Market, and Dashboard programs
 */
export function useSolanaProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()

  // Create Anchor provider
  const provider = useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null
    }

    return new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet),
        signAllTransactions: wallet.signAllTransactions.bind(wallet),
      },
      { commitment: 'confirmed' },
    )
  }, [connection, wallet])

  // Get program IDs from environment
  const factoryProgramId = import.meta.env.VITE_FACTORY_PROGRAM_ID
  const marketProgramId = import.meta.env.VITE_MARKET_PROGRAM_ID
  const dashboardProgramId = import.meta.env.VITE_DASHBOARD_PROGRAM_ID

  // Create program instances (will be implemented after IDL generation)
  const factoryProgram = useMemo(() => {
    if (!provider || !factoryProgramId)
      return null
    // TODO: Initialize with IDL after program deployment
    // return new Program(FACTORY_IDL, factoryProgramId, provider)
    return null
  }, [provider, factoryProgramId])

  const marketProgram = useMemo(() => {
    if (!provider || !marketProgramId)
      return null
    // TODO: Initialize with IDL after program deployment
    // return new Program(MARKET_IDL, marketProgramId, provider)
    return null
  }, [provider, marketProgramId])

  const dashboardProgram = useMemo(() => {
    if (!provider || !dashboardProgramId)
      return null
    // TODO: Initialize with IDL after program deployment
    // return new Program(DASHBOARD_IDL, dashboardProgramId, provider)
    return null
  }, [provider, dashboardProgramId])

  return {
    connection,
    wallet,
    provider,
    factoryProgram,
    marketProgram,
    dashboardProgram,
    isReady: !!provider,
  }
}
