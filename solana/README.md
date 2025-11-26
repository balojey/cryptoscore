# CryptoScore Solana

A decentralized prediction market platform built on Solana using the Anchor framework.

## Architecture

This workspace contains three Solana programs:

- **Factory Program** (`programs/factory/`) - Creates and manages market instances
- **Market Program** (`programs/market/`) - Individual prediction market logic
- **Dashboard Program** (`programs/dashboard/`) - Data aggregation and querying

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) (v1.18+)
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) (v0.30+)
- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/) (v1.22+)

## Setup

1. **Install dependencies:**
   ```bash
   yarn install
   ```

2. **Configure Solana CLI:**
   ```bash
   solana config set --url devnet
   solana-keygen new  # Create a new keypair if needed
   ```

3. **Copy environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Build programs:**
   ```bash
   anchor build
   ```

## Development

### Common Commands

```bash
# Build all programs
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Start local validator
yarn localnet

# View program logs
yarn logs
```

### Program Structure

```
programs/
├── factory/          # Factory Program
│   ├── src/lib.rs   # Main program logic
│   └── Cargo.toml   # Dependencies
├── market/           # Market Program
│   ├── src/lib.rs   # Market logic
│   └── Cargo.toml   # Dependencies
└── dashboard/        # Dashboard Program
    ├── src/lib.rs   # Query logic
    └── Cargo.toml   # Dependencies
```

### Testing

Run the test suite:
```bash
anchor test
```

Tests are located in `tests/cryptoscore.ts` and cover all three programs.

## Configuration

### Anchor.toml

The workspace is configured for devnet development by default. Program IDs are defined for both localnet and devnet environments.

### Environment Variables

Key environment variables in `.env`:

- `ANCHOR_PROVIDER_URL` - Solana RPC endpoint
- `ANCHOR_WALLET` - Path to wallet keypair
- `SOLANA_NETWORK` - Target network (devnet/mainnet-beta)
- `*_PROGRAM_ID` - Program IDs for each program

## Deployment

1. **Build programs:**
   ```bash
   anchor build
   ```

2. **Deploy to devnet:**
   ```bash
   anchor deploy --provider.cluster devnet
   ```

3. **Update program IDs:**
   After deployment, update the program IDs in:
   - `Anchor.toml`
   - `.env`
   - Frontend configuration

## Program IDs

### Devnet
- Factory: `93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP`
- Market: `94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ`
- Dashboard: `95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR`

*Note: These are placeholder IDs and will be updated after deployment.*

## Frontend Integration

The frontend application will be located in `app/` directory and will be a complete copy of the existing React application adapted for Solana.

## Contributing

1. Follow Rust and Anchor best practices
2. Write tests for all new functionality
3. Update documentation for any changes
4. Test on devnet before mainnet deployment

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Anchor Examples](https://github.com/coral-xyz/anchor/tree/master/examples)