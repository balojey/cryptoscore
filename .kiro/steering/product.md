# CryptoScore Product Overview

CryptoScore is a fully on-chain decentralized sports prediction markets platform built on Polkadot Asset Hub. A professional Web3 trading terminal for football prediction markets with advanced analytics, real-time updates, and social features.

## Core Features

### Market Operations
- **Market Creation**: Users create public or private prediction markets for football matches
- **Market Participation**: Join open markets before match kickoff with entry fees
- **Automatic Resolution**: Markets resolve based on match outcomes (HOME/AWAY/DRAW)
- **Reward Distribution**: Winners split the pool with 1% creator fee and 1% platform fee
- **Win Celebrations**: Confetti animations on successful withdrawals

### Dashboard & Analytics
- **Portfolio Dashboard**: Track total value, P&L, win rate, and active positions
- **Performance Charts**: Visualize wins/losses over time
- **Recent Activity**: Feed of latest market actions
- **Advanced Filtering**: Filter by status, time range, pool size, entry fee
- **Real-Time Updates**: 10-second polling with toast notifications

### Data Visualizations
- **Prediction Distribution**: Pie charts showing HOME/DRAW/AWAY split
- **Pool Trends**: Line charts tracking pool size growth
- **Market Analytics**: Comprehensive stats and metrics

### Social Features
- **Leaderboard**: Top 50 traders across 4 categories (win rate, earnings, activity, streak)
- **Market Comments**: Discussion section with prediction tags
- **Social Sharing**: Share predictions to Twitter and Farcaster
- **Copy Link**: Quick sharing functionality

### Performance & UX
- **Virtual Scrolling**: Smooth performance with 1000+ markets (auto-activates >20)
- **Dark Terminal Theme**: Professional trader-focused design with glassmorphism
- **PWA Support**: Installable progressive web app with offline capability
- **Full Accessibility**: WCAG AA compliant, keyboard navigation, screen reader support
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Architecture

The platform uses a factory-driven smart contract model:

- **CryptoScoreFactory**: Deploys and tracks all market contracts system-wide
- **CryptoScoreMarket**: Self-contained prediction market with state management
- **CryptoScoreDashboard**: Aggregates market data for public/private views

## Target Network

- **Primary**: Polkadot Asset Hub Testnet (Paseo)
- **Chain ID**: 420420422
- **Native Token**: PAS (Paseo Token)
