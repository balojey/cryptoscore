# Solana Integration Quick Reference

## Import Statements

```typescript
// Hooks
import { useAllMarkets, useDashboardData, useFactoryMarkets, useMarketDetails } from '@/hooks/useDashboardData'

// Utilities
import {
  calculatePoolSize,
  calculateDistribution,
  isMarketOpen,
  isMarketLive,
  isEndingSoon,
  formatOutcome,
  lamportsToSOL,
  solToLamports,
  MarketStatus,
  MatchOutcome,
} from '@/utils/solana-helpers'

// Config
import { FACTORY_PROGRAM_ID, MARKET_PROGRAM_ID, DASHBOARD_PROGRAM_ID } from '@/config/programs'
```

## Common Patterns

### Fetch All Markets
```typescript
const { data: markets, isLoading, error, refetch } = useAllMarkets({
  offset: 0,
  limit: 1000,
  publicOnly: false,
})
```

### Fetch User Markets
```typescript
const { createdMarkets, joinedMarkets, allInvolvedMarkets, isLoading, error } = 
  useDashboardData(userAddress)
```

### Calculate Pool Size
```typescript
const poolSizeSOL = calculatePoolSize(market.entryFee, market.participantsCount)
// Returns: number (SOL)
```

### Calculate Distribution
```typescript
const { homePercent, drawPercent, awayPercent } = calculateDistribution(
  market.homeCount || 0n,
  market.drawCount || 0n,
  market.awayCount || 0n
)
// Returns: { homePercent: number, drawPercent: number, awayPercent: number }
```

### Check Market Status
```typescript
if (isMarketOpen(market)) {
  // Market is open for predictions
}

if (isMarketLive(market)) {
  // Match has started but not resolved
}

if (isEndingSoon(market)) {
  // Less than 24 hours until kickoff
}

if (market.resolved) {
  // Market is resolved
}
```

### Format Outcome
```typescript
const outcomeString = formatOutcome(market.winner)
// 0 → "HOME", 1 → "DRAW", 2 → "AWAY"
```

### Convert Lamports ↔ SOL
```typescript
const sol = lamportsToSOL(1_000_000_000n) // 1.0 SOL
const lamports = solToLamports(1.5) // 1_500_000_000n
```

## Component Usage

### Display Market Card
```typescript
function MarketCard({ market }: { market: Market }) {
  const poolSize = calculatePoolSize(market.entryFee, market.participantsCount)
  const { homePercent, drawPercent, awayPercent } = calculateDistribution(
    market.homeCount || 0n,
    market.drawCount || 0n,
    market.awayCount || 0n
  )
  
  return (
    <div>
      <h3>Match #{market.matchId.toString()}</h3>
      <p>Pool: {poolSize.toFixed(2)} SOL</p>
      <p>Participants: {Number(market.participantsCount)}</p>
      <p>Status: {getMarketStatusString(market)}</p>
      
      {/* Distribution */}
      <div>
        <span>HOME: {homePercent.toFixed(1)}%</span>
        <span>DRAW: {drawPercent.toFixed(1)}%</span>
        <span>AWAY: {awayPercent.toFixed(1)}%</span>
      </div>
      
      {/* Resolved */}
      {market.resolved && (
        <p>Winner: {formatOutcome(market.winner)}</p>
      )}
    </div>
  )
}
```

### Display Metrics
```typescript
function Metrics({ markets }: { markets: Market[] }) {
  const totalMarkets = markets.length
  
  const totalTVL = markets.reduce((sum, market) => {
    return sum + calculatePoolSize(market.entryFee, market.participantsCount)
  }, 0)
  
  const activeMarkets = markets.filter(isMarketOpen).length
  const liveMarkets = markets.filter(isMarketLive).length
  const resolvedMarkets = markets.filter(m => m.resolved).length
  
  return (
    <div>
      <div>Total Markets: {totalMarkets}</div>
      <div>Total TVL: {totalTVL.toFixed(2)} SOL</div>
      <div>Active: {activeMarkets}</div>
      <div>Live: {liveMarkets}</div>
      <div>Resolved: {resolvedMarkets}</div>
    </div>
  )
}
```

### Filter Markets
```typescript
// Open markets only
const openMarkets = markets.filter(isMarketOpen)

// Ending soon
const endingSoon = markets.filter(isEndingSoon)

// By creator
const myMarkets = markets.filter(m => m.creator === userAddress)

// Public only
const publicMarkets = markets.filter(m => m.isPublic)

// High value
const highValueMarkets = markets.filter(m => 
  calculatePoolSize(m.entryFee, m.participantsCount) > 10
)
```

