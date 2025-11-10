import type { CryptoScoreFactory, CryptoScoreMarket, CryptoScoreDashboard } from '../typechain-types'
import hre from 'hardhat'
import process from 'node:process'

async function main() {
  try {
    const [signer] = await hre.ethers.getSigners()

    // === 0. Set deployed addresses ===
    const factoryAddress = '0x1c1521cf734CD13B02e8150951c3bF2B438be780'
    const dashboardAddress = '0x0B1a87021ec75fBaE919b1e86b2B1335FFC8F4d3'

    // === 1. Attach to deployed contracts ===
    const Factory = await hre.ethers.getContractFactory('CryptoScoreFactory')
    const code = await hre.ethers.provider.getCode(factoryAddress)
    console.log(code)
    const factory = Factory.attach(factoryAddress) as CryptoScoreFactory
    console.log('CryptoScoreFactory attached at:', factoryAddress)

    const Dashboard = await hre.ethers.getContractFactory('CryptoScoreDashboard')
    const dashboardCode = await hre.ethers.provider.getCode(dashboardAddress)
    console.log(dashboardCode)
    const dashboard = Dashboard.attach(dashboardAddress) as CryptoScoreDashboard
    console.log('CryptoScoreDashboard attached at:', dashboardAddress)

    // === 2. Create a new market ===
    console.log('\n=== 2. Creating a new market ===')
    const entryFee = hre.ethers.parseEther('0.01') // 0.01 ETH
    const matchId = 12345
    const isPublic = false // Example: private market
    const startTime = Math.floor(Date.now() / 1000) + 3600 // starts in 1 hour

    const txCreate = await factory.createMarket(matchId, entryFee, isPublic, startTime)
    await txCreate.wait()
    console.log('✓ Market created for matchId', matchId)

    // === 3. Fetch all markets for this match ===
    console.log('\n=== 3. Fetching markets for match ===')
    const markets = await factory.getMarkets(matchId)
    for (let i = 0; i < markets.length; i++) {
      const info = await factory.getMarketInfo(markets[i])
      console.log(`[${i}] Address: ${info.marketAddress}, Creator: ${info.creator}, EntryFee: ${hre.ethers.formatEther(info.entryFee)} ETH, Public: ${info.isPublic}, StartTime: ${info.startTime}`)
    }

    // === 4. Fetch global dashboard from Dashboard contract ===
    console.log('\n=== 4. Global paginated dashboard ===')
    const dashboardGlobal = await dashboard.getMarketsDashboardPaginated(0, 10, false)
    dashboardGlobal.forEach((m, i) => {
      console.log(`[${i}] Market: ${m.marketAddress}, Match: ${m.matchId}, Resolved: ${m.resolved}, Winner: ${m.winner}, Participants: ${m.participantsCount}, Public: ${m.isPublic}, StartTime: ${m.startTime}`)
    })

    // === 5. Fetch user-created markets from Dashboard ===
    console.log('\n=== 5. User-created markets ===')
    const dashboardUserCreated = await dashboard.getUserMarketsDashboardPaginated(signer.address, 0, 10, true)
    dashboardUserCreated.forEach((m, i) => {
      console.log(`[${i}] Market: ${m.marketAddress}, Match: ${m.matchId}, Resolved: ${m.resolved}, Winner: ${m.winner}, Participants: ${m.participantsCount}, Public: ${m.isPublic}, StartTime: ${m.startTime}`)
    })

    // === 6. Join the first market ===
    console.log('\n=== 6. Joining first market ===')
    const firstMarketAddr = markets[0]
    const Market = await hre.ethers.getContractFactory('CryptoScoreMarket')
    const marketCode = await hre.ethers.provider.getCode(firstMarketAddr)
    console.log(marketCode)
    const market = Market.attach(firstMarketAddr) as CryptoScoreMarket

    const prediction = 1 // HOME
    const txJoin = await market.join(prediction, { value: entryFee })
    await txJoin.wait()
    console.log(`✓ Joined market ${firstMarketAddr} as HOME`)

    // === 7. Resolve market ===
    console.log('\n=== 7. Resolving market ===')
    const txResolve = await market.resolve(prediction)
    await txResolve.wait()
    console.log('✓ Market resolved')

    // === 8. Withdraw rewards ===
    console.log('\n=== 8. Withdrawing rewards ===')
    const txWithdraw = await market.withdraw()
    await txWithdraw.wait()
    console.log('✓ Reward withdrawn')

    // === 9. Fetch user participant markets from Dashboard ===
    console.log('\n=== 9. User participant markets ===')
    const dashboardUserParticipant = await dashboard.getUserMarketsDashboardPaginated(signer.address, 0, 10, false)
    dashboardUserParticipant.forEach((m, i) => {
      console.log(`[${i}] Market: ${m.marketAddress}, Match: ${m.matchId}, Resolved: ${m.resolved}, Winner: ${m.winner}, Participants: ${m.participantsCount}, Public: ${m.isPublic}, StartTime: ${m.startTime}`)
    })
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
