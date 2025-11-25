# Technology Stack

## Smart Contracts (hardhat/)

- **Language**: Solidity 0.8.28
- **Framework**: Hardhat 2.27 with @parity/hardhat-polkadot 0.1.9
- **Compiler**: resolc 0.3.0 (Polkadot EVM compiler) with optimizer enabled
- **Network**: Polkadot Asset Hub Testnet (Paseo) - PolkaVM enabled

### Common Commands

```bash
# From root or with -w hardhat flag
npm run compile          # Compile contracts
npm run deploy          # Deploy via Hardhat Ignition
npm run interact        # Run interaction scripts
npm run accounts        # Show account info
npm run lint            # ESLint with @antfu/eslint-config
```

## Frontend (dapp-react/)

- **Framework**: React 19.1 with TypeScript 5.9
- **Build Tool**: Vite 7.1
- **Web3 Stack**: 
  - Wagmi 2.17 (React hooks for Ethereum)
  - Viem 2.37 (TypeScript Ethereum interface)
  - TanStack Query 5.90 (data fetching/caching)
- **Styling**: Tailwind CSS 4.1 with custom design system
- **Theming**: Custom theme system with 6 presets (CSS variables + React Context)
- **Routing**: React Router DOM 7.9
- **UI Components**: Radix UI primitives (Dialog, Dropdown, Select, Tabs, Tooltip, etc.)
- **Icons**: Iconify with MDI and Token Branded sets, Lucide React
- **Charts**: Recharts 3.4 (data visualizations)
- **Notifications**: React Hot Toast 2.6 + Sonner 2.0
- **Virtual Scrolling**: @tanstack/react-virtual 3.13

### Design System
- **Themes**: 6 professionally designed themes (Dark Terminal, Ocean Blue, Forest Green, Sunset Orange, Purple Haze, Light Mode)
- **Theme Switching**: Instant switching via UI or keyboard shortcut (Ctrl+Shift+T)
- **Tokens**: 40+ design tokens (colors, spacing, shadows, typography) - all theme-aware
- **Components**: 30+ reusable component classes
- **Animations**: Comprehensive animation library (fade, slide, scale, pulse, shimmer)
- **Typography**: System fonts with monospace code display
- **Glassmorphism**: Backdrop blur effects with theme-appropriate overlays

### Performance Features
- **Code Splitting**: Lazy loading for routes (MarketDetail, MyMarkets, Leaderboard)
- **Virtual Scrolling**: Auto-activates for >20 markets, renders only visible items
- **PWA**: Service worker with network-first API and cache-first asset strategies
- **Real-Time Updates**: 10-second polling with React Query cache invalidation
- **Optimistic UI**: Instant feedback with background validation

### Accessibility
- **WCAG AA**: Compliant color contrast
- **Keyboard Navigation**: Full support
- **Screen Readers**: ARIA labels and semantic HTML
- **Reduced Motion**: Respects user preferences
- **Skip Links**: Skip to main content

### Common Commands

```bash
# From root or with -w dapp-react flag
npm run dev             # Start dev server (localhost:5173)
npm run build           # TypeScript compile + Vite build
npm run preview         # Preview production build
npm run lint            # ESLint with @antfu/eslint-config
```

## Code Style

- **Linting**: @antfu/eslint-config 5.x (both workspaces)
- **TypeScript**: Strict mode enabled, no unused locals/parameters
- **React**: JSX transform, React 19 features enabled
- **Formatting**: Enforced via ESLint auto-fix on save

## Environment Variables

### hardhat/.env
```
PRIVATE_KEY=your_private_key
```

### dapp-react/.env
```
VITE_FOOTBALL_DATA_API_KEY_1=api_key
VITE_FOOTBALL_DATA_API_KEY_2=api_key
VITE_FOOTBALL_DATA_API_KEY_3=api_key
VITE_FOOTBALL_DATA_API_KEY_4=api_key
VITE_FOOTBALL_DATA_API_KEY_5=api_key
```

## Monorepo Structure

- **Package Manager**: npm with workspaces
- **Workspaces**: hardhat, dapp-react
- **Root Scripts**: Proxy commands to workspaces with `-w` flag
