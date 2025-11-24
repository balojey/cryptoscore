# Implementation Plan

- [x] 1. Set up routing infrastructure and migrate existing homepage
  - Move Content component from `/` to `/markets` route in App.tsx
  - Update Header component to include "Home" and "Markets" navigation links
  - Update all internal links pointing to `/` to point to `/markets` where appropriate
  - Test that all existing routes continue to work correctly
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 14.1, 14.2, 14.3, 14.4_

- [x] 2. Create LandingPage component with base structure
  - Create `src/pages/LandingPage.tsx` as main container component
  - Set up section containers with proper spacing and max-width
  - Implement smooth scroll behavior between sections
  - Add Intersection Observer for scroll-triggered animations
  - Apply theme-aware styling using CSS variables
  - Configure lazy loading for below-the-fold sections
  - _Requirements: 1.1, 9.1, 9.2, 11.2, 12.1, 12.2_

- [x] 3. Build HeroSection component
- [x] 3.1 Create HeroSection structure and layout
  - Create `src/components/landing/HeroSection.tsx`
  - Implement responsive layout (centered content, full-width background)
  - Add headline with gradient text effect
  - Add tagline/value proposition text
  - Apply theme-aware colors and glassmorphism effects
  - _Requirements: 1.1, 1.2, 9.1, 12.1_

- [x] 3.2 Implement hero CTAs and visual elements
  - Add primary CTA button linking to `/markets`
  - Add secondary CTA button linking to `/terminal`
  - Create animated background or illustration (sports theme)
  - Add scroll indicator at bottom of hero
  - Implement entrance animations (fade-in, slide-in)
  - _Requirements: 1.3, 1.4, 7.1, 7.2, 7.3_

- [x] 4. Create LiveMetrics component with real-time data
- [x] 4.1 Build LiveMetrics component structure
  - Create `src/components/landing/LiveMetrics.tsx`
  - Create MetricCard sub-component for individual metrics
  - Implement responsive grid layout (4 → 2 → 1 columns)
  - Apply theme-aware styling and card effects
  - _Requirements: 4.1, 9.1, 12.1_

- [x] 4.2 Integrate contract data and animations
  - Fetch metrics from CryptoScoreDashboard contract using useReadContract
  - Calculate total markets, TVL, active traders, and markets resolved
  - Integrate AnimatedNumber component for smooth transitions
  - Add loading skeletons during data fetch
  - Implement real-time updates with polling mechanism
  - _Requirements: 4.2, 4.3, 4.4, 11.4_

- [ ] 5. Build HowItWorks component
  - Create `src/components/landing/HowItWorks.tsx`
  - Define 3 steps: Browse Markets, Make Prediction, Win Rewards
  - Create step cards with icons, titles, and descriptions
  - Implement horizontal flow with connecting arrows (desktop)
  - Implement vertical stack with downward arrows (mobile)
  - Add hover effects revealing additional details
  - Apply stagger animations on scroll
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 9.1_


- [ ] 6. Create KeyFeatures component
  - Create `src/components/landing/KeyFeatures.tsx`
  - Define 6 features: Decentralized, Transparent, Low Fees, Real-Time, Community, Multi-Theme
  - Create feature cards with icons, titles, and descriptions
  - Implement responsive grid layout (3 → 2 → 1 columns)
  - Add gradient icon backgrounds with theme colors
  - Implement hover lift and glow effects
  - Add scroll-triggered entrance animations
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 9.1, 12.1_

- [ ] 7. Build FeaturedMarketsPreview component
- [ ] 7.1 Create FeaturedMarketsPreview structure
  - Create `src/components/landing/FeaturedMarketsPreview.tsx`
  - Create CompactMarketCard sub-component for market display
  - Implement responsive grid layout (3 → 2 → horizontal scroll)
  - Add section header with title and description
  - Add "View All Markets" CTA linking to `/markets`
  - _Requirements: 5.1, 5.4, 7.3, 9.1_

- [ ] 7.2 Implement featured markets selection logic
  - Fetch markets data using useReadContract hook
  - Create algorithm to select top 3 markets by pool size
  - Add logic to identify markets ending soon (< 24 hours, top 2)
  - Add logic to select 1 recently created market
  - Display market info: teams, pool size, participants, status badge
  - Enable click navigation to market detail pages
  - _Requirements: 5.2, 5.3, 7.3_

