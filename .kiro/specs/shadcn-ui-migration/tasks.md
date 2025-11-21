# Implementation Plan

- [x] 1. Setup Shadcn UI infrastructure
  - Install Shadcn UI CLI and initialize configuration
  - Configure path aliases in tsconfig.json and vite.config.ts for @/* imports
  - Create components.json with project-specific settings
  - Install required dependencies (@radix-ui packages, class-variance-authority, clsx, tailwind-merge)
  - Create lib/utils.ts with cn() helper function
  - Set up CSS variable mappings for Shadcn UI components to use existing theme system
  - _Requirements: 3.1, 3.2, 3.3, 6.3, 6.4_

- [x] 2. Install and configure core Shadcn UI components
- [x] 2.1 Install Button, Card, and Badge components
  - Run shadcn CLI to add button, card, and badge components
  - Customize Button component variants to match existing btn-primary, btn-success, btn-danger styles
  - Customize Card component to use --bg-elevated, --border-default, and shadow variables
  - Customize Badge component variants for success, error, warning, info, neutral
  - _Requirements: 4.1, 4.2, 4.3, 3.1, 3.2_

- [x] 2.2 Test core components with all 6 themes
  - Verify Button renders correctly in Dark Terminal, Ocean Blue, Forest Green, Sunset Orange, Purple Haze, Light Mode
  - Verify Card renders correctly with proper backgrounds, borders, and shadows in all themes
  - Verify Badge colors and contrast in all themes
  - Check hover states and transitions work with theme-specific colors
  - _Requirements: 2.1, 2.2, 2.6, 3.3, 5.4_

- [x] 3. Replace Button components across application
- [x] 3.1 Replace buttons in Header component
  - Replace wallet connection button with Shadcn UI Button
  - Replace theme switcher button with Shadcn UI Button
  - Replace navigation buttons with Shadcn UI Button
  - Verify button styling matches original design
  - _Requirements: 4.1, 1.1, 1.2_

- [x] 3.2 Replace buttons in Market components
  - Replace buttons in Market.tsx (create market modal)
  - Replace buttons in EnhancedMarketCard.tsx
  - Replace buttons in MarketDetail.tsx (join, predict, withdraw)
  - Replace buttons in MarketFilters.tsx (filter badges, clear filters)
  - Verify all button interactions work correctly
  - _Requirements: 4.1, 1.2, 1.4_

- [x] 3.3 Replace buttons in remaining components
  - Replace buttons in Connect.tsx
  - Replace buttons in SharePrediction.tsx
  - Replace buttons in MarketComments.tsx
  - Replace buttons in Leaderboard.tsx
  - Verify button states (loading, disabled) work correctly
  - _Requirements: 4.1, 1.2, 8.1_

- [x] 4. Replace Card components across application
- [x] 4.1 Replace cards in market components
  - Replace card structure in EnhancedMarketCard.tsx with Card, CardHeader, CardTitle, CardContent
  - Replace card structure in PortfolioSummary.tsx
  - Maintain card-glass glassmorphism effect
  - Verify card hover effects and transitions
  - _Requirements: 4.2, 1.1, 5.2, 5.4_

- [x] 4.2 Replace cards in dashboard and analytics
  - Replace cards in RecentActivity.tsx
  - Replace cards in PerformanceChart.tsx
  - Replace cards in Leaderboard.tsx (trader cards)
  - Verify card layouts remain responsive
  - _Requirements: 4.2, 1.1, 1.4_

- [x] 5. Replace Badge components across application
  - Replace status badges in EnhancedMarketCard.tsx (Open, Live, Ending Soon, Resolved)
  - Replace filter badges in MarketFilters.tsx
  - Replace prediction badges in MarketComments.tsx (HOME, DRAW, AWAY)
  - Replace creator badges in EnhancedMarketCard.tsx
  - Verify badge colors match theme system (success, error, warning, info, neutral)
  - _Requirements: 4.3, 1.1, 3.2_

- [x] 6. Install and configure form components
- [x] 6.1 Install Input, Select, and Checkbox components
  - Run shadcn CLI to add input, select, and checkbox components
  - Customize Input component with --border-default, --bg-secondary, focus states
  - Customize Select component with proper dropdown styling
  - Customize Checkbox component with --accent-cyan for checked state
  - _Requirements: 4.6, 3.1, 3.2_

- [x] 6.2 Replace form inputs in Market creation modal
  - Replace text inputs in Market.tsx with Shadcn UI Input
  - Replace select dropdowns with Shadcn UI Select
  - Replace checkboxes with Shadcn UI Checkbox
  - Verify form validation still works
  - _Requirements: 4.6, 1.2, 8.1_

- [x] 6.3 Replace form inputs in filters and search
  - Replace search input in SearchBar.tsx with Shadcn UI Input
  - Replace filter inputs in MarketFilters.tsx with Shadcn UI Select
  - Verify debouncing and real-time filtering still works
  - _Requirements: 4.6, 1.2, 8.1_

- [x] 7. Install and configure overlay components
- [x] 7.1 Install Dialog and DropdownMenu components
  - Run shadcn CLI to add dialog and dropdown-menu components
  - Customize Dialog with --bg-elevated, --border-default, backdrop blur
  - Customize DropdownMenu with proper positioning and styling
  - _Requirements: 4.4, 4.5, 3.1, 3.2_

- [x] 7.2 Replace modal dialogs across application
  - Replace market creation modal in Market.tsx with Shadcn UI Dialog
  - Verify modal open/close animations work
  - Verify modal backdrop and focus trap work correctly
  - Test keyboard navigation (Escape to close)
  - _Requirements: 4.4, 1.2, 9.2, 9.4_

- [x] 7.3 Replace dropdown menus across application
  - Replace theme switcher dropdown in ThemeSwitcher.tsx with Shadcn UI DropdownMenu
  - Replace share dropdown in SharePrediction.tsx with Shadcn UI DropdownMenu
  - Verify dropdown positioning and animations
  - Test keyboard navigation (Arrow keys, Enter, Escape)
  - _Requirements: 4.5, 1.2, 9.2, 9.4_

- [x] 8. Install and configure feedback components
- [x] 8.1 Install Toast/Sonner and Tooltip components
  - Run shadcn CLI to add sonner (toast) and tooltip components
  - Configure Sonner with theme-aware styling
  - Customize Tooltip with --bg-elevated and proper positioning
  - _Requirements: 4.7, 3.1, 3.2_

- [x] 8.2 Replace toast notifications with Sonner
  - Replace react-hot-toast with Sonner in ToastProvider.tsx
  - Update all toast.success(), toast.error(), toast.loading() calls
  - Verify toast positioning and animations
  - Test toast notifications with real-time updates
  - _Requirements: 4.7, 1.2, 8.7_

- [x] 8.3 Add tooltips to interactive elements
  - Add Shadcn UI Tooltip to buttons with icon-only variants
  - Add tooltips to market stats and metrics
  - Add tooltips to leaderboard rankings
  - Verify tooltip positioning and keyboard accessibility
  - _Requirements: 9.2, 9.4_

- [x] 9. Update component class system
- [x] 9.1 Adapt component classes for Shadcn UI structure
  - Update .btn-primary, .btn-success, .btn-danger classes to work with Shadcn UI Button
  - Update .card-glass class to work with Shadcn UI Card
  - Update utility classes (.glow-cyan, .hover-lift) to work with Shadcn UI components
  - Verify component classes apply correctly
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9.2 Update animations to work with Shadcn UI
  - Verify .animate-fade-in, .animate-slide-in, .animate-scale-in work with Shadcn UI components
  - Verify hover animations (.hover-lift, .hover-glow) work correctly
  - Verify loading animations (.skeleton, .spinner) work correctly
  - Test animations with all 6 themes
  - _Requirements: 1.5, 8.2, 8.3_

- [x] 10. Remove DaisyUI dependencies and cleanup
- [x] 10.1 Remove DaisyUI package and configuration
  - Remove daisyui from package.json dependencies
  - Remove DaisyUI plugin from tailwind.config.js
  - Run npm install to update lock file
  - Verify application still builds without errors
  - _Requirements: 6.1, 6.2, 10.1_

- [x] 10.2 Remove unused DaisyUI classes and imports
  - Search for and remove DaisyUI-specific class names (btn-*, card-*, badge-*, etc.)
  - Remove any remaining DaisyUI component imports
  - Clean up unused CSS rules
  - Verify no console warnings about missing classes
  - _Requirements: 6.5, 10.2_

- [x] 10.3 Verify bundle size optimization
  - Build production bundle and compare size to pre-migration
  - Verify bundle size is maintained or reduced
  - Check that only used Radix UI components are included
  - Run Lighthouse audit to verify performance
  - _Requirements: 6.5, 10.5_

- [ ] 11. Comprehensive testing and validation
- [ ] 11.1 Test all pages with all 6 themes
  - Test Dashboard, MarketDetail, MyMarkets, Leaderboard with Dark Terminal theme
  - Test all pages with Ocean Blue, Forest Green, Sunset Orange, Purple Haze themes
  - Test all pages with Light Mode theme
  - Verify theme switching works instantly (UI and keyboard shortcut)
  - Verify theme persistence to localStorage
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 1.3_

- [ ] 11.2 Test accessibility compliance
  - Test keyboard navigation (Tab, Enter, Escape, Arrow keys) on all pages
  - Test with screen reader (verify ARIA labels and announcements)
  - Verify color contrast meets WCAG AA in all themes (4.5:1 minimum)
  - Verify focus indicators are visible on all interactive elements
  - Test reduced motion support
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 2.6_

- [ ] 11.3 Test functionality preservation
  - Test virtual scrolling with >20 markets
  - Test confetti celebration on withdrawal
  - Test animated number transitions
  - Test chart visualizations (Recharts integration)
  - Test PWA functionality (install, offline mode)
  - Test real-time updates (10-second polling)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_

- [ ] 11.4 Cross-browser testing
  - Test in Chrome (latest) on desktop and mobile
  - Test in Firefox (latest)
  - Test in Safari (latest) on desktop and iOS
  - Verify responsive layouts on mobile, tablet, desktop breakpoints
  - _Requirements: 10.4, 10.5_

- [ ] 11.5 Final validation
  - Run TypeScript compilation and verify no errors
  - Run ESLint and verify no errors
  - Check browser console for errors on all pages
  - Verify all user flows work end-to-end
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 12. Update documentation
- [ ] 12.1 Create migration guide
  - Document DaisyUI to Shadcn UI component mapping
  - Document how to add new Shadcn UI components
  - Document CSS variable integration approach
  - Provide code examples for common patterns
  - _Requirements: 7.1, 7.4_

- [ ] 12.2 Update steering files
  - Update best-practices.md with Shadcn UI patterns and guidelines
  - Update theme-system.md with Shadcn UI theme integration details
  - Update structure.md with new component organization
  - Update features.md with Shadcn UI component references
  - _Requirements: 7.2, 7.5_

- [ ] 12.3 Update project README
  - Update setup instructions with Shadcn UI configuration
  - Update component library section
  - Update dependencies list
  - Add migration notes for future reference
  - _Requirements: 7.3_
