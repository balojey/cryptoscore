# CryptoScore dApp - Solana Frontend

A professional Web3 trading terminal for decentralized sports prediction markets on Solana.

## 🎨 Features

### Theming & Personalization
- **6 Theme Presets** - Dark Terminal, Ocean Blue, Forest Green, Sunset Orange, Purple Haze, Light Mode
- **Instant Theme Switching** - Via UI dropdown or keyboard shortcut (Ctrl+Shift+T)
- **Persistent Preferences** - Theme saved to localStorage
- **Adaptive Design** - Theme-specific shadows and colors
- **WCAG AA Compliant** - All themes maintain accessibility standards

### Core Features
- **Enhanced Market Cards** - Prediction distribution visualization
- **Portfolio Dashboard** - Track performance, P&L, and win rates
- **Advanced Filtering** - Status, time range, pool size, entry fee filters
- **Real-Time Updates** - 10-second polling with toast notifications
- **Data Visualizations** - Charts for predictions, performance, and trends
- **Leaderboard System** - Top traders across 4 categories
- **Social Features** - Comments and sharing to Twitter/Farcaster
- **PWA Support** - Installable app with offline capability
- **Full Accessibility** - WCAG AA compliant, keyboard navigation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Solana wallet (Phantom, Solflare, Backpack, etc.)
- Deployed Solana programs (Factory, Market, Dashboard)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── cards/              # Market and portfolio cards
│   ├── charts/             # Data visualization components
│   ├── layout/             # Header, footer, navigation
│   ├── market/             # Market-related components
│   └── ui/                 # Reusable UI components
├── pages/                  # Route components
├── hooks/                  # Custom React hooks
├── config/                 # Configuration files
├── styles/                 # Design system and animations
├── utils/                  # Helper functions
└── types.ts                # TypeScript definitions
```

## 🎯 Key Technologies

- **React 19.1** - UI framework with latest features
- **TypeScript 5.9** - Type safety with strict mode
- **Vite 7.1** - Lightning-fast build tool
- **Anchor 0.30** - Solana program framework
- **@solana/web3.js** - Solana JavaScript SDK
- **@solana/wallet-adapter-react** - Wallet integration
- **TanStack Query 5.90** - Data fetching and caching
- **Tailwind CSS 4.1** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Recharts 3.4** - Data visualization
- **React Router 7.9** - Client-side routing
- **@tanstack/react-virtual 3.13** - Virtual scrolling

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Solana Program IDs (from deployment)
VITE_FACTORY_PROGRAM_ID=your_factory_program_id
VITE_MARKET_PROGRAM_ID=your_market_program_id
VITE_DASHBOARD_PROGRAM_ID=your_dashboard_program_id

# Solana Network Configuration
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com

# Football Data API Keys (optional, for match data)
VITE_FOOTBALL_DATA_API_KEY_1=your_api_key_1
VITE_FOOTBALL_DATA_API_KEY_2=your_api_key_2
VITE_FOOTBALL_DATA_API_KEY_3=your_api_key_3
VITE_FOOTBALL_DATA_API_KEY_4=your_api_key_4
VITE_FOOTBALL_DATA_API_KEY_5=your_api_key_5
```

### Network Configuration

The app connects to Solana networks:
- **Devnet** - Development and testing
- **Testnet** - Pre-production testing
- **Mainnet-beta** - Production deployment

Supported networks:
- Devnet: https://api.devnet.solana.com
- Testnet: https://api.testnet.solana.com
- Mainnet: https://api.mainnet-beta.solana.com

## 📚 Documentation

