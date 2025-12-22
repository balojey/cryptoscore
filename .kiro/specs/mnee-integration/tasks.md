# Implementation Plan

- [x] 1. Install and configure MNEE SDK
  - Install @mnee/ts-sdk package and configure TypeScript types
  - Create environment configuration for production and sandbox modes
  - Set up API key management and validation
  - _Requirements: 2.1, 2.5_

- [x] 2. Create MNEE service layer and core utilities
  - [x] 2.1 Implement MneeService class with SDK integration
    - Create service class with initialization, balance queries, and transfer methods
    - Implement error handling and retry logic with circuit breaker pattern
    - Add configuration management and environment switching
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.1, 10.3_

  - [ ]* 2.2 Write property test for MNEE service operations
    - **Property 2: Balance query integration**
    - **Validates: Requirements 2.2, 3.1, 8.2**

  - [ ]* 2.3 Write property test for transfer operations
    - **Property 3: Transfer operation integration**
    - **Validates: Requirements 2.3, 6.1, 6.2, 6.3**

  - [x] 2.4 Implement unit conversion utilities
    - Create functions for converting between atomic units and MNEE tokens
    - Add formatting functions with consistent decimal precision
    - Implement amount validation and range checking
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 11.5_

  - [ ]* 2.5 Write property test for unit conversion accuracy
    - **Property 8: Unit conversion accuracy**
    - **Validates: Requirements 7.2, 7.3, 7.5**

- [x] 3. Refactor currency system to MNEE-only
  - [x] 3.1 Remove ExchangeRateService and related code
    - Delete src/lib/exchangeRateService.ts and all references
    - Remove currency conversion logic from components
    - Clean up localStorage exchange rate caching
    - _Requirements: 4.1, 4.4, 4.5_

  - [x] 3.2 Refactor CurrencyContext to MneeContext
    - Replace CurrencyContext with MneeContext focused on MNEE operations
    - Remove multi-currency support and exchange rate management
    - Add MNEE balance state management and formatting functions
    - _Requirements: 4.2, 9.1, 9.2_

  - [ ]* 3.3 Write property test for MNEE display consistency
    - **Property 1: MNEE display consistency**
    - **Validates: Requirements 1.1, 1.5, 4.3, 9.3**

  - [x] 3.4 Update useCurrency hook to useMnee
    - Rename and refactor hook to provide MNEE-specific functionality
    - Remove exchange rate logic and add MNEE balance queries
    - Update all hook consumers throughout the application
    - _Requirements: 9.2, 9.4_

  - [x] 3.5 Remove currency selector components
    - Delete CurrencySelector component and related UI elements
    - Update all components that used currency selection
    - Remove multi-currency UI elements from layouts
    - _Requirements: 4.2, 9.5_

- [x] 4. Update database schema for MNEE atomic units
  - [x] 4.1 Create database migration for MNEE atomic units
    - Update markets, participants, and transactions tables to use BIGINT for amounts
    - Add MNEE-specific columns (mnee_transaction_id, ticket_id)
    - Create mnee_balances table for caching user balances
    - _Requirements: 5.5, 7.1, 11.4_

  - [ ]* 4.2 Write property test for atomic unit storage consistency
    - **Property 7: Atomic unit storage consistency**
    - **Validates: Requirements 5.5, 7.1, 11.4**

  - [x] 4.3 Update database service methods for MNEE
    - Modify all database operations to handle atomic units
    - Update query methods to return both atomic and decimal amounts
    - Add balance caching and retrieval methods
    - _Requirements: 11.1, 11.3, 11.4_

  - [ ]* 4.4 Write property test for data validation ranges
    - **Property 14: Data validation ranges**
    - **Validates: Requirements 11.5**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Integrate MNEE operations in market functionality
  - [x] 6.1 Update market creation to use MNEE
    - Modify market creation forms to accept MNEE entry fees
    - Update validation to check MNEE amounts and ranges
    - Store entry fees in atomic units in database
    - _Requirements: 5.1, 5.5_

  - [ ]* 6.2 Write property test for market operation MNEE integration
    - **Property 5: Market operation MNEE integration**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 6.3 Update market joining logic for MNEE
    - Implement MNEE balance validation before allowing participation
    - Update participant creation to deduct MNEE from user balance
    - Add real-time balance updates after market joining
    - _Requirements: 5.2, 3.2, 12.1_

  - [ ]* 6.4 Write property test for real-time balance updates
    - **Property 11: Real-time balance updates**
    - **Validates: Requirements 3.2, 12.1, 12.2, 12.4**

  - [x] 6.5 Implement MNEE-based winnings calculation and distribution
    - Update winnings calculation to use MNEE atomic units
    - Implement automatic MNEE transfer for winners
    - Add creator reward distribution in MNEE tokens
    - _Requirements: 1.3, 5.3, 6.1, 6.3_

  - [ ]* 6.6 Write property test for fee calculation consistency
    - **Property 6: Fee calculation consistency**
    - **Validates: Requirements 1.4, 5.4**

