# Design Document

## Overview

This design outlines the migration of CryptoScore from a Solana-based web3 decentralized application to a web2 application using Supabase as the backend. The migration will replace all blockchain functionality with traditional database operations while maintaining the same user experience and feature set. Crossmint will continue to provide authentication but will create EVM wallets instead of Solana wallets to prepare for future MNEE token integration.

The migration involves three main architectural changes:
1. **Backend Migration**: Replace Solana programs (Factory, Market, Dashboard) with Supabase database tables and functions
2. **Authentication Update**: Modify Crossmint integration to create EVM wallets instead of Solana wallets
3. **Code Cleanup**: Remove all Solana dependencies, configurations, and related code

## Architecture

### Current Architecture (Solana-based)
```
Frontend (React) → Solana Programs (Factory/Market/Dashboard) → Blockchain State
                ↘ Crossmint (Solana Wallets) → Social Auth
```

### New Architecture (Supabase-based)
```
Frontend (React) → Supabase Database → PostgreSQL Tables
                ↘ Crossmint (EVM Wallets) → Social Auth
                ↘ Supabase Real-time → Live Updates
```

### Database Schema Design

The Supabase database will replicate the functionality of the three Solana programs:

**Users Table** (replaces user account data)
- `id` (UUID, primary key)
- `wallet_address` (text, EVM wallet from Crossmint)
- `email` (text, from Crossmint auth)
- `display_name` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Markets Table** (replaces Factory program functionality)
- `id` (UUID, primary key)
- `creator_id` (UUID, foreign key to users)
- `title` (text)
- `description` (text)
- `entry_fee` (decimal)
- `end_time` (timestamp)
- `status` (enum: active, resolved, cancelled)
- `resolution_outcome` (text, nullable)
- `total_pool` (decimal)
- `platform_fee_percentage` (decimal)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**Participants Table** (replaces Market program participant data)
- `id` (UUID, primary key)
- `market_id` (UUID, foreign key to markets)
- `user_id` (UUID, foreign key to users)
- `prediction` (text)
- `entry_amount` (decimal)
- `potential_winnings` (decimal)
- `actual_winnings` (decimal, nullable)
- `joined_at` (timestamp)

**Transactions Table** (replaces blockchain transaction history)
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key to users)
- `market_id` (UUID, foreign key to markets, nullable)
- `type` (enum: market_entry, winnings, platform_fee)
- `amount` (decimal)
- `description` (text)
- `created_at` (timestamp)

**Platform_Config Table** (replaces program configuration)
- `key` (text, primary key)
- `value` (jsonb)
- `updated_at` (timestamp)

## Components and Interfaces

### Supabase Client Configuration

Replace Solana connection configuration with Supabase client:

```typescript
// New: app/src/config/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
```

### Database Service Layer

Create service layer to replace Solana program interactions:

```typescript
// New: app/src/lib/supabase/market-service.ts
export class MarketService {
  async createMarket(marketData: CreateMarketData): Promise<Market>
  async getMarkets(filters?: MarketFilters): Promise<Market[]>
  async joinMarket(marketId: string, userId: string, prediction: string): Promise<Participant>
  async resolveMarket(marketId: string, outcome: string): Promise<void>
  async getUserParticipation(userId: string): Promise<Participant[]>
}
```

### Real-time Subscriptions

Replace Solana WebSocket connections with Supabase real-time:

```typescript
// Updated: app/src/hooks/useRealtimeMarkets.ts
export function useRealtimeMarkets() {
  useEffect(() => {
    const subscription = supabase
      .channel('markets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'markets' },
        handleMarketChange
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])
}
```

### Crossmint EVM Integration

Update Crossmint configuration for EVM wallets:

```typescript
// Updated: app/src/config/crossmint.ts
export const CROSSMINT_WALLET_CONFIG = {
  chain: 'ethereum' as const, // Changed from 'solana'
  signer: {
    type: 'passkey' as const, // EVM supports passkey
  },
}
```

## Data Models

### TypeScript Interfaces

