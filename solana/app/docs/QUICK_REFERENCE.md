# Quick Reference - Solana Migration

## Component Status

| Component | Status | Polkadot Code | Solana Code |
|-----------|--------|---------------|-------------|
| Content.tsx | ✅ Ready | N/A | N/A |
| Markets.tsx | ✅ Migrated | `useAccount`, `useContractRead` | `useWallet`, `useAllMarkets` |
| PublicMarkets.tsx | ✅ Migrated | `useAccount`, `useReadContract`, `useReadContracts` | `useWallet`, `useAllMarkets` |
| UserMarkets.tsx | ✅ Migrated | Type casting to `0x${string}` | Plain `string` types |
| Market.tsx | ✅ Ready | Already migrated | Uses Solana hooks |
| EnhancedMarketCard.tsx | ✅ Ready | Already migrated | Uses Solana hooks |

## Key Changes

### Before (Polkadot/Wagmi)
```typescript
import { useAccount, useContractRead } from 'wagmi'

const { address } = useAccount()
const { data } = useContractRead({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'getAllMarkets',
})

// Address type: `0x${string}`
```

### After (Solana)
```typescript
import { useWallet } from '@solana/wallet-adapter-react'
import { useAllMarkets } from '../../hooks/useMarketData'

const { publicKey } = useWallet()
const { data } = useAllMarkets()

// Address type: string (base58)
```

## Hook Usage

### Fetching Markets
```typescript
// All markets
const { data, isLoading, error, refetch } = useAllMarkets(page, pageSize)

// User's markets
const { data, isLoading } = useUserMarkets(userAddress)

// Single market
const { data } = useMarketData(marketAddress)
```

### Market Actions
```typescript
const { createMarket, joinMarket, resolveMarket, withdrawRewards, isLoading } = useMarketActions()

// Create market
await createMarket({
  matchId: '12345',
  entryFee: 100000000, // lamports
  kickoffTime: 1234567890,
  endTime: 1234567890,
  isPublic: true,
})

// Join market
await joinMarket({
  marketAddress: 'ABC123...',
  prediction: 'Home',
})
```

## Address Format

### Polkadot (Old)
- Format: `0x1234567890abcdef...` (40 hex characters)
- Type: `` `0x${string}` ``
- Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### Solana (New)
- Format: `ABC123XYZ...` (base58 encoded, 32-44 characters)
- Type: `string`
- Example: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`

## Data Structures

### Market (Solana)
```typescript
interface Market {
  marketAddress: string        // Solana PublicKey (base58)
  matchId: bigint
  entryFee: bigint            // lamports (1 SOL = 1,000,000,000 lamports)
  creator: string             // Solana PublicKey (base58)
  participantsCount: bigint
  resolved: boolean
  isPublic: boolean
  startTime: bigint           // Unix timestamp
  homeCount?: bigint
  awayCount?: bigint
  drawCount?: bigint
}
```

### MarketData (from Dashboard)
```typescript
interface MarketData {
  marketAddress: string
  creator: string
  matchId: string
  entryFee: number           // lamports
  kickoffTime: number        // Unix timestamp
  endTime: number            // Unix timestamp
  status: 'Open' | 'Live' | 'Resolved' | 'Cancelled'
  outcome: 'Home' | 'Draw' | 'Away' | null
  totalPool: number          // lamports
  participantCount: number
  homeCount: number
  drawCount: number
  awayCount: number
  isPublic: boolean
  participants?: Participant[]
}
```

## Common Patterns

### Wallet Connection
```typescript
const { publicKey, connected } = useWallet()

if (!connected) {
  return <div>Please connect wallet</div>
}

const userAddress = publicKey?.toString()
```

### Loading States
```typescript
const { data, isLoading, error } = useAllMarkets()

if (isLoading) return <Skeleton />
if (error) return <Error message={error.message} />
if (!data || data.length === 0) return <EmptyState />

return <MarketList markets={data} />
```

### Transaction Handling
```typescript
const { createMarket, isLoading } = useMarketActions()

const handleCreate = async () => {
  try {
    const signature = await createMarket(params)
    toast.success('Market created!')
    console.log('Transaction:', signature)
  } catch (error) {
    toast.error(error.message)
  }
}
```

## Solana Explorer Links

```typescript
const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`

// Transaction
const txUrl = `https://explorer.solana.com/tx/${signature}${cluster}`

// Address
const addressUrl = `https://explorer.solana.com/address/${address}${cluster}`
```

## Environment Variables

```bash
# .env
VITE_SOLANA_NETWORK=devnet  # or mainnet-beta, testnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Testing

### UI Testing (No programs needed)
```bash
npm run dev
# Navigate to http://localhost:5173
# Test UI interactions, theme switching, navigation
```

### Integration Testing (Requires deployed programs)
```bash
# 1. Deploy programs
cd ../../programs
anchor build
anchor deploy

# 2. Update program IDs in config/programs.ts
# 3. Test transactions
npm run dev
```

## Troubleshooting

### "Wallet not connected"
- Ensure Phantom/Solflare wallet is installed
- Click "Connect Wallet" button
- Approve connection in wallet popup

### "Program not deployed"
- Check program IDs in `config/programs.ts`
- Verify programs are deployed: `solana program show <PROGRAM_ID>`
- Check network matches (devnet/mainnet)

### "Transaction failed"
- Check wallet has SOL for transaction fees
- Verify program accounts are initialized
- Check transaction logs in Solana Explorer

### "Data not loading"
- Check RPC endpoint is accessible
- Verify program IDs are correct
- Check browser console for errors
- Ensure programs are deployed and initialized

## Next Steps

1. ✅ UI/UX is ready
2. ⏳ Deploy Solana programs
3. ⏳ Implement program interactions in hooks
4. ⏳ Test end-to-end flows
5. ⏳ Deploy to production

---

**Last Updated**: 2024-11-28
**Status**: Ready for program deployment
