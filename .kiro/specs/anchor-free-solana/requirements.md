# Requirements Document

## Introduction

This document outlines the requirements for removing the Anchor framework dependency from the CryptoScore Solana frontend integration. The goal is to build Solana transactions from scratch using native Solana web3.js and related packages, eliminating reliance on Anchor's client-side libraries while maintaining full functionality with the existing Solana programs.

## Glossary

- **Anchor Framework**: Rust-based framework for Solana program development with client-side TypeScript libraries
- **Solana Web3.js**: Core JavaScript library for interacting with Solana blockchain
- **Transaction**: Atomic unit of work on Solana containing one or more instructions
- **Instruction**: Single operation to be executed by a Solana program
- **Account Meta**: Metadata describing accounts required by an instruction (writable, signer, etc.)
- **Borsh**: Binary serialization format used by Solana programs for instruction data
- **Program ID**: Public key identifying a deployed Solana program
- **IDL (Interface Definition Language)**: JSON file describing program structure, accounts, and instructions
- **Frontend Application**: React-based user interface in solana/app/
- **Transaction Builder**: Custom utility for constructing Solana transactions without Anchor
- **Instruction Encoder**: Utility for encoding instruction data using Borsh serialization
- **Account Decoder**: Utility for deserializing account data from on-chain state

## Requirements

### Requirement 1

**User Story:** As a developer, I want to remove all Anchor client dependencies from the frontend, so that the application is lighter and has fewer third-party dependencies.

#### Acceptance Criteria

1. THE Frontend Application SHALL remove @coral-xyz/anchor from package.json dependencies
2. THE Frontend Application SHALL remove @coral-xyz/borsh if it was added as an Anchor dependency
3. THE Frontend Application SHALL add @solana/web3.js as the primary Solana interaction library
4. THE Frontend Application SHALL add borsh for instruction data serialization
5. THE Frontend Application SHALL add @solana/buffer-layout or @solana/buffer-layout-utils for account data deserialization

### Requirement 2

**User Story:** As a developer, I want to manually construct transaction instructions, so that I have full control over transaction building without Anchor abstractions.

#### Acceptance Criteria

1. THE Frontend Application SHALL implement a TransactionBuilder utility class for constructing transactions
2. THE TransactionBuilder SHALL provide methods for adding instructions with proper account metas
3. THE TransactionBuilder SHALL support setting compute budget and priority fees
4. THE TransactionBuilder SHALL validate instruction data before transaction submission
5. THE TransactionBuilder SHALL return properly formatted Transaction objects compatible with wallet adapters

### Requirement 3

**User Story:** As a developer, I want to encode instruction data using Borsh serialization, so that program instructions receive correctly formatted data.

#### Acceptance Criteria

1. THE Frontend Application SHALL implement instruction data schemas using Borsh serialization
2. THE Instruction Encoder SHALL define schemas for all program instructions (create_market, join_market, resolve_market, withdraw)
3. THE Instruction Encoder SHALL serialize instruction parameters into Buffer format
4. THE Instruction Encoder SHALL include discriminator bytes for instruction identification
5. THE Instruction Encoder SHALL validate parameter types before serialization

### Requirement 4

**User Story:** As a developer, I want to decode account data from on-chain state, so that I can display market and participant information without Anchor.

#### Acceptance Criteria

1. THE Frontend Application SHALL implement account data schemas for all program accounts (Factory, Market, Participant, UserStats)
2. THE Account Decoder SHALL deserialize account data using Borsh or buffer-layout
3. THE Account Decoder SHALL handle account discriminators for type identification
4. THE Account Decoder SHALL convert raw account data into TypeScript interfaces
5. THE Account Decoder SHALL handle missing or invalid account data gracefully

### Requirement 5

**User Story:** As a developer, I want to derive Program Derived Addresses (PDAs) manually, so that I can locate program accounts without Anchor utilities.

#### Acceptance Criteria

