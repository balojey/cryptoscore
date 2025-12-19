# Technology Stack & Build System

## Core Technologies

### Backend (Solana Programs)
- **Anchor Framework 0.30+**: Solana program development framework
- **Rust**: Systems programming language for on-chain programs
- **Solana CLI 1.18+**: Blockchain interaction and deployment

### Frontend (React App)
- **React 19** with **TypeScript**: Modern UI framework with strict typing
- **Vite**: Lightning-fast build tool and dev server
- **Tailwind CSS 4**: Utility-first styling with CSS variables for theming
- **TanStack Query**: Data fetching, caching, and synchronization
- **Radix UI**: Accessible component primitives
- **React Router 7**: Client-side routing

### Web3 Integration
- **@solana/web3.js**: Solana blockchain interaction
- **@solana/wallet-adapter**: Wallet connection and management
- **Crossmint SDK**: Social login integration (Google, Twitter, Farcaster, Email)
- **Anchor Client**: TypeScript client for Solana programs

### Development Tools
- **ESLint** with @antfu/eslint-config: Code linting and formatting
- **Vitest**: Unit testing framework
- **TypeScript 5.9+**: Static type checking
- **Prettier**: Code formatting

## Common Commands

### Root Level (Solana Programs)
```bash
# Build and test programs
yarn build                    # Build all Solana programs
yarn test                     # Run all program tests
yarn build:verify             # Build with verification

# Network configuration
yarn configure:devnet         # Configure for devnet
yarn configure:testnet        # Configure for testnet  
yarn configure:mainnet        # Configure for mainnet

# Deployment
yarn deploy:localnet          # Deploy to local validator
yarn deploy:devnet            # Deploy to devnet
yarn deploy:mainnet           # Deploy to mainnet

# Development utilities
yarn localnet                 # Start local Solana validator
yarn idl:sync                 # Export IDLs to frontend
yarn logs                     # View Solana logs
```

### Frontend (app/ directory)
```bash
# Development
npm run dev                   # Start dev server (localhost:5173)
npm run build                 # Build for production
npm run preview               # Preview production build

# Testing and quality
npm run test                  # Run unit tests (Vitest)
npm run test:watch            # Run tests in watch mode
npm run lint                  # ESLint with auto-fix

# Utilities
npm run verify:crossmint      # Verify Crossmint configuration
npm run diagnose:twitter      # Diagnose Twitter login issues
```

## Build Configuration

### TypeScript Configuration
- **Strict mode enabled**: All TypeScript strict checks active
- **Path aliases**: `@/*` maps to `./src/*` in frontend
- **ES2020 target**: Modern JavaScript features
- **Bundler module resolution**: Optimized for Vite

### Vite Configuration
- **Manual chunking**: Separate vendor chunks for React, Solana, TanStack Query, Recharts
- **Buffer polyfill**: Required for Solana Web3.js in browser
- **Chunk size limit**: 600KB warning threshold
- **Tailwind CSS integration**: Via @tailwindcss/vite plugin

### Testing Setup
- **Vitest**: Node environment with globals enabled
- **Anchor testing**: Mocha + Chai for Solana program tests
- **Test timeout**: 1,000,000ms for blockchain operations

## Environment Variables

### Required Frontend Variables
```env
# Solana Program IDs (from deployment)
VITE_FACTORY_PROGRAM_ID=your_factory_program_id
VITE_MARKET_PROGRAM_ID=your_market_program_id  
VITE_DASHBOARD_PROGRAM_ID=your_dashboard_program_id

# Network configuration
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# Social login (optional)
VITE_CROSSMINT_CLIENT_API_KEY=your_crossmint_api_key
```

## Code Quality Standards

- **ESLint**: @antfu/eslint-config with React-specific rules
- **TypeScript strict mode**: No implicit any, unused variables/parameters
- **Prettier**: Automatic code formatting
- **Import organization**: Absolute imports with @ alias preferred
- **Component structure**: Lazy loading for pages, proper error boundaries