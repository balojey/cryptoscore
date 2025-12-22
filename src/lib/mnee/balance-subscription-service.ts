/**
 * MNEE Balance Subscription Service
 * 
 * Provides real-time balance updates through WebSocket subscriptions
 * and polling fallback with notification system
 */

import type { RealtimeChannel } from '@supabase/supabase-js'
import type { MneeBalance, BalanceCallback } from './types'
import { MneeService } from './mnee-service'
import { supabase } from '@/config/supabase'

export interface BalanceSubscriptionOptions {
  enablePolling?: boolean
  pollingInterval?: number
  enableNotifications?: boolean
  cacheTimeout?: number
}

export interface BalanceNotification {
  address: string
  previousBalance: number
  newBalance: number
  timestamp: number
  type: 'increase' | 'decrease' | 'unchanged'
}

export interface BalanceSubscriptionManager {
  subscribe(address: string, callback: BalanceCallback, options?: BalanceSubscriptionOptions): () => void
  unsubscribe(address: string, callback?: BalanceCallback): void
  getActiveSubscriptions(): string[]
  notifyBalanceChange(notification: BalanceNotification): void
  clearAllSubscriptions(): void
}

export class MneeBalanceSubscriptionService implements BalanceSubscriptionManager {
  private mneeService: MneeService
  private subscriptions = new Map<string, Set<BalanceCallback>>()
  private supabaseChannels = new Map<string, RealtimeChannel>()
  private pollingIntervals = new Map<string, NodeJS.Timeout>()
  private lastKnownBalances = new Map<string, number>()
  private notificationCallbacks = new Set<(notification: BalanceNotification) => void>()
  
  // Default configuration
  private readonly defaultOptions: Required<BalanceSubscriptionOptions> = {
    enablePolling: true,
    pollingInterval: 30000, // 30 seconds
    enableNotifications: true,
    cacheTimeout: 300000 // 5 minutes
  }

  constructor(mneeService: MneeService) {
    this.mneeService = mneeService
  }

  /**
   * Subscribe to balance changes for an address
   */
  subscribe(
    address: string, 
    callback: BalanceCallback, 
    options: BalanceSubscriptionOptions = {}
  ): () => void {
    const config = { ...this.defaultOptions, ...options }
    
    // Add callback to subscriptions
    if (!this.subscriptions.has(address)) {
      this.subscriptions.set(address, new Set())
    }
    
    const callbacks = this.subscriptions.get(address)!
    callbacks.add(callback)

    // Start subscriptions if this is the first callback for this address
    if (callbacks.size === 1) {
      this.startSubscriptions(address, config)
    }

    // Return unsubscribe function
    return () => {
      this.unsubscribe(address, callback)
    }
  }

  /**
   * Unsubscribe from balance changes
   */
  unsubscribe(address: string, callback?: BalanceCallback): void {
    const callbacks = this.subscriptions.get(address)
    if (!callbacks) return

    if (callback) {
      callbacks.delete(callback)
    } else {
      callbacks.clear()
    }

    // Stop subscriptions if no more callbacks
    if (callbacks.size === 0) {
      this.stopSubscriptions(address)
      this.subscriptions.delete(address)
    }
  }

