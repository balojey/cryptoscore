# Solana Migration Design Document

## Overview

This design document outlines the technical architecture for creating a Solana-based version of CryptoScore. The implementation involves creating a new Solana workspace containing both Solana programs (smart contracts) using the Anchor framework and a complete copy of the frontend adapted to use Solana-specific libraries while maintaining the existing UI/UX. This approach ensures the Polkadot version remains untouched.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Solana Workspace                            │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Frontend (React Copy)                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │ │
│  │  │UI Components│  │Solana Hooks │  │ Wallet Adapter   │ │ │
│  │  │(Copied)     │  │(New)        │  │ (New)            │ │ │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                Solana Programs                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐ │ │
│  │  │Factory Prog │  │Market Prog  │  │Dashboard Program │ │ │
│  │  │(Anchor)     │  │(Anchor)     │  │(Anchor)          │ │ │
│  │  └─────────────┘  └─────────────┘  └──────────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Workspace Structure

The Solana workspace will contain:

```
solana/
├── programs/           # Solana programs (Anchor)
│   ├── factory/        # Factory program
│   ├── market/         # Market program
│   └── dashboard/      # Dashboard program
├── app/               # Frontend copy (from dapp-react)
│   ├── src/           # React components and logic
│   ├── public/        # Static assets
│   └── package.json   # Dependencies with Solana libraries
├── tests/             # Integration tests
├── migrations/        # Deployment scripts
├── Anchor.toml        # Anchor configuration
└── package.json       # Workspace configuration
```

### Program Architecture

The system consists of three main Solana programs:

1. **Factory Program**: Creates and manages market instances
2. **Market Program**: Handles individual prediction market logic
3. **Dashboard Program**: Provides data aggregation and querying capabilities

## Components and Interfaces

### Solana Programs

#### Factory Program

**Purpose**: Central registry for creating and tracking prediction markets

**Key Instructions**:
- `initialize_factory`: Initialize the factory state
- `create_market`: Create a new prediction market
- `get_markets`: Retrieve paginated list of markets

**Account Structure**:
```rust
#[account]
pub struct Factory {
    pub authority: Pubkey,
    pub market_count: u64,
    pub platform_fee_bps: u16, // 100 = 1%
    pub bump: u8,
}

#[account]
pub struct MarketRegistry {
    pub factory: Pubkey,
    pub market_address: Pubkey,
    pub creator: Pubkey,
    pub match_id: String,
    pub created_at: i64,
    pub is_public: bool,
}
```

#### Market Program

**Purpose**: Individual prediction market with full lifecycle management

**Key Instructions**:
- `initialize_market`: Set up new market
- `join_market`: User joins with prediction
- `resolve_market`: Resolve with match outcome
- `withdraw_rewards`: Claim winnings

**Account Structure**:
```rust
#[account]
pub struct Market {
    pub factory: Pubkey,
    pub creator: Pubkey,
    pub match_id: String,
    pub entry_fee: u64,
    pub kickoff_time: i64,
    pub end_time: i64,
    pub status: MarketStatus,
    pub outcome: Option<MatchOutcome>,
    pub total_pool: u64,
    pub participant_count: u32,
    pub home_count: u32,
    pub draw_count: u32,
    pub away_count: u32,
    pub is_public: bool,
    pub bump: u8,
}

#[account]
pub struct Participant {
    pub market: Pubkey,
    pub user: Pubkey,
    pub prediction: MatchOutcome,
    pub joined_at: i64,
    pub has_withdrawn: bool,
    pub bump: u8,
}
```

#### Dashboard Program

**Purpose**: Efficient data querying and aggregation

**Key Instructions**:
- `get_all_markets`: Paginated market listing
- `get_user_markets`: User-specific markets
- `get_market_stats`: Aggregated statistics
- `get_leaderboard`: Top performers

**Account Structure**:
```rust
#[account]
pub struct UserStats {
    pub user: Pubkey,
    pub total_markets: u32,
    pub wins: u32,
    pub losses: u32,
    pub total_wagered: u64,
    pub total_won: u64,
    pub current_streak: i32,
    pub best_streak: u32,
    pub last_updated: i64,
}
```

### Frontend Integration (Copied from dapp-react)

The frontend will be a complete copy of dapp-react with blockchain integration replaced. Key changes:

1. **Copy entire dapp-react structure** to `solana/app/`
2. **Replace Wagmi with Solana Wallet Adapter**
3. **Update package.json** with Solana dependencies
4. **Modify blockchain hooks** to use Solana programs
5. **Update configuration** for Solana network settings

#### Wallet Integration

Replace Wagmi with Solana Wallet Adapter:

