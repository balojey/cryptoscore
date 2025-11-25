# Implementation Plan

- [x] 1. Set up USDC asset integration foundation
  - Update Polkadot Asset Hub configuration for USDC Asset ID 1337
  - Create USDC utility functions for 6-decimal precision handling
  - Update chain configuration in wagmi.ts for USDC asset support
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 2. Update smart contracts for USDC integration
- [ ] 2.1 Modify CryptoScoreFactory for USDC support
  - Replace PAS token logic with USDC asset transfers
  - Add USDC asset ID constant and decimal handling
  - Update market creation functions to use USDC entry fees
  - Implement pre-authorization allowance system for frictionless trading
  - _Requirements: 11.1, 11.5, 8.3_

- [ ] 2.2 Update CryptoScoreMarket contract for USDC transactions
  - Replace native token transfers with USDC asset transfers
  - Update entry fee handling to use 6-decimal USDC precision
  - Modify reward distribution to use direct USDC transfers
  - Implement pre-authorized trading mechanisms
  - _Requirements: 11.2, 11.4, 9.1, 9.2, 9.3, 9.4_

- [ ] 2.3 Modify CryptoScoreDashboard for USDC balance queries
  - Update balance queries to return USDC amounts
  - Modify market info structures to include USDC values
  - Update aggregation functions for USDC-based calculations
  - _Requirements: 11.3, 11.4_

- [ ] 2.4 Write smart contract tests for USDC integration
  - Create unit tests for USDC asset transfer functions
  - Test pre-authorization mechanisms
  - Verify 6-decimal precision handling
  - Test market creation and resolution with USDC
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 3. Implement Crossmint SDK integration
- [ ] 3.1 Set up Crossmint SDK and configuration
  - Install and configure Crossmint SDK for React
  - Create Crossmint configuration for Polkadot Asset Hub
  - Set up environment variables for Crossmint API keys
  - Initialize Crossmint provider in React app
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [ ] 3.2 Create social authentication components
  - Build social login buttons for Google, Twitter, Discord, Email
  - Implement OAuth flow handling for each provider
  - Create authentication state management
  - Add error handling for failed social logins
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3.3 Implement embedded wallet management
  - Create embedded wallet creation flow for social login users
  - Implement wallet initialization and key management
  - Add USDC asset support for embedded wallets
  - Create wallet recovery and backup mechanisms
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 3.4 Write tests for Crossmint integration
  - Test social authentication flows
  - Test embedded wallet creation and management
  - Test USDC asset compatibility with embedded wallets
  - _Requirements: 1.1, 2.1, 2.2, 2.3_

- [ ] 4. Create unified wallet abstraction layer
- [ ] 4.1 Build unified wallet context
  - Create React context for wallet state management
  - Abstract wallet differences between social and external wallets
  - Implement unified transaction signing interface
  - Add wallet type detection and switching
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.2 Implement wallet connection management
  - Create connection handlers for both wallet types
  - Implement wallet disconnection and cleanup
  - Add automatic wallet reconnection on page refresh
  - Handle wallet switching between social and external
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 4.3 Create transaction abstraction layer
  - Implement unified transaction sending interface
  - Add transaction status tracking and updates
  - Create error handling for different wallet types
  - Implement transaction retry mechanisms
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 4.4 Write tests for wallet abstraction
  - Test unified wallet context functionality
  - Test transaction signing across wallet types
  - Test wallet connection and disconnection flows
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Implement USDC balance and transaction management
- [ ] 5.1 Create USDC balance display components
  - Update Balance component to show USDC instead of PAS
  - Implement 6-decimal precision formatting for USDC amounts
  - Add real-time balance updates after transactions
  - Create balance loading and error states
  - _Requirements: 5.5, 12.1, 12.4_

- [ ] 5.2 Build deposit interface
  - Create USDC deposit modal and form
  - Implement deposit transaction handling
  - Add deposit confirmation and success feedback
  - Create deposit transaction history tracking
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 5.3 Build withdrawal interface
  - Create USDC withdrawal modal with address validation
  - Implement withdrawal transaction handling
  - Add withdrawal confirmation and success feedback
  - Create withdrawal transaction history tracking
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 5.4 Implement transaction history
  - Create transaction history component for deposits/withdrawals
  - Add transaction status tracking and updates
  - Implement transaction filtering and search
  - Add transaction details modal
  - _Requirements: 6.4, 7.4, 12.4_

- [ ]* 5.5 Write tests for balance management
  - Test USDC balance display and formatting
  - Test deposit and withdrawal flows
  - Test transaction history functionality
  - _Requirements: 5.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_