- [x] 7. Implement EVM wallet integration
  - [x] 7.1 Update authentication to use EVM addresses for MNEE
    - Modify user authentication to store EVM wallet addresses
    - Update user profile creation to include MNEE-compatible addresses
    - Ensure all MNEE operations use EVM addresses from Crossmint
    - _Requirements: 8.1, 8.5_

  - [ ]* 7.2 Write property test for EVM wallet integration
    - **Property 9: EVM wallet integration**
    - **Validates: Requirements 8.1, 8.2, 8.4, 8.5**

  - [x] 7.3 Update balance queries to use EVM addresses
    - Modify all balance query operations to use EVM wallet addresses
    - Update balance display components to show EVM addresses
    - Ensure address formatting is MNEE-compatible
    - _Requirements: 8.2, 8.4_

- [ ] 8. Update UI components for MNEE display
  - [ ] 8.1 Update all balance display components
    - Modify Balance, WinningsDisplay, and portfolio components for MNEE
    - Update formatting to show MNEE symbols and amounts
    - Remove SOL references and update loading states
    - _Requirements: 1.5, 9.3, 9.4_

  - [ ] 8.2 Update market card and list components
    - Modify EnhancedMarketCard to display MNEE entry fees
    - Update market lists to show MNEE amounts consistently
    - Remove currency conversion displays
    - _Requirements: 1.1, 4.3_

  - [ ] 8.3 Update portfolio and dashboard components
    - Modify SupabasePortfolioSummary for MNEE calculations
    - Update dashboard metrics to use MNEE amounts
    - Implement MNEE-based profit/loss calculations
    - _Requirements: 3.3, 3.4_

  - [ ]* 8.4 Write property test for portfolio calculation accuracy
    - **Property 15: Portfolio calculation accuracy**
    - **Validates: Requirements 3.3, 3.4**

- [ ] 9. Implement real-time balance subscriptions
  - [ ] 9.1 Create balance subscription service
    - Implement WebSocket or polling-based balance subscriptions
    - Add subscription management for active users
    - Create balance change notification system
    - _Requirements: 12.3_

  - [ ]* 9.2 Write property test for balance subscription processing
    - **Property 12: Balance subscription processing**
    - **Validates: Requirements 12.3**

  - [ ] 9.3 Integrate balance subscriptions in components
    - Add real-time balance updates to relevant components
    - Implement optimistic updates with rollback capability
    - Update loading states and error handling for subscriptions
    - _Requirements: 12.1, 12.2, 12.4_

- [ ] 10. Implement comprehensive error handling
  - [ ] 10.1 Add error handling for MNEE SDK operations
    - Implement user-friendly error messages for SDK failures
    - Add retry logic with exponential backoff for network issues
    - Create error recovery mechanisms for balance queries
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 10.2 Write property test for error handling consistency
    - **Property 13: Error handling consistency**
    - **Validates: Requirements 10.1, 10.3**

  - [ ] 10.3 Implement database consistency checks
    - Add balance reconciliation processes
    - Implement transaction rollback for failed operations
    - Create audit logging for all MNEE operations
    - _Requirements: 6.5, 11.3_

  - [ ]* 10.4 Write property test for database consistency after transfers
    - **Property 10: Database consistency after transfers**
    - **Validates: Requirements 6.5**

- [ ] 11. Final integration and cleanup
  - [ ] 11.1 Remove all SOL and Solana references
    - Clean up remaining SOL references in code and comments
    - Remove unused Solana-related imports and dependencies
    - Update configuration files and environment variables
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 11.2 Update transaction validation to use MNEE SDK
    - Implement transaction validation using MNEE SDK methods
    - Add validation for all transfer operations
    - Update transaction status tracking and monitoring
    - _Requirements: 2.4_

  - [ ]* 11.3 Write property test for transaction validation integration
    - **Property 4: Transaction validation integration**
    - **Validates: Requirements 2.4**

  - [ ] 11.3 Add performance optimizations
    - Implement balance caching with appropriate TTL
    - Add batch operations for multiple balance queries
    - Optimize real-time update performance
    - _Requirements: 3.1, 3.2_

- [ ] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.