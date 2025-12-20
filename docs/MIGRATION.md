# CryptoScore Web3 to Web2 Migration Guide

This document outlines the complete migration of CryptoScore from a Solana-based web3 decentralized application to a web2 application using Supabase as the backend.

## Migration Overview

### Before (Web3 Architecture)
```
Frontend (React) → Solana Programs → Blockchain State
                ↘ Crossmint (Solana Wallets) → Social Auth
                ↘ WebSocket → Solana RPC
```

### After (Web2 Architecture)
```
Frontend (React) → Supabase Database → PostgreSQL
                ↘ Crossmint (EVM Wallets) → Social Auth
                ↘ Real-time → Supabase Subscriptions
```

## Key Changes

### 1. Backend Migration

**From: Solana Programs**
- Factory Program (market creation)
- Market Program (participation, resolution)
- Dashboard Program (data aggregation)

**To: Supabase Database**
- PostgreSQL tables with proper schema
- Database functions for complex operations
- Row Level Security (RLS) for data protection

### 2. Authentication Update

**From: Solana Wallets**
- Phantom, Solflare wallet connections
- Solana wallet addresses (base58 format)
- Blockchain-based identity

**To: EVM Wallets**
- Crossmint social login (Google, Twitter, Email)
- EVM wallet addresses (0x format)
- Database-stored user profiles

### 3. Data Storage

**From: Blockchain Accounts**
- Market data stored in program accounts
- Participant data in blockchain state
- Immutable transaction history

**To: Database Tables**
- Structured relational data
- Efficient queries and indexing
- Mutable data with audit trails

### 4. Real-time Updates

**From: WebSocket Connections**
- Direct connection to Solana RPC
- Account change subscriptions
- Manual connection management

**To: Supabase Real-time**
- PostgreSQL change streams
- Automatic reconnection handling
- Optimized subscription patterns

## Database Schema Migration

### Users Table
Replaces Solana wallet-based identity:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE, -- EVM address (0x format)
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Markets Table
Replaces Factory program market registry:

```sql
CREATE TABLE markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  entry_fee DECIMAL(10,2) NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT CHECK (status IN ('active', 'resolved', 'cancelled')) DEFAULT 'active',
  resolution_outcome TEXT,
  total_pool DECIMAL(10,2) DEFAULT 0,
  platform_fee_percentage DECIMAL(5,2) DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Participants Table
Replaces Market program participant accounts:

```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID REFERENCES markets(id),
  user_id UUID REFERENCES users(id),
  prediction TEXT NOT NULL,
  entry_amount DECIMAL(10,2) NOT NULL,
  potential_winnings DECIMAL(10,2) NOT NULL,
  actual_winnings DECIMAL(10,2),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(market_id, user_id)
);
```

### Transactions Table
Replaces blockchain transaction history:

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  market_id UUID REFERENCES markets(id),
  type TEXT CHECK (type IN ('market_entry', 'winnings', 'platform_fee', 'creator_reward')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Code Changes

### 1. Removed Dependencies

**Solana Packages:**
```json
// Removed from package.json
"@solana/web3.js": "^1.87.6",
"@solana/wallet-adapter-base": "^0.9.23",
"@solana/wallet-adapter-react": "^0.15.35",
"@coral-xyz/anchor": "^0.30.1"
```

**Anchor Framework:**
- All IDL files removed
- Program interaction code removed
- Anchor client configurations removed

### 2. Added Dependencies

**Supabase Integration:**
```json
// Added to package.json
"@supabase/supabase-js": "^2.89.0"
```

**Enhanced Crossmint:**
- Updated to support EVM wallet creation
- Maintained social login functionality

### 3. Configuration Updates

**Before (Solana):**
```typescript
// solana.ts
export const SOLANA_NETWORK = "devnet";
export const RPC_URL = "https://api.devnet.solana.com";
export const PROGRAM_IDS = {
  factory: "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP",
  market: "94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ",
  dashboard: "95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR"
};
```

**After (Supabase):**
```typescript
// supabase.ts
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    realtime: {
      params: { eventsPerSecond: 10 }
    }
  }
);
```

### 4. Hook Updates

**Before (Solana):**
```typescript
// useMarketData.ts
const { data: markets } = useQuery({
  queryKey: ['markets'],
  queryFn: async () => {
    const program = getFactoryProgram();
    return await program.account.market.all();
  }
});
```

**After (Supabase):**
```typescript
// useSupabaseMarketData.ts
const { data: markets } = useQuery({
  queryKey: ['markets'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'active');
    if (error) throw error;
    return data;
  }
});
```

## Environment Configuration

### Development Environment
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key

# Crossmint Configuration (EVM)
VITE_CROSSMINT_CLIENT_API_KEY=your_staging_key
VITE_CROSSMINT_ENVIRONMENT=staging

# Database Configuration
VITE_DB_POOL_SIZE=10
VITE_DB_TIMEOUT=30000

# Real-time Configuration
VITE_REALTIME_EVENTS_PER_SECOND=10
```

