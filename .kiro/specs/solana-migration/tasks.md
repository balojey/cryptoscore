# Implementation Plan

- [x] 1. Set up Solana workspace structure
  - Create solana/ directory with Anchor project structure
  - Initialize Anchor workspace with three programs (factory, market, dashboard)
  - Configure Anchor.toml for devnet development
  - Set up package.json with workspace configuration
  - Create .env template with Solana configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Copy and adapt frontend from dapp-react
  - [x] 2.1 Copy complete dapp-react structure to solana/app/
    - Copy all src/ components, hooks, contexts, styles, and utilities
    - Copy public/ assets, PWA manifest, and service worker
    - Copy configuration files (vite.config.ts, tsconfig.json, index.html)
    - Copy documentation and README files
    - _Requirements: 12.1, 12.2_

  - [x] 2.2 Update package.json with Solana dependencies
    - Remove Wagmi, Viem, and Polkadot-specific dependencies
    - Add @solana/wallet-adapter-react, @solana/wallet-adapter-wallets
    - Add @coral-xyz/anchor for program interaction
    - Keep all UI libraries (Radix, Tailwind, React Router, etc.)
    - _Requirements: 7.1, 7.2_

  - [x] 2.3 Replace blockchain configuration files
    - Replace src/config/wagmi.ts with src/config/solana.ts for cluster configuration
    - Replace src/config/contracts.ts with src/config/programs.ts for program IDs
    - Update environment variable references from VITE_*_CONTRACT to VITE_*_PROGRAM_ID
    - _Requirements: 7.4, 11.4_

- [ ] 3. Implement Factory Program
  - [ ] 3.1 Create Factory program structure and state accounts
    - Define Factory account structure with authority, market count, and platform fee
    - Define MarketRegistry account for tracking created markets
    - Implement initialize_factory instruction with proper validation
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Implement market creation functionality
    - Create create_market instruction with match ID, entry fee, and visibility parameters
    - Generate Market PDA and initialize MarketRegistry entry
    - Emit MarketCreated event with indexed market address and creator
    - Add validation for non-zero entry fees and valid match identifiers
    - _Requirements: 2.3, 2.4, 2.5_

  - [ ] 3.3 Add market querying capabilities
    - Implement get_markets instruction for paginated market listing
    - Add filtering by creator, visibility (public/private), and status
    - Return market metadata including creation time and basic stats
    - _Requirements: 6.1, 6.5_

  - [ ] 3.4 Write Factory program tests
    - Test factory initialization and authority validation
    - Test market creation with various parameters and edge cases
    - Test market registry updates and PDA generation
    - Test event emission and error handling
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 4. Implement Market Program
  - [ ] 4.1 Create Market program structure and state accounts
    - Define Market account with match details, pool info, and participant counts
    - Define Participant account for tracking user predictions and withdrawal status
    - Implement initialize_market instruction with proper validation
    - _Requirements: 3.1, 3.2_

  - [ ] 4.2 Implement market participation functionality
    - Create join_market instruction accepting entry fee and prediction choice
    - Generate Participant PDA and update Market participant counts
    - Emit PredictionMade event with user address and prediction
    - Add validation for kickoff time and duplicate participation prevention
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ] 4.3 Implement market resolution functionality
    - Create resolve_market instruction accepting match outcome data
    - Calculate winner pool size and individual reward amounts
    - Apply 1% creator fee and 1% platform fee to total pool
    - Emit MarketResolved event with outcome and winner statistics
    - Add validation for end time and outcome proof requirements
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 4.4 Implement reward withdrawal functionality
    - Create withdraw instruction for claiming winnings
    - Transfer calculated reward amount to participant's wallet
    - Mark participant's withdrawal status as claimed
    - Emit RewardClaimed event with participant address and amount
    - Add validation for winner status and double withdrawal prevention
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 4.5 Write Market program tests
    - Test market initialization and parameter validation
    - Test joining markets with different predictions and edge cases
    - Test market resolution with various outcomes
    - Test reward withdrawal and double withdrawal prevention
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 5. Implement Dashboard Program
  - [ ] 5.1 Create Dashboard program structure and user statistics
    - Define UserStats account for tracking user performance metrics
    - Implement user statistics calculation and updates
    - Create data structures for leaderboard and aggregated metrics
    - _Requirements: 6.2, 6.4_

  - [ ] 5.2 Implement market data aggregation
    - Create get_all_markets instruction with pagination support
    - Implement get_user_markets instruction filtered by participant address
    - Add get_market_details instruction for comprehensive market state
    - Calculate derived metrics including pool size and prediction distribution
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 5.3 Add filtering and sorting capabilities
    - Support filtering by market status (Open, Live, Resolved)
    - Support filtering by visibility (Public, Private)
    - Implement sorting by creation time, pool size, and participant count
    - Add pagination with configurable page sizes
    - _Requirements: 6.5_

  - [ ] 5.4 Write Dashboard program tests
    - Test user statistics calculation and updates
    - Test market data aggregation and filtering
    - Test pagination and sorting functionality
    - Test derived metrics calculation accuracy
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 6. Implement Solana wallet integration
  - [ ] 6.1 Set up wallet adapter providers
    - Configure ConnectionProvider with Solana RPC endpoint
    - Set up WalletProvider with multiple wallet adapters (Phantom, Solflare, Backpack)
    - Add WalletModalProvider for wallet selection UI
    - Wrap App component with all necessary providers
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 6.2 Replace wallet connection components
    - Update Connect.tsx to use Solana wallet adapter hooks
    - Update Account.tsx to display Solana wallet address and SOL balance
    - Update Balance.tsx to show SOL balance instead of PAS tokens
    - Implement wallet disconnection and account change handling
    - _Requirements: 7.4, 7.5, 12.5_

  - [ ] 6.3 Create Solana-specific custom hooks
    - Implement useSolanaProgram hook for program instance management
    - Create useMarketData hook for fetching market information from Dashboard Program
    - Implement useMarketActions hook for creating, joining, and withdrawing from markets
    - Add transaction signing and confirmation with loading states
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7. Implement real-time updates and event handling
  - [ ] 7.1 Set up WebSocket subscriptions for account changes
    - Subscribe to program account changes using Solana WebSocket connections
    - Implement account change listeners for Market and Factory accounts
    - Add exponential backoff for WebSocket reconnection on failures
    - _Requirements: 9.1, 9.4_

  - [ ] 7.2 Implement cache invalidation and notifications
    - Invalidate cached data when market accounts are updated
    - Display toast notifications for relevant events (new markets, resolutions)
    - Implement fallback to polling when WebSocket connections are unavailable
    - _Requirements: 9.2, 9.3, 9.5_

