# Solana IDL Integration Guide

## Overview

This guide explains how the CryptoScore frontend integrates with the Solana programs using the generated IDLs. The integration provides type-safe access to on-chain data and enables real-time market updates.

## Architecture

### Programs

1. **Factory Program** (`cryptoscore_factory`)
   - Manages market creation and registry
   - Tracks all markets system-wide
   - Provides market discovery functionality

2. **Market Program** (`cryptoscore_market`)
   - Individual market logic
   - Handles predictions, resolutions, and rewards
   - Stores market state and participant data

3. **Dashboard Program** (`cryptoscore_dashboard`)
   - Aggregates market data for efficient queries
   - Provides user statistics
   - Enables filtered and sorted market views

## IDL Files

Located in `solana/app/src/idl/`:
- `cryptoscore_factory.json` - Factory program interface
- `cryptoscore_market.json` - Market program interface
- `cryptoscore_dashboard.json` - Dashboard program interface

These files are auto-generated from the Rust programs and copied during build.

## Integration Points

### 1. Configuration (`src/config/programs.ts`)

```typescript
// Program IDs (set via environment variables or defaults)
export const FACTORY_PROGRAM_ID = "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP"
export const MARKET_PROGRAM_ID = "94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ"
export const DASHBOARD_PROGRAM_ID = "95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR"

// IDL imports
export { default as FactoryIDL } from "../idl/cryptoscore_factory.json"
export { default as MarketIDL } from "../idl/cryptoscore_market.json"
export { default as DashboardIDL } from "../idl/cryptoscore_dashboard.json"
```

### 2. Data Fetching Hooks (`src/hooks/useDashboardData.ts`)

#### `useAllMarkets()`
Fetches all markets from the Dashboard program using `getAllMarkets` view function.

**Usage:**
```typescript
const { data: markets, isLoading, error } = useAllMarkets({
  offset: 0,
  limit: 1000,
  publicOnly: false,
})
```

**IDL Method:**
```rust
pub fn get_all_markets(
    filter_status: Option<u8>,
    filter_visibility: Option<bool>,
    sort_by: SortOption,
    page: u32,
    page_size: u32,
) -> Vec<MarketSummary>
```

#### `useDashboardData()`
Fetches user-specific markets (created and joined) using `getUserMarkets` view function.

**Usage:**
```typescript
const { createdMarkets, joinedMarkets, allInvolvedMarkets } = useDashboardData(userAddress)
```

**IDL Method:**
```rust
pub fn get_user_markets(
    user: Pubkey,
    filter_status: Option<u8>,
    sort_by: SortOption,
    page: u32,
    page_size: u32,
) -> Vec<MarketSummary>
```

#### `useFactoryMarkets()`
Fetches all markets from the Factory program's registry.

**Usage:**
```typescript
const { data: markets } = useFactoryMarkets()
```

**IDL Method:**
```rust
pub fn get_markets(
    filter_creator: Option<Pubkey>,
    filter_public: Option<bool>,
    page: u32,
    page_size: u32,
) -> Vec<MarketRegistry>
```

#### `useMarketDetails()`
Fetches detailed data for specific market addresses by reading Market accounts.

**Usage:**
```typescript
const { data: details } = useMarketDetails(marketAddresses)
```

**Implementation:**
- Fetches Market account data using `connection.getAccountInfo()`
- Decodes using `program.coder.accounts.decode('Market', data)`

### 3. Helper Utilities (`src/utils/solana-helpers.ts`)

Provides type-safe wrappers and utility functions:

**Program Instances:**
```typescript
getFactoryProgram(connection, wallet)
getMarketProgram(connection, wallet)
getDashboardProgram(connection, wallet)
```

**PDA Derivation:**
```typescript
getFactoryPDA()
getMarketPDA(factory, marketCount)
getMarketRegistryPDA(factory, marketAddress)
getParticipantPDA(market, user)
getUserStatsPDA(user)
```

**Data Transformations:**
```typescript
transformMarketSummary(summary) // Dashboard -> Market
transformMarketDetails(details) // Dashboard -> MarketDashboardInfo
lamportsToSOL(lamports) // Convert lamports to SOL
solToLamports(sol) // Convert SOL to lamports
calculatePoolSize(entryFee, participantCount)
calculateDistribution(homeCount, drawCount, awayCount)
```

