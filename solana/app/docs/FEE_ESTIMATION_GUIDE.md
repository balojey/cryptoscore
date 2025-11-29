# Fee Estimation Guide

## Overview

The fee estimation system provides accurate transaction fee predictions before sending transactions to the Solana network. This helps users understand the cost of their actions and ensures transparency in the transaction process.

## Features

- **Automatic Estimation**: Fees are estimated automatically before each transaction
- **Network Condition Handling**: Retries with fresh blockhash when network conditions change
- **Graceful Degradation**: Transactions proceed even if fee estimation fails
- **Multiple Estimation Methods**: Support for both consuming and non-consuming estimation
- **User-Friendly Display**: Pre-built UI components for showing fee estimates

## Architecture

### Core Components

1. **TransactionBuilder** - Provides `estimateFee()` and `previewFee()` methods
2. **SolanaUtils** - Utility functions for fee estimation with retry logic
3. **useFeeEstimation** - React hook for fee estimation in components
4. **useMarketActions** - Integrated fee estimation in all market operations
5. **FeeEstimateDisplay** - UI component for displaying fee estimates

## Usage

### 1. Using TransactionBuilder

#### Method 1: estimateFee() - Consumes the builder

```typescript
import { TransactionBuilder } from '../lib/solana/transaction-builder'
import { Connection, PublicKey } from '@solana/web3.js'

const builder = new TransactionBuilder({
  computeUnitLimit: 200000,
  computeUnitPrice: 1,
})

builder.addInstruction(myInstruction)

// Estimate fee (this builds the transaction)
const feeEstimate = await builder.estimateFee(connection, feePayer)

if (feeEstimate.success) {
  console.log(`Estimated fee: ${feeEstimate.feeInSol} SOL`)
  console.log(`Estimated fee: ${feeEstimate.fee} lamports`)
}
else {
  console.error(`Fee estimation failed: ${feeEstimate.error}`)
}
```

#### Method 2: previewFee() - Non-consuming (recommended)

```typescript
// Preview fee without consuming the builder
const feeEstimate = await builder.previewFee(connection, feePayer)

if (feeEstimate.success) {
  console.log(`Estimated fee: ${feeEstimate.feeInSol} SOL`)
}

// Builder can still be used to build the transaction
const transaction = await builder.build(connection)
```

### 2. Using SolanaUtils

```typescript
import { SolanaUtils } from '../lib/solana/utils'
import { Transaction } from '@solana/web3.js'

// Estimate fee with automatic retry
const fee = await SolanaUtils.estimateTransactionFee(
  connection,
  transaction,
  2 // maxRetries
)

if (fee !== null) {
  console.log(`Fee: ${SolanaUtils.formatFee(fee)}`)
}
```

### 3. Using useFeeEstimation Hook

```typescript
import { useFeeEstimation } from '../hooks/useFeeEstimation'

function MyComponent() {
  const {
    feeEstimate,
    isEstimating,
    estimateFee,
    formatFee,
  } = useFeeEstimation({
    enabled: true,
    autoRefresh: false,
  })

  const handleEstimate = async () => {
    const estimate = await estimateFee(myTransaction, feePayer)
    console.log(`Fee: ${formatFee()}`)
  }

  return (
    <div>
      {isEstimating && <p>Estimating...</p>}
      {feeEstimate?.success && <p>Fee: {formatFee()}</p>}
      <button onClick={handleEstimate}>Estimate Fee</button>
    </div>
  )
}
```

### 4. Using useMarketActions (Automatic)

```typescript
import { useMarketActions } from '../hooks/useMarketActions'
import { FeeEstimateDisplay } from '../components/FeeEstimateDisplay'

function CreateMarketForm() {
  const { createMarket, estimatedFee, isLoading } = useMarketActions()

  const handleSubmit = async () => {
    // Fee is automatically estimated before transaction
    await createMarket({
      matchId: 'match-123',
      entryFee: 1000000,
      kickoffTime: Date.now() / 1000 + 3600,
      endTime: Date.now() / 1000 + 7200,
      isPublic: true,
    })
  }

  return (
    <div>
      {/* Display the estimated fee */}
      <FeeEstimateDisplay
        feeEstimate={estimatedFee}
        isEstimating={isLoading}
        showDetails={true}
      />
      
      <button onClick={handleSubmit}>Create Market</button>
    </div>
  )
}
```

### 5. Using FeeEstimateDisplay Component

```typescript
import { FeeEstimateDisplay } from '../components/FeeEstimateDisplay'

<FeeEstimateDisplay
  feeEstimate={feeEstimate}
  isEstimating={false}
  showDetails={true}
  className="my-4"
/>
```

## API Reference

### FeeEstimate Interface

```typescript
interface FeeEstimate {
  fee: number          // Fee in lamports
  feeInSol: number     // Fee in SOL
  success: boolean     // Whether estimation succeeded
  error?: string       // Error message if failed
}
```

### TransactionBuilder Methods

#### estimateFee(connection, feePayer)

Estimates the fee for the transaction. This method builds the transaction internally.

**Parameters:**
- `connection: Connection` - Solana connection instance
- `feePayer: PublicKey` - Public key of the fee payer

**Returns:** `Promise<FeeEstimate>`

#### previewFee(connection, feePayer)

Previews the fee without consuming the builder. Recommended for most use cases.

