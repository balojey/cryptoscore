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
│   ├── components/       # Reusable UI components
│   │   ├── Account.tsx           # Wallet account display
│   │   ├── Balance.tsx           # Token balance display
│   │   ├── Connect.tsx           # Wallet connection button
│   │   ├── Content.tsx           # Main content/landing page
│   │   ├── Header.tsx            # App header
│   │   ├── Footer.tsx            # App footer
│   │   ├── Market.tsx            # Market creation modal
│   │   ├── MarketCard.tsx        # Individual market card
│   │   ├── Markets.tsx           # Markets container
│   │   ├── MarqueeText.tsx       # Scrolling text component
│   │   ├── PublicMarkets.tsx     # Public markets view
│   │   └── UserMarkets.tsx       # User-specific markets
│   ├── pages/            # Route components
│   │   ├── MarketDetail.tsx      # Single market detail page
│   │   └── MyMarkets.tsx         # User dashboard page
│   ├── config/           # Configuration files
│   │   ├── wagmi.ts              # Wagmi/chain config
│   │   └── contracts.ts          # Contract addresses + ABIs
│   ├── hooks/            # Custom React hooks
│   │   └── useMatchData.ts       # Football-Data.org API hook
│   ├── utils/            # Helper functions
│   │   ├── apiKey.ts             # API key rotation logic
│   │   ├── chain.ts              # Chain utilities
│   │   └── formatters.ts         # Data formatting helpers
│   ├── types.ts          # TypeScript type definitions
│   ├── main.tsx          # App entry point
│   ├── App.tsx           # Root component with routing
│   └── style.css         # Global styles (Tailwind)
├── abi/                  # Contract ABIs (JSON)
│   ├── CryptoScoreDashboard.json
│   ├── CryptoScoreFactory.json
│   └── CryptoScoreMarket.json
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
└── package.json
```

### Frontend Patterns

- **Component Organization**: Flat structure in components/, pages for routes
- **Config Centralization**: All contract addresses and ABIs in config/
- **Custom Hooks**: Domain-specific hooks in hooks/ (e.g., useMatchData)
- **Type Safety**: Shared types in types.ts, strict TypeScript enabled
- **ABI Management**: JSON ABIs in abi/, imported in config/contracts.ts

## Key Conventions

- **Naming**: PascalCase for components/contracts, camelCase for functions/variables
- **Imports**: Absolute imports from src/, relative for local files
- **State Management**: React hooks + TanStack Query (no Redux/Zustand)
- **Styling**: Tailwind utility classes, DaisyUI components
- **Contract Interaction**: Wagmi hooks (useReadContract, useWriteContract, etc.)
