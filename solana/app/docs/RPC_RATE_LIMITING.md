# Solana RPC Rate Limiting Guide

## Problem

The Solana public RPC endpoints have rate limits:
- **Devnet:** ~100 requests per 10 seconds
- **Mainnet:** Varies by provider

Error: `429 Too Many Requests`

## Solutions Implemented

### 1. Multiple RPC Endpoints with Fallback

**File:** `src/config/solana.ts`

```typescript
export const RPC_ENDPOINTS = {
  devnet: [
    'https://api.devnet.solana.com',           // Primary
    'https://devnet.helius-rpc.com/?api-key=demo', // Fallback 1
    'https://rpc.ankr.com/solana_devnet',      // Fallback 2
  ],
}
```

**Features:**
- Automatic fallback to next endpoint on failure
- Health check before using endpoint
- Load balancing across endpoints

### 2. Rate Limiting in Data Hooks

**File:** `src/hooks/useDashboardData.ts`

**Implemented:**
- Minimum 2-second delay between requests
- Reduced refetch interval (30s instead of 10s)
- Exponential backoff on retry
- Graceful handling of 429 errors

```typescript
const rateLimitDelay = 2000 // 2 seconds minimum
const timeSinceLastFetch = now - lastFetchTime.current
if (timeSinceLastFetch < rateLimitDelay) {
  await new Promise(resolve => setTimeout(resolve, waitTime))
}
```

### 3. Reduced WebSocket Health Checks

**File:** `src/hooks/useSolanaWebSocket.ts`

**Changes:**
- Health check interval: 30s → 60s
- Specific handling for 429 errors
- Avoid reconnection cascade on rate limits

### 4. Query Configuration

**React Query Settings:**
```typescript
{
  staleTime: 15000,        // 15 seconds (increased)
  refetchInterval: 30000,  // 30 seconds (reduced frequency)
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
}
```

## Usage

### Option 1: Use Free RPC Providers (Recommended for Development)

Add to `.env`:
```env
# Helius (Free tier: 100k requests/day)
VITE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY

# Alchemy (Free tier: 300M compute units/month)
VITE_SOLANA_RPC_URL=https://solana-devnet.g.alchemy.com/v2/YOUR_API_KEY

# QuickNode (Free tier: 100k requests/day)
VITE_SOLANA_RPC_URL=https://YOUR_ENDPOINT.solana-devnet.quiknode.pro/YOUR_TOKEN/
```

### Option 2: Run Local Validator (Best for Development)

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Configure app to use local RPC
# .env
VITE_SOLANA_NETWORK=localnet
VITE_SOLANA_RPC_URL=http://127.0.0.1:8899
```

**Benefits:**
- No rate limits
- Faster responses
- Full control
- Free

### Option 3: Use Fallback Endpoints (Automatic)

The app automatically tries multiple endpoints:
1. Your custom RPC (if set in .env)
2. Public Solana RPC
3. Helius demo endpoint
4. Ankr free endpoint

## Best Practices

### 1. Batch Requests
```typescript
// ❌ Bad - Multiple individual requests
for (const address of addresses) {
  await connection.getAccountInfo(address)
}

// ✅ Good - Single batch request
const accounts = await connection.getMultipleAccountsInfo(addresses)
```

### 2. Cache Aggressively
```typescript
// Use longer stale times for data that doesn't change often
{
  staleTime: 60000,      // 1 minute
  cacheTime: 300000,     // 5 minutes
}
```

### 3. Implement Request Queuing
```typescript
// Queue requests to avoid bursts
const queue = new PQueue({ 
  concurrency: 5,        // Max 5 concurrent requests
  interval: 1000,        // Per second
  intervalCap: 10,       // Max 10 requests per interval
})
```

### 4. Use WebSocket Subscriptions
```typescript
// ✅ Better - Subscribe once, get updates
const subscriptionId = connection.onAccountChange(
  publicKey,
  (accountInfo) => {
    // Handle updates
  }
)
```

## Monitoring

### Check Current Rate Limit Status

```typescript
// Add to your app
let requestCount = 0
let windowStart = Date.now()

