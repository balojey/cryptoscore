# Solana Migration Quick Reference

## Common Patterns

### 1. Currency Conversion

#### Lamports to SOL
```typescript
// Manual conversion
const sol = Number(lamports) / 1_000_000_000

// Using helper (recommended)
import { formatSOL } from './utils/formatters'
const formatted = formatSOL(lamports, 4, true) // "1.2345 SOL"
const number = formatSOL(lamports, 4, false)   // "1.2345"
```

#### SOL to Lamports
```typescript
const lamports = sol * 1_000_000_000
const lamportsBigInt = BigInt(Math.floor(sol * 1_000_000_000))
```

### 2. Data Fetching

#### Dashboard Data
```typescript
import { useDashboardData } from './hooks/useDashboardData'

const { data: markets, isLoading, error, refetch } = useDashboardData({
  offset: 0,
  limit: 100,
  publicOnly: false,
  enabled: true,
})
```

#### Factory Markets
```typescript
import { useFactoryMarkets } from './hooks/useDashboardData'

const { data: markets, isLoading, error } = useFactoryMarkets({
  enabled: true,
})
```

#### Market Details
```typescript
import { useMarketDetails } from './hooks/useDashboardData'

const addresses = ['market1...', 'market2...']
const { data: details, isLoading } = useMarketDetails(addresses, {
  enabled: addresses.length > 0,
})
```

### 3. Address Formatting

```typescript
import { shortenAddress } from './utils/formatters'

// Solana addresses (base58)
const short = shortenAddress('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU')
// Returns: "7xKXtg...sgAsU"

// Custom length
const custom = shortenAddress(address, 8, 6)
// Returns: "7xKXtg2C...osgAsU"
```

### 4. Program IDs

```typescript
import { 
  FACTORY_PROGRAM_ID,
  MARKET_PROGRAM_ID,
  DASHBOARD_PROGRAM_ID 
} from './config/programs'

// Use in subscriptions
useSimpleRealtimeMarkets(markets, DASHBOARD_PROGRAM_ID)
```

### 5. Real-Time Updates

```typescript
import { useSimpleRealtimeMarkets } from './hooks/useEnhancedRealtimeMarkets'

const realtimeStatus = useSimpleRealtimeMarkets(markets, DASHBOARD_PROGRAM_ID)

// Status properties
realtimeStatus.isActive        // boolean
realtimeStatus.connectionType  // 'connected' | 'disconnected' | 'fallback'
realtimeStatus.lastUpdate      // timestamp
realtimeStatus.forceRefresh()  // manual refresh function
```

## Migration Checklist

When migrating a component from Polkadot to Solana:

### Step 1: Update Imports
```typescript
// ❌ Remove
import { useReadContract, useWriteContract } from 'wagmi'
import { formatEther, parseEther } from 'viem'

// ✅ Add
import { useDashboardData } from './hooks/useDashboardData'
import { formatSOL } from './utils/formatters'
```

### Step 2: Replace Data Fetching
```typescript
// ❌ Before (Polkadot)
const { data } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getMarkets',
})

// ✅ After (Solana)
const { data } = useDashboardData({
  offset: 0,
  limit: 100,
})
```

### Step 3: Update Currency Conversion
```typescript
// ❌ Before (Polkadot)
const value = Number(formatEther(bigIntValue))
const poolSize = Number(formatEther(entryFee)) * Number(participants)

// ✅ After (Solana)
const value = Number(bigIntValue) / 1_000_000_000
const poolSize = (Number(entryFee) * Number(participants)) / 1_000_000_000
```

### Step 4: Update Display Currency
```typescript
// ❌ Before
<span>{value} PAS</span>

// ✅ After
<span>{value} SOL</span>
```

### Step 5: Update Program References
```typescript
// ❌ Before
import { CRYPTO_SCORE_DASHBOARD_ADDRESS } from './config/contracts'

// ✅ After
import { DASHBOARD_PROGRAM_ID } from './config/programs'
```

## Common Gotchas

### 1. BigInt Conversion
```typescript
// ❌ Wrong - loses precision
const sol = Number(lamports / 1_000_000_000n)

// ✅ Correct - convert first, then divide
const sol = Number(lamports) / 1_000_000_000
```

### 2. Address Format
```typescript
// ❌ Wrong - Ethereum format
const address = '0x1234...'

// ✅ Correct - Solana base58
const address = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
```

### 3. Data Structure
```typescript
// Solana Market type (already correct format)
interface Market {
  marketAddress: string  // base58 PublicKey
  matchId: bigint
  entryFee: bigint      // lamports
  creator: string       // base58 PublicKey
  participantsCount: bigint
  resolved: boolean
  isPublic: boolean
  startTime: bigint
  homeCount?: bigint
  awayCount?: bigint
  drawCount?: bigint
}
```

### 4. Decimal Precision
```typescript
// ❌ Wrong - too many decimals
const formatted = sol.toFixed(9)

// ✅ Correct - 4 decimals for display
const formatted = sol.toFixed(4)

// ✅ Better - use helper
const formatted = formatSOL(lamports, 4, true)
```

## Testing

### Local Testing (Before Deployment)
```typescript
// Hooks return empty arrays until programs are deployed
const { data } = useDashboardData() // data = []

// Components should handle empty state gracefully
if (!data || data.length === 0) {
  return <EmptyState />
}
```

### After Deployment
```bash
# 1. Deploy programs
cd solana
anchor build
anchor deploy --provider.cluster devnet

# 2. Update .env with program IDs
VITE_FACTORY_PROGRAM_ID=<deployed_id>
VITE_MARKET_PROGRAM_ID=<deployed_id>
VITE_DASHBOARD_PROGRAM_ID=<deployed_id>

# 3. Restart dev server
npm run dev
```

## Useful Commands

```bash
# Check Solana connection
solana config get

# Get SOL balance
solana balance

# Check program deployment
solana program show <PROGRAM_ID>

# View account data
solana account <ACCOUNT_ADDRESS>

# Monitor logs
solana logs <PROGRAM_ID>
```

## Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Wallet Adapter](https://github.com/solana-labs/wallet-adapter)

## Support

For issues or questions:
1. Check `SOLANA_MIGRATION_TERMINAL.md` for detailed changes
2. Review component examples in `src/pages/TradingTerminal.tsx`
3. Check existing Solana hooks in `src/hooks/`
4. Refer to Solana documentation

---

**Last Updated:** 2024-11-28  
**Version:** 1.0.0
