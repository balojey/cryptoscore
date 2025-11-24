# Landing Page - Design Document

## Overview

This design creates a compelling, conversion-focused landing page for CryptoScore that serves as the new homepage. The landing page showcases the platform's unique value proposition as a decentralized sports prediction market, emphasizing transparency, low fees, and community-driven predictions. The design follows a modern, professional aesthetic consistent with the existing theme system while optimizing for user engagement and conversion.

## Architecture

### Route Structure

```
/ (root)                    → LandingPage component (NEW)
/markets                    → Content component (MOVED from /)
/terminal                   → TradingTerminal component (existing)
/dashboard                  → Dashboard component (existing)
/markets/:marketAddress     → MarketDetail component (existing)
/leaderboard                → Leaderboard component (existing)
```

### Component Hierarchy

```
App
├── Header (updated with Home/Markets/Terminal links)
├── Routes
│   ├── / → LandingPage (NEW)
│   │   ├── HeroSection
│   │   ├── LiveMetrics
│   │   ├── HowItWorks
│   │   ├── KeyFeatures
│   │   ├── FeaturedMarkets
│   │   ├── WhyCryptoScore
│   │   └── FinalCTA
│   ├── /markets → Content (MOVED)
│   └── ... (other routes)
└── Footer
```

## Components and Interfaces

### 1. LandingPage Component

**Location:** `src/pages/LandingPage.tsx`

**Purpose:** Main container for the landing page with all sections

**Structure:**
- Full-width sections with max-width containers
- Smooth scroll behavior between sections
- Lazy loading for below-the-fold content
- Intersection Observer for scroll animations

**Props:** None (route component)

**State:**
- `isVisible`: Track section visibility for animations
- `metrics`: Platform statistics from contract


### 2. HeroSection Component

**Location:** `src/components/landing/HeroSection.tsx`

**Purpose:** Capture attention and communicate core value proposition

**Layout:**
```
┌─────────────────────────────────────────────┐
│                                             │
│         Predict. Compete. Win.              │
│                                             │
│   Decentralized Sports Prediction Markets   │
│   Built on Polkadot. Powered by Community. │
│                                             │
│   [Explore Markets]  [View Terminal]        │
│                                             │
│         [Animated Visual/Illustration]      │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**
- Bold, attention-grabbing headline (48-64px font size)
- Concise 2-sentence value proposition
- Dual CTAs: Primary (Explore Markets) + Secondary (View Terminal)
- Animated background or illustration (sports theme)
- Gradient text effects using design system colors
- Scroll indicator at bottom

**Visual Elements:**
- Animated football/stadium illustration
- Floating prediction cards (subtle animation)
- Gradient overlay with theme colors
- Glassmorphism effects on CTA buttons

### 3. LiveMetrics Component

**Location:** `src/components/landing/LiveMetrics.tsx`

**Purpose:** Build trust through real-time platform statistics

**Metrics Display:**
```tsx
<div className="metrics-grid">
  <MetricCard
    value={totalMarkets}
    label="Active Markets"
    icon="mdi--chart-box-outline"
    color="cyan"
  />
  <MetricCard
    value={formatPAS(tvl)}
    label="Total Value Locked"
    icon="mdi--safe-square-outline"
    color="green"
  />
  <MetricCard
    value={activeTraders}
    label="Active Traders"
    icon="mdi--account-group-outline"
    color="purple"
  />
  <MetricCard
    value={marketsResolved}
    label="Markets Resolved"
    icon="mdi--check-circle-outline"
    color="amber"
  />
