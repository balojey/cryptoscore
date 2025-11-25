import type { Chain } from 'wagmi/chains'
import { createConfig, createStorage, http } from 'wagmi'
import { USDC_ASSET } from '../utils/usdc'

export const passetHub = {
  id: 420420422,
  name: 'Paseo PassetHub',
  nativeCurrency: {
    name: 'Paseo Token',
    symbol: 'PAS',
    decimals: 18,
  },
  blockExplorers: {
    default: {
      name: 'Blockscout',
      url: 'https://blockscout-passet-hub.parity-testnet.parity.io/',
    },
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-passet-hub-eth-rpc.polkadot.io'],
    },
  },
  testnet: true,
  // USDC Asset configuration for Polkadot Asset Hub
  assets: {
    usdc: {
      id: USDC_ASSET.id,
      symbol: USDC_ASSET.symbol,
      name: USDC_ASSET.name,
      decimals: USDC_ASSET.decimals,
    },
  },
} as const satisfies Chain & {
  assets: {
    usdc: {
      id: number
      symbol: string
      name: string
      decimals: number
    }
  }
}

export const config = createConfig({
  chains: [passetHub],
  storage: createStorage({ storage: localStorage, key: 'vite-react' }),
  transports: {
    [passetHub.id]: http(),
  },
})
