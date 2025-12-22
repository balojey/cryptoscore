// Performance optimization service for MNEE operations

import { MneeService } from './mnee-service'
import type { MneeBalance } from './types'
import { generateCorrelationId } from './utils'

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  hits: number
}

export interface CacheStats {
  totalEntries: number
  hitRate: number
  missRate: number
  averageAge: number
  oldestEntry: number
}

export interface BatchBalanceRequest {
  addresses: string[]
  priority?: 'high' | 'normal' | 'low'
  maxAge?: number // Maximum age of cached data to accept (ms)
}

export interface BatchBalanceResult {
  balances: Map<string, MneeBalance>
  cached: number
  fetched: number
  failed: number
  duration: number
}

export interface PerformanceMetrics {
  totalRequests: number
  cachedResponses: number
  apiCalls: number
  averageResponseTime: number
  batchEfficiency: number
}

export class MneePerformanceOptimizer {
  private static instance: MneePerformanceOptimizer
  private balanceCache = new Map<string, CacheEntry<MneeBalance>>()
  private requestQueue = new Map<string, Promise<MneeBalance>>() // Deduplication
  private batchQueue: { address: string; resolve: (balance: MneeBalance) => void; reject: (error: Error) => void }[] = []
  private batchTimer: NodeJS.Timeout | null = null
  