  /**
   * Get list of addresses with active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  /**
   * Notify all listeners about a balance change
   */
  notifyBalanceChange(notification: BalanceNotification): void {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification)
      } catch (error) {
        console.error('Balance notification callback error:', error)
      }
    })
  }

  /**
   * Subscribe to balance change notifications
   */
  subscribeToNotifications(callback: (notification: BalanceNotification) => void): () => void {
    this.notificationCallbacks.add(callback)
    
    return () => {
      this.notificationCallbacks.delete(callback)
    }
  }

  /**
   * Clear all subscriptions and cleanup resources
   */
  clearAllSubscriptions(): void {
    // Clear all callbacks
    this.subscriptions.clear()
    
    // Stop all polling
    this.pollingIntervals.forEach(interval => clearInterval(interval))
    this.pollingIntervals.clear()
    
    // Unsubscribe from all Supabase channels
    this.supabaseChannels.forEach(channel => {
      supabase.removeChannel(channel)
    })
    this.supabaseChannels.clear()
    
    // Clear cached balances
    this.lastKnownBalances.clear()
    
    // Clear notification callbacks
    this.notificationCallbacks.clear()
  }

  /**
   * Start all subscription mechanisms for an address
   */
  private startSubscriptions(address: string, options: Required<BalanceSubscriptionOptions>): void {
    // Start Supabase real-time subscription for database changes
    this.startSupabaseSubscription(address)
    
    // Start polling as fallback
    if (options.enablePolling) {
      this.startPolling(address, options.pollingInterval)
    }
    
    // Fetch initial balance
    this.fetchAndNotifyBalance(address)
  }

  /**
   * Stop all subscription mechanisms for an address
   */
  private stopSubscriptions(address: string): void {
    // Stop polling
    const pollingInterval = this.pollingIntervals.get(address)
    if (pollingInterval) {
      clearInterval(pollingInterval)
      this.pollingIntervals.delete(address)
    }
    
    // Stop Supabase subscription
    const channel = this.supabaseChannels.get(address)
    if (channel) {
      supabase.removeChannel(channel)
      this.supabaseChannels.delete(address)
    }
    
    // Clear cached balance
    this.lastKnownBalances.delete(address)
  }

  /**
   * Start Supabase real-time subscription for balance changes
   */
  private startSupabaseSubscription(address: string): void {
    const channel = supabase
      .channel(`mnee-balance-${address}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mnee_balances',
        filter: `address=eq.${address}`
      }, (payload) => {
        this.handleSupabaseBalanceChange(address, payload)
      })
      .subscribe()

    this.supabaseChannels.set(address, channel)
  }

  /**
   * Handle Supabase balance change events
   */
  private handleSupabaseBalanceChange(address: string, payload: any): void {
    try {
      const { eventType, new: newRecord } = payload
      
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        const balanceData: MneeBalance = {
          address: newRecord.address,
          amount: newRecord.balance_atomic,
          decimalAmount: newRecord.balance_decimal,
          lastUpdated: Date.now()
        }
        
        this.notifyCallbacks(address, balanceData)
        
        // Send notification if balance changed
        const previousBalance = this.lastKnownBalances.get(address) || 0
        if (previousBalance !== balanceData.amount) {
          this.sendBalanceNotification(address, previousBalance, balanceData.amount)
          this.lastKnownBalances.set(address, balanceData.amount)
        }
      }
    } catch (error) {
      console.error('Error handling Supabase balance change:', error)
    }
  }

  /**
   * Start polling for balance changes
   */
  private startPolling(address: string, interval: number): void {
    const poll = async () => {
      try {
        await this.fetchAndNotifyBalance(address)
      } catch (error) {
        console.error(`Balance polling error for ${address}:`, error)
      }
    }

    // Initial poll after a short delay
    setTimeout(poll, 1000)
    
    // Set up recurring polling
    const intervalId = setInterval(poll, interval)
    this.pollingIntervals.set(address, intervalId)
  }

  /**
   * Fetch balance and notify callbacks
   */
  private async fetchAndNotifyBalance(address: string): Promise<void> {
    try {
      const balanceData = await this.mneeService.getBalance(address)
      
      // Update database cache
      try {
        // We need user ID for database cache - for now, skip database caching in polling
        // This will be handled by the main balance refresh in components
      } catch (cacheError) {
        console.warn('Failed to update balance cache:', cacheError)
      }
      
      this.notifyCallbacks(address, balanceData)
      
      // Send notification if balance changed
      const previousBalance = this.lastKnownBalances.get(address) || 0
      if (previousBalance !== balanceData.amount) {
        this.sendBalanceNotification(address, previousBalance, balanceData.amount)
        this.lastKnownBalances.set(address, balanceData.amount)
      }
    } catch (error) {
      console.error(`Failed to fetch balance for ${address}:`, error)
    }
  }

  /**
   * Notify all callbacks for an address
   */
  private notifyCallbacks(address: string, balanceData: MneeBalance): void {
    const callbacks = this.subscriptions.get(address)
    if (!callbacks) return

    callbacks.forEach(callback => {
      try {
        callback(balanceData)
      } catch (error) {
        console.error('Balance callback error:', error)
      }
    })
  }

  /**
   * Send balance change notification
   */
  private sendBalanceNotification(address: string, previousBalance: number, newBalance: number): void {
    const notification: BalanceNotification = {
      address,
      previousBalance,
      newBalance,
      timestamp: Date.now(),
      type: newBalance > previousBalance ? 'increase' : 
            newBalance < previousBalance ? 'decrease' : 'unchanged'
    }

    this.notifyBalanceChange(notification)
  }
}

/**
 * Global balance subscription service instance
 */
let globalBalanceSubscriptionService: MneeBalanceSubscriptionService | null = null

/**
 * Get or create the global balance subscription service
 */
export function getBalanceSubscriptionService(mneeService: MneeService): MneeBalanceSubscriptionService {
  if (!globalBalanceSubscriptionService) {
    globalBalanceSubscriptionService = new MneeBalanceSubscriptionService(mneeService)
  }
  return globalBalanceSubscriptionService
}

/**
 * Cleanup global service (useful for testing)
 */
export function cleanupBalanceSubscriptionService(): void {
  if (globalBalanceSubscriptionService) {
    globalBalanceSubscriptionService.clearAllSubscriptions()
    globalBalanceSubscriptionService = null
  }
}