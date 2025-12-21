/**
 * Supabase Error Boundary
 * 
 * Specialized error boundary for handling Supabase-related errors with
 * appropriate retry logic and user-friendly error messages.
 */

import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showRetry?: boolean
  maxRetries?: number
  context?: string // Context for better error messages
}

interface State {
  hasError: boolean
  error: Error | null
  retryCount: number
  errorType: 'network' | 'database' | 'auth' | 'validation' | 'unknown'
  isRecoverable: boolean
  isOnline: boolean
}

export class SupabaseErrorBoundary extends Component<Props, State> {
  private retryTimer?: NodeJS.Timeout

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      errorType: 'unknown',
      isRecoverable: true,
      isOnline: navigator.onLine,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorMessage = error.message.toLowerCase()
    const errorStack = error.stack?.toLowerCase() || ''
    
    let errorType: State['errorType'] = 'unknown'
    let isRecoverable = true

    // Classify Supabase errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('fetch') || 
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout')) {
      errorType = 'network'
      isRecoverable = true
    } else if (errorMessage.includes('unauthorized') || 
               errorMessage.includes('forbidden') ||
               errorMessage.includes('jwt') ||
               errorMessage.includes('auth')) {
      errorType = 'auth'
      isRecoverable = false
    } else if (errorMessage.includes('invalid') || 
               errorMessage.includes('validation') ||
               errorMessage.includes('constraint') ||
               errorMessage.includes('unique')) {
      errorType = 'validation'
      isRecoverable = false
    } else if (errorMessage.includes('database') || 
               errorMessage.includes('postgres') ||
               errorMessage.includes('supabase') ||
               errorStack.includes('supabase')) {
      errorType = 'database'
      isRecoverable = true
    }

    return {
      hasError: true,
      error,
      errorType,
      isRecoverable,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[SupabaseErrorBoundary] Caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context,
      errorType: this.state.errorType,
    })
    
    this.props.onError?.(error, errorInfo)
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }
  }

  handleOnline = () => {
    this.setState({ isOnline: true })
    
    // Auto-retry if we were offline and error was network-related
    if (this.state.hasError && this.state.errorType === 'network') {
      this.handleRetry()
    }
  }

  handleOffline = () => {
    this.setState({ isOnline: false })
  }

  handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3
    
    if (this.state.retryCount < maxRetries && this.state.isRecoverable) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
      }))
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
      errorType: 'unknown',
      isRecoverable: true,
    })
  }

  getErrorTitle(): string {
    const { context } = this.props
    const contextPrefix = context ? `${context}: ` : ''
    
    switch (this.state.errorType) {
      case 'network':
        return `${contextPrefix}Connection Issue`
      case 'database':
        return `${contextPrefix}Database Error`
      case 'auth':
        return `${contextPrefix}Authentication Required`
      case 'validation':
        return `${contextPrefix}Invalid Data`
      default:
        return `${contextPrefix}Something Went Wrong`
    }
  }

  getErrorMessage(): string {
    const { errorType, error, isOnline } = this.state
    
    if (!isOnline) {
      return 'You appear to be offline. Please check your internet connection.'
    }
    
    switch (errorType) {
      case 'network':
        return 'Unable to connect to the server. This might be a temporary issue.'
      case 'database':
        return 'There was an issue with the database. Our team has been notified.'
      case 'auth':
        return 'You need to sign in again to continue.'
      case 'validation':
        return error?.message || 'The data provided is invalid. Please check your input.'
      default:
        return error?.message || 'An unexpected error occurred. Please try again.'
    }
  }

  getErrorColor(): string {
    switch (this.state.errorType) {
      case 'network':
        return 'var(--accent-amber)'
      case 'auth':
        return 'var(--accent-blue)'
      case 'validation':
        return 'var(--accent-orange)'
      default:
        return 'var(--accent-red)'
    }
  }

  getErrorIcon() {
    const { errorType, isOnline } = this.state
    const color = this.getErrorColor()
    
    if (!isOnline) {
      return <WifiOff className="h-5 w-5" style={{ color }} />
    }
    
    switch (errorType) {
      case 'network':
        return <Wifi className="h-5 w-5" style={{ color }} />
      default:
        return <AlertTriangle className="h-5 w-5" style={{ color }} />
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { showRetry = true, maxRetries = 3 } = this.props
      const { retryCount, isRecoverable, errorType, isOnline } = this.state
      const canRetry = retryCount < maxRetries && isRecoverable
      const errorColor = this.getErrorColor()

      return (
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Error icon */}
              <div 
                className="p-3 rounded-full"
                style={{ backgroundColor: `${errorColor}20` }}
              >
                {this.getErrorIcon()}
              </div>

              {/* Error title and message */}
              <div className="space-y-2">
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {this.getErrorTitle()}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {this.getErrorMessage()}
                </p>
              </div>

              {/* Network status indicator */}
              {!isOnline && (
                <div 
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{ 
                    backgroundColor: 'var(--accent-amber)/10',
                    color: 'var(--accent-amber)'
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  <span>Waiting for connection...</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                {showRetry && canRetry && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry ({maxRetries - retryCount} left)
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={this.handleReset}
                  className="flex items-center gap-2"
                >
                  Reset
                </Button>
              </div>

              {/* Additional help text */}
              {errorType === 'auth' && (
                <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Please refresh the page and sign in again
                </p>
              )}
              
              {!isRecoverable && errorType === 'validation' && (
                <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                  Please check your input and try again
                </p>
              )}
              
              {retryCount >= maxRetries && isRecoverable && (
                <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                  If the problem persists, please refresh the page
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap components with Supabase error boundary
 */
export function withSupabaseErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <SupabaseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </SupabaseErrorBoundary>
  )

  WrappedComponent.displayName = `withSupabaseErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook to create error boundary props with context
 */
export function useSupabaseErrorBoundaryProps(context: string) {
  return React.useMemo(() => ({
    context,
    onError: (error: Error, errorInfo: React.ErrorInfo) => {
      // Log error for debugging and monitoring
      console.error(`[${context}] Supabase Error:`, {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      })
      
      // Here you could send error to monitoring service
      // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
    },
  }), [context])
}