import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('CryptoScoreFactoryModule', (m) => {
  const CryptoScoreFactory = m.contract('CryptoScoreFactory')

  return { CryptoScoreFactory }
})
