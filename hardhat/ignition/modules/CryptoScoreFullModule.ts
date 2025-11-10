import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('CryptoScoreFullModule', (m) => {
  const CryptoScoreFactory = m.contract('CryptoScoreFactory')
  const MessageBoard = m.contract('MessageBoard')
  const CryptoScoreDashboard = m.contract('CryptoScoreDashboard', [CryptoScoreFactory, MessageBoard])

  return { CryptoScoreFactory, CryptoScoreDashboard, MessageBoard }
})
