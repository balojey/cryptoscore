# Requirements Document

## Introduction

This document outlines the requirements for integrating MNEE tokens as the primary value exchange mechanism in CryptoScore, replacing the current SOL-based system and removing the multi-currency exchange rate conversion system. This integration will transform CryptoScore into a MNEE-native prediction market platform while maintaining all existing functionality and user experience patterns.

## Glossary

- **MNEE**: The BSV21 token that will serve as the primary value exchange mechanism on CryptoScore
- **BSV21**: Bitcoin SV token standard used by MNEE tokens
- **MNEE SDK**: The TypeScript SDK for interacting with MNEE tokens and blockchain operations
- **Atomic Units**: The smallest unit of MNEE tokens (1 MNEE = 100,000 atomic units)
- **EVM Wallet**: Ethereum Virtual Machine compatible wallet addresses stored for users via Crossmint
- **Exchange Rate Service**: The current system for converting SOL to fiat currencies that will be removed
- **Currency Context**: The React context managing currency display and conversion that will be simplified
- **Market Entry Fee**: The amount users pay in MNEE tokens to join prediction markets
- **Platform Fee**: The percentage-based fee collected in MNEE tokens from market transactions
- **Winnings Distribution**: The automated system for distributing MNEE tokens to market winners
- **MNEE Balance**: User's current MNEE token balance stored in the database
- **Token Transfer**: The process of moving MNEE tokens between user accounts

## Requirements

### Requirement 1

**User Story:** As a platform administrator, I want to replace SOL with MNEE as the primary currency, so that all market operations use MNEE tokens instead of SOL lamports.

#### Acceptance Criteria

1. WHEN users view market entry fees THEN the system SHALL display amounts in MNEE tokens instead of SOL
2. WHEN users join markets THEN the system SHALL deduct MNEE tokens from their balance instead of SOL
3. WHEN winnings are calculated THEN the system SHALL compute amounts in MNEE atomic units and display in MNEE tokens
4. WHEN platform fees are collected THEN the system SHALL deduct fees in MNEE tokens
5. WHEN user balances are displayed THEN the system SHALL show MNEE token amounts instead of SOL amounts

### Requirement 2

**User Story:** As a developer, I want to integrate the MNEE SDK, so that the application can perform MNEE token operations including balance queries, transfers, and transaction validation.

#### Acceptance Criteria

1. WHEN the application initializes THEN the system SHALL configure the MNEE SDK with appropriate environment and API key settings
2. WHEN user balances are needed THEN the system SHALL query MNEE balances using the SDK balance methods
3. WHEN token transfers are required THEN the system SHALL use MNEE SDK transfer methods for winnings distribution
4. WHEN transaction validation is needed THEN the system SHALL use MNEE SDK validation methods
5. WHEN the SDK is configured THEN the system SHALL handle both production and sandbox environments appropriately

### Requirement 3

**User Story:** As a user, I want my MNEE balance to be tracked accurately, so that I can see my current token holdings and transaction history.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL fetch and display their current MNEE balance from the blockchain
2. WHEN MNEE transactions occur THEN the system SHALL update the user's balance in real-time
3. WHEN users view their portfolio THEN the system SHALL show MNEE-based profit/loss calculations
4. WHEN transaction history is displayed THEN the system SHALL show MNEE token transfers with proper formatting
5. WHEN balance queries fail THEN the system SHALL handle errors gracefully and show cached balances when available

### Requirement 4

**User Story:** As a developer, I want to remove the exchange rate conversion system, so that the application no longer depends on external currency APIs or multi-currency display.

#### Acceptance Criteria

1. WHEN the application builds THEN the system SHALL NOT include the ExchangeRateService or related currency conversion code
2. WHEN users interact with the interface THEN the system SHALL NOT display currency selector options (USD, NGN)
3. WHEN market data is shown THEN the system SHALL display only MNEE amounts without currency conversion
4. WHEN the CurrencyContext is updated THEN the system SHALL remove exchange rate fetching and caching logic
5. WHEN localStorage is accessed THEN the system SHALL NOT store or retrieve exchange rate data

### Requirement 5

**User Story:** As a user, I want market operations to work seamlessly with MNEE tokens, so that creating, joining, and resolving markets uses MNEE as the value exchange mechanism.

#### Acceptance Criteria

1. WHEN users create markets THEN the system SHALL accept entry fees specified in MNEE tokens
2. WHEN users join markets THEN the system SHALL validate sufficient MNEE balance before allowing participation
3. WHEN markets resolve THEN the system SHALL distribute MNEE winnings to participants automatically
4. WHEN platform fees are calculated THEN the system SHALL compute fees as percentages of MNEE amounts
5. WHEN market data is stored THEN the system SHALL record all amounts in MNEE atomic units for precision

