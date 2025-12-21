# Project Structure & Organization

## Root Level

- **src/** - Main application source code
- **supabase/** - Database migrations and schema
- **public/** - Static assets (icons, manifest, service worker)
- **scripts/** - Utility scripts for diagnostics and verification
- **docs/** - Documentation files
- **.kiro/** - Kiro IDE configuration and steering files

## Source Code Organization (`src/`)

### Core Application
- **App.tsx** - Main app component with routing and providers
- **main.tsx** - Application entry point
- **style.css** - Global styles and CSS variables

### Components (`src/components/`)
- **ui/** - Reusable UI components (shadcn/ui based)
- **auth/** - Authentication-related components
- **cards/** - Card-based display components
- **charts/** - Data visualization components
- **examples/** - Example/demo components
- **landing/** - Landing page specific components
- **layout/** - Layout components (Header, Footer)
- **market/** - Market-specific components
- **terminal/** - Trading terminal components
- **index.ts** - Component exports

### Business Logic
- **hooks/** - Custom React hooks for data fetching and state
- **lib/** - Core business logic and utilities
  - **supabase/** - Database service layer
  - **crossmint/** - Wallet integration utilities
  - **football-data/** - Sports data integration
- **utils/** - Pure utility functions
- **contexts/** - React context providers

### Configuration & Types
- **config/** - Application configuration files
- **types/** - TypeScript type definitions
- **pages/** - Route components
- **styles/** - Additional CSS files

## Key Architectural Patterns

### Data Layer
- **Service Layer**: `src/lib/supabase/` contains all database operations
- **Custom Hooks**: Data fetching hooks in `src/hooks/` use TanStack Query
- **Real-time**: Supabase subscriptions for live updates

### Component Architecture
- **Compound Components**: Complex UI built from smaller, focused components
- **Lazy Loading**: Pages are lazy-loaded for performance
- **Provider Pattern**: Context providers for theme, currency, auth state

### Testing Structure
- **Co-located Tests**: `__tests__/` folders next to source code
- **Integration Tests**: `src/__tests__/integration/` for end-to-end scenarios
- **Mock Services**: `src/lib/supabase/__tests__/mock-database-service.ts`

## File Naming Conventions

- **Components**: PascalCase (e.g., `MarketCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMarketData.ts`)
- **Utilities**: camelCase (e.g., `winnings-calculator.ts`)
- **Types**: camelCase (e.g., `supabase.ts`)
- **Tests**: Match source file with `.test.ts` suffix

## Import Patterns

- **Path Aliases**: Use `@/` for src imports
- **Barrel Exports**: Components exported through `index.ts` files
- **Type-only Imports**: Use `import type` for TypeScript types
- **Lazy Imports**: Dynamic imports for code splitting