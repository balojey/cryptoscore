# CryptoScore Development Guide

A comprehensive guide for developing and deploying the CryptoScore prediction markets platform.

## Features

- **Smart Contract Development**: Hardhat with TypeScript and Polkadot integration
- **React Frontend**: Modern Web3 application with Wagmi integration
- **Modern Web3 Stack**: Wagmi, Viem, and TanStack Query for optimal DX
- **Theme System**: 6 professionally designed themes with instant switching
- **UI Components**: Tailwind CSS with custom design system
- **Type Safety**: Full TypeScript support across all components
- **Development Tools**: ESLint configuration with @antfu/eslint-config

## Project Structure

```
├── hardhat/              # Smart contract development environment
│   ├── contracts/        # Solidity smart contracts
│   ├── scripts/          # Deployment and interaction scripts
│   └── ignition/         # Hardhat Ignition deployment modules
├── dapp-react/           # React frontend application
│   └── src/
│       ├── components/   # React components
│       └── config/       # Contract configurations
└── dapp-vue/             # Vue.js frontend application
    └── src/
        ├── components/   # Vue components
        └── config/       # Contract configurations
```

## Smart Contracts

CryptoScore includes three main contracts:

### **CryptoScoreFactory.sol**
- Deploys new market contracts
- Tracks all markets system-wide
- Emits indexed events for dashboard indexing

### **CryptoScoreMarket.sol**
- Self-contained prediction market contract
- Stores creator, participants, entry fee, metadata, match ID
- Tracks state (open, closed, resolved)
- Distributes rewards on resolution

### **CryptoScoreDashboard.sol**
- Aggregates market information across contracts
- Exposes public + private markets
- Provides user-centric data queries

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or bun package manager

### Installation

This project uses monorepo structure with workspaces. Install all dependencies from the root directory:

```bash
# Install all workspace dependencies
npm install
```

### 1. Smart Contract Development

```bash
# Deploy to Polkadot Asset Hub testnet
npm run deploy -w hardhat

# Interact with deployed contract
npm run interact -w hardhat

# Verify contract
npm run verify -w hardhat
```

Or navigate to the hardhat directory:

```bash
cd hardhat
npm run deploy
npm run interact
npm run verify
```

### 2. Frontend Development

Run the frontend application (React or Vue based on your selection):

```bash
# From root directory
npm run dev -w dapp-react
# or
npm run dev -w dapp-vue
```

Or navigate to the frontend directory:

```bash
cd dapp-react  # or dapp-vue
npm run dev
```

## Environment Setup

Create a `.env` file in the `hardhat` directory:

```env
PRIVATE_KEY=your_private_key_here
```

## Network Configuration

The template is pre-configured for:
- **Local Development**: Hardhat network with PolkaVM
- **Testnet**: Polkadot Asset Hub testnet

## Frontend Features

The React application includes:

### **Theming System**
- 6 professional themes with instant switching
- Keyboard shortcut (Ctrl+Shift+T) for quick cycling
- localStorage persistence
- WCAG AA compliant

### **Market Features**
- Create and join prediction markets
- Enhanced market cards with distribution visualization
- Portfolio dashboard with performance tracking
- Advanced filtering and sorting
- Real-time updates with 10-second polling

### **Data Visualizations**
- Prediction distribution charts
- Pool trend charts
- Performance charts

### **Social Features**
- Leaderboard system
- Market comments
- Social sharing (Twitter, Farcaster)

### **Performance**
- Virtual scrolling for large lists
- Code splitting for routes
- PWA support with offline capability

## Available Scripts

You can run scripts from the root directory using the `-w` flag or navigate to the specific workspace.

### Hardhat
- `npm run deploy -w hardhat` - Deploy contracts to testnet
- `npm run interact -w hardhat` - Run interaction scripts
- `npm run verify -w hardhat` - Verify deployed contracts
- `npm run accounts -w hardhat` - Show account information
- `npm run lint -w hardhat` - Run ESLint

### Frontend (React)
- `npm run dev -w dapp-react` - Start React dev server (localhost:5173)
- `npm run build -w dapp-react` - Build React for production
- `npm run preview -w dapp-react` - Preview React production build
- `npm run lint -w dapp-react` - Run ESLint with auto-fix

## Technology Stack

### Smart Contracts
- **Hardhat**: Development environment and testing framework
- **Solidity**: Smart contract programming language
- **Polkadot**: Target blockchain platform
- **TypeScript**: Type-safe development

### Frontend
- **React 19**: Modern UI framework
- **Wagmi**: React hooks for Ethereum
- **Viem**: TypeScript interface for Ethereum
- **TanStack Query**: Data fetching and caching
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Data visualization library
- **React Router**: Client-side routing
- **@tanstack/react-virtual**: Virtual scrolling

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License.