### Requirement 6

**User Story:** As a user, I want MNEE token transfers to be handled automatically, so that winnings distribution and fee collection occur without manual intervention.

#### Acceptance Criteria

1. WHEN markets resolve with winners THEN the system SHALL automatically transfer MNEE tokens to winning participants
2. WHEN platform fees are due THEN the system SHALL automatically transfer fee amounts to the platform fee address
3. WHEN creator rewards are distributed THEN the system SHALL automatically transfer MNEE tokens to market creators
4. WHEN transfers are initiated THEN the system SHALL use proper private key management for transaction signing
5. WHEN transfer operations complete THEN the system SHALL update database records to reflect new balances

### Requirement 7

**User Story:** As a developer, I want proper MNEE unit conversion throughout the application, so that atomic units are used for calculations while MNEE tokens are displayed to users.

#### Acceptance Criteria

1. WHEN amounts are stored in the database THEN the system SHALL use MNEE atomic units for precision
2. WHEN amounts are displayed to users THEN the system SHALL convert atomic units to MNEE tokens with appropriate decimal places
3. WHEN user input is processed THEN the system SHALL convert MNEE token amounts to atomic units for calculations
4. WHEN SDK operations are performed THEN the system SHALL use atomic units for blockchain transactions
5. WHEN formatting functions are used THEN the system SHALL display MNEE amounts with consistent decimal precision

### Requirement 8

**User Story:** As a user, I want MNEE wallet integration to work with my existing EVM wallet address, so that my tokens are associated with my Crossmint-created wallet.

#### Acceptance Criteria

1. WHEN users authenticate via Crossmint THEN the system SHALL use their EVM wallet address for MNEE operations
2. WHEN MNEE balances are queried THEN the system SHALL use the user's EVM wallet address as the account identifier
3. WHEN token transfers are initiated THEN the system SHALL use the appropriate private key for the user's EVM wallet
4. WHEN wallet addresses are displayed THEN the system SHALL show the user's EVM address in MNEE-compatible format
5. WHEN user profiles are created THEN the system SHALL store EVM wallet addresses for MNEE token operations

### Requirement 9

**User Story:** As a developer, I want to update all currency-related components and hooks, so that they work with MNEE tokens instead of SOL and remove multi-currency support.

#### Acceptance Criteria

1. WHEN the CurrencyContext is refactored THEN the system SHALL remove exchange rate management and focus on MNEE formatting
2. WHEN currency-related hooks are updated THEN the system SHALL provide MNEE balance queries and formatting functions
3. WHEN UI components are modified THEN the system SHALL display MNEE symbols and amounts instead of SOL
4. WHEN formatting functions are called THEN the system SHALL format MNEE amounts with appropriate precision and symbols
5. WHEN currency selectors are removed THEN the system SHALL eliminate all multi-currency UI elements

### Requirement 10

**User Story:** As a platform administrator, I want comprehensive error handling for MNEE operations, so that token transfer failures and balance query errors are handled gracefully.

#### Acceptance Criteria

1. WHEN MNEE SDK operations fail THEN the system SHALL display user-friendly error messages
2. WHEN balance queries timeout THEN the system SHALL show cached balances and retry mechanisms
3. WHEN token transfers fail THEN the system SHALL log detailed error information and notify users appropriately
4. WHEN network connectivity issues occur THEN the system SHALL handle offline scenarios gracefully
5. WHEN API rate limits are exceeded THEN the system SHALL implement proper retry logic with exponential backoff

### Requirement 11

**User Story:** As a developer, I want to maintain database compatibility, so that existing market and user data continues to work with MNEE token amounts.

#### Acceptance Criteria

1. WHEN existing market data is accessed THEN the system SHALL interpret stored amounts as MNEE atomic units
2. WHEN user balances are migrated THEN the system SHALL convert any existing SOL references to MNEE equivalents
3. WHEN database queries are performed THEN the system SHALL handle MNEE amounts with appropriate precision
4. WHEN new records are created THEN the system SHALL store MNEE amounts in atomic units consistently
5. WHEN data validation occurs THEN the system SHALL ensure MNEE amounts are within valid ranges

### Requirement 12

**User Story:** As a user, I want real-time MNEE balance updates, so that my token balance reflects the latest transactions immediately.

#### Acceptance Criteria

1. WHEN MNEE transactions are broadcast THEN the system SHALL update user balances in real-time
2. WHEN market operations complete THEN the system SHALL refresh affected user balances automatically
3. WHEN balance subscriptions are active THEN the system SHALL receive and process balance change notifications
4. WHEN multiple users participate in markets THEN the system SHALL update all participant balances simultaneously
5. WHEN balance updates fail THEN the system SHALL retry balance queries and show loading states appropriately