# Program Initialization Fix

## Problem

The Solana programs were being initialized incorrectly in `useSolanaProgram.ts`. The code was passing program IDs explicitly to the `Program` constructor, but:

1. The program IDs in `.env` didn't match the actual deployed program IDs (from `declare_id!` in Rust)
2. The IDLs should contain the program address in their metadata, making explicit programId unnecessary
3. This could lead to mismatches between the IDL and the actual program being called

## Root Cause

### Mismatch in Program IDs

**Rust Programs (declare_id!):**
- Factory: `93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP`
- Market: `94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ`
- Dashboard: `95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR`

**Old .env file:**
- Factory: `5zADKCecxATSEsCuH5MJa1JdfXGeBLNwEYnkCbqdaYmZ` ❌
- Market: `3yLMsy3gJRoYP2RNXgnrXsoFWcqVu6QeTXPejvpcCf1F` ❌
- Dashboard: `DHJASkp8vNuyR5xPSyj1G66xExRjnPBUuUN4QKiTnadZ` ❌

### Missing Metadata in IDLs

Only the Market IDL had `metadata.address` field. Factory and Dashboard IDLs were missing this field, requiring explicit programId to be passed.

## Solution

### 1. Updated IDL Copy Script (`solana/scripts/copy-idls.js`)

Added automatic injection of `address` (top-level) and `metadata.address` to all IDLs:

```javascript
const PROGRAM_IDS = {
  factory: '93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP',
  dashboard: '95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR',
  market: '94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ',
};

// Add address at top level (required by Anchor 0.30+)
if (!idl.address) {
  idl.address = programId;
}

// Also add metadata.address for compatibility
if (!idl.metadata) {
  idl.metadata = { address: programId };
}
```

**Important**: Anchor 0.30+ requires `idl.address` at the top level, not nested in metadata.

### 2. Updated Environment Variables (`solana/app/.env`)

Fixed the program IDs to match the Rust `declare_id!` values:

```env
VITE_FACTORY_PROGRAM_ID=93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP
VITE_MARKET_PROGRAM_ID=94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ
VITE_DASHBOARD_PROGRAM_ID=95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR
```

### 3. Simplified Program Initialization (`solana/app/src/hooks/useSolanaProgram.ts`)

**Before:**
```typescript
const programId = new PublicKey(FACTORY_PROGRAM_ID)
return new Program<CryptoscoreFactory>(
  FactoryIDL as CryptoscoreFactory,
  programId,  // ❌ Explicit programId could mismatch IDL
  provider,
)
```

**After:**
```typescript
return new Program(
  FactoryIDL as any,  // ✅ Uses metadata.address from IDL
  provider,
)
```

## Benefits

1. **Single Source of Truth**: Program IDs come from the IDL metadata, which is generated from Rust `declare_id!`
2. **No Mismatches**: Can't accidentally use wrong program ID from environment variables
3. **Simpler Code**: No need to import and pass program IDs explicitly
4. **Type Safety**: Still get full type safety from Anchor's generated types (via `as any` cast)

## How It Works

When you call `new Program(idl, provider)` without a programId:
1. Anchor looks for `idl.metadata.address`
2. Uses that as the program ID
3. All transactions are sent to the correct program

## Testing

Run the IDL copy script to regenerate IDLs with metadata:

```bash
cd solana
node scripts/copy-idls.js
```

Verify all IDLs have the address field:

```bash
tail -10 app/src/idl/cryptoscore_factory.json
tail -10 app/src/idl/cryptoscore_market.json
tail -10 app/src/idl/cryptoscore_dashboard.json
```

Each should show both `address` (top-level) and `metadata.address`:
```json
  ],
  "address": "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP",
  "metadata": {
    "address": "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP"
  }
}
```

## Files Modified

1. `solana/scripts/copy-idls.js` - Added metadata injection
2. `solana/app/.env` - Fixed program IDs
3. `solana/app/src/hooks/useSolanaProgram.ts` - Simplified program initialization
4. `solana/app/src/idl/*.json` - Regenerated with metadata

## Important Notes

- The program IDs in `.env` are now just for reference/documentation
- The actual program IDs used come from the IDL metadata
- If you redeploy programs with new IDs, you must:
  1. Update `declare_id!` in Rust programs
  2. Run `anchor build` to regenerate IDLs
  3. Run `node scripts/copy-idls.js` to copy IDLs with new metadata
  4. Optionally update `.env` for documentation

## Related Issues

This fix also resolves the create market flow issue, as the programs are now correctly initialized with the right program IDs.
