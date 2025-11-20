# CryptoScore Features Guide

This document outlines all implemented features and their locations in the codebase.

## Phase 0: Theme System (NEW)

### Multi-Theme Support
**Location:** `src/contexts/ThemeContext.tsx`, `src/components/ThemeSwitcher.tsx`
- 6 professionally designed themes with instant switching
- Theme-aware CSS variables for all colors and shadows
- localStorage persistence across sessions
- Keyboard shortcut (Ctrl+Shift+T) for quick cycling
- WCAG AA compliant color contrast in all themes

**Available Themes:**
1. **Dark Terminal** (Default) - Professional trader theme with neon accents
2. **Ocean Blue** - Deep blue oceanic palette
3. **Forest Green** - Nature-inspired green theme
4. **Sunset Orange** - Warm sunset colors
5. **Purple Haze** - Vibrant purple and pink
6. **Light Mode** - Clean light theme with subtle shadows

### Design System
**Location:** `src/styles/tokens.css`, `src/styles/components.css`
- 40+ design tokens for colors, spacing, shadows, typography
- All tokens are theme-aware via CSS variables
- Consistent styling across all components
- Theme-specific shadow intensities

## Phase 1: Foundation

### Enhanced Market Cards
**Component:** `src/components/cards/EnhancedMarketCard.tsx`
- Prediction distribution visualization (horizontal bars)
- Real-time percentage display for HOME/DRAW/AWAY
- Status badges (Open, Live, Ending Soon, Resolved)
- Pool size and participant count
- Entry fee display
- Creator badges and "Joined" indicators

### Redesigned Pages
**Files:** `src/pages/MarketDetail.tsx`, `src/components/layout/Header.tsx`
- Split-screen market detail layout
- Dark themed header with glassmorphism
- Global search bar
- Navigation to My Markets and Leaderboard

---

## Phase 2: Dashboard & Analytics

### Portfolio Dashboard
**Component:** `src/components/cards/PortfolioSummary.tsx`
- Total value locked
- Profit/Loss tracking
- Win rate percentage
- Active positions count

### Recent Activity Feed
**Component:** `src/components/RecentActivity.tsx`
- Latest market actions
- Timestamps and status
- Quick navigation to markets

### Performance Chart
**Component:** `src/components/PerformanceChart.tsx`
- Win/loss visualization
- Percentage bar chart
- Stats grid (Wins, Losses, Total)
- Performance indicator

### Advanced Filtering
**Component:** `src/components/market/MarketFilters.tsx`
**Hook:** `src/hooks/useFilteredMarkets.ts`

**Filters:**
- Status (All, Open, Live, Resolved)
- Time range (All Time, Today, This Week, This Month)
- Pool size (minimum value in PAS)
- Entry fee (minimum value in PAS)
- Active filter badges with clear functionality

**Sorting:**
- Newest first
- Ending soon
- Highest pool
- Most participants

### Real-Time Updates
**Hook:** `src/hooks/useRealtimeMarkets.ts`
**Component:** `src/components/ui/ToastProvider.tsx`

**Features:**
- 10-second polling interval
- Automatic cache invalidation
- Toast notifications for events
- Animated number transitions
- Optimistic UI updates

---

## Phase 3: Advanced Features

### Data Visualizations

#### Prediction Distribution Chart
**Component:** `src/components/charts/PredictionDistributionChart.tsx`
- Pie chart showing HOME/DRAW/AWAY split
- Percentage labels
- Color-coded segments
- Integrated in MyMarkets and MarketDetail

#### Pool Trend Chart
**Component:** `src/components/charts/PoolTrendChart.tsx`
- Line chart showing pool growth
- Time-based x-axis
- Value-based y-axis
- Trend indicators

### Leaderboard System
**Page:** `src/pages/Leaderboard.tsx`

**Categories:**
1. Win Rate Leaders (with medal system 🥇🥈🥉)
2. Total Earnings Leaders
3. Most Active Traders
4. Best Winning Streak

**Features:**
- Top 50 traders per category
- Trader cards with stats
- Responsive grid layout
- Navigation link in header

### Social Features

#### Market Comments
**Component:** `src/components/MarketComments.tsx`
- Comment section on market detail pages
- Prediction tags (HOME/DRAW/AWAY)
- User avatars and addresses
- Timestamps ("Just now", "5m ago", etc.)
- Real-time display

#### Prediction Sharing
**Component:** `src/components/SharePrediction.tsx`
- Share to Twitter
- Share to Farcaster
- Copy link to clipboard
- Custom share text with match info
- Dropdown menu UI

---

## Phase 4: Polish & Optimization

### Performance Optimization

#### Virtual Scrolling
**Component:** `src/components/VirtualMarketList.tsx`
**Integration:** MyMarkets page, PublicMarkets component

**Features:**
- Renders only visible items (6-9 cards)
- Auto-activates when >20 markets
- Configurable columns (1, 2, or 3)
- 10-20x performance improvement

#### Code Splitting
**File:** `src/App.tsx`
- Lazy loading for routes
- Separate chunks per page
- Suspense boundaries with loaders

#### PWA Support
**Files:** `public/manifest.json`, `public/sw.js`
- Service worker with cache strategies
- Installable app
- Offline capability
- Network-first for API, cache-first for assets

### Accessibility

