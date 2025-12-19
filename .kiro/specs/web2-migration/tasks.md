# Implementation Plan

- [x] 1. Set up Supabase project and database schema
  - Initialize new Supabase project for the application
  - Create database tables (users, markets, participants, transactions, platform_config)
  - Set up proper indexes and constraints for performance
  - Configure Row Level Security (RLS) policies for data protection
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 1.1 Write property test for database schema validation
  - **Property 1: Database Schema Completeness**
  - **Validates: Requirements 5.1**

- [ ] 2. Update Crossmint configuration for EVM wallets
  - Modify Crossmint configuration to use EVM chain instead of Solana
  - Update wallet creation to use EVM addresses (0x format)
  - Test EVM wallet creation and address validation
  - _Requirements: 2.2, 9.1, 9.4_

- [x] 2.1 Write property test for EVM wallet creation
  - **Property 3: EVM Wallet Creation**
  - **Validates: Requirements 2.2**

- [ ] 3. Create Supabase client configuration and service layer
  - Set up Supabase client configuration with environment variables
  - Create database service classes (UserService, MarketService, etc.)
  - Implement CRUD operations for all entities
  - Add proper error handling and type safety
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.1 Write property test for database operations
  - **Property 2: Database Storage Consistency**
  - **Validates: Requirements 1.2, 3.1, 3.2, 3.3**

- [ ] 4. Implement user authentication and profile management
  - Update authentication flow to work with Supabase user storage
  - Create user profile creation/update logic
  - Implement session management without Supabase Auth
  - Store EVM wallet addresses in user profiles
  - _Requirements: 2.1, 2.4, 2.5_

- [ ] 4.1 Write property test for authentication data persistence
  - **Property 4: Authentication Data Persistence**
  - **Validates: Requirements 2.5**

- [ ] 5. Migrate market creation functionality
  - Replace Solana factory program calls with Supabase database inserts
  - Maintain same market creation form and validation logic
  - Update market data structure to match database schema
  - Implement market status management
  - _Requirements: 4.1, 4.2_

- [ ] 5.1 Write property test for market data consistency
  - **Property 5: Market Data Consistency**
  - **Validates: Requirements 4.1**

- [ ] 6. Migrate market participation functionality
  - Replace blockchain transactions with database operations for joining markets
  - Implement participant tracking in database
  - Update prediction submission logic
  - Maintain same user experience for market participation
  - _Requirements: 4.3_

- [ ] 7. Implement market resolution and winnings calculation
  - Migrate winnings calculation logic from blockchain to database functions
  - Implement market resolution workflow with database updates
  - Maintain same fee structure and calculation methods
  - Update user balance tracking in database
  - _Requirements: 4.4, 8.1, 8.2, 8.3_

- [ ] 7.1 Write property test for winnings calculation preservation
  - **Property 7: Winnings Calculation Preservation**
  - **Validates: Requirements 4.4**

- [ ] 7.2 Write property test for fee structure consistency
  - **Property 8: Fee Structure Consistency**
  - **Validates: Requirements 8.1, 8.3**

- [ ] 8. Set up Supabase real-time subscriptions
  - Replace Solana WebSocket connections with Supabase real-time
  - Implement real-time market updates and participant notifications
  - Update hooks to use Supabase subscriptions
  - Optimize subscription patterns for performance
  - _Requirements: 3.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8.1 Write property test for real-time update source
  - **Property 6: Real-time Update Source**
  - **Validates: Requirements 3.5, 6.1**

- [ ] 9. Update portfolio and dashboard functionality
  - Migrate dashboard data aggregation to Supabase queries
  - Update portfolio calculations to use database data
  - Maintain same metrics and display logic (P&L, win rate, etc.)
  - Implement efficient queries with proper indexing
  - _Requirements: 4.5, 10.1_

- [ ] 10. Remove Solana dependencies and clean up codebase
  - Uninstall all @solana packages from package.json
  - Remove Solana configuration files (solana.ts, programs.ts)
  - Delete Anchor IDL files and related imports
  - Clean up environment variables and build configuration
  - Remove all Solana-related utility functions and hooks
  - _Requirements: 1.3, 1.4, 1.5, 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10.1 Write property test for Solana connection elimination
  - **Property 1: Solana Connection Elimination**
  - **Validates: Requirements 1.1**

- [ ] 10.2 Write property test for bundle size reduction
  - **Property 9: Bundle Size Reduction**
  - **Validates: Requirements 10.3**

- [ ] 11. Update environment configuration and deployment
  - Create new environment variables for Supabase configuration
  - Update deployment scripts to remove Solana-related steps
  - Configure production Supabase project settings
  - Update documentation and README files
  - _Requirements: 1.4, 7.3_

- [ ] 12. Implement performance optimizations
  - Add TanStack Query caching for Supabase responses
  - Optimize database queries and real-time subscriptions
  - Implement proper loading states and error boundaries
  - Test and validate performance improvements
  - _Requirements: 10.1, 10.2, 10.4, 10.5_

- [ ] 12.1 Write property test for response time improvement
  - **Property 10: Response Time Improvement**
  - **Validates: Requirements 10.4**

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Update TypeScript types and interfaces
  - Generate TypeScript types from Supabase schema
  - Update all interfaces to match new database structure
  - Remove Solana-specific types and replace with Supabase equivalents
  - Ensure type safety across the entire application
  - _Requirements: 5.2, 5.3, 5.4_

- [ ] 15. Test complete migration and user workflows
  - Test end-to-end user workflows (auth, market creation, participation, resolution)
  - Validate that all original features work with Supabase backend
  - Test real-time functionality and performance
  - Verify complete removal of Solana dependencies
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 15.1 Write integration tests for complete user workflows
  - Test authentication → market creation → participation → resolution flow
  - Verify data consistency throughout the entire process
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 16. Final Checkpoint - Complete migration validation
  - Ensure all tests pass, ask the user if questions arise.