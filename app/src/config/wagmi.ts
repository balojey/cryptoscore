// Compatibility layer for Solana migration
// This file provides exports that match the old Polkadot wagmi structure
// Components using this will need to be migrated to use Solana wallet adapter

import type { Chain, PublicClient } from 'viem'
import { connection, currentNetwork } from './solana'

// Create a mock chain object that satisfies Viem's Chain type
export const passetHub: Chain = {
  id: 900, // Arbitrary ID for Solana devnet
  name: currentNetwork.name,
  nativeCurrency: currentNetwork.nativeCurrency,
  rpcUrls: {
    default: { http: [connection.rpcEndpoint] },
    public: { http: [connection.rpcEndpoint] },
  },
  blockExplorers: {
    default: { name: 'Solana Explorer', url: currentNetwork.explorer },
  },
}

// Export a config object for compatibility
// This is a mock config that satisfies the type requirements
export const config: any = {
  connection,
  network: currentNetwork,
  chains: [passetHub],
  connectors: [],
  storage: null,
  state: {},
}

// Mock getPublicClient for compatibility during migration
// This returns null to indicate Solana doesn't use Viem's public client
export function getPublicClient(_config: any): PublicClient | null {
  return null
}
