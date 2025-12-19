# Project Structure & Organization

## Root Directory Layout

```
cryptoscore-solana/
├── programs/           # Solana programs (Rust/Anchor)
├── app/               # React frontend application
├── tests/             # Integration tests for Solana programs
├── scripts/           # Build, deployment, and utility scripts
├── migrations/        # Database-like migration scripts
├── deployments/       # Deployment artifacts and configs
├── solana/           # Solana-specific configuration files
└── target/           # Compiled Rust artifacts (generated)
```

## Solana Programs (`/programs/`)

Three modular programs following single-responsibility principle:

```
programs/
├── factory/          # Market creation and registry
│   ├── src/lib.rs   # Factory program logic
│   └── Cargo.toml   # Rust dependencies
├── market/           # Core prediction market logic
│   ├── src/lib.rs   # Market program logic  
│   └── Cargo.toml   # Rust dependencies
└── dashboard/        # Data aggregation and queries
    ├── src/lib.rs   # Dashboard program logic
    └── Cargo.toml   # Rust dependencies
```

### Program Responsibilities
- **Factory**: Market creation, registry management, platform fees
- **Market**: Participant management, predictions, resolution, rewards
- **Dashboard**: Data aggregation, analytics, cross-program queries

## Frontend Application (`/app/`)

React application following feature-based organization:

```
app/src/
├── components/       # Reusable UI components
│   ├── ui/          # Base UI primitives (shadcn/ui style)
│   ├── auth/        # Authentication components
│   ├── market/      # Market-specific components
│   ├── terminal/    # Trading terminal components
│   ├── landing/     # Landing page components
│   ├── layout/      # Layout components (Header, Footer)
│   └── charts/      # Chart and visualization components
├── pages/           # Route-level page components
├── hooks/           # Custom React hooks
├── contexts/        # React context providers
├── lib/             # Utility libraries and services
│   ├── solana/     # Solana-specific utilities
│   └── crossmint/  # Crossmint integration
├── config/          # Configuration files
├── types/           # TypeScript type definitions
├── utils/           # General utility functions
├── styles/          # CSS files and styling
└── idl/            # Generated Anchor IDL files
```

## Component Organization Patterns

### UI Components (`/components/ui/`)
- Base components following shadcn/ui patterns
- Radix UI primitives with custom styling
- Reusable across the entire application

### Feature Components (`/components/[feature]/`)
- Domain-specific components (market, auth, terminal)
- Business logic encapsulation
- Feature-focused organization

### Page Components (`/pages/`)
- Route-level components
- Lazy-loaded for performance
- Minimal logic, compose feature components

## Custom Hooks Pattern (`/hooks/`)

Hooks follow naming convention `use[Feature][Action]`:
- `useMarketData()` - Fetch market information
- `useMarketActions()` - Market transaction methods
- `useSolanaProgram()` - Program initialization
- `useWinnings()` - Calculate user winnings
- `useRealtimeMarkets()` - WebSocket market updates

## Configuration Management (`/config/`)

Environment-specific configurations:
- `solana.ts` - Network and RPC configuration
- `programs.ts` - Program ID management
- `crossmint.ts` - Social login configuration
- `fees.ts` - Fee calculation constants

## Testing Structure (`/tests/`)

```
tests/
├── cryptoscore.ts           # Main program test suite
├── integration/             # End-to-end integration tests
│   ├── comprehensive-e2e.ts # Full workflow tests
│   ├── end-to-end.ts       # Basic E2E scenarios
│   └── stress-tests.ts     # Performance and load tests
└── utils/                   # Test utilities and helpers
    ├── test-setup.ts       # Test environment setup
    ├── test-accounts.ts    # Account generation utilities
    └── test-assertions.ts  # Custom assertion helpers
```

## File Naming Conventions

### React Components
- **PascalCase**: `MarketCard.tsx`, `UserProfile.tsx`
- **Feature prefixes**: `MarketFilters.tsx`, `TerminalHeader.tsx`

### Hooks and Utilities
- **camelCase**: `useMarketData.ts`, `formatCurrency.ts`
- **Descriptive names**: `winnings-calculator.ts`, `solana-helpers.ts`

### Rust Programs
- **snake_case**: Following Rust conventions
- **lib.rs**: Main program entry point
- **Descriptive modules**: Clear separation of concerns

## Import Organization

### Absolute Imports (Preferred)
```typescript
import { MarketCard } from '@/components/market/MarketCard'
import { useMarketData } from '@/hooks/useMarketData'
import { formatCurrency } from '@/utils/formatters'
```

### Import Grouping Order
1. External libraries (React, Solana, etc.)
2. Internal components and hooks (@ alias)
3. Relative imports (./filename)
4. Type-only imports (separate from value imports)

## Environment Files

Multiple environment configurations:
- `.env` - Default/development
- `.env.devnet` - Devnet configuration
- `.env.testnet` - Testnet configuration  
- `.env.mainnet-beta` - Production configuration
- `.env.example` - Template with required variables

## Build Artifacts

Generated files (should not be edited manually):
- `target/` - Rust compilation artifacts
- `app/dist/` - Frontend build output
- `app/src/idl/` - Generated Anchor IDL files
- `deployments/` - Deployment addresses and metadata