# IDL Address Field Fix

## Problem

After fixing the program initialization to use IDL metadata, the programs were still not initializing correctly. The error was:

```
Failed to create market: Error: Transaction failed - no signature returned
```

This was because `createMarket` was returning `null`, indicating that the programs weren't properly initialized.

## Root Cause

Anchor 0.30+ expects the program address to be at the **top level** of the IDL as `idl.address`, NOT nested as `idl.metadata.address`.

Looking at Anchor's source code:
```javascript
// From @coral-xyz/anchor/dist/cjs/program/index.js
constructor(idl, provider, coder, getCustomResolver) {
    // ...
    this._programId = (0, common_js_1.translateAddress)(idl.address);
    // ...
}
```

The constructor reads `idl.address` directly, not `idl.metadata.address`.

## Solution

Updated `solana/scripts/copy-idls.js` to add BOTH fields:

```javascript
// Add address at top level (required by Anchor 0.30+)
if (!idl.address) {
  idl.address = programId;
  console.log(`  ℹ️  Added address: ${programId}`);
}

// Also add metadata.address for compatibility
if (!idl.metadata) {
  idl.metadata = { address: programId };
  console.log(`  ℹ️  Added metadata.address: ${programId}`);
}
```

## IDL Structure

**Before (incorrect):**
```json
{
  "version": "0.1.0",
  "name": "cryptoscore_factory",
  "instructions": [...],
  "metadata": {
    "address": "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP"
  }
}
```

**After (correct):**
```json
{
  "version": "0.1.0",
  "name": "cryptoscore_factory",
  "instructions": [...],
  "address": "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP",
  "metadata": {
    "address": "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP"
  }
}
```

## Verification

After running `node scripts/copy-idls.js`, verify the IDLs:

```bash
# Check Factory IDL
tail -10 app/src/idl/cryptoscore_factory.json

# Check Market IDL  
tail -10 app/src/idl/cryptoscore_market.json

# Check Dashboard IDL
tail -10 app/src/idl/cryptoscore_dashboard.json
```

Each should show:
```json
  ],
  "address": "...",
  "metadata": {
    "address": "..."
  }
}
```

## Testing

The programs should now initialize correctly with:

```typescript
const program = new Program(IDL as any, provider)
console.log('Program ID:', program.programId.toString())
// Should output the correct program ID from IDL
```

## Additional Improvements

Added better error logging in `useMarketActions.ts`:

```typescript
if (!factoryProgram || !marketProgram || !provider || !wallet.publicKey) {
  const missingItems = []
  if (!factoryProgram) missingItems.push('factoryProgram')
  if (!marketProgram) missingItems.push('marketProgram')
  if (!provider) missingItems.push('provider')
  if (!wallet.publicKey) missingItems.push('wallet')
  
  console.error('Cannot create market:', missingItems.join(', '))
  // ...
}
```

This helps identify exactly what's missing if initialization fails.

## Files Modified

1. `solana/scripts/copy-idls.js` - Added top-level `address` field
2. `solana/app/src/idl/*.json` - Regenerated with correct structure
3. `solana/app/src/hooks/useMarketActions.ts` - Added better error logging

## Related Documentation

- Anchor Program Constructor: `@coral-xyz/anchor/dist/cjs/program/index.js`
- IDL Structure: Anchor expects `idl.address` at top level
- Program Initialization: `new Program(idl, provider)` uses `idl.address`
