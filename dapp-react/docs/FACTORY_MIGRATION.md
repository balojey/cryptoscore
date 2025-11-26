# Factory Contract Migration

## Overview

Migrated from expensive Dashboard contract queries to more efficient Factory contract queries with frontend filtering and aggregation.

## Changes Made

### 1. FeaturedMarketsPreview.tsx
**Before:** Used `getMarketsDashboardPaginated` from Dashboard contract
**After:** Uses `getAllMarkets` from Factory contract + individual market queries

**Benefits:**
- Reduced gas costs for contract calls
- More efficient data fetching
- Better control over filtering logic

**Implementation:**
1. Fetch all markets from Factory (`getAllMarkets`)
2. Filter public markets in frontend
3. Fetch detailed data from individual market contracts using `useReadContracts`
4. Combine factory data with market details

### 2. LiveMetrics.tsx
**Before:** Used `getMarketsDashboardPaginated` from Dashboard contract
**After:** Uses `getAllMarkets` from Factory contract + individual market queries

**Benefits:**
- Real-time metrics without expensive dashboard queries
- Scalable to any number of markets
- Reduced blockchain load

**Implementation:**
1. Fetch all markets from Factory
2. Fetch detailed data (participants, predictions, resolved status) from each market
3. Calculate metrics in frontend (TVL, active traders, resolved markets)

### 3. TradingTerminal.tsx
**Before:** Used `getMarketsDashboardPaginated` from Dashboard contract
**After:** Uses `getAllMarkets` from Factory contract + individual market queries

**Benefits:**
- Faster terminal loading
- More efficient data updates
- Better error handling with cached data

**Implementation:**
1. Fetch all markets from Factory
2. Fetch detailed data from individual markets
3. Combine and transform data for terminal components
4. Maintain cached data for offline/error scenarios

### 4. UserMarkets.tsx
**Before:** Used `getUserMarketsDashboardPaginated` from Dashboard contract
**After:** Uses `getUserMarkets` from Factory contract + individual market queries

**Benefits:**
- Direct user market lookup without pagination overhead
- Efficient filtering of user-specific markets
- Reduced contract complexity

**Implementation:**
1. Fetch user's market addresses from Factory (`getUserMarkets`)
2. Fetch market info from Factory for each address (`getMarketInfo`)
3. Fetch detailed data from individual market contracts
4. Combine all data into Market objects

## Technical Details

### Factory Contract Functions Used
- `getAllMarkets()` - Returns array of MarketInfo structs
- `getUserMarkets(address)` - Returns array of market addresses for a user
- `getMarketInfo(address)` - Returns MarketInfo for a specific market

### Market Contract Functions Used
- `getParticipantsCount()` - Returns number of participants
- `getPredictionCounts()` - Returns (homeCount, awayCount, drawCount)
- `resolved()` - Returns boolean resolved status

### Data Flow
```
Factory Contract (lightweight)
    ↓
Market Addresses + Basic Info
    ↓
Individual Market Contracts (parallel queries)
    ↓
Detailed Market Data
    ↓
Frontend Aggregation & Filtering
    ↓
UI Components
```

## Performance Improvements

### Before (Dashboard Contract)
- Single expensive contract call with nested loops
- High gas costs for complex queries
- Limited scalability
- Pagination required for large datasets

### After (Factory + Markets)
- Multiple lightweight contract calls
- Parallel execution with `useReadContracts`
- Frontend filtering and aggregation
- Better caching and error handling
- Scalable to thousands of markets

## Migration Checklist

- [x] Update FeaturedMarketsPreview.tsx
- [x] Update LiveMetrics.tsx
- [x] Update TradingTerminal.tsx
- [x] Update UserMarkets.tsx
- [x] Fix TypeScript errors
- [x] Test all components
- [ ] Deploy and verify on testnet
- [ ] Monitor performance improvements

## Testing Notes

Test the following scenarios:
1. **No markets** - Empty state handling
2. **Few markets (< 10)** - Normal display
3. **Many markets (> 50)** - Performance and filtering
4. **Network errors** - Cached data fallback
5. **User with no markets** - Empty user markets
6. **User with many markets** - Pagination and display

## Rollback Plan

If issues arise, revert to Dashboard contract by:
1. Restore previous imports (Dashboard ABI and address)
2. Restore previous query functions
3. Remove individual market queries
4. Redeploy frontend

## Future Optimizations

1. **Batch Market Queries** - Create a helper contract to batch multiple market queries
2. **Indexing Service** - Use The Graph or similar for complex queries
3. **WebSocket Updates** - Real-time updates instead of polling
4. **Local Caching** - IndexedDB for persistent client-side cache
5. **Lazy Loading** - Load market details on-demand instead of all at once

---

**Migration Date:** 2024-11-26
**Status:** Complete ✅
