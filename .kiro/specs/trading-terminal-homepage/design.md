# Trading Terminal Homepage - Design Document

## Overview

This design transforms CryptoScore's homepage into a professional trading terminal interface inspired by TradingView and WooFi Pro. The terminal provides traders with a comprehensive dashboard featuring real-time market data, analytics, and quick access to high-value markets. The existing market list functionality moves to a dedicated `/markets` route, creating a clear separation between overview (terminal) and detailed browsing (markets page).

## Architecture

### Route Structure

```
/ (root)                    → TradingTerminal component (NEW)
/markets                    → Content component (MOVED from /)
/dashboard                  → Dashboard component (existing)
/markets/:marketAddress      → MarketDetail component (existing)
/leaderboard                → Leaderboard component (existing)
```

### Component Hierarchy

```
App
├── Header (updated with Markets link)
├── Routes
│   ├── / → TradingTerminal (NEW)
│   │   ├── TerminalHeader
│   │   ├── MetricsBar
│   │   ├── MainPanel
│   │   │   ├── MarketOverviewChart
│   │   │   └── FeaturedMarkets
│   │   └── SidePanel
│   │       ├── TopMovers
│   │       └── RecentActivity
│   ├── /markets → Content (MOVED)
│   └── ... (other routes)
└── Footer
```

## Components and Interfaces

### 1. TradingTerminal Component

**Location:** `src/pages/TradingTerminal.tsx`

**Purpose:** Main container for the trading terminal interface

**Layout:**
- Full-width responsive grid layout
- Desktop: 2-column layout (70% main panel, 30% side panel)
- Tablet: Single column with stacked panels
- Mobile: Vertical stack with collapsible sections

**Props:** None (route component)

**State:**
- `selectedTimeframe`: '24h' | '7d' | '30d' | 'all'
- `selectedMetric`: 'tvl' | 'volume' | 'participants'

**Hooks:**
- `useRealtimeMarkets()` - 10-second polling
- `useReadContract()` - Fetch dashboard data
- `useNavigate()` - Navigation to markets/detail pages

### 2. TerminalHeader Component

**Location:** `src/components/terminal/TerminalHeader.tsx`

**Purpose:** Terminal title and quick actions

**Structure:**
```tsx
<div className="terminal-header">
  <div className="title-section">
    <h1>Trading Terminal</h1>
    <span className="live-indicator">● LIVE</span>
  </div>
  <div className="actions">
    <TimeframeSelector />
    <Link to="/markets">View All Markets →</Link>
  </div>
</div>
```

**Features:**
- Pulsing live indicator (green dot with animation)
- Timeframe selector (24h, 7d, 30d, All Time)
- Prominent "View All Markets" CTA button

### 3. MetricsBar Component

**Location:** `src/components/terminal/MetricsBar.tsx`

**Purpose:** Display key platform metrics at a glance

**Metrics:**
1. **Total Markets** - Count of all markets
2. **Total Value Locked** - Sum of all pool sizes
3. **Active Traders** - Unique participants count
4. **24h Volume** - Trading volume in last 24h

**Structure:**
```tsx
<div className="metrics-bar">
  <MetricCard
    label="Total Markets"
    value={totalMarkets}
    icon="mdi--chart-box-outline"
    trend="+12%"
  />
  <MetricCard
    label="Total Value Locked"
    value={formatPAS(tvl)}
    icon="mdi--safe-square-outline"
    trend="+8.5%"
  />
  <MetricCard
    label="Active Traders"
    value={activeTraders}
    icon="mdi--account-group-outline"
    trend="+15%"
  />
  <MetricCard
    label="24h Volume"
    value={formatPAS(volume24h)}
    icon="mdi--trending-up"
    trend="+23%"
  />
</div>
```

**Features:**
- AnimatedNumber component for smooth transitions
- Trend indicators (up/down arrows with percentages)
- Theme-aware colors (cyan for primary, green for positive trends)
- Responsive grid (4 columns → 2 columns → 1 column)

### 4. MarketOverviewChart Component

**Location:** `src/components/terminal/MarketOverviewChart.tsx`

**Purpose:** Primary data visualization for market trends

**Chart Types:**
1. **TVL Over Time** (default) - Line chart showing total value locked
2. **Market Volume** - Bar chart showing daily volume
3. **Participant Growth** - Area chart showing cumulative participants