</div>
```

**Features:**
- 4-column grid (responsive: 2 cols tablet, 1 col mobile)
- AnimatedNumber components for smooth transitions
- Real-time updates via useReadContract hook
- Pulsing glow effect on update
- Loading skeletons during fetch


### 4. HowItWorks Component

**Location:** `src/components/landing/HowItWorks.tsx`

**Purpose:** Explain the user journey in 3 simple steps

**Steps:**

1. **Browse Markets**
   - Icon: `mdi--magnify`
   - Description: "Explore prediction markets for upcoming football matches across major leagues"
   
2. **Make Your Prediction**
   - Icon: `mdi--target`
   - Description: "Choose your outcome (HOME/DRAW/AWAY) and stake your entry fee"
   
3. **Win Rewards**
   - Icon: `mdi--trophy-outline`
   - Description: "Correct predictions split the pool. Winners get paid automatically on-chain"

**Layout:**
```
┌──────────────────────────────────────────────┐
│           How It Works                       │
│                                              │
│   [1]          [2]          [3]              │
│  Browse      Predict       Win               │
│  Markets     Outcome      Rewards            │
│                                              │
│  [Icon]      [Icon]       [Icon]             │
│  [Text]      [Text]       [Text]             │
│                                              │
│         ──────────────────────>              │
│         (Progress Arrow)                     │
└──────────────────────────────────────────────┘
```

**Features:**
- Horizontal step flow with connecting arrows
- Large icons (64px) with theme colors
- Step numbers with circular badges
- Hover effects revealing more details
- Mobile: Vertical stack with downward arrows

### 5. KeyFeatures Component

**Location:** `src/components/landing/KeyFeatures.tsx`

**Purpose:** Highlight platform differentiators

**Features List:**

1. **Fully Decentralized**
   - Icon: `mdi--shield-check-outline`
   - Description: "No intermediaries. Your funds are secured by smart contracts on Polkadot"

2. **Transparent & Fair**
   - Icon: `mdi--eye-outline`
   - Description: "All predictions and outcomes are recorded on-chain. Verifiable by anyone"

3. **Low Fees**
   - Icon: `mdi--cash-multiple`
   - Description: "Only 2% platform fee (1% creator, 1% protocol). No hidden charges"

4. **Real-Time Updates**
   - Icon: `mdi--lightning-bolt-outline`
   - Description: "Live market data, instant notifications, and automatic payouts"

5. **Community Driven**
   - Icon: `mdi--account-group`
   - Description: "Create your own markets, share predictions, and compete on leaderboards"

6. **Multi-Theme Experience**
   - Icon: `mdi--palette-outline`
   - Description: "6 professionally designed themes. Switch instantly to match your style"

**Layout:**
- 3-column grid (desktop)
- 2-column grid (tablet)
- 1-column stack (mobile)
- Card-based design with hover lift effects
- Icons with gradient backgrounds


### 6. FeaturedMarketsPreview Component

**Location:** `src/components/landing/FeaturedMarketsPreview.tsx`

**Purpose:** Showcase active markets to demonstrate platform activity

**Selection Criteria:**
- Top 3 markets by pool size
- Top 2 markets ending soon (< 24 hours)
- 1 recently created market

**Layout:**
```tsx
<section className="featured-markets-preview">
  <div className="section-header">
    <h2>Live Markets</h2>
    <p>Join thousands of traders predicting match outcomes</p>
  </div>
  
  <div className="markets-grid">
    {featuredMarkets.map(market => (
      <CompactMarketCard
        key={market.marketAddress}
        market={market}
        showBadge={true}
      />
    ))}
  </div>
  
  <Link to="/markets" className="view-all-cta">
    View All Markets →
  </Link>
