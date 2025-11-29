# Solana Hooks Reference Guide

## Overview
This guide provides quick reference for all Solana-related hooks in the CryptoScore application.

---

## Core Hooks

### `useSolanaProgram()`
**Purpose:** Provides access to all three Solana program instances

**Returns:**
```typescript
{
  connection: Connection           // Solana connection
  wallet: WalletContextState      // Wallet adapter state
  provider: AnchorProvider | null // Anchor provider
  factoryProgram: Program<CryptoscoreFactory> | null
  marketProgram: Program<CryptoscoreMarket> | null
  dashboardProgram: Program<CryptoscoreDashboard> | null
  isReady: boolean                // Provider is initialized
}
```

**Usage:**
```typescript
const { marketProgram, isReady } = useSolanaProgram()

if (isReady && marketProgram) {
  // Use program
}
```

---

## Data Fetching Hooks

### `useMarketData(marketAddress?: string)`
**Purpose:** Fetch detailed information for a specific market

**Parameters:**
- `marketAddress` - Market public key as base58 string

**Returns:**
```typescript
{
  data: MarketData | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

interface MarketData {
  marketAddress: string
  creator: string
  matchId: string
  entryFee: number              // in lamports
  kickoffTime: number           // Unix timestamp
  endTime: number               // Unix timestamp
  status: 'Open' | 'Live' | 'Resolved' | 'Cancelled'
  outcome: 'Home' | 'Draw' | 'Away' | null
  totalPool: number             // in lamports
  participantCount: number
  homeCount: number
  drawCount: number
  awayCount: number
  isPublic: boolean
}
```

**Usage:**
```typescript
const { data: marketData, isLoading, refetch } = useMarketData(marketAddress)

if (marketData) {
  console.log(`Pool: ${marketData.totalPool / LAMPORTS_PER_SOL} SOL`)
}
```

**Features:**
- Auto-refetches every 5 seconds
- Uses Dashboard program's `getMarketDetails` view function
- Properly parses status and outcome enums

---

### `useAllMarkets(page = 0, pageSize = 50)`
**Purpose:** Fetch paginated list of all markets

**Parameters:**
- `page` - Page number (0-indexed)
- `pageSize` - Number of markets per page

**Returns:**
```typescript
{
  data: MarketData[]
  isLoading: boolean
  error: Error | null
}
```

**Usage:**
```typescript
const { data: markets } = useAllMarkets(0, 50)

markets.forEach(market => {
  console.log(`Market: ${market.marketAddress}`)
})
```

**Features:**
- Auto-refetches every 10 seconds
- Sorted by creation time (newest first)
- Includes all statuses and visibility types

---

### `useUserMarkets(userAddress?: string)`
**Purpose:** Fetch all markets a user has participated in

**Parameters:**
- `userAddress` - User's public key as base58 string

**Returns:**
```typescript
{
  data: MarketData[]
  isLoading: boolean
  error: Error | null
}
```

**Usage:**
```typescript
const { publicKey } = useWallet()
const { data: userMarkets } = useUserMarkets(publicKey?.toString())
```

**Features:**
- Auto-refetches every 10 seconds
- Includes all markets user has joined
- Sorted by creation time

---

### `useUserStats(userAddress?: string)`
**Purpose:** Fetch user's trading statistics

**Parameters:**
- `userAddress` - User's public key as base58 string

**Returns:**
```typescript
{
  data: {
    user: string
    totalMarkets: number
    wins: number
    losses: number
    totalWagered: number        // in lamports
    totalWon: number            // in lamports
    currentStreak: number       // positive for wins, negative for losses
    bestStreak: number
    lastUpdated: number         // Unix timestamp
  } | null
  isLoading: boolean
  error: Error | null
}
```

**Usage:**
```typescript
const { publicKey } = useWallet()
const { data: stats } = useUserStats(publicKey?.toString())

if (stats) {
  const winRate = (stats.wins / stats.totalMarkets) * 100
  console.log(`Win Rate: ${winRate.toFixed(1)}%`)
}
```

**Features:**
- Returns null if user hasn't participated in any markets
- Auto-refetches every 30 seconds

---

### `useUserPrediction(marketAddress?: string)`
**Purpose:** Get user's prediction for a specific market

