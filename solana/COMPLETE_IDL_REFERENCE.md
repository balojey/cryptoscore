# Complete IDL Reference - CryptoScore Factory

## Overview

This document provides the complete Interface Definition Language (IDL) for the CryptoScore Factory program on Solana.

## Program Information

- **Name**: `cryptoscore_factory`
- **Version**: `0.1.0`
- **Program ID (Localnet)**: `93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP`
- **Program ID (Devnet)**: `5zADKCecxATSEsCuH5MJa1JdfXGeBLNwEYnkCbqdaYmZ`

## Instructions

### 1. initializeFactory

Initialize the factory with authority and platform fee.

**Accounts:**
- `factory` (mut, not signer) - The factory PDA account
- `authority` (mut, signer) - The authority that will control the factory
- `systemProgram` (not mut, not signer) - Solana System Program

**Arguments:**
- `platformFeeBps: u16` - Platform fee in basis points (max 1000 = 10%)

**Errors:**
- `InvalidPlatformFee` - If platform fee exceeds 1000 bps (10%)

**Example:**
```typescript
await program.methods
  .initializeFactory(100) // 1% platform fee
  .accounts({
    factory: factoryPda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

---

### 2. createMarket

Create a new prediction market for a football match.

**Accounts:**
- `factory` (mut, not signer) - The factory PDA account
- `marketRegistry` (mut, not signer) - The market registry PDA
- `marketAccount` (not mut, not signer) - The market account to be created
- `creator` (mut, signer) - The market creator
- `systemProgram` (not mut, not signer) - Solana System Program

**Arguments:**
- `matchId: string` - Match identifier (max 64 characters, e.g., "EPL-2024-123")
- `entryFee: u64` - Entry fee in lamports (must be > 0)
- `kickoffTime: i64` - Match kickoff timestamp (must be in future)
- `endTime: i64` - Match end timestamp (must be after kickoff)
- `isPublic: bool` - Whether the market is public or private

**Errors:**
- `InvalidMatchId` - If match ID is empty
- `MatchIdTooLong` - If match ID exceeds 64 characters
- `ZeroEntryFee` - If entry fee is 0
- `InvalidKickoffTime` - If kickoff time is not in the future
- `InvalidEndTime` - If end time is not after kickoff time
- `MarketCountOverflow` - If market count overflows

**Events Emitted:**
- `MarketCreated` - Contains market address, creator, match ID, entry fee, kickoff time, and public status

**Example:**
```typescript
const matchId = "EPL-2024-MUN-LIV"
const entryFee = new BN(1_000_000_000) // 1 SOL
const kickoffTime = new BN(Date.now() / 1000 + 86400) // Tomorrow
const endTime = new BN(kickoffTime.toNumber() + 7200) // 2 hours after kickoff
const isPublic = true

