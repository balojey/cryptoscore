/**
 * WinningsDisplay - Reusable component for displaying winnings information
 *
 * Supports both compact and detailed display variants with proper currency formatting,
 * visual indicators for different winnings states, responsive design, and full accessibility.
 * 
 * Performance optimizations:
 * - React.memo for preventing unnecessary re-renders
 * - Memoized calculations and formatting
 * - Optimized dependency management
 * 
 * Accessibility features:
 * - ARIA labels and screen reader support
 * - Keyboard navigation support
 * - Focus management
 * - High contrast support
 * - Reduced motion support
 */

import React from 'react'
import { 
  TrendingUp, 
  Target, 
  Crown, 
  Award, 
  Trophy, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Info, 
  AlertTriangle 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useMnee } from '@/hooks/useMnee'
import { WinningsLoadingSkeleton } from './WinningsLoadingSkeleton'
import { WinningsErrorBoundary } from './WinningsErrorBoundary'
import { 
  handleKeyboardClick, 
  announceToScreenReader, 
  formatForScreenReader,
  prefersReducedMotion 
} from '@/utils/accessibility'
import type { WinningsResult } from '@/utils/winnings-calculator'
import type { MarketData } from '@/hooks/useSupabaseMarketData'
import type { ParticipantData } from '@/hooks/useSupabaseParticipantData'
import type { EnhancedMatchData } from '@/hooks/useMatchData'

/**
 * Props for WinningsDisplay component
 */
export interface WinningsDisplayProps {
  /** Market data for context */
  marketData: MarketData
  /** Participant data if user has joined */
  participantData?: ParticipantData | null
  /** User wallet address */
  userAddress?: string
  /** Match data for resolved markets */
  matchData?: EnhancedMatchData | null
  /** Calculated winnings result */
  winnings: WinningsResult
  /** Display variant - compact for cards, detailed for full views */
  variant?: 'compact' | 'detailed'
  /** Whether to show detailed breakdown */
  showBreakdown?: boolean
  /** Additional CSS classes */
  className?: string
  /** Callback for interactive elements (accessibility) */
  onInteraction?: () => void
  /** Whether component is focusable */
  focusable?: boolean
  /** ARIA label override */
  ariaLabel?: string
  /** Whether to announce changes to screen readers */
  announceChanges?: boolean
  /** Test ID for testing */
  testId?: string
}

/**
 * Icon mapping for different winnings result icons
 */
const ICON_MAP = {
  TrendingUp,
  Target,
  Crown,
  Award,
  Trophy,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
} as const

/**
 * Badge variant mapping for display variants
 */
const BADGE_VARIANT_MAP = {
  success: 'success',
  warning: 'warning',
  info: 'info',
  error: 'error',
} as const

/**
 * WinningsDisplay component with performance optimizations and accessibility
 */
