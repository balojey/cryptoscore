# Requirements Document

## Introduction

This document outlines the requirements for creating a Solana-based version of the CryptoScore decentralized prediction market platform. The goal is to migrate the existing Polkadot-based smart contract architecture to Solana while maintaining the same frontend user experience with necessary blockchain interaction adaptations.

## Glossary

- **Solana Program**: Smart contract equivalent on Solana blockchain (replaces Solidity contracts)
- **Anchor Framework**: Rust-based framework for Solana program development
- **Program Derived Address (PDA)**: Deterministic account addresses derived from program ID and seeds
- **Solana Wallet Adapter**: Frontend library for wallet connection (replaces Wagmi)
- **SPL Token**: Solana Program Library token standard
- **Rent**: Solana's account storage fee mechanism
- **Instruction**: Solana's transaction operation unit
- **Account**: Solana's data storage unit
- **Frontend Application**: React-based user interface (existing dapp-react codebase)
- **Factory Program**: Solana program that creates and manages market instances
- **Market Program**: Individual prediction market program instance
- **Dashboard Program**: Data aggregation program for querying market information

## Requirements

### Requirement 1

**User Story:** As a developer, I want to set up a Solana workspace with Anchor framework, so that I can develop Solana programs using modern tooling and best practices.

#### Acceptance Criteria

1. WHEN the workspace is initialized, THE Solana Workspace SHALL contain an Anchor project structure with programs/, tests/, and migrations/ directories
2. THE Solana Workspace SHALL include package.json with necessary dependencies for TypeScript development
3. THE Solana Workspace SHALL include Anchor.toml configuration file specifying devnet as the default cluster
4. THE Solana Workspace SHALL include .env file template for storing wallet keypair paths and RPC endpoints
5. THE Solana Workspace SHALL include README.md documenting setup instructions, common commands, and architecture overview

### Requirement 2

**User Story:** As a developer, I want to implement a Factory Program in Solana, so that users can create new prediction market instances on-chain.

#### Acceptance Criteria

1. WHEN a user invokes the create_market instruction, THE Factory Program SHALL create a new Market account with initialized state
2. THE Factory Program SHALL store market metadata including match ID, entry fee, creator address, and visibility settings
3. WHEN a market is created, THE Factory Program SHALL emit a MarketCreated event with indexed market address and creator
4. THE Factory Program SHALL maintain a registry of all created markets using Program Derived Addresses
5. THE Factory Program SHALL enforce validation rules including non-zero entry fees and valid match identifiers

### Requirement 3

**User Story:** As a user, I want to join prediction markets and make predictions, so that I can participate in decentralized betting on football matches.

#### Acceptance Criteria

1. WHEN a user invokes the join_market instruction before match kickoff, THE Market Program SHALL accept the entry fee and record the prediction
2. THE Market Program SHALL store participant data including wallet address, prediction choice (HOME/DRAW/AWAY), and timestamp
3. WHEN a user joins a market, THE Market Program SHALL emit a PredictionMade event with participant address and prediction
4. THE Market Program SHALL reject join attempts after match kickoff time
5. THE Market Program SHALL prevent duplicate entries from the same wallet address

### Requirement 4

**User Story:** As a market creator, I want markets to resolve automatically based on match outcomes, so that winners can claim their rewards without manual intervention.

#### Acceptance Criteria

1. WHEN the resolve_market instruction is invoked with valid match outcome data, THE Market Program SHALL update market status to Resolved
2. THE Market Program SHALL calculate winner pool size and individual reward amounts based on total pool and winner count
3. THE Market Program SHALL apply 1% creator fee and 1% platform fee to the total pool before distribution
4. WHEN a market is resolved, THE Market Program SHALL emit a MarketResolved event with outcome and winner count
5. THE Market Program SHALL only allow resolution after match end time with valid outcome proof

### Requirement 5

**User Story:** As a winning participant, I want to withdraw my rewards from resolved markets, so that I can claim my earnings.

#### Acceptance Criteria

1. WHEN a winner invokes the withdraw instruction, THE Market Program SHALL transfer the calculated reward amount to the participant's wallet
2. THE Market Program SHALL mark the participant's withdrawal status as claimed to prevent double withdrawals
3. WHEN a withdrawal succeeds, THE Market Program SHALL emit a RewardClaimed event with participant address and amount
4. THE Market Program SHALL reject withdrawal attempts from non-winners or already-claimed participants
5. THE Market Program SHALL handle rent-exempt balance requirements for account closure