### Sort Markets
```typescript
// By pool size (descending)
const byPoolSize = [...markets].sort((a, b) => {
  const poolA = calculatePoolSize(a.entryFee, a.participantsCount)
  const poolB = calculatePoolSize(b.entryFee, b.participantsCount)
  return poolB - poolA
})

// By participants (descending)
const byParticipants = [...markets].sort((a, b) => 
  Number(b.participantsCount) - Number(a.participantsCount)
)

// By start time (ascending - soonest first)
const byStartTime = [...markets].sort((a, b) => 
  Number(a.startTime) - Number(b.startTime)
)

// Ending soon first
const endingSoonFirst = [...markets].sort((a, b) => {
  const timeA = getTimeUntilStart(a)
  const timeB = getTimeUntilStart(b)
  return timeA - timeB
})
```

## Type Definitions

```typescript
interface Market {
  marketAddress: string      // Solana PublicKey as base58
  matchId: bigint            // Match identifier
  entryFee: bigint           // Entry fee in lamports
  creator: string            // Creator PublicKey as base58
  participantsCount: bigint  // Number of participants
  resolved: boolean          // Is market resolved?
  isPublic: boolean          // Is market public?
  startTime: bigint          // Unix timestamp (seconds)
  homeCount?: bigint         // HOME predictions
  awayCount?: bigint         // AWAY predictions
  drawCount?: bigint         // DRAW predictions
}

interface MarketDashboardInfo extends Market {
  winner: number             // Winning outcome (0=HOME, 1=DRAW, 2=AWAY)
}

enum MarketStatus {
  Open = 0,
  Live = 1,
  Resolved = 2,
  Cancelled = 3,
}

enum MatchOutcome {
  Home = 0,
  Draw = 1,
  Away = 2,
}
```

## Error Handling

```typescript
const { data, isLoading, error } = useAllMarkets()

if (isLoading) {
  return <LoadingSpinner />
}

if (error) {
  return (
    <ErrorMessage 
      message={error.message}
      onRetry={() => refetch()}
    />
  )
}

if (!data || data.length === 0) {
  return <EmptyState message="No markets found" />
}

return <MarketList markets={data} />
```

## Performance Tips

1. **Use React Query caching**: Data is automatically cached
2. **Memoize calculations**: Use `useMemo` for expensive operations
3. **Virtual scrolling**: Use for lists > 20 items
4. **Lazy loading**: Load components only when needed
5. **Debounce filters**: Wait for user to finish typing

```typescript
// Memoize expensive calculations
const metrics = useMemo(() => {
  return {
    totalTVL: markets.reduce((sum, m) => 
      sum + calculatePoolSize(m.entryFee, m.participantsCount), 0
    ),
    activeCount: markets.filter(isMarketOpen).length,
  }
}, [markets])

// Debounce search
const [searchTerm, setSearchTerm] = useState('')
const debouncedSearch = useDebounce(searchTerm, 500)

const filteredMarkets = useMemo(() => {
  return markets.filter(m => 
    m.matchId.toString().includes(debouncedSearch)
  )
}, [markets, debouncedSearch])
```

## Common Gotchas

1. **BigInt arithmetic**: Use `BigInt()` for all operations
   ```typescript
   // ❌ Wrong
   const total = market.entryFee * market.participantsCount
   
   // ✅ Correct
   const total = BigInt(market.entryFee) * BigInt(market.participantsCount)
   ```

2. **Lamports vs SOL**: Always convert for display
   ```typescript
   // ❌ Wrong - displays lamports
   <span>{market.entryFee.toString()}</span>
   
   // ✅ Correct - displays SOL
   <span>{lamportsToSOL(market.entryFee).toFixed(2)} SOL</span>
   ```

3. **Optional fields**: Check before using
   ```typescript
   // ❌ Wrong - may be undefined
   const total = market.homeCount + market.drawCount + market.awayCount
   
   // ✅ Correct - handle undefined
   const total = (market.homeCount || 0n) + (market.drawCount || 0n) + (market.awayCount || 0n)
   ```

4. **Timestamps**: Convert to milliseconds for Date
   ```typescript
   // ❌ Wrong - seconds
   const date = new Date(Number(market.startTime))
   
   // ✅ Correct - milliseconds
   const date = new Date(Number(market.startTime) * 1000)
   ```

## Environment Variables

```bash
# .env
VITE_FACTORY_PROGRAM_ID=93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP
VITE_MARKET_PROGRAM_ID=94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ
VITE_DASHBOARD_PROGRAM_ID=95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Useful Links

- [Full Integration Guide](./SOLANA_INTEGRATION_GUIDE.md)
- [Completion Summary](./SOLANA_IDL_INTEGRATION_COMPLETE.md)
- [Anchor Docs](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
