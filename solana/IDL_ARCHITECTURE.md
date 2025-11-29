# IDL Architecture & Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CryptoScore Solana Programs                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Factory    │  │    Market    │  │  Dashboard   │          │
│  │   Program    │  │   Program    │  │   Program    │          │
│  │              │  │              │  │              │          │
│  │  lib.rs      │  │  lib.rs      │  │  lib.rs      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
          │   anchor build  │                 │
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Build Output (target/)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    target/idl/                            │   │
│  │                                                            │   │
│  │  • cryptoscore_factory.json     (5.2K, 267 lines)        │   │
│  │  • cryptoscore_market.json      (300B, 17 lines)         │   │
│  │  • cryptoscore_dashboard.json   (297B, 17 lines)         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   target/types/                           │   │
│  │                                                            │   │
│  │  • cryptoscore_factory.ts                                │   │
│  │  • cryptoscore_market.ts                                 │   │
│  │  • cryptoscore_dashboard.ts                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          │   npm run idl:sync
          │   (or manual copy)
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend Integration (app/)                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  app/src/idl/                             │   │
│  │                                                            │   │
│  │  • cryptoscore_factory.json     (5.2K, 267 lines) ✅     │   │
│  │  • cryptoscore_market.json      (300B, 17 lines)  ✅     │   │
│  │  • cryptoscore_dashboard.json   (297B, 17 lines)  ✅     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              app/src/config/programs.ts                   │   │
│  │                                                            │   │
│  │  export { default as FactoryIDL }                        │   │
│  │    from "../idl/cryptoscore_factory.json"                │   │
│  │  export { default as MarketIDL }                         │   │
│  │    from "../idl/cryptoscore_market.json"                 │   │
│  │  export { default as DashboardIDL }                      │   │
│  │    from "../idl/cryptoscore_dashboard.json"              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │
          │   Used by React components
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend Application                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  const program = new Program(                            │   │
│  │    FactoryIDL,                                           │   │
│  │    programId,                                            │   │
│  │    provider                                              │   │
│  │  )                                                       │   │
│  │                                                            │   │
│  │  // Call instructions                                    │   │
│  │  await program.methods                                   │   │
│  │    .createMarket(...)                                    │   │
│  │    .accounts({...})                                      │   │
│  │    .rpc()                                                │   │
│  │                                                            │   │
│  │  // Fetch accounts                                       │   │
│  │  const factory = await program.account                   │   │
│  │    .factory.fetch(factoryPda)                            │   │
│  │                                                            │   │
│  │  // Listen to events                                     │   │
│  │  program.addEventListener('MarketCreated', ...)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Verification Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    npm run idl:verify                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              scripts/verify-idls.sh                       │   │
│  │                                                            │   │
│  │  For each program:                                        │   │
│  │    1. Check if build IDL exists                          │   │
│  │    2. Check if frontend IDL exists                       │   │
│  │    3. Compare checksums (md5sum)                         │   │
│  │    4. Validate JSON syntax                               │   │
│  │    5. Report status                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Output:                                                         │
│  ┌────────────────────────────────────────────────────────┐     │
│  │ 🔹 cryptoscore_factory                                 │     │
│  │    ✅ Synced                                           │     │
│  │    Checksum: 91db14315db974e8a3d41b8bdbc409cb         │     │
│  │    Lines: 267                                          │     │
│  │    ✅ Valid JSON                                       │     │
│  │                                                         │     │
│  │ 🔹 cryptoscore_market                                  │     │
│  │    ✅ Synced                                           │     │
│  │    Checksum: f2472b8f8df2bd78d284dee1b538c69c         │     │
│  │    Lines: 17                                           │     │
│  │    ✅ Valid JSON                                       │     │
│  │                                                         │     │
│  │ 🔹 cryptoscore_dashboard                               │     │
│  │    ✅ Synced                                           │     │
│  │    Checksum: 9a53441472341b1bd20333cd0d30ec6b         │     │
│  │    Lines: 17                                           │     │
│  │    ✅ Valid JSON                                       │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## Factory Program Structure

