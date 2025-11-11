import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('CryptoScoreFullModule', (m) => {
  // Deploy a dummy market instance to register its code
  const dummyCreator = '0x0000000000000000000000000000000000000000'
  const dummyMatchId = 0
  const dummyEntryFee = 1n // just >0
  const dummyIsPublic = true
  const dummyStartTime = 1n

  const CryptoScoreMarket = m.contract('CryptoScoreMarket', [
    dummyCreator,
    dummyMatchId,
    dummyEntryFee,
    dummyIsPublic,
    dummyStartTime
  ])

  const CryptoScoreFactory = m.contract('CryptoScoreFactory')
  const MessageBoard = m.contract('MessageBoard')
  const CryptoScoreDashboard = m.contract('CryptoScoreDashboard', [CryptoScoreFactory])

  return { CryptoScoreMarket, CryptoScoreFactory, CryptoScoreDashboard, MessageBoard }
})
