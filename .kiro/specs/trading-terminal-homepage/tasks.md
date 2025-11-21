# Implementation Plan

- [ ] 1. Set up routing infrastructure and migrate existing homepage
  - Create `/markets` route pointing to existing Content component
  - Update App.tsx routing configuration with lazy loading for new routes
  - Update Header component to include "Markets" navigation link
  - Test that all existing routes continue to work correctly
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.3, 7.4, 8.1, 8.2_

- [ ] 2. Create TradingTerminal page component with responsive layout
  - Create `src/pages/TradingTerminal.tsx` as main container component
  - Implement responsive grid layout (2-column desktop, stacked mobile)
  - Add state management for timeframe and metric selection
  - Integrate useRealtimeMarkets hook for 10-second polling
  - Apply theme-aware styling using CSS variables
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.1, 6.2_

- [ ] 3. Build MetricsBar component with platform statistics
- [ ] 3.1 Create MetricsBar component structure
  - Create `src/components/terminal/MetricsBar.tsx`
  - Implement responsive grid layout (4 → 2 → 1 columns)
  - Create MetricCard sub-component for individual metrics
  - Apply theme-aware styling and shadows
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3.2 Implement metrics calculation logic
  - Fetch dashboard data using useReadContract hook
  - Calculate total markets, TVL, active traders, 24h volume
  - Implement AnimatedNumber component integration for smooth transitions
  - Add trend indicators with percentage changes
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 6.4_

- [ ] 4. Create TerminalHeader component with navigation
  - Create `src/components/terminal/TerminalHeader.tsx`
  - Add terminal title with live indicator (pulsing green dot)
  - Implement timeframe selector (24h, 7d, 30d, All Time)
  - Add "View All Markets" CTA button linking to /markets
  - Apply pulse-glow animation to live indicator
  - _Requirements: 7.1, 7.2_

- [ ] 5. Build MarketOverviewChart component with data visualization
- [ ] 5.1 Create chart component structure
  - Create `src/components/terminal/MarketOverviewChart.tsx`
  - Set up Recharts ResponsiveContainer with proper dimensions
  - Implement chart type selector (TVL, Volume, Participants)
  - Create custom tooltip component with formatted values
  - Apply theme-aware colors to all chart elements
  - _Requirements: 4.1, 4.3, 4.4_

- [ ] 5.2 Implement chart data transformation and integration
  - Transform contract data into chart-compatible format
  - Implement data aggregation by timeframe (24h, 7d, 30d)
  - Add loading skeleton during data fetch
  - Handle empty states and error conditions
  - _Requirements: 4.1, 4.2_

- [ ] 6. Create FeaturedMarkets component with selection algorithm
- [ ] 6.1 Build FeaturedMarkets component UI
  - Create `src/components/terminal/FeaturedMarkets.tsx`
  - Create FeaturedMarketCard sub-component with compact layout
  - Implement badge system (Hot, Ending Soon, Popular)
  - Add "View All Markets" link at bottom
  - Apply theme-aware styling and hover effects
  - _Requirements: 5.1, 5.3_

- [ ] 6.2 Implement featured markets selection logic
  - Create algorithm to select top markets by pool size (top 3)
  - Add logic to identify markets ending soon (< 24 hours, top 2)
  - Add logic to identify most popular markets by participants (top 2)
  - Limit total featured markets to 7 items
  - Integrate with existing Market type and data structures
  - _Requirements: 5.1, 5.2, 5.4_

- [ ] 7. Build TopMovers component for side panel
  - Create `src/components/terminal/TopMovers.tsx`
  - Create MoverCard sub-component with change indicators
  - Implement logic to calculate pool size changes (last 24h)
  - Implement logic to calculate participant count changes (last 24h)
  - Add color coding for positive/negative changes (green/red)
  - Display mini prediction distribution bars
  - _Requirements: 2.1, 6.3_

- [ ] 8. Enhance RecentActivity component for terminal context
  - Update `src/components/RecentActivity.tsx` for terminal usage
  - Add activity type icons (join, create, resolve, withdraw)
  - Implement relative timestamps ("2m ago", "1h ago")
  - Limit display to 10 most recent activities
  - Add auto-scroll to top on new activity
  - _Requirements: 2.1, 6.3_

- [ ] 9. Integrate real-time updates and data fetching
  - Connect all terminal components to useRealtimeMarkets hook
  - Implement toast notifications for significant market events
  - Add optimistic UI updates with AnimatedNumber components
  - Test polling behavior and cache invalidation
  - Verify no performance degradation during updates
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10. Implement error handling and empty states
  - Add error banners for network failures
  - Implement fallback UI with cached data and timestamps
  - Create empty state messages for no markets/activity
  - Add retry buttons for failed data fetches
  - Handle API rate limit errors gracefully
  - _Requirements: 2.1, 8.4_

- [ ] 11. Add loading states and skeletons
  - Create loading skeletons for MetricsBar
  - Create loading skeleton for MarketOverviewChart
  - Create loading skeletons for FeaturedMarkets cards
  - Create loading skeletons for TopMovers and RecentActivity
  - Ensure smooth transitions from loading to loaded state
  - _Requirements: 2.1, 8.4_

- [ ] 12. Verify responsive design across all breakpoints
  - Test desktop layout (≥1024px) with 2-column grid
  - Test tablet layout (768px-1023px) with stacked panels
  - Test mobile layout (<768px) with vertical stack
  - Verify chart responsiveness and touch interactions
  - Test collapsible sections on mobile
  - _Requirements: 2.3_

- [ ] 13. Verify theme compatibility across all 6 presets
  - Test Dark Terminal theme (default)
  - Test Ocean Blue theme
  - Test Forest Green theme
  - Test Sunset Orange theme
  - Test Purple Haze theme
  - Test Light Mode theme
  - Verify all CSS variables are properly applied
  - Check shadow intensities are appropriate per theme
  - _Requirements: 2.2_

- [ ] 14. Implement accessibility features
  - Add semantic HTML with proper ARIA labels
  - Implement keyboard navigation for all interactive elements
  - Add skip links for main sections
  - Test with screen readers
  - Verify WCAG AA color contrast in all themes
  - Add aria-live regions for real-time updates
  - _Requirements: 2.4_

- [ ] 15. Performance optimization and code splitting
  - Configure lazy loading for TradingTerminal component in App.tsx
  - Memoize chart data transformations with useMemo
  - Apply React.memo to MetricCard components
  - Implement debouncing for timeframe changes (500ms)
  - Profile component rendering and optimize re-renders
  - _Requirements: 8.3, 8.4_

- [ ] 16. Final integration testing and polish
  - Test navigation flow between terminal and markets page
  - Verify all links and CTAs work correctly
  - Test real-time updates with multiple browser tabs
  - Verify backward compatibility with existing routes
  - Test wallet connection and user-specific data
  - Perform final accessibility audit
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_
