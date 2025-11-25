# [CryptoScore — Decentralized Sports Prediction Markets ⚽📈](https://cryptoscore.vercel.app/)

A professional Web3 trading terminal for football prediction markets on Polkadot

CryptoScore is a fully on-chain prediction markets platform where users create, join, and resolve football-based prediction markets backed by live match data. Built on Polkadot Asset Hub with a modular smart contract architecture, CryptoScore delivers a professional trading experience with advanced analytics, real-time updates, and customizable theming.

This repository contains **two major codebases**:

* **`hardhat/`** → Smart contracts
* **`dapp-react/`** → Frontend dApp written in React + Wagmi + Vite

---

## 🚀 Features

### **Theming & Personalization**
* **6 Professional Themes** - Dark Terminal (default), Ocean Blue, Forest Green, Sunset Orange, Purple Haze, Light Mode
* **Instant Theme Switching** - Via UI dropdown or keyboard shortcut (Ctrl+Shift+T)
* **Persistent Preferences** - Theme saved to localStorage
* **WCAG AA Compliant** - All themes maintain accessibility standards

### **Market Operations**
* Create **public or private** prediction markets for football matches
* Join open markets before match kickoff with entry fees
* Automatic match data enrichment using Football-Data.org API
* Automatic resolution based on match outcomes
* Reward distribution with 1% creator fee and 1% platform fee
* Win celebrations with confetti animations

### **Dashboard & Analytics**
* **Portfolio Dashboard** - Track total value, P&L, win rate, active positions
* **Performance Charts** - Visualize wins/losses over time
* **Recent Activity Feed** - Latest market actions
* **Advanced Filtering** - Status, time range, pool size, entry fee
* **Real-Time Updates** - 10-second polling with toast notifications

### **Data Visualizations**
* **Prediction Distribution** - Pie charts showing HOME/DRAW/AWAY split
* **Pool Trends** - Line charts tracking pool size growth
* **Market Analytics** - Comprehensive stats and metrics

### **Social Features**
* **Leaderboard** - Top 50 traders across 4 categories (win rate, earnings, activity, streak)
* **Market Comments** - Discussion section with prediction tags
* **Social Sharing** - Share predictions to Twitter and Farcaster

### **Performance & UX**
* **Virtual Scrolling** - Smooth performance with 1000+ markets (auto-activates >20)
* **Code Splitting** - Lazy loading for routes
* **PWA Support** - Installable app with offline capability
* **Full Accessibility** - WCAG AA compliant, keyboard navigation, screen reader support

---

## 🏗️ Repository Structure

```
.
├── dapp-react               # Frontend dApp
│   ├── abi                  # Contract ABIs
│   ├── components           # Reusable UI components
│   ├── config               # Wagmi + contract configs
│   ├── hooks                # React hooks (match data, etc.)
│   ├── pages                # App routes (MyMarkets, MarketDetail)
│   ├── utils                # Helpers (chain config, formatters, etc.)
│   └── ...
│
├── hardhat                  # Smart contracts suite
│   ├── contracts            # Core contracts
│   ├── ignition             # Deployment modules
│   ├── scripts              # Interaction utilities
│   └── ...
│
├── HOWTO.md                 # Developer instructions & examples
├── README.md                # Root documentation (you are reading this)
└── ...
```

---

## 🧠 Architecture Overview

CryptoScore uses a **factory-driven contract model**:

### **1. CryptoScoreFactory.sol**

* Creates new market contracts
* Tracks all markets system-wide
* Emits indexed events for dashboard indexing

### **2. CryptoScoreMarket.sol**

A self-contained prediction market contract:

* Stores creator, participants, entry fee, metadata, match ID
* Tracks state (open, closed, resolved)
* Distributes rewards on resolution

### **3. CryptoScoreDashboard.sol**

* Aggregates market information across contracts
* Exposes public + private markets
* Provides user-centric data queries (created & joined markets)

---

## 🖥️ Frontend Overview (`dapp-react/`)

