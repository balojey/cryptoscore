# Anchor-Free Solana Integration Design Document

## Overview

This design document outlines the technical architecture for removing Anchor framework dependencies from the CryptoScore Solana frontend. The implementation replaces Anchor's client-side abstractions with native Solana web3.js, custom transaction builders, Borsh serialization, and manual account decoding. This approach reduces bundle size, eliminates third-party framework dependencies, and provides full control over transaction construction while maintaining identical UI/UX.

## Architecture

### High-Level Architecture

The system consists of multiple layers:

1. **UI Layer** - Existing React components (unchanged)
2. **Custom Hooks Layer** - Modified to use new Solana utilities
3. **Solana Integration Layer** - New utilities for transaction building, encoding, and decoding
4. **@solana/web3.js** - Core Solana library

### Directory Structure

```
solana/app/src/
├── lib/
│   ├── solana/
│   │   ├── transaction-builder.ts    # Transaction construction
│   │   ├── instruction-encoder.ts    # Borsh serialization
│   │   ├── account-decoder.ts        # Account deserialization
│   │   ├── pda-utils.ts              # PDA derivation
│   │   ├── borsh-schemas.ts          # Borsh type definitions
│   │   ├── error-handler.ts          # Error parsing
│   │   └── utils.ts                  # Common utilities
│   └── utils.ts                      # Existing utilities
├── types/
│   └── solana-program-types.ts       # Program account interfaces
├── hooks/
│   ├── useSolanaConnection.ts        # Connection management
│   ├── useMarketData.ts              # Market data fetching (updated)
│   ├── useMarketActions.ts           # Market actions (updated)
│   └── useAccountSubscription.ts     # WebSocket subscriptions
└── config/
    └── programs.ts                   # Program IDs and config
```

## Components and Interfaces

### 1. Transaction Builder
Constructs Solana transactions with compute budget and priority fees.

### 2. Instruction Encoder
Encodes instruction data using Borsh serialization for all program instructions (create_market, join_market, resolve_market, withdraw).

### 3. Account Decoder
Deserializes account data from on-chain state for Market, Participant, Factory, and UserStats accounts.

### 4. PDA Utilities
Derives Program Derived Addresses for factory, market, participant, and user stats accounts.

### 5. Error Handler
Parses Solana program errors and maps them to user-friendly messages.

### 6. Solana Utilities
Common utility functions for lamports conversion, address formatting, transaction confirmation, and simulation.

## Data Models

TypeScript interfaces for all program accounts (Market, Participant, Factory, UserStats) with proper enum definitions for MarketStatus and MatchOutcome.

## Custom Hooks

- **useSolanaConnection**: Manages Solana connection and wallet state
- **useMarketData**: Fetches and decodes market data without Anchor
- **useMarketActions**: Executes market operations (create, join, resolve, withdraw)
- **useAccountSubscription**: Subscribes to account changes via WebSocket

## Error Handling

Custom error types and parsing logic for wallet, transaction, program, and network errors.

## Testing Strategy

- Unit tests for utilities and decoders
- Integration tests for full transaction flows
- Manual testing on devnet with real wallets

## Performance Optimizations

- Batch account fetching using getMultipleAccountsInfo
- Transaction simulation before sending
- React Query caching with stale-while-revalidate
- WebSocket subscriptions for real-time updates

## Migration Path

1. **Phase 1**: Setup (remove Anchor, add dependencies, create structure)
2. **Phase 2**: Core Utilities (implement all utility classes)
3. **Phase 3**: Hooks Migration (update all custom hooks)
4. **Phase 4**: Testing & Polish (comprehensive testing and optimization)

## Security Considerations

- Transaction verification before sending
- Input validation for all parameters
- Proper error handling without exposing sensitive details
- Account ownership and permission checks

## Documentation

Comprehensive README with architecture explanation, usage examples, and troubleshooting guide.

---

**Note**: This is a high-level design overview. Detailed implementation code for each component is available in the full design specification. The key principle is replacing Anchor abstractions with native Solana web3.js while maintaining identical functionality and user experience.
