# IDL Integration Guide

## Overview

This guide explains how to properly integrate Solana program IDLs with the CryptoScore frontend application.

## IDL Files Location

All IDL files are located in `app/src/idl/`:
- `cryptoscore_dashboard.json` - Dashboard program IDL
- `cryptoscore_factory.json` - Factory program IDL
- `cryptoscore_market.json` - Market program IDL

These files are automatically copied from `target/idl/` during the build process via the `copy-idls.js` script.

## Program Configuration

**File:** `app/src/config/programs.ts`

```typescript
// Import IDLs
export { default as FactoryIDL } from "../idl/cryptoscore_factory.json"
export { default as MarketIDL } from "../idl/cryptoscore_market.json"
export { default as DashboardIDL } from "../idl/cryptoscore_dashboard.json"

// Program IDs
export const FACTORY_PROGRAM_ID = "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP"
export const MARKET_PROGRAM_ID = "94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ"
export const DASHBOARD_PROGRAM_ID = "95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR"
```

## Using Program Instances

### 1. Get Program Instances

**File:** `app/src/hooks/useSolanaProgram.ts`

```typescript
import { useSolanaProgram } from './hooks/useSolanaProgram'

function MyComponent() {
  const { 
    factoryProgram, 
    marketProgram, 
    dashboardProgram,
    isReady 
  } = useSolanaProgram()
  
  // Use programs...
}
```

### 2. Call View Functions

View functions don't require accounts and return data directly:

```typescript
// Get market stats
const stats = await dashboardProgram.methods
  .getMarketStats()
  .view()

// Get all markets
const markets = await dashboardProgram.methods
  .getAllMarkets(
    null,              // filterStatus
    true,              // filterVisibility (public only)
    { creationTime: {} }, // sortBy
    0,                 // page
    100                // pageSize
  )
  .view()

// Get user markets
const userMarkets = await dashboardProgram.methods
  .getUserMarkets(
    userPubkey,        // user
    null,              // filterStatus
    { creationTime: {} }, // sortBy
    0,                 // page
    100                // pageSize
  )
  .view()
```

### 3. Fetch Account Data

Fetch specific account data using PDAs:

```typescript
// Fetch UserStats account
const [userStatsPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('user_stats'), userPubkey.toBuffer()],
  new PublicKey(DASHBOARD_PROGRAM_ID)
)

const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda)

// Fetch all UserStats accounts
const allUserStats = await dashboardProgram.account.userStats.all()

// Fetch Market account
const market = await marketProgram.account.market.fetch(marketPubkey)

// Fetch all MarketRegistry accounts
const registries = await factoryProgram.account.marketRegistry.all()
```

### 4. Call Instructions

Instructions require accounts and may modify state:

```typescript
// Create market (two-step process)
// Step 1: Initialize the Market account
await marketProgram.methods
  .initializeMarket(
    matchId,
    entryFee,
    kickoffTime,
    endTime,
    isPublic
  )
  .accounts({
    market: marketPda,
    factory: factoryPda,
    creator: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()

// Step 2: Register in Factory
await factoryProgram.methods
  .createMarket(
    matchId,
    entryFee,
    kickoffTime,
    endTime,
    isPublic
  )
  .accounts({
    factory: factoryPda,
    marketRegistry: marketRegistryPda,
    marketAccount: marketPda,
    creator: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()

// Join market
await marketProgram.methods
  .joinMarket({ home: {} }) // MatchOutcome enum
  .accounts({
    market: marketPda,
    participant: participantPda,
    user: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()

// Resolve market
await marketProgram.methods
  .resolveMarket({ away: {} }) // MatchOutcome enum
  .accounts({
    market: marketPda,
    creator: wallet.publicKey,
  })
  .rpc()
```

## Dashboard IDL Reference

### View Functions

#### getMarketStats()
Returns aggregated statistics across all markets.

**Returns:**
```typescript
{
  totalMarkets: number
  openMarkets: number
  liveMarkets: number
  resolvedMarkets: number
  totalParticipants: number
  totalVolume: BN // in lamports
}
```

**Usage:**
```typescript
const stats = await dashboardProgram.methods.getMarketStats().view()
```

#### getAllMarkets(filterStatus, filterVisibility, sortBy, page, pageSize)
Returns paginated list of all markets.

