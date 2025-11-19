# Technology Stack

## Smart Contracts (hardhat/)

- **Language**: Solidity ^0.8.28
- **Framework**: Hardhat with @parity/hardhat-polkadot plugin
- **Compiler**: resolc (Polkadot EVM compiler) with optimizer enabled
- **Network**: Polkadot Asset Hub Testnet (PolkaVM enabled)

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

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Web3 Stack**: 
  - Wagmi 2.x (React hooks for Ethereum)
  - Viem 2.x (TypeScript Ethereum interface)
  - TanStack Query 5.x (data fetching/caching)
- **Styling**: Tailwind CSS 4 + DaisyUI 5
- **Routing**: React Router DOM 7
- **Icons**: Iconify with MDI and Token Branded sets
- **Charts**: Recharts 2.x (data visualizations)
- **Notifications**: React Hot Toast 2.x
- **Virtual Scrolling**: @tanstack/react-virtual 3.x

### Design System v2.0
- **Theme**: Dark terminal theme
- **Tokens**: 40+ design tokens (colors, spacing, shadows)
- **Components**: 30+ reusable component classes
- **Animations**: Comprehensive animation library
- **Typography**: Inter (body), Plus Jakarta Sans (headings), JetBrains Mono (code)

### Performance Features
- **Code Splitting**: Lazy loading for routes
- **Virtual Scrolling**: Renders only visible items (>20 markets)
- **PWA**: Service worker with cache strategies
- **Bundle Size**: 524KB (158KB gzipped)
- **Build Time**: ~14s

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

- **Linting**: @antfu/eslint-config (both workspaces)
- **TypeScript**: Strict mode enabled
- **React**: JSX transform, no unused locals/parameters
- **Formatting**: Enforced via ESLint auto-fix

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
