# CryptoScore

Web2 sports prediction markets with Supabase backend and EVM wallet integration. Built with React and TypeScript.

🎥 **[Watch Demo](https://youtu.be/kkQOds2JSD4)** - See CryptoScore in action

## Architecture

- **Frontend** (`/app/`) - React TypeScript application with Supabase integration
- **Backend** - Supabase PostgreSQL database with real-time subscriptions
- **Authentication** - Crossmint social login with EVM wallet creation

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+) + npm
- [Supabase Account](https://supabase.com) - For database and backend services
- [Crossmint Account](https://www.crossmint.com/console) - For authentication and EVM wallets

### Setup

```bash
# Install dependencies
npm install

# Configure environment for development
npm run configure:development

# Set up Supabase connection
npm run setup:supabase

# Start development server
npm run dev
```

### Environment Configuration

Configure your environment variables in the appropriate `.env` file:

```bash
# For development
cp .env.development .env
# Edit .env with your Supabase and Crossmint credentials

# For staging
npm run configure:staging

# For production  
npm run configure:production
```

## Deployment

Deploy to different environments:

```bash
# Development (local build)
npm run deploy:development

# Staging environment
npm run deploy:staging

# Production environment
npm run deploy:production
```

## Scripts

**Development**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

**Environment Management**
- `npm run configure:development` - Set development environment
- `npm run configure:staging` - Set staging environment
- `npm run configure:production` - Set production environment
- `npm run configure:list` - List all environments
- `npm run configure:current` - Show current environment

**Deployment**
- `npm run deploy:development` - Deploy to development
- `npm run deploy:staging` - Deploy to staging
- `npm run deploy:production` - Deploy to production

**Database & Backend**
- `npm run setup:supabase` - Configure Supabase connection
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with test data

## Configuration

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Run the SQL migrations in `app/supabase/migrations/`
4. Configure Row Level Security (RLS) policies

### Crossmint Setup

1. Create an account at [crossmint.com/console](https://www.crossmint.com/console)
2. Create a project and get your Client API Key
3. Configure for EVM wallet creation (not Solana)

### Environment Variables

Required variables for each environment:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Crossmint Configuration (EVM wallets)
VITE_CROSSMINT_CLIENT_API_KEY=your_crossmint_api_key
VITE_CROSSMINT_ENVIRONMENT=staging|production

# Database Configuration
VITE_DB_POOL_SIZE=10
VITE_DB_TIMEOUT=30000

# Real-time Configuration
VITE_REALTIME_EVENTS_PER_SECOND=10
VITE_REALTIME_HEARTBEAT_INTERVAL=30000

# Platform Configuration
VITE_PLATFORM_FEE_PERCENTAGE=5.0
VITE_MIN_MARKET_DURATION_HOURS=1
VITE_MAX_MARKET_DURATION_DAYS=30

# Optional: Sports data and exchange rates
VITE_FOOTBALL_DATA_API_KEY_1=your_api_key
VITE_COINGECKO_API_KEY=your_api_key
```

## Migration from Solana

This application has been migrated from a Solana-based web3 architecture to a web2 architecture using Supabase. Key changes:

- **Blockchain → Database**: All market data now stored in Supabase PostgreSQL
- **Solana Wallets → EVM Wallets**: Crossmint now creates EVM wallets for future MNEE token integration
- **Program Calls → API Calls**: Market operations use database transactions instead of blockchain transactions
- **WebSocket → Real-time**: Supabase real-time subscriptions replace Solana WebSocket connections

## Features

- **Market Creation**: Create prediction markets with customizable parameters
- **Social Login**: Google, Twitter, Farcaster, Email authentication via Crossmint
- **Real-time Updates**: Live market data and participant notifications
- **Portfolio Management**: Track performance, P&L, and win rates
- **Multi-theme UI**: 6 professional themes with instant switching
- **PWA Support**: Installable progressive web app

## Database Schema

The Supabase database includes these main tables:

- **users** - User profiles with EVM wallet addresses
- **markets** - Prediction markets with metadata and status
- **participants** - User participation and predictions
- **transactions** - Transaction history and winnings
- **platform_config** - Platform configuration settings

## Security

- Row Level Security (RLS) policies protect user data
- EVM wallet addresses stored securely in user profiles
- No private keys stored in frontend
- Environment-specific configuration for different deployment stages