# 📚 IDL Documentation Index

Complete documentation for CryptoScore Solana program IDLs.

## 🎯 Start Here

**New to the project?** Start with:
1. [IDL_SETUP_COMPLETE.md](./IDL_SETUP_COMPLETE.md) - Current status and quick verification
2. [README_IDL.md](./README_IDL.md) - Overview and quick commands

## 📖 Documentation Files

### Essential Guides

| Document | Purpose | Audience |
|----------|---------|----------|
| **[IDL_SETUP_COMPLETE.md](./IDL_SETUP_COMPLETE.md)** | Current status, verification results, quick commands | Everyone |
| **[README_IDL.md](./README_IDL.md)** | Overview, file locations, development workflow | Developers |
| **[IDL_QUICK_REFERENCE.md](./IDL_QUICK_REFERENCE.md)** | Quick commands, checksums, program IDs | Developers |

### Technical References

| Document | Purpose | Audience |
|----------|---------|----------|
| **[COMPLETE_IDL_REFERENCE.md](./COMPLETE_IDL_REFERENCE.md)** | Complete API documentation for Factory program | Frontend Developers |
| **[IDL_GENERATION_SUMMARY.md](./IDL_GENERATION_SUMMARY.md)** | How IDLs are generated and maintained | DevOps/Maintainers |
| **[IDL_ARCHITECTURE.md](./IDL_ARCHITECTURE.md)** | Visual diagrams and system architecture | Architects/Leads |

## 🛠️ Tools & Scripts

| Tool | Command | Purpose |
|------|---------|---------|
| **Verification Script** | `npm run idl:verify` | Check if IDLs are in sync |
| **Sync Script** | `npm run idl:sync` | Copy IDLs to frontend |
| **List Script** | `npm run idl:list` | List available IDLs |
| **Export Script** | `npm run idl:export` | Export with TypeScript types |

## 📁 File Structure

```
solana/
├── target/
│   ├── idl/                          # Build output (source of truth)
│   │   ├── cryptoscore_factory.json      (5.2K, 267 lines)
│   │   ├── cryptoscore_market.json       (300B, 17 lines)
│   │   └── cryptoscore_dashboard.json    (297B, 17 lines)
│   └── types/                        # TypeScript types
│       ├── cryptoscore_factory.ts
│       ├── cryptoscore_market.ts
│       └── cryptoscore_dashboard.ts
│
├── app/src/
│   ├── idl/                          # Frontend integration
│   │   ├── cryptoscore_factory.json      (5.2K, 267 lines) ✅
│   │   ├── cryptoscore_market.json       (300B, 17 lines)  ✅
│   │   └── cryptoscore_dashboard.json    (297B, 17 lines)  ✅
│   └── config/
│       └── programs.ts               # IDL imports
│
├── scripts/
│   ├── verify-idls.sh                # Verification script
│   └── export-idls.ts                # Export script
│
└── Documentation/
    ├── IDL_SETUP_COMPLETE.md         # Status & verification
    ├── README_IDL.md                 # Overview & workflow
    ├── IDL_QUICK_REFERENCE.md        # Quick commands
    ├── COMPLETE_IDL_REFERENCE.md     # API documentation
    ├── IDL_GENERATION_SUMMARY.md     # Generation process
    ├── IDL_ARCHITECTURE.md           # System architecture
    └── IDL_DOCUMENTATION_INDEX.md    # This file
```

## ✅ Current Status

All IDL files are:
- ✅ Generated from Rust source code
- ✅ Valid JSON format
- ✅ Synced between build and frontend
- ✅ Properly imported in frontend
- ✅ Ready for production use

### Verification Results

```
🔹 cryptoscore_factory
   ✅ Synced - Checksum: 91db14315db974e8a3d41b8bdbc409cb
   ✅ Valid JSON - 267 lines, 5.2K

🔹 cryptoscore_market
   ✅ Synced - Checksum: f2472b8f8df2bd78d284dee1b538c69c
   ✅ Valid JSON - 17 lines, 300B

🔹 cryptoscore_dashboard
   ✅ Synced - Checksum: 9a53441472341b1bd20333cd0d30ec6b
   ✅ Valid JSON - 17 lines, 297B
```

