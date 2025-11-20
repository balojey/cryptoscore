# CryptoScore dApp - React Frontend

A professional Web3 trading terminal for decentralized sports prediction markets on Polkadot.

## 🎨 Features

- **Dark Terminal Theme** - Professional trader-focused UI
- **Enhanced Market Cards** - Prediction distribution visualization
- **Portfolio Dashboard** - Track performance, P&L, and win rates
- **Advanced Filtering** - Status, time range, pool size, entry fee filters
- **Real-Time Updates** - 10-second polling with toast notifications
- **Data Visualizations** - Charts for predictions, performance, and trends
- **Leaderboard System** - Top traders across 4 categories
- **Social Features** - Comments and sharing to Twitter/Farcaster
- **PWA Support** - Installable app with offline capability
- **Full Accessibility** - WCAG AA compliant, keyboard navigation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/
│   ├── cards/              # Market and portfolio cards
│   ├── charts/             # Data visualization components
│   ├── layout/             # Header, footer, navigation
│   ├── market/             # Market-related components
│   └── ui/                 # Reusable UI components
├── pages/                  # Route components
├── hooks/                  # Custom React hooks
├── config/                 # Configuration files
├── styles/                 # Design system and animations
├── utils/                  # Helper functions
└── types.ts                # TypeScript definitions
```

## 🎯 Key Technologies

- **React 19.1** - UI framework with latest features
- **TypeScript 5.9** - Type safety with strict mode
- **Vite 7.1** - Lightning-fast build tool
- **Wagmi 2.17** - Ethereum React hooks
- **Viem 2.37** - TypeScript Ethereum interface
- **TanStack Query 5.90** - Data fetching and caching
- **Tailwind CSS 4.1** - Utility-first styling
- **DaisyUI 5.1** - Component library
- **Recharts 3.4** - Data visualization
- **React Router 7.9** - Client-side routing
- **@tanstack/react-virtual 3.13** - Virtual scrolling

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_FOOTBALL_DATA_API_KEY_1=your_api_key_1
VITE_FOOTBALL_DATA_API_KEY_2=your_api_key_2
VITE_FOOTBALL_DATA_API_KEY_3=your_api_key_3
VITE_FOOTBALL_DATA_API_KEY_4=your_api_key_4
VITE_FOOTBALL_DATA_API_KEY_5=your_api_key_5
```

### Network Configuration

The app connects to Polkadot Asset Hub Testnet (Paseo):
- Chain ID: 420420422
- Native Token: PAS

## 📚 Documentation

- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Complete development roadmap
- [Redesign Summary](./docs/REDESIGN_COMPLETE.md) - Feature overview
- [Cleanup Summary](./docs/CLEANUP_SUMMARY.md) - Project reorganization details

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start dev server (localhost:5173)
npm run build        # TypeScript compile + Vite build
npm run preview      # Preview production build
npm run lint         # ESLint with auto-fix
```

### Code Style

- ESLint with @antfu/eslint-config
- TypeScript strict mode
- Automatic formatting on save

## 🌐 Deployment

### Build Output

```bash
npm run build
```

Outputs to `dist/` directory:
- Optimized bundle with code splitting
- Service worker for PWA
- Static assets

### Hosting

Deploy to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- IPFS

## 🔐 Security

- No private keys stored in frontend
- All transactions require wallet approval
- Contract addresses verified on-chain
- API keys rotated automatically

## 📱 PWA Features

- Installable on mobile and desktop
- Offline capability with service worker
- App manifest for native-like experience
- Push notifications (future)

## ♿ Accessibility

- WCAG AA compliant
- Keyboard navigation support
- Screen reader compatible
- Reduced motion support
- Skip to main content link

## 🎨 Design System

### Color Palette

- Primary: `#00D4FF` (Cyan)
- Success: `#00FF88` (Green)
- Danger: `#FF3366` (Red)
- Warning: `#FFB800` (Amber)
- Background: `#0B0E11` (Dark)

### Typography

- System fonts for optimal performance
- Monospace for code and addresses

## 📊 Performance

- Code splitting per route (MarketDetail, MyMarkets, Leaderboard)
- Lazy loading for pages with Suspense boundaries
- Virtual scrolling auto-activates for >20 markets
- Real-time updates with 10-second polling
- Optimistic UI updates for instant feedback
- Service worker caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Smart Contracts](../hardhat/) - Solidity contracts
- [Documentation](./docs/) - Full implementation guides
- [Polkadot](https://polkadot.network/) - Network information

## 💬 Support

For issues and questions:
- Open an issue on GitHub
- Join our Discord community
- Check the documentation

---

Built with ❤️ for the Polkadot ecosystem
