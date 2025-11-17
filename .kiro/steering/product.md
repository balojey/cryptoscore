# CryptoScore Product Overview

CryptoScore is a fully on-chain decentralized sports predictive markets platform built on Polkadot. Users can create, join, and resolve football-based prediction markets backed by live match data from Football-Data.org API.

## Core Features

- **Market Creation**: Users create public or private prediction markets for football matches
- **Market Participation**: Join open markets before match kickoff with entry fees
- **Automatic Resolution**: Markets resolve based on match outcomes (HOME/AWAY/DRAW)
- **Reward Distribution**: Winners split the pool with 1% creator fee and 1% platform fee
- **User Dashboard**: Track created, joined, and resolved markets

## Architecture

The platform uses a factory-driven smart contract model:

- **CryptoScoreFactory**: Deploys and tracks all market contracts system-wide
- **CryptoScoreMarket**: Self-contained prediction market with state management
- **CryptoScoreDashboard**: Aggregates market data for public/private views

## Target Network

- **Primary**: Polkadot Asset Hub Testnet (Paseo)
- **Chain ID**: 420420422
- **Native Token**: PAS (Paseo Token)
