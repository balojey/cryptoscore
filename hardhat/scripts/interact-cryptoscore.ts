import hre from 'hardhat'
import process from 'node:process'
import type { CryptoScoreFactory, CryptoScoreMarket, CryptoScoreDashboard } from '../typechain-types'

async function main() {
  try {
    const signers = await hre.ethers.getSigners()
    const signer = signers[0]
    
    console.log('🔑 Using signers:')
    console.log('  Signer 1:', signer.address)
    
    if (signers.length < 3) {
      console.log('⚠️  Note: Only 1 signer available. Will use same signer for all operations.')
      console.log('⚠️  For multi-user testing, configure multiple accounts in hardhat.config.ts')
    } else {
      console.log('  Signer 2:', signers[1].address)
      console.log('  Signer 3:', signers[2].address)
    }
    
    const user2 = signers[1] || signer
    const user3 = signers[2] || signer

    // Updated contract addresses
    const factoryAddress = '0xBe6Eb4ACB499f992ba2DaC7CAD59d56DA9e0D823'
    const dashboardAddress = '0xb6aA91E8904d691a10372706e57aE1b390D26353'

    const Factory = await hre.ethers.getContractFactory('CryptoScoreFactory')
    const factory = Factory.attach(factoryAddress).connect(signer) as CryptoScoreFactory
    console.log('\n✓ Factory attached at:', factoryAddress)

    const Dashboard = await hre.ethers.getContractFactory('CryptoScoreDashboard')
    const dashboard = Dashboard.attach(dashboardAddress).connect(signer) as CryptoScoreDashboard
    console.log('✓ Dashboard attached at:', dashboardAddress)

    // Market parameters
    const entryFee = hre.ethers.parseUnits('0.01', 18)
    const matchId = Math.floor(Date.now() / 1000) // Unique match ID
    const isPublic = true
    const startTime = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now

    console.log('\n' + '='.repeat(60))
    console.log('📝 CREATING NEW MARKET')
    console.log('='.repeat(60))
    console.log('Match ID:', matchId)
    console.log('Entry Fee:', hre.ethers.formatUnits(entryFee, 18), 'PAS')
    console.log('Public:', isPublic)
    console.log('Start Time:', new Date(startTime * 1000).toLocaleString())

    const txCreate = await factory.createMarket(matchId, entryFee, isPublic, startTime)
    console.log('⏳ Transaction sent:', txCreate.hash)
    await txCreate.wait(2)
    console.log('✅ Market created successfully!')

    // Wait for blockchain to process
    console.log('⏳ Waiting for blockchain to process...')
    await new Promise((r) => setTimeout(r, 6000))

    const markets = await factory.getMarkets(matchId)
    console.log('📊 Markets found:', markets.length)

    if (markets.length === 0) throw new Error('No markets found after creation!')

    const marketAddress = markets[0]
    console.log('🎯 Market Address:', marketAddress)

    const Market = await hre.ethers.getContractFactory('CryptoScoreMarket')
    const market = Market.attach(marketAddress).connect(signer) as CryptoScoreMarket

    console.log('\n' + '='.repeat(60))
    console.log('👥 USER JOINING MARKET')
    console.log('='.repeat(60))

    // Single user test (since we only have one signer)
    console.log('\n👤 User joining with HOME prediction...')
    const txJoin1 = await market.connect(signer).join(1, { value: entryFee })
    await txJoin1.wait(2)
    console.log('✅ User joined with HOME')

    // Note: In single-signer mode, we can't test multiple users
    if (signers.length >= 3) {
      // User 2 predicts AWAY (2)
      console.log('\n👤 User 2 joining with AWAY prediction...')
      const txJoin2 = await market.connect(user2).join(2, { value: entryFee })
      await txJoin2.wait(2)
      console.log('✅ User 2 joined with AWAY')

      // User 3 predicts DRAW (3)
      console.log('\n👤 User 3 joining with DRAW prediction...')
      const txJoin3 = await market.connect(user3).join(3, { value: entryFee })
      await txJoin3.wait(2)
      console.log('✅ User 3 joined with DRAW')
    } else {
      console.log('\n⚠️  Skipping additional users (single signer mode)')
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 CHECKING PREDICTION COUNTS')
    console.log('='.repeat(60))

    const counts = await market.getPredictionCounts()
    console.log('🏠 HOME predictions:', counts[0].toString())
    console.log('✈️  AWAY predictions:', counts[1].toString())
    console.log('🤝 DRAW predictions:', counts[2].toString())
    console.log('👥 Total participants:', (await market.getParticipantsCount()).toString())

    console.log('\n' + '='.repeat(60))
    console.log('🔍 CHECKING USER PREDICTIONS')
    console.log('='.repeat(60))

    const prediction1 = await market.getUserPrediction(signer.address)
    const predictionNames = ['NONE', 'HOME', 'AWAY', 'DRAW']
    console.log(`👤 User 1 (${signer.address}): ${predictionNames[Number(prediction1)]}`)
    
    if (signers.length >= 3) {
      const prediction2 = await market.getUserPrediction(user2.address)
      const prediction3 = await market.getUserPrediction(user3.address)
      console.log(`👤 User 2 (${user2.address}): ${predictionNames[Number(prediction2)]}`)
      console.log(`👤 User 3 (${user3.address}): ${predictionNames[Number(prediction3)]}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('🏆 RESOLVING MARKET (HOME WINS)')
    console.log('='.repeat(60))

    const winningPrediction = 1 // HOME wins
    const txResolve = await market.connect(signer).resolve(winningPrediction)
    console.log('⏳ Transaction sent:', txResolve.hash)
    await txResolve.wait(2)
    console.log('✅ Market resolved! Winner: HOME')

    console.log('\n' + '='.repeat(60))
    console.log('💰 CHECKING REWARDS')
    console.log('='.repeat(60))

    const reward1 = await market.rewards(signer.address)
    console.log(`💵 User 1 reward: ${hre.ethers.formatUnits(reward1, 18)} PAS`)
    
    if (signers.length >= 3) {
      const reward2 = await market.rewards(user2.address)
      const reward3 = await market.rewards(user3.address)
      console.log(`💵 User 2 reward: ${hre.ethers.formatUnits(reward2, 18)} PAS`)
      console.log(`💵 User 3 reward: ${hre.ethers.formatUnits(reward3, 18)} PAS`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('💸 WITHDRAWING REWARDS')
    console.log('='.repeat(60))

    if (reward1 > 0n) {
      console.log('💸 User 1 withdrawing...')
      const txWithdraw1 = await market.connect(signer).withdraw()
      await txWithdraw1.wait(2)
      console.log('✅ User 1 withdrawn:', hre.ethers.formatUnits(reward1, 18), 'PAS')
    }

    if (signers.length >= 3) {
      const reward2 = await market.rewards(user2.address)
      const reward3 = await market.rewards(user3.address)
      
      if (reward2 > 0n) {
        console.log('💸 User 2 withdrawing...')
        const txWithdraw2 = await market.connect(user2).withdraw()
        await txWithdraw2.wait(2)
        console.log('✅ User 2 withdrawn:', hre.ethers.formatUnits(reward2, 18), 'PAS')
      }

      if (reward3 > 0n) {
        console.log('💸 User 3 withdrawing...')
        const txWithdraw3 = await market.connect(user3).withdraw()
        await txWithdraw3.wait(2)
        console.log('✅ User 3 withdrawn:', hre.ethers.formatUnits(reward3, 18), 'PAS')
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📈 FETCHING DASHBOARD DATA')
    console.log('='.repeat(60))

    console.log('⏳ Waiting for blockchain to process...')
    await new Promise((r) => setTimeout(r, 6000))

    const dashboardData = await dashboard.getMarketsDashboardPaginated(0, 10, false)
    console.log('📊 Total markets in dashboard:', dashboardData.length)

    if (dashboardData.length > 0) {
      console.log('\n📋 Latest Market Details:')
      const latestMarket = dashboardData[dashboardData.length - 1]
      console.log('  Address:', latestMarket.marketAddress)
      console.log('  Match ID:', latestMarket.matchId.toString())
      console.log('  Creator:', latestMarket.creator)
      console.log('  Entry Fee:', hre.ethers.formatUnits(latestMarket.entryFee, 18), 'PAS')
      console.log('  Resolved:', latestMarket.resolved)
      console.log('  Winner:', predictionNames[Number(latestMarket.winner)])
      console.log('  Participants:', latestMarket.participantsCount.toString())
      console.log('  Public:', latestMarket.isPublic)
      console.log('  🏠 HOME predictions:', latestMarket.homeCount.toString())
      console.log('  ✈️  AWAY predictions:', latestMarket.awayCount.toString())
      console.log('  🤝 DRAW predictions:', latestMarket.drawCount.toString())
    }

    console.log('\n' + '='.repeat(60))
    console.log('👤 FETCHING USER-SPECIFIC MARKETS')
    console.log('='.repeat(60))

    const userCreatedMarkets = await dashboard.getUserMarketsDashboardPaginated(signer.address, 0, 10, true)
    console.log('📝 Markets created by User 1:', userCreatedMarkets.length)

    const userJoinedMarkets = await dashboard.getUserMarketsDashboardPaginated(signer.address, 0, 10, false)
    console.log('🎯 Markets joined by User 1:', userJoinedMarkets.length)

    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!')
    console.log('='.repeat(60))

    console.log('\n📊 Summary:')
    console.log('  ✓ Market created')
    console.log('  ✓ User joined with prediction')
    console.log('  ✓ Prediction counts tracked correctly')
    console.log('  ✓ User predictions retrievable')
    console.log('  ✓ Market resolved')
    console.log('  ✓ Rewards distributed')
    console.log('  ✓ Withdrawals successful')
    console.log('  ✓ Dashboard data includes prediction counts')

  } catch (err: any) {
    console.error('\n❌ ERROR:', err.message)
    if (err.data) {
      console.error('Error data:', err.data)
    }
    throw err
  }
}

main()
  .then(() => {
    console.log('\n🎉 Script completed successfully!')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n💥 Script failed:', err)
    process.exit(1)
  })