```typescript
// New wallet context setup
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
]

// Wrap app with providers
<ConnectionProvider endpoint={clusterApiUrl(WalletAdapterNetwork.Devnet)}>
  <WalletProvider wallets={wallets} autoConnect>
    <WalletModalProvider>
      <App />
    </WalletModalProvider>
  </WalletProvider>
</ConnectionProvider>
```

#### Custom Hooks

**useSolanaProgram Hook**:
```typescript
export function useSolanaProgram() {
  const { connection } = useConnection()
  const wallet = useWallet()
  const program = useMemo(() => {
    if (!wallet.publicKey) return null
    return new Program(IDL, PROGRAM_ID, { connection, wallet })
  }, [connection, wallet])
  
  return { program, connection, wallet }
}
```

**useMarketActions Hook**:
```typescript
export function useMarketActions() {
  const { program } = useSolanaProgram()
  
  const createMarket = useCallback(async (params: CreateMarketParams) => {
    // Implementation for creating markets
  }, [program])
  
  const joinMarket = useCallback(async (marketAddress: string, prediction: MatchOutcome) => {
    // Implementation for joining markets
  }, [program])
  
  return { createMarket, joinMarket, resolveMarket, withdrawRewards }
}
```

## Data Models

### Enums

```rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MarketStatus {
    Open,
    Live,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum MatchOutcome {
    Home,
    Draw,
    Away,
}
```

### Events

```rust
#[event]
pub struct MarketCreated {
    pub market: Pubkey,
    pub creator: Pubkey,
    pub match_id: String,
    pub entry_fee: u64,
    pub kickoff_time: i64,
}

#[event]
pub struct PredictionMade {
    pub market: Pubkey,
    pub user: Pubkey,
    pub prediction: MatchOutcome,
    pub timestamp: i64,
}

#[event]
pub struct MarketResolved {
    pub market: Pubkey,
    pub outcome: MatchOutcome,
    pub winner_count: u32,
    pub total_pool: u64,
}
```

### Program Derived Addresses (PDAs)

```rust
// Factory PDA
pub fn factory_pda() -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"factory"], &crate::ID)
}

// Market PDA
pub fn market_pda(factory: &Pubkey, match_id: &str) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"market", factory.as_ref(), match_id.as_bytes()],
        &crate::ID
    )
}

// Participant PDA
pub fn participant_pda(market: &Pubkey, user: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"participant", market.as_ref(), user.as_ref()],
        &crate::ID
    )
}
```

## Error Handling

### Program Errors

```rust
#[error_code]
pub enum CryptoScoreError {
    #[msg("Market has already started")]
    MarketAlreadyStarted,
    #[msg("Market not yet resolved")]
    MarketNotResolved,
    #[msg("User already participated")]
    AlreadyParticipated,
    #[msg("User not a winner")]
    NotAWinner,
    #[msg("Rewards already withdrawn")]
    AlreadyWithdrawn,
    #[msg("Invalid match outcome")]
    InvalidOutcome,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}
```

### Frontend Error Handling

```typescript
export function useErrorHandler() {
  const handleProgramError = useCallback((error: any) => {
    if (error.code) {
      // Handle specific program errors
      switch (error.code) {
        case 6000: // MarketAlreadyStarted
          toast.error("Market has already started")
          break
        case 6001: // MarketNotResolved
          toast.error("Market not yet resolved")
          break
        default:
          toast.error("Transaction failed")
      }
    } else {
      // Handle wallet/network errors
      toast.error("Connection error")
    }
  }, [])
  
  return { handleProgramError }
}
```

## Testing Strategy

### Program Testing

**Unit Tests**: Test individual instructions in isolation
```rust
#[cfg(test)]
mod tests {
    use super::*;
    use anchor_lang::prelude::*;
    
    #[tokio::test]
    async fn test_create_market() {
        // Test market creation logic
    }
    
    #[tokio::test]
    async fn test_join_market() {
        // Test joining market logic
    }
}
```

**Integration Tests**: Test full user flows
```typescript
describe("CryptoScore Integration", () => {
  it("should create and join market", async () => {
    // Full flow testing
  })
  
  it("should resolve market and distribute rewards", async () => {
    // Resolution and withdrawal testing
  })
})
```

### Frontend Testing

**Component Tests**: Ensure UI components work with Solana integration
```typescript
describe("MarketCard", () => {
  it("should display SOL amounts correctly", () => {
    // Test SOL formatting
  })
  
  it("should handle wallet connection", () => {
    // Test wallet integration
  })
})
```

## Security Considerations

### Program Security

