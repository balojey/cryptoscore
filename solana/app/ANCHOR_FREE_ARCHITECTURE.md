# Anchor-Free Solana Integration Architecture

## Overview

This document describes the Anchor-free architecture implemented in the CryptoScore Solana frontend. The implementation removes all dependencies on the Anchor framework's client-side libraries, replacing them with native Solana web3.js and custom utilities for transaction building, instruction encoding, and account decoding.

## Why Anchor-Free?

### Benefits

1. **Reduced Bundle Size**: Eliminates ~200KB of Anchor client libraries
2. **Fewer Dependencies**: Removes third-party framework dependencies
3. **Full Control**: Complete control over transaction construction and serialization
4. **Better Understanding**: Forces explicit handling of all Solana primitives
5. **Flexibility**: Easier to customize and optimize for specific use cases

### Trade-offs

- **More Code**: Requires manual implementation of encoding/decoding logic
- **Maintenance**: Need to keep schemas in sync with on-chain programs
- **Learning Curve**: Requires deeper understanding of Solana primitives

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      React Components                        │
│                    (UI Layer - Unchanged)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Custom Hooks Layer                      │
│  useMarketData, useMarketActions, useAccountSubscription     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Solana Integration Layer                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transaction  │  │ Instruction  │  │   Account    │      │
│  │   Builder    │  │   Encoder    │  │   Decoder    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PDA Utils   │  │    Error     │  │    Solana    │      │
│  │              │  │   Handler    │  │    Utils     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    @solana/web3.js                           │
│                   (Core Solana Library)                      │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. TransactionBuilder (`lib/solana/transaction-builder.ts`)

Constructs Solana transactions with compute budget and priority fees.

**Features:**
- Fluent API for building transactions
- Compute budget instruction support
- Priority fee configuration
- Fee estimation before sending
- Transaction preview without consuming builder

**Usage Example:**

```typescript
import { TransactionBuilder } from './lib/solana/transaction-builder'
import { Connection, PublicKey } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')
const builder = new TransactionBuilder({
  computeUnitLimit: 200_000,
  computeUnitPrice: 1000, // microLamports
})

// Add instructions
builder.addInstruction(instruction1)
builder.addInstruction(instruction2)

// Estimate fee before sending
const feeEstimate = await builder.previewFee(connection, feePayer)
console.log(`Estimated fee: ${feeEstimate.feeInSol} SOL`)

// Build final transaction
const transaction = await builder.build(connection)
```

### 2. InstructionEncoder (`lib/solana/instruction-encoder.ts`)

Encodes instruction data using Borsh serialization with proper discriminators.

**Supported Instructions:**
- `createMarket` - Create a new prediction market
- `joinMarket` - Join a market with a prediction
- `resolveMarket` - Resolve a market with outcome
- `withdraw` - Withdraw winnings from a resolved market

**Usage Example:**

```typescript
import { InstructionEncoder } from './lib/solana/instruction-encoder'
import { PublicKey, SystemProgram } from '@solana/web3.js'

const encoder = new InstructionEncoder(programId)

// Create market instruction
const createMarketIx = encoder.createMarket(
  {
    matchId: 'MATCH_123',
    entryFee: BigInt(1_000_000_000), // 1 SOL
    kickoffTime: BigInt(Date.now() / 1000 + 3600),
    endTime: BigInt(Date.now() / 1000 + 7200),
    isPublic: true,
  },
  {
    factory: factoryPDA,
    market: marketPDA,
    creator: userPublicKey,
    systemProgram: SystemProgram.programId,
  }
)

// Join market instruction
const joinMarketIx = encoder.joinMarket(
  { prediction: 0 }, // 0 = HOME, 1 = DRAW, 2 = AWAY
  {
    market: marketPDA,
    participant: participantPDA,
    user: userPublicKey,
    systemProgram: SystemProgram.programId,
  }
)
```

### 3. AccountDecoder (`lib/solana/account-decoder.ts`)

Deserializes account data from on-chain state using Borsh schemas.

**Supported Account Types:**
- `Factory` - Factory account with market count and volume
- `Market` - Market account with all market data
- `Participant` - Participant account with prediction and withdrawal status
- `UserStats` - User statistics account

**Usage Example:**

