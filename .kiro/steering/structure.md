# Project Structure

## Monorepo Layout

```
.
├── hardhat/              # Smart contract workspace
├── dapp-react/           # React frontend workspace
├── package.json          # Root workspace config
└── .kiro/                # Kiro AI assistant config
```

## Smart Contracts (hardhat/)

```
hardhat/
├── contracts/            # Solidity source files
│   ├── CryptoScoreFactory.sol      # Market factory contract
│   ├── CryptoScoreMarket.sol       # Individual market contract
│   ├── CryptoScoreDashboard.sol    # Data aggregation contract
│   └── MessageBoard.sol            # Example/template contract
├── ignition/modules/     # Hardhat Ignition deployment modules
│   └── CryptoScoreFullModule.ts
├── scripts/              # Interaction and utility scripts
│   ├── interact-cryptoscore.ts
│   ├── interact-messageboard.ts
│   └── show-accounts.ts
├── hardhat.config.ts     # Hardhat + Polkadot configuration
├── .env.development      # Default environment variables
└── package.json
```

### Contract Architecture

- **Factory Pattern**: CryptoScoreFactory deploys CryptoScoreMarket instances
- **Event-Driven**: All contracts emit indexed events for frontend integration
- **Polkadot-Compatible**: Uses PolkaVM-compatible patterns (no CREATE2, inline deployment)

## Frontend (dapp-react/)

```
dapp-react/
├── src/
│   ├── components/
│   │   ├── cards/                    # Card components
│   │   │   ├── EnhancedMarketCard.tsx    # Market card with distribution
│   │   │   └── PortfolioSummary.tsx      # Portfolio stats card
│   │   ├── charts/                   # Data visualizations
│   │   │   ├── PredictionDistributionChart.tsx
│   │   │   └── PoolTrendChart.tsx
│   │   ├── layout/                   # Layout components
│   │   │   ├── Header.tsx                # App header with navigation
│   │   │   └── Footer.tsx                # App footer
│   │   ├── market/                   # Market-related components
│   │   │   ├── Market.tsx                # Market creation modal
│   │   │   ├── MarketFilters.tsx         # Advanced filtering
│   │   │   ├── Markets.tsx               # Markets container
│   │   │   ├── PublicMarkets.tsx         # Public markets view
│   │   │   └── UserMarkets.tsx           # User-specific markets
│   │   ├── ui/                       # Reusable UI components (Radix-based)
│   │   │   ├── button.tsx                # Button component
│   │   │   ├── dialog.tsx                # Dialog/modal component
│   │   │   ├── dropdown-menu.tsx         # Dropdown menu component
│   │   │   ├── select.tsx                # Select component
│   │   │   ├── tabs.tsx                  # Tabs component
│   │   │   ├── tooltip.tsx               # Tooltip component
│   │   │   ├── AnimatedNumber.tsx        # Number transitions
│   │   │   ├── Confetti.tsx              # Win celebration
│   │   │   └── ToastProvider.tsx         # Toast notifications
│   │   ├── VirtualMarketList.tsx     # Virtual scrolling list
│   │   ├── ThemeSwitcher.tsx         # Theme selection dropdown
│   │   ├── Account.tsx               # Wallet account display
│   │   ├── Balance.tsx               # Token balance display
│   │   ├── Connect.tsx               # Wallet connection button
│   │   ├── Content.tsx               # Main content/landing page
│   │   ├── MarketComments.tsx        # Comment section
│   │   ├── MarqueeText.tsx           # Scrolling text component
│   │   ├── PerformanceChart.tsx      # Win/loss chart
│   │   ├── RecentActivity.tsx        # Activity feed
│   │   ├── SearchBar.tsx             # Global search
│   │   └── SharePrediction.tsx       # Social sharing
│   ├── pages/                    # Route components
│   │   ├── Dashboard.tsx             # User dashboard (unused)
│   │   ├── Leaderboard.tsx           # Top traders leaderboard
│   │   ├── MarketDetail.tsx          # Single market detail page
│   │   └── MyMarkets.tsx             # User portfolio page
│   ├── config/                   # Configuration files
│   │   ├── wagmi.ts                  # Wagmi/chain config
│   │   └── contracts.ts              # Contract addresses + ABIs
│   ├── contexts/                 # React contexts
│   │   └── ThemeContext.tsx          # Theme management (6 presets)
│   ├── hooks/                    # Custom React hooks
│   │   ├── useMatchData.ts           # Football-Data.org API hook
│   │   ├── useFilteredMarkets.ts     # Market filtering logic
│   │   └── useRealtimeMarkets.ts     # Real-time polling
│   ├── styles/                   # Design system
│   │   ├── tokens.css                # Design tokens (40+ theme-aware)
│   │   ├── components.css            # Component classes (30+)
│   │   └── animations.css            # Animation library
│   ├── lib/                      # Utility libraries
│   │   └── utils.ts                  # Utility functions (cn, etc.)
│   ├── utils/                    # Helper functions
│   │   ├── accessibility.ts          # A11y utilities
│   │   ├── apiKey.ts                 # API key rotation logic
│   │   ├── chain.ts                  # Chain utilities
│   │   └── formatters.ts             # Data formatting helpers
│   ├── types.ts                  # TypeScript type definitions
│   ├── main.tsx                  # App entry point
│   ├── App.tsx                   # Root component with routing
│   └── style.css                 # Global styles (Tailwind)
├── abi/                          # Contract ABIs (JSON)
│   ├── CryptoScoreDashboard.json
│   ├── CryptoScoreFactory.json
│   └── CryptoScoreMarket.json
├── docs/                         # Documentation
│   ├── IMPLEMENTATION_PLAN.md        # Complete roadmap
│   ├── REDESIGN_COMPLETE.md          # Feature summary
│   ├── CLEANUP_SUMMARY.md            # Reorganization log
│   └── INTEGRATION_COMPLETE.md       # Phase 4 integration
├── public/                       # Static assets
│   ├── manifest.json                 # PWA manifest
│   └── sw.js                         # Service worker
├── index.html                    # HTML entry point
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript config
├── README.md                     # Project documentation
└── package.json
```

### Frontend Patterns

- **Component Organization**: Organized by type (cards/, charts/, layout/, market/, ui/)
- **Config Centralization**: All contract addresses and ABIs in config/
- **Context Management**: Theme context for global theme state
- **Custom Hooks**: Domain-specific hooks in hooks/ (useMatchData, useFilteredMarkets, useRealtimeMarkets)
- **Type Safety**: Shared types in types.ts, strict TypeScript enabled
- **ABI Management**: JSON ABIs in abi/, imported in config/contracts.ts
- **Design System**: Centralized tokens, components, and animations in styles/
- **Theme System**: CSS variables + React Context for 6 theme presets
- **UI Components**: Radix UI primitives with custom styling
- **Code Splitting**: Lazy loading for routes (MarketDetail, MyMarkets, Leaderboard)
- **Virtual Scrolling**: Auto-activates for >20 markets using @tanstack/react-virtual
- **Real-Time Updates**: 10-second polling with React Query invalidation

## Key Conventions

- **Naming**: PascalCase for components/contracts, camelCase for functions/variables
- **Imports**: Absolute imports from src/, relative for local files
- **State Management**: React hooks + TanStack Query (no Redux/Zustand)
- **Styling**: Tailwind utility classes, DaisyUI components
- **Contract Interaction**: Wagmi hooks (useReadContract, useWriteContract, etc.)