- [ ] 6. Implement frictionless trading system
- [ ] 6.1 Create pre-authorization interface
  - Build pre-approval modal for trading allowances
  - Implement allowance setting and management
  - Add allowance status display and updates
  - Create allowance revocation functionality
  - _Requirements: 8.1, 8.3, 11.5_

- [ ] 6.2 Update trading components for USDC
  - Modify market creation to use USDC entry fees
  - Update market joining to use USDC payments
  - Modify reward withdrawal to use USDC transfers
  - Add USDC amount validation and formatting
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3, 9.4_

- [ ] 6.3 Implement gasless transaction flow
  - Create transaction batching for multiple operations
  - Implement meta-transaction support where possible
  - Add transaction queuing and execution management
  - Create fallback to regular transactions when needed
  - _Requirements: 8.2, 8.4_

- [ ] 6.4 Add trading validation and security
  - Implement balance validation before trades
  - Add double-spending prevention mechanisms
  - Create transaction confirmation flows
  - Add security checks for pre-authorized trades
  - _Requirements: 12.1, 12.2, 12.3_

- [ ]* 6.5 Write tests for trading system
  - Test pre-authorization flows
  - Test USDC trading transactions
  - Test gasless transaction mechanisms
  - Test trading validation and security
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 12.1, 12.2, 12.3_

- [ ] 7. Update user interface for DEX experience
- [ ] 7.1 Redesign authentication interface
  - Create unified login modal with social and wallet options
  - Add authentication method selection and switching
  - Update header to show authentication status
  - Add user profile management for social login users
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 4.2_

- [ ] 7.2 Update account management interface
  - Modify Account component to support both wallet types
  - Add social login user profile information
  - Update wallet connection status display
  - Add wallet type indicator and switching options
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7.3 Create onboarding flow
  - Build step-by-step onboarding for new users
  - Add authentication method selection guide
  - Create USDC deposit tutorial for new users
  - Implement onboarding progress tracking
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 7.4 Update market interfaces for USDC
  - Modify market cards to display USDC amounts
  - Update market creation forms for USDC entry fees
  - Modify portfolio summary to show USDC values
  - Update all trading interfaces to use USDC formatting
  - _Requirements: 5.5, 6.1, 6.2, 6.3, 6.4_

- [ ]* 7.5 Write tests for UI components
  - Test authentication interface functionality
  - Test account management across wallet types
  - Test onboarding flow completion
  - Test USDC display formatting
  - _Requirements: 1.1, 4.1, 10.1, 5.5_

- [ ] 8. Implement comprehensive error handling
- [ ] 8.1 Add authentication error handling
  - Create error handling for failed social logins
  - Add fallback mechanisms for authentication failures
  - Implement retry logic for network errors
  - Add clear error messages and troubleshooting guides
  - _Requirements: 1.1, 2.1, 3.1_

- [ ] 8.2 Implement transaction error handling
  - Add error handling for failed USDC transactions
  - Create retry mechanisms for recoverable transaction errors
  - Implement transaction timeout handling
  - Add comprehensive error reporting and logging
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 9.4_

- [ ] 8.3 Add wallet connection error handling
  - Create error handling for wallet connection failures
  - Add network switching prompts for wrong networks
  - Implement wallet compatibility checking
  - Add clear error messages for unsupported wallets
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [ ]* 8.4 Write tests for error handling
  - Test authentication error scenarios
  - Test transaction failure handling
  - Test wallet connection error recovery
  - _Requirements: 1.1, 8.1, 3.1_

- [ ] 9. Deploy and configure production environment
- [ ] 9.1 Deploy updated smart contracts
  - Deploy USDC-compatible contracts to Paseo testnet
  - Verify contract functionality and USDC integration
  - Update contract addresses in frontend configuration
  - Create contract interaction documentation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 9.2 Configure Crossmint production environment
  - Set up production Crossmint API keys and configuration
  - Configure OAuth applications for social providers
  - Set up embedded wallet production settings
  - Test social authentication in production environment
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_

- [ ] 9.3 Update frontend configuration
  - Update environment variables for production
  - Configure USDC asset settings for mainnet
  - Update API endpoints and contract addresses
  - Set up monitoring and error tracking
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9.4 Perform end-to-end testing
  - Test complete user onboarding flow (2-minute target)
  - Verify social login and external wallet parity
  - Test USDC deposit, trading, and withdrawal flows
  - Validate frictionless trading experience
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 4.1, 4.2, 4.3, 4.4_

- [ ]* 9.5 Create deployment documentation
  - Document deployment procedures and configurations
  - Create troubleshooting guides for common issues
  - Document API keys and environment setup
  - Create user guides for new DEX features
  - _Requirements: 1.1, 5.1, 8.1_