**Parameters:**
- `filterStatus`: `number | null` - Filter by status (0=Open, 1=Live, 2=Resolved, 3=Cancelled)
- `filterVisibility`: `boolean | null` - Filter by public/private
- `sortBy`: `SortOption` - Sort option enum
- `page`: `number` - Page number (0-indexed)
- `pageSize`: `number` - Items per page (max 100)

**Returns:**
```typescript
Array<{
  marketAddress: PublicKey
  creator: PublicKey
  matchId: string
  entryFee: BN
  kickoffTime: BN
  endTime: BN
  status: number
  totalPool: BN
  participantCount: number
  homeCount: number
  drawCount: number
  awayCount: number
  isPublic: boolean
}>
```

**Usage:**
```typescript
const markets = await dashboardProgram.methods
  .getAllMarkets(
    null,                    // all statuses
    true,                    // public only
    { creationTime: {} },    // sort by creation time
    0,                       // first page
    50                       // 50 items
  )
  .view()
```

#### getUserMarkets(user, filterStatus, sortBy, page, pageSize)
Returns paginated list of markets for a specific user.

**Parameters:**
- `user`: `PublicKey` - User's public key
- `filterStatus`: `number | null` - Filter by status
- `sortBy`: `SortOption` - Sort option enum
- `page`: `number` - Page number
- `pageSize`: `number` - Items per page (max 100)

**Returns:** Same as `getAllMarkets`

**Usage:**
```typescript
const userMarkets = await dashboardProgram.methods
  .getUserMarkets(
    userPubkey,
    null,
    { poolSize: {} },        // sort by pool size
    0,
    50
  )
  .view()
```

#### getMarketDetails(market)
Returns detailed information about a specific market.

**Parameters:**
- `market`: `PublicKey` - Market address

**Returns:**
```typescript
{
  marketAddress: PublicKey
  creator: PublicKey
  matchId: string
  entryFee: BN
  kickoffTime: BN
  endTime: BN
  status: number
  outcome: number | null
  totalPool: BN
  participantCount: number
  homeCount: number
  drawCount: number
  awayCount: number
  isPublic: boolean
  homePercentage: number
  drawPercentage: number
  awayPercentage: number
  prizePoolAfterFees: BN
  rewardPerWinner: BN
}
```

**Usage:**
```typescript
const details = await dashboardProgram.methods
  .getMarketDetails(marketPubkey)
  .view()
```

### Accounts

#### UserStats
Tracks user statistics across all markets.

**PDA Seeds:** `['user_stats', user.toBuffer()]`

**Structure:**
```typescript
{
  user: PublicKey
  totalMarkets: number
  wins: number
  losses: number
  totalWagered: BN
  totalWon: BN
  currentStreak: number  // positive for wins, negative for losses
  bestStreak: number
  lastUpdated: BN
  bump: number
}
```

**Fetch:**
```typescript
// Single user
const [userStatsPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('user_stats'), userPubkey.toBuffer()],
  dashboardProgramId
)
const stats = await dashboardProgram.account.userStats.fetch(userStatsPda)

// All users
const allStats = await dashboardProgram.account.userStats.all()
```

### Instructions

#### updateUserStats(marketResult, amountWagered, amountWon)
Updates user statistics after market resolution.

**Parameters:**
- `marketResult`: `{ Win } | { Loss }` - Result enum
- `amountWagered`: `BN` - Amount wagered in lamports
- `amountWon`: `BN` - Amount won in lamports

**Accounts:**
- `userStats`: UserStats PDA (mut)
- `user`: User's public key (signer, mut)
- `systemProgram`: System program

**Usage:**
```typescript
await dashboardProgram.methods
  .updateUserStats(
    { win: {} },
    new BN(1000000000), // 1 SOL wagered
    new BN(1950000000)  // 1.95 SOL won
  )
  .accounts({
    userStats: userStatsPda,
    user: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

## Enums

### MarketStatus
```typescript
enum MarketStatus {
  Open = 0,
  Live = 1,
  Resolved = 2,
  Cancelled = 3
}
```

### MatchOutcome
```typescript
enum MatchOutcome {
  Home = 0,
  Draw = 1,
  Away = 2
}
```

### SortOption
```typescript
enum SortOption {
  CreationTime = { creationTime: {} },
  PoolSize = { poolSize: {} },
  ParticipantCount = { participantCount: {} },
  EndingSoon = { endingSoon: {} }
}
```

### MarketResult
```typescript
enum MarketResult {
  Win = { win: {} },
  Loss = { loss: {} }
}
```

## Best Practices

### 1. Rate Limiting
Always implement rate limiting to avoid overwhelming the RPC:

```typescript
const lastFetchTime = useRef<number>(0)
const rateLimitDelay = 2000 // 2 seconds

