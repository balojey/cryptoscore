/**
 * WinningsLoadingSkeleton - Loading skeleton components for winnings display
 *
 * Provides consistent loading states that match the structure of the actual
 * winnings display components for better user experience.
 */

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WinningsLoadingSkeletonProps {
  /** Display variant to match the target component */
  variant?: 'compact' | 'detailed'
  /** Whether to show breakdown skeleton */
  showBreakdown?: boolean
  /** Additional CSS classes */
  className?: string
  /** Loading state type for different scenarios */
  loadingType?: 'initial' | 'calculating' | 'refreshing' | 'network'
  /** Whether to show pulse animation */
  animate?: boolean
}

/**
 * Main winnings loading skeleton component
 */
export function WinningsLoadingSkeleton({
  variant = 'detailed',
  showBreakdown = false,
  className,
  loadingType = 'initial',
  animate = true,
}: WinningsLoadingSkeletonProps) {
  if (variant === 'compact') {
    return <CompactWinningsLoadingSkeleton className={className} loadingType={loadingType} animate={animate} />
  }

  return (
    <DetailedWinningsLoadingSkeleton 
      showBreakdown={showBreakdown} 
      className={className}
      loadingType={loadingType}
      animate={animate}
    />
  )
}

/**
 * Compact loading skeleton for market cards and lists
 */
