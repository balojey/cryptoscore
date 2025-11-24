# Requirements Document

## Introduction

This feature creates a compelling landing page for CryptoScore that serves as the new homepage (`/`), showcasing the platform's value proposition to potential users. The landing page will highlight key features, demonstrate how the platform works, display live metrics, and provide clear calls-to-action for both new and returning users. The existing market browsing interface will move to `/markets`, while the trading terminal remains at `/terminal`.

## Glossary

- **Landing Page**: The new homepage at `/` designed to convert visitors into active users
- **CryptoScore Platform**: The decentralized sports prediction markets platform built on Polkadot
- **Value Proposition**: The unique benefits and features that differentiate CryptoScore from traditional betting platforms
- **Call-to-Action (CTA)**: Interactive elements that guide users to take specific actions (explore markets, create predictions, etc.)
- **Hero Section**: The prominent first section of the landing page with headline and primary CTA
- **Social Proof**: Evidence of platform credibility through metrics, testimonials, or user activity
- **Unauthenticated User**: A visitor who has not connected their wallet to the platform

## Requirements

### Requirement 1

**User Story:** As a first-time visitor, I want to immediately understand what CryptoScore offers, so that I can decide if the platform is right for me

#### Acceptance Criteria

1. WHEN a user navigates to `/`, THE CryptoScore Platform SHALL display a hero section with a clear headline describing the platform's purpose
2. THE CryptoScore Platform SHALL display a concise tagline or description (maximum 2 sentences) explaining the core value proposition
3. THE CryptoScore Platform SHALL include a prominent primary CTA button in the hero section linking to `/markets` or `/terminal`
4. THE CryptoScore Platform SHALL display a hero visual (illustration, animation, or background) that reinforces the sports prediction theme

### Requirement 2

**User Story:** As a potential user, I want to understand how the platform works, so that I can feel confident using it

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL display a "How It Works" section with 3-4 steps explaining the user journey
2. THE CryptoScore Platform SHALL illustrate each step with an icon and brief description (maximum 20 words per step)
3. THE CryptoScore Platform SHALL present the steps in a logical flow: Browse Markets → Make Prediction → Win Rewards
4. THE CryptoScore Platform SHALL use theme-aware colors and icons consistent with the design system

### Requirement 3

**User Story:** As a visitor, I want to see the platform's key features, so that I understand what makes it unique

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL display a features section highlighting 4-6 key differentiators
2. THE CryptoScore Platform SHALL include features such as: decentralized architecture, transparent on-chain resolution, low fees, real-time updates, multiple themes, and social features
3. THE CryptoScore Platform SHALL present each feature with an icon, title, and description (maximum 30 words)
4. THE CryptoScore Platform SHALL use a responsive grid layout (3 columns desktop, 2 columns tablet, 1 column mobile)

### Requirement 4

**User Story:** As a visitor, I want to see live platform statistics, so that I can verify the platform is active and trustworthy

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL display real-time metrics including: total markets, total value locked, active traders, and markets resolved
2. THE CryptoScore Platform SHALL fetch metrics from the CryptoScoreDashboard contract
3. THE CryptoScore Platform SHALL use AnimatedNumber components for smooth metric transitions
4. THE CryptoScore Platform SHALL update metrics automatically using the existing polling mechanism

### Requirement 5

**User Story:** As a visitor, I want to see examples of active markets, so that I can preview the platform's content without committing

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL display 3-6 featured markets on the landing page
2. THE CryptoScore Platform SHALL select featured markets based on pool size, participant count, or ending time
3. THE CryptoScore Platform SHALL allow users to click on featured markets to view details
4. THE CryptoScore Platform SHALL include a "View All Markets" CTA linking to `/markets`

### Requirement 6

**User Story:** As a visitor, I want to understand the benefits of using CryptoScore over traditional betting platforms, so that I can make an informed choice

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL display a comparison or benefits section highlighting advantages over traditional platforms
2. THE CryptoScore Platform SHALL emphasize benefits such as: no intermediaries, transparent odds, instant payouts, lower fees, and community-driven
3. THE CryptoScore Platform SHALL present benefits in a visually appealing format (cards, icons, or comparison table)
4. THE CryptoScore Platform SHALL use persuasive but accurate language

