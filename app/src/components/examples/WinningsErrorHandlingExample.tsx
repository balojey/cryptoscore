/**
 * WinningsErrorHandlingExample - Comprehensive example demonstrating all error handling features
 *
 * This component showcases the complete error handling system for winnings calculations,
 * including network errors, validation errors, exchange rate issues, and recovery strategies.
 */

import React, { useState } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WinningsDisplay } from '../WinningsDisplay'
import { WinningsErrorBoundary } from '../WinningsErrorBoundary'
import { WinningsLoadingSkeleton } from '../WinningsLoadingSkeleton'
import { NetworkStatusBanner, useNetworkAwareRetry } from '../NetworkStatusBanner'
import { WinningsErrorHandler, WinningsErrorType, ErrorSeverity } from '@/utils/winnings-error-handler'
import type { WinningsResult } from '@/utils/winnings-calculator'
import type { MarketData } from '@/hooks/useSupabaseMarketData'

/**
 * Mock data for demonstration
 */
const mockMarketData: MarketData = {
  address: 'mock-market-address',
  creator: 'mock-creator-address',
  matchId: 'mock-match-123',
  entryFee: 100_000_000, // 0.1 SOL
  totalPool: 1_000_000_000, // 1 SOL
  participantCount: 10,
  homeCount: 4,
  drawCount: 2,
  awayCount: 4,
  status: 'Open',
  outcome: null,
  kickoffTime: Date.now() + 3600000, // 1 hour from now
  isPrivate: false,
}

const mockWinningsResult: WinningsResult = {
  type: 'potential',
  amount: 237_500_000, // ~0.2375 SOL
  status: 'eligible',
  message: 'Potential winnings for your Home prediction',
  displayVariant: 'info',
  icon: 'Target',
  breakdown: {
    participantWinnings: 237_500_000,
    totalPool: 1_000_000_000,
    winnerCount: 4,
  },
}

/**
 * Error scenario configurations
 */
const errorScenarios = [
  {
    id: 'network',
    title: 'Network Connection Error',
    description: 'Simulates network connectivity issues',
    errorType: WinningsErrorType.NETWORK_ERROR,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },
  {
    id: 'exchange-rate',
    title: 'Exchange Rate Unavailable',
    description: 'Currency conversion service is down',
    errorType: WinningsErrorType.EXCHANGE_RATE_ERROR,
    severity: ErrorSeverity.LOW,
    recoverable: true,
  },
  {
    id: 'validation',
    title: 'Data Validation Error',
    description: 'Market data is corrupted or invalid',
    errorType: WinningsErrorType.VALIDATION_ERROR,
    severity: ErrorSeverity.HIGH,
    recoverable: false,
  },
  {
    id: 'calculation',
    title: 'Calculation Error',
    description: 'Error in winnings calculation logic',
    errorType: WinningsErrorType.CALCULATION_ERROR,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },
  {
    id: 'timeout',
    title: 'Request Timeout',
    description: 'Request took too long to complete',
    errorType: WinningsErrorType.TIMEOUT_ERROR,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
  },
]

/**
 * Component states for demonstration
 */
type DemoState = 'loading' | 'success' | 'error' | 'network-offline'

