/**
 * Test script to verify market decoding
 * Run with: node test-market-decode.js
 */

import { Connection, PublicKey } from '@solana/web3.js'
import { deserialize } from 'borsh'

// Configuration
const MARKET_PROGRAM_ID = process.env.VITE_MARKET_PROGRAM_ID || '3yLMsy3gJRoYP2RNXgnrXsoFWcqVu6QeTXPejvpcCf1F'
const RPC_URL = process.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// Borsh schema for Market (without discriminator)
const MarketSchema = {
  struct: {
    factory: { array: { type: 'u8', len: 32 } },
    creator: { array: { type: 'u8', len: 32 } },
    matchId: 'string',
    entryFee: 'u64',
    kickoffTime: 'i64',
    endTime: 'i64',
    status: 'u8',
    outcome: { option: 'u8' },
    totalPool: 'u64',
    participantCount: 'u32',
    homeCount: 'u32',
    drawCount: 'u32',
    awayCount: 'u32',
    isPublic: 'bool',
    bump: 'u8',
  },
}

function parseMarketStatus(status) {
  switch (status) {
    case 0: return 'Open'
    case 1: return 'Live'
    case 2: return 'Resolved'
    case 3: return 'Cancelled'
    default: return 'Unknown'
  }
}

function parseOutcome(outcome) {
  if (outcome === null || outcome === undefined || outcome === 255)
    return null
  switch (outcome) {
    case 0: return null // None
    case 1: return 'Home'
    case 2: return 'Draw'
    case 3: return 'Away'
    default: return null
  }
}

async function testMarketDecode() {
  console.log('Testing market decoding...')
  console.log('RPC URL:', RPC_URL)
  console.log('Market Program ID:', MARKET_PROGRAM_ID)
  console.log('')

  try {
    const connection = new Connection(RPC_URL, 'confirmed')
    const marketProgramId = new PublicKey(MARKET_PROGRAM_ID)

    console.log('Fetching market accounts...')
    const accounts = await connection.getProgramAccounts(marketProgramId, {
      filters: [
        {
          dataSize: 193,
        },
      ],
    })

    console.log(`Found ${accounts.length} market(s)`)
    console.log('')

    if (accounts.length === 0) {
      console.log('No markets found!')
      return
    }

    for (let i = 0; i < accounts.length; i++) {
      const { pubkey, account } = accounts[i]

      console.log(`\n=== Market ${i + 1} ===`)
      console.log(`Address: ${pubkey.toString()}`)
      console.log(`Data size: ${account.data.length} bytes`)

      try {
        // Skip 8-byte Anchor discriminator
        const accountData = account.data.slice(8)

        console.log('Decoding account data...')
        const decoded = deserialize(MarketSchema, accountData)

        console.log('\nDecoded Market Data:')
        console.log(`  Factory: ${new PublicKey(decoded.factory).toString()}`)
        console.log(`  Creator: ${new PublicKey(decoded.creator).toString()}`)
        console.log(`  Match ID: ${decoded.matchId}`)
        console.log(`  Entry Fee: ${decoded.entryFee} lamports`)
        console.log(`  Kickoff Time: ${new Date(Number(decoded.kickoffTime) * 1000).toISOString()}`)
        console.log(`  End Time: ${new Date(Number(decoded.endTime) * 1000).toISOString()}`)
        console.log(`  Status: ${parseMarketStatus(decoded.status)}`)
        console.log(`  Outcome: ${parseOutcome(decoded.outcome)}`)
        console.log(`  Total Pool: ${decoded.totalPool} lamports`)
        console.log(`  Participants: ${decoded.participantCount}`)
        console.log(`  Home Count: ${decoded.homeCount}`)
        console.log(`  Draw Count: ${decoded.drawCount}`)
        console.log(`  Away Count: ${decoded.awayCount}`)
        console.log(`  Is Public: ${decoded.isPublic}`)
        console.log(`  Bump: ${decoded.bump}`)
      }
      catch (error) {
        console.error('Error decoding market:', error.message)
        console.error('Full error:', error)

        // Print raw data for debugging
        console.log('\nRaw data (first 100 bytes):')
        console.log(account.data.slice(0, 100).toString('hex'))
      }
    }
  }
  catch (error) {
    console.error('Error:', error.message)
    console.error('Full error:', error)
  }
}

testMarketDecode()
