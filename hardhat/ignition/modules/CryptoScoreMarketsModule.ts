import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('CryptoScoreMarketsModule', (m) => {
  const CryptoScoreMarkets = m.contract('CryptoScoreMarkets')

  return { CryptoScoreMarkets }
})
