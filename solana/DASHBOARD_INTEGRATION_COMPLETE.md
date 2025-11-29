# Dashboard Integration Complete

## Overview

Successfully integrated the Solana IDLs with the Dashboard component and its dependencies. All components now properly use the generated IDLs to fetch data from the Solana programs.

## Changes Made

### 1. Updated `useDashboardData.ts` Hook

**File:** `solana/app/src/hooks/useDashboardData.ts`

#### Key Improvements:

- **Proper IDL Integration**: All three programs (Dashboard, Factory, Market) now use their respective IDLs correctly
- **Type-Safe Data Fetching**: Added helper functions to parse enums and data types from Solana programs
- **Rate Limiting**: Implemented 2-second rate limiting between requests to prevent API overload
- **Error Handling**: Graceful handling of rate limits and network errors with exponential backoff

#### Functions Updated:

1. **`useDashboardData(userAddress)`**
   - Fetches user-specific markets (created and joined)
   - Uses Dashboard program's `getUserMarkets` view function
   - Separates markets into created vs joined based on creator address
   - Returns: `{ createdMarkets, joinedMarkets, allInvolvedMarkets, isLoading, error }`

2. **`useAllMarkets(options)`**
   - Fetches all markets with pagination
   - Uses Dashboard program's `getAllMarkets` view function
   - Supports filtering by status and visibility
   - Returns: Query result with Market[] array

3. **`useFactoryMarkets(options)`**
   - Fetches markets from Factory program
   - Uses Factory's `marketRegistry` account to get all registered markets
   - Fetches detailed market data from Market program for each registry entry
   - Returns: Query result with Market[] array

4. **`useMarketDetails(marketAddresses, options)`**
   - Fetches detailed data for specific market addresses
   - Uses Market program's account fetch method
   - Returns: Query result with detailed market data including totalPool and outcome

#### Helper Functions Added:

```typescript
// Parse market status enum (0=Open, 1=Live, 2=Resolved, 3=Cancelled)
const isResolved = (status: number): boolean => status === 2

// Parse match outcome enum (Home=0, Draw=1, Away=2)
const getWinner = (outcome: any): number => {
  if (!outcome) return 0
  if (outcome.home !== undefined) return 1
  if (outcome.draw !== undefined) return 3
  if (outcome.away !== undefined) return 2
  return 0
}

// Parse matchId (can be string or number from IDL)
const parseMatchId = (matchId: any): bigint => {
  if (typeof matchId === 'string') return BigInt(matchId)
  return BigInt(matchId.toString())
}
```

### 2. Fixed Type Issues

**File:** `solana/app/src/types.ts`

- Added detailed comments for `MarketDashboardInfo` interface
- Clarified winner encoding: 0=None, 1=Home, 2=Away, 3=Draw
- Documented all bigint fields (matchId, entryFee, participantsCount, etc.)

### 3. Fixed EnhancedMarketCard

**File:** `solana/app/src/components/cards/EnhancedMarketCard.tsx`

- Fixed bigint division error by converting to Number before division
- Removed unused `Participant` interface
- Properly handles lamports to SOL conversion

### 4. Dashboard Component

**File:** `solana/app/src/pages/Dashboard.tsx`

- No changes needed - already properly integrated
- Uses `useDashboardData` hook correctly
- Displays created and joined markets with filtering
- Shows portfolio summary, performance charts, and recent activity

## IDL Integration Details

### Dashboard IDL (`cryptoscore_dashboard.json`)

**View Functions Used:**
- `getAllMarkets(filterStatus, filterVisibility, sortBy, page, pageSize)` - Returns `MarketSummary[]`
- `getUserMarkets(user, filterStatus, sortBy, page, pageSize)` - Returns `MarketSummary[]`
- `getMarketDetails(market)` - Returns `MarketDetails`
- `getMarketStats()` - Returns `AggregatedStats`

**Account Types:**
- `UserStats` - User statistics (wins, losses, wagered, won, streaks)

**Data Types:**
- `MarketSummary` - Basic market info with prediction counts
- `MarketDetails` - Detailed market info with percentages and rewards
- `AggregatedStats` - Platform-wide statistics

### Factory IDL (`cryptoscore_factory.json`)

**Accounts Used:**
- `MarketRegistry` - Registry of all created markets with metadata

**Instructions:**
- `createMarket` - Creates new market (not used in Dashboard)
- `getMarkets` - View function for filtering markets

### Market IDL (`cryptoscore_market.json`)

**Accounts Used:**
- `Market` - Individual market state with predictions and pool
- `Participant` - User participation in a market

**Account Structure:**
```typescript
Market {
  factory: PublicKey
  creator: PublicKey
  matchId: string
  entryFee: u64
  kickoffTime: i64
  endTime: i64
  status: MarketStatus (Open | Live | Resolved | Cancelled)
  outcome: Option<MatchOutcome> (Home | Draw | Away)
  totalPool: u64
  participantCount: u32
  homeCount: u32
  drawCount: u32
  awayCount: u32
  isPublic: bool
  bump: u8
}
```

## Data Flow

```
Dashboard Component
    ↓
useDashboardData Hook
    ↓
Dashb