**Market Status Helpers:**
```typescript
isMarketOpen(market) // Can join
isMarketLive(market) // Started but not resolved
isEndingSoon(market) // < 24 hours until start
getMarketStatusString(market) // "Open" | "Live" | "Resolved"
getTimeUntilStart(market) // Seconds until kickoff
```

**Outcome Formatting:**
```typescript
formatOutcome(outcome) // 0 -> "HOME", 1 -> "DRAW", 2 -> "AWAY"
parseOutcome(string) // "HOME" -> 0, "DRAW" -> 1, "AWAY" -> 2
```

### 4. Component Integration

#### TradingTerminal (`src/pages/TradingTerminal.tsx`)

Main dashboard that displays market overview and analytics.

```typescript
// Fetch all markets
const { data: markets, isLoading, error, refetch } = useAllMarkets({
  offset: 0,
  limit: 1000,
  publicOnly: false,
})

// Real-time updates
const realtimeStatus = useSimpleRealtimeMarkets(
  markets,
  DASHBOARD_PROGRAM_ID,
  false // WebSocket disabled until programs deployed
)
```

#### MetricsBar (`src/components/terminal/MetricsBar.tsx`)

Displays aggregated statistics across all markets.

```typescript
// Fetch from factory for comprehensive data
const { data: factoryMarkets } = useFactoryMarkets()

// Get detailed market data
const marketAddresses = factoryMarkets.map(m => m.marketAddress)
const { data: marketDetails } = useMarketDetails(marketAddresses)

// Calculate metrics
const totalMarkets = markets.length
const totalValueLocked = markets.reduce((sum, m) => 
  sum + calculatePoolSize(m.entryFee, m.participantsCount), 0
)
```

#### FeaturedMarkets (`src/components/terminal/FeaturedMarkets.tsx`)

Displays curated list of interesting markets.

```typescript
// Selection algorithm
function selectFeaturedMarkets(markets: Market[]): FeaturedMarket[] {
  // 1. Top 3 by pool size (Hot)
  // 2. Top 2 ending soon (< 24 hours)
  // 3. Top 2 by participants (Popular)
  return featured.slice(0, 7)
}
```

#### TopMovers (`src/components/terminal/TopMovers.tsx`)

Shows markets with significant recent activity.

```typescript
// Calculate movers based on:
// - Pool size increase
// - New participants
// - Distribution shifts
function calculateTopMovers(markets: Market[]): TopMover[]
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Solana Programs                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Factory    │  │    Market    │  │  Dashboard   │      │
│  │   Program    │  │   Program    │  │   Program    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ RPC Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Anchor Provider                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Program Instances (with IDLs)                       │   │
│  │  - Factory: getMarkets()                             │   │
│  │  - Market: account.market.fetch()                    │   │
│  │  - Dashboard: getAllMarkets(), getUserMarkets()      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ React Query
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Custom Hooks                               │
│  - useAllMarkets()                                           │
│  - useDashboardData()                                        │
│  - useFactoryMarkets()                                       │
│  - useMarketDetails()                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Props
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Components                                 │
│  - TradingTerminal                                           │
│  - MetricsBar                                                │
│  - FeaturedMarkets                                           │
│  - TopMovers                                                 │
│  - RecentActivity                                            │
└─────────────────────────────────────────────────────────────┘
```

## Type Mappings

### Solana Program Types → TypeScript Types

**MarketSummary (Dashboard IDL):**
```rust
pub struct MarketSummary {
    pub market_address: Pubkey,
    pub creator: Pubkey,
    pub match_id: String,
    pub entry_fee: u64,
    pub kickoff_time: i64,
    pub end_time: i64,
    pub status: u8,
    pub total_pool: u64,
    pub participant_count: u32,
    pub home_count: u32,
    pub draw_count: u32,
    pub away_count: u32,
    pub is_public: bool,
}
```

**Market (TypeScript):**
```typescript
interface Market {
  marketAddress: string // Pubkey as base58 string
  matchId: bigint // String parsed to bigint
  entryFee: bigint // u64 as bigint (lamports)
  creator: string // Pubkey as base58 string
  participantsCount: bigint // u32 as bigint
  resolved: boolean // status === 2
  isPublic: boolean
  startTime: bigint // i64 as bigint (Unix timestamp)
  homeCount?: bigint // u32 as bigint
  awayCount?: bigint // u32 as bigint
  drawCount?: bigint // u32 as bigint
}
```

