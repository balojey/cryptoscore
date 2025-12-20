/**
 * Optimized TanStack Query Configuration for Supabase
 * 
 * This configuration provides optimized caching, retry logic, and performance
 * settings specifically tuned for Supabase database operations in the web2 migration.
 */

import { QueryClient, DefaultOptions } from '@tanstack/react-query'

// Query configuration optimized for Supabase operations
const queryConfig: DefaultOptions = {
  queries: {
    // Caching configuration
    staleTime: 1000 * 60 * 5, // 5 minutes - data is considered fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes - keep unused data in cache for 30 minutes
    
    // Retry configuration optimized for database operations
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors or client errors (4xx)
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }
      
      // Don't retry on Supabase-specific errors that won't resolve
      if (error?.code === 'PGRST116' || error?.code === 'PGRST301') {
        return false
      }
      
      // Retry up to 3 times for network/server errors
      return failureCount < 3
    },
    
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s
    
    // Network configuration
    networkMode: 'online', // Only run queries when online
    
    // Refetch configuration
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchOnReconnect: true, // Refetch when network reconnects
    refetchOnMount: true, // Always refetch on component mount
    
    // Performance optimizations
    structuralSharing: true, // Enable structural sharing for better performance
    
    // Error handling
    throwOnError: false, // Don't throw errors, handle them in components
  },
  
  mutations: {
    // Retry configuration for mutations (database writes)
    retry: (failureCount, error: any) => {
      // Don't retry mutations on client errors
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }
      
      // Only retry once for mutations to avoid duplicate operations
      return failureCount < 1
    },
    
    retryDelay: 1000, // 1 second delay for mutation retries
    
    // Network configuration
    networkMode: 'online',
  },
}

// Create optimized query client
export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: queryConfig,
    
    // Logger configuration for development
    logger: {
      log: console.log,
      warn: console.warn,
      error: (error) => {
        // Only log actual errors, not expected failures
        if (error instanceof Error && !error.message.includes('Query was cancelled')) {
          console.error('Query Client Error:', error)
        }
      },
    },
  })
}

// Query key factories for consistent caching
export const queryKeys = {
  // User-related queries
  users: {
    all: ['users'] as const,
    byWallet: (walletAddress: string) => ['users', 'wallet', walletAddress] as const,
    profile: (userId: string) => ['users', 'profile', userId] as const,
    portfolio: (userId: string) => ['users', 'portfolio', userId] as const,
    stats: (userId: string) => ['users', 'stats', userId] as const,
  },
  
  // Market-related queries
  markets: {
    all: ['markets'] as const,
    lists: () => ['markets', 'list'] as const,
    list: (filters: Record<string, any>) => ['markets', 'list', filters] as const,
    details: () => ['markets', 'detail'] as const,
    detail: (marketId: string) => ['markets', 'detail', marketId] as const,
    stats: (marketId: string) => ['markets', 'stats', marketId] as const,
    participants: (marketId: string) => ['markets', 'participants', marketId] as const,
    userMarkets: (userId: string) => ['markets', 'user', userId] as const,
    userParticipation: (userId: string) => ['markets', 'participation', userId] as const,
  },
  
  // Real-time related queries
  realtime: {
    status: ['realtime', 'status'] as const,
    subscriptions: ['realtime', 'subscriptions'] as const,
  },
  
  // Platform configuration
  platform: {
    config: ['platform', 'config'] as const,
    fees: ['platform', 'fees'] as const,
  },
} as const

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate all user-related data
  invalidateUser: (queryClient: QueryClient, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.profile(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.users.portfolio(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.users.stats(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.userMarkets(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.userParticipation(userId) })
  },
  
  // Invalidate market-related data
  invalidateMarket: (queryClient: QueryClient, marketId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.detail(marketId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.stats(marketId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.participants(marketId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.lists() })
  },
  
  // Invalidate all market lists
  invalidateMarketLists: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.lists() })
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.all })
  },
  
  // Selective invalidation for performance
  invalidateMarketParticipation: (queryClient: QueryClient, marketId: string, userId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.participants(marketId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.markets.userParticipation(userId) })
    queryClient.invalidateQueries({ queryKey: queryKeys.users.portfolio(userId) })
  },
}

// Prefetching helpers for performance
export const prefetchHelpers = {
  // Prefetch user data when they authenticate
  prefetchUserData: async (queryClient: QueryClient, userId: string, walletAddress: string) => {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: queryKeys.users.profile(userId),
        staleTime: 1000 * 60 * 10, // 10 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.users.portfolio(userId),
        staleTime: 1000 * 60 * 5, // 5 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.markets.userMarkets(userId),
        staleTime: 1000 * 60 * 5, // 5 minutes
      }),
    ])
  },
  
  // Prefetch market details when hovering over market cards
  prefetchMarketDetails: async (queryClient: QueryClient, marketId: string) => {
    await Promise.allSettled([
      queryClient.prefetchQuery({
        queryKey: queryKeys.markets.detail(marketId),
        staleTime: 1000 * 60 * 2, // 2 minutes
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.markets.stats(marketId),
        staleTime: 1000 * 60 * 2, // 2 minutes
      }),
    ])
  },
}

// Performance monitoring helpers
export const performanceHelpers = {
  // Log slow queries for optimization
  logSlowQueries: (queryClient: QueryClient) => {
    const originalFetch = queryClient.getQueryCache().build

    queryClient.getQueryCache().build = function(client, options, state) {
      const query = originalFetch.call(this, client, options, state)
      const originalFetch2 = query.fetch

      query.fetch = async function(...args) {
        const startTime = performance.now()
        try {
          const result = await originalFetch2.apply(this, args)
          const endTime = performance.now()
          const duration = endTime - startTime

          // Log queries that take longer than 1 second
          if (duration > 1000) {
            console.warn(`Slow query detected (${duration.toFixed(2)}ms):`, {
              queryKey: options.queryKey,
              duration,
            })
          }

          return result
        } catch (error) {
          const endTime = performance.now()
          const duration = endTime - startTime
          console.error(`Query failed after ${duration.toFixed(2)}ms:`, {
            queryKey: options.queryKey,
            error,
            duration,
          })
          throw error
        }
      }

      return query
    }
  },
  
  // Get cache statistics
  getCacheStats: (queryClient: QueryClient) => {
    const cache = queryClient.getQueryCache()
    const queries = cache.getAll()
    
    return {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      cacheSize: queries.reduce((size, q) => size + JSON.stringify(q.state.data || {}).length, 0),
    }
  },
}

// Default query client instance
export const queryClient = createOptimizedQueryClient()

// Enable performance monitoring in development
if (import.meta.env.DEV) {
  performanceHelpers.logSlowQueries(queryClient)
}