### Quick Start
- [Quick Start Guide](./QUICK_START.md) - Get started quickly
- [Deployment Checklist](../DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification

### Integration Documentation
- [IDL Integration Guide](../SOLANA_IDL_INTEGRATION.md) - Complete integration details
- [Integration Summary](../INTEGRATION_SUMMARY.md) - Overview of completed work

### Developer Documentation
- [Program Configuration](./src/config/programs.ts) - Program IDs and network config
- [Hooks Documentation](./src/hooks/) - Custom React hooks for Solana
- [Type Definitions](./src/types.ts) - TypeScript interfaces

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build
npm run lint         # ESLint with auto-fix
```

### Code Style

- ESLint with @antfu/eslint-config
- TypeScript strict mode
- Automatic formatting on save

## 🌐 Deployment

### Build Output

```bash
npm run build
```

Outputs to `dist/` directory:
- Optimized bundle with code splitting
- Service worker for PWA
- Static assets

### Hosting

Deploy to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- IPFS

## 🔐 Security

- No private keys stored in frontend
- All transactions require wallet signature
- Program addresses verified on-chain
- PDA derivation prevents address spoofing
- Input validation before transactions
- API keys rotated automatically

## 📱 PWA Features

- Installable on mobile and desktop
- Offline capability with service worker
- App manifest for native-like experience
- Push notifications (future)

## ♿ Accessibility

- WCAG AA compliant
- Keyboard navigation support
- Screen reader compatible
- Reduced motion support
- Skip to main content link

## 🎨 Design System

### Theme System

6 professionally designed themes with instant switching:

| Theme | Icon | Description | Best For |
|-------|------|-------------|----------|
| **Dark Terminal** | 🖥️ | Professional trader theme with neon accents | Default, extended trading sessions |
| **Ocean Blue** | 🌊 | Deep blue oceanic palette | Cool color preference |
| **Forest Green** | 🌲 | Nature-inspired green theme | Reduced eye strain |
| **Sunset Orange** | 🌅 | Warm sunset colors | Evening use, warm preference |
| **Purple Haze** | ✨ | Vibrant purple and pink | Creative users, unique aesthetic |
| **Light Mode** | ☀️ | Clean light theme with subtle shadows | Bright environments, daytime |

**Features:**
- Instant switching via UI dropdown or keyboard shortcut (Ctrl+Shift+T)
- localStorage persistence across sessions
- Theme-specific shadows and colors via CSS variables
- WCAG AA compliant (4.5:1 contrast ratio minimum)
- All components use CSS variables for dynamic theming
- Glassmorphism effects with backdrop blur

**Implementation:**
- Context: `src/contexts/ThemeContext.tsx` - Theme management
- Component: `src/components/ThemeSwitcher.tsx` - UI for theme selection
- Tokens: `src/styles/tokens.css` - Base design tokens
- Components: `src/styles/components.css` - Component styles

See [Theme System Guide](./.kiro/steering/theme-system.md) for complete details.

### Design Tokens

- **40+ Design Tokens** - Colors, spacing, shadows, typography (all theme-aware)
- **30+ Component Classes** - Buttons, cards, badges, stats, utilities
- **Animation Library** - Fade, slide, scale, pulse, shimmer, bounce, shake
- **Glassmorphism** - Backdrop blur effects with theme overlays
- **Typography** - System fonts with monospace for addresses/code

## 📊 Performance

- Code splitting per route (MarketDetail, MyMarkets, Leaderboard)
- Lazy loading for pages with Suspense boundaries
- Virtual scrolling auto-activates for >20 markets
- Real-time updates with 10-second polling
- Optimistic UI updates for instant feedback
- Service worker caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Solana Programs](../programs/) - Anchor smart contracts
- [Documentation](../docs/) - Full implementation guides
- [Solana](https://solana.com/) - Network information
- [Anchor](https://www.anchor-lang.com/) - Framework documentation

## 💬 Support

For issues and questions:
- Open an issue on GitHub
- Join our Discord community
- Check the documentation

## 🚀 Solana Integration

### Programs

The frontend integrates with three Solana programs:

1. **CryptoScore Factory** - Market creation and registry
   - Creates new prediction markets
   - Tracks all markets system-wide
   - Manages market registry

2. **CryptoScore Market** - Market participation and resolution
   - Join markets with predictions
   - Resolve markets with outcomes
   - Withdraw rewards

3. **CryptoScore Dashboard** - Data aggregation and queries
   - Fetch all markets with pagination
   - Fetch user's markets
   - Fetch market details
   - Fetch user statistics

### Hooks

Custom React hooks for Solana integration:

- `useSolanaProgram()` - Initialize Anchor programs
- `useMarketData()` - Fetch market details
- `useAllMarkets()` - Fetch all markets with pagination
- `useUserMarkets()` - Fetch user's markets
- `useUserStats()` - Fetch user statistics
- `useUserPrediction()` - Check user's prediction
- `useMarketActions()` - Transaction methods (create, join, resolve, withdraw)

### PDA Derivations

All Program Derived Addresses (PDAs) are correctly derived:

```typescript
// Factory PDA
[Buffer.from('factory')]

// Market Registry PDA
[Buffer.from('market_registry'), factoryPda, matchId]

// Market PDA
[Buffer.from('market'), factoryPda, matchId]

// Participant PDA
[Buffer.from('participant'), marketPda, userPubkey]

// User Stats PDA
[Buffer.from('user_stats'), userPubkey]
```

### Transaction Flow

1. **Create Market**: Two-step process
   - Market program initializes Market account
   - Factory program creates MarketRegistry entry
2. **Join Market**: Market program creates Participant account
3. **Resolve Market**: Market program updates outcome
4. **Withdraw Rewards**: Market program transfers SOL to winner

---

Built with ❤️ for the Solana ecosystem
