/**
 * NetworkStatusBanner - Component for displaying network connectivity status
 *
 * Shows warnings when the user is offline or when there are network issues
 * affecting winnings calculations and data fetching.
 */

import React, { useEffect, useState } from 'react'
import { AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NetworkStatusBannerProps {
  /** Whether to show the banner */
  show?: boolean
  /** Custom message to display */
  message?: string
  /** Whether to show retry button */
  showRetry?: boolean
  /** Callback for retry action */
  onRetry?: () => void
  /** Variant for different scenarios */
  variant?: 'offline' | 'slow' | 'error'
  /** Additional CSS classes */
  className?: string
}

/**
 * Hook to detect online/offline status
 */
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState<string>('unknown')

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Detect connection type if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      setConnectionType(connection?.effectiveType || 'unknown')
      
      const handleConnectionChange = () => {
        setConnectionType(connection?.effectiveType || 'unknown')
      }
      
      connection?.addEventListener('change', handleConnectionChange)
      
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection?.removeEventListener('change', handleConnectionChange)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, connectionType }
}

/**
 * NetworkStatusBanner component
 */
export function NetworkStatusBanner({
  show = true,
  message,
  showRetry = true,
  onRetry,
  variant = 'offline',
  className,
}: NetworkStatusBannerProps) {
  const { isOnline, connectionType } = useNetworkStatus()
  
  // Don't show if explicitly hidden or if online and no custom message
  if (!show || (isOnline && !message && variant === 'offline')) {
    return null
  }

  // Determine display properties based on variant
  const getVariantProps = () => {
    switch (variant) {
      case 'offline':
        return {
          icon: WifiOff,
          color: 'var(--accent-red)',
          bgColor: 'var(--accent-red)/10',
          borderColor: 'var(--accent-red)/20',
          defaultMessage: 'You are currently offline. Some features may not work properly.',
        }
      case 'slow':
        return {
          icon: Wifi,
          color: 'var(--accent-amber)',
          bgColor: 'var(--accent-amber)/10',
          borderColor: 'var(--accent-amber)/20',
          defaultMessage: 'Slow network connection detected. Data may take longer to load.',
        }
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'var(--accent-red)',
          bgColor: 'var(--accent-red)/10',
          borderColor: 'var(--accent-red)/20',
          defaultMessage: 'Network error occurred. Please check your connection.',
        }
      default:
        return {
          icon: AlertTriangle,
          color: 'var(--accent-amber)',
          bgColor: 'var(--accent-amber)/10',
          borderColor: 'var(--accent-amber)/20',
          defaultMessage: 'Network issue detected.',
        }
    }
  }

  const { icon: Icon, color, bgColor, borderColor, defaultMessage } = getVariantProps()
  const displayMessage = message || defaultMessage

  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        className
      )}
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
    >
      <Icon 
        className="h-5 w-5 flex-shrink-0" 
        style={{ color }}
      />
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color }}>
          Network Status
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          {displayMessage}
        </p>
        
        {/* Connection details */}
        {!isOnline && (
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Connection: Offline
          </p>
        )}
        {isOnline && connectionType !== 'unknown' && (
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Connection: {connectionType.toUpperCase()}
          </p>
        )}
      </div>

      {/* Retry button */}
      {showRetry && onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="flex items-center gap-2"
          style={{ borderColor: color, color }}
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
}

/**
 * Compact network status indicator for inline use
 */
export function NetworkStatusIndicator({
  className,
}: {
  className?: string
}) {
  const { isOnline, connectionType } = useNetworkStatus()

  if (isOnline && connectionType !== 'slow-2g') {
    return null
  }

  return (
    <div className={cn('flex items-center gap-1 text-xs', className)}>
      {!isOnline ? (
        <>
          <WifiOff className="h-3 w-3 text-[var(--accent-red)]" />
          <span className="text-[var(--accent-red)]">Offline</span>
        </>
      ) : (
        <>
          <Wifi className="h-3 w-3 text-[var(--accent-amber)]" />
          <span className="text-[var(--accent-amber)]">Slow connection</span>
        </>
      )}
    </div>
  )
}

/**
 * Hook for network-aware data fetching
 */
export function useNetworkAwareRetry(
  retryFn: () => void,
  options: {
    maxRetries?: number
    retryDelay?: number
    exponentialBackoff?: boolean
  } = {}
) {
  const { isOnline } = useNetworkStatus()
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
  } = options

  const retry = React.useCallback(async () => {
    if (!isOnline || retryCount >= maxRetries || isRetrying) {
      return false
    }

    setIsRetrying(true)
    
    try {
      // Calculate delay with exponential backoff
      const delay = exponentialBackoff 
        ? retryDelay * Math.pow(2, retryCount)
        : retryDelay

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Execute retry
      retryFn()
      setRetryCount(prev => prev + 1)
      
      return true
    } catch (error) {
      console.error('[NetworkAwareRetry] Retry failed:', error)
      return false
    } finally {
      setIsRetrying(false)
    }
  }, [isOnline, retryCount, maxRetries, isRetrying, retryFn, retryDelay, exponentialBackoff])

  const reset = React.useCallback(() => {
    setRetryCount(0)
    setIsRetrying(false)
  }, [])

  return {
    retry,
    reset,
    canRetry: isOnline && retryCount < maxRetries && !isRetrying,
    retryCount,
    isRetrying,
    isOnline,
  }
}

/**
 * Higher-order component to wrap components with network status awareness
 */
export function withNetworkStatus<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    showBanner?: boolean
    showIndicator?: boolean
    onNetworkError?: (error: Error) => void
  } = {}
) {
  const WrappedComponent = (props: P) => {
    const { isOnline } = useNetworkStatus()
    const [networkError, setNetworkError] = useState<Error | null>(null)

    // Handle network errors
    useEffect(() => {
      if (!isOnline && !networkError) {
        const error = new Error('Network connection lost')
        setNetworkError(error)
        options.onNetworkError?.(error)
      } else if (isOnline && networkError) {
        setNetworkError(null)
      }
    }, [isOnline, networkError])

    return (
      <div>
        {options.showBanner && networkError && (
          <NetworkStatusBanner
            variant="offline"
            className="mb-4"
          />
        )}
        
        <div className="relative">
          <Component {...props} />
          
          {options.showIndicator && (
            <div className="absolute top-2 right-2">
              <NetworkStatusIndicator />
            </div>
          )}
        </div>
      </div>
    )
  }

  WrappedComponent.displayName = `withNetworkStatus(${Component.displayName || Component.name})`
  
  return WrappedComponent
}