### Production Environment
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Crossmint Configuration (EVM)
VITE_CROSSMINT_CLIENT_API_KEY=your_production_key
VITE_CROSSMINT_ENVIRONMENT=production

# Performance Configuration
VITE_QUERY_CACHE_TIME=600000
VITE_QUERY_STALE_TIME=300000
```

## Deployment Changes

### Before (Solana Deployment)
```bash
# Build Solana programs
anchor build

# Deploy to blockchain
anchor deploy --provider.cluster devnet

# Export IDLs to frontend
anchor idl init <program-id> --filepath target/idl/program.json
```

### After (Web2 Deployment)
```bash
# Configure environment
npm run configure:production

# Build frontend
npm run build

# Deploy to hosting platform
npm run deploy:production
```

## Feature Parity

All original features have been maintained:

### ✅ Market Creation
- Same form fields and validation
- Database storage instead of blockchain accounts
- Immediate confirmation (no transaction delays)

### ✅ Market Participation
- Same user experience for joining markets
- Database transactions instead of blockchain transactions
- Real-time updates via Supabase subscriptions

### ✅ Portfolio Management
- Same metrics and calculations
- Database queries for aggregation
- Improved performance with proper indexing

### ✅ Real-time Updates
- Same live data experience
- Supabase real-time instead of WebSocket
- Better connection management and reliability

### ✅ Authentication
- Same social login options (Google, Twitter, Email)
- EVM wallets instead of Solana wallets
- Prepared for future MNEE token integration

## Benefits of Migration

### 1. Performance Improvements
- **Faster Transactions**: No blockchain confirmation delays
- **Better Caching**: TanStack Query with database responses
- **Reduced Bundle Size**: Removed heavy Solana dependencies

### 2. Cost Reduction
- **No Transaction Fees**: Database operations are free
- **Lower Infrastructure Costs**: Traditional hosting vs blockchain
- **Reduced Complexity**: Simpler deployment and maintenance

### 3. User Experience
- **Instant Feedback**: Immediate response to user actions
- **No Wallet Setup**: Social login without wallet installation
- **Better Reliability**: Database uptime vs blockchain network issues

### 4. Developer Experience
- **Faster Development**: Traditional database queries vs program calls
- **Better Debugging**: Standard database tools and logging
- **Easier Testing**: Local database vs blockchain testing

## Migration Checklist

### ✅ Completed Tasks
- [x] Database schema design and implementation
- [x] Supabase client configuration
- [x] User authentication with EVM wallets
- [x] Market creation functionality
- [x] Market participation system
- [x] Real-time subscriptions
- [x] Portfolio and dashboard features
- [x] Solana dependency removal
- [x] Environment configuration
- [x] Deployment scripts
- [x] Documentation updates

### 🔄 Ongoing Tasks
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Comprehensive testing
- [ ] Production deployment

## Future Considerations

### MNEE Token Integration
The EVM wallet infrastructure is prepared for future token integration:

- EVM wallet addresses stored in database
- Transaction history structure supports token operations
- Crossmint EVM integration ready for token transfers

### Scalability
The new architecture supports better scalability:

- Database horizontal scaling options
- CDN integration for static assets
- Real-time subscription optimization

### Analytics
Enhanced analytics capabilities:

- Direct database queries for insights
- Real-time metrics and monitoring
- User behavior tracking and analysis

## Support and Resources

- **Supabase Documentation**: https://supabase.com/docs
- **Crossmint Documentation**: https://docs.crossmint.com
- **Migration Issues**: Check project repository issues
- **Database Schema**: See `app/supabase/migrations/`
- **Environment Setup**: See `docs/DEPLOYMENT.md`