export function CompactWinningsLoadingSkeleton({ 
  className,
  loadingType = 'initial',
  animate = true,
}: { 
  className?: string
  loadingType?: 'initial' | 'calculating' | 'refreshing' | 'network'
  animate?: boolean
}) {
  const animationClass = animate ? 'animate-pulse' : ''
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Icon skeleton */}
      <div className={cn('h-4 w-4 bg-[var(--bg-secondary)] rounded flex-shrink-0', animationClass)} />
      
      {/* Content skeleton */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          {/* Amount skeleton */}
          <div className={cn('h-4 w-16 bg-[var(--bg-secondary)] rounded', animationClass)} />
          {/* Badge skeleton */}
          <div className={cn('h-5 w-12 bg-[var(--bg-secondary)] rounded-full', animationClass)} />
        </div>
        {/* Message skeleton */}
        <div className={cn('h-3 w-24 bg-[var(--bg-secondary)] rounded', animationClass)} />
        
        {/* Loading type indicator */}
        {loadingType !== 'initial' && (
          <div className="flex items-center gap-1 mt-1">
            <div className="w-1 h-1 bg-[var(--accent-cyan)] rounded-full animate-pulse" />
            <span className="text-xs text-[var(--text-secondary)]">
              {loadingType === 'calculating' && 'Calculating...'}
              {loadingType === 'refreshing' && 'Refreshing...'}
              {loadingType === 'network' && 'Loading...'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Detailed loading skeleton for market detail pages
 */
export function DetailedWinningsLoadingSkeleton({ 
  showBreakdown = false,
  className,
  loadingType = 'initial',
  animate = true,
}: { 
  showBreakdown?: boolean
  className?: string
  loadingType?: 'initial' | 'calculating' | 'refreshing' | 'network'
  animate?: boolean
}) {
  const animationClass = animate ? 'animate-pulse' : ''
  
  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className={cn('space-y-3', animationClass)}>
          {/* Header skeleton */}
          <div className="flex items-start gap-3">
            {/* Icon container skeleton */}
            <div className="w-9 h-9 bg-[var(--bg-secondary)] rounded-lg flex-shrink-0" />
            
            {/* Header content skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                {/* Title skeleton */}
                <div className="h-5 w-16 bg-[var(--bg-secondary)] rounded" />
                {/* Badge skeleton */}
                <div className="h-6 w-20 bg-[var(--bg-secondary)] rounded-full" />
              </div>
              {/* Message skeleton */}
              <div className="h-4 w-48 bg-[var(--bg-secondary)] rounded" />
            </div>
          </div>

          {/* Amount section skeleton */}
          <div className="border-t border-[var(--border-default)] pt-3">
            <div className="text-center space-y-2">
              {/* Main amount skeleton */}
              <div className="h-8 w-32 bg-[var(--bg-secondary)] rounded mx-auto" />
              {/* Status skeleton */}
              <div className="h-3 w-20 bg-[var(--bg-secondary)] rounded mx-auto" />
            </div>
          </div>

          {/* Breakdown skeleton */}
          {showBreakdown && (
            <div className="border-t border-[var(--border-default)] pt-3 space-y-3">
              {/* Breakdown title skeleton */}
              <div className="h-4 w-20 bg-[var(--bg-secondary)] rounded" />
              
              {/* Breakdown items skeleton */}
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div className="h-3 w-24 bg-[var(--bg-secondary)] rounded" />
                    <div className="h-3 w-16 bg-[var(--bg-secondary)] rounded" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional context skeleton */}
          <div className="border-t border-[var(--border-default)] pt-3 space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex justify-between items-center">
                <div className="h-3 w-20 bg-[var(--bg-secondary)] rounded" />
                <div className="h-5 w-12 bg-[var(--bg-secondary)] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Minimal loading skeleton for inline displays
 */
export function MinimalWinningsLoadingSkeleton({ 
  className 
}: { 
  className?: string 
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-4 w-4 bg-[var(--bg-secondary)] rounded animate-pulse" />
      <div className="h-4 w-20 bg-[var(--bg-secondary)] rounded animate-pulse" />
    </div>
  )
}

/**
 * Loading skeleton for winnings breakdown table
 */
export function WinningsBreakdownLoadingSkeleton({ 
  className 
}: { 
  className?: string 
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex justify-between items-center animate-pulse">
          <div className="h-3 w-28 bg-[var(--bg-secondary)] rounded" />
          <div className="h-3 w-16 bg-[var(--bg-secondary)] rounded" />
        </div>
      ))}
    </div>
  )
}

/**
 * Loading skeleton for potential winnings preview (used in prediction options)
 */
export function PotentialWinningsLoadingSkeleton({ 
  className 
}: { 
  className?: string 
}) {
  return (
    <div className={cn('text-center space-y-1', className)}>
      <div className="h-3 w-16 bg-[var(--bg-secondary)] rounded mx-auto animate-pulse" />
      <div className="h-5 w-24 bg-[var(--bg-secondary)] rounded mx-auto animate-pulse" />
    </div>
  )
}

/**
 * Shimmer effect for enhanced loading animation
 */
export function ShimmerWinningsLoadingSkeleton({ 
  variant = 'detailed',
  className 
}: { 
  variant?: 'compact' | 'detailed'
  className?: string 
}) {
  const shimmerClass = `
    relative overflow-hidden
    before:absolute before:inset-0
    before:-translate-x-full
    before:animate-[shimmer_2s_infinite]
    before:bg-gradient-to-r
    before:from-transparent before:via-white/20 before:to-transparent
  `

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('h-4 w-4 bg-[var(--bg-secondary)] rounded', shimmerClass)} />
        <div className="flex-1 space-y-1">
          <div className={cn('h-4 w-20 bg-[var(--bg-secondary)] rounded', shimmerClass)} />
          <div className={cn('h-3 w-16 bg-[var(--bg-secondary)] rounded', shimmerClass)} />
        </div>
      </div>
    )
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 bg-[var(--bg-secondary)] rounded-lg', shimmerClass)} />
            <div className="flex-1 space-y-2">
              <div className={cn('h-5 w-24 bg-[var(--bg-secondary)] rounded', shimmerClass)} />
              <div className={cn('h-4 w-40 bg-[var(--bg-secondary)] rounded', shimmerClass)} />
            </div>
          </div>
          <div className="border-t pt-3">
            <div className={cn('h-8 w-32 bg-[var(--bg-secondary)] rounded mx-auto', shimmerClass)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Add shimmer keyframes to global CSS (this would typically go in your CSS file)
const shimmerStyles = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`

// Export styles for use in CSS files
export { shimmerStyles }