**Structure:**
```tsx
<div className="chart-container">
  <div className="chart-header">
    <h3>Market Overview</h3>
    <ChartTypeSelector />
  </div>
  <ResponsiveContainer width="100%" height={400}>
    <LineChart data={chartData}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
      <XAxis dataKey="date" stroke="var(--text-tertiary)" />
      <YAxis stroke="var(--text-tertiary)" />
      <Tooltip content={<CustomTooltip />} />
      <Line
        type="monotone"
        dataKey="value"
        stroke="var(--accent-cyan)"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
</div>
```

**Features:**
- Recharts library for visualizations
- Theme-aware colors using CSS variables
- Interactive tooltips with formatted values
- Responsive height (400px desktop, 300px mobile)
- Loading skeleton during data fetch

### 5. FeaturedMarkets Component

**Location:** `src/components/terminal/FeaturedMarkets.tsx`

**Purpose:** Showcase high-value or trending markets

**Selection Criteria:**
1. Highest pool size (top 3)
2. Ending soon (< 24 hours, top 2)
3. Most participants (top 2)

**Structure:**
```tsx
<div className="featured-markets">
  <h3>Featured Markets</h3>
  <div className="market-list">
    {featuredMarkets.map(market => (
      <FeaturedMarketCard
        key={market.marketAddress}
        market={market}
        badge={getBadge(market)} // "🔥 Hot", "⏰ Ending Soon", "👥 Popular"
      />
    ))}
  </div>
  <Link to="/markets" className="view-all-link">
    View All Markets →
  </Link>
</div>
```

**FeaturedMarketCard:**
- Compact horizontal layout
- Match info (teams, competition)
- Pool size and participant count
- Status badge (Hot, Ending Soon, Popular)
- Click to navigate to market detail

### 6. TopMovers Component

**Location:** `src/components/terminal/TopMovers.tsx`

**Purpose:** Display markets with significant recent activity

**Metrics:**
- Largest pool size increase (last 24h)
- Most new participants (last 24h)
- Highest prediction shift (HOME/AWAY/DRAW distribution change)

**Structure:**
```tsx
<div className="top-movers">
  <h3>Top Movers</h3>
  <div className="mover-list">
    {topMovers.map(market => (
      <MoverCard
        key={market.marketAddress}
        market={market}
        change={market.change}
        metric={market.metric}
      />
    ))}
  </div>
</div>
```

**MoverCard:**
- Team names (abbreviated)
- Change indicator (+45% pool, +12 participants)
- Mini prediction distribution bar
- Green/red color coding for changes

### 7. RecentActivity Component (Enhanced)

**Location:** `src/components/terminal/RecentActivity.tsx` (reuse existing)

**Purpose:** Live feed of platform activity

**Enhancements:**
- Limit to 10 most recent activities
- Add activity type icons (join, create, resolve, withdraw)
- Add relative timestamps ("2m ago", "1h ago")
- Auto-scroll to top on new activity

## Data Models

### TerminalMetrics Interface

```typescript
interface TerminalMetrics {
  totalMarkets: number
  totalValueLocked: bigint
  activeTraders: number
  volume24h: bigint
  marketsCreated24h: number
  marketsResolved24h: number
}
```

### ChartDataPoint Interface

```typescript
interface ChartDataPoint {
  date: string // ISO date or timestamp
  value: number // Metric value (TVL, volume, participants)
  label?: string // Optional label for tooltip
}
```

### FeaturedMarket Interface

```typescript
interface FeaturedMarket extends Market {
  badge: 'hot' | 'ending-soon' | 'popular'
  badgeLabel: string
  matchInfo?: Match // Optional match data from API
}
```

### TopMover Interface

```typescript
interface TopMover {
  market: Market
  change: number // Percentage or absolute change
  metric: 'pool' | 'participants' | 'distribution'
  direction: 'up' | 'down'
}
```

## Error Handling

### Network Errors
- Display error banner at top of terminal
- Show cached data with "Last updated" timestamp
- Retry button to manually trigger refetch
- Graceful degradation (show partial data if available)

### Contract Read Failures
- Fallback to empty state with helpful message
- "Unable to load market data. Please check your connection."
- Link to status page or support

### API Rate Limits (Football-Data.org)
- Cache match data aggressively (1 hour TTL)
- Show generic match info if API unavailable
- Rotate API keys using existing utility

### Empty States
- No markets: "No markets available. Be the first to create one!"
- No featured markets: Show placeholder cards with "Coming soon"
- No activity: "No recent activity. Markets will appear here."

## Testing Strategy

### Unit Tests
- MetricsBar: Verify metric calculations and formatting
- MarketOverviewChart: Test chart data transformation
- FeaturedMarkets: Test selection algorithm (highest pool, ending soon, etc.)
- TopMovers: Test change calculations and sorting