- [ ] 8. Create WhyCryptoScore component
  - Create `src/components/landing/WhyCryptoScore.tsx`
  - Define 5 benefit points: No Intermediaries, Transparent Odds, Lower Fees, Instant Payouts, Community Powered
  - Create benefit cards with checkmark icons and descriptions
  - Implement expandable details on hover or click
  - Add comparison highlights (2% vs 5-10% fees, etc.)
  - Apply scroll-triggered animations
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 9. Build FinalCTA component
  - Create `src/components/landing/FinalCTA.tsx`
  - Add bold headline with gradient text effect
  - Add supporting tagline
  - Create dual CTAs: "Explore Markets" and "Connect Wallet"
  - Apply glassmorphism card effect
  - Add subtle animated background
  - Implement full-width section with centered content
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 10. Implement scroll animations and interactions
- [ ] 10.1 Set up basic scroll animations
  - Set up Intersection Observer for section visibility tracking
  - Implement fade-in animations on scroll for all sections
  - Add smooth scroll behavior for anchor links
  - Ensure animations respect prefers-reduced-motion
  - _Requirements: 9.1, 10.4_

- [ ]* 10.2 Add advanced animation effects
  - Add stagger animations for grid items (0.1s delay per item)
  - Implement parallax effect on hero background (subtle)
  - Add micro-interactions on hover states
  - _Requirements: 9.1_

- [ ] 11. Add loading states and error handling
  - Create loading skeletons for LiveMetrics cards
  - Create loading skeletons for FeaturedMarketsPreview cards
  - Implement error banners for contract read failures
  - Add retry buttons for failed data fetches
  - Implement graceful degradation (show cached data or placeholders)
  - Handle empty states for featured markets
  - _Requirements: 11.4_

- [ ] 12. Update Header navigation
  - Add "Home" link pointing to `/` in Header component
  - Update "Markets" link to point to `/markets`
  - Ensure "Terminal" link points to `/terminal`
  - Add active state styling for current route
  - Test navigation flow between all routes
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 13. Verify responsive design across all breakpoints
  - Test desktop layout (≥1024px) with multi-column grids
  - Test tablet layout (768px-1023px) with adjusted columns
  - Test mobile layout (<768px) with vertical stacks
  - Verify hero section responsiveness and text sizing
  - Test horizontal scroll for featured markets on mobile
  - Ensure touch-friendly tap targets (minimum 44px)
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 14. Verify theme compatibility across all 6 presets
  - Test Dark Terminal theme (default)
  - Test Ocean Blue theme
  - Test Forest Green theme
  - Test Sunset Orange theme
  - Test Purple Haze theme
  - Test Light Mode theme
  - Verify all CSS variables are properly applied
  - Check gradient effects and glassmorphism in each theme
  - Verify shadow intensities are appropriate per theme
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 15. Implement accessibility features
- [ ] 15.1 Add core accessibility features
  - Add semantic HTML with proper heading hierarchy (h1, h2, h3)
  - Add ARIA labels for all interactive elements and sections
  - Implement keyboard navigation for all CTAs and links
  - Add alt text for all images and icons
  - _Requirements: 10.1, 10.2, 10.3_

- [ ]* 15.2 Advanced accessibility testing
  - Add skip links for main sections
  - Verify WCAG AA color contrast in all themes
  - Test with screen readers (announce sections and updates)
  - Perform comprehensive accessibility audit
  - _Requirements: 10.4_

- [ ] 16. Performance optimization and code splitting
- [ ] 16.1 Basic performance optimizations
  - Configure lazy loading for LandingPage component in App.tsx
  - Lazy load FeaturedMarketsPreview (below the fold)
  - Memoize MetricCard components with React.memo
  - _Requirements: 11.2, 11.3_

- [ ]* 16.2 Advanced performance optimizations
  - Optimize images (WebP format, compression, responsive srcset)
  - Implement debouncing for scroll animations (100ms)
  - Profile component rendering and optimize re-renders
  - Measure and optimize bundle size
  - _Requirements: 11.1_

- [ ] 17. Final integration testing and polish
- [ ] 17.1 Core integration testing
  - Test navigation flow between landing page, markets, and terminal
  - Verify all CTAs and links work correctly
  - Verify backward compatibility with existing routes
  - Test wallet connection flow from landing page
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4_

- [ ]* 17.2 Advanced testing and metrics
  - Test real-time metrics updates with multiple browser tabs
  - Perform final accessibility audit
  - Test performance metrics (LCP, FID, CLS)
  - Cross-browser compatibility testing
  - _Requirements: 11.1_
