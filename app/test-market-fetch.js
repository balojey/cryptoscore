/**
 * Test script to verify market fetching from Solana
 * Run with: node test-market-fetch.js
 */

import { Connection, PublicKey } from '@solana/web3.js'

// Configuration
const MARKET_PROGRAM_ID = process.env.VITE_MARKET_PROGRAM_ID || '3yLMsy3gJRoYP2RNXgnrXsoFWcqVu6QeTXPejvpcCf1F'
const RPC_URL = process.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

async function testMarketFetch() {
  console.log('Testing market fetch...')
  console.log('RPC URL:', RPC_URL)
  console.log('Market Program ID:', MARKET_PROGRAM_ID)
  console.log('')

  try {
    const connection = new Connection(RPC_URL, 'confirmed')
    const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

    console.log('Fetching all program accounts...')
    const accounts = await connection.getProgramAccounts(marketProgramId, {
      filters: [
        {
          dataSize: 193, // Market account size
        },
      ],
    })

    console.log(`Found ${accounts.length} market accounts`)
    console.log('')

    if (accounts.length === 0) {
      console.log('No markets found. This could mean:')
      console.log('1. No markets have been created yet')
      console.log('2. The program ID is incorrect')
      console.log('3. The account size filter (193 bytes) is incorrect')
      console.log('')
      console.log('Trying without size filter...')

      const allAccounts = await connection.getProgramAccounts(marketProgramId)
      console.log(`Found ${allAccounts.length} total accounts for this program`)

      if (allAccounts.length > 0) {
        console.log('')
        console.log('Account sizes:')
        allAccounts.forEach((acc, i) => {
          console.log(`  Account ${i + 1}: ${acc.account.data.length} bytes`)
        })
      }
    }
    else {
      accounts.forEach((acc, i) => {
        console.log(`Market ${i + 1}:`)
        console.log(`  Address: ${acc.pubkey.toString()}`)
        console.log(`  Data size: ${acc.account.data.length} bytes`)
        console.log(`  Owner: ${acc.account.owner.toString()}`)
        console.log('')
      })
    }
  }
  catch (error) {
    console.error('Error fetching markets:', error.message)
    console.error('')
    console.error('Full error:', error)
  }
}

testMarketFetch()
