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
