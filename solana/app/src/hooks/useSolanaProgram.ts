import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useMemo } from 'react'
import { DashboardIDL, FactoryIDL, MarketIDL } from '../config/programs'

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

  // Create program instances with IDLs
  // All IDLs now have metadata.address, so we don't need to pass programId explicitly
  // This ensures the program IDs always match what's in the IDL (from declare_id! in Rust)
  // Note: We use 'as any' because the JSON IDL structure doesn't match Anchor's Idl type exactly
  const factoryProgram = useMemo(() => {
    if (!provider)
      return null
    
    try {
      return new Program(
        FactoryIDL as any,
        provider,
      ) as any
    }
    catch (error) {
      console.error('Error initializing Factory program:', error)
      return null
    }
  }, [provider])

  const marketProgram = useMemo(() => {
    if (!provider)
      return null
    
    try {
      return new Program(
        MarketIDL as any,
        provider,
      ) as any
    }
    catch (error) {
      console.error('Error initializing Market program:', error)
      return null
    }
  }, [provider])

  const dashboardProgram = useMemo(() => {
    if (!provider)
      return null
    
    try {
      return new Program(
        DashboardIDL as any,
        provider,
      ) as any
    }
    catch (error) {
      console.error('Error initializing Dashboard program:', error)
      return null
    }
  }, [provider])

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
