# Requirements Document

## Introduction

This document outlines the requirements for enhancing the CryptoScore prediction market system with advanced features including football-data API integration, multiple predictions per user, automated resolution systems, and improved testing infrastructure. This enhancement builds upon the web2-migration foundation and transforms the platform into a more sophisticated sports prediction system with automated operations.

## Glossary

- **CryptoScore**: The enhanced prediction market platform for sports events
- **Football-Data API**: External API service providing real-time sports match data and statuses
- **Market Status**: The current state of a prediction market that mirrors match statuses from football-data API
- **Match ID**: Unique identifier from football-data API linking markets to specific sports matches
- **Multiple Predictions**: System allowing users to place up to 3 predictions per market (one per outcome)
- **Automated Resolution**: System that automatically resolves markets and distributes winnings without manual intervention
- **Mock Database**: Test database implementation that prevents tests from writing to production Supabase
- **Transaction Logging**: Automated system for recording all winnings transfers and platform operations
- **Home Team**: The team playing at their home venue in a sports match
- **Away Team**: The visiting team in a sports match
- **Outcome**: Possible result of a match (Home Win, Draw, Away Win)

## Requirements

### Requirement 1

**User Story:** As a platform administrator, I want market statuses to synchronize with football-data API match statuses, so that markets accurately reflect the real-world state of sports events.

#### Acceptance Criteria

1. WHEN a market is created THEN the system SHALL store the match_id from football-data API in the markets table
2. WHEN match status updates are received from football-data API THEN the system SHALL update the corresponding market_status field to match
3. WHEN the database schema is updated THEN the system SHALL replace custom market statuses with football-data API status values
4. WHEN market status queries are made THEN the system SHALL return statuses that directly correspond to match states (SCHEDULED, LIVE, FINISHED, POSTPONED, CANCELLED)
5. WHEN status synchronization occurs THEN the system SHALL maintain data consistency between external API and internal database

### Requirement 2

**User Story:** As a platform administrator, I want markets to store comprehensive match information, so that users can easily identify and understand the sports events they are predicting on.

#### Acceptance Criteria

1. WHEN a market is created THEN the system SHALL store the match_id from football-data API
2. WHEN match data is stored THEN the system SHALL include home_team_id and home_team_name from the API
3. WHEN match data is stored THEN the system SHALL include away_team_id and away_team_name from the API
4. WHEN markets are displayed THEN the system SHALL show team names and match information retrieved from the database
5. WHEN the database schema is updated THEN the system SHALL include foreign key relationships to ensure data integrity

### Requirement 3

**User Story:** As a user, I want to place multiple predictions on the same market, so that I can bet on different outcomes and maximize my potential winnings.

#### Acceptance Criteria

1. WHEN a user views a market THEN the system SHALL allow them to place up to 3 predictions (one for each possible outcome)
2. WHEN a user places a prediction THEN the system SHALL check that they haven't already predicted on that specific outcome
3. WHEN the database schema is updated THEN the system SHALL remove the unique constraint limiting one prediction per user per market
4. WHEN a user places multiple predictions THEN the system SHALL track each prediction separately with individual entry amounts
5. WHEN winnings are calculated THEN the system SHALL consider only the winning prediction(s) for each user

### Requirement 4

**User Story:** As a user, I want markets to be resolved automatically, so that I don't have to wait for manual intervention to receive my winnings.

#### Acceptance Criteria

1. WHEN a match finishes THEN the system SHALL automatically resolve the corresponding market based on the final result
2. WHEN market resolution occurs THEN the system SHALL calculate winnings for all winning predictions without manual intervention
3. WHEN winnings are calculated THEN the system SHALL automatically transfer amounts to winner accounts
4. WHEN resolution is complete THEN the system SHALL update market status to reflect the automated resolution
5. WHEN the resolution system operates THEN the system SHALL handle edge cases like cancelled or postponed matches

### Requirement 5

**User Story:** As a user, I want my winnings to be distributed automatically, so that I receive my rewards immediately when markets resolve.

