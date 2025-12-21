# Tech Stack & Development

## Core Technologies

- **React 19** + **TypeScript** - Modern UI with strict type safety
- **Vite** - Lightning-fast build tool and dev server
- **Supabase** - PostgreSQL database with real-time subscriptions
- **TanStack Query** - Data fetching, caching, and synchronization
- **Tailwind CSS 4** - Utility-first styling with CSS variables
- **Radix UI** - Accessible component primitives

## Key Libraries

- **@crossmint/client-sdk-react-ui** - EVM wallet authentication
- **react-router-dom** - Client-side routing
- **recharts** - Data visualization and charts
- **lucide-react** - Icon library
- **sonner** - Toast notifications
- **next-themes** - Theme switching system

## Development Tools

- **ESLint** with @antfu/eslint-config - Code linting and formatting
- **Vitest** - Unit and integration testing
- **TypeScript** strict mode - Type checking
- **Fast-check** - Property-based testing

## Common Commands

```bash
# Development
npm run dev          # Start dev server (localhost:5173)
npm run build        # Production build
npm run build:check  # TypeScript check + build
npm run preview      # Preview production build

# Code Quality
npm run lint         # ESLint with auto-fix
npm run test         # Run all tests
npm run test:watch   # Watch mode testing
npm run test:ui      # Vitest UI interface

# Utilities
npm run verify:crossmint  # Verify Crossmint configuration
npm run diagnose:twitter  # Debug Twitter login issues
```

## Build Configuration

- **Bundle splitting**: Separate vendor chunks for React, TanStack Query, Recharts, Supabase
- **Chunk size limit**: 600KB warning threshold
- **Path aliases**: `@/*` maps to `./src/*`
- **Manual chunks** for optimal caching strategy

## Testing Setup

- **Vitest** with Node.js environment
- **Global test utilities** available
- **Setup file**: `src/lib/supabase/__tests__/vitest-setup.ts`
- **Property-based testing** with fast-check for complex logic

## Code Style Guidelines

- **Strict TypeScript** with no unused variables/parameters
- **ESNext modules** with bundler resolution
- **React JSX transform** (no React imports needed)
- **Automatic formatting** on save