# CryptoScore Market IDL Generation Complete

## Overview

Successfully generated the complete IDL (Interface Definition Language) for the CryptoScore Market Solana program based on the Rust source code.

## Generated Files

### 1. JSON IDL
**Location:** `solana/target/idl/cryptoscore_market.json`

Complete Anchor IDL in JSON format containing:
- 4 instructions (initializeMarket, joinMarket, resolveMarket, withdrawRewards)
- 2 account types (Market, Participant)
- 2 custom types (MarketStatus, MatchOutcome enums)
- 3 events (PredictionMade, MarketResolved, RewardClaimed)
- 20 error codes
- Program address: `94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ`

### 2. TypeScript Types
**Location:** `solana/target/types/cryptoscore_market.ts`

TypeScript type definitions and IDL export for frontend integration.

## IDL Structure

### Instructions

1. **initializeMarket**
   - Creates a new prediction market
   - Args: matchId (string), entryFee (u64), kickoffTime (i64), endTime (i64), isPublic (bool)
   - Accounts: market (init), factory, creator (signer), systemProgram

2. **joinMarket**
   - Join a market with a prediction
   - Args: prediction (MatchOutcome enum)
   - Accounts: market (mut), participant (init), user (signer), systemProgram

3. **resolveMarket**
   - Resolve market with match outcome
   - Args: outcome (MatchOutcome enum)
   - Accounts: market (mut), creator (signer)

4. **withdrawRewards**
   - Withdraw rewards for winning participants
   - Args: none
   - Accounts: market (mut), participant (mut), user (signer), systemProgram

### Account Types

1. **Market**
   - factory: PublicKey
   - creator: PublicKey
   - matchId: String
   - entryFee: u64
   - kickoffTime: i64
   - endTime: i64
   - status: MarketStatus enum
   - outcome: Option<MatchOutcome>
   - totalPool: u64
   - participantCount: u32
   - homeCount: u32
   - drawCount: u32
   - awayCount: u32
   - isPublic: bool
   - bump: u8

2. **Participant**
   - market: PublicKey
   - user: PublicKey
   - prediction: MatchOutcome enum
   - joinedAt: i64
   - hasWithdrawn: bool
   - bump: u8

### Custom Types

1. **MarketStatus** (enum)
   - Open
   - Live
   - Resolved
   - Cancelled

2. **MatchOutcome** (enum)
   - Home
   - Draw
   - Away

### Events

1. **PredictionMade**
   - market: PublicKey (indexed)
   - user: PublicKey (indexed)
   - prediction: MatchOutcome
   - timestamp: i64

2. **MarketResolved**
   - market: PublicKey (indexed)
   - outcome: MatchOutcome
   - winnerCount: u32
   - totalPool: u64

3. **RewardClaimed**
   - market: PublicKey (indexed)
   - user: PublicKey (indexed)
   - amount: u64

### Error Codes

- 6000: InvalidMatchId
- 6001: MatchIdTooLong
- 6002: ZeroEntryFee
- 6003: InvalidKickoffTime
- 6004: InvalidEndTime
- 6005: MarketNotOpen
- 6006: MarketAlreadyStarted
- 6007: PoolOverflow
- 6008: ParticipantOverflow
- 6009: CountOverflow
- 6010: UnauthorizedResolver
- 6011: MarketAlreadyResolved
- 6012: MarketNotEnded
- 6013: MarketNotResolved
- 6014: AlreadyWithdrawn
- 6015: NoOutcome
- 6016: NotAWinner
- 6017: NoWinners
- 6018: CalculationError
- 6019: InsufficientFunds

## PDA Seeds

### Market Account
```
seeds = [
    b"market",
    factory.key().as_ref(),
    match_id.as_bytes()
]
```

### Participant Account
```
seeds = [
    b"participant",
    market.key().as_ref(),
    user.key().as_ref()
]
```

## Usage

### TypeScript/JavaScript
```typescript
import { CryptoscoreMarket, IDL } from './target/types/cryptoscore_market';
import { Program, AnchorProvider } from '@coral-xyz/anchor';

const program = new Program<CryptoscoreMarket>(
  IDL,
  new PublicKey('94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ'),
  provider
);
```

### Rust
```rust
use anchor_lang::prelude::*;

declare_id!("94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ");
```

## Verification

The IDL was manually generated from the Rust source code at `solana/programs/market/src/lib.rs` and accurately reflects:
- All public instructions and their parameters
- All account structures and their fields
- All custom types and enums
- All events with proper indexing
- All error codes with messages
- Proper PDA seed configurations

## Integration Points

The IDL is now available for:
1. Frontend integration (TypeScript/JavaScript)
2. Testing frameworks (Anchor tests)
3. CLI tools and scripts
4. Documentation generation
5. Client SDK generation

## Next Steps

1. Build the program: `anchor build`
2. Deploy to devnet: `anchor deploy --provider.cluster devnet`
3. Update program IDs in Anchor.toml if needed
4. Test all instructions using the generated IDL
5. Integrate with frontend application

## Notes

- The IDL matches the program ID declared in the source code
- All account constraints and seeds are properly documented
- Event indexing is configured for efficient querying
- Error codes follow Anchor's standard numbering (6000+)

---

**Generated:** 2024-11-29  
**Program ID:** 94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ  
**Status:** ✅ Complete and Ready for Use
