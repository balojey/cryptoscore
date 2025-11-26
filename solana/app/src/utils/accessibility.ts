/**
 * Accessibility utilities for keyboard navigation and screen readers
 */

/**
 * Handle keyboard navigation for interactive elements
 */
export function handleKeyboardClick(
  event: React.KeyboardEvent,
  callback: () => void,
) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    callback()
  }
}

/**
 * Trap focus within a modal or dialog
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  )
  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== 'Tab')
      return

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus()
        e.preventDefault()
      }
    }
    else {
      if (document.activeElement === lastElement) {
        firstElement.focus()
        e.preventDefault()
      }
    }
  }

  element.addEventListener('keydown', handleTabKey)

  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Format number for screen readers
 */
export function formatForScreenReader(value: number | string, unit?: string): string {
  const numValue = typeof value === 'string' ? Number.parseFloat(value) : value
  const formatted = new Intl.NumberFormat('en-US').format(numValue)
  return unit ? `${formatted} ${unit}` : formatted
}

/**
 * Get ARIA label for market status
 */
export function getMarketStatusAriaLabel(
  resolved: boolean,
  isLive: boolean,
  endingSoon: boolean,
): string {
  if (resolved)
    return 'Market resolved'
  if (isLive)
    return 'Market is live'
  if (endingSoon)
    return 'Market ending soon'
  return 'Market open for predictions'
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get color contrast ratio (WCAG)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (_color: string) => {
    // Simple luminance calculation (would need full implementation)
    return 0.5 // Placeholder
  }

  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Validate WCAG AA contrast (4.5:1 for normal text)
 */
export function meetsWCAGAA(color1: string, color2: string): boolean {
  return getContrastRatio(color1, color2) >= 4.5
}