  // Performance metrics
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    totalResponseTime: 0,
    batchedRequests: 0
  }

  private readonly DEFAULT_TTL = 60 * 1000 // 1 minute
  private readonly BATCH_DELAY = 100 // 100ms batch window
  private readonly MAX_BATCH_SIZE = 20
  private readonly MAX_CACHE_SIZE = 1000

  private constructor(private mneeService: MneeService) {}

  static getInstance(mneeService: MneeService): MneePerformanceOptimizer {
    if (!this.instance) {
      this.instance = new MneePerformanceOptimizer(mneeService)
    }
    return this.instance
  }

  /**
   * Get balance with intelligent caching
   */
  async getBalanceOptimized(
    address: string,
    options: { maxAge?: number; forceRefresh?: boolean } = {}
  ): Promise<MneeBalance> {
    const correlationId = generateCorrelationId()
    const startTime = Date.now()
    this.metrics.totalRequests++

    try {
      // Check cache first unless force refresh
      if (!options.forceRefresh) {
        const cached = this.getCachedBalance(address, options.maxAge)
        if (cached) {
          this.metrics.cacheHits++
          console.log(`[${correlationId}] Cache hit for ${address}`)
          return cached.data
        }
      }

      this.metrics.cacheMisses++

      // Check if there's already a pending request for this address (deduplication)
      const pendingRequest = this.requestQueue.get(address)
      if (pendingRequest) {
        console.log(`[${correlationId}] Deduplicating request for ${address}`)
        return await pendingRequest
      }

      // Create new request
      const request = this.fetchAndCacheBalance(address, correlationId)
      this.requestQueue.set(address, request)

      try {
        const balance = await request
        return balance
      } finally {
        this.requestQueue.delete(address)
        this.metrics.totalResponseTime += Date.now() - startTime
      }
    } catch (error) {
      console.error(`[${correlationId}] Failed to get optimized balance:`, error)
      throw error
    }
  }

  /**
   * Get multiple balances with batching and caching
   */
  async getBatchBalancesOptimized(request: BatchBalanceRequest): Promise<BatchBalanceResult> {
    const correlationId = generateCorrelationId()
    const startTime = Date.now()
    const { addresses, maxAge } = request

    console.log(`[${correlationId}] Batch balance request for ${addresses.length} addresses`)

    const results = new Map<string, MneeBalance>()
    const toFetch: string[] = []
    let cached = 0
    let failed = 0

    // Check cache for each address
    for (const address of addresses) {
      const cachedBalance = this.getCachedBalance(address, maxAge)
      if (cachedBalance) {
        results.set(address, cachedBalance.data)
        cached++
      } else {
        toFetch.push(address)
      }
    }

    // Fetch remaining addresses in batches
    if (toFetch.length > 0) {
      try {
        const fetchedBalances = await this.mneeService.getBalances(toFetch)
        this.metrics.apiCalls++
        this.metrics.batchedRequests += toFetch.length

        for (const balance of fetchedBalances) {
          results.set(balance.address, balance)
          this.cacheBalance(balance.address, balance)
        }
      } catch (error) {
        console.error(`[${correlationId}] Batch fetch failed:`, error)
        failed = toFetch.length
      }
    }

    const duration = Date.now() - startTime

    console.log(`[${correlationId}] Batch completed: ${cached} cached, ${toFetch.length} fetched, ${failed} failed in ${duration}ms`)

    return {
      balances: results,
      cached,
      fetched: toFetch.length - failed,
      failed,
      duration
    }
  }

  /**
   * Queue balance request for batching
   */
  async queueBalanceRequest(address: string): Promise<MneeBalance> {
    return new Promise((resolve, reject) => {
      // Check cache first
      const cached = this.getCachedBalance(address)
      if (cached) {
        resolve(cached.data)
        return
      }

      // Add to batch queue
      this.batchQueue.push({ address, resolve, reject })

      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatchQueue()
        }, this.BATCH_DELAY)
      }

      // Process immediately if queue is full
      if (this.batchQueue.length >= this.MAX_BATCH_SIZE) {
        if (this.batchTimer) {
          clearTimeout(this.batchTimer)
          this.batchTimer = null
        }
        this.processBatchQueue()
      }
    })
  }

  /**
   * Prefetch balances for addresses likely to be needed soon
   */
  async prefetchBalances(addresses: string[], priority: 'high' | 'normal' | 'low' = 'normal'): Promise<void> {
    const correlationId = generateCorrelationId()
    console.log(`[${correlationId}] Prefetching ${addresses.length} balances (priority: ${priority})`)

    // Filter out already cached addresses
    const toPrefetch = addresses.filter(address => !this.getCachedBalance(address))

    if (toPrefetch.length === 0) {
      console.log(`[${correlationId}] All addresses already cached`)
      return
    }

    // Prefetch in background based on priority
    const delay = priority === 'high' ? 0 : priority === 'normal' ? 100 : 500

    setTimeout(async () => {
      try {
        await this.getBatchBalancesOptimized({ addresses: toPrefetch })
        console.log(`[${correlationId}] Prefetch completed for ${toPrefetch.length} addresses`)
      } catch (error) {
        console.warn(`[${correlationId}] Prefetch failed:`, error)
      }
    }, delay)
  }

  /**
   * Warm up cache with frequently accessed addresses
   */
  async warmupCache(addresses: string[]): Promise<void> {
    console.log(`Warming up cache with ${addresses.length} addresses`)
    await this.getBatchBalancesOptimized({ addresses })
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const now = Date.now()
    let totalAge = 0
    let oldestAge = 0

    for (const entry of this.balanceCache.values()) {
      const age = now - entry.timestamp
      totalAge += age
      oldestAge = Math.max(oldestAge, age)
    }

    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses
    const hitRate = totalRequests > 0 ? this.metrics.cacheHits / totalRequests : 0
    const missRate = totalRequests > 0 ? this.metrics.cacheMisses / totalRequests : 0

    return {
      totalEntries: this.balanceCache.size,
      hitRate,
      missRate,
      averageAge: this.balanceCache.size > 0 ? totalAge / this.balanceCache.size : 0,
      oldestEntry: oldestAge
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const totalRequests = this.metrics.totalRequests
    const averageResponseTime = totalRequests > 0 ? this.metrics.totalResponseTime / totalRequests : 0
    const batchEfficiency = this.metrics.apiCalls > 0 ? this.metrics.batchedRequests / this.metrics.apiCalls : 0

    return {
      totalRequests,
      cachedResponses: this.metrics.cacheHits,
      apiCalls: this.metrics.apiCalls,
      averageResponseTime,
      batchEfficiency
    }
  }

  /**
   * Clear cache
   */
  clearCache(address?: string): void {
    if (address) {
      this.balanceCache.delete(address)
      console.log(`Cleared cache for ${address}`)
    } else {
      this.balanceCache.clear()
      console.log('Cleared entire balance cache')
    }
  }

  /**
   * Invalidate cache entries older than specified age
   */
  invalidateOldEntries(maxAge: number = this.DEFAULT_TTL): number {
    const now = Date.now()
    let invalidated = 0

    for (const [address, entry] of this.balanceCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.balanceCache.delete(address)
        invalidated++
      }
    }

    if (invalidated > 0) {
      console.log(`Invalidated ${invalidated} old cache entries`)
    }

    return invalidated
  }

  /**
   * Optimize cache by removing least recently used entries
   */
  optimizeCache(): void {
    if (this.balanceCache.size <= this.MAX_CACHE_SIZE) {
      return
    }

    // Sort by hits (ascending) and age (descending)
    const entries = Array.from(this.balanceCache.entries())
      .sort((a, b) => {
        const hitDiff = a[1].hits - b[1].hits
        if (hitDiff !== 0) return hitDiff
        return b[1].timestamp - a[1].timestamp
      })

    // Remove least valuable entries
    const toRemove = entries.length - this.MAX_CACHE_SIZE
    for (let i = 0; i < toRemove; i++) {
      this.balanceCache.delete(entries[i][0])
    }

    console.log(`Optimized cache: removed ${toRemove} entries`)
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
      totalResponseTime: 0,
      batchedRequests: 0
    }
    console.log('Performance metrics reset')
  }

  /**
   * Private: Fetch and cache balance
   */
  private async fetchAndCacheBalance(address: string, correlationId: string): Promise<MneeBalance> {
    console.log(`[${correlationId}] Fetching balance for ${address}`)
    this.metrics.apiCalls++

    const balance = await this.mneeService.getBalance(address)
    this.cacheBalance(address, balance)

    return balance
  }

  /**
   * Private: Get cached balance
   */
  private getCachedBalance(address: string, maxAge?: number): CacheEntry<MneeBalance> | null {
    const entry = this.balanceCache.get(address)
    if (!entry) return null

    const now = Date.now()
    const age = now - entry.timestamp

    // Check if entry is expired
    if (now > entry.expiresAt || (maxAge && age > maxAge)) {
      this.balanceCache.delete(address)
      return null
    }

    // Update hit count
    entry.hits++

    return entry
  }

  /**
   * Private: Cache balance
   */
  private cacheBalance(address: string, balance: MneeBalance, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now()
    
    this.balanceCache.set(address, {
      data: balance,
      timestamp: now,
      expiresAt: now + ttl,
      hits: 0
    })

    // Optimize cache if it's getting too large
    if (this.balanceCache.size > this.MAX_CACHE_SIZE * 1.1) {
      this.optimizeCache()
    }
  }

  /**
   * Private: Process batch queue
   */
  private async processBatchQueue(): Promise<void> {
    if (this.batchQueue.length === 0) return

    const correlationId = generateCorrelationId()
    const batch = this.batchQueue.splice(0, this.MAX_BATCH_SIZE)
    const addresses = batch.map(item => item.address)

    console.log(`[${correlationId}] Processing batch of ${batch.length} balance requests`)

    try {
      const balances = await this.mneeService.getBalances(addresses)
      this.metrics.apiCalls++
      this.metrics.batchedRequests += batch.length

      // Create a map for quick lookup
      const balanceMap = new Map(balances.map(b => [b.address, b]))

      // Resolve all promises
      for (const item of batch) {
        const balance = balanceMap.get(item.address)
        if (balance) {
          this.cacheBalance(item.address, balance)
          item.resolve(balance)
        } else {
          item.reject(new Error(`Balance not found for ${item.address}`))
        }
      }
    } catch (error) {
      console.error(`[${correlationId}] Batch processing failed:`, error)
      
      // Reject all promises
      for (const item of batch) {
        item.reject(error as Error)
      }
    }

    // Process remaining queue if any
    if (this.batchQueue.length > 0) {
      this.batchTimer = setTimeout(() => {
        this.processBatchQueue()
      }, this.BATCH_DELAY)
    } else {
      this.batchTimer = null
    }
  }
}