const now = Date.now()
const timeSinceLastFetch = now - lastFetchTime.current
if (timeSinceLastFetch < rateLimitDelay) {
  await new Promise(resolve => 
    setTimeout(resolve, rateLimitDelay - timeSinceLastFetch)
  )
}
lastFetchTime.current = Date.now()
```

### 2. Error Handling
Handle errors gracefully and provide fallbacks:

```typescript
try {
  const data = await dashboardProgram.methods.getMarketStats().view()
  return data
} catch (error) {
  console.error('Error fetching stats:', error)
  return {
    totalMarkets: 0,
    openMarkets: 0,
    liveMarkets: 0,
    resolvedMarkets: 0,
    totalParticipants: 0,
    totalVolume: 0,
  }
}
```

### 3. BigInt Conversion
Always convert BN to BigInt for consistency:

```typescript
const entryFee = BigInt(market.entryFee.toString())
const totalPool = BigInt(market.totalPool.toString())
```

### 4. React Query Integration
Use React Query for caching and automatic refetching:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['dashboard', 'stats'],
  queryFn: fetchStats,
  staleTime: 10000,      // 10 seconds
  refetchInterval: 30000, // 30 seconds
  retry: 3,
})
```

### 5. Type Safety
Always use proper TypeScript types:

```typescript
import type { CryptoscoreDashboard } from '../../../target/types/cryptoscore_dashboard'

const dashboardProgram = new Program<CryptoscoreDashboard>(
  DashboardIDL as CryptoscoreDashboard,
  programId,
  provider
)
```

## Common Patterns

### Fetching User Data
```typescript
export function useUserStats(userAddress?: string) {
  const { dashboardProgram, isReady } = useSolanaProgram()
  
  return useQuery({
    queryKey: ['userStats', userAddress],
    queryFn: async () => {
      if (!userAddress || !dashboardProgram) return null
      
      const userPubkey = new PublicKey(userAddress)
      const [userStatsPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_stats'), userPubkey.toBuffer()],
        new PublicKey(DASHBOARD_PROGRAM_ID)
      )
      
      return await dashboardProgram.account.userStats.fetch(userStatsPda)
    },
    enabled: isReady && !!userAddress,
  })
}
```

### Fetching Market List
```typescript
export function useAllMarkets(page = 0, pageSize = 100) {
  const { dashboardProgram, isReady } = useSolanaProgram()
  
  return useQuery({
    queryKey: ['markets', page, pageSize],
    queryFn: async () => {
      if (!dashboardProgram) return []
      
      return await dashboardProgram.methods
        .getAllMarkets(null, null, { creationTime: {} }, page, pageSize)
        .view()
    },
    enabled: isReady,
  })
}
```

### Creating Transactions
```typescript
export async function createMarket(
  factoryProgram: Program,
  wallet: WalletContextState,
  matchId: string,
  entryFee: BN,
  kickoffTime: BN,
  endTime: BN,
  isPublic: boolean
) {
  const [factoryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('factory')],
    factoryProgram.programId
  )
  
  const [marketPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('market'), Buffer.from(matchId)],
    new PublicKey(MARKET_PROGRAM_ID)
  )
  
  const [marketRegistryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('market_registry'), marketPda.toBuffer()],
    factoryProgram.programId
  )
  
  const tx = await factoryProgram.methods
    .createMarket(matchId, entryFee, kickoffTime, endTime, isPublic)
    .accounts({
      factory: factoryPda,
      marketRegistry: marketRegistryPda,
      marketAccount: marketPda,
      creator: wallet.publicKey!,
      systemProgram: SystemProgram.programId,
    })
    .rpc()
  
  return tx
}
```

## Troubleshooting

### Issue: "Program account not found"
**Solution:** Ensure programs are deployed and program IDs are correct in `config/programs.ts`

### Issue: "Account does not exist"
**Solution:** Check PDA derivation seeds match the program's implementation

### Issue: "Invalid account data"
**Solution:** Verify IDL version matches deployed program version

### Issue: "Transaction simulation failed"
**Solution:** Check account permissions and ensure all required accounts are provided

### Issue: "Rate limit exceeded"
**Solution:** Implement rate limiting and use caching with React Query

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [React Query Documentation](https://tanstack.com/query/latest)

---

**Last Updated:** 2024-11-29
**Version:** 1.0.0