### **Frameworks & Core Tools**

* React 19.1 + TypeScript 5.9
* Wagmi 2.17 (React hooks for Ethereum)
* Viem 2.37 (TypeScript Ethereum interface)
* Vite 7.1 (Build tool)
* Tailwind CSS 4.1 (Styling)
* TanStack Query 5.90 (Data fetching/caching)
* React Router 7.9 (Routing)
* Recharts 3.4 (Data visualization)
* @tanstack/react-virtual 3.13 (Virtual scrolling)

### **Design System**

* **6 Theme Presets** - Instant switching with CSS variables
* **40+ Design Tokens** - Colors, spacing, shadows, typography (all theme-aware)
* **30+ Component Classes** - Reusable styled components
* **Comprehensive Animations** - Fade, slide, scale, pulse, shimmer effects
* **Glassmorphism** - Backdrop blur effects with theme-appropriate overlays
* **Typography** - System fonts with monospace code display

---

## 🔧 Local Development

### **Prerequisites**

Ensure you have:

* Node.js ≥ 18
* Yarn or npm
* Polkadot.js browser extension
* Football-Data.org API key (free tier works)

---

### **1. Install Dependencies**

Root packages:

```bash
npm install
```

Frontend:

```bash
cd dapp-react
npm install
```

Hardhat:

```bash
cd hardhat
npm install
```

---

### **2. Compile Contracts**

```bash
cd hardhat
npm run compile
```

---

### **3. Deploy Contracts Using Ignition**

```bash
npx run deploy
```

Deployment addresses will appear in console output.

---

See [HOWTO.md](./HOWTO.md) for more setup guide

### **4. Start the dApp**

```bash
cd dapp-react
npm run dev
```

Visit:
`http://localhost:5173/`

---

## 🔑 Environment Variables

Create a `.env` in `dapp-react/` with:

```
VITE_FOOTBALL_DATA_API_KEY_1=your_football_data_org_api_key
VITE_FOOTBALL_DATA_API_KEY_2=your_football_data_org_api_key
VITE_FOOTBALL_DATA_API_KEY_3=your_football_data_org_api_key
VITE_FOOTBALL_DATA_API_KEY_4=your_football_data_org_api_key
VITE_FOOTBALL_DATA_API_KEY_5=your_football_data_org_api_key
```

---

## 🧪 Hardhat Scripts

### Show accounts:

```bash
npm run accounts
```

### Interact with CryptoScore:

```bash
npm run interact
```

---

## 🎨 Design System

### **Theme System**

6 professionally designed themes with instant switching:

| Theme | Description | Best For |
|-------|-------------|----------|
| **Dark Terminal** | Professional trader theme with neon accents | Default, extended trading sessions |
| **Ocean Blue** | Deep blue oceanic palette | Cool color preference |
| **Forest Green** | Nature-inspired green theme | Reduced eye strain |
| **Sunset Orange** | Warm sunset colors | Evening use, warm preference |
| **Purple Haze** | Vibrant purple and pink | Creative users, unique aesthetic |
| **Light Mode** | Clean light theme with subtle shadows | Bright environments, daytime |

**Features:**
* Instant switching via UI or keyboard (Ctrl+Shift+T)
* localStorage persistence
* Theme-specific shadows and colors
* WCAG AA compliant (4.5:1 contrast ratio)
* All components use CSS variables for theming

### **Design Tokens**

* **40+ Tokens** - Colors, spacing, shadows, typography (all theme-aware)
* **30+ Component Classes** - Buttons, cards, badges, stats, utilities
* **Animation Library** - Fade, slide, scale, pulse, shimmer, bounce, shake
* **Glassmorphism** - Backdrop blur effects with theme overlays
* **Typography** - System fonts with monospace for addresses/code

---

## 🤝 Contribution

PRs, issues, and forks are welcome.
The goal is a universal, open-source sports prediction protocol.

---

## 🛡️ License

MIT License.

CryptoScore is open, transparent, verifiable, and community-centric.