**Parameters:**
- `marketAddress` - Market public key as base58 string

**Returns:**
```typescript
{
  predictionName: 'HOME' | 'AWAY' | 'DRAW' | 'NONE'
  hasJoined: boolean
  prediction: MatchOutcome | null
}
```

**Usage:**
```typescript
const { predictionName, hasJoined } = useUserPrediction(marketAddress)

if (hasJoined) {
  console.log(`You predicted: ${predictionName}`)
}
```

**Features:**
- Auto-refetches every 5 seconds
- Returns 'NONE' if user hasn't joined
- Requires wallet connection

---

### `useUserRewards(marketAddress?: string)`
**Purpose:** Check if user has rewards to withdraw

**Parameters:**
- `marketAddress` - Market public key as base58 string

**Returns:**
```typescript
{
  data: {
    hasRewards: boolean         // User has unclaimed rewards
    hasWithdrawn: boolean       // User already withdrew
    canWithdraw: boolean        // User can withdraw now
    isWinner: boolean           // User predicted correctly
    isResolved: boolean         // Market is resolved
  }
  isLoading: boolean
  error: Error | null
}
```

**Usage:**
```typescript
const { data: rewards } = useUserRewards(marketAddress)

if (rewards?.canWithdraw) {
  // Show withdraw button
}
```

**Features:**
- Auto-refetches every 5 seconds
- Checks both participant and market accounts
- Returns false values if user hasn't joined

---

## Action Hooks

### `useMarketActions()`
**Purpose:** Perform market actions (create, join, resolve, withdraw)

**Returns:**
```typescript
{
  createMarket: (params: CreateMarketParams) => Promise<string | null>
  joinMarket: (params: JoinMarketParams) => Promise<string | null>
  resolveMarket: (params: ResolveMarketParams) => Promise<string | null>
  withdrawRewards: (marketAddress: string) => Promise<string | null>
  getExplorerLink: (signature: string) => string
  isLoading: boolean
  txSignature: string | null
}
```

**Usage:**

#### Create Market
```typescript
const { createMarket, isLoading } = useMarketActions()

const handleCreate = async () => {
  const signature = await createMarket({
    matchId: '12345',
    entryFee: 0.1 * LAMPORTS_PER_SOL,
    kickoffTime: Math.floor(Date.now() / 1000) + 3600,
    endTime: Math.floor(Date.now() / 1000) + 7200,
    isPublic: true,
  })
  
  if (signature) {
    console.log('Market created:', signature)
  }
}
```

#### Join Market
```typescript
const { joinMarket, isLoading } = useMarketActions()

const handleJoin = async () => {
  const signature = await joinMarket({
    marketAddress: 'ABC123...',
    prediction: 'Home', // 'Home' | 'Draw' | 'Away'
  })
  
  if (signature) {
    console.log('Joined market:', signature)
  }
}
```

#### Resolve Market
```typescript
const { resolveMarket, isLoading } = useMarketActions()

const handleResolve = async () => {
  const signature = await resolveMarket({
    marketAddress: 'ABC123...',
    outcome: 'Home', // 'Home' | 'Draw' | 'Away'
  })
  
  if (signature) {
    console.log('Market resolved:', signature)
  }
}
```

#### Withdraw Rewards
```typescript
const { withdrawRewards, isLoading, getExplorerLink } = useMarketActions()

const handleWithdraw = async () => {
  const signature = await withdrawRewards('ABC123...')
  
  if (signature) {
    console.log('Rewards withdrawn:', signature)
    console.log('Explorer:', getExplorerLink(signature))
  }
}
```

**Features:**
- Automatic toast notifications
- Proper PDA derivation
- Enum conversion for Anchor
- Transaction confirmation
- Error handling

---

## Common Patterns

### Loading State
```typescript
const { data, isLoading, error } = useMarketData(marketAddress)

if (isLoading) return <Skeleton />
if (error) return <Error message={error.message} />
if (!data) return <NotFound />

return <MarketDisplay data={data} />
```

### Action with Refetch
```typescript
const { data, refetch } = useMarketData(marketAddress)
const { joinMarket, isLoading } = useMarketActions()

const handleJoin = async () => {
  const signature = await joinMarket({ marketAddress, prediction: 'Home' })
  if (signature) {
    await refetch() // Refresh market data
  }
}
```