</section>
```

**CompactMarketCard:**
- Match info (teams, league, time)
- Pool size and participant count
- Prediction distribution (mini bars)
- Status badge (Live, Ending Soon, Hot)
- Click to navigate to market detail

**Features:**
- Horizontal scroll on mobile
- 3-column grid on desktop
- Hover effects with glow
- Real-time data updates

### 7. WhyCryptoScore Component

**Location:** `src/components/landing/WhyCryptoScore.tsx`

**Purpose:** Compare benefits vs traditional betting platforms

**Comparison Points:**

| Traditional Betting | CryptoScore |
|---------------------|-------------|
| Centralized control | Decentralized & trustless |
| Hidden odds manipulation | Transparent on-chain odds |
| High fees (5-10%) | Low fees (2%) |
| Delayed payouts | Instant automatic payouts |
| Limited transparency | Full blockchain verification |
| Account restrictions | Permissionless access |

**Layout:**
```
┌──────────────────────────────────────────────┐
│     Why Choose CryptoScore?                  │
│                                              │
│  ✓ No Intermediaries                         │
│    Your funds, your control. Smart contracts │
│    handle everything automatically.          │
│                                              │
│  ✓ Transparent Odds                          │
│    See exactly how pools are distributed.    │
│    No hidden manipulation.                   │
│                                              │
│  ✓ Lower Fees                                │
│    2% total fee vs 5-10% on traditional      │
│    platforms. More winnings for you.         │
│                                              │
│  ✓ Instant Payouts                           │
│    Winners get paid automatically when       │
│    markets resolve. No waiting.              │
│                                              │
│  ✓ Community Powered                         │
│    Create markets, share predictions,        │
│    compete on leaderboards.                  │
└──────────────────────────────────────────────┘
```

**Features:**
- Checkmark icons with theme colors
- Expandable details on hover/click
- Animated entrance on scroll
- Comparison table (optional)


### 8. FinalCTA Component

**Location:** `src/components/landing/FinalCTA.tsx`

**Purpose:** Convert visitors with strong call-to-action

**Layout:**
```
┌──────────────────────────────────────────────┐
│                                              │
│      Ready to Start Winning?                 │
│                                              │
│   Join the future of sports predictions      │
│                                              │
│   [Explore Markets]  [Connect Wallet]        │
│                                              │
└──────────────────────────────────────────────┘
```

**Features:**
- Bold headline with gradient text
- Dual CTAs (Explore Markets + Connect Wallet)
- Subtle animated background
- Glassmorphism card effect
- Full-width section with centered content

## Data Models

### LandingMetrics Interface

```typescript
interface LandingMetrics {
  totalMarkets: number
  totalValueLocked: bigint
  activeTraders: number
  marketsResolved: number
  volume24h?: bigint
}
```

### FeatureItem Interface

```typescript
interface FeatureItem {
  icon: string // Iconify icon name
  title: string
  description: string
  color: 'cyan' | 'green' | 'purple' | 'amber' | 'red'
}
```

### HowItWorksStep Interface

```typescript
interface HowItWorksStep {
  number: number
  icon: string
  title: string
  description: string
}
```

## Error Handling

### Contract Read Failures
- Show cached metrics with "Last updated" timestamp
- Display placeholder values (0) with loading state
- Retry button for manual refetch
- Graceful degradation (hide metrics section if unavailable)

### Featured Markets Loading
- Show loading skeletons (3 cards)
- Fallback to empty state with CTA to create market
- Error message: "Unable to load markets. Please try again."

### Network Errors
- Display error banner at top of page
- Allow users to continue browsing static content
- Retry mechanism with exponential backoff

## Testing Strategy

### Unit Tests
- HeroSection: Verify CTAs navigate correctly
- LiveMetrics: Test metric calculations and formatting
- HowItWorks: Verify step rendering and content
- KeyFeatures: Test feature list rendering
- FeaturedMarketsPreview: Test market selection algorithm

### Integration Tests
- LandingPage: Verify data fetching and real-time updates
- Navigation: Test routing to /markets and /terminal
- Theme switching: Verify all components respect theme variables
- Responsive: Test layout across breakpoints

### Accessibility Tests
- Keyboard navigation: Tab through all CTAs and links
- Screen reader: Verify ARIA labels and semantic HTML
- Color contrast: Test all themes meet WCAG AA standards
- Focus indicators: Verify visible focus states

### Performance Tests
- Initial load time: < 2 seconds on 3G
- Largest Contentful Paint (LCP): < 2.5 seconds
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1


## Design System Integration

### Color Usage

**Hero Section:**
- Background: `var(--bg-primary)` with gradient overlay
- Headline: `var(--text-primary)` with gradient effect
- Tagline: `var(--text-secondary)`
- Primary CTA: `var(--accent-cyan)` background
- Secondary CTA: `var(--bg-elevated)` with border

**Metrics:**
- Card background: `var(--bg-elevated)`
- Metric values: `var(--text-primary)` with `font-mono`
- Labels: `var(--text-tertiary)`
- Icons: Theme-specific accent colors

**Features:**
- Card background: `var(--bg-secondary)`
- Hover: `var(--bg-hover)`
- Icons: Gradient backgrounds with accent colors
- Text: `var(--text-primary)` and `var(--text-secondary)`

**CTAs:**
- Primary: `var(--accent-cyan)` with `var(--text-inverse)`
- Secondary: `var(--bg-elevated)` with `var(--accent-cyan)` border
- Hover: Glow effects with `var(--accent-cyan-glow)`

### Typography

**Headlines:**
- Hero: `font-display text-5xl md:text-6xl font-bold`
- Section titles: `font-display text-3xl md:text-4xl font-bold`
- Subsections: `font-display text-xl md:text-2xl font-semibold`

**Body:**
- Taglines: `font-primary text-lg md:text-xl`
- Descriptions: `font-primary text-base`
- Labels: `font-primary text-sm`
- Metrics: `font-mono text-3xl md:text-4xl font-bold`

### Spacing

**Sections:**
- Vertical spacing: `py-16 md:py-24 lg:py-32`
- Section gaps: `space-y-16 md:space-y-24`
- Container padding: `px-4 sm:px-6 lg:px-8`

**Components:**
- Card padding: `p-6 md:p-8`
- Grid gaps: `gap-6 md:gap-8`
- Button padding: `px-6 py-3` (large), `px-4 py-2` (medium)

### Shadows & Effects

**Elevation:**
- Hero cards: `shadow-2xl`
- Feature cards: `shadow-lg` with hover to `shadow-2xl`
- Metric cards: `shadow-md`

**Glows:**
- Primary CTAs: `glow-cyan` on hover
- Live indicators: `glow-green` with pulse
- Featured badges: `glow-amber`

**Glassmorphism:**
- Hero overlay: `backdrop-blur-md` with `bg-opacity-80`
- CTA cards: `backdrop-blur-sm` with `bg-opacity-90`

### Animations

**Entrance Animations:**
```css
.hero-content {
  animation: fade-in 0.8s ease-out;
}