### Requirement 6

**User Story:** As a developer, I want to implement a Dashboard Program for data aggregation, so that the frontend can efficiently query market information.

#### Acceptance Criteria

1. THE Dashboard Program SHALL provide a get_all_markets instruction that returns paginated market data
2. THE Dashboard Program SHALL provide a get_user_markets instruction that returns markets filtered by participant address
3. THE Dashboard Program SHALL provide a get_market_details instruction that returns comprehensive market state including participants and predictions
4. THE Dashboard Program SHALL calculate and return derived metrics including pool size, participant count, and prediction distribution
5. THE Dashboard Program SHALL support filtering by market status (Open, Live, Resolved) and visibility (Public, Private)

### Requirement 7

**User Story:** As a frontend developer, I want to integrate Solana wallet connection, so that users can connect their Solana wallets to interact with the dApp.

#### Acceptance Criteria

1. THE Frontend Application SHALL use @solana/wallet-adapter-react for wallet connection management
2. THE Frontend Application SHALL support multiple wallet providers including Phantom, Solflare, and Backpack
3. WHEN a user connects a wallet, THE Frontend Application SHALL display the connected wallet address and SOL balance
4. THE Frontend Application SHALL persist wallet connection preference across browser sessions
5. THE Frontend Application SHALL handle wallet disconnection and account changes gracefully

### Requirement 8

**User Story:** As a frontend developer, I want to replace Wagmi hooks with Solana-specific hooks, so that blockchain interactions work with Solana programs.

#### Acceptance Criteria

1. THE Frontend Application SHALL implement useSolanaProgram hook for program interaction replacing useReadContract and useWriteContract
2. THE Frontend Application SHALL implement useMarketData hook for fetching market information from Dashboard Program
3. THE Frontend Application SHALL implement useMarketActions hook for creating, joining, and withdrawing from markets
4. THE Frontend Application SHALL handle transaction signing and confirmation with appropriate loading states
5. THE Frontend Application SHALL display transaction signatures and provide links to Solana Explorer

### Requirement 9

**User Story:** As a user, I want real-time updates for market changes, so that I see the latest market data without manual refresh.

#### Acceptance Criteria

1. THE Frontend Application SHALL subscribe to program account changes using Solana WebSocket connections
2. WHEN a market account is updated, THE Frontend Application SHALL invalidate cached data and refetch market information
3. THE Frontend Application SHALL display toast notifications for relevant events (new markets, resolutions, withdrawals)
4. THE Frontend Application SHALL implement exponential backoff for WebSocket reconnection on connection failures
5. THE Frontend Application SHALL fall back to polling when WebSocket connections are unavailable

### Requirement 10

**User Story:** As a developer, I want comprehensive testing for Solana programs, so that I can ensure program correctness and security.

#### Acceptance Criteria

1. THE Solana Workspace SHALL include integration tests using Anchor's testing framework
2. THE Test Suite SHALL cover all program instructions including success and failure scenarios
3. THE Test Suite SHALL verify event emissions and account state changes
4. THE Test Suite SHALL test edge cases including rent exemption, account closure, and concurrent transactions
5. THE Test Suite SHALL achieve minimum 80% code coverage for all program logic

### Requirement 11

**User Story:** As a developer, I want deployment scripts and configuration, so that I can deploy programs to devnet and mainnet.

#### Acceptance Criteria

1. THE Solana Workspace SHALL include deployment scripts for Factory, Market, and Dashboard programs
2. THE Deployment Scripts SHALL verify program builds before deployment
3. THE Deployment Scripts SHALL update program IDs in frontend configuration after successful deployment
4. THE Solana Workspace SHALL include separate configurations for devnet, testnet, and mainnet-beta
5. THE Deployment Scripts SHALL generate and export program IDL files for frontend integration

### Requirement 12

**User Story:** As a user, I want the same UI/UX experience on Solana, so that the migration is seamless and familiar.

#### Acceptance Criteria

1. THE Frontend Application SHALL maintain all existing components including EnhancedMarketCard, PortfolioSummary, and Leaderboard
2. THE Frontend Application SHALL preserve all 6 theme presets with identical visual appearance
3. THE Frontend Application SHALL maintain virtual scrolling, real-time updates, and performance optimizations
4. THE Frontend Application SHALL update only blockchain interaction code while preserving UI components
5. THE Frontend Application SHALL display SOL amounts instead of PAS tokens with appropriate formatting