```typescript
// Updated: app/src/types/index.ts
export interface User {
  id: string
  wallet_address: string // EVM address
  email: string
  display_name?: string
  created_at: string
  updated_at: string
}

export interface Market {
  id: string
  creator_id: string
  title: string
  description: string
  entry_fee: number
  end_time: string
  status: 'active' | 'resolved' | 'cancelled'
  resolution_outcome?: string
  total_pool: number
  platform_fee_percentage: number
  created_at: string
  updated_at: string
  participants?: Participant[]
}

export interface Participant {
  id: string
  market_id: string
  user_id: string
  prediction: string
  entry_amount: number
  potential_winnings: number
  actual_winnings?: number
  joined_at: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Based on the prework analysis, I'll focus on the most critical properties that ensure the migration maintains system correctness:

**Property 1: Solana Connection Elimination**
*For any* application startup sequence, the system should not attempt to connect to any Solana RPC endpoints or blockchain networks
**Validates: Requirements 1.1**

**Property 2: Database Storage Consistency**
*For any* market operation (create, join, resolve), all data should be persisted to Supabase database tables rather than blockchain accounts
**Validates: Requirements 1.2, 3.1, 3.2, 3.3**

**Property 3: EVM Wallet Creation**
*For any* user authentication completion, the system should create an EVM wallet address (starting with 0x) instead of a Solana wallet address
**Validates: Requirements 2.2**

**Property 4: Authentication Data Persistence**
*For any* successful user login, the system should create or update a user profile record in Supabase containing the EVM wallet address
**Validates: Requirements 2.5**

**Property 5: Market Data Consistency**
*For any* market creation, the system should collect and store the same information fields (title, description, entry fee, end time) in Supabase as the original Solana implementation
**Validates: Requirements 4.1**

**Property 6: Real-time Update Source**
*For any* real-time market update, the notification should originate from Supabase real-time subscriptions rather than Solana WebSocket connections
**Validates: Requirements 3.5, 6.1**

**Property 7: Winnings Calculation Preservation**
*For any* market resolution, the system should calculate winnings using the same mathematical logic and store results in the database
**Validates: Requirements 4.4**

**Property 8: Fee Structure Consistency**
*For any* platform fee calculation, the system should apply the same percentage-based fee structure as the original implementation
**Validates: Requirements 8.1, 8.3**

**Property 9: Bundle Size Reduction**
*For any* application build, the resulting bundle should be smaller than the original due to removed Solana dependencies
**Validates: Requirements 10.3**

**Property 10: Response Time Improvement**
*For any* user market interaction, the system should provide faster response times compared to blockchain transaction confirmation delays
**Validates: Requirements 10.4**

## Error Handling

### Database Connection Errors
- Implement connection retry logic with exponential backoff
- Provide fallback UI states when Supabase is unavailable
- Cache critical data locally using TanStack Query for offline resilience

### Authentication Errors
- Handle Crossmint authentication failures gracefully
- Provide clear error messages for wallet creation issues
- Implement session recovery mechanisms

### Real-time Subscription Errors
- Automatically reconnect dropped Supabase real-time connections
- Implement fallback polling for critical updates
- Handle subscription limit exceeded scenarios

### Data Validation Errors
- Validate all user inputs before database operations
- Implement proper error boundaries for UI components
- Provide meaningful error messages for validation failures

## Testing Strategy

### Unit Testing
- Test individual service functions for database operations
- Test utility functions for data transformation and validation
- Test React components with mocked Supabase client
- Test Crossmint integration with mocked authentication flows

### Property-Based Testing
The system will use **fast-check** as the property-based testing library for JavaScript/TypeScript. Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.

Property-based tests will be tagged with comments referencing the design document properties using the format: **Feature: web2-migration, Property {number}: {property_text}**

### Integration Testing
- Test complete user workflows from authentication to market participation
- Test real-time subscription behavior with actual Supabase connections
- Test database schema migrations and data integrity
- Test error handling scenarios with network failures

### Performance Testing
- Benchmark database query performance against requirements
- Test real-time subscription scalability
- Measure bundle size reduction compared to Solana version
- Test response time improvements for user interactions

### Migration Validation Testing
- Verify complete removal of Solana dependencies
- Test that all original features work with Supabase backend
- Validate data consistency between old and new implementations
- Test EVM wallet integration with Crossmint