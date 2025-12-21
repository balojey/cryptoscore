// Stub implementation for Web2 migration
// This file provides placeholder exports for wagmi-related functionality
// All Solana dependencies have been removed

import type { Chain, PublicClient } from 'viem'

// Create a placeholder chain object
export const passetHub: Chain = {
  id: 900,
  name: 'Placeholder Network',
  nativeCurrency: {
    name: 'Placeholder Token',
    symbol: 'PLH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://placeholder-rpc.com'] },
    public: { http: ['https://placeholder-rpc.com'] },
  },
  blockExplorers: {
    default: { name: 'Placeholder Explorer', url: 'https://placeholder-explorer.com' },
  },
}

// Export a placeholder config object
export const config: any = {
  chains: [passetHub],
  connectors: [],
  storage: null,
  state: {},
}

// Placeholder getPublicClient function
export function getPublicClient(_config: any): PublicClient | null {
  return null
}
