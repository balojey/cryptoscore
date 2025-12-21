/**
 * Hook for managing real-time notifications for automated operations
 * Handles automated resolution, winnings distribution, and creator rewards
 */

import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DatabaseService } from '../lib/supabase/database-service'
import { useUnifiedWallet } from '../contexts/UnifiedWalletContext'
import { marketToast } from './useRealtimeMarkets'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface AutomatedOperationNotificationOptions {
  enabled?: boolean
  onMarketResolved?: (marketId: string, outcome: string) => void
  onWinningsDistributed?: (userId: string, amount: number, marketId: string) => void
  onCreatorRewardDistributed?: (userId: string, amount: number, marketId: string) => void
}

/**
 * Hook for managing automated operation notifications
 * Provides real-time updates for automated market resolution and distribution
 */
export function useAutomatedOperationNotifications(options: AutomatedOperationNotificationOptions = {}) {
  const {
    enabled = true,
    onMarketResolved,
    onWinningsDistributed,
    onCreatorRewardDistributed,
  } = options

  const { publicKey } = useUnifiedWallet()
  const queryClient = useQueryClient()
  
  // Refs to maintain subscriptions across re-renders
  const automatedOpsChannelRef = useRef<RealtimeChannel | null>(null)
  const userTransactionsChannelRef = useRef<RealtimeChannel | null>(null)
  const userPredictionsChannelRef = useRef<RealtimeChannel | null>(null)
  const notificationCooldownRef = useRef<Set<string>>(new Set())

  /**
   * Add notification to cooldown to prevent spam
   */
  const addToCooldown = useCallback((key: string, duration: number = 300000) => {
    notificationCooldownRef.current.add(key)
    setTimeout(() => {
      notificationCooldownRef.current.delete(key)
    }, duration)
  }, [])

  /**
   * Check if notification is in cooldown
   */
  const isInCooldown = useCallback((key: string) => {
    return notificationCooldownRef.current.has(key)
  }, [])

  /**
   * Handle automated market resolution notifications
   */
  const handleAutomatedResolution = useCallback((payload: any) => {
    const { new: newRecord, old: oldRecord } = payload
    
    // Check if market was just resolved automatically
    if (oldRecord?.status !== 'FINISHED' && newRecord?.status === 'FINISHED' && newRecord?.resolution_outcome) {
      const marketId = newRecord.id
      const marketTitle = newRecord.title || 'Market'
      const outcome = newRecord.resolution_outcome
      
      const cooldownKey = `auto-resolved-${marketId}`
      if (!isInCooldown(cooldownKey)) {
        marketToast.automatedResolution(marketTitle)
        addToCooldown(cooldownKey, 600000) // 10 minutes
        
        // Invalidate relevant caches
        queryClient.invalidateQueries({ queryKey: ['market', 'details', marketId] })
        queryClient.invalidateQueries({ queryKey: ['markets'] })
        
        onMarketResolved?.(marketId, outcome)
      }
    }
  }, [isInCooldown, addToCooldown, queryClient, onMarketResolved])

  /**
   * Handle automated transaction notifications (winnings and creator rewards)
   */
  const handleAutomatedTransactions = useCallback((payload: any) => {
    const { eventType, new: newRecord } = payload
    
    if (eventType === 'INSERT' && newRecord?.type) {
      const { user_id, amount, type, market_id, metadata } = newRecord
      const isAutomated = metadata?.automated_transfer === true
      
      if (!isAutomated) return // Only handle automated transactions
      
      const cooldownKey = `auto-transaction-${newRecord.id}`
      if (isInCooldown(cooldownKey)) return
      
      if (type === 'winnings') {
        marketToast.automatedDistribution(amount)
        addToCooldown(cooldownKey, 300000) // 5 minutes
        onWinningsDistributed?.(user_id, amount, market_id)
      } else if (type === 'creator_reward') {
        marketToast.automatedCreatorReward(amount)
        addToCooldown(cooldownKey, 300000) // 5 minutes
        onCreatorRewardDistributed?.(user_id, amount, market_id)
      }
      
      // Invalidate user-related caches
      queryClient.invalidateQueries({ queryKey: ['user', 'transactions', user_id] })
      queryClient.invalidateQueries({ queryKey: ['user', 'portfolio', user_id] })
      if (market_id) {
        queryClient.invalidateQueries({ queryKey: ['market', 'details', market_id] })
      }
    }
  }, [isInCooldown, addToCooldown, queryClient, onWinningsDistributed, onCreatorRewardDistributed])

  /**
   * Handle user prediction updates for multiple predictions
   */
  const handleUserPredictionUpdates = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    if (eventType === 'UPDATE' && newRecord?.actual_winnings !== oldRecord?.actual_winnings) {
      // User's prediction was updated with winnings
      const marketId = newRecord.market_id
      const userId = newRecord.user_id
      
      // Invalidate multiple prediction caches
      queryClient.invalidateQueries({ 
        queryKey: ['participant', 'multiple', marketId, userId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['user', 'predictions', userId] 
      })
    }
  }, [queryClient])

  /**
   * Set up automated operation subscriptions
   */
  const setupAutomatedOperationSubscriptions = useCallback(async () => {
    if (!enabled) return

    try {
      // Subscribe to automated market resolutions
      if (!automatedOpsChannelRef.current) {
        automatedOpsChannelRef.current = DatabaseService.subscribeToAutomatedOperations(handleAutomatedResolution)
      }

      // Subscribe to user transactions if wallet is connected
      if (publicKey && !userTransactionsChannelRef.current) {
        const userId = publicKey.toString() // This would need to be mapped to actual user ID
        userTransactionsChannelRef.current = DatabaseService.subscribeToUserTransactions(userId, handleAutomatedTransactions)
      }

      // Subscribe to user predictions if wallet is connected
      if (publicKey && !userPredictionsChannelRef.current) {
        const userId = publicKey.toString() // This would need to be mapped to actual user ID
        userPredictionsChannelRef.current = DatabaseService.subscribeToUserPredictions(userId, handleUserPredictionUpdates)
      }

      console.log('Automated operation subscriptions established')
    } catch (error) {
      console.error('Failed to set up automated operation subscriptions:', error)
    }
  }, [enabled, publicKey, handleAutomatedResolution, handleAutomatedTransactions, handleUserPredictionUpdates])

  /**
   * Clean up subscriptions
   */
  const cleanupSubscriptions = useCallback(async () => {
    try {
      if (automatedOpsChannelRef.current) {
        await automatedOpsChannelRef.current.unsubscribe()
        automatedOpsChannelRef.current = null
      }

      if (userTransactionsChannelRef.current) {
        await userTransactionsChannelRef.current.unsubscribe()
        userTransactionsChannelRef.current = null
      }

      if (userPredictionsChannelRef.current) {
        await userPredictionsChannelRef.current.unsubscribe()
        userPredictionsChannelRef.current = null
      }

      console.log('Automated operation subscriptions cleaned up')
    } catch (error) {
      console.error('Error cleaning up automated operation subscriptions:', error)
    }
  }, [])

  /**
   * Set up subscriptions when enabled or wallet changes
   */
  useEffect(() => {
    if (enabled) {
      setupAutomatedOperationSubscriptions()
    } else {
      cleanupSubscriptions()
    }

    return () => {
      cleanupSubscriptions()
    }
  }, [enabled, publicKey?.toString(), setupAutomatedOperationSubscriptions, cleanupSubscriptions])

  /**
   * Clear cooldowns on unmount
   */
  useEffect(() => {
    return () => {
      notificationCooldownRef.current.clear()
    }
  }, [])

  return {
    clearCooldowns: () => notificationCooldownRef.current.clear(),
    isInCooldown,
    addToCooldown,
  }
}