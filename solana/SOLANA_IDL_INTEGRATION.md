# Solana IDL Integration Complete

## Overview

The Solana frontend has been fully integrated with the generated IDLs for all three programs:
- **CryptoScore Factory** - Market creation and registry
- **CryptoScore Market** - Market participation and resolution
- **CryptoScore Dashboard** - Data aggregation and queries

## Integration Points

### 1. Market Data Hooks (`app/src/hooks/useMarketData.ts`)

#### `useMarketData(marketAddress)`
Fetches detailed information for a specific market using Dashboard program's `getMarketDetails` view function.

**Returns:**
```typescript
{
  marketAddress: string
  creator: string
  matchId: string
  entryFee: number
  kickoffTime: number
  endTime: number
  status: 'Open' | 'Live' | 'Resolved' | 'Cancelled'
  outcome: 'Home' | 'Draw' | 'Away' | null
  totalPool: number
  participantCount: number
  homeCount: number
  drawCount: number
  awayCount: number
  isPublic: boolean
}
```

**IDL Method:** `dashboardProgram.methods.getMarketDetails(marketPubkey).view()`

#### `useAllMarkets(page, pageSize)`
Fetches all markets with pagination using Dashboard program's `getAllMarkets` view function.

**Parameters:**
- `filterStatus`: null (all statuses)
- `filterVisibility`: null (all markets)
- `sortBy`: { creationTime: {} } (newest first)
- `page`: number
- `pageSize`: number

**IDL Method:** `dashboardProgram.methods.getAllMarkets(...).view()`

#### `useUserMarkets(userAddress)`
Fetches markets for a specific user using Dashboard program's `getUserMarkets` view function.

**Parameters:**
- `user`: PublicKey
- `filterStatus`: null (all statuses)
- `sortBy`: { creationTime: {} }
- `page`: 0
- `pageSize`: 100

**IDL Method:** `dashboardProgram.methods.getUserMarkets(...).view()`

#### `useUserStats(userAddress)`
Fetches user statistics by reading the UserStats PDA account.

**PDA Derivation:**
```typescript
const [userStatsPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('user_stats'), userPubkey.toBuffer()],
  dashboardProgram.programId
)
```

**IDL Method:** `dashboardProgram.account.userStats.fetch(userStatsPda)`

#### `useUserPrediction(marketAddress)`
Checks if user has joined a market and retrieves their prediction.

**PDA Derivation:**
```typescript
const [participantPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('participant'), marketPubkey.toBuffer(), publicKey.toBuffer()],
  marketProgram.programId
)
```

**Returns:**
```typescript
{
  predictionName: 'HOME' | 'AWAY' | 'DRAW' | 'NONE'
  hasJoined: boolean
  prediction: MatchOutcome | null
}
```

**IDL Method:** `marketProgram.account.participant.fetch(participantPda)`

### 2. Market Actions Hooks (`app/src/hooks/useMarketActions.ts`)

#### `createMarket(params)`
Creates a new prediction market using Factory program's `createMarket` instruction.

**Parameters:**
```typescript
{
  matchId: string
  entryFee: number // in lamports
  kickoffTime: number
  endTime: number
  isPublic: boolean
}
```

**PDA Derivations:**
```typescript
// Factory PDA
const [factoryPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('factory')],
  factoryProgram.programId
)

// Market Registry PDA
const [marketRegistryPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('market_registry'), factoryPda.toBuffer(), Buffer.from(matchId)],
  factoryProgram.programId
)

// Market PDA (from Market program)
const [marketPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('market'), factoryPda.toBuffer(), Buffer.from(matchId)],
  marketProgram.programId
)
```

**IDL Method:** `factoryProgram.methods.createMarket(...).accounts({...}).rpc()`

#### `joinMarket(params)`
Joins an existing market with a prediction using Market program's `joinMarket` instruction.

**Parameters:**
```typescript
{
  marketAddress: string
  prediction: 'Home' | 'Draw' | 'Away'
}
```

**PDA Derivation:**
```typescript
const [participantPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('participant'), marketPubkey.toBuffer(), wallet.publicKey.toBuffer()],
  marketProgram.programId
)
```

**Prediction Enum Conversion:**
```typescript
const predictionEnum = prediction === 'Home' 
  ? { home: {} } 
  : prediction === 'Draw' 
    ? { draw: {} } 
    : { away: {} }
```

**IDL Method:** `marketProgram.methods.joinMarket(predictionEnum).accounts({...}).rpc()`

#### `resolveMarket(params)`
Resolves a market with the match outcome using Market program's `resolveMarket` instruction.

**Parameters:**
```typescript
{
  marketAddress: string
  outcome: 'Home' | 'Draw' | 'Away'
}
```

