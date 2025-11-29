# Implementation Plan

- [x] 1. Remove Anchor dependencies and set up new packages
  - Remove @coral-xyz/anchor from package.json
  - Add @solana/web3.js (latest version)
  - Add borsh for instruction serialization
  - Add @solana/buffer-layout for account deserialization
  - Create directory structure for Solana utilities (lib/solana/)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement core Solana utility classes
  - [x] 2.1 Create TypeScript interfaces for program accounts
    - Define Market, Participant, Factory, UserStats interfaces
    - Define MarketStatus and MatchOutcome enums
    - Define CreateMarketParams and other parameter types
    - Export all types from solana-program-types.ts
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [x] 2.2 Implement TransactionBuilder class
    - Create TransactionBuilder with fluent API
    - Add methods for adding instructions
    - Add compute budget and priority fee support
    - Implement build() method returning Transaction
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Implement Borsh schemas for instruction data
    - Define CreateMarketSchema with all parameters
    - Define JoinMarketSchema with prediction field
    - Define ResolveMarketSchema with outcome field
    - Export all schemas from borsh-schemas.ts
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.4 Implement InstructionEncoder class
    - Create createMarket instruction encoder with discriminator
    - Create joinMarket instruction encoder
    - Create resolveMarket instruction encoder
    - Create withdraw instruction encoder
    - Add proper account metas for each instruction
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 2.5 Implement AccountDecoder class
    - Create decodeMarket method with manual buffer parsing
    - Create decodeParticipant method
    - Create decodeFactory method
    - Create decodeUserStats method (if needed)
    - Handle discriminators and optional fields properly
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.6 Implement PDAUtils class
    - Create findFactoryPDA method
    - Create findMarketPDA method with factory and matchId seeds
    - Create findParticipantPDA method with market and user seeds
    - Create findUserStatsPDA method
    - Return both PDA and bump seed from each method
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 2.7 Implement SolanaErrorHandler class
    - Define error code mapping for all program errors
    - Implement parseError method for custom program errors
    - Add parsing for common Solana errors (insufficient funds, rejected, expired)
    - Implement logError method for debugging
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

  - [x] 2.8 Implement SolanaUtils class
    - Create lamportsToSol and solToLamports conversion methods
    - Create shortenAddress method for display
    - Create confirmTransaction method with retry logic
    - Create simulateTransaction method
    - Create getRecentBlockhash and getExplorerUrl methods
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 3. Update custom hooks for Anchor-free integration
  - [x] 3.1 Create useSolanaConnection hook
    - Use @solana/wallet-adapter-react hooks
    - Return connection, wallet, publicKey, and isConnected
    - Return signTransaction and signAllTransactions methods
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 3.2 Update useMarketData hook
    - Remove Anchor program usage
    - Fetch market account using connection.getAccountInfo
    - Decode account data using AccountDecoder.decodeMarket
    - Handle account not found errors
    - Maintain React Query caching with 10-second stale time
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 3.3 Create useAllMarkets hook
    - Fetch all market accounts using connection.getProgramAccounts
    - Decode each account using AccountDecoder
    - Return array of markets with addresses
    - Maintain React Query caching with 30-second stale time
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 3.4 Update useMarketActions hook - createMarket
    - Remove Anchor program methods
    - Derive factory and market PDAs using PDAUtils
    - Build instruction using InstructionEncoder.createMarket
    - Build transaction using TransactionBuilder
    - Sign and send transaction using wallet adapter
    - Confirm transaction with retry logic
    - Handle success with toast notification and cache invalidation
    - Handle errors with SolanaErrorHandler
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 13.1, 13.2, 13.3_

  - [x] 3.5 Update useMarketActions hook - joinMarket
    - Derive participant PDA using PDAUtils
    - Build instruction using InstructionEncoder.joinMarket
    - Build and send transaction
    - Handle success and errors appropriately
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 13.1, 13.2, 13.3_

  - [x] 3.6 Update useMarketActions hook - resolveMarket
    - Build instruction using InstructionEncoder.resolveMarket
    - Build and send transaction
    - Handle success and errors appropriately
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 13.1, 13.2, 13.3_

  - [x] 3.7 Update useMarketActions hook - withdraw
    - Derive participant PDA using PDAUtils
    - Build instruction using InstructionEncoder.withdraw
    - Build and send transaction
    - Handle success with celebration and cache invalidation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 13.1, 13.2, 13.3_

  - [x] 3.8 Create useAccountSubscription hook
    - Subscribe to market account changes using connection.onAccountChange
    - Decode updated account data using AccountDecoder
    - Update React Query cache when changes detected
    - Handle WebSocket disconnections and reconnections
    - Unsubscribe on component unmount
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x] 3.9 Create useParticipantData hook
    - Derive participant PDA for connected user and market
    - Fetch participant account data
    - Decode using AccountDecoder.decodeParticipant
    - Handle cases where participant account doesn't exist
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 4. Update UI components for Anchor-free integration
  - [ ] 4.1 Update wallet connection components
    - Ensure Connect.tsx uses wallet adapter hooks correctly
    - Update Account.tsx to display SOL balance
    - Update Balance.tsx for SOL instead of PAS
    - Test wallet connection and disconnection flows
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ] 4.2 Update market display components
    - Ensure EnhancedMarketCard displays SOL amounts correctly
    - Update PortfolioSummary for SOL-based metrics
    - Verify all market-related components handle new data structure
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ] 4.3 Update transaction handling in Market.tsx
    - Update market creation modal to use new useMarketActions hook
    - Ensure loading states work correctly
    - Verify error handling displays properly
    - Test transaction confirmation flow
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ] 4.4 Update transaction handling in MarketDetail.tsx
    - Update join market functionality
    - Update withdraw functionality
    - Add transaction signature display
    - Add Solana Explorer links
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 5. Implement transaction fee estimation
  - [ ] 5.1 Add fee estimation to transaction builder
    - Use connection.getFeeForMessage for fee estimation
    - Display estimated fee before transaction confirmation
    - Handle fee estimation failures gracefully
    - Update estimates when network conditions change
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 6. Add transaction simulation before sending
  - [ ] 6.1 Implement simulation in useMarketActions
    - Simulate transactions before sending using SolanaUtils
    - Log simulation results for debugging
    - Warn users if simulation fails
    - Allow users to proceed or cancel based on simulation
    - _Requirements: 16.5_