```typescript
import { AccountDecoder } from './lib/solana/account-decoder'
import { Connection, PublicKey } from '@solana/web3.js'

const connection = new Connection('https://api.devnet.solana.com')

// Fetch and decode market account
const accountInfo = await connection.getAccountInfo(marketPDA)
if (accountInfo) {
  const market = AccountDecoder.decodeMarket(accountInfo.data)
  console.log('Market:', {
    matchId: market.matchId,
    entryFee: market.entryFee,
    totalPool: market.totalPool,
    participantCount: market.participantCount,
    status: market.status,
  })
}

// Verify discriminator before decoding
if (AccountDecoder.verifyDiscriminator(accountInfo.data, 'MARKET')) {
  const market = AccountDecoder.decodeMarket(accountInfo.data)
}
```

### 4. PDAUtils (`lib/solana/pda-utils.ts`)

Derives Program Derived Addresses for all program accounts.

**PDA Seeds:**
- Factory: `["factory"]`
- Market: `["market", factory_pubkey, match_id]`
- Participant: `["participant", market_pubkey, user_pubkey]`
- UserStats: `["user_stats", user_pubkey]`

**Usage Example:**

```typescript
import { PDAUtils } from './lib/solana/pda-utils'
import { PublicKey } from '@solana/web3.js'

const pdaUtils = new PDAUtils(programId)

// Find factory PDA
const { pda: factoryPDA, bump: factoryBump } = await pdaUtils.findFactoryPDA()

// Find market PDA
const { pda: marketPDA, bump: marketBump } = await pdaUtils.findMarketPDA(
  factoryPDA,
  'MATCH_123'
)

// Find participant PDA
const { pda: participantPDA, bump: participantBump } = await pdaUtils.findParticipantPDA(
  marketPDA,
  userPublicKey
)
```

### 5. SolanaErrorHandler (`lib/solana/error-handler.ts`)

Parses Solana program errors and maps them to user-friendly messages.

**Error Categories:**
- Program errors (custom error codes 6000-6015)
- Common Solana errors (insufficient funds, rejected, expired)
- Transaction simulation errors

**Usage Example:**

```typescript
import { SolanaErrorHandler } from './lib/solana/error-handler'

try {
  await sendTransaction(transaction)
} catch (error) {
  // Get user-friendly message
  const message = SolanaErrorHandler.getUserMessage(error)
  toast.error(message)

  // Log detailed error for debugging
  SolanaErrorHandler.logError(error, 'createMarket')

  // Check for specific error code
  if (SolanaErrorHandler.isErrorCode(error, 6006)) {
    console.log('User already joined this market')
  }
}
```

### 6. SolanaUtils (`lib/solana/utils.ts`)

Common utility functions for Solana operations.

**Available Utilities:**
- `lamportsToSol` / `solToLamports` - Currency conversion
- `shortenAddress` - Format addresses for display
- `confirmTransaction` - Confirm with retry logic
- `simulateTransaction` - Simulate before sending
- `getExplorerUrl` - Generate explorer links
- `formatSol` / `formatFee` - Format amounts for display
- `isValidPublicKey` - Validate public key strings

**Usage Example:**

```typescript
import { SolanaUtils } from './lib/solana/utils'

// Convert lamports to SOL
const sol = SolanaUtils.lamportsToSol(1_000_000_000) // 1.0

// Shorten address for display
const short = SolanaUtils.shortenAddress(publicKey) // "5Fwq...3xYz"

// Simulate transaction
const simulation = await SolanaUtils.simulateTransaction(connection, transaction)
if (!simulation.success) {
  console.error('Simulation failed:', simulation.error)
}

// Confirm transaction with retry
const confirmed = await SolanaUtils.confirmTransaction(connection, signature)

// Get explorer URL
const url = SolanaUtils.getExplorerUrl(signature, 'devnet')
```

## Borsh Serialization

### What is Borsh?

Borsh (Binary Object Representation Serializer for Hashing) is a binary serialization format used by Solana programs. It's deterministic, efficient, and supports complex data structures.

### Instruction Data Schemas

All instruction data is serialized using Borsh schemas defined in `lib/solana/borsh-schemas.ts`.

**CreateMarket Schema:**

```typescript
{
  struct: {
    matchId: 'string',      // Match identifier
    entryFee: 'u64',        // Entry fee in lamports
    kickoffTime: 'u64',     // Unix timestamp
    endTime: 'u64',         // Unix timestamp
    isPublic: 'bool',       // Public or private market
  }
}
```

**JoinMarket Schema:**

```typescript
{
  struct: {
    prediction: 'u8',  // 0 = HOME, 1 = DRAW, 2 = AWAY
  }
}
```

**ResolveMarket Schema:**

