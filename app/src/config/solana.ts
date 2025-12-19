import type { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl, Connection } from '@solana/web3.js'

// Solana network configuration
export const SOLANA_NETWORK: WalletAdapterNetwork = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as WalletAdapterNetwork

// Multiple RPC endpoints for fallback and load balancing
export const RPC_ENDPOINTS = {
  'devnet': [
    import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('devnet'),
    'https://api.devnet.solana.com',
    'https://devnet.helius-rpc.com/?api-key=demo', // Free tier
    'https://rpc.ankr.com/solana_devnet', // Free tier
  ],
  'testnet': [
    import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('testnet'),
    'https://api.testnet.solana.com',
  ],
  'mainnet-beta': [
    import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl('mainnet-beta'),
    'https://api.mainnet-beta.solana.com',
  ],
} as const

// Get current RPC endpoints for the network
export const getCurrentRPCEndpoints = () => RPC_ENDPOINTS[SOLANA_NETWORK]

// Primary RPC endpoint
export const SOLANA_RPC_URL = getCurrentRPCEndpoints()[0]

// Create connection instance with rate limiting configuration
export const connection = new Connection(SOLANA_RPC_URL, {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000, // 60 seconds
  disableRetryOnRateLimit: false, // Enable automatic retry on rate limit
  httpHeaders: {
    'Content-Type': 'application/json',
  },
})

// Connection pool for load balancing
let currentEndpointIndex = 0
export function getNextConnection(): Connection {
  const endpoints = getCurrentRPCEndpoints()
  currentEndpointIndex = (currentEndpointIndex + 1) % endpoints.length
  const endpoint = endpoints[currentEndpointIndex]

  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
    disableRetryOnRateLimit: false,
  })
}

// Get connection with automatic fallback
export async function getHealthyConnection(): Promise<Connection> {
  const endpoints = getCurrentRPCEndpoints()

  for (const endpoint of endpoints) {
    try {
      const testConnection = new Connection(endpoint, {
        commitment: 'confirmed',
        disableRetryOnRateLimit: false,
      })

      // Test connection health
      await testConnection.getLatestBlockhash('confirmed')
      return testConnection
    }
    catch (error) {
      console.warn(`RPC endpoint ${endpoint} failed health check:`, error)
      continue
    }
  }

  // If all fail, return the primary connection
  console.error('All RPC endpoints failed, using primary')
  return connection
}

// Network display configuration
export const networkConfig = {
  'devnet': {
    name: 'Solana Devnet',
    explorer: 'https://explorer.solana.com',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },
  'testnet': {
    name: 'Solana Testnet',
    explorer: 'https://explorer.solana.com',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },
  'mainnet-beta': {
    name: 'Solana Mainnet',
    explorer: 'https://explorer.solana.com',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },
} as const

export const currentNetwork = networkConfig[SOLANA_NETWORK]