```
┌─────────────────────────────────────────────────────────────────┐
│              cryptoscore_factory.json (5.2K)                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Instructions (3)                                          │   │
│  │  • initializeFactory(platformFeeBps: u16)                │   │
│  │  • createMarket(matchId, entryFee, kickoffTime, ...)     │   │
│  │  • getMarkets(filterCreator, filterPublic, page, ...)    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Accounts (2)                                              │   │
│  │  • Factory                                                │   │
│  │    - authority: Pubkey                                    │   │
│  │    - marketCount: u64                                     │   │
│  │    - platformFeeBps: u16                                  │   │
│  │    - bump: u8                                             │   │
│  │                                                            │   │
│  │  • MarketRegistry                                         │   │
│  │    - factory: Pubkey                                      │   │
│  │    - marketAddress: Pubkey                                │   │
│  │    - creator: Pubkey                                      │   │
│  │    - matchId: String                                      │   │
│  │    - createdAt: i64                                       │   │
│  │    - isPublic: bool                                       │   │
│  │    - entryFee: u64                                        │   │
│  │    - kickoffTime: i64                                     │   │
│  │    - endTime: i64                                         │   │
│  │    - bump: u8                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Events (1)                                                │   │
│  │  • MarketCreated                                          │   │
│  │    - market: Pubkey (indexed)                             │   │
│  │    - creator: Pubkey (indexed)                            │   │
│  │    - matchId: String                                      │   │
│  │    - entryFee: u64                                        │   │
│  │    - kickoffTime: i64                                     │   │
│  │    - isPublic: bool                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Errors (7)                                                │   │
│  │  6000: InvalidPlatformFee                                │   │
│  │  6001: InvalidMatchId                                    │   │
│  │  6002: MatchIdTooLong                                    │   │
│  │  6003: ZeroEntryFee                                      │   │
│  │  6004: InvalidKickoffTime                                │   │
│  │  6005: InvalidEndTime                                    │   │
│  │  6006: MarketCountOverflow                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Development Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Cycle                             │
│                                                                   │
│  1. Edit Rust Code                                              │
│     programs/factory/src/lib.rs                                 │
│                                                                   │
│  2. Build Programs                                              │
│     anchor build                                                │
│     ↓                                                            │
│     Generates IDL in target/idl/                                │
│                                                                   │
│  3. Verify Sync Status                                          │
│     npm run idl:verify                                          │
│     ↓                                                            │
│     Checks if frontend IDLs match build                         │
│                                                                   │
│  4. Sync to Frontend (if needed)                                │
│     npm run idl:sync                                            │
│     ↓                                                            │
│     Copies IDLs to app/src/idl/                                 │
│                                                                   │
│  5. Commit Changes                                              │
│     git add target/idl/*.json app/src/idl/*.json                │
│     git commit -m "Update IDLs"                                 │
│                                                                   │
│  6. Deploy & Test                                               │
│     anchor deploy                                               │
│     npm run dev (in app/)                                       │
└─────────────────────────────────────────────────────────────────┘
```

## File Sizes & Checksums

| Program | Size | Lines | Checksum |
|---------|------|-------|----------|
| Factory | 5.2K | 267 | `91db14315db974e8a3d41b8bdbc409cb` |
| Market | 300B | 17 | `f2472b8f8df2bd78d284dee1b538c69c` |
| Dashboard | 297B | 17 | `9a53441472341b1bd20333cd0d30ec6b` |

## Program IDs by Network

```
┌──────────────┬──────────────────────────────────────────────────┐
│   Network    │                  Program IDs                      │
├──────────────┼──────────────────────────────────────────────────┤
│  Localnet    │ Factory:   93CjfuYYswDbcjasA1PTUmHhsqFsBQC4Jn... │
│              │ Market:    94CjfuYYswDbcjasA1PTUmHhsqFsBQC4Jn... │
│              │ Dashboard: 95CjfuYYswDbcjasA1PTUmHhsqFsBQC4Jn... │
├──────────────┼──────────────────────────────────────────────────┤
│   Devnet     │ Factory:   5zADKCecxATSEsCuH5MJa1JdfXGeBLNwEY... │
│              │ Market:    3yLMsy3gJRoYP2RNXgnrXsoFWcqVu6QeTX... │
│              │ Dashboard: DHJASkp8vNuyR5xPSyj1G66xExRjnPBUuU... │
└──────────────┴──────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0  
**Last Updated**: 2024-11-28  
**Status**: ✅ All Systems Operational
