import { USDC_ASSET } from '../utils/usdc'

// Contract address for Passet Hub Testnet
export const MESSAGE_BOARD_ADDRESS = '0xaB7B4c595d3cE8C85e16DA86630f2fc223B05057'
export const CRYPTO_SCORE_FACTORY_ADDRESS = import.meta.env.VITE_CRYPTO_SCORE_FACTORY_ADDRESS
export const CRYPTO_SCORE_DASHBOARD_ADDRESS = import.meta.env.VITE_CRYPTO_SCORE_DASHBOARD_ADDRESS

// USDC Asset configuration for Polkadot Asset Hub
export const USDC_CONFIG = {
  assetId: USDC_ASSET.id,
  decimals: USDC_ASSET.decimals,
  symbol: USDC_ASSET.symbol,
  name: USDC_ASSET.name,
} as const

export { abi as CryptoScoreDashboardABI } from '../../abi/CryptoScoreDashboard.json'
// Export ABI
export { abi as CryptoScoreFactoryABI } from '../../abi/CryptoScoreFactory.json'
export { abi as CryptoScoreMarketABI } from '../../abi/CryptoScoreMarket.json'