const trackRequest = () => {
  requestCount++
  const now = Date.now()
  
  if (now - windowStart > 10000) {
    console.log(`Requests in last 10s: ${requestCount}`)
    requestCount = 0
    windowStart = now
  }
}
```

### Log Rate Limit Errors

```typescript
// Already implemented in hooks
if (errorMessage.includes('429')) {
  console.warn('Rate limit hit:', {
    endpoint: connection.rpcEndpoint,
    timestamp: new Date().toISOString(),
  })
}
```

## Troubleshooting

### Issue: Still Getting 429 Errors

**Solutions:**
1. Check if multiple tabs are open (each makes requests)
2. Verify `.env` has custom RPC endpoint
3. Increase `rateLimitDelay` in hooks (currently 2000ms)
4. Reduce `refetchInterval` further (currently 30000ms)
5. Use local validator for development

### Issue: Slow Data Loading

**Solutions:**
1. Use faster RPC provider (Helius, Alchemy, QuickNode)
2. Reduce number of markets fetched
3. Implement pagination
4. Use WebSocket subscriptions instead of polling

### Issue: Connection Keeps Failing

**Solutions:**
1. Check network connectivity
2. Verify RPC endpoint is accessible
3. Try different endpoint from fallback list
4. Check Solana network status: https://status.solana.com/

## RPC Provider Comparison

| Provider | Free Tier | Rate Limit | Latency | Reliability |
|----------|-----------|------------|---------|-------------|
| **Solana Public** | Yes | ~100/10s | Medium | Medium |
| **Helius** | 100k/day | High | Low | High |
| **Alchemy** | 300M CU/mo | High | Low | High |
| **QuickNode** | 100k/day | Medium | Low | High |
| **Ankr** | Unlimited* | Medium | Medium | Medium |
| **Local Validator** | Unlimited | None | Lowest | Highest |

*Subject to fair use policy

## Recommended Setup

### Development
```env
VITE_SOLANA_NETWORK=localnet
VITE_SOLANA_RPC_URL=http://127.0.0.1:8899
```

### Testing (Devnet)
```env
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
```

### Production (Mainnet)
```env
VITE_SOLANA_NETWORK=mainnet-beta
VITE_SOLANA_RPC_URL=https://YOUR_DEDICATED_RPC_ENDPOINT
```

## Getting Free RPC API Keys

### Helius
1. Visit: https://www.helius.dev/
2. Sign up for free account
3. Create API key
4. Use: `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`

### Alchemy
1. Visit: https://www.alchemy.com/
2. Sign up for free account
3. Create Solana app
4. Use: `https://solana-devnet.g.alchemy.com/v2/YOUR_KEY`

### QuickNode
1. Visit: https://www.quicknode.com/
2. Sign up for free account
3. Create Solana endpoint
4. Use provided endpoint URL

## Advanced: Custom Rate Limiter

If you need more control, implement a custom rate limiter:

```typescript
// src/utils/rateLimiter.ts
class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private processing = false
  private requestsPerSecond = 10
  
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      
      this.process()
    })
  }
  
  private async process() {
    if (this.processing || this.queue.length === 0) return
    
    this.processing = true
    const fn = this.queue.shift()!
    
    await fn()
    await new Promise(resolve => 
      setTimeout(resolve, 1000 / this.requestsPerSecond)
    )
    
    this.processing = false
    this.process()
  }
}

export const rateLimiter = new RateLimiter()
```

## Summary

✅ **Implemented:**
- Multiple RPC endpoints with automatic fallback
- Rate limiting in all data fetching hooks
- Exponential backoff on retries
- Graceful 429 error handling
- Reduced polling frequency
- Connection health checks

🔄 **Recommended:**
- Use free RPC provider (Helius, Alchemy, QuickNode)
- Run local validator for development
- Monitor request patterns
- Implement request batching

📚 **Resources:**
- [Solana RPC Docs](https://docs.solana.com/api/http)
- [Helius RPC](https://www.helius.dev/)
- [Alchemy Solana](https://www.alchemy.com/solana)
- [QuickNode](https://www.quicknode.com/)

---

**Last Updated:** 2024-11-28  
**Status:** ✅ Rate Limiting Implemented
