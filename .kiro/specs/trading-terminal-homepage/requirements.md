# Requirements Document

## Introduction

This feature transforms CryptoScore's homepage into a professional trading terminal interface similar to TradingView and WooFi Pro, while moving the existing market list to a dedicated `/markets` route. The trading terminal will provide users with a comprehensive dashboard for monitoring markets, analyzing trends, and making informed predictions in a trader-focused environment.

## Glossary

- **Trading Terminal**: A professional interface displaying real-time market data, charts, and analytics in a multi-panel layout
- **CryptoScore Application**: The prediction markets platform for football matches
- **Market List Component**: The existing homepage component showing all available prediction markets
- **Route**: A URL path in the React application (e.g., `/`, `/markets`, `/markets/:id`)
- **Panel**: A distinct section of the trading terminal interface (e.g., chart panel, order book panel)
- **Real-Time Data**: Market information that updates automatically via polling or websockets

## Requirements

### Requirement 1

**User Story:** As a trader, I want to access the full market list at `/markets`, so that I can browse all available prediction markets in the familiar interface

#### Acceptance Criteria

1. WHEN a user navigates to `/markets`, THE CryptoScore Application SHALL display the current homepage content with all market cards
2. THE CryptoScore Application SHALL maintain all existing filtering, sorting, and search functionality at the `/markets` route
3. THE CryptoScore Application SHALL update the header navigation to include a "Markets" link pointing to `/markets`
4. THE CryptoScore Application SHALL preserve all virtual scrolling and performance optimizations at the `/markets` route

### Requirement 2

**User Story:** As a trader, I want the homepage (`/`) to display a trading terminal interface, so that I can monitor markets and analyze data like professional trading platforms

#### Acceptance Criteria

1. WHEN a user navigates to `/`, THE CryptoScore Application SHALL display a trading terminal layout with multiple panels
2. THE CryptoScore Application SHALL render the trading terminal interface using the current theme system with all 6 theme presets
3. THE CryptoScore Application SHALL maintain responsive design principles with mobile-first approach
4. THE CryptoScore Application SHALL ensure the trading terminal is accessible with keyboard navigation and screen reader support

### Requirement 3

**User Story:** As a trader, I want to see key market metrics at a glance, so that I can quickly assess market conditions without navigating away from the homepage

#### Acceptance Criteria

1. THE CryptoScore Application SHALL display total markets count on the trading terminal
2. THE CryptoScore Application SHALL display total value locked across all markets on the trading terminal
3. THE CryptoScore Application SHALL display active traders count on the trading terminal
4. THE CryptoScore Application SHALL update these metrics in real-time using the existing polling mechanism

### Requirement 4

**User Story:** As a trader, I want to view market data visualizations on the homepage, so that I can analyze trends and make informed predictions

#### Acceptance Criteria

1. THE CryptoScore Application SHALL display at least one primary chart visualization on the trading terminal
2. THE CryptoScore Application SHALL allow users to interact with chart visualizations (zoom, pan, hover for details)
3. THE CryptoScore Application SHALL render charts using the existing Recharts library
4. THE CryptoScore Application SHALL apply theme-aware colors to all chart elements

### Requirement 5

**User Story:** As a trader, I want to see featured or trending markets on the homepage, so that I can quickly access high-activity markets

#### Acceptance Criteria

1. THE CryptoScore Application SHALL display a list of featured markets on the trading terminal
2. THE CryptoScore Application SHALL determine featured markets based on pool size, participant count, or ending time
3. THE CryptoScore Application SHALL allow users to click on featured markets to navigate to market detail pages
4. THE CryptoScore Application SHALL limit the featured markets list to a reasonable number (5-10 markets)

### Requirement 6

**User Story:** As a trader, I want the trading terminal to update automatically, so that I see current market data without manual refreshing

#### Acceptance Criteria

1. THE CryptoScore Application SHALL poll for market data updates at 10-second intervals on the trading terminal
2. THE CryptoScore Application SHALL use the existing `useRealtimeMarkets` hook for automatic updates
3. THE CryptoScore Application SHALL display toast notifications for significant market events
4. THE CryptoScore Application SHALL animate number changes using the existing `AnimatedNumber` component

### Requirement 7

**User Story:** As a user, I want clear navigation between the trading terminal and markets list, so that I can easily switch between overview and detailed browsing

#### Acceptance Criteria

1. THE CryptoScore Application SHALL display a "View All Markets" button or link on the trading terminal
2. THE CryptoScore Application SHALL update the header navigation to distinguish between "Home" and "Markets"
3. WHEN a user clicks "Home" in the header, THE CryptoScore Application SHALL navigate to `/`
4. WHEN a user clicks "Markets" in the header, THE CryptoScore Application SHALL navigate to `/markets`

### Requirement 8

**User Story:** As a developer, I want the routing changes to be backward compatible, so that existing links and bookmarks continue to work

#### Acceptance Criteria

1. THE CryptoScore Application SHALL maintain all existing routes (`/markets/:id`, `/dashboard`, `/leaderboard`)
2. THE CryptoScore Application SHALL not break any existing navigation flows
3. THE CryptoScore Application SHALL update the lazy loading configuration for the new `/markets` route
4. THE CryptoScore Application SHALL ensure all route transitions use proper loading states
