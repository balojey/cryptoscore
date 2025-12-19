import { useConnection } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { marketToast } from './useRealtimeMarkets'

interface WebSocketSubscription {
  subscriptionId: number
  accountAddress: string
  accountType: 'factory' | 'market' | 'participant'
}

interface WebSocketOptions {
  enabled?: boolean
  onAccountChange?: (accountAddress: string, accountType: string, data: any) => void
  onError?: (error: Error) => void
  maxReconnectAttempts?: number
  baseReconnectDelay?: number
}

/**
 * Hook for managing Solana WebSocket subscriptions to program accounts
 * Provides real-time updates for Factory and Market account changes
 */
export function useSolanaWebSocket(options: WebSocketOptions = {}) {
  const {
    enabled = true,
    onAccountChange,
    onError,
    maxReconnectAttempts = 10,
    baseReconnectDelay = 1000,
  } = options

  const { connection } = useConnection()
  const [isConnected, setIsConnected] = useState(false)
  const [subscriptions, setSubscriptions] = useState<WebSocketSubscription[]>([])
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  // Refs to maintain state across re-renders
  const subscriptionsRef = useRef<WebSocketSubscription[]>([])
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isReconnectingRef = useRef(false)

  /**
   * Calculate exponential backoff delay
   */
  const getReconnectDelay = useCallback((attempt: number) => {
    return Math.min(baseReconnectDelay * (2 ** attempt), 30000) // Max 30 seconds
  }, [baseReconnectDelay])

  /**
   * Handle WebSocket connection errors with exponential backoff
   */
  const handleConnectionError = useCallback((error: Error) => {
    console.error('Solana WebSocket connection error:', error)
    setIsConnected(false)
    onError?.(error)

    if (reconnectAttempts < maxReconnectAttempts && !isReconnectingRef.current) {
      isReconnectingRef.current = true
      const delay = getReconnectDelay(reconnectAttempts)

      marketToast.error(`Connection lost. Reconnecting in ${Math.ceil(delay / 1000)}s...`)

      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempts(prev => prev + 1)
        isReconnectingRef.current = false
        // Connection will be re-established by the effect
      }, delay)
    }
    else if (reconnectAttempts >= maxReconnectAttempts) {
      marketToast.error('Connection failed. Falling back to polling.')
    }
  }, [reconnectAttempts, maxReconnectAttempts, getReconnectDelay, onError])

  /**
   * Subscribe to account changes for a specific account
   */
  const subscribeToAccount = useCallback(async (
    accountAddress: string,
    accountType: 'factory' | 'market' | 'participant',
  ) => {
    if (!enabled || !connection)
      return

    try {
      const publicKey = new PublicKey(accountAddress)

      const subscriptionId = connection.onAccountChange(
        publicKey,
        (accountInfo, context) => {
          console.log(`Account change detected for ${accountType}:`, accountAddress, {
            slot: context.slot,
            lamports: accountInfo.lamports,
            dataLength: accountInfo.data.length,
          })

          // Parse account data based on type
          let parsedData = null
          try {
            // TODO: Parse account data using program IDL after deployment
            // For now, we'll pass raw account info
            parsedData = {
              lamports: accountInfo.lamports,
              owner: accountInfo.owner.toString(),
              executable: accountInfo.executable,
              rentEpoch: accountInfo.rentEpoch,
              dataLength: accountInfo.data.length,
            }
          }
          catch (parseError) {
            console.warn('Failed to parse account data:', parseError)
          }

          onAccountChange?.(accountAddress, accountType, parsedData)
        },
        'confirmed', // Commitment level
      )

      const subscription: WebSocketSubscription = {
        subscriptionId,
        accountAddress,
        accountType,
      }

      setSubscriptions(prev => [...prev, subscription])
      subscriptionsRef.current = [...subscriptionsRef.current, subscription]

      console.log(`Subscribed to ${accountType} account:`, accountAddress, 'ID:', subscriptionId)

      return subscriptionId
    }
    catch (error) {
      console.error(`Failed to subscribe to ${accountType} account:`, error)
      handleConnectionError(error as Error)
      return null
    }
  }, [enabled, connection, onAccountChange, handleConnectionError])

  /**
   * Unsubscribe from account changes
   */
  const unsubscribeFromAccount = useCallback(async (accountAddress: string) => {
    if (!connection)
      return

    const subscription = subscriptionsRef.current.find(sub => sub.accountAddress === accountAddress)
    if (!subscription)
      return

    try {
      await connection.removeAccountChangeListener(subscription.subscriptionId)

      setSubscriptions(prev => prev.filter(sub => sub.accountAddress !== accountAddress))
      subscriptionsRef.current = subscriptionsRef.current.filter(sub => sub.accountAddress !== accountAddress)

      console.log(`Unsubscribed from ${subscription.accountType} account:`, accountAddress)
    }
    catch (error) {
      console.error('Failed to unsubscribe from account:', error)
    }
  }, [connection])

  /**
   * Subscribe to multiple accounts at once
   */
  const subscribeToAccounts = useCallback(async (accounts: Array<{
    address: string
    type: 'factory' | 'market' | 'participant'
  }>) => {
    const subscriptionPromises = accounts.map(account =>
      subscribeToAccount(account.address, account.type),
    )

    const subscriptionIds = await Promise.all(subscriptionPromises)
    return subscriptionIds.filter(id => id !== null)
  }, [subscribeToAccount])

  /**
   * Unsubscribe from all accounts
   */
  const unsubscribeFromAll = useCallback(async () => {
    if (!connection)
      return

    const unsubscribePromises = subscriptionsRef.current.map(async (subscription) => {
      try {
        await connection.removeAccountChangeListener(subscription.subscriptionId)
        console.log(`Unsubscribed from ${subscription.accountType} account:`, subscription.accountAddress)
      }
      catch (error) {
        console.error('Failed to unsubscribe from account:', subscription.accountAddress, error)
      }
    })

    await Promise.all(unsubscribePromises)

    setSubscriptions([])
    subscriptionsRef.current = []
  }, [connection])

  /**
   * Check WebSocket connection status with rate limit handling
   */
  useEffect(() => {
    if (!enabled || !connection) {
      setIsConnected(false)
      return
    }

    // Test connection by getting recent blockhash
    const checkConnection = async () => {
      try {
        await connection.getLatestBlockhash('confirmed')
        setIsConnected(true)
        setReconnectAttempts(0) // Reset on successful connection
        isReconnectingRef.current = false
      }
      catch (error) {
        const errorMessage = error?.toString() || ''

        // Handle rate limiting specifically
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
          console.warn('RPC rate limit hit, reducing request frequency')
          setIsConnected(false)
          // Don't trigger full reconnection for rate limits
          // Just mark as disconnected and let polling handle it
        }
        else {
          handleConnectionError(error as Error)
        }
      }
    }

    checkConnection()

    // Set up periodic connection health check with longer interval to avoid rate limits
    const healthCheckInterval = setInterval(checkConnection, 60000) // Check every 60 seconds (reduced from 30)

    return () => {
      clearInterval(healthCheckInterval)
    }
  }, [enabled, connection, handleConnectionError])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      unsubscribeFromAll()
    }
  }, [unsubscribeFromAll])

  return {
    isConnected,
    subscriptions,
    reconnectAttempts,
    isReconnecting: isReconnectingRef.current,
    subscribeToAccount,
    unsubscribeFromAccount,
    subscribeToAccounts,
    unsubscribeFromAll,
  }
}

