import { clusterApiUrl, Connection } from '@solana/web3.js'
import type { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

// Solana network configuration
export const SOLANA_NETWORK: WalletAdapterNetwork = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet') as WalletAdapterNetwork

// RPC endpoint configuration
export const SOLANA_RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK)

// Create connection instance
export const connection = new Connection(SOLANA_RPC_URL, 'confirmed')

// Network display configuration
export const networkConfig = {
  devnet: {
    name: 'Solana Devnet',
    explorer: 'https://explorer.solana.com',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
  },
  testnet: {
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
