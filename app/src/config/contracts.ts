// Compatibility layer for Solana migration
// This file provides exports that match the old Polkadot contract structure
// but uses Solana program IDs instead

import { DASHBOARD_PROGRAM_ID, FACTORY_PROGRAM_ID, MARKET_PROGRAM_ID } from './programs'

// Export program IDs as contract addresses for compatibility
// Using a mock Ethereum address format to satisfy type requirements during migration
export const CRYPTO_SCORE_FACTORY_ADDRESS = `0x${FACTORY_PROGRAM_ID.toString().slice(0, 40)}` as `0x${string}`
export const CRYPTO_SCORE_DASHBOARD_ADDRESS = `0x${DASHBOARD_PROGRAM_ID.toString().slice(0, 40)}` as `0x${string}`

// Placeholder ABIs for compatibility (will be replaced with IDLs)
// These are used by components that haven't been fully migrated yet
// Using 'any' to bypass TypeScript errors during migration
export const CryptoScoreFactoryABI = [] as any
export const CryptoScoreMarketABI = [] as any
export const CryptoScoreDashboardABI = [] as any

// Re-export program IDs for direct use
export { DASHBOARD_PROGRAM_ID, FACTORY_PROGRAM_ID, MARKET_PROGRAM_ID }