- [ ] 8. Update UI components for Solana integration
  - [ ] 8.1 Update market display components
    - Modify EnhancedMarketCard to display SOL amounts with proper formatting
    - Update PortfolioSummary to show SOL-based portfolio metrics
    - Ensure all market-related components handle Solana transaction states
    - _Requirements: 12.4, 12.5_

  - [ ] 8.2 Update transaction handling in UI
    - Modify Market.tsx creation modal for Solana transaction flow
    - Update MarketDetail.tsx for Solana-based joining and withdrawal
    - Add transaction signature display and Solana Explorer links
    - Implement proper loading states for Solana transaction confirmation
    - _Requirements: 8.4, 8.5_

- [ ] 9. Set up testing framework and write integration tests
  - [ ] 9.1 Configure Anchor testing environment
    - Set up test validator configuration for local testing
    - Configure test accounts and funding for integration tests
    - Create test utilities for program deployment and account setup
    - _Requirements: 10.1, 10.4_

  - [ ] 9.2 Write end-to-end integration tests
    - Test complete user flow from market creation to reward withdrawal
    - Test multi-user scenarios with different predictions and outcomes
    - Test error scenarios including insufficient funds and invalid operations
    - Verify event emissions and account state changes throughout flows
    - _Requirements: 10.2, 10.3, 10.5_

- [ ] 10. Create deployment configuration and scripts
  - [ ] 10.1 Set up deployment scripts for all programs
    - Create deployment scripts for Factory, Market, and Dashboard programs
    - Implement program build verification before deployment
    - Add program ID updates in frontend configuration after deployment
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 10.2 Configure network-specific settings
    - Set up separate configurations for devnet, testnet, and mainnet-beta
    - Create environment-specific program ID management
    - Generate and export program IDL files for frontend integration
    - _Requirements: 11.4, 11.5_

  - [ ] 10.3 Create workspace documentation
    - Document setup instructions for development environment
    - Create deployment guide for different networks
    - Document API interfaces and program instruction usage
    - Add troubleshooting guide for common issues
    - _Requirements: 1.5_