export function WinningsErrorHandlingExample() {
  const [currentState, setCurrentState] = useState<DemoState>('success')
  const [selectedError, setSelectedError] = useState(errorScenarios[0])
  const [showNetworkBanner, setShowNetworkBanner] = useState(false)
  const [errorStats, setErrorStats] = useState(WinningsErrorHandler.getErrorStats())

  // Network-aware retry functionality
  const { retry, canRetry, retryCount, isRetrying } = useNetworkAwareRetry(
    () => {
      console.log('Retrying winnings calculation...')
      setCurrentState('loading')
      setTimeout(() => setCurrentState('success'), 1000)
    },
    { maxRetries: 3 }
  )

  // Simulate different error scenarios
  const simulateError = (scenario: typeof errorScenarios[0]) => {
    const error = new Error(`Simulated ${scenario.title}: ${scenario.description}`)
    
    // Use error handler to classify and handle the error
    const winningsError = WinningsErrorHandler.classifyError(error, {
      operation: 'demo_simulation',
      scenario: scenario.id,
    })

    setSelectedError(scenario)
    setCurrentState('error')
    setErrorStats(WinningsErrorHandler.getErrorStats())

    console.log('Simulated error:', winningsError)
  }

  // Render different states
  const renderContent = () => {
    switch (currentState) {
      case 'loading':
        return (
          <WinningsLoadingSkeleton
            variant="detailed"
            showBreakdown={true}
            loadingType="calculating"
            animate={true}
          />
        )

      case 'success':
        return (
          <WinningsDisplay
            marketData={mockMarketData}
            participantData={{
              market: mockMarketData.address,
              user: 'mock-user-address',
              prediction: 'Home',
              hasWithdrawn: false,
            }}
            userAddress="mock-user-address"
            winnings={mockWinningsResult}
            variant="detailed"
            showBreakdown={true}
          />
        )

      case 'error':
        // Create a component that will throw an error for the error boundary
        const ErrorComponent = () => {
          throw new Error(`${selectedError.title}: ${selectedError.description}`)
        }

        return (
          <WinningsErrorBoundary
            variant="detailed"
            marketData={{
              entryFee: mockMarketData.entryFee,
              totalPool: mockMarketData.totalPool,
              participantCount: mockMarketData.participantCount,
            }}
            showRetry={selectedError.recoverable}
            showNetworkStatus={selectedError.errorType === WinningsErrorType.NETWORK_ERROR}
            exchangeRateError={selectedError.errorType === WinningsErrorType.EXCHANGE_RATE_ERROR ? 'Exchange rate service unavailable' : undefined}
          >
            <ErrorComponent />
          </WinningsErrorBoundary>
        )

      case 'network-offline':
        return (
          <div className="space-y-4">
            <NetworkStatusBanner
              variant="offline"
              showRetry={true}
              onRetry={() => {
                setShowNetworkBanner(false)
                setCurrentState('loading')
                setTimeout(() => setCurrentState('success'), 2000)
              }}
            />
            <WinningsLoadingSkeleton
              variant="detailed"
              loadingType="network"
              animate={false}
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Winnings Error Handling Demo
        </h1>
        <p className="text-[var(--text-secondary)]">
          Comprehensive demonstration of error handling, loading states, and recovery mechanisms
        </p>
      </div>

      {/* Control Panel */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Demo Controls
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <Button
              variant={currentState === 'success' ? 'default' : 'outline'}
              onClick={() => setCurrentState('success')}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Success
            </Button>
            
            <Button
              variant={currentState === 'loading' ? 'default' : 'outline'}
              onClick={() => setCurrentState('loading')}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Loading
            </Button>
            
            <Button
              variant={currentState === 'network-offline' ? 'default' : 'outline'}
              onClick={() => setCurrentState('network-offline')}
              className="flex items-center gap-2"
            >
              <WifiOff className="h-4 w-4" />
              Offline
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowNetworkBanner(!showNetworkBanner)}
              className="flex items-center gap-2"
            >
              <Wifi className="h-4 w-4" />
              Network Banner
            </Button>
          </div>

          {/* Error Scenarios */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Error Scenarios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {errorScenarios.map((scenario) => (
                <Button
                  key={scenario.id}
                  variant="outline"
                  size="sm"
                  onClick={() => simulateError(scenario)}
                  className="flex items-center gap-2 text-left justify-start"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {scenario.title}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">
                      {scenario.description}
                    </div>
                  </div>
                  <Badge 
                    variant={scenario.severity === ErrorSeverity.HIGH ? 'error' : 
                            scenario.severity === ErrorSeverity.MEDIUM ? 'warning' : 'info'}
                    className="text-xs"
                  >
                    {scenario.severity}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Retry Controls */}
          {currentState === 'error' && selectedError.recoverable && (
            <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Network-Aware Retry
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Attempts: {retryCount} | Can retry: {canRetry ? 'Yes' : 'No'}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={retry}
                  disabled={!canRetry || isRetrying}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Status Banner */}
      {showNetworkBanner && (
        <NetworkStatusBanner
          variant="slow"
          message="Slow network connection detected. Winnings calculations may take longer."
          showRetry={true}
          onRetry={() => setShowNetworkBanner(false)}
        />
      )}

      {/* Main Demo Area */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Winnings Display
            </h2>
            <Badge variant="outline">
              State: {currentState}
            </Badge>
          </div>
          
          {renderContent()}
        </CardContent>
      </Card>

      {/* Error Statistics */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Error Statistics
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {errorStats.total}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Total Errors
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--accent-red)]">
                {errorStats.bySeverity.high + errorStats.bySeverity.critical}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Critical/High
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--accent-amber)]">
                {errorStats.bySeverity.medium}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Medium
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--accent-cyan)]">
                {errorStats.bySeverity.low}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">
                Low
              </div>
            </div>
          </div>

          {/* Recent Errors */}
          {errorStats.recent.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                Recent Errors
              </h3>
              <div className="space-y-1">
                {errorStats.recent.slice(0, 3).map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <Badge 
                      variant={error.severity === ErrorSeverity.HIGH ? 'error' : 
                              error.severity === ErrorSeverity.MEDIUM ? 'warning' : 'info'}
                      className="text-xs"
                    >
                      {error.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-[var(--text-secondary)] truncate">
                      {error.userMessage}
                    </span>
                    <span className="text-[var(--text-tertiary)] ml-auto">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clear History */}
          <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                WinningsErrorHandler.clearHistory()
                setErrorStats(WinningsErrorHandler.getErrorStats())
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Error History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Notes */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Implementation Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Error Handling
              </h3>
              <ul className="space-y-1 text-[var(--text-secondary)]">
                <li>• Structured error classification</li>
                <li>• Automatic recovery strategies</li>
                <li>• User-friendly error messages</li>
                <li>• Error severity levels</li>
                <li>• Comprehensive error logging</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Network Awareness
              </h3>
              <ul className="space-y-1 text-[var(--text-secondary)]">
                <li>• Online/offline detection</li>
                <li>• Connection quality monitoring</li>
                <li>• Exponential backoff retry</li>
                <li>• Network status indicators</li>
                <li>• Graceful degradation</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Loading States
              </h3>
              <ul className="space-y-1 text-[var(--text-secondary)]">
                <li>• Skeleton loading screens</li>
                <li>• Different loading types</li>
                <li>• Animated vs static states</li>
                <li>• Context-aware messaging</li>
                <li>• Responsive design</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-[var(--text-primary)] mb-2">
                Fallback Strategies
              </h3>
              <ul className="space-y-1 text-[var(--text-secondary)]">
                <li>• Exchange rate fallbacks</li>
                <li>• Basic market info display</li>
                <li>• SOL-only calculations</li>
                <li>• Cached data usage</li>
                <li>• Progressive enhancement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default WinningsErrorHandlingExample