```typescript
{
  struct: {
    outcome: 'u8',  // 0 = HOME, 1 = DRAW, 2 = AWAY
  }
}
```

**Withdraw Schema:**

```typescript
{
  struct: {}  // No parameters needed
}
```

### Instruction Discriminators

Each instruction is identified by an 8-byte discriminator prepended to the serialized data:

- CreateMarket: `[0, 0, 0, 0, 0, 0, 0, 0]`
- JoinMarket: `[1, 0, 0, 0, 0, 0, 0, 0]`
- ResolveMarket: `[2, 0, 0, 0, 0, 0, 0, 0]`
- Withdraw: `[3, 0, 0, 0, 0, 0, 0, 0]`

### Account Data Schemas

Account data is also serialized using Borsh. Each account type has a discriminator byte at position 0:

- Factory: `0`
- Market: `1`
- Participant: `2`
- UserStats: `3`

## PDA Derivation Logic

### What are PDAs?

Program Derived Addresses (PDAs) are deterministic addresses derived from a program ID and seeds. They allow programs to sign transactions and store data without private keys.

### Derivation Process

```typescript
// Generic PDA derivation
const [pda, bump] = await PublicKey.findProgramAddress(
  [seed1, seed2, ...],
  programId
)
```

### Seed Structures

**Factory PDA:**
```
Seeds: ["factory"]
Purpose: Single factory account per program
```

**Market PDA:**
```
Seeds: ["market", factory_pubkey, match_id]
Purpose: Unique market per match ID
```

**Participant PDA:**
```
Seeds: ["participant", market_pubkey, user_pubkey]
Purpose: One participant account per user per market
```

**UserStats PDA:**
```
Seeds: ["user_stats", user_pubkey]
Purpose: Global stats for each user
```

## Complete Transaction Flow

### Example: Creating a Market

```typescript
import { TransactionBuilder } from './lib/solana/transaction-builder'
import { InstructionEncoder } from './lib/solana/instruction-encoder'
import { PDAUtils } from './lib/solana/pda-utils'
import { SolanaUtils } from './lib/solana/utils'
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'

async function createMarket(
  connection: Connection,
  wallet: any,
  matchId: string,
  entryFee: bigint,
  kickoffTime: bigint,
  endTime: bigint,
  isPublic: boolean
) {
  // 1. Initialize utilities
  const programId = new PublicKey('YOUR_PROGRAM_ID')
  const pdaUtils = new PDAUtils(programId)
  const encoder = new InstructionEncoder(programId)

  // 2. Derive PDAs
  const { pda: factoryPDA } = await pdaUtils.findFactoryPDA()
  const { pda: marketPDA } = await pdaUtils.findMarketPDA(factoryPDA, matchId)

  // 3. Create instruction
  const instruction = encoder.createMarket(
    { matchId, entryFee, kickoffTime, endTime, isPublic },
    {
      factory: factoryPDA,
      market: marketPDA,
      creator: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    }
  )

  // 4. Build transaction
  const builder = new TransactionBuilder({
    computeUnitLimit: 200_000,
    computeUnitPrice: 1000,
  })
  builder.addInstruction(instruction)

  // 5. Estimate fee
  const feeEstimate = await builder.previewFee(connection, wallet.publicKey)
  console.log(`Estimated fee: ${feeEstimate.feeInSol} SOL`)

  // 6. Build and sign transaction
  const transaction = await builder.build(connection)
  transaction.feePayer = wallet.publicKey
  const signedTx = await wallet.signTransaction(transaction)

  // 7. Simulate before sending
  const simulation = await SolanaUtils.simulateTransaction(connection, signedTx)
  if (!simulation.success) {
    throw new Error(`Simulation failed: ${simulation.error}`)
  }

  // 8. Send transaction
  const signature = await connection.sendRawTransaction(signedTx.serialize())

  // 9. Confirm transaction
  const confirmed = await SolanaUtils.confirmTransaction(connection, signature)
  if (!confirmed) {
    throw new Error('Transaction confirmation failed')
  }

  // 10. Get explorer URL
  const explorerUrl = SolanaUtils.getExplorerUrl(signature, 'devnet')
  console.log('Transaction:', explorerUrl)

  return { signature, marketPDA }
}
```

## Custom Hooks Integration

### useMarketData

Fetches and decodes market data without Anchor.

