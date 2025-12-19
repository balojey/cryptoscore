# CryptoScore

Decentralized sports prediction markets on Solana blockchain. Built with Anchor framework and React.

🎥 **[Watch Demo](https://youtu.be/kkQOds2JSD4)** - See CryptoScore in action

## Architecture

- **Programs** (`/programs/`) - Three Solana programs for modular market operations
- **Frontend** (`/app/`) - React TypeScript application with Web3 integration
- **Tests** (`/tests/`) - Comprehensive test suite for all programs

## Quick Start

### Prerequisites

- [Rust](https://rustup.rs/) + [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.18+)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (v0.30+)
- [Node.js](https://nodejs.org/) (v18+) + [Yarn](https://yarnpkg.com/)

### Setup

```bash
# Install dependencies
yarn install

# Configure Solana for devnet
solana config set --url devnet
solana-keygen new
solana airdrop 2

# Build and test programs
yarn build
yarn test
```

### Development

```bash
# Start local validator
yarn localnet

# Deploy to localnet
yarn deploy:localnet

# Start frontend (in another terminal)
cd app/
yarn dev
```

## Networks

Configure and deploy to different Solana networks:

```bash
# Configure network
yarn configure:devnet    # Development
yarn configure:testnet   # Staging  
yarn configure:mainnet   # Production

# Deploy to network
yarn deploy:devnet
yarn deploy:testnet
yarn deploy:mainnet
```

## Scripts

**Build & Test**
- `yarn build` - Build all programs
- `yarn test` - Run all tests
- `yarn build:verify` - Build with verification

**Deployment**
- `yarn deploy:localnet` - Deploy to local validator
- `yarn deploy:devnet` - Deploy to devnet
- `yarn deploy:mainnet` - Deploy to mainnet

**Utilities**
- `yarn localnet` - Start local Solana validator
- `yarn idl:sync` - Export IDLs to frontend