### Requirement 7

**User Story:** As a visitor, I want to access the platform's main features from the landing page, so that I can start exploring immediately

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL include multiple CTAs throughout the landing page (hero, features, bottom)
2. THE CryptoScore Platform SHALL provide CTAs for: "Explore Markets", "View Terminal", "Create Market", and "Connect Wallet"
3. WHEN a user clicks "Explore Markets", THE CryptoScore Platform SHALL navigate to `/markets`
4. WHEN a user clicks "View Terminal", THE CryptoScore Platform SHALL navigate to `/terminal`

### Requirement 8

**User Story:** As a returning user, I want quick access to markets and terminal, so that I don't have to navigate through the landing page every time

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL update the header navigation to include "Home", "Markets", "Terminal", and "Leaderboard" links
2. WHEN a user clicks "Home" in the header, THE CryptoScore Platform SHALL navigate to `/`
3. WHEN a user clicks "Markets" in the header, THE CryptoScore Platform SHALL navigate to `/markets`
4. THE CryptoScore Platform SHALL maintain all existing navigation functionality

### Requirement 9

**User Story:** As a visitor, I want the landing page to work on all devices, so that I can access it from mobile, tablet, or desktop

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL render the landing page responsively across all breakpoints (mobile, tablet, desktop)
2. THE CryptoScore Platform SHALL maintain readability and usability on screens as small as 320px width
3. THE CryptoScore Platform SHALL optimize images and animations for mobile performance
4. THE CryptoScore Platform SHALL ensure touch-friendly interactive elements (minimum 44px tap targets)

### Requirement 10

**User Story:** As a visitor, I want the landing page to be accessible, so that all users can understand and navigate it

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL use semantic HTML with proper heading hierarchy (h1, h2, h3)
2. THE CryptoScore Platform SHALL include ARIA labels for all interactive elements
3. THE CryptoScore Platform SHALL maintain WCAG AA color contrast standards across all 6 themes
4. THE CryptoScore Platform SHALL support full keyboard navigation for all CTAs and links

### Requirement 11

**User Story:** As a visitor, I want the landing page to load quickly, so that I don't abandon the site due to slow performance

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL load the landing page in under 2 seconds on 3G connections
2. THE CryptoScore Platform SHALL lazy load images and heavy components below the fold
3. THE CryptoScore Platform SHALL minimize initial bundle size by code splitting
4. THE CryptoScore Platform SHALL use loading skeletons for async data (metrics, featured markets)

### Requirement 12

**User Story:** As a visitor using any theme, I want the landing page to look visually appealing, so that I have a positive first impression

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL render the landing page correctly in all 6 theme presets
2. THE CryptoScore Platform SHALL use CSS variables for all colors to ensure theme compatibility
3. THE CryptoScore Platform SHALL apply theme-specific shadows and effects appropriately
4. THE CryptoScore Platform SHALL test visual consistency across all themes before deployment

### Requirement 13

**User Story:** As a visitor, I want to see social proof or credibility indicators, so that I trust the platform

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL display platform statistics as social proof (total markets, TVL, active users)
2. THE CryptoScore Platform SHALL optionally include a "Recent Activity" feed showing live platform activity
3. THE CryptoScore Platform SHALL display blockchain/network information (Polkadot Asset Hub) as a trust indicator
4. THE CryptoScore Platform SHALL use authentic data rather than placeholder or fake metrics

### Requirement 14

**User Story:** As a developer, I want the routing changes to be backward compatible, so that existing links and bookmarks continue to work

#### Acceptance Criteria

1. THE CryptoScore Platform SHALL move the existing Content component from `/` to `/markets`
2. THE CryptoScore Platform SHALL maintain all existing routes (`/terminal`, `/markets/:id`, `/dashboard`, `/leaderboard`)
3. THE CryptoScore Platform SHALL update all internal links to reflect the new routing structure
4. THE CryptoScore Platform SHALL ensure no broken links or navigation flows after migration