1. THE Frontend Application SHALL implement PDA derivation functions for all program PDAs
2. THE PDA Utilities SHALL derive Factory PDA using program ID and "factory" seed
3. THE PDA Utilities SHALL derive Market PDA using factory address, "market" seed, and match ID
4. THE PDA Utilities SHALL derive Participant PDA using market address, "participant" seed, and user public key
5. THE PDA Utilities SHALL return both the PDA public key and bump seed

### Requirement 6

**User Story:** As a user, I want to create prediction markets, so that I can set up new betting opportunities on football matches.

#### Acceptance Criteria

1. WHEN a user submits the create market form, THE Frontend Application SHALL construct a create_market instruction with encoded parameters
2. THE create_market Instruction SHALL include proper account metas for factory, market, creator, and system program
3. THE create_market Instruction SHALL encode match ID, entry fee, kickoff time, end time, and visibility into instruction data
4. WHEN the transaction is submitted, THE Frontend Application SHALL handle transaction confirmation and display success/error messages
5. THE Frontend Application SHALL emit transaction signature and provide Solana Explorer link

### Requirement 7

**User Story:** As a user, I want to join prediction markets with my prediction choice, so that I can participate in betting.

#### Acceptance Criteria

1. WHEN a user selects a prediction and clicks join, THE Frontend Application SHALL construct a join_market instruction with encoded prediction
2. THE join_market Instruction SHALL include proper account metas for market, participant, user, and system program
3. THE join_market Instruction SHALL encode prediction choice (HOME/DRAW/AWAY) into instruction data
4. THE join_market Instruction SHALL handle SOL transfer for entry fee payment
5. WHEN the transaction is confirmed, THE Frontend Application SHALL update UI to show joined status

### Requirement 8

**User Story:** As a market creator or authorized resolver, I want to resolve markets with match outcomes, so that winners can be determined.

#### Acceptance Criteria

1. WHEN an authorized user submits resolution, THE Frontend Application SHALL construct a resolve_market instruction with outcome data
2. THE resolve_market Instruction SHALL include proper account metas for market and resolver
3. THE resolve_market Instruction SHALL encode match outcome (HOME/DRAW/AWAY) into instruction data
4. WHEN the transaction is confirmed, THE Frontend Application SHALL update market status to Resolved
5. THE Frontend Application SHALL display winner count and pool distribution information

### Requirement 9

**User Story:** As a winning participant, I want to withdraw my rewards, so that I can claim my earnings.

#### Acceptance Criteria

1. WHEN a winner clicks withdraw, THE Frontend Application SHALL construct a withdraw instruction
2. THE withdraw Instruction SHALL include proper account metas for market, participant, user, and system program
3. THE withdraw Instruction SHALL handle SOL transfer from market account to user wallet
4. WHEN the transaction is confirmed, THE Frontend Application SHALL mark participant as withdrawn
5. THE Frontend Application SHALL display withdrawal amount and transaction signature

### Requirement 10

**User Story:** As a developer, I want to fetch and decode market data from on-chain accounts, so that I can display market information in the UI.

#### Acceptance Criteria

1. THE Frontend Application SHALL fetch market account data using Connection.getAccountInfo
2. THE Frontend Application SHALL decode market data into Market interface with all fields
3. THE Frontend Application SHALL fetch multiple market accounts efficiently using Connection.getMultipleAccountsInfo
4. THE Frontend Application SHALL handle account not found errors gracefully
5. THE Frontend Application SHALL cache decoded account data with appropriate invalidation

### Requirement 11

**User Story:** As a developer, I want to fetch and decode participant data, so that I can display user predictions and withdrawal status.

#### Acceptance Criteria

