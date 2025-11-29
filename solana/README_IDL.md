# IDL Documentation Index

This directory contains comprehensive documentation for the CryptoScore Solana program IDLs.

## 📚 Documentation Files

### Quick Start
- **[IDL_SETUP_COMPLETE.md](./IDL_SETUP_COMPLETE.md)** - Start here! Overview and verification results
- **[IDL_QUICK_REFERENCE.md](./IDL_QUICK_REFERENCE.md)** - Quick commands and checksums

### Detailed Documentation
- **[IDL_GENERATION_SUMMARY.md](./IDL_GENERATION_SUMMARY.md)** - How IDLs are generated and maintained
- **[COMPLETE_IDL_REFERENCE.md](./COMPLETE_IDL_REFERENCE.md)** - Complete API reference for Factory program

### Tools
- **[scripts/verify-idls.sh](./scripts/verify-idls.sh)** - Automated verification script
- **[scripts/export-idls.ts](./scripts/export-idls.ts)** - IDL export and sync tool

## 🚀 Quick Commands

```bash
# Verify all IDLs are in sync
npm run idl:verify

# Rebuild programs and generate IDLs
anchor build

# Sync IDLs to frontend (quick method)
npm run idl:sync

# List available IDLs with details
npm run idl:list
```

## 📁 IDL Locations

### Build Output
```
target/idl/
├── cryptoscore_factory.json     (267 lines)
├── cryptoscore_market.json      (17 lines)
└── cryptoscore_dashboard.json   (17 lines)
```

### Frontend Integration
```
app/src/idl/
├── cryptoscore_factory.json     (267 lines)
├── cryptoscore_market.json      (17 lines)
└── cryptoscore_dashboard.json   (17 lines)
```

### TypeScript Types
```
target/types/
├── cryptoscore_factory.ts
├── cryptoscore_market.ts
└── cryptoscore_dashboard.ts
```

## ✅ Current Status

All IDL files are:
- ✅ Generated and valid JSON
- ✅ Synced between build and frontend
- ✅ Properly imported in frontend code
- ✅ Ready for production use

## 🔍 Verification

Run the verification script anytime:

```bash
npm run idl:verify
```

Expected output:
```
✅ All IDL files are in sync!

📝 Summary:
   - All 3 programs verified
   - Build and frontend IDLs match
   - All JSON files are valid
```

## 📖 Program Overview

### CryptoScore Factory
- **Instructions**: 3 (initializeFactory, createMarket, getMarkets)
- **Accounts**: 2 (Factory, MarketRegistry)
- **Events**: 1 (MarketCreated)
- **Errors**: 7 custom error codes
- **IDL Size**: 267 lines

### CryptoScore Market
- Individual market logic
- IDL Size: 17 lines

### CryptoScore Dashboard
- Data aggregation and queries
- IDL Size: 17 lines

## 🛠️ Development Workflow

1. **Make changes** to Rust program in `programs/*/src/lib.rs`
2. **Build** with `anchor build` (generates IDLs)
3. **Verify** with `npm run idl:verify`
4. **Sync** with `npm run idl:sync` if needed
5. **Commit** updated IDL files to git

## 📝 Frontend Usage

```typescript
// Import IDLs
import { FactoryIDL, MarketIDL, DashboardIDL } from './config/programs'

// Create program instance
const program = new Program(FactoryIDL, programId, provider)

// Call instructions
await program.methods
  .initializeFactory(100)
  .accounts({ /* ... */ })
  .rpc()

// Fetch accounts
const factory = await program.account.factory.fetch(factoryPda)

// Listen to events
program.addEventListener('MarketCreated', (event) => {
  console.log('New market:', event.market.toString())
})
```

## 🔗 Related Files

- **Smart Contracts**: `programs/*/src/lib.rs`
- **Frontend Config**: `app/src/config/programs.ts`
- **Anchor Config**: `Anchor.toml`
- **Package Scripts**: `package.json`

## 📞 Support

For issues:
1. Run `npm run idl:verify` to check status
2. Review documentation in this directory
3. Check `COMPLETE_IDL_REFERENCE.md` for API details
4. Ensure `anchor build` completes successfully

---

**Last Updated**: 2024-11-28  
**Status**: ✅ All Systems Operational