#### Keyboard Navigation
**File:** `src/utils/accessibility.ts`
- Skip to main content link
- Focus trap utilities
- Tab navigation support
- Enter/Space key handlers

#### Screen Reader Support
**Styles:** `src/styles/animations.css`
- ARIA labels and roles
- Screen reader only (sr-only) class
- Semantic HTML structure
- Announcement utilities

#### WCAG Compliance
- Color contrast validation
- Focus visible styles
- Reduced motion support
- Alt text for images

### Animations & Micro-interactions

#### Animation Library
**File:** `src/styles/animations.css`
- Fade in, slide in, scale in
- Pulse glow for live elements
- Shimmer loading skeletons
- Bounce in for success
- Shake for errors
- Hover lift and glow effects
- Stagger children animations
- Loading dots
- Smooth scroll

#### Confetti Celebration
**Component:** `src/components/ui/Confetti.tsx`
**Integration:** MarketDetail page

**Features:**
- 50 animated particles
- 3-second duration
- Design system colors
- Triggers on successful withdrawal
- Auto-cleanup

#### Animated Numbers
**Component:** `src/components/ui/AnimatedNumber.tsx`
- Smooth number transitions
- Configurable duration
- Decimal precision control
- Suffix support
- Ease-out animation

---

## Key Integration Points

### Market Detail Page
**File:** `src/pages/MarketDetail.tsx`
- Confetti on withdrawal
- Prediction distribution chart
- Pool trend chart
- Market comments
- Social sharing

### My Markets Page
**File:** `src/pages/MyMarkets.tsx`
- Portfolio summary
- Recent activity feed
- Performance chart
- Prediction distribution chart
- Pool trend chart
- Virtual scrolling (>20 markets)

### Public Markets
**File:** `src/components/market/PublicMarkets.tsx`
- Advanced filtering
- Real-time updates
- Virtual scrolling (>20 markets)
- Results count

### Header
**File:** `src/components/layout/Header.tsx`
- Global search bar
- My Markets link
- Leaderboard link
- Wallet connection

---

## Usage Examples

### Using Enhanced Market Card
```tsx
import EnhancedMarketCard from './components/cards/EnhancedMarketCard'

<EnhancedMarketCard market={marketData} />
```

### Using Virtual Scrolling
```tsx
import VirtualMarketList from './components/VirtualMarketList'

// Auto-activates for >20 markets
{markets.length > 20 ? (
  <VirtualMarketList markets={markets} columns={3} />
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {markets.map(market => <EnhancedMarketCard key={market.marketAddress} market={market} />)}
  </div>
)}
```

### Using Confetti
```tsx
import Confetti from './components/ui/Confetti'

const [showConfetti, setShowConfetti] = useState(false)

// Trigger confetti
setShowConfetti(true)
setTimeout(() => setShowConfetti(false), 100)

// Render
<Confetti trigger={showConfetti} duration={3000} />
```

### Using Real-Time Updates
```tsx
import { useRealtimeMarkets } from './hooks/useRealtimeMarkets'

useRealtimeMarkets({
  enabled: true,
  interval: 10000,
  onUpdate: () => refetch()
})
```

### Using Advanced Filters
```tsx
import MarketFilters from './components/market/MarketFilters'
import { useFilteredMarkets } from './hooks/useFilteredMarkets'

const [filters, setFilters] = useState<FilterOptions>({
  status: 'all',
  sortBy: 'newest',
})

const filteredMarkets = useFilteredMarkets(markets, filters)

<MarketFilters filters={filters} onFilterChange={setFilters} />
```

---

## Design System Classes

### Buttons
- `.btn-primary` - Cyan action button
- `.btn-success` - Green success button
- `.btn-danger` - Red danger button
- `.btn-secondary` - Outlined button
- `.btn-sm`, `.btn-lg` - Size variants

### Cards
- `.card` - Base card with hover effects
- `.card-glass` - Glassmorphism effect
- `.card-header`, `.card-body` - Card sections
- `.card-title` - Card heading

### Badges
- `.badge-success`, `.badge-error`, `.badge-warning`, `.badge-info`, `.badge-neutral`

### Stats
- `.stat-card` - Stat display container
- `.stat-label`, `.stat-value` - Stat components

### Utilities
- `.skeleton` - Loading animation
- `.spinner` - Loading spinner
- `.glow-cyan`, `.glow-green`, `.glow-red` - Glow effects
- `.text-gradient-cyan`, `.text-gradient-green` - Text gradients
- `.hover-lift` - Lift on hover
- `.hover-glow` - Glow on hover
- `.animate-fade-in`, `.animate-slide-in-right`, `.animate-scale-in` - Animations

---

## Performance Metrics

- **Bundle Size:** 524KB (158KB gzipped)
- **Build Time:** ~14s
- **Components:** 25 files
- **Code Splitting:** 4 route chunks
- **Virtual Scrolling:** 10-20x improvement for large lists
- **Real-Time Updates:** 10-second polling
- **PWA:** Offline capable

---

## Documentation

- **Implementation Plan:** `docs/IMPLEMENTATION_PLAN.md`
- **Redesign Summary:** `docs/REDESIGN_COMPLETE.md`
- **Cleanup Log:** `docs/CLEANUP_SUMMARY.md`
- **Integration Guide:** `docs/INTEGRATION_COMPLETE.md`
- **Project README:** `README.md`