1. THE Frontend Application SHALL derive participant PDA for the connected user and market
2. THE Frontend Application SHALL fetch participant account data using Connection.getAccountInfo
3. THE Frontend Application SHALL decode participant data into Participant interface
4. THE Frontend Application SHALL handle cases where participant account does not exist (user hasn't joined)
5. THE Frontend Application SHALL display prediction choice and withdrawal status in UI

### Requirement 12

**User Story:** As a developer, I want to subscribe to account changes using WebSocket, so that the UI updates in real-time without Anchor.

#### Acceptance Criteria

1. THE Frontend Application SHALL use Connection.onAccountChange for subscribing to market account updates
2. THE Frontend Application SHALL decode updated account data when changes are detected
3. THE Frontend Application SHALL invalidate React Query cache when account data changes
4. THE Frontend Application SHALL handle WebSocket disconnections and reconnections
5. THE Frontend Application SHALL unsubscribe from account changes when components unmount

### Requirement 13

**User Story:** As a developer, I want to handle transaction errors properly, so that users receive clear feedback on failures.

#### Acceptance Criteria

1. THE Frontend Application SHALL parse transaction error codes from Solana error responses
2. THE Frontend Application SHALL map program error codes to user-friendly error messages
3. THE Frontend Application SHALL display specific error messages for common failures (insufficient funds, already participated, etc.)
4. THE Frontend Application SHALL log full error details to console for debugging
5. THE Frontend Application SHALL provide retry functionality for failed transactions

### Requirement 14

**User Story:** As a developer, I want to estimate transaction fees before submission, so that users know the cost upfront.

#### Acceptance Criteria

1. THE Frontend Application SHALL use Connection.getFeeForMessage to estimate transaction fees
2. THE Frontend Application SHALL display estimated fee in SOL before transaction confirmation
3. THE Frontend Application SHALL include compute budget instructions when necessary
4. THE Frontend Application SHALL handle fee estimation failures gracefully
5. THE Frontend Application SHALL update fee estimates when network conditions change

### Requirement 15

**User Story:** As a developer, I want comprehensive TypeScript types for all program interactions, so that the codebase is type-safe without Anchor-generated types.

#### Acceptance Criteria

1. THE Frontend Application SHALL define TypeScript interfaces for all account structures (Factory, Market, Participant, UserStats)
2. THE Frontend Application SHALL define TypeScript types for all instruction parameters
3. THE Frontend Application SHALL define enums for MarketStatus and MatchOutcome
4. THE Frontend Application SHALL use strict TypeScript types for all Borsh schemas
5. THE Frontend Application SHALL export all types from a central types file

### Requirement 16

**User Story:** As a developer, I want utility functions for common Solana operations, so that I can avoid repetitive code.

#### Acceptance Criteria

1. THE Frontend Application SHALL provide utility for converting lamports to SOL and vice versa
2. THE Frontend Application SHALL provide utility for formatting public keys for display
3. THE Frontend Application SHALL provide utility for confirming transactions with retry logic
4. THE Frontend Application SHALL provide utility for fetching recent blockhash
5. THE Frontend Application SHALL provide utility for simulating transactions before submission

### Requirement 17

**User Story:** As a developer, I want to maintain the same UI/UX experience, so that removing Anchor doesn't affect the user interface.

#### Acceptance Criteria

1. THE Frontend Application SHALL maintain all existing React components without modification
2. THE Frontend Application SHALL maintain all existing hooks interfaces (useMarketData, useMarketActions)
3. THE Frontend Application SHALL maintain identical loading states and error handling patterns
4. THE Frontend Application SHALL maintain transaction confirmation flows and toast notifications
5. THE Frontend Application SHALL maintain performance characteristics (no degradation from Anchor removal)

### Requirement 18

**User Story:** As a developer, I want clear documentation on the Anchor-free architecture, so that other developers can understand and maintain the code.

#### Acceptance Criteria

1. THE Frontend Application SHALL include README documentation explaining the Anchor-free approach
2. THE Documentation SHALL provide examples of constructing each instruction type
3. THE Documentation SHALL explain Borsh serialization schemas for all instructions
4. THE Documentation SHALL document PDA derivation logic for all account types
5. THE Documentation SHALL include troubleshooting guide for common issues