```typescript
import { useQuery } from '@tanstack/react-query'
import { AccountDecoder } from '../lib/solana/account-decoder'

export function useMarketData(marketAddress: PublicKey) {
  const { connection } = useSolanaConnection()

  return useQuery({
    queryKey: ['market', marketAddress.toBase58()],
    queryFn: async () => {
      const accountInfo = await connection.getAccountInfo(marketAddress)
      if (!accountInfo) {
        throw new Error('Market not found')
      }
      return AccountDecoder.decodeMarket(accountInfo.data)
    },
    staleTime: 10_000,
  })
}
```

### useMarketActions

Executes market operations using custom utilities.

```typescript
export function useMarketActions() {
  const { connection, wallet, publicKey } = useSolanaConnection()
  const queryClient = useQueryClient()

  const createMarket = async (params: CreateMarketParams) => {
    if (!wallet || !publicKey) throw new Error('Wallet not connected')

    const pdaUtils = new PDAUtils(PROGRAM_ID)
    const encoder = new InstructionEncoder(PROGRAM_ID)

    // Derive PDAs
    const { pda: factoryPDA } = await pdaUtils.findFactoryPDA()
    const { pda: marketPDA } = await pdaUtils.findMarketPDA(factoryPDA, params.matchId)

    // Build instruction
    const instruction = encoder.createMarket(params, {
      factory: factoryPDA,
      market: marketPDA,
      creator: publicKey,
      systemProgram: SystemProgram.programId,
    })

    // Build and send transaction
    const builder = new TransactionBuilder()
    builder.addInstruction(instruction)
    const transaction = await builder.build(connection)
    transaction.feePayer = publicKey

    const signedTx = await wallet.signTransaction(transaction)
    const signature = await connection.sendRawTransaction(signedTx.serialize())
    await SolanaUtils.confirmTransaction(connection, signature)

    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: ['markets'] })

    return { signature, marketPDA }
  }

  return { createMarket }
}
```

### useAccountSubscription

Subscribes to account changes via WebSocket.

```typescript
export function useAccountSubscription(accountAddress: PublicKey) {
  const { connection } = useSolanaConnection()
  const queryClient = useQueryClient()

  useEffect(() => {
    const subscriptionId = connection.onAccountChange(
      accountAddress,
      (accountInfo) => {
        // Decode updated data
        const market = AccountDecoder.decodeMarket(accountInfo.data)

        // Update cache
        queryClient.setQueryData(
          ['market', accountAddress.toBase58()],
          market
        )
      }
    )

    return () => {
      connection.removeAccountChangeListener(subscriptionId)
    }
  }, [accountAddress, connection, queryClient])
}
```

## Troubleshooting

### Common Issues

#### 1. Transaction Simulation Failed

**Symptom:** Transaction fails during simulation
**Causes:**
- Insufficient SOL balance
- Invalid account addresses
- Incorrect instruction data
- Account already exists/doesn't exist

**Solution:**
```typescript
const simulation = await SolanaUtils.simulateTransaction(connection, transaction)
if (!simulation.success) {
  console.error('Simulation logs:', simulation.logs)
  console.error('Error:', simulation.error)
}
```

#### 2. Account Not Found

**Symptom:** `getAccountInfo` returns null
**Causes:**
- Account hasn't been created yet
- Wrong PDA derivation
- Wrong network (devnet vs mainnet)

**Solution:**
```typescript
const accountInfo = await connection.getAccountInfo(marketPDA)
if (!accountInfo) {
  console.error('Account not found:', marketPDA.toBase58())
  // Check PDA derivation
  const { pda } = await pdaUtils.findMarketPDA(factoryPDA, matchId)
  console.log('Expected PDA:', pda.toBase58())
}
```

#### 3. Borsh Deserialization Error

**Symptom:** Error decoding account data
**Causes:**
- Schema mismatch with on-chain program
- Wrong account type
- Corrupted data

**Solution:**
```typescript
// Verify discriminator first
if (!AccountDecoder.verifyDiscriminator(data, 'MARKET')) {
  console.error('Wrong account type')
  return
}

try {
  const market = AccountDecoder.decodeMarket(data)
} catch (error) {
  console.error('Deserialization error:', error)
  console.log('Raw data:', data.toString('hex'))
}
```

#### 4. Fee Estimation Failed

**Symptom:** `getFeeForMessage` returns null
**Causes:**
- Expired blockhash
- Network congestion
- Invalid transaction

**Solution:**
```typescript
const feeEstimate = await builder.previewFee(connection, feePayer)
if (!feeEstimate.success) {
  console.error('Fee estimation failed:', feeEstimate.error)
  // Retry with fresh blockhash
  const { blockhash } = await connection.getLatestBlockhash('confirmed')
  transaction.recentBlockhash = blockhash
}
```