### Status Enums

**Solana:**
```rust
pub enum MarketStatus {
    Open,      // 0
    Live,      // 1
    Resolved,  // 2
    Cancelled, // 3
}
```

**TypeScript:**
```typescript
enum MarketStatus {
  Open = 0,
  Live = 1,
  Resolved = 2,
  Cancelled = 3,
}
```

### Outcome Enums

**Solana:**
```rust
pub enum MatchOutcome {
    Home, // 0
    Draw, // 1
    Away, // 2
}
```

**TypeScript:**
```typescript
enum MatchOutcome {
  Home = 0,
  Draw = 1,
  Away = 2,
}
```

## Error Handling

All hooks implement comprehensive error handling:

1. **Rate Limiting**: 2-second minimum delay between requests
2. **Retry Logic**: Exponential backoff (3 retries max)
3. **Graceful Degradation**: Return empty arrays on error
4. **User Feedback**: Error messages passed to components

```typescript
try {
  // Fetch data
} catch (error) {
  if (error.includes('429') || error.includes('Too Many Requests')) {
    console.warn('Rate limit hit, will retry with backoff')
    return []
  }
  console.error('Error fetching data:', error)
  throw error
}
```

## Real-Time Updates

The system supports two update mechanisms:

1. **Polling** (Active): 10-30 second intervals via React Query
2. **WebSocket** (Planned): Account change subscriptions

```typescript
// Polling configuration
staleTime: 15000,        // 15 seconds
refetchInterval: 30000,  // 30 seconds
retry: 3,
retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
```

## Performance Optimizations

1. **React Query Caching**: Automatic caching and deduplication
2. **Rate Limiting**: Prevents excessive RPC calls
3. **Batch Fetching**: Multiple markets fetched in parallel
4. **Lazy Loading**: Components load data only when needed
5. **Virtual Scrolling**: Efficient rendering of large lists

## Deployment Checklist

Before deploying to production:

- [ ] Update program IDs in `.env` files
- [ ] Verify IDL files are up to date
- [ ] Test all hooks with deployed programs
- [ ] Enable WebSocket subscriptions
- [ ] Configure RPC endpoint for production
- [ ] Test error handling and fallbacks
- [ ] Verify rate limiting works correctly
- [ ] Test with multiple wallets
- [ ] Validate data transformations
- [ ] Check performance with large datasets

## Troubleshooting

### Common Issues

**"Program account not found"**
- Ensure programs are deployed to the correct network
- Verify program IDs in config match deployed addresses

**"Account does not exist"**
- Market may not be initialized yet
- Check if PDA derivation is correct

**"Type instantiation is excessively deep"**
- Add explicit type annotations to program instances
- Cast to `any` if necessary: `const program: any = new Program(...)`

**"Rate limit exceeded"**
- Increase `rateLimitDelay` in hooks
- Reduce `refetchInterval` in React Query config

**"Invalid account data"**
- Verify IDL matches deployed program
- Check account discriminator
- Ensure correct account type being decoded

## Testing

### Manual Testing

```typescript
// Test market fetching
const markets = await useAllMarkets({ limit: 10 })
console.log('Fetched markets:', markets.length)

// Test user data
const userData = await useDashboardData(userAddress)
console.log('Created:', userData.createdMarkets.length)
console.log('Joined:', userData.joinedMarkets.length)

// Test market details
const details = await useMarketDetails([marketAddress])
console.log('Market details:', details[0])
```

### Integration Testing

1. Deploy programs to devnet
2. Create test markets
3. Join markets with test wallets
4. Verify data appears in UI
5. Test real-time updates
6. Validate error handling

## Future Enhancements

1. **WebSocket Integration**: Real-time account change subscriptions
2. **GraphQL Layer**: Efficient data aggregation and caching
3. **Indexer**: Off-chain indexing for faster queries
4. **Optimistic Updates**: Instant UI feedback before confirmation
5. **Batch Transactions**: Multiple operations in single transaction
6. **Program Upgrades**: Support for program versioning

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [React Query](https://tanstack.com/query/latest)
- [Solana Cookbook](https://solanacookbook.com/)

## Support

For issues or questions:
1. Check this guide first
2. Review program IDLs in `solana/app/src/idl/`
3. Check console logs for detailed errors
4. Verify network and RPC endpoint
5. Test with Solana Explorer