await program.methods
  .createMarket(matchId, entryFee, kickoffTime, endTime, isPublic)
  .accounts({
    factory: factoryPda,
    marketRegistry: marketRegistryPda,
    marketAccount: marketPda,
    creator: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

---

### 3. getMarkets

Get paginated list of markets with optional filtering (view function).

**Accounts:**
- `factory` (not mut, not signer) - The factory PDA account

**Arguments:**
- `filterCreator: Option<Pubkey>` - Optional filter by creator address
- `filterPublic: Option<bool>` - Optional filter by public/private status
- `page: u32` - Page number (0-indexed)
- `pageSize: u32` - Number of markets per page

**Returns:**
- `Vec<MarketInfo>` - Array of market information

**Note:** This is primarily a view function meant to be called off-chain. Clients typically fetch market registry accounts directly using `getProgramAccounts`.

**Example:**
```typescript
// This would typically be called off-chain
const markets = await program.methods
  .getMarkets(null, { some: true }, 0, 20)
  .accounts({
    factory: factoryPda,
  })
  .view()
```

## Account Structures

### Factory

The main factory account that tracks all markets.

**Fields:**
- `authority: Pubkey` - Authority that can update factory settings
- `marketCount: u64` - Total number of markets created
- `platformFeeBps: u16` - Platform fee in basis points (100 = 1%)
- `bump: u8` - PDA bump seed

**Size:** 51 bytes (8 discriminator + 32 authority + 8 count + 2 fee + 1 bump)

**PDA Seeds:** `["factory"]`

---

### MarketRegistry

Registry entry for each created market.

**Fields:**
- `factory: Pubkey` - Factory that created this market
- `marketAddress: Pubkey` - Address of the market account
- `creator: Pubkey` - Creator of the market
- `matchId: String` - Match identifier (max 64 chars)
- `createdAt: i64` - Creation timestamp
- `isPublic: bool` - Whether market is public
- `entryFee: u64` - Entry fee in lamports
- `kickoffTime: i64` - Match kickoff timestamp
- `endTime: i64` - Match end timestamp
- `bump: u8` - PDA bump seed

**Size:** 177 bytes (8 discriminator + 32 factory + 32 market + 32 creator + 68 matchId + 8 created + 1 public + 8 fee + 8 kickoff + 8 end + 1 bump)

**PDA Seeds:** `["market_registry", factory.key(), matchId.as_bytes()]`

## Events

### MarketCreated

Emitted when a new market is successfully created.

**Fields:**
- `market: Pubkey` (indexed) - Address of the created market
- `creator: Pubkey` (indexed) - Address of the market creator
- `matchId: String` - Match identifier
- `entryFee: u64` - Entry fee in lamports
- `kickoffTime: i64` - Match kickoff timestamp
- `isPublic: bool` - Whether market is public

**Example Listener:**
```typescript
program.addEventListener('MarketCreated', (event, slot) => {
  console.log('New market created:', {
    market: event.market.toString(),
    creator: event.creator.toString(),
    matchId: event.matchId,
    entryFee: event.entryFee.toString(),
    kickoffTime: new Date(event.kickoffTime.toNumber() * 1000),
    isPublic: event.isPublic,
  })
})
```

## Error Codes

| Code | Name | Message |
|------|------|---------|
| 6000 | InvalidPlatformFee | Platform fee cannot exceed 10% (1000 bps) |
| 6001 | InvalidMatchId | Match ID cannot be empty |
| 6002 | MatchIdTooLong | Match ID is too long (max 64 characters) |
| 6003 | ZeroEntryFee | Entry fee must be greater than zero |
| 6004 | InvalidKickoffTime | Kickoff time must be in the future |
| 6005 | InvalidEndTime | End time must be after kickoff time |
| 6006 | MarketCountOverflow | Market count overflow |

## Type Definitions

### MarketInfo

Return type for `getMarkets` instruction.

**Fields:**
- `marketAddress: Pubkey` - Market account address
- `creator: Pubkey` - Market creator address
- `matchId: String` - Match identifier
- `createdAt: i64` - Creation timestamp
- `isPublic: bool` - Public/private status
- `entryFee: u64` - Entry fee in lamports

## PDA Derivation

### Factory PDA
```typescript
const [factoryPda, factoryBump] = await PublicKey.findProgramAddress(
  [Buffer.from("factory")],
  programId
)
```

### Market Registry PDA
```typescript
const [marketRegistryPda, registryBump] = await PublicKey.findProgramAddress(
  [
    Buffer.from("market_registry"),
    factoryPda.toBuffer(),
    Buffer.from(matchId)
  ],
  programId
)
```

## Complete Usage Example

```typescript
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor'
import { FactoryIDL } from './idl/cryptoscore_factory.json'

// Setup
const connection = new web3.Connection('https://api.devnet.solana.com')
const wallet = // ... your wallet
const provider = new AnchorProvider(connection, wallet, {})
const programId = new web3.PublicKey('5zADKCecxATSEsCuH5MJa1JdfXGeBLNwEYnkCbqdaYmZ')
const program = new Program(FactoryIDL, programId, provider)

// Derive PDAs
const [factoryPda] = await web3.PublicKey.findProgramAddress(
  [Buffer.from("factory")],
  programId
)

// Initialize factory (one-time)
await program.methods
  .initializeFactory(100) // 1% platform fee
  .accounts({
    factory: factoryPda,
    authority: wallet.publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .rpc()

// Create a market
const matchId = "EPL-2024-MUN-LIV"
const [marketRegistryPda] = await web3.PublicKey.findProgramAddress(
  [
    Buffer.from("market_registry"),
    factoryPda.toBuffer(),
    Buffer.from(matchId)
  ],
  programId
)

const marketKeypair = web3.Keypair.generate()
const entryFee = new BN(1_000_000_000) // 1 SOL
const kickoffTime = new BN(Math.floor(Date.now() / 1000) + 86400)
const endTime = new BN(kickoffTime.toNumber() + 7200)

await program.methods
  .createMarket(matchId, entryFee, kickoffTime, endTime, true)
  .accounts({
    factory: factoryPda,
    marketRegistry: marketRegistryPda,
    marketAccount: marketKeypair.publicKey,
    creator: wallet.publicKey,
    systemProgram: web3.SystemProgram.programId,
  })
  .rpc()

// Fetch factory data
const factoryData = await program.account.factory.fetch(factoryPda)
console.log('Total markets:', factoryData.marketCount.toString())

// Fetch market registry
const registryData = await program.account.marketRegistry.fetch(marketRegistryPda)
console.log('Market:', {
  matchId: registryData.matchId,
  creator: registryData.creator.toString(),
  entryFee: registryData.entryFee.toString(),
  isPublic: registryData.isPublic,
})
```

## Related Programs

- **CryptoScore Market** (`cryptoscore_market`) - Individual market logic
- **CryptoScore Dashboard** (`cryptoscore_dashboard`) - Data aggregation

## Resources

- **Source Code**: `solana/programs/factory/src/lib.rs`
- **IDL File**: `solana/target/idl/cryptoscore_factory.json`
- **Frontend IDL**: `solana/app/src/idl/cryptoscore_factory.json`
- **TypeScript Types**: `solana/target/types/cryptoscore_factory.ts`

---

**Document Version**: 1.0  
**Last Updated**: 2024-11-28  
**IDL Checksum**: `91db14315db974e8a3d41b8bdbc409cb`