.metric-card {
  animation: slide-in-up 0.6s ease-out;
  animation-delay: calc(var(--index) * 0.1s);
}

.feature-card {
  animation: scale-in 0.5s ease-out;
  animation-delay: calc(var(--index) * 0.1s);
}
```

**Scroll Animations:**
- Fade in on scroll using Intersection Observer
- Stagger children animations (0.1s delay per item)
- Parallax effect on hero background (subtle)

**Hover Effects:**
- Lift: `transform: translateY(-4px)`
- Glow: `box-shadow: 0 0 20px var(--accent-cyan-glow)`
- Scale: `transform: scale(1.02)`


## Responsive Design

### Desktop (≥1024px)
```
┌─────────────────────────────────────────────┐
│ Header (Home | Markets | Terminal)          │
├─────────────────────────────────────────────┤
│                                             │
│           HERO SECTION                      │
│     [Headline + CTAs + Visual]              │
│                                             │
├─────────────────────────────────────────────┤
│     LIVE METRICS (4 columns)                │
├─────────────────────────────────────────────┤
│     HOW IT WORKS (3 steps horizontal)       │
├─────────────────────────────────────────────┤
│     KEY FEATURES (3 columns)                │
├─────────────────────────────────────────────┤
│     FEATURED MARKETS (3 columns)            │
├─────────────────────────────────────────────┤
│     WHY CRYPTOSCORE (2 columns)             │
├─────────────────────────────────────────────┤
│     FINAL CTA (centered)                    │
├─────────────────────────────────────────────┤
│ Footer                                      │
└─────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌───────────────────────────────┐
│ Header                        │
├───────────────────────────────┤
│ HERO SECTION                  │
│ (Stacked content)             │
├───────────────────────────────┤
│ LIVE METRICS (2 columns)      │
├───────────────────────────────┤
│ HOW IT WORKS (3 steps)        │
├───────────────────────────────┤
│ KEY FEATURES (2 columns)      │
├───────────────────────────────┤
│ FEATURED MARKETS (2 columns)  │
├───────────────────────────────┤
│ WHY CRYPTOSCORE (1 column)    │
├───────────────────────────────┤
│ FINAL CTA                     │
├───────────────────────────────┤
│ Footer                        │
└───────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────┐
│ Header          │
├─────────────────┤
│ HERO            │
│ (Vertical)      │
├─────────────────┤
│ METRICS         │
│ (1 column)      │
├─────────────────┤
│ HOW IT WORKS    │
│ (Vertical)      │
├─────────────────┤
│ FEATURES        │
│ (1 column)      │
├─────────────────┤
│ MARKETS         │
│ (Horizontal     │
│  scroll)        │
├─────────────────┤
│ WHY             │
│ CRYPTOSCORE     │
├─────────────────┤
│ FINAL CTA       │
├─────────────────┤
│ Footer          │
└─────────────────┘
```

## Performance Optimizations

### Code Splitting
- Lazy load LandingPage component
- Lazy load FeaturedMarketsPreview (below fold)
- Separate chunk for landing-specific components
- Estimated bundle: ~20KB (gzipped)

### Image Optimization
- Use WebP format with fallbacks
- Lazy load images below the fold
- Responsive images with srcset
- Compress hero visuals (< 100KB)

### Data Fetching
- Prefetch metrics on page load
- Cache featured markets (5 minutes)
- Debounce scroll animations (100ms)
- Use React Query for caching

### Rendering
- Memoize metric cards with React.memo
- Use Intersection Observer for scroll animations
- Throttle scroll events (100ms)
- Virtual scrolling for featured markets (if >20)

## Migration Plan

### Phase 1: Component Creation
1. Create LandingPage component structure
2. Build HeroSection with static content
3. Build HowItWorks with static steps
4. Test responsive layout

### Phase 2: Data Integration
1. Implement LiveMetrics with contract data
2. Build FeaturedMarketsPreview with selection logic
3. Connect real-time updates
4. Test data fetching and caching

### Phase 3: Polish & Features
1. Build KeyFeatures section
2. Build WhyCryptoScore section
3. Build FinalCTA section
4. Add scroll animations

### Phase 4: Routing Migration
1. Move Content component to /markets route
2. Update Header navigation links
3. Update all internal links
4. Test navigation flows

### Phase 5: Testing & Launch
1. Test all 6 themes
2. Accessibility audit
3. Performance profiling
4. Cross-browser testing
5. Deploy to production

## Accessibility Considerations

### Semantic HTML
```tsx
<main role="main" aria-label="CryptoScore Landing Page">
  <section aria-labelledby="hero-heading">
    <h1 id="hero-heading">Predict. Compete. Win.</h1>
  </section>
  
  <section aria-labelledby="metrics-heading">
    <h2 id="metrics-heading">Platform Statistics</h2>
  </section>
  
  <section aria-labelledby="how-it-works-heading">
    <h2 id="how-it-works-heading">How It Works</h2>
  </section>
</main>
```

### ARIA Labels
- CTAs: `aria-label="Explore prediction markets"`
- Metrics: `aria-label="Total value locked: 1,234 PAS"`
- Features: `aria-describedby="feature-description"`
- Navigation: `aria-current="page"` for active links

### Keyboard Navigation
- Tab order: Hero CTAs → Metrics → Features → Markets → Final CTA
- Enter/Space: Activate all buttons and links
- Skip links: "Skip to markets", "Skip to features"

### Screen Reader Support
- Alt text for all images and icons
- Descriptive link text (avoid "Click here")
- Announce dynamic content updates
- Provide text alternatives for visual elements

## Summary

The landing page design creates a compelling first impression for CryptoScore visitors by clearly communicating the platform's value proposition, demonstrating its features, and providing multiple conversion paths. The design leverages the existing theme system, design tokens, and component library to maintain consistency while introducing new landing-specific components. The responsive, accessible, and performant design ensures a positive experience across all devices and user contexts, ultimately driving user engagement and platform adoption.