### Integration Tests
- TradingTerminal: Verify data fetching and real-time updates
- Navigation: Test routing between terminal and markets page
- Theme switching: Verify all components respect theme variables

### Accessibility Tests
- Keyboard navigation: Tab through all interactive elements
- Screen reader: Verify ARIA labels and semantic HTML
- Color contrast: Test all themes meet WCAG AA standards
- Reduced motion: Verify animations respect user preferences

### Performance Tests
- Initial load time: < 2 seconds on 3G
- Chart rendering: < 500ms for 100 data points
- Real-time updates: No UI jank during polling
- Memory usage: No leaks during extended sessions

### Visual Regression Tests
- Screenshot comparison across all 6 themes
- Responsive layout verification (mobile, tablet, desktop)
- Chart rendering consistency

## Design System Integration

### Color Usage

**Backgrounds:**
- Terminal container: `var(--bg-primary)`
- Panels: `var(--bg-elevated)`
- Cards: `var(--bg-secondary)` with hover to `var(--bg-hover)`

**Accents:**
- Primary actions: `var(--accent-cyan)`
- Positive trends: `var(--accent-green)`
- Negative trends: `var(--accent-red)`
- Warnings: `var(--accent-amber)`
- Live indicator: `var(--accent-green)` with pulse animation

**Text:**
- Headings: `var(--text-primary)`
- Body: `var(--text-secondary)`
- Labels: `var(--text-tertiary)`
- Disabled: `var(--text-disabled)`

### Typography

**Headings:**
- Terminal title: `font-display text-3xl font-bold`
- Section titles: `font-display text-xl font-semibold`
- Card titles: `font-primary text-base font-medium`

**Body:**
- Metrics: `font-mono text-2xl font-bold` (for numbers)
- Labels: `font-primary text-sm`
- Descriptions: `font-primary text-base`

### Spacing

**Layout:**
- Terminal padding: `p-6` (desktop), `p-4` (mobile)
- Panel gaps: `gap-6`
- Card gaps: `gap-4`
- Section spacing: `space-y-8`

**Components:**
- Metric cards: `p-4`
- Featured market cards: `p-3`
- Chart container: `p-6`

### Shadows

**Elevation:**
- Panels: `shadow-lg`
- Cards: `shadow-md` with hover to `shadow-xl`
- Metrics bar: `shadow-sm`

**Glows:**
- Live indicator: `glow-green`
- Featured badges: `glow-cyan` (hot), `glow-red` (ending soon)

### Animations

**Existing Animations (reuse):**
- `animate-fade-in` - Panel entrance
- `animate-slide-in-right` - Side panel entrance
- `animate-pulse` - Live indicator
- `animate-shimmer` - Loading skeletons

