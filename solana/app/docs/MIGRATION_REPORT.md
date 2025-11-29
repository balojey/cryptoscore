# Solana Migration Report - Content.tsx Component Tree

## Overview
This report documents the Polkadot/EVM dependencies found in the Content.tsx component and its children that need to be migrated to Solana.

## Component Tree Analysis

### ✅ Content.tsx (solana/app/src/components/Content.tsx)
**Status**: READY - No Polkadot dependencies
- Uses React Router for navigation
- Uses theme CSS variables
- Modal management is framework-agnostic

### ⚠️ Markets.tsx (solana/app/src/components/market/Markets.tsx)
**Status**: NEEDS MIGRATION
**Issues**:
1. ❌ Imports `useAccount` and `useContractRead` from `wagmi`
2. ❌ Uses `CRYPTO_SCORE_FACTORY_ADDRESS` and `CryptoScoreFactoryABI`
3. ❌ Calls `getAllMarkets()` contract function
4. ❌ Uses Ethereum address format (`0x${string}`)

**Required Changes**:
- Replace `useAccount` with `useWallet` from `@solana/wallet-adapter-react`
- Replace `useContractRead` with Solana program queries
- Update to use Solana PublicKey format
- Fetch markets from Solana Dashboard program

### ⚠️ PublicMarkets.tsx (solana/app/src/components/market/PublicMarkets.tsx)
**Status**: NEEDS MIGRATION
**Issues**:
1. ❌ Imports `useAccount`, `useReadContract`, `useReadContracts` from `wagmi`
2. ❌ Uses contract addresses and ABIs
3. ❌ Calls multiple contract functions (getAllMarkets, resolved, winner, etc.)
4. ❌ Uses Ethereum address format
5. ❌ Uses `useEnhancedRealtimeMarkets` hook (which may have Polkadot dependencies)

**Required Changes**:
- Replace wagmi hooks with Solana wallet adapter
- Use `useMarketData` hook for fetching market data
- Update address format to Solana PublicKey
- Verify real-time hooks are Solana-compatible

### ⚠️ UserMarkets.tsx (solana/app/src/components/market/UserMarkets.tsx)
**Status**: PARTIALLY MIGRATED
**Issues**:
1. ✅ Already uses `useWallet` from `@solana/wallet-adapter-react`
2. ✅ Uses `useMarketData` hook
3. ⚠️ Type conversion from `MarketData` to `Market` may need adjustment
4. ⚠️ Uses Ethereum address format in type casting (`as \`0x${string}\``)

**Required Changes**:
- Remove Ethereum address format casting
- Update Market type to use Solana PublicKey strings

### ⚠️ Market.tsx (solana/app/src/components/market/Market.tsx)
**Status**: MOSTLY MIGRATED
**Issues**:
1. ✅ Uses `useWallet` from Solana wallet adapter
2. ✅ Uses `useMarketActions` hook
3. ✅ Uses SOL and lamports
4. ⚠️ Props type uses `marketAddress?: \`0x${string}\`` (Ethereum format)
5. ✅ Solana Explorer links implemented

**Required Changes**:
- Update MarketProps type to use string instead of `0x${string}`

### ⚠️ EnhancedMarketCard.tsx (solana/app/src/components/cards/EnhancedMarketCard.tsx)
**Status**: MOSTLY MIGRATED
**Issues**:
1. ✅ Uses `useWallet` from Solana wallet adapter
2. ✅ Uses `useMatchData` and `useMarketData` hooks
3. ✅ Uses SOL formatting
4. ⚠️ Market type uses Ethereum address format

**Required Changes**:
- Ensure Market type is updated to use Solana addresses

## Supporting Files Status

### ⚠️ config/contracts.ts
**Status**: COMPATIBILITY LAYER
- Currently provides mock Ethereum addresses for Solana program IDs
- Empty ABIs as placeholders
- This is intentional for gradual migration