### Conditional Rendering
```typescript
const { predictionName, hasJoined } = useUserPrediction(marketAddress)
const { data: rewards } = useUserRewards(marketAddress)

return (
  <>
    {hasJoined && <Badge>Joined: {predictionName}</Badge>}
    {rewards?.canWithdraw && <Button onClick={handleWithdraw}>Withdraw</Button>}
    {rewards?.hasWithdrawn && <Badge>Withdrawn</Badge>}
  </>
)
```

### Multiple Markets
```typescript
const { data: allMarkets } = useAllMarkets()
const { publicKey } = useWallet()
const { data: userMarkets } = useUserMarkets(publicKey?.toString())

const openMarkets = allMarkets.filter(m => m.status === 'Open')
const userOpenMarkets = userMarkets.filter(m => m.status === 'Open')
```

---

## Best Practices

### 1. Always Check Loading States
```typescript
const { data, isLoading } = useMarketData(marketAddress)

if (isLoading) {
  return <Skeleton />
}
```

### 2. Handle Null Data
```typescript
const { data } = useMarketData(marketAddress)

if (!data) {
  return <NotFound />
}
```

### 3. Refetch After Mutations
```typescript
const { refetch } = useMarketData(marketAddress)
const { joinMarket } = useMarketActions()

const handleJoin = async () => {
  const signature = await joinMarket(params)
  if (signature) {
    await refetch()
  }
}
```

### 4. Use Wallet Connection Check
```typescript
const { publicKey } = useWallet()
const { joinMarket } = useMarketActions()

const handleJoin = async () => {
  if (!publicKey) {
    toast.error('Please connect your wallet')
    return
  }
  
  await joinMarket(params)
}
```

### 5. Convert Lamports for Display
```typescript
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

const { data } = useMarketData(marketAddress)

const entryFeeSOL = data.entryFee / LAMPORTS_PER_SOL
const poolSizeSOL = data.totalPool / LAMPORTS_PER_SOL
```

---

## Error Handling

All hooks handle errors gracefully:

1. **Network Errors**: Logged to console, return null/empty data
2. **Account Not Found**: Handled as "user hasn't joined"
3. **Transaction Errors**: Shown via toast notifications
4. **Validation Errors**: Checked before submission

Example:
```typescript
const { data, error } = useMarketData(marketAddress)

if (error) {
  console.error('Failed to load market:', error)
  return <ErrorDisplay error={error} />
}
```

---

## Performance Tips

1. **Use Stale Time**: Data is cached for 5-10 seconds
2. **Refetch Intervals**: Auto-refetch every 5-10 seconds
3. **Conditional Queries**: Hooks only run when enabled
4. **Memoization**: Use `useMemo` for derived data

Example:
```typescript
const { data: markets } = useAllMarkets()

const openMarkets = useMemo(
  () => markets.filter(m => m.status === 'Open'),
  [markets]
)
```

---

## TypeScript Types

All hooks are fully typed. Import types from:

```typescript
import type { MarketData } from '../hooks/useMarketData'
import type { CreateMarketParams, JoinMarketParams, ResolveMarketParams } from '../hooks/useMarketActions'
```

---

## Testing

When testing components that use these hooks:

1. Mock the hooks in your tests
2. Provide test data matching the return types
3. Test loading, error, and success states

Example:
```typescript
jest.mock('../hooks/useMarketData')

test('displays market data', () => {
  (useMarketData as jest.Mock).mockReturnValue({
    data: mockMarketData,
    isLoading: false,
    error: null,
  })
  
  render(<MarketDetail />)
  expect(screen.getByText('Market Details')).toBeInTheDocument()
})
```

---

## Troubleshooting

### Hook returns null
- Check if wallet is connected
- Verify program IDs are correct
- Check network connection
- Verify account exists on-chain

### Transaction fails
- Check wallet has sufficient SOL
- Verify market is in correct state
- Check transaction logs in console
- Verify program is deployed

### Data not updating
- Check refetch interval
- Manually call `refetch()`
- Verify WebSocket connection
- Check cache settings

---

**Last Updated:** 2024-11-29  
**Version:** 1.0.0