- [ ] 7. Testing and validation
  - [ ] 7.1 Test all utility classes
    - Test TransactionBuilder with various instruction combinations
    - Test InstructionEncoder with different parameters
    - Test AccountDecoder with mock account data
    - Test PDAUtils derivation correctness
    - Test SolanaErrorHandler with various error types
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 13.1, 13.2, 13.3, 13.4, 13.5_

  - [ ] 7.2 Test market creation flow end-to-end
    - Connect wallet on devnet
    - Create a test market with valid parameters
    - Verify market account is created on-chain
    - Verify UI updates correctly
    - Test error scenarios (insufficient funds, invalid parameters)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 7.3 Test market joining flow end-to-end
    - Join a market with each prediction choice (HOME/DRAW/AWAY)
    - Verify participant account is created
    - Verify market participant counts update
    - Test error scenarios (already joined, market started, insufficient funds)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 7.4 Test market resolution and withdrawal flow
    - Resolve a market with outcome
    - Verify market status updates
    - Withdraw rewards as winner
    - Verify SOL transfer occurs
    - Test error scenarios (not a winner, already withdrawn)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 7.5 Test real-time updates via WebSocket
    - Subscribe to market account changes
    - Trigger updates from another wallet/browser
    - Verify UI updates automatically
    - Test reconnection after disconnect
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 8. Documentation and cleanup
  - [ ] 8.1 Create comprehensive README
    - Document Anchor-free architecture
    - Provide usage examples for each operation
    - Explain Borsh serialization schemas
    - Document PDA derivation logic
    - Add troubleshooting section
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 8.2 Add inline code documentation
    - Add JSDoc comments to all utility classes
    - Document function parameters and return types
    - Add usage examples in comments
    - Document error scenarios
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ] 8.3 Clean up unused Anchor code
    - Remove any remaining Anchor imports
    - Remove Anchor-specific configuration
    - Update environment variables if needed
    - Verify no Anchor dependencies remain
    - _Requirements: 1.1, 1.2_

  - [ ] 8.4 Performance optimization
    - Implement batch account fetching where possible
    - Optimize React Query cache settings
    - Minimize unnecessary re-renders
    - Profile and optimize slow operations
    - _Requirements: 17.5_
