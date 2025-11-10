import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('CryptoScoreFullModule', (m) => {
  const CryptoScoreFactory = m.contract('CryptoScoreFactory')
  const CryptoScoreDashboard = m.contract('CryptoScoreDashboard', [CryptoScoreFactory])

  return { CryptoScoreFactory, CryptoScoreDashboard }
})
