import hre from 'hardhat'
import process from 'node:process'
import type { CryptoScoreFactory, CryptoScoreMarket, CryptoScoreDashboard } from '../typechain-types'

async function main() {
  try {
    const [signer] = await hre.ethers.getSigners()
    console.log('Using signer:', signer.address)

    const factoryAddress = '0x02e8910B3B89690d4aeC9fcC0Ae2cD16fB6A4828'
    const dashboardAddress = '0x484242986F57dFcA98EeC2C78427931C63F1C4ce'

    const Factory = await hre.ethers.getContractFactory('CryptoScoreFactory')
    const factory = Factory.attach(factoryAddress).connect(signer) as CryptoScoreFactory
    console.log('✓ Factory attached at:', factoryAddress)

    const Dashboard = await hre.ethers.getContractFactory('CryptoScoreDashboard')
    const dashboard = Dashboard.attach(dashboardAddress).connect(signer) as CryptoScoreDashboard
    console.log('✓ Dashboard attached at:', dashboardAddress)

    const entryFee = hre.ethers.parseUnits('0.01', 18)
    const matchId = 12345
    const isPublic = false
    const startTime = Math.floor(Date.now() / 1000) + 3600

    console.log('\n=== Creating new market ===')
    const txCreate = await factory.createMarket(matchId, entryFee, isPublic, startTime)
    await txCreate.wait(2)
    console.log('✓ Market created')

    await new Promise((r) => setTimeout(r, 6000))

    const markets = await factory.getMarkets(matchId)
    console.log('Markets:', markets)

    if (markets.length === 0) throw new Error('No markets found after creation!')

    const Market = await hre.ethers.getContractFactory('CryptoScoreMarket')
    const market = Market.attach(markets[0]).connect(signer) as CryptoScoreMarket

    console.log('\n=== Joining market ===')
    const prediction = 1
    const txJoin = await market.join(prediction, { value: entryFee })
    await txJoin.wait(2)
    console.log('✓ Joined')

    console.log('\n=== Resolving ===')
    const txResolve = await market.resolve(prediction)
    await txResolve.wait(2)
    console.log('✓ Resolved')

    console.log('\n=== Withdrawing ===')
    const txWithdraw = await market.withdraw()
    await txWithdraw.wait(2)
    console.log('✓ Withdrawn')

    console.log('\n=== Fetching dashboard ===')
    await new Promise((r) => setTimeout(r, 6000))
    const data = await dashboard.getMarketsDashboardPaginated(0, 10, false)
    console.log('Dashboard entries:', data.length)
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