const WinningsDisplayComponent = React.forwardRef<HTMLDivElement, WinningsDisplayProps>(({
  participantData,
  matchData,
  winnings,
  variant = 'detailed',
  showBreakdown = false,
  className,
  onInteraction,
  focusable = false,
  ariaLabel,
  announceChanges = false,
  testId,
}, ref) => {
  const { formatAmount } = useMnee()
  
  // Refs for focus management
  const containerRef = React.useRef<HTMLDivElement>(null)
  const previousWinningsRef = React.useRef<WinningsResult | null>(null)
  
  // Combine refs
  const combinedRef = React.useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node
    if (typeof ref === 'function') {
      ref(node)
    } else if (ref) {
      ref.current = node
    }
  }, [ref])

  // Check for reduced motion preference
  const reducedMotion = React.useMemo(() => prefersReducedMotion(), [])

  // Memoized icon component
  const IconComponent = React.useMemo(() => 
    ICON_MAP[winnings.icon as keyof typeof ICON_MAP] || Info, 
    [winnings.icon]
  )

  // Memoized badge variant
  const badgeVariant = React.useMemo(() => 
    BADGE_VARIANT_MAP[winnings.displayVariant] || 'info', 
    [winnings.displayVariant]
  )

  // Memoized formatted amount with error handling
  const formattedAmount = React.useMemo(() => {
    if (winnings.amount <= 0) return '—'
    
    try {
      return formatAmount(winnings.amount)
    } catch (error) {
      console.warn('[WinningsDisplay] MNEE formatting error:', error)
      // Fallback to basic MNEE display
      const mneeAmount = winnings.amount / 100000 // Convert from atomic units
      return `${mneeAmount.toFixed(5)} MNEE`
    }
  }, [winnings.amount, formatAmount])

  // Memoized screen reader formatted amount
  const screenReaderAmount = React.useMemo(() => {
    if (winnings.amount <= 0) return 'No winnings'
    
    const mneeAmount = winnings.amount / 100000 // Convert from atomic units
    return formatForScreenReader(mneeAmount, 'MNEE')
  }, [winnings.amount])

  // Exchange rate warning is no longer needed with MNEE-only system
  const showRateWarning = false

  // Memoized breakdown formatting
  const formattedBreakdown = React.useMemo(() => {
    if (!winnings.breakdown) return undefined

    const formatSafely = (amount?: number) => {
      if (!amount) return undefined
      try {
        return formatAmount(amount)
      } catch (error) {
        console.warn('[WinningsDisplay] Breakdown formatting error:', error)
        const mneeAmount = amount / 100000 // Convert from atomic units
        return `${mneeAmount.toFixed(5)} MNEE`
      }
    }

    return {
      participantWinnings: formatSafely(winnings.breakdown.participantWinnings),
      creatorReward: formatSafely(winnings.breakdown.creatorReward),
      totalPool: formatSafely(winnings.breakdown.totalPool),
      winnerCount: winnings.breakdown.winnerCount,
    }
  }, [winnings.breakdown, formatAmount])

  // Memoized ARIA label
  const computedAriaLabel = React.useMemo(() => {
    if (ariaLabel) return ariaLabel
    
    const typeLabel = {
      potential: 'Potential winnings',
      actual: 'Actual winnings',
      creator_reward: 'Creator reward',
      none: 'No winnings'
    }[winnings.type] || 'Winnings'
    
    return `${typeLabel}: ${screenReaderAmount}. ${winnings.message}`
  }, [ariaLabel, winnings.type, winnings.message, screenReaderAmount])

  // Announce changes to screen readers
  React.useEffect(() => {
    if (announceChanges && previousWinningsRef.current) {
      const previous = previousWinningsRef.current
      const current = winnings
      
      // Only announce significant changes
      if (previous.amount !== current.amount || previous.type !== current.type) {
        const message = `Winnings updated: ${screenReaderAmount}`
        announceToScreenReader(message, 'polite')
      }
    }
    
    previousWinningsRef.current = winnings
  }, [winnings, screenReaderAmount, announceChanges])

  // Keyboard interaction handler
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (focusable && onInteraction) {
      handleKeyboardClick(event, onInteraction)
    }
  }, [focusable, onInteraction])

  // Click handler for interactive elements
  const handleClick = React.useCallback(() => {
    if (focusable && onInteraction) {
      onInteraction()
    }
  }, [focusable, onInteraction])

  // Focus management
  const handleFocus = React.useCallback(() => {
    if (announceChanges) {
      announceToScreenReader(computedAriaLabel, 'polite')
    }
  }, [announceChanges, computedAriaLabel])

  if (variant === 'compact') {
    return (
      <div 
        ref={combinedRef}
        className={cn(
          'flex items-center gap-2',
          focusable && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)] focus:ring-offset-2 rounded-md p-1',
          !reducedMotion && focusable && 'transition-all duration-200 hover:bg-[var(--bg-secondary)]/50',
          className
        )}
        role={focusable ? 'button' : 'region'}
        tabIndex={focusable ? 0 : undefined}
        aria-label={computedAriaLabel}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        data-testid={testId}
      >
        <IconComponent 
          className={cn(
            'h-4 w-4 flex-shrink-0',
            winnings.displayVariant === 'success' && 'text-[var(--accent-green)]',
            winnings.displayVariant === 'warning' && 'text-[var(--accent-amber)]',
            winnings.displayVariant === 'info' && 'text-[var(--accent-cyan)]',
            winnings.displayVariant === 'error' && 'text-[var(--accent-red)]'
          )}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span 
              className={cn(
                'font-semibold text-sm',
                winnings.displayVariant === 'success' && 'text-[var(--accent-green)]',
                winnings.displayVariant === 'warning' && 'text-[var(--accent-amber)]',
                winnings.displayVariant === 'info' && 'text-[var(--text-primary)]',
                winnings.displayVariant === 'error' && 'text-[var(--accent-red)]'
              )}
              aria-label={`Amount: ${screenReaderAmount}`}
            >
              {formattedAmount}
            </span>
            <Badge 
              variant={badgeVariant} 
              className="text-xs"
              aria-label={`Type: ${winnings.type.replace('_', ' ')}`}
            >
              {winnings.type === 'potential' && 'Potential'}
              {winnings.type === 'actual' && 'Actual'}
              {winnings.type === 'creator_reward' && 'Creator'}
              {winnings.type === 'none' && 'None'}
            </Badge>
          </div>
          <p 
            className="text-xs text-[var(--text-secondary)] truncate"
            aria-label={`Status: ${winnings.message}`}
          >
            {winnings.message}
          </p>
        </div>
        {/* Screen reader only content */}
        <span className="sr-only">
          {computedAriaLabel}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={combinedRef}
      className={cn(
        'w-full rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lg)]',
        focusable && 'cursor-pointer focus-within:ring-2 focus-within:ring-[var(--accent-cyan)] focus-within:ring-offset-2',
        !reducedMotion && focusable && 'transition-all duration-200 hover:shadow-md hover:border-[var(--border-hover)] hover:-translate-y-0.5',
        className
      )}
      role={focusable ? 'button' : 'region'}
      tabIndex={focusable ? 0 : undefined}
      aria-label={computedAriaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      data-testid={testId}
    >
      <div className="p-4">
        <div className="space-y-3">
          {/* Header with icon and status */}
          <div className="flex items-start gap-3">
            <div 
              className={cn(
                'p-2 rounded-lg flex-shrink-0',
                winnings.displayVariant === 'success' && 'bg-[var(--accent-green)]/10',
                winnings.displayVariant === 'warning' && 'bg-[var(--accent-amber)]/10',
                winnings.displayVariant === 'info' && 'bg-[var(--accent-cyan)]/10',
                winnings.displayVariant === 'error' && 'bg-[var(--accent-red)]/10'
              )}
              aria-hidden="true"
            >
              <IconComponent className={cn(
                'h-5 w-5',
                winnings.displayVariant === 'success' && 'text-[var(--accent-green)]',
                winnings.displayVariant === 'warning' && 'text-[var(--accent-amber)]',
                winnings.displayVariant === 'info' && 'text-[var(--accent-cyan)]',
                winnings.displayVariant === 'error' && 'text-[var(--accent-red)]'
              )} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 
                  className="font-semibold text-[var(--text-primary)]"
                  id={`winnings-title-${testId || 'default'}`}
                >
                  Winnings
                </h3>
                <Badge 
                  variant={badgeVariant}
                  aria-label={`Winnings type: ${winnings.type.replace('_', ' ')}`}
                >
                  {winnings.type === 'potential' && 'Potential'}
                  {winnings.type === 'actual' && 'Actual'}
                  {winnings.type === 'creator_reward' && 'Creator Reward'}
                  {winnings.type === 'none' && 'No Winnings'}
                </Badge>
              </div>
              
              <p 
                className="text-sm text-[var(--text-secondary)]"
                aria-describedby={`winnings-title-${testId || 'default'}`}
              >
                {winnings.message}
              </p>
            </div>
          </div>

          {/* Amount display */}
          <div className="border-t border-[var(--border-default)] pt-3">
            <div className="text-center">
              <div 
                className={cn(
                  'text-2xl font-bold mb-1',
                  winnings.displayVariant === 'success' && 'text-[var(--accent-green)]',
                  winnings.displayVariant === 'warning' && 'text-[var(--accent-amber)]',
                  winnings.displayVariant === 'info' && 'text-[var(--text-primary)]',
                  winnings.displayVariant === 'error' && 'text-[var(--accent-red)]'
                )}
                aria-label={`Winnings amount: ${screenReaderAmount}`}
                role="text"
              >
                {formattedAmount}
              </div>
              
              {winnings.status && (
                <div 
                  className="text-xs text-[var(--text-secondary)] uppercase tracking-wide"
                  aria-label={`Status: ${winnings.status.replace('_', ' ')}`}
                >
                  Status: {winnings.status.replace('_', ' ')}
                </div>
              )}
              
              {/* Exchange rate warning - removed for MNEE-only system */}
            </div>
          </div>

          {/* Breakdown section */}
          {showBreakdown && formattedBreakdown && (
            <div 
              className="border-t border-[var(--border-default)] pt-3 space-y-2"
              role="region"
              aria-labelledby={`breakdown-title-${testId || 'default'}`}
            >
              <h4 
                className="text-sm font-medium text-[var(--text-primary)] mb-2"
                id={`breakdown-title-${testId || 'default'}`}
              >
                Breakdown
              </h4>
              
              {formattedBreakdown.participantWinnings && (
                <div className="flex justify-between items-center text-sm" role="group">
                  <span className="text-[var(--text-secondary)]">
                    Participant Winnings:
                  </span>
                  <span 
                    className="font-medium text-[var(--text-primary)]"
                    aria-label={`Participant winnings: ${formatForScreenReader(formattedBreakdown.participantWinnings)}`}
                  >
                    {formattedBreakdown.participantWinnings}
                  </span>
                </div>
              )}
              
              {formattedBreakdown.creatorReward && (
                <div className="flex justify-between items-center text-sm" role="group">
                  <span className="text-[var(--text-secondary)]">
                    Creator Reward:
                  </span>
                  <span 
                    className="font-medium text-[var(--text-primary)]"
                    aria-label={`Creator reward: ${formatForScreenReader(formattedBreakdown.creatorReward)}`}
                  >
                    {formattedBreakdown.creatorReward}
                  </span>
                </div>
              )}
              
              {formattedBreakdown.totalPool && (
                <div className="flex justify-between items-center text-sm" role="group">
                  <span className="text-[var(--text-secondary)]">
                    Total Pool:
                  </span>
                  <span 
                    className="font-medium text-[var(--text-primary)]"
                    aria-label={`Total pool: ${formatForScreenReader(formattedBreakdown.totalPool)}`}
                  >
                    {formattedBreakdown.totalPool}
                  </span>
                </div>
              )}
              
              {formattedBreakdown.winnerCount !== undefined && (
                <div className="flex justify-between items-center text-sm" role="group">
                  <span className="text-[var(--text-secondary)]">
                    Winners:
                  </span>
                  <span 
                    className="font-medium text-[var(--text-primary)]"
                    aria-label={`Number of winners: ${formattedBreakdown.winnerCount}`}
                  >
                    {formattedBreakdown.winnerCount}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Additional context for participants */}
          {participantData && (
            <div 
              className="border-t border-[var(--border-default)] pt-3"
              role="region"
              aria-labelledby={`participant-info-${testId || 'default'}`}
            >
              <h4 
                className="sr-only"
                id={`participant-info-${testId || 'default'}`}
              >
                Participant Information
              </h4>
              
              <div className="flex justify-between items-center text-sm" role="group">
                <span className="text-[var(--text-secondary)]">
                  Your Prediction:
                </span>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  aria-label={`Your prediction: ${participantData.prediction}`}
                >
                  {participantData.prediction}
                </Badge>
              </div>
              
              {matchData?.matchResult && (
                <div className="flex justify-between items-center text-sm mt-1" role="group">
                  <span className="text-[var(--text-secondary)]">
                    Match Result:
                  </span>
                  <Badge 
                    variant={matchData.matchResult === participantData.prediction ? 'success' : 'error'}
                    className="text-xs"
                    aria-label={`Match result: ${matchData.matchResult}. ${
                      matchData.matchResult === participantData.prediction ? 'Correct prediction' : 'Incorrect prediction'
                    }`}
                  >
                    {matchData.matchResult}
                  </Badge>
                </div>
              )}
            </div>
          )}
          
          {/* Screen reader summary */}
          <div className="sr-only" aria-live="polite">
            {computedAriaLabel}
            {showBreakdown && formattedBreakdown && (
              <span>
                {formattedBreakdown.participantWinnings && ` Participant winnings: ${formattedBreakdown.participantWinnings}.`}
                {formattedBreakdown.creatorReward && ` Creator reward: ${formattedBreakdown.creatorReward}.`}
                {formattedBreakdown.totalPool && ` Total pool: ${formattedBreakdown.totalPool}.`}
                {formattedBreakdown.winnerCount !== undefined && ` Winners: ${formattedBreakdown.winnerCount}.`}
              </span>
            )}
            {participantData && (
              <span>
                {` Your prediction: ${participantData.prediction}.`}
                {matchData?.matchResult && ` Match result: ${matchData.matchResult}.`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

// Set display name for debugging
WinningsDisplayComponent.displayName = 'WinningsDisplay'

// Memoize the component to prevent unnecessary re-renders
export const WinningsDisplay = React.memo(WinningsDisplayComponent, (prevProps, nextProps) => {
  // Custom comparison function for performance optimization
  // Return true if props are equal (should NOT re-render), false if different (should re-render)
  
  // Check basic winnings properties
  if (
    prevProps.winnings.amount !== nextProps.winnings.amount ||
    prevProps.winnings.type !== nextProps.winnings.type ||
    prevProps.winnings.status !== nextProps.winnings.status ||
    prevProps.winnings.displayVariant !== nextProps.winnings.displayVariant ||
    prevProps.winnings.message !== nextProps.winnings.message
  ) {
    return false
  }
  
  // Check component props
  if (
    prevProps.variant !== nextProps.variant ||
    prevProps.showBreakdown !== nextProps.showBreakdown ||
    prevProps.focusable !== nextProps.focusable ||
    prevProps.ariaLabel !== nextProps.ariaLabel ||
    prevProps.testId !== nextProps.testId
  ) {
    return false
  }
  
  // Deep comparison for breakdown
  const prevBreakdown = prevProps.winnings.breakdown
  const nextBreakdown = nextProps.winnings.breakdown
  
  if (!prevBreakdown && !nextBreakdown) {
    // Both are undefined/null - equal
  } else if (!prevBreakdown || !nextBreakdown) {
    // One is undefined, other is not - not equal
    return false
  } else {
    // Both exist - compare properties
    if (
      prevBreakdown.participantWinnings !== nextBreakdown.participantWinnings ||
      prevBreakdown.creatorReward !== nextBreakdown.creatorReward ||
      prevBreakdown.totalPool !== nextBreakdown.totalPool ||
      prevBreakdown.winnerCount !== nextBreakdown.winnerCount
    ) {
      return false
    }
  }
  
  // Participant data comparison
  const prevParticipant = prevProps.participantData
  const nextParticipant = nextProps.participantData
  
  if (!prevParticipant && !nextParticipant) {
    // Both are undefined/null - equal
  } else if (!prevParticipant || !nextParticipant) {
    // One is undefined, other is not - not equal
    return false
  } else {
    // Both exist - compare prediction
    if (prevParticipant.prediction !== nextParticipant.prediction) {
      return false
    }
  }
  
  // Match data comparison (only result matters for display)
  const prevMatch = prevProps.matchData
  const nextMatch = nextProps.matchData
  
  if (!prevMatch && !nextMatch) {
    // Both are undefined/null - equal
  } else if (!prevMatch || !nextMatch) {
    // One is undefined, other is not - not equal
    return false
  } else {
    // Both exist - compare match result
    if (prevMatch.matchResult !== nextMatch.matchResult) {
      return false
    }
  }
  
  // All comparisons passed - props are equal
  return true
})

/**
 * Compact winnings display for use in market cards and lists
 */
export const CompactWinningsDisplay = React.memo<Omit<WinningsDisplayProps, 'variant'>>((props) => {
  return <WinningsDisplay {...props} variant="compact" />
})

CompactWinningsDisplay.displayName = 'CompactWinningsDisplay'

/**
 * Detailed winnings display for use in market detail pages
 */
export const DetailedWinningsDisplay = React.memo<Omit<WinningsDisplayProps, 'variant'>>((props) => {
  return <WinningsDisplay {...props} variant="detailed" showBreakdown />
})

DetailedWinningsDisplay.displayName = 'DetailedWinningsDisplay'

/**
 * Hook-integrated winnings display that fetches its own data
 */
export interface IntegratedWinningsDisplayProps {
  /** Market address */
  marketAddress: string
  /** User address (optional, defaults to connected wallet) */
  userAddress?: string
  /** Display variant */
  variant?: 'compact' | 'detailed'
  /** Whether to show breakdown */
  showBreakdown?: boolean
  /** Additional CSS classes */
  className?: string
  /** Loading component */
  LoadingComponent?: React.ComponentType<{
    variant?: 'compact' | 'detailed'
    showBreakdown?: boolean
    className?: string
  }>
  /** Error component */
  ErrorComponent?: React.ComponentType<{ error: string }>
}

/**
 * Integrated winnings display that handles its own data fetching
 */
export function IntegratedWinningsDisplay({
  marketAddress,
  userAddress,
  variant = 'detailed',
  showBreakdown = false,
  className,
  LoadingComponent,
  ErrorComponent,
}: IntegratedWinningsDisplayProps) {
  // Import hooks dynamically to avoid circular dependencies
  const useWinnings = React.useMemo(() => {
    try {
      return require('../hooks/useWinnings').useWinnings
    } catch {
      return null
    }
  }, [])

  const useMarketData = React.useMemo(() => {
    try {
      return require('../hooks/useSupabaseMarketData').useSupabaseMarketData
    } catch {
      return null
    }
  }, [])

  const useParticipantData = React.useMemo(() => {
    try {
      return require('../hooks/useSupabaseParticipantData').useSupabaseParticipantData
    } catch {
      return null
    }
  }, [])

  const useMatchData = React.useMemo(() => {
    try {
      return require('../hooks/useMatchData').useMatchData
    } catch {
      return null
    }
  }, [])

  // Use hooks if available
  const winningsResult = useWinnings ? useWinnings(marketAddress, userAddress) : null
  const marketResult = useMarketData ? useMarketData(marketAddress) : null
  const participantResult = useParticipantData ? useParticipantData(marketAddress, userAddress) : null
  
  const matchId = marketResult?.data?.matchId ? parseInt(marketResult.data.matchId, 10) : undefined
  const matchResult = useMatchData && matchId ? useMatchData(matchId) : null

  // Extract data
  const { winnings, isLoading, error, structuredError, isRecoverable } = winningsResult || {}
  const marketData = marketResult?.data
  const participantData = participantResult?.data
  const matchData = matchResult?.data

  // Show loading state
  if (isLoading) {
    const LoadingComp = LoadingComponent || WinningsLoadingSkeleton
    return <LoadingComp variant={variant} showBreakdown={showBreakdown} className={className} />
  }

  // Show error state with error boundary
  if (error || structuredError) {
    if (ErrorComponent) {
      return <ErrorComponent error={error || structuredError?.userMessage || 'Unknown error'} />
    }

    // Use WinningsErrorBoundary for structured error handling
    return (
      <WinningsErrorBoundary
        variant={variant}
        marketData={marketData ? {
          entryFee: marketData.entryFee,
          totalPool: marketData.totalPool,
          participantCount: marketData.participantCount,
        } : undefined}
        showRetry={isRecoverable}
        errorMessage={structuredError?.userMessage}
        fallback={
          <div className={cn('text-center text-[var(--text-secondary)] py-4', className)}>
            Unable to load winnings data
          </div>
        }
      >
        <div>Error occurred</div>
      </WinningsErrorBoundary>
    )
  }

  // Show empty state
  if (!winnings || !marketData) {
    return (
      <div className={cn('text-center text-[var(--text-secondary)] py-4', className)}>
        No winnings data available
      </div>
    )
  }

  // Render winnings display with error boundary
  return (
    <WinningsErrorBoundary
      variant={variant}
      marketData={{
        entryFee: marketData.entryFee,
        totalPool: marketData.totalPool,
        participantCount: marketData.participantCount,
      }}
    >
      <WinningsDisplay
        marketData={marketData}
        participantData={participantData}
        userAddress={userAddress}
        matchData={matchData}
        winnings={winnings}
        variant={variant}
        showBreakdown={showBreakdown}
        className={className}
      />
    </WinningsErrorBoundary>
  )
}