#### 5. Program Error Codes

**Symptom:** Transaction fails with custom program error
**Solution:**
```typescript
try {
  await sendTransaction(transaction)
} catch (error) {
  const parsed = SolanaErrorHandler.parseError(error)
  console.log('Error code:', parsed.code)
  console.log('Message:', parsed.message)
  console.log('Logs:', parsed.logs)

  // Handle specific errors
  if (parsed.code === 6006) {
    toast.error('You have already joined this market')
  }
}
```

### Debugging Tips

1. **Enable Verbose Logging:**
```typescript
// Log all transaction details
console.log('Transaction:', {
  instructions: transaction.instructions.length,
  feePayer: transaction.feePayer?.toBase58(),
  recentBlockhash: transaction.recentBlockhash,
})
```

2. **Inspect Raw Account Data:**
```typescript
const accountInfo = await connection.getAccountInfo(address)
console.log('Account data (hex):', accountInfo?.data.toString('hex'))
console.log('Account owner:', accountInfo?.owner.toBase58())
console.log('Account lamports:', accountInfo?.lamports)
```

3. **Test PDA Derivation:**
```typescript
const { pda, bump } = await pdaUtils.findMarketPDA(factoryPDA, matchId)
console.log('Market PDA:', pda.toBase58())
console.log('Bump:', bump)

// Verify it matches expected address
const expectedPDA = new PublicKey('EXPECTED_ADDRESS')
console.log('Match:', pda.equals(expectedPDA))
```

4. **Simulate Before Sending:**
```typescript
// Always simulate first
const simulation = await SolanaUtils.simulateTransaction(connection, transaction)
if (simulation.success) {
  console.log('Simulation successful')
  console.log('Logs:', simulation.logs)
} else {
  console.error('Simulation failed:', simulation.error)
  return // Don't send
}
```

## Performance Considerations

### Batch Account Fetching

Use `getMultipleAccountsInfo` for fetching multiple accounts:

```typescript
const addresses = [market1, market2, market3]
const accounts = await connection.getMultipleAccountsInfo(addresses)

const markets = accounts
  .filter(account => account !== null)
  .map(account => AccountDecoder.decodeMarket(account.data))
```

### React Query Caching

Configure appropriate stale times:

```typescript
// Market data - 10 seconds
useQuery({
  queryKey: ['market', address],
  queryFn: fetchMarket,
  staleTime: 10_000,
})

// All markets - 30 seconds
useQuery({
  queryKey: ['markets'],
  queryFn: fetchAllMarkets,
  staleTime: 30_000,
})
```

### WebSocket Subscriptions

Unsubscribe when components unmount:

```typescript
useEffect(() => {
  const subscriptionId = connection.onAccountChange(address, callback)
  return () => connection.removeAccountChangeListener(subscriptionId)
}, [address])
```

## Migration from Anchor

### Key Differences

| Aspect | Anchor | Anchor-Free |
|--------|--------|-------------|
| Transaction Building | `program.methods.createMarket().accounts({...}).rpc()` | Manual instruction encoding + TransactionBuilder |
| Account Fetching | `program.account.market.fetch(address)` | `connection.getAccountInfo()` + AccountDecoder |
| PDA Derivation | `PublicKey.findProgramAddressSync([...], program.programId)` | PDAUtils class methods |
| Error Handling | Anchor error parsing | Custom SolanaErrorHandler |
| Type Safety | Generated types from IDL | Manual TypeScript interfaces |

### Migration Checklist

- [ ] Remove `@coral-xyz/anchor` from package.json
- [ ] Replace `AnchorProvider` with `useSolanaConnection` hook
- [ ] Replace `program.methods.*` with InstructionEncoder
- [ ] Replace `program.account.*.fetch()` with AccountDecoder
- [ ] Replace Anchor PDA derivation with PDAUtils
- [ ] Update error handling to use SolanaErrorHandler
- [ ] Define TypeScript interfaces for all account types
- [ ] Test all transaction flows end-to-end

## Additional Resources

- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Borsh Specification](https://borsh.io/)
- [Solana Program Library](https://spl.solana.com/)
- [Solana Cookbook](https://solanacookbook.com/)

## Support

For issues or questions:
1. Check this documentation
2. Review utility class implementations
3. Check Solana Explorer for transaction details
4. Enable verbose logging for debugging
5. Open GitHub issue with reproduction steps
