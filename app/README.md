# CryptoScore Frontend

Professional Web3 trading terminal for decentralized sports prediction markets on Solana.

🎥 **[Watch Demo](https://youtu.be/kkQOds2JSD4)** - See the app in action

## Features

- **6 Theme Presets** - Dark Terminal, Ocean Blue, Forest Green, Sunset Orange, Purple Haze, Light Mode
- **Market Trading** - Create, join, and resolve prediction markets
- **Portfolio Dashboard** - Track performance, P&L, and win rates  
- **Real-Time Updates** - Live market data with WebSocket integration
- **Social Login** - Crossmint integration (Google, Twitter, Farcaster, Email)
- **PWA Support** - Installable app with offline capability
- **Full Accessibility** - WCAG AA compliant with keyboard navigation

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Solana wallet or social login (Google, Twitter, etc.)
- Deployed Solana programs

### Installation

```bash
# Install dependencies
npm install

# Start development server  
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **React 19** + **TypeScript** - Modern UI with type safety
- **Vite** - Lightning-fast build tool
- **Anchor 0.30** - Solana program framework
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives

## Configuration

### Environment Variables

Create a `.env` file:

```env
# Solana Program IDs (from deployment)
VITE_FACTORY_PROGRAM_ID=your_factory_program_id
VITE_MARKET_PROGRAM_ID=your_market_program_id
VITE_DASHBOARD_PROGRAM_ID=your_dashboard_program_id

# Solana Network
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# Crossmint (for social login)
VITE_CROSSMINT_CLIENT_API_KEY=your_crossmint_client_api_key
```

### Crossmint Setup

For social login (Google, Twitter, Farcaster, Email):

1. Sign up at [Crossmint Console](https://www.crossmint.com/console)
2. Create a project and get your Client API Key
3. Add to `.env` as `VITE_CROSSMINT_CLIENT_API_KEY`

Supported login methods:
- Google, Twitter/X, Farcaster, Email OTP
- Traditional Solana wallets (Phantom, Solflare, etc.)

## Development

### Scripts

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # ESLint with auto-fix
```

### Code Style

- ESLint with @antfu/eslint-config
- TypeScript strict mode
- Automatic formatting on save

## Deployment

Deploy to any static hosting service (Vercel, Netlify, GitHub Pages, IPFS):

```bash
npm run build  # Outputs to dist/
```

## Security & Accessibility

- No private keys stored in frontend
- All transactions require wallet signature
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

## Solana Integration

### Programs

Three Solana programs handle different aspects:

1. **Factory** - Market creation and registry
2. **Market** - Predictions, resolution, and rewards  
3. **Dashboard** - Data aggregation and queries

### Custom Hooks

- `useSolanaProgram()` - Initialize Anchor programs
- `useMarketData()` - Fetch market details
- `useAllMarkets()` - Fetch all markets with pagination
- `useUserMarkets()` - Fetch user's markets
- `useMarketActions()` - Transaction methods (create, join, resolve, withdraw)

### Transaction Flow

1. **Create Market** - Market program initializes account, Factory creates registry
2. **Join Market** - Market program creates Participant account
3. **Resolve Market** - Market program updates outcome
4. **Withdraw Rewards** - Market program transfers SOL to winners
