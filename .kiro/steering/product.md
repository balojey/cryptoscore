# CryptoScore Product Overview

CryptoScore is a decentralized sports prediction market platform built on Solana blockchain. Users can create, join, and resolve prediction markets for sports events with real money stakes.

## Core Features

- **Prediction Markets**: Create markets for sports events with customizable entry fees and time windows
- **Social & Wallet Login**: Support for traditional Solana wallets (Phantom, Solflare) and social login via Crossmint (Google, Twitter, Farcaster, Email)
- **Real-time Trading Terminal**: Professional Web3 interface with live market data and WebSocket integration
- **Portfolio Management**: Track performance, P&L, win rates, and market participation
- **Multi-theme UI**: 6 professional themes including Dark Terminal, Ocean Blue, Forest Green, Sunset Orange, Purple Haze, and Light Mode
- **PWA Support**: Installable progressive web app with offline capability

## Architecture

The platform uses a modular three-program architecture on Solana:

1. **Factory Program**: Market creation and registry management
2. **Market Program**: Core prediction logic, participant management, and reward distribution
3. **Dashboard Program**: Data aggregation and analytics queries

## Target Users

- Sports betting enthusiasts seeking decentralized alternatives
- Crypto traders interested in prediction markets
- Web3 users wanting social login integration
- Mobile users via PWA installation

## Business Model

Platform earns fees from market creation and resolution (configurable, max 10% = 1000 basis points).