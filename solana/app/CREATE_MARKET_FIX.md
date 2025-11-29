# Create Market Flow Fix

## Problem

The 'create market' flow wasn't working because the frontend was only calling the Factory program's `createMarket` instruction, which only creates a registry entry. The actual Market account was never being initialized.

## Root Cause

The Solana program architecture uses two separate programs:

1. **Factory Program** (`cryptoscore_factory`): Manages market registry and tracking
2. **Market Program** (`cryptoscore_market`): Manages individual market state and logic

The Factory's `createMarket` instruction only:
- Creates a `MarketRegistry` account to track the market
- Increments the market count
- Emits a `MarketCreated` event

It does NOT initialize the actual Market account. The Market program has a separate `initializeMarket` instruction that must be called first.

## Solution

Updated `useMarketActions.ts` to perform a two-step market creation:

### Step 1: Initialize Market Account
```typescript
const initMarketTx = await marketProgram.methods
  .initializeMarket(
    params.matchId,
    new BN(params.entryFee),
    new BN(params.kickoffTime),
    new BN(params.endTime),
    params.isPublic
  )
  .accounts({
    market: marketPda,
    factory: factoryPda,
    creator: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

### Step 2: Register in Factory
```typescript
const createMarketTx = await factoryProgram.methods
  .createMarket(
    params.matchId,
    new BN(params.entryFee),
    new BN(params.kickoffTime),
    new BN(params.endTime),
    params.isPublic
  )
  .accounts({
    factory: factoryPda,
    marketRegistry: marketRegistryPda,
    marketAccount: marketPda,
    creator: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

## Additional Improvements

### Better User Feedback
- Changed status message from "Creating market..." to "Initializing market..." for clarity
- Dialog now closes after 2 seconds on success (instead of 5)
- Error messages remain visible for 5 seconds but dialog stays open
- Added null check for signature before setting success state

### Error Handling
- Better error messages with fallback text
- Console logging for both initialization and registration steps
- Proper cleanup of transaction status

## Testing Checklist

- [ ] Market creation completes successfully
- [ ] Both transactions (initialize + register) are confirmed
- [ ] Market appears in dashboard after creation
- [ ] Dialog closes automatically on success (after 2 seconds)
- [ ] Error messages display properly on failure
- [ ] Transaction signatures link to Solana Explorer correctly
- [ ] Console logs show both transaction signatures
- [ ] Market can be joined after creation
- [ ] Market data is correctly stored on-chain

## How to Test

1. **Start the dev server:**
   ```bash
   cd solana/app
   npm run dev
   ```

2. **Connect your wallet:**
   - Make sure you have a Solana wallet (Phantom, Solflare, etc.)
   - Connect to Devnet
   - Ensure you have some devnet SOL (get from https://faucet.solana.com)

3. **Create a market:**
   - Navigate to the homepage
   - Browse upcoming matches
   - Click "Create Market" on any match
   - Set entry fee (e.g., 0.1 SOL)
   - Toggle public/private as desired
   - Click "Create Market"

4. **Verify success:**
   - Check console for two transaction signatures
   - Dialog should show success message and close after 2 seconds
   - Navigate to "My Markets" to see the created market
   - Click on the market to view details

5. **Check on-chain data:**
   - Copy transaction signatures from console
   - Visit https://explorer.solana.com/?cluster=devnet
   - Paste signatures to verify both transactions succeeded
   - Check that Market account and MarketRegistry account were created

## Future Optimization

Consider using Anchor's transaction builder to combine both instructions into a single transaction:

```typescript
const tx = await provider.sendAndConfirm(
  new Transaction()
    .add(initMarketIx)
    .add(createMarketIx)
)
```

This would:
- Reduce transaction fees (single transaction instead of two)
- Improve atomicity (both succeed or both fail)
- Provide better UX (single confirmation instead of two)

## Files Modified

1. `solana/app/src/hooks/useMarketActions.ts` - Added two-step market creation
2. `solana/app/src/components/market/Market.tsx` - Improved dialog state management and error handling