**Parameters:**
- `connection: Connection` - Solana connection instance
- `feePayer: PublicKey` - Public key of the fee payer

**Returns:** `Promise<FeeEstimate>`

### SolanaUtils Methods

#### estimateTransactionFee(connection, transaction, maxRetries)

Estimates fee with retry logic for handling network condition changes.

**Parameters:**
- `connection: Connection` - Solana connection instance
- `transaction: Transaction` - Transaction to estimate
- `maxRetries: number` - Maximum retry attempts (default: 2)

**Returns:** `Promise<number | null>` - Fee in lamports, or null if failed

#### formatFee(lamports, includeSymbol)

Formats fee for display.

**Parameters:**
- `lamports: number` - Fee in lamports
- `includeSymbol: boolean` - Whether to include "SOL" (default: true)

**Returns:** `string` - Formatted fee string

### useFeeEstimation Hook

#### Options

```typescript
interface UseFeeEstimationOptions {
  enabled?: boolean           // Enable/disable estimation (default: true)
  autoRefresh?: boolean       // Auto-refresh estimates (default: false)
  refreshInterval?: number    // Refresh interval in ms (default: 30000)
}
```

#### Return Value

```typescript
{
  feeEstimate: FeeEstimate | null
  isEstimating: boolean
  lastUpdated: Date | null
  estimateFee: (transaction, feePayer?) => Promise<FeeEstimate>
  refreshEstimate: (transaction, feePayer?) => Promise<FeeEstimate>
  clearEstimate: () => void
  formatFee: (includeSymbol?) => string
}
```

## Error Handling

### Common Errors

1. **Blockhash Expired**
   - Error: "Unable to estimate fee - blockhash may be expired"
   - Solution: Automatic retry with fresh blockhash

2. **Network Unavailable**
   - Error: "Fee estimation failed"
   - Solution: Transaction proceeds with default fee

3. **No Fee Payer**
   - Error: "No fee payer available"
   - Solution: Ensure wallet is connected

### Graceful Degradation

The system is designed to handle failures gracefully:

```typescript
const feeEstimate = await builder.previewFee(connection, publicKey)

if (feeEstimate.success) {
  console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
}
else {
  console.warn('Fee estimation failed:', feeEstimate.error)
  // Transaction continues anyway
}
```

## Best Practices

### 1. Use previewFee() for Non-Destructive Estimation

```typescript
// ✅ Good - doesn't consume the builder
const feeEstimate = await builder.previewFee(connection, publicKey)
const transaction = await builder.build(connection)

// ❌ Avoid - consumes the builder
const feeEstimate = await builder.estimateFee(connection, publicKey)
// Can't use builder.build() anymore
```

### 2. Display Fees Before Confirmation

```typescript
// Show fee estimate before user confirms
const feeEstimate = await builder.previewFee(connection, publicKey)

if (feeEstimate.success) {
  const confirmed = await showConfirmDialog(
    `This transaction will cost approximately ${SolanaUtils.formatFee(feeEstimate.fee)}`
  )
  
  if (confirmed) {
    // Proceed with transaction
  }
}
```

### 3. Handle Network Condition Changes

```typescript
// Use retry logic for robust estimation
const fee = await SolanaUtils.estimateTransactionFee(
  connection,
  transaction,
  3 // Retry up to 3 times
)
```

### 4. Log Estimates for Debugging

```typescript
if (feeEstimate.success) {
  console.log(`Estimated fee: ${SolanaUtils.formatFee(feeEstimate.fee)}`)
}
else {
  console.warn('Fee estimation failed:', feeEstimate.error)
}
```

## Performance Considerations

- Fee estimation adds ~100-200ms to transaction preparation
- Retry logic may add additional latency (500ms per retry)
- Consider caching estimates for similar transactions
- Auto-refresh should be used sparingly to avoid rate limits

## Testing

### Manual Testing

1. Connect wallet to devnet
2. Initiate a transaction (e.g., create market)
3. Verify fee estimate is displayed
4. Check console for fee logs
5. Confirm transaction proceeds even if estimation fails

### Test Scenarios

- ✅ Normal fee estimation
- ✅ Blockhash expiration during estimation
- ✅ Network unavailable during estimation
- ✅ Multiple rapid estimations
- ✅ Estimation with different compute budgets

## Troubleshooting

### Fee Estimate Shows 0

**Cause:** Estimation failed or not yet performed
**Solution:** Check console for error messages, ensure wallet is connected

### Fee Estimate Takes Too Long

**Cause:** Network latency or rate limiting
**Solution:** Reduce retry attempts or use cached estimates

### Fee Estimate Differs from Actual Fee

**Cause:** Network conditions changed between estimation and execution
**Solution:** This is expected; estimates are approximate

## Future Enhancements

- [ ] Fee history tracking
- [ ] Fee prediction based on network congestion
- [ ] Recommended priority fees
- [ ] Fee comparison across RPC endpoints
- [ ] User-configurable fee preferences

## Related Documentation

- [Transaction Builder Guide](./TRANSACTION_BUILDER_GUIDE.md)
- [Solana Utils Reference](./SOLANA_UTILS_REFERENCE.md)
- [Market Actions Guide](./MARKET_ACTIONS_GUIDE.md)

---

**Version:** 1.0.0  
**Last Updated:** 2024-11-30  
**Status:** Production Ready ✅
