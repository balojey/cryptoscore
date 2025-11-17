# **[CryptoScore — Decentralized Sports Predictive Markets** ⚽📈](https://cryptoscore.vercel.app/)

A Polkadot-powered onchain predictive sports market platform

CryptoScore is a fully on-chain predictive markets dApp where users create, join, and resolve football-based prediction markets backed by live match data. Built on Polkadot and powered by a modular smart contract architecture, CryptoScore delivers an intuitive, fast, trustless way for communities to speculate on match outcomes.

This repository contains **two major codebases**:

* **`hardhat/`** → Smart contracts
* **`dapp-react/`** → Frontend dApp written in React + Wagmi + Vite

---

## 🚀 Features

### **For Users**

* Create **public or private** prediction markets
* Join open markets before match kickoff
* Automatic match data enrichment using Football-Data.org API
* Participate, resolve, and withdraw rewards transparently
* Track personal activity: created markets, joined markets, resolved markets

### **For Community**

* View paginated public markets created across the ecosystem
* Lightweight UI with smooth UX and clear data presentation
* Zero-trust architecture: all rules and payouts handled on-chain

### **Developer Highlights**

* Multi-contract architecture (Factory → Dashboard → Market Contracts)
* Fully typed ABIs
* Custom hooks for match-data fetching
* Clean file structure for scaling

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

* React + TypeScript
* Wagmi (Polkadot connector)
* Vite
* TailwindCSS
* Custom Match Data Hook (`useMatchData.ts`)

### **Key UI Concepts**

* **Markets Modal** for creating markets
* **PublicMarketCard** and **MarketInfoCard** for clean market display
* **Content** page as the entrypoint for browsing active markets
* **MyMarkets** route for user-specific market activity
* **MarketDetail** page with dynamic actions:

  * Join Market
  * Resolve Market
  * Withdraw
  * Closed/Disabled states

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

## 🎨 UI/UX Design System

CryptoScore uses a custom AI-ready design language built around:

* CryptoScore Blue & Pitch Green
* Inter typography
* Rounded, soft, high-contrast components
* Market state correctness rules
* Professional, finance-grade visual cues

(See the system prompt in your design folder for full DLS specs.)

---

## 🤝 Contribution

PRs, issues, and forks are welcome.
The goal is a universal, open-source sports prediction protocol.

---

## 🛡️ License

MIT License.

CryptoScore is open, transparent, verifiable, and community-centric.