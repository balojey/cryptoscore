// Solana Program Configuration
// This file will be auto-generated during deployment

export const PROGRAM_IDS = {
  factory: import.meta.env.VITE_FACTORY_PROGRAM_ID || '93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP',
  market: import.meta.env.VITE_MARKET_PROGRAM_ID || '94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ',
  dashboard: import.meta.env.VITE_DASHBOARD_PROGRAM_ID || '95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR',
} as const

// Export individual program IDs for compatibility
export const FACTORY_PROGRAM_ID = PROGRAM_IDS.factory
export const MARKET_PROGRAM_ID = PROGRAM_IDS.market
export const DASHBOARD_PROGRAM_ID = PROGRAM_IDS.dashboard

export const NETWORK = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as 'localnet' | 'devnet' | 'testnet' | 'mainnet-beta'

export const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

export { default as DashboardIDL } from '../idl/cryptoscore_dashboard.json'
// Program IDLs (will be populated after build and export)
export { default as FactoryIDL } from '../idl/cryptoscore_factory.json'
export { default as MarketIDL } from '../idl/cryptoscore_market.json'

// Network configurations
export const NETWORK_CONFIGS = {
  'localnet': {
    name: 'Localnet',
    rpcUrl: 'http://127.0.0.1:8899',
    explorerUrl: 'http://localhost:3000',
  },
  'devnet': {
    name: 'Devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
  },
  'testnet': {
    name: 'Testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
  },
  'mainnet-beta': {
    name: 'Mainnet',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
  },
} as const

export const getCurrentNetworkConfig = () => NETWORK_CONFIGS[NETWORK]

// Helper function to get explorer URL for transaction
export function getExplorerUrl(signature: string, cluster?: string) {
  const network = (cluster || NETWORK) as keyof typeof NETWORK_CONFIGS
  const baseUrl = NETWORK_CONFIGS[network].explorerUrl
  const clusterParam = network !== 'mainnet-beta' ? `?cluster=${network}` : ''
  return `${baseUrl}/tx/${signature}${clusterParam}`
}

// Helper function to get explorer URL for account
export function getAccountExplorerUrl(address: string, cluster?: string) {
  const network = (cluster || NETWORK) as keyof typeof NETWORK_CONFIGS
  const baseUrl = NETWORK_CONFIGS[network].explorerUrl
  const clusterParam = network !== 'mainnet-beta' ? `?cluster=${network}` : ''
  return `${baseUrl}/account/${address}${clusterParam}`
}