### ⚠️ types.ts
**Status**: NEEDS UPDATE
**Issues**:
1. ❌ Market type uses `string` for addresses (good) but some components cast to `0x${string}`
2. ❌ MarketProps uses `marketAddress?: \`0x${string}\``

**Required Changes**:
- Remove all `0x${string}` type annotations
- Ensure all address fields are plain `string` type

### ⚠️ hooks/useMarketData.ts
**Status**: READY (Stubbed)
- Already structured for Solana
- Uses Solana program hooks
- Returns empty data until Dashboard program is deployed
- ✅ No Polkadot dependencies

### ⚠️ hooks/useMarketActions.ts
**Status**: READY (Stubbed)
- Already structured for Solana
- Uses Solana wallet adapter
- Stubbed implementations ready for program deployment
- ✅ No Polkadot dependencies

### ⚠️ hooks/useFilteredMarkets.ts
**Status**: READY
- Pure TypeScript logic
- No blockchain dependencies
- ✅ Framework-agnostic

### ⚠️ hooks/useEnhancedRealtimeMarkets.ts
**Status**: NEEDS VERIFICATION
- Uses `useRealtimeMarkets` and WebSocket hooks
- Need to verify these are Solana-compatible

## Migration Priority

### HIGH PRIORITY (Blocking Content.tsx functionality)
1. **Markets.tsx** - Market creation component
2. **PublicMarkets.tsx** - Main market listing
3. **types.ts** - Remove Ethereum address types

### MEDIUM PRIORITY (Partial functionality available)
4. **UserMarkets.tsx** - Minor type fixes
5. **Market.tsx** - Minor type fixes
6. **EnhancedMarketCard.tsx** - Minor type fixes

### LOW PRIORITY (Already compatible)
7. Real-time hooks verification
8. WebSocket implementation verification

## Recommended Migration Steps

### Step 1: Update Type Definitions
```typescript
// types.ts - Remove all 0x${string} types
export interface Market {
  marketAddress: string // Solana PublicKey as base58 string
  // ... rest of fields
}

export interface MarketProps {
  match: Match
  userHasMarket: boolean
  marketAddress?: string // Changed from `0x${string}`
  refetchMarkets: () => void
}
```

### Step 2: Migrate Markets.tsx
- Replace wagmi hooks with Solana hooks
- Use `useMarketData().useAllMarkets()` for fetching
- Update address handling

### Step 3: Migrate PublicMarkets.tsx
- Replace wagmi hooks with Solana hooks
- Use `useMarketData().useAllMarkets()` for fetching
- Update pagination logic for Solana

### Step 4: Fix Minor Type Issues
- Update UserMarkets.tsx type casting
- Update Market.tsx props type
- Update EnhancedMarketCard.tsx type usage

## Blockers

### Critical Blockers
1. ❌ **Dashboard Program Not Deployed** - Cannot fetch market data
2. ❌ **Factory Program Not Deployed** - Cannot create markets
3. ❌ **Market Program Not Deployed** - Cannot interact with markets

### Workarounds
- Use stubbed data for development
- Mock responses in hooks
- Test UI/UX without blockchain interaction

## Testing Checklist

Once programs are deployed:
- [ ] Market creation flow works
- [ ] Public markets display correctly
- [ ] User markets display correctly
- [ ] Market cards show correct data
- [ ] Filtering and sorting work
- [ ] Pagination works
- [ ] Real-time updates work
- [ ] Address formatting is correct
- [ ] SOL amounts display correctly
- [ ] Transaction links work

## Estimated Migration Time
- Type updates: 30 minutes
- Markets.tsx migration: 2 hours
- PublicMarkets.tsx migration: 2 hours
- Testing and fixes: 2 hours
- **Total: ~6-7 hours** (after programs are deployed)

## Notes
- The migration is well-structured with clear separation of concerns
- Most hooks are already Solana-ready (just stubbed)
- Main work is replacing wagmi contract calls with Solana program calls
- Type system needs cleanup to remove Ethereum address formats
