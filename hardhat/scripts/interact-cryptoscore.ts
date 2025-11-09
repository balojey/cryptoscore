import type { CryptoScoreFactory, CryptoScoreMarket } from '../typechain-types'
import hre from 'hardhat'
import process from 'node:process'

async function main() {
  // Put your deployed CryptoScoreFactory address here
  const factoryAddress = '0xc775bF567D67018dfFac4E89a7Cf10f0EDd0Be93'

  // Attach to the deployed CryptoScoreFactory
  const Factory = await hre.ethers.getContractFactory('CryptoScoreFactory')
  const code = await hre.ethers.provider.getCode("0xc775bF567D67018dfFac4E89a7Cf10f0EDd0Be93")
  console.log(code)
  const factory = Factory.attach(factoryAddress) as CryptoScoreFactory

  console.log('CryptoScoreFactory attached at:', factoryAddress)

  // Example: Create a new market
  console.log('\n=== 1. Creating a new market ===')
  const entryFee = hre.ethers.parseEther('0.01') // 0.01 ETH as entry fee
  const matchId = 12345 // Example match ID

  let tx = await factory.createMarket(matchId, entryFee)
  const receipt = await tx.wait()
  console.log('✓ Market created for matchId', matchId)

  // Fetch all markets for this match
  console.log('\n=== 2. Fetching markets for match ===')
  const markets = await factory.getMarkets(matchId)
  markets.forEach((m, i) => {
    console.log(`[${i}] Address: ${m.marketAddress}, Creator: ${m.creator}, EntryFee: ${hre.ethers.formatEther(m.entryFee)} ETH`)
  })

  // Fetch paginated dashboard globally
  console.log('\n=== 3. Global market dashboard ===')
  const dashboardGlobal = await factory.getMarketsDashboardPaginated(0, 10)
  dashboardGlobal.forEach((m, i) => {
    console.log(
      `[${i}] Market: ${m.marketAddress}, Match: ${m.matchId}, Resolved: ${m.resolved}, Winner: ${m.winner}, Participants: ${m.participantsCount}`
    )
  })

  // Fetch paginated dashboard for user (createdOnly = true)
  const [signer] = await hre.ethers.getSigners()
  const dashboardUserCreated = await factory.getUserMarketsDashboardPaginated(signer.address, 0, 10, true)
  console.log('\n=== 4. User-created markets ===')
  dashboardUserCreated.forEach((m, i) => {
    console.log(
      `[${i}] Market: ${m.marketAddress}, Match: ${m.matchId}, Resolved: ${m.resolved}, Winner: ${m.winner}, Participants: ${m.participantsCount}`
    )
  })

  // Join the first market
  console.log('\n=== 5. Joining first market ===')
  const firstMarketAddr = markets[0].marketAddress
  const Market = await hre.ethers.getContractFactory('CryptoScoreMarket')
  const market = Market.attach(firstMarketAddr) as CryptoScoreMarket

  // Join with prediction: HOME (example)
  tx = await market.join(1, { value: entryFee })
  await tx.wait()
  console.log(`✓ Joined market ${firstMarketAddr} as HOME`)

  // Resolve market (only participant can call)
  console.log('\n=== 6. Resolving market ===')
  tx = await market.resolve(1)
  await tx.wait()
  console.log('✓ Market resolved')

  // Withdraw reward
  console.log('\n=== 7. Withdrawing rewards ===')
  tx = await market.withdraw()
  await tx.wait()
  console.log('✓ Reward withdrawn')

  // Fetch user dashboard including participant markets
  const dashboardUserParticipant = await factory.getUserMarketsDashboardPaginated(signer.address, 0, 10, false)
  console.log('\n=== 8. User participant markets ===')
  dashboardUserParticipant.forEach((m, i) => {
    console.log(
      `[${i}] Market: ${m.marketAddress}, Match: ${m.matchId}, Resolved: ${m.resolved}, Winner: ${m.winner}, Participants: ${m.participantsCount}`
    )
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
