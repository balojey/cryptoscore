/**
 * Optimized Loading Components
 * 
 * Performance-optimized loading states that provide immediate feedback
 * and reduce perceived loading time for better user experience.
 */

import React, { memo, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'skeleton' | 'pulse' | 'dots'
  className?: string
  message?: string
  showMessage?: boolean
  delay?: number // Delay before showing loader to prevent flashing
}

/**
 * Optimized spinner loader with configurable delay to prevent flashing
 */
export const OptimizedSpinner = memo<LoaderProps>(({ 
  size = 'md', 
  className, 
  message,
  showMessage = false,
  delay = 200 // 200ms delay to prevent flashing on fast operations
}) => {
  const [show, setShow] = useState(delay === 0)

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShow(true), delay)
      return () => clearTimeout(timer)
    }
  }, [delay])

  if (!show) return null

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div
        className={cn(
          'border-2 rounded-full animate-spin',
          sizeClasses[size]
        )}
        style={{
          borderColor: 'var(--border-default)',
          borderTopColor: 'var(--accent-cyan)',
        }}
      />
      {showMessage && message && (
        <p 
          className="text-sm mt-2 animate-pulse"
          style={{ color: 'var(--text-secondary)' }}
        >
          {message}
        </p>
      )}
    </div>
  )
})

OptimizedSpinner.displayName = 'OptimizedSpinner'

/**
 * Skeleton loader for content placeholders
 */
export const SkeletonLoader = memo<{
  lines?: number
  className?: string
  animated?: boolean
}>(({ lines = 3, className, animated = true }) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 rounded',
            animated && 'animate-pulse',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
      ))}
    </div>
  )
})

SkeletonLoader.displayName = 'SkeletonLoader'

/**
 * Market card skeleton loader
 */
export const MarketCardSkeleton = memo(() => {
  return (
    <div 
      className="p-4 rounded-lg border animate-pulse"
      style={{ 
        backgroundColor: 'var(--bg-elevated)',
        borderColor: 'var(--border-default)'
      }}
    >
      {/* Title skeleton */}
      <div 
        className="h-6 rounded mb-3"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      />
      
      {/* Description skeleton */}
      <div className="space-y-2 mb-4">
        <div 
          className="h-4 rounded"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        />
        <div 
          className="h-4 rounded w-3/4"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        />
      </div>
      
      {/* Stats skeleton */}
      <div className="flex justify-between items-center">
        <div 
          className="h-4 w-20 rounded"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        />
        <div 
          className="h-4 w-16 rounded"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        />
      </div>
    </div>
  )
})

MarketCardSkeleton.displayName = 'MarketCardSkeleton'

/**
 * Dashboard skeleton loader
 */
export const DashboardSkeleton = memo(() => {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div 
          className="h-8 w-48 rounded animate-pulse"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
        <div 
          className="h-10 w-32 rounded animate-pulse"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        />
      </div>
      
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={i}
            className="p-4 rounded-lg border animate-pulse"
            style={{ 
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div 
              className="h-4 w-24 rounded mb-2"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            />
            <div 
              className="h-8 w-16 rounded"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            />
          </div>
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="p-6 rounded-lg border animate-pulse"
          style={{ 
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div 
            className="h-6 w-32 rounded mb-4"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          />
          <SkeletonLoader lines={5} />
        </div>
        
        <div 
          className="p-6 rounded-lg border animate-pulse"
          style={{ 
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div 
            className="h-6 w-40 rounded mb-4"
            style={{ backgroundColor: 'var(--bg-primary)' }}
          />
          <SkeletonLoader lines={4} />
        </div>
      </div>
    </div>
  )
})

DashboardSkeleton.displayName = 'DashboardSkeleton'

/**
 * Dots loader for inline loading states
 */
export const DotsLoader = memo<{ className?: string }>(({ className }) => {
  return (
    <div className={cn('flex space-x-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ 
            backgroundColor: 'var(--accent-cyan)',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
    </div>
  )
})

DotsLoader.displayName = 'DotsLoader'

/**
 * Progressive loading wrapper that shows different states based on loading time
 */
export const ProgressiveLoader = memo<{
  isLoading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  skeleton?: React.ReactNode
  delay?: number
  skeletonDelay?: number
}>(({ 
  isLoading, 
  children, 
  fallback, 
  skeleton,
  delay = 200,
  skeletonDelay = 1000
}) => {
  const [showSpinner, setShowSpinner] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(false)

  useEffect(() => {
    if (isLoading) {
      const spinnerTimer = setTimeout(() => setShowSpinner(true), delay)
      const skeletonTimer = setTimeout(() => setShowSkeleton(true), skeletonDelay)
      
      return () => {
        clearTimeout(spinnerTimer)
        clearTimeout(skeletonTimer)
      }
    } else {
      setShowSpinner(false)
      setShowSkeleton(false)
    }
  }, [isLoading, delay, skeletonDelay])

  if (!isLoading) {
    return <>{children}</>
  }

  // Show skeleton for longer loading times
  if (showSkeleton && skeleton) {
    return <>{skeleton}</>
  }

  // Show spinner for medium loading times
  if (showSpinner) {
    return <>{fallback || <OptimizedSpinner />}</>
  }

  // Show nothing for very short loading times to prevent flashing
  return null
})

ProgressiveLoader.displayName = 'ProgressiveLoader'