# CryptoScore Dashboard IDL Generation Complete

## Summary

Successfully generated the complete IDL (Interface Definition Language) for the CryptoScore Dashboard smart contract based on the Rust source code in `programs/dashboard/src/lib.rs`.

## Generated Files

### 1. IDL JSON
**Location:** `solana/target/idl/cryptoscore_dashboard.json`
- Complete IDL specification in JSON format
- Includes all instructions, accounts, types, enums, and errors
- Program address: `95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR`

### 2. TypeScript Types
**Location:** `solana/target/types/cryptoscore_dashboard.ts`
- TypeScript type definitions for the program
- Exported `CryptoscoreDashboard` type
- Exported `IDL` constant for use with Anchor

### 3. Frontend ABI Copies
**Locations:**
- `dapp-react/abi/CryptoScoreDashboard.json`
- `solana/app/abi/CryptoScoreDashboard.json`

## IDL Contents

### Instructions (5)

1. **updateUserStats**
   - Updates user statistics after market resolution
   - Accounts: userStats (PDA), user (signer), systemProgram
   - Args: marketResult (Win/Loss), amountWagered, amountWon

2. **getAllMarkets**
   - View function for fetching all markets with filtering
   - Args: filterStatus, filterVisibility, sortBy, page, pageSize
   - Returns: Vec<MarketSummary>

3. **getUserMarkets**
   - View function for fetching user-specific markets
   - Args: user, filterStatus, sortBy, page, pageSize
   - Returns: Vec<MarketSummary>

4. **getMarketDetails**
   - View function for comprehensive market details
   - Args: market (publicKey)
   - Returns: MarketDetails

5. **getMarketStats**
   - View function for aggregated statistics
   - Returns: AggregatedStats

### Accounts (1)

**UserStats** - PDA account storing user statistics
- user: publicKey
- totalMarkets: u32
- wins: u32
- losses: u32
- totalWagered: u64
- totalWon: u64
- currentStreak: i32
- bestStreak: u32
- lastUpdated: i64
- bump: u8

### Types (3)

1. **MarketSummary** - Lightweight market data
   - marketAddress, creator, matchId
   - entryFee, kickoffTime, endTime, status
   - totalPool, participantCount
   - homeCount, drawCount, awayCount
   - isPublic

2. **MarketDetails** - Comprehensive market data
   - All MarketSummary fields plus:
   - outcome (optional)
   - homePercentage, drawPercentage, awayPercentage
   - prizePoolAfterFees, rewardPerWinner

3. **AggregatedStats** - System-wide statistics
   - totalMarkets, openMarkets, liveMarkets, resolvedMarkets
   - totalParticipants, totalVolume

### Enums (2)

1. **MarketResult**
   - Win
   - Loss

2. **SortOption**
   - CreationTime
   - PoolSize
   - ParticipantCount
   - EndingSoon

### Errors (3)

- 6000: StatOverflow - Statistics overflow
- 6001: InvalidPageSize - Invalid page size
- 6002: InvalidSortOption - Invalid sort option

## Usage

### In TypeScript/JavaScript

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { CryptoscoreDashboard, IDL } from './target/types/cryptoscore_dashboard';

// Create program instance
const program = new Program<CryptoscoreDashboard>(
  IDL,
  provider
);

// Call updateUserStats
await program.methods
  .updateUserStats(
    { win: {} }, // MarketResult enum
    new BN(1000000), // amountWagered
    new BN(2000000)  // amountWon
  )
  .accounts({
    userStats: userStatsPda,
    user: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### In Frontend (React)

```typescript
import DashboardIDL from './abi/CryptoScoreDashboard.json';

// Use with Anchor or custom RPC calls
const program = new Program(DashboardIDL, provider);
```

## Notes

- View functions (getAllMarkets, getUserMarkets, getMarketDetails, getMarketStats) are meant to be called off-chain
- The contract returns empty/default values for view functions as clients should fetch and aggregate data directly
- UserStats account uses PDA with seeds: `["user_stats", user.key()]`
- All numeric types properly mapped (u8, u32, u64, i32, i64)
- Optional types properly represented with `{ "option": "type" }`

## Verification

All three copies of the IDL are identical (420 lines each):
- ✅ solana/target/idl/cryptoscore_dashboard.json
- ✅ dapp-react/abi/CryptoScoreDashboard.json
- ✅ solana/app/abi/CryptoScoreDashboard.json

## Next Steps

The IDL is now ready for use in:
1. Frontend integration with Anchor
2. TypeScript type checking
3. Client-side program interaction
4. Testing and development

---

**Generated:** 2024-11-29  
**Program ID:** 95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR  
**Status:** ✅ Complete