**Outcome Enum Conversion:**
```typescript
const outcomeEnum = outcome === 'Home' 
  ? { home: {} } 
  : outcome === 'Draw' 
    ? { draw: {} } 
    : { away: {} }
```

**IDL Method:** `marketProgram.methods.resolveMarket(outcomeEnum).accounts({...}).rpc()`

#### `withdrawRewards(marketAddress)`
Withdraws rewards from a resolved market using Market program's `withdrawRewards` instruction.

**PDA Derivation:**
```typescript
const [participantPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('participant'), marketPubkey.toBuffer(), wallet.publicKey.toBuffer()],
  marketProgram.programId
)
```

**IDL Method:** `marketProgram.methods.withdrawRewards().accounts({...}).rpc()`

## Component Integration

### Content.tsx
Main landing page component that displays:
- Hero section with "Create Market" button
- User's active markets (via `UserMarkets` component)
- Public markets (via `PublicMarkets` component)

### Markets.tsx
Market creation interface that:
- Fetches scheduled matches from Football-Data.org API
- Filters by competition and date range
- Uses `useAllMarkets()` to check if user already has markets
- Calls `createMarket()` action when user creates a market

### PublicMarkets.tsx
Displays all public markets with:
- Advanced filtering (status, time range, pool size, entry fee)
- Pagination support
- Virtual scrolling for large lists (>20 markets)
- Uses `useAllMarkets()` hook with filtering

### UserMarkets.tsx
Displays user's active markets:
- Filters out resolved/cancelled markets
- Shows only markets within 2 hours of ending
- Uses `useUserMarkets()` hook
- Displays top 3 markets on homepage

### Market.tsx
Individual market card for creation:
- Shows match details (teams, date, time)
- Entry fee input (in SOL, converted to lamports)
- Public/private toggle
- Calls `createMarket()` action
- Shows transaction status and Solana Explorer link

## Helper Functions

### Status Parsing
```typescript
function parseMarketStatus(status: number): 'Open' | 'Live' | 'Resolved' | 'Cancelled' {
  switch (status) {
    case 0: return 'Open'
    case 1: return 'Live'
    case 2: return 'Resolved'
    case 3: return 'Cancelled'
    default: return 'Open'
  }
}
```

### Outcome Parsing
```typescript
function parseOutcome(outcome: number | null): 'Home' | 'Draw' | 'Away' | null {
  if (outcome === null || outcome === undefined) return null
  switch (outcome) {
    case 0: return 'Home'
    case 1: return 'Draw'
    case 2: return 'Away'
    default: return null
  }
}
```

## Error Handling

All hooks and actions include comprehensive error handling:
- Try-catch blocks around all program calls
- Console logging for debugging
- Toast notifications for user feedback
- Graceful fallbacks (return null/empty array on error)
- Transaction signature tracking for explorer links

## Real-Time Updates

Markets are automatically refreshed:
- `staleTime: 5000ms` for market details
- `staleTime: 10000ms` for market lists
- `refetchInterval: 10000ms` for automatic polling
- Manual refetch on user actions (create, join, resolve, withdraw)

## Type Safety

All IDL interactions are fully typed using:
- Generated TypeScript types from Anchor IDL
- Custom TypeScript interfaces for frontend data structures
- Proper enum conversions between frontend and program formats
- BN (BigNumber) for large numbers (lamports, timestamps)

## Testing Checklist

Before deployment, verify:
- [ ] Factory program deployed and address in `.env`
- [ ] Market program deployed and address in `.env`
- [ ] Dashboard program deployed and address in `.env`
- [ ] IDL files copied to `app/src/idl/`
- [ ] Wallet connected to correct network (devnet/testnet/mainnet)
- [ ] Create market transaction succeeds
- [ ] Join market transaction succeeds
- [ ] Resolve market transaction succeeds (creator only)
- [ ] Withdraw rewards transaction succeeds (winners only)
- [ ] Market lists display correctly
- [ ] User stats display correctly
- [ ] Real-time updates working
- [ ] Error handling working (rejected transactions, insufficient funds, etc.)

## Next Steps

1. **Deploy Programs**: Deploy all three programs to Solana devnet/testnet
2. **Update Environment**: Add program IDs to `.env` file
3. **Copy IDLs**: Run `npm run copy-idls` to copy IDL files to frontend
4. **Test Integration**: Test all user flows end-to-end
5. **Monitor Transactions**: Use Solana Explorer to verify transactions
6. **Optimize**: Add caching, optimize queries, reduce RPC calls

## Resources

- **Anchor Documentation**: https://www.anchor-lang.com/
- **Solana Web3.js**: https://solana-labs.github.io/solana-web3.js/
- **Solana Explorer**: https://explorer.solana.com/
- **Program IDLs**: `solana/app/src/idl/`
- **Program Config**: `solana/app/src/config/programs.ts`
