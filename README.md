# CryptoScore Frontend

Professional Web2 prediction market application with Supabase backend and EVM wallet integration.

🎥 **[Watch Demo](https://youtu.be/kkQOds2JSD4)** - See the app in action

## Features

- **6 Theme Presets** - Dark Terminal, Ocean Blue, Forest Green, Sunset Orange, Purple Haze, Light Mode
- **Market Trading** - Create, join, and resolve prediction markets
- **Portfolio Dashboard** - Track performance, P&L, and win rates  
- **Real-Time Updates** - Live market data with Supabase real-time subscriptions
- **Social Login** - Crossmint integration (Google, Twitter, Farcaster, Email) with EVM wallets
- **PWA Support** - Installable app with offline capability
- **Full Accessibility** - WCAG AA compliant with keyboard navigation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase project with database schema
- Crossmint account for EVM wallet authentication

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and Crossmint credentials

# Start development server  
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **React 19** + **TypeScript** - Modern UI with type safety
- **Vite** - Lightning-fast build tool
- **Supabase** - PostgreSQL database with real-time subscriptions
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Crossmint Configuration (EVM wallets)
VITE_CROSSMINT_CLIENT_API_KEY=your_crossmint_client_api_key
VITE_CROSSMINT_ENVIRONMENT=staging

# Database Configuration
VITE_DB_POOL_SIZE=10
VITE_DB_TIMEOUT=30000

# Real-time Configuration
VITE_REALTIME_EVENTS_PER_SECOND=10
VITE_REALTIME_HEARTBEAT_INTERVAL=30000

# Platform Configuration
VITE_PLATFORM_FEE_PERCENTAGE=5.0
VITE_MIN_MARKET_DURATION_HOURS=1
VITE_MAX_MARKET_DURATION_DAYS=30

# Optional: Sports data APIs
VITE_FOOTBALL_DATA_API_KEY_1=your_api_key
VITE_COINGECKO_API_KEY=your_api_key
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in `supabase/migrations/`
3. Get your project URL and anon key from Settings > API
4. Configure Row Level Security (RLS) policies

### Crossmint Setup

For EVM wallet authentication (Google, Twitter, Farcaster, Email):

1. Sign up at [Crossmint Console](https://www.crossmint.com/console)
2. Create a project and get your Client API Key
3. Configure for **EVM wallet creation** (not Solana)
4. Add to `.env` as `VITE_CROSSMINT_CLIENT_API_KEY`

Supported login methods:
- Google, Twitter/X, Farcaster, Email OTP
- Creates EVM wallets (0x addresses) for future MNEE token integration

## Development

### Scripts

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # ESLint with auto-fix
npm run test         # Run tests with Vitest
```

### Code Style

- ESLint with @antfu/eslint-config
- TypeScript strict mode
- Automatic formatting on save

## Deployment

Deploy to any static hosting service (Vercel, Netlify, GitHub Pages):

```bash
npm run build  # Outputs to dist/
```

## Security & Accessibility

- No private keys stored in frontend
- EVM wallet addresses stored in Supabase user profiles
- WCAG AA compliant with keyboard navigation
- PWA support with offline capability

## Theme System

6 professionally designed themes with instant switching (Ctrl+Shift+T):

- **Dark Terminal** 🖥️ - Professional trader theme with neon accents
- **Ocean Blue** 🌊 - Deep blue oceanic palette  
- **Forest Green** 🌲 - Nature-inspired green theme
- **Sunset Orange** 🌅 - Warm sunset colors
- **Purple Haze** ✨ - Vibrant purple and pink
- **Light Mode** ☀️ - Clean light theme

Features:
- localStorage persistence
- WCAG AA compliant (4.5:1 contrast ratio)
- CSS variables for dynamic theming
- Glassmorphism effects with backdrop blur

## Supabase Integration

### Database Schema

The application uses these main tables:

1. **users** - User profiles with EVM wallet addresses
2. **markets** - Prediction markets with metadata
3. **participants** - User participation in markets
4. **transactions** - Transaction history and winnings
5. **platform_config** - Platform configuration settings

### Custom Hooks

- `useSupabaseMarketData()` - Fetch market details from database
- `useSupabaseMarketActions()` - Database operations (create, join, resolve)
- `useRealtimeMarkets()` - Real-time market updates via Supabase subscriptions
- `useSupabaseDashboardData()` - Portfolio and analytics data

### Transaction Flow

1. **Create Market** - Insert into markets table, update platform stats
2. **Join Market** - Insert into participants table with prediction
3. **Resolve Market** - Update market outcome, calculate winnings
4. **Withdraw Rewards** - Update user balances in transactions table

## Migration from Solana

This frontend has been migrated from Solana web3 to Supabase web2:

### Key Changes

- **Authentication**: Crossmint now creates EVM wallets instead of Solana wallets
- **Data Storage**: All market data stored in Supabase instead of blockchain accounts
- **Real-time Updates**: Supabase subscriptions replace Solana WebSocket connections
- **Transactions**: Database operations replace blockchain transactions
- **Bundle Size**: Significantly reduced by removing Solana dependencies

### Removed Dependencies

- All `@solana/*` packages
- Anchor framework and IDL files
- Solana wallet adapters
- Blockchain connection utilities

### New Dependencies

- `@supabase/supabase-js` - Database client
- Enhanced Crossmint integration for EVM wallets
- Improved TanStack Query configuration for database caching
