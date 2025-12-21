/**
 * WinningsErrorBoundary - Specialized error boundary for winnings calculation failures
 *
 * Provides graceful fallback displays when winnings calculations fail,
 * with options to retry or fall back to basic market information.
 */

import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  children: ReactNode
  /** Fallback component to render on error */
  fallback?: ReactNode
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Whether to show retry button */
  showRetry?: boolean
  /** Custom error message */
  errorMessage?: string
  /** Market data for fallback display */
  marketData?: {
    entryFee: number
    totalPool: number
    participantCount: number
  }
  /** Variant for different display contexts */
  variant?: 'compact' | 'detailed'
  /** Whether to show network status */
  showNetworkStatus?: boolean
  /** Exchange rate error handling */
  exchangeRateError?: string | null
}

interface State {
  hasError: boolean
  error: Error | null
  retryCount: number
  errorType: 'calculation' | 'network' | 'validation' | 'unknown'
  isRecoverable: boolean
}

export class WinningsErrorBoundary extends Component<Props, State> {
  private static readonly MAX_RETRIES = 3

  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      retryCount: 0,
      errorType: 'unknown',
      isRecoverable: true,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Determine error type and recoverability
    const errorMessage = error.message.toLowerCase()
    let errorType: State['errorType'] = 'unknown'
    let isRecoverable = true

    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      errorType = 'network'
      isRecoverable = true
    } else if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
      errorType = 'validation'
      isRecoverable = false
    } else if (errorMessage.includes('calculation') || errorMessage.includes('winnings')) {
      errorType = 'calculation'
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
    console.error('[WinningsErrorBoundary] Caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    if (this.state.retryCount < WinningsErrorBoundary.MAX_RETRIES && this.state.isRecoverable) {
      this.setState(prevState => ({ 
        hasError: false, 
        error: null,
        retryCount: prevState.retryCount + 1,
        errorType: 'unknown',
        isRecoverable: true,
      }))
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Render appropriate error display based on variant
      if (this.props.variant === 'compact') {
        return this.renderCompactError()
      }

      return this.renderDetailedError()
    }

    return this.props.children
  }

  private renderCompactError() {
    const { marketData, showRetry = true, exchangeRateError } = this.props
    const canRetry = this.state.retryCount < WinningsErrorBoundary.MAX_RETRIES && this.state.isRecoverable

    // Show different colors based on error type
    const errorColor = this.state.errorType === 'network' ? 'var(--accent-amber)' : 'var(--accent-red)'
    const bgColor = this.state.errorType === 'network' ? 'var(--accent-amber)/10' : 'var(--accent-red)/10'
    const borderColor = this.state.errorType === 'network' ? 'var(--accent-amber)/20' : 'var(--accent-red)/20'

    return (
      <div className="flex items-center gap-2 p-2 rounded-lg" style={{ 
        backgroundColor: bgColor, 
        border: `1px solid ${borderColor}` 
      }}>
        <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: errorColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium" style={{ color: errorColor }}>
            {this.getErrorTitle()}
          </p>
          {marketData && (
            <p className="text-xs text-[var(--text-secondary)] truncate">
              Entry fee: ◎{(marketData.entryFee / 1_000_000_000).toFixed(4)}
            </p>
          )}
          {exchangeRateError && (
            <p className="text-xs text-[var(--text-secondary)] truncate">
              Currency conversion unavailable
            </p>
          )}
        </div>
        {showRetry && canRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={this.handleRetry}
            className="h-6 w-6 p-0 hover:bg-black/10"
            style={{ color: errorColor }}
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  private renderDetailedError() {
    const { marketData, showRetry = true, errorMessage, exchangeRateError, showNetworkStatus = true } = this.props
    const canRetry = this.state.retryCount < WinningsErrorBoundary.MAX_RETRIES && this.state.isRecoverable
    const displayMessage = errorMessage || this.state.error?.message || 'Failed to calculate winnings'

    // Determine colors based on error type
    const errorColor = this.state.errorType === 'network' ? 'var(--accent-amber)' : 'var(--accent-red)'
    const bgColor = this.state.errorType === 'network' ? 'var(--accent-amber)/10' : 'var(--accent-red)/10'
    const borderColor = this.state.errorType === 'network' ? 'var(--accent-amber)/20' : 'var(--accent-red)/20'

    return (
      <Card className="w-full" style={{ borderColor }}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Error header */}
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: bgColor }}>
                <AlertTriangle className="h-5 w-5" style={{ color: errorColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                  {this.getErrorTitle()}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {displayMessage}
                </p>
                {this.state.errorType === 'validation' && (
                  <p className="text-xs text-[var(--accent-red)] mt-1">
                    This error cannot be resolved automatically. Please refresh the page.
                  </p>
                )}
              </div>
            </div>

            {/* Network status */}
            {showNetworkStatus && this.state.errorType === 'network' && (
              <div className="border-t border-[var(--border-default)] pt-4">
                <div className="flex items-center gap-2 text-sm text-[var(--accent-amber)]">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-amber)] animate-pulse" />
                  <span>Checking network connection...</span>
                </div>
              </div>
            )}

            {/* Exchange rate error */}
            {exchangeRateError && (
              <div className="border-t border-[var(--border-default)] pt-4">
                <div className="flex items-center gap-2 text-sm text-[var(--accent-amber)]">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Currency conversion unavailable - amounts shown in SOL</span>
                </div>
              </div>
            )}

            {/* Fallback market information */}
            {marketData && (
              <div className="border-t border-[var(--border-default)] pt-4">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Basic Market Info
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--text-secondary)]">Entry Fee:</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      ◎{(marketData.entryFee / 1_000_000_000).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--text-secondary)]">Total Pool:</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      ◎{(marketData.totalPool / 1_000_000_000).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--text-secondary)]">Participants:</span>
                    <span className="font-medium text-[var(--text-primary)]">
                      {marketData.participantCount}
                    </span>
                  </div>
                </div>
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
                  Retry ({WinningsErrorBoundary.MAX_RETRIES - this.state.retryCount} left)
                </Button>
              )}
              {!this.state.isRecoverable && (
                <p className="text-xs text-[var(--accent-red)] flex items-center">
                  This error requires a page refresh to resolve
                </p>
              )}
              {this.state.isRecoverable && !canRetry && (
                <p className="text-xs text-[var(--text-secondary)] flex items-center">
                  Maximum retry attempts reached
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  private getErrorTitle(): string {
    switch (this.state.errorType) {
      case 'network':
        return 'Network Connection Issue'
      case 'validation':
        return 'Data Validation Error'
      case 'calculation':
        return 'Winnings Calculation Error'
      default:
        return 'Winnings Display Error'
    }
  }
}

/**
 * Higher-order component to wrap components with winnings error boundary
 */
export function withWinningsErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <WinningsErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </WinningsErrorBoundary>
  )

  WrappedComponent.displayName = `withWinningsErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Hook to create error boundary props from market data
 */
export function useWinningsErrorBoundaryProps(marketData?: {
  entryFee: number
  totalPool: number
  participantCount: number
}) {
  return React.useMemo(() => ({
    marketData,
    onError: (error: Error, errorInfo: React.ErrorInfo) => {
      // Log error for debugging
      console.error('[WinningsErrorBoundary] Error details:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        marketData,
      })
    },
  }), [marketData])
}