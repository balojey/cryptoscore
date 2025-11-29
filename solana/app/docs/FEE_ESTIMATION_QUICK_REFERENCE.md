# Fee Estimation Quick Reference

## Quick Start

### 1. Automatic Fee Estimation (Recommended)

```typescript
import { useMarketActions } from '../hooks/useMarketActions'
import { FeeEstimateDisplay } from '../components/FeeEstimateDisplay'

function MyComponent() {
  const { createMarket, estimatedFee } = useMarketActions()
  
  return (
    <div>
      <FeeEstimateDisplay feeEstimate={estimatedFee} />
      <button onClick={() => createMarket(params)}>
        Create Market
      </button>
    </div>
  )
}
```

### 2. Manual Fee Estimation

```typescript
import { TransactionBuilder } from '../lib/solana/transaction-builder'

const builder = new TransactionBuilder()
builder.addInstruction(myInstruction)

// Preview fee (non-consuming)
const fee = await builder.previewFee(connection, publicKey)
console.log(`Fee: ${fee.feeInSol} SOL`)

// Build transaction
const tx = await builder.build(connection)
```

### 3. Utility Function

```typescript
import { SolanaUtils } from '../lib/solana/utils'

const fee = await SolanaUtils.estimateTransactionFee(
  connection,
  transaction,
  2 // retries
)

console.log(SolanaUtils.formatFee(fee))
```

## Key Methods

| Method | Use Case | Consumes Builder |
|--------|----------|------------------|
| `builder.previewFee()` | Preview before building | ❌ No |
| `builder.estimateFee()` | Estimate and build | ✅ Yes |
| `SolanaUtils.estimateTransactionFee()` | Utility with retry | N/A |

## FeeEstimate Object

```typescript
{
  fee: 5000,              // lamports
  feeInSol: 0.000005,     // SOL
  success: true,          // estimation succeeded
  error?: string          // error message if failed
}
```

## Common Patterns

### Display Fee Before Confirmation

```typescript
const fee = await builder.previewFee(connection, publicKey)

if (fee.success) {
  const confirmed = confirm(`Fee: ${SolanaUtils.formatFee(fee.fee)}`)
  if (confirmed) {
    // Send transaction
  }
}
```

### Handle Estimation Failure

```typescript
const fee = await builder.previewFee(connection, publicKey)

if (!fee.success) {
  console.warn('Fee estimation failed:', fee.error)
  // Continue with transaction anyway
}
```

### Retry on Network Changes

```typescript
const fee = await SolanaUtils.estimateTransactionFee(
  connection,
  transaction,
  3 // retry up to 3 times
)
```

## UI Components

### FeeEstimateDisplay

```typescript
<FeeEstimateDisplay
  feeEstimate={estimatedFee}
  isEstimating={isLoading}
  showDetails={true}
  className="my-4"
/>
```

## Requirements Satisfied

✅ **14.1** - Uses `connection.getFeeForMessage` for fee estimation  
✅ **14.2** - Displays estimated fee before transaction confirmation  
✅ **14.3** - Handles fee estimation failures gracefully  
✅ **14.4** - Updates estimates when network conditions change (retry logic)  
✅ **14.5** - Includes compute budget instructions when necessary

## See Also

- [Complete Fee Estimation Guide](./FEE_ESTIMATION_GUIDE.md)
- [Transaction Builder Documentation](./TRANSACTION_BUILDER_GUIDE.md)