**New Animations:**
```css
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 10px var(--accent-green-glow); }
  50% { box-shadow: 0 0 20px var(--accent-green-glow); }
}

.live-indicator {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

## Responsive Design

### Desktop (≥1024px)
```
┌─────────────────────────────────────────────────┐
│ Terminal Header                                  │
├─────────────────────────────────────────────────┤
│ Metrics Bar (4 columns)                         │
├──────────────────────────────┬──────────────────┤
│ Main Panel (70%)             │ Side Panel (30%) │
│ ┌──────────────────────────┐ │ ┌──────────────┐ │
│ │ Market Overview Chart    │ │ │ Top Movers   │ │
│ └──────────────────────────┘ │ └──────────────┘ │
│ ┌──────────────────────────┐ │ ┌──────────────┐ │
│ │ Featured Markets         │ │ │ Recent       │ │
│ └──────────────────────────┘ │ │ Activity     │ │
│                              │ └──────────────┘ │
└──────────────────────────────┴──────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────┐
│ Terminal Header             │
├─────────────────────────────┤
│ Metrics Bar (2 columns)     │
├─────────────────────────────┤
│ Market Overview Chart       │
├─────────────────────────────┤
│ Featured Markets            │
├─────────────────────────────┤
│ Top Movers                  │
├─────────────────────────────┤
│ Recent Activity             │
└─────────────────────────────┘
```

### Mobile (<768px)
```
┌───────────────┐
│ Terminal      │
│ Header        │
├───────────────┤
│ Metrics (1col)│
├───────────────┤
│ Chart         │
│ (300px height)│
├───────────────┤
│ Featured      │
│ Markets       │
├───────────────┤
│ Top Movers    │
│ (collapsible) │
├───────────────┤
│ Activity      │
│ (collapsible) │
└───────────────┘
```

## Performance Optimizations

### Code Splitting
- Lazy load TradingTerminal component
- Lazy load chart library (Recharts) only when needed
- Separate chunk for terminal-specific components

### Data Fetching
- Use existing `useRealtimeMarkets` hook (10s polling)
- Cache chart data for 5 minutes
- Debounce timeframe changes (500ms)
- Prefetch featured market details on hover

### Rendering
- Memoize chart data transformations
- Use `React.memo` for metric cards
- Virtual scrolling for activity feed (if >50 items)
- Throttle chart updates during real-time polling

### Bundle Size
- Reuse existing components (EnhancedMarketCard, RecentActivity)
- Share utilities with markets page
- Estimated additional bundle: ~15KB (gzipped)

## Migration Plan

### Phase 1: Route Setup
1. Create `/markets` route pointing to existing Content component
2. Update Header navigation to include "Markets" link
3. Test all existing routes still work

### Phase 2: Terminal Components
1. Create TradingTerminal page component
2. Build MetricsBar with mock data
3. Build TerminalHeader with timeframe selector
4. Test responsive layout

### Phase 3: Data Integration
1. Implement metrics calculation from dashboard contract
2. Build MarketOverviewChart with real data
3. Implement FeaturedMarkets selection algorithm
4. Connect real-time updates

### Phase 4: Side Panel
1. Build TopMovers component
2. Enhance RecentActivity for terminal context
3. Test side panel responsiveness

### Phase 5: Polish & Testing
1. Add loading states and skeletons
2. Implement error handling
3. Test all 6 themes
4. Accessibility audit
5. Performance profiling

## Accessibility Considerations

### Semantic HTML
```tsx
<main role="main" aria-label="Trading Terminal">
  <section aria-label="Platform Metrics">
    <h2>Key Metrics</h2>
    {/* MetricsBar */}
  </section>
  
  <section aria-label="Market Overview">
    <h2>Market Trends</h2>
    {/* Chart */}
  </section>
  
  <section aria-label="Featured Markets">
    <h2>Featured Markets</h2>
    {/* Featured list */}
  </section>
</main>
```

### ARIA Labels
- Chart: `aria-label="Market overview chart showing TVL over time"`
- Metrics: `aria-label="Total value locked: 1,234 PAS"`
- Live indicator: `aria-live="polite"` for updates
- Timeframe selector: `role="radiogroup"`

### Keyboard Navigation
- Tab order: Header → Metrics → Chart controls → Featured markets → Side panel
- Enter/Space: Activate buttons and links
- Escape: Close modals/dropdowns
- Arrow keys: Navigate chart controls

### Screen Reader Support
- Announce metric updates: "Total value locked increased to 1,234 PAS"
- Chart data table fallback for screen readers
- Skip links: "Skip to featured markets", "Skip to activity feed"

## Future Enhancements

### Phase 2 Features (Post-MVP)
- **Watchlist**: Pin favorite markets to terminal
- **Price Alerts**: Notify when pool reaches threshold
- **Advanced Charts**: Candlestick, volume profile, heatmaps
- **Market Comparison**: Side-by-side market analysis
- **Portfolio Widget**: Quick view of user positions
- **Quick Trade**: Place predictions directly from terminal
- **Custom Layouts**: Drag-and-drop panel arrangement
- **Export Data**: Download chart data as CSV

### Integration Opportunities
- **WebSocket Support**: Replace polling with real-time events
- **Push Notifications**: Browser notifications for alerts
- **Social Feed**: Integrate market comments into activity feed
- **Leaderboard Widget**: Show top traders on terminal
- **News Feed**: Display relevant sports news

## Technical Debt & Considerations

### Known Limitations
- Chart data limited to on-chain events (no historical price data)
- Featured markets algorithm may need tuning based on usage
- Real-time updates still use polling (no WebSocket support yet)
- Mobile chart interactions may be limited (touch gestures)

### Dependencies
- Recharts: 3.4.0 (already installed)
- React Router: 7.9.0 (already installed)
- Wagmi/Viem: Current versions (already installed)
- No new dependencies required

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features (already in use)
- CSS Grid and Flexbox (already in use)
- CSS Variables (already in use)

## Summary

The trading terminal homepage transforms CryptoScore into a professional trading platform while maintaining the existing market browsing experience at `/markets`. The design leverages existing components, design tokens, and infrastructure to minimize development effort while maximizing user value. The terminal provides traders with a comprehensive overview of platform activity, featured markets, and real-time data in a visually appealing, accessible interface that works across all devices and themes.