## 🚀 Quick Start

### Verify IDL Status
```bash
cd solana
npm run idl:verify
```

### Rebuild and Sync
```bash
# Rebuild programs
anchor build

# Sync to frontend
npm run idl:sync

# Verify sync
npm run idl:verify
```

### Use in Frontend
```typescript
import { FactoryIDL, MarketIDL, DashboardIDL } from './config/programs'

const program = new Program(FactoryIDL, programId, provider)
```

## 📊 Program Overview

### Factory Program (5.2K)
- **Instructions**: 3 (initializeFactory, createMarket, getMarkets)
- **Accounts**: 2 (Factory, MarketRegistry)
- **Events**: 1 (MarketCreated)
- **Errors**: 7 custom error codes
- **Documentation**: [COMPLETE_IDL_REFERENCE.md](./COMPLETE_IDL_REFERENCE.md)

### Market Program (300B)
- Individual market logic
- Handles predictions and settlements

### Dashboard Program (297B)
- Data aggregation
- Query optimization

## 🔄 Development Workflow

1. **Edit** Rust code in `programs/*/src/lib.rs`
2. **Build** with `anchor build`
3. **Verify** with `npm run idl:verify`
4. **Sync** with `npm run idl:sync` (if needed)
5. **Commit** updated IDL files
6. **Deploy** with `anchor deploy`

## 🌐 Program IDs

### Localnet
- Factory: `93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP`
- Market: `94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ`
- Dashboard: `95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR`

### Devnet
- Factory: `5zADKCecxATSEsCuH5MJa1JdfXGeBLNwEYnkCbqdaYmZ`
- Market: `3yLMsy3gJRoYP2RNXgnrXsoFWcqVu6QeTXPejvpcCf1F`
- Dashboard: `DHJASkp8vNuyR5xPSyj1G66xExRjnPBUuUN4QKiTnadZ`

## 📞 Support

### Common Issues

**IDLs out of sync?**
```bash
npm run idl:verify  # Check status
npm run idl:sync    # Fix sync
```

**Build fails?**
```bash
anchor clean
anchor build
```

**Frontend errors?**
- Check IDL imports in `app/src/config/programs.ts`
- Verify program IDs match network
- Ensure IDLs are synced

### Getting Help

1. Run `npm run idl:verify` to diagnose
2. Check relevant documentation file
3. Review error messages carefully
4. Ensure `anchor build` succeeds

## 🎓 Learning Path

### For Frontend Developers
1. Start with [README_IDL.md](./README_IDL.md)
2. Read [COMPLETE_IDL_REFERENCE.md](./COMPLETE_IDL_REFERENCE.md)
3. Review [IDL_QUICK_REFERENCE.md](./IDL_QUICK_REFERENCE.md)

### For Backend Developers
1. Start with [IDL_GENERATION_SUMMARY.md](./IDL_GENERATION_SUMMARY.md)
2. Review [IDL_ARCHITECTURE.md](./IDL_ARCHITECTURE.md)
3. Check [README_IDL.md](./README_IDL.md) for workflow

### For DevOps/Maintainers
1. Start with [IDL_SETUP_COMPLETE.md](./IDL_SETUP_COMPLETE.md)
2. Review [IDL_GENERATION_SUMMARY.md](./IDL_GENERATION_SUMMARY.md)
3. Familiarize with verification scripts

## 📝 Related Documentation

- **Anchor Documentation**: https://www.anchor-lang.com/
- **Solana Documentation**: https://docs.solana.com/
- **Project README**: [../README.md](../README.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

**Documentation Version**: 1.0  
**Last Updated**: 2024-11-28  
**Status**: ✅ Complete and Current  
**Maintainer**: CryptoScore Team