1. **Access Control**: Use proper account validation and ownership checks
2. **Reentrancy Protection**: Implement checks-effects-interactions pattern
3. **Integer Overflow**: Use checked arithmetic operations
4. **Account Validation**: Verify all account relationships and constraints
5. **Rent Exemption**: Ensure accounts maintain minimum balance requirements

### Frontend Security

1. **Transaction Verification**: Verify transaction contents before signing
2. **Input Validation**: Sanitize all user inputs
3. **Wallet Security**: Never expose private keys or seed phrases
4. **RPC Security**: Use trusted RPC endpoints
5. **Error Information**: Avoid exposing sensitive error details

## Performance Optimizations

### Program Optimizations

1. **Account Size**: Minimize account data size to reduce rent costs
2. **Instruction Batching**: Combine related operations when possible
3. **PDA Efficiency**: Use efficient seed structures for PDAs
4. **Event Indexing**: Index frequently queried event fields

### Frontend Optimizations

1. **Account Caching**: Cache account data with appropriate invalidation
2. **Subscription Management**: Efficiently manage WebSocket subscriptions
3. **Transaction Batching**: Batch multiple instructions when possible
4. **Lazy Loading**: Maintain existing code splitting and lazy loading

## Migration Strategy

### Phase 1: Workspace Setup
- Create Solana workspace structure
- Set up Anchor framework with three programs
- Copy dapp-react to solana/app/
- Set up testing framework

### Phase 2: Core Programs
- Implement Factory Program
- Implement Market Program  
- Implement Dashboard Program
- Write comprehensive tests

### Phase 3: Frontend Adaptation
- Update package.json with Solana dependencies
- Replace Wagmi with Solana Wallet Adapter
- Implement Solana-specific hooks
- Update blockchain interaction code
- Preserve all UI components and theming

### Phase 4: Integration & Testing
- Integrate frontend with Solana programs
- Comprehensive testing on devnet
- Performance optimization
- Documentation and deployment preparation

## Deployment Configuration

### Network Configurations

**Devnet**:
```toml
[programs.devnet]
cryptoscore_factory = "FactoryProgramId111111111111111111111111"
cryptoscore_market = "MarketProgramId1111111111111111111111111"
cryptoscore_dashboard = "DashboardProgramId11111111111111111111111"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

**Mainnet**:
```toml
[programs.mainnet]
cryptoscore_factory = "MainnetFactoryId111111111111111111111111"
cryptoscore_market = "MainnetMarketId1111111111111111111111111"
cryptoscore_dashboard = "MainnetDashboardId11111111111111111111111"

[provider]
cluster = "mainnet-beta"
wallet = "~/.config/solana/mainnet-wallet.json"
```

### Environment Variables

```bash
# Solana workspace .env
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
ANCHOR_WALLET=~/.config/solana/id.json
SOLANA_NETWORK=devnet

# Frontend .env updates
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_FACTORY_PROGRAM_ID=FactoryProgramId111111111111111111111111
VITE_MARKET_PROGRAM_ID=MarketProgramId1111111111111111111111111
VITE_DASHBOARD_PROGRAM_ID=DashboardProgramId11111111111111111111111
```

This design maintains the existing frontend architecture while providing a robust Solana backend that matches the current functionality and user experience.
## Fron
tend Copy Strategy

### Files to Copy from dapp-react/

**Complete directory structure**:
- `src/` - All React components, hooks, contexts, styles
- `public/` - Static assets, PWA manifest, service worker
- `docs/` - Documentation files
- `abi/` - Will be replaced with IDL files
- `index.html` - HTML entry point
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript configuration
- `README.md` - Project documentation

### Files to Modify

**package.json**:
- Remove Wagmi, Viem dependencies
- Add Solana Wallet Adapter dependencies
- Add Anchor client dependencies
- Keep all UI libraries (Radix, Tailwind, etc.)

**src/config/wagmi.ts** → **src/config/solana.ts**:
- Replace chain configuration with Solana cluster configuration
- Replace contract addresses with program IDs

**src/config/contracts.ts** → **src/config/programs.ts**:
- Replace contract ABIs with program IDLs
- Update contract addresses to program IDs

**Blockchain hooks**:
- `useReadContract` → `useProgram` + account fetching
- `useWriteContract` → `useProgram` + instruction calls
- `useWatchContractEvent` → WebSocket subscriptions

### Files to Keep Unchanged

**All UI components**: EnhancedMarketCard, PortfolioSummary, ThemeSwitcher, etc.
**All styling**: tokens.css, components.css, animations.css
**All contexts**: ThemeContext (unchanged)
**All utilities**: formatters.ts, accessibility.ts
**All pages**: MarketDetail, MyMarkets, Leaderboard (UI unchanged)

This approach ensures zero disruption to the Polkadot version while creating a fully functional Solana version with identical UI/UX.