#### Acceptance Criteria

1. WHEN a market resolves with winners THEN the system SHALL automatically calculate proportional winnings for each winning prediction
2. WHEN winnings are calculated THEN the system SHALL automatically transfer amounts to user accounts
3. WHEN market resolution occurs THEN the system SHALL automatically calculate and transfer creator rewards to the market creator
4. WHEN transfers occur THEN the system SHALL log each transaction with detailed information for user transparency
5. WHEN multiple predictions win THEN the system SHALL distribute winnings proportionally based on entry amounts
6. WHEN the distribution system operates THEN the system SHALL ensure all transfers (winnings and creator rewards) are completed successfully before marking resolution as complete

### Requirement 6

**User Story:** As a user, I want to see detailed transaction logs, so that I can verify that my winnings transfers are being processed correctly.

#### Acceptance Criteria

1. WHEN winnings are distributed THEN the system SHALL create detailed transaction records for each transfer
2. WHEN users view their transaction history THEN the system SHALL display all automated transfers with timestamps and amounts
3. WHEN transaction logging occurs THEN the system SHALL include market information, prediction details, and transfer status
4. WHEN platform fees are deducted THEN the system SHALL log fee transactions separately for transparency
5. WHEN users query transactions THEN the system SHALL provide real-time status updates on transfer processing

### Requirement 7

**User Story:** As a developer, I want tests to use mock databases, so that test execution doesn't interfere with production data or require live Supabase connections.

#### Acceptance Criteria

1. WHEN tests are executed THEN the system SHALL use a mock database implementation instead of connecting to Supabase
2. WHEN test data is created THEN the system SHALL store it in memory or temporary test databases
3. WHEN tests complete THEN the system SHALL clean up all test data without affecting production systems
4. WHEN the testing framework is configured THEN the system SHALL provide utilities for setting up mock data scenarios
5. WHEN integration tests run THEN the system SHALL simulate database operations without requiring external dependencies

### Requirement 8

**User Story:** As a developer, I want the application to handle multiple predictions throughout the codebase, so that all features work correctly with the new prediction model.

#### Acceptance Criteria

1. WHEN user interfaces are updated THEN the system SHALL display options for multiple predictions per market
2. WHEN API endpoints are modified THEN the system SHALL handle creation and retrieval of multiple predictions per user
3. WHEN validation logic is updated THEN the system SHALL enforce the 3-prediction limit per user per market
4. WHEN portfolio calculations are performed THEN the system SHALL aggregate multiple predictions correctly
5. WHEN real-time updates occur THEN the system SHALL broadcast changes for all user predictions in a market

### Requirement 9

**User Story:** As a platform administrator, I want manual resolution and withdrawal features removed, so that the system operates fully automatically without administrative overhead.

#### Acceptance Criteria

1. WHEN the codebase is updated THEN the system SHALL remove all manual market resolution interfaces and functions
2. WHEN user interfaces are modified THEN the system SHALL remove withdrawal buttons and manual payout options
3. WHEN API endpoints are cleaned up THEN the system SHALL remove manual resolution and withdrawal endpoints
4. WHEN database functions are updated THEN the system SHALL remove manual resolution stored procedures
5. WHEN the application operates THEN the system SHALL handle all market lifecycle events automatically

### Requirement 10

**User Story:** As a developer, I want comprehensive database schema updates, so that all new features are properly supported with appropriate data structures and relationships.

#### Acceptance Criteria

1. WHEN the markets table is updated THEN the system SHALL include match_id, home_team_id, home_team_name, away_team_id, and away_team_name columns
2. WHEN the participants table is modified THEN the system SHALL remove unique constraints that prevent multiple predictions per user
3. WHEN market_status enum is updated THEN the system SHALL include all football-data API status values
4. WHEN database migrations are created THEN the system SHALL safely transform existing data to the new schema
5. WHEN indexes are updated THEN the system SHALL optimize query performance for the new data structures