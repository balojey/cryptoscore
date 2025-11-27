import { PublicKey } from '@solana/web3.js'

// Program IDs for Solana programs
export const FACTORY_PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_FACTORY_PROGRAM_ID || '11111111111111111111111111111111',
)

export const MARKET_PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_MARKET_PROGRAM_ID || '11111111111111111111111111111111',
)

export const DASHBOARD_PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_DASHBOARD_PROGRAM_ID || '11111111111111111111111111111111',
)

// Program IDL imports will be added here once programs are built
// export { IDL as FactoryIDL } from '../idl/factory'
// export { IDL as MarketIDL } from '../idl/market'
// export { IDL as DashboardIDL } from '../idl/dashboard'
