# MNEE Configuration Guide

This document provides information about the MNEE SDK configuration and integration in CryptoScore.

## Overview

MNEE is a BSV21 stablecoin that serves as the primary value exchange mechanism in CryptoScore. The MNEE SDK provides methods for balance queries, token transfers, and transaction management.

## Environment Variables

The following environment variables are required for MNEE integration:

### Required Variables

- `VITE_MNEE_API_KEY`: Your MNEE API key (obtain from MNEE dashboard)
- `VITE_MNEE_ENVIRONMENT`: Environment mode (`sandbox` or `production`)

### Optional Variables

- `VITE_MNEE_PLATFORM_FEE_ADDRESS`: Platform fee collection address
- `VITE_PLATFORM_FEE_PERCENTAGE`: Platform fee percentage (default: 5.0)

## Configuration Files

### `src/config/mnee.ts`

Main configuration file that exports:

- `MNEE_SDK_CONFIG`: SDK initialization configuration
- `MNEE_TOKEN_CONFIG`: Token-specific constants
- `MNEE_ENV_CONFIG`: Environment-specific settings
- `MNEE_FEE_CONFIG`: Fee-related configuration
- `MNEE_UNITS`: Unit conversion utilities
- `validateMneeConfig()`: Configuration validation function

### `src/types/mnee.ts`

TypeScript type definitions for MNEE operations:

- SDK type re-exports
- Application-specific interfaces
- Error classes
- Type guards

## Unit Conversion

MNEE uses atomic units for precision:

- **1 MNEE = 100,000 atomic units**
- **Display precision: 5 decimal places**

### Conversion Utilities

```typescript
import { MNEE_UNITS } from '@/config/mnee'

// Convert MNEE tokens to atomic units
const atomicAmount = MNEE_UNITS.toAtomicUnits(1.5) // 150000

// Convert atomic units to MNEE tokens
const mneeAmount = MNEE_UNITS.fromAtomicUnits(150000) // 1.5

// Format atomic units as MNEE string
const formatted = MNEE_UNITS.formatMneeAmount(150000) // "1.50000 MNEE"

// Parse MNEE string to atomic units
const parsed = MNEE_UNITS.parseMneeAmount("1.5 MNEE") // 150000

// Validate amount
MNEE_UNITS.validateAmount(150000) // true or throws error
```

## SDK Usage

### Basic Initialization

```typescript
import Mnee from '@mnee/ts-sdk'
import { MNEE_SDK_CONFIG } from '@/config/mnee'

const mnee = new Mnee(MNEE_SDK_CONFIG)
```

### Balance Queries

```typescript
// Get balance for a single address
const balance = await mnee.balance(address)
console.log(balance.decimalAmount) // MNEE tokens
console.log(balance.amount) // Atomic units

// Get balances for multiple addresses
const balances = await mnee.balances([address1, address2])
```

### Token Transfers

```typescript
// Transfer MNEE tokens
const recipients = [
  { address: recipientAddress, amount: 1.5 } // Amount in MNEE tokens
]

const result = await mnee.transfer(recipients, privateKey)
console.log(result.ticketId) // Transaction ticket ID
```

### Transaction Status

```typescript
// Check transaction status
const status = await mnee.getTxStatus(ticketId)
console.log(status.status) // 'BROADCASTING' | 'SUCCESS' | 'MINED' | 'FAILED'
```

## Verification

Run the MNEE configuration verification script:

```bash
npm run verify:mnee
```

This script checks:
- Environment variables are set correctly
- MNEE SDK can be imported
- Configuration files exist
- API key format is valid

## Testing

Run MNEE configuration tests:

```bash
# Run all MNEE tests
npm run test src/config/__tests__/mnee

# Run specific test files
npm run test src/config/__tests__/mnee.test.ts
npm run test src/config/__tests__/mnee-sdk-integration.test.ts
```

## Environment Setup

### Development (Sandbox)

```env
VITE_MNEE_API_KEY=your_sandbox_api_key
VITE_MNEE_ENVIRONMENT=sandbox
```

### Production

```env
VITE_MNEE_API_KEY=your_production_api_key
VITE_MNEE_ENVIRONMENT=production
VITE_MNEE_PLATFORM_FEE_ADDRESS=your_platform_fee_address
```

## Error Handling

The configuration includes custom error classes:

- `MneeError`: Base error class
- `MneeConfigurationError`: Configuration-related errors
- `MneeTransferError`: Transfer operation errors
- `MneeBalanceError`: Balance query errors

```typescript
import { MneeTransferError } from '@/types/mnee'

try {
  await mnee.transfer(recipients, privateKey)
} catch (error) {
  if (error instanceof MneeTransferError) {
    console.error('Transfer failed:', error.message)
  }
}
```

## Best Practices

1. **Always use atomic units for storage**: Store amounts in the database as atomic units (BIGINT)
2. **Convert for display**: Convert to MNEE tokens only when displaying to users
3. **Validate amounts**: Use `MNEE_UNITS.validateAmount()` before operations
4. **Handle errors gracefully**: Implement proper error handling for all SDK operations
5. **Use environment variables**: Never hardcode API keys or sensitive configuration
6. **Test in sandbox first**: Always test new features in sandbox environment before production

## Security Considerations

1. **API Key Protection**: Never commit API keys to version control
2. **Private Key Management**: Never store private keys in application state
3. **Environment Separation**: Use separate API keys for sandbox and production
4. **Rate Limiting**: Implement proper rate limiting for API calls
5. **Transaction Validation**: Always validate transactions before broadcasting

## Troubleshooting

### Configuration Errors

If you see configuration errors:

1. Check that all required environment variables are set
2. Verify API key is valid and not expired
3. Ensure environment is set to 'sandbox' or 'production'
4. Run `npm run verify:mnee` to diagnose issues

### SDK Import Errors

If the SDK fails to import:

1. Verify `@mnee/ts-sdk` is installed: `npm list @mnee/ts-sdk`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check TypeScript configuration is compatible

### Type Errors

If you encounter TypeScript errors:

1. Ensure you're importing types from the correct location
2. Use `import type` for type-only imports
3. Check that SDK types are properly re-exported in `src/types/mnee.ts`

## Additional Resources

- [MNEE Documentation](https://docs.mnee.io)
- [MNEE SDK GitHub](https://github.com/mnee-xyz/mnee)
- [BSV21 Token Standard](https://docs.1satordinals.com/bsv21)

## Support

For issues related to:
- **MNEE SDK**: Open an issue on the [MNEE GitHub repository](https://github.com/mnee-xyz/mnee/issues)
- **CryptoScore Integration**: Contact the development team or open an issue in the project repository