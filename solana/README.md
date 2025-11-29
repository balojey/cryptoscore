# CryptoScore Solana

CryptoScore prediction markets on Solana blockchain using Anchor framework. This workspace contains both Solana programs (smart contracts) and a complete frontend application adapted from the original dapp-react codebase.

## 🏗️ Architecture

```
solana/
├── programs/           # Solana programs (Anchor/Rust)
│   ├── factory/        # Factory program - creates markets
│   ├── market/         # Market program - handles predictions
│   └── dashboard/      # Dashboard program - data aggregation
├── app/               # Frontend application (React/TypeScript)
├── tests/             # Integration tests
├── scripts/           # Deployment and utility scripts
└── migrations/        # Deployment migrations
```

## 🚀 Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.18+)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (v0.30+)
- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/) package manager

### Installation

1. **Clone and install dependencies:**
```bash
cd solana/
yarn install
```

2. **Configure Solana CLI:**
```bash
# Set to devnet for development
solana config set --url devnet

# Create a keypair if you don't have one
solana-keygen new

# Get some SOL for testing
solana airdrop 2
```

3. **Build programs:**
```bash
yarn build
# or with verification
yarn build:verify
```

4. **Run tests:**
```bash
yarn test
```

## 🌐 Network Configuration

### Available Networks

- **localnet** - Local development (solana-test-validator)
- **devnet** - Solana devnet for testing
- **testnet** - Solana testnet for staging
- **mainnet-beta** - Solana mainnet for production

### Configure for Network

```bash
# Configure for devnet (default)
yarn configure:devnet

# Configure for other networks
yarn configure:localnet
yarn configure:testnet
yarn configure:mainnet

# List all available networks
yarn configure:list

# Check current network
yarn configure:current
```

## 🚀 Deployment

### Local Development

1. **Start local validator:**
```bash
yarn localnet
# In another terminal, keep this running
```

2. **Deploy to localnet:**
```bash
yarn deploy:localnet
```

### Devnet Deployment

```bash
# Ensure you have devnet SOL
solana airdrop 2 --url devnet

# Deploy to devnet
yarn deploy:devnet
```

### Production Deployment

```bash
# Configure for mainnet
yarn configure:mainnet

# Deploy to mainnet (requires mainnet SOL)
yarn deploy:mainnet
```

## 📋 Available Scripts

### Build & Verification
- `yarn build` - Build all programs
- `yarn build:verify` - Build with verification
- `yarn verify` - Verify build artifacts

### Testing
- `yarn test` - Run all tests
- `yarn test:unit` - Run unit tests only
- `yarn test:integration` - Run integration tests only

### Deployment
- `yarn deploy:localnet` - Deploy to local validator
- `yarn deploy:devnet` - Deploy to devnet
- `yarn deploy:testnet` - Deploy to testnet  
- `yarn deploy:mainnet` - Deploy to mainnet

### Network Configuration
- `yarn configure:localnet` - Configure for localnet
- `yarn
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor Examples](https://github.com/coral-xyz/anchor/tree/master/examples)