# IDL Quick Reference

## All IDLs Status: ✅ Verified

All three program IDLs are correctly generated and synchronized between build output and frontend.

| Program | Build IDL | Frontend IDL | Status |
|---------|-----------|--------------|--------|
| Factory | `target/idl/cryptoscore_factory.json` | `app/src/idl/cryptoscore_factory.json` | ✅ Synced |
| Market | `target/idl/cryptoscore_market.json` | `app/src/idl/cryptoscore_market.json` | ✅ Synced |
| Dashboard | `target/idl/cryptoscore_dashboard.json` | `app/src/idl/cryptoscore_dashboard.json` | ✅ Synced |

## Checksums

```
Factory:    91db14315db974e8a3d41b8bdbc409cb
Market:     f2472b8f8df2bd78d284dee1b538c69c
Dashboard:  9a53441472341b1bd20333cd0d30ec6b
```

## Quick Commands

```bash
# Verify all IDLs are in sync
cd solana
diff target/idl/cryptoscore_factory.json app/src/idl/cryptoscore_factory.json
diff target/idl/cryptoscore_market.json app/src/idl/cryptoscore_market.json
diff target/idl/cryptoscore_dashboard.json app/src/idl/cryptoscore_dashboard.json

# Rebuild and regenerate IDLs
anchor build

# Copy IDLs to frontend (manual method)
cp target/idl/*.json app/src/idl/

# Verify checksums
md5sum target/idl/*.json app/src/idl/*.json | sort -k2
```

## Frontend Usage

```typescript
// Import IDLs
import { FactoryIDL, MarketIDL, DashboardIDL } from './config/programs'

// Create program instances
const factoryProgram = new Program(FactoryIDL, FACTORY_PROGRAM_ID, provider)
const marketProgram = new Program(MarketIDL, MARKET_PROGRAM_ID, provider)
const dashboardProgram = new Program(DashboardIDL, DASHBOARD_PROGRAM_ID, provider)
```

## Program IDs

### Localnet
- Factory: `93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP`
- Market: `94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ`
- Dashboard: `95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR`

### Devnet
- Factory: `5zADKCecxATSEsCuH5MJa1JdfXGeBLNwEYnkCbqdaYmZ`
- Market: `3yLMsy3gJRoYP2RNXgnrXsoFWcqVu6QeTXPejvpcCf1F`
- Dashboard: `DHJASkp8vNuyR5xPSyj1G66xExRjnPBUuUN4QKiTnadZ`

---

**Last Verified**: 2024-11-28  
**All Systems**: ✅ Operational