/**
 * Specialized hook for subscribing to market-related accounts
 */
export function useMarketWebSocketSubscriptions(marketAddresses: string[] = []) {
  const [accountChanges, setAccountChanges] = useState<Map<string, any>>(new Map())
  // Use ref to track previous addresses to avoid unnecessary re-subscriptions
  const prevAddressesRef = useRef<string>('')

  const handleAccountChange = useCallback((accountAddress: string, accountType: string, data: any) => {
    setAccountChanges(prev => new Map(prev.set(accountAddress, { type: accountType, data, timestamp: Date.now() })))

    // Log significant changes
    if (accountType === 'market') {
      console.log('Market account updated:', accountAddress, data)
    }
  }, [])

  const webSocket = useSolanaWebSocket({
    enabled: marketAddresses.length > 0,
    onAccountChange: handleAccountChange,
    onError: (error) => {
      console.error('Market WebSocket error:', error)
      marketToast.error('Real-time updates temporarily unavailable')
    },
  })

  // Subscribe to market accounts when addresses change
  useEffect(() => {
    if (marketAddresses.length === 0)
      return

    // Create a stable key from addresses to detect actual changes
    const addressesKey = marketAddresses.sort().join(',')

    // Only subscribe if addresses actually changed
    if (addressesKey === prevAddressesRef.current)
      return

    prevAddressesRef.current = addressesKey

    const accounts = marketAddresses.map(address => ({
      address,
      type: 'market' as const,
    }))

    webSocket.subscribeToAccounts(accounts)

    return () => {
      // Only unsubscribe on unmount or when addresses actually change
      webSocket.unsubscribeFromAll()
    }
  }, [marketAddresses.join(',')]) // Stable dependency

  return {
    ...webSocket,
    accountChanges,
    getAccountChange: (address: string) => accountChanges.get(address),
  }
}

/**
 * Specialized hook for subscribing to factory account changes
 */
export function useFactoryWebSocketSubscription(factoryAddress?: string) {
  const [factoryData, setFactoryData] = useState<any>(null)

  const handleAccountChange = useCallback((accountAddress: string, accountType: string, data: any) => {
    if (accountType === 'factory') {
      setFactoryData(data)
      console.log('Factory account updated:', accountAddress, data)
    }
  }, [])

  const webSocket = useSolanaWebSocket({
    enabled: !!factoryAddress,
    onAccountChange: handleAccountChange,
    onError: (error) => {
      console.error('Factory WebSocket error:', error)
    },
  })

  // Subscribe to factory account
  // Use ref to track if already subscribed
  const isSubscribedRef = useRef(false)
  const currentAddressRef = useRef<string>('')

  useEffect(() => {
    if (!factoryAddress)
      return

    // Only subscribe if not already subscribed or address changed
    if (isSubscribedRef.current && currentAddressRef.current === factoryAddress) {
      return
    }

    // Unsubscribe from old address if it changed
    if (isSubscribedRef.current && currentAddressRef.current !== factoryAddress) {
      webSocket.unsubscribeFromAccount(currentAddressRef.current)
    }

    webSocket.subscribeToAccount(factoryAddress, 'factory')
    isSubscribedRef.current = true
    currentAddressRef.current = factoryAddress

    return () => {
      // Only unsubscribe on unmount
      if (isSubscribedRef.current && currentAddressRef.current) {
        webSocket.unsubscribeFromAccount(currentAddressRef.current)
        isSubscribedRef.current = false
      }
    }
  }, [factoryAddress]) // Only depend on factoryAddress, not webSocket

  return {
    ...webSocket,
    factoryData,
  }
}
