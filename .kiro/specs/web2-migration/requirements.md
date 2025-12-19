# Requirements Document

## Introduction

This document outlines the requirements for migrating CryptoScore from a Solana-based web3 decentralized application to a web2 application using Supabase as the backend database and API layer. The migration will replace Solana blockchain functionality with traditional database operations while maintaining the core prediction market features. Crossmint will continue to provide authentication services but will create EVM wallets instead of Solana wallets for future MNEE token integration.

## Glossary

- **CryptoScore**: The prediction market platform being migrated
- **Supabase**: PostgreSQL-based backend-as-a-service platform that will replace Solana programs
- **Crossmint**: Authentication and wallet service provider
- **EVM Wallet**: Ethereum Virtual Machine compatible wallet for future MNEE token integration
- **MNEE**: Future token to be integrated as the platform's value exchange mechanism
- **Market**: A prediction market where users can place bets on sports events
- **Factory**: Market creation and registry management functionality
- **Dashboard**: Data aggregation and analytics functionality
- **Participant**: A user who has joined and placed predictions in a market

## Requirements

### Requirement 1

**User Story:** As a platform administrator, I want to remove all Solana blockchain dependencies, so that the application operates as a traditional web2 application with database persistence.

#### Acceptance Criteria

1. WHEN the application starts THEN the system SHALL NOT attempt to connect to any Solana RPC endpoints
2. WHEN a user interacts with markets THEN the system SHALL store all data in Supabase database tables instead of blockchain accounts
3. WHEN the application builds THEN the system SHALL NOT include any Solana-related dependencies in the bundle
4. WHEN environment variables are configured THEN the system SHALL NOT require any Solana program IDs or RPC URLs
5. WHEN the codebase is analyzed THEN the system SHALL contain no references to @solana packages or Anchor framework

### Requirement 2

**User Story:** As a user, I want to authenticate using Crossmint social login with EVM wallet creation, so that I can access the platform and prepare for future MNEE token integration.

#### Acceptance Criteria

1. WHEN a user chooses to authenticate THEN the system SHALL present Crossmint social login options (Google, email OTP)
2. WHEN a user completes authentication THEN the system SHALL create an EVM wallet instead of a Solana wallet
3. WHEN a user's wallet is created THEN the system SHALL store the wallet address in the Supabase user profile
4. WHEN authentication is configured THEN the system SHALL NOT use Supabase Auth but rely solely on Crossmint
5. WHEN a user logs in THEN the system SHALL create or update their profile record in the Supabase database

### Requirement 3

**User Story:** As a developer, I want Supabase to replace all Solana program functionality, so that market operations are handled through database transactions instead of blockchain transactions.

#### Acceptance Criteria

1. WHEN market data is needed THEN the system SHALL query Supabase tables instead of blockchain accounts
2. WHEN a user creates a market THEN the system SHALL insert records into Supabase instead of calling factory program instructions
3. WHEN a user joins a market THEN the system SHALL update database records instead of executing blockchain transactions
4. WHEN market resolution occurs THEN the system SHALL calculate and update winnings in the database
5. WHEN real-time updates are needed THEN the system SHALL use Supabase real-time subscriptions instead of WebSocket connections to Solana

### Requirement 4

**User Story:** As a user, I want all market functionality to work identically to the current system, so that the migration is transparent and maintains the same user experience.

#### Acceptance Criteria

1. WHEN a user creates a market THEN the system SHALL collect the same information (title, description, entry fee, end time) and store it in Supabase
2. WHEN a user views markets THEN the system SHALL display the same market information retrieved from Supabase tables
3. WHEN a user joins a market THEN the system SHALL record their participation and prediction in the database
4. WHEN a market resolves THEN the system SHALL calculate winnings using the same logic and update user balances in Supabase
5. WHEN users view their portfolio THEN the system SHALL aggregate data from Supabase to show the same metrics (P&L, win rate, active markets)

### Requirement 5

**User Story:** As a developer, I want to establish a proper Supabase database schema, so that all market and user data is properly structured and queryable.

#### Acceptance Criteria

1. WHEN the database is initialized THEN the system SHALL create tables for users, markets, participants, and transactions
2. WHEN user data is stored THEN the system SHALL include profile information and EVM wallet address
3. WHEN market data is stored THEN the system SHALL include all market metadata, status, and resolution information
4. WHEN participant data is stored THEN the system SHALL track user predictions, entry amounts, and winnings
5. WHEN the schema is designed THEN the system SHALL support efficient queries for dashboard analytics and real-time updates

### Requirement 6

**User Story:** As a user, I want real-time updates to continue working, so that I can see live market changes and participant activity.

#### Acceptance Criteria

1. WHEN market data changes THEN the system SHALL broadcast updates using Supabase real-time subscriptions
2. WHEN a user joins a market THEN the system SHALL notify other participants through real-time channels
3. WHEN market status changes THEN the system SHALL update all connected clients immediately
4. WHEN the application loads THEN the system SHALL establish real-time subscriptions for relevant data
5. WHEN users navigate between pages THEN the system SHALL maintain appropriate real-time connections

### Requirement 7

**User Story:** As a developer, I want to clean up all Solana-related configuration and code, so that the codebase is maintainable and focused on the new web2 architecture.

#### Acceptance Criteria

1. WHEN Solana dependencies are removed THEN the system SHALL uninstall all @solana packages from package.json
2. WHEN configuration files are updated THEN the system SHALL remove solana.ts, programs.ts, and related config files
3. WHEN environment variables are cleaned THEN the system SHALL remove all Solana RPC URLs and program IDs
4. WHEN the build system is updated THEN the system SHALL remove Anchor IDL files and related build steps
5. WHEN code is refactored THEN the system SHALL replace all Solana-specific utilities with Supabase equivalents

### Requirement 8

**User Story:** As a platform operator, I want fee calculation and platform economics to work the same way, so that the business model remains intact during the migration.

#### Acceptance Criteria

1. WHEN platform fees are calculated THEN the system SHALL use the same percentage-based fee structure stored in Supabase configuration
2. WHEN market entry fees are collected THEN the system SHALL track fee amounts in database records instead of token transfers
3. WHEN winnings are distributed THEN the system SHALL deduct platform fees and update user balances accordingly
4. WHEN fee configuration changes THEN the system SHALL update database settings without requiring code deployment
5. WHEN financial reporting is needed THEN the system SHALL aggregate fee data from Supabase transaction records

### Requirement 9

**User Story:** As a developer, I want to prepare the system for future MNEE token integration, so that the EVM wallet infrastructure supports token operations when MNEE is added.

#### Acceptance Criteria

1. WHEN EVM wallets are created THEN the system SHALL store wallet addresses in a format compatible with ERC-20 token operations
2. WHEN user balances are tracked THEN the system SHALL use decimal precision suitable for token amounts
3. WHEN the database schema is designed THEN the system SHALL include fields that will support token transaction history
4. WHEN wallet integration is implemented THEN the system SHALL use Crossmint's EVM wallet capabilities
5. WHEN the architecture is planned THEN the system SHALL allow for easy addition of token transfer functionality

### Requirement 10

**User Story:** As a user, I want the application performance to remain fast and responsive, so that the migration to web2 architecture provides a smooth user experience.

#### Acceptance Criteria

1. WHEN data is loaded THEN the system SHALL use efficient Supabase queries with appropriate indexing
2. WHEN real-time updates occur THEN the system SHALL minimize database load through optimized subscription patterns
3. WHEN the application builds THEN the system SHALL have a smaller bundle size due to removed Solana dependencies
4. WHEN users interact with markets THEN the system SHALL provide immediate feedback without blockchain confirmation delays
5. WHEN caching is implemented THEN the system SHALL use TanStack Query to cache Supabase responses appropriately