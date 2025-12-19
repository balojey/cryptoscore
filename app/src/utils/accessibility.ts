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
  // Handle string inputs that might contain currency symbols or formatting
  let numValue: number
  
  if (typeof value === 'string') {
    // Remove common currency symbols and formatting
    const cleanValue = value.replace(/[◎$,\s]/g, '')
    numValue = Number.parseFloat(cleanValue)
    
    // If parsing fails, return the original string
    if (Number.isNaN(numValue)) {
      return unit ? `${value} ${unit}` : value
    }
  } else {
    numValue = value
  }
  
  // Format for screen readers with proper number pronunciation
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(numValue)
  
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

/**
 * Generate unique ID for accessibility labels
 */
export function generateAccessibilityId(prefix: string = 'a11y'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get appropriate ARIA role for interactive elements
 */
export function getInteractiveRole(
  isClickable: boolean,
  isToggleable: boolean = false,
): string {
  if (isToggleable) return 'switch'
  if (isClickable) return 'button'
  return 'region'
}

/**
 * Format currency amount for screen readers with proper pronunciation
 */
export function formatCurrencyForScreenReader(
  amount: number,
  currency: string = 'SOL',
): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount)
  
  // Handle special currency pronunciations
  const currencyPronunciation = {
    SOL: 'Solana',
    USD: 'US Dollars',
    NGN: 'Nigerian Naira',
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
  }[currency] || currency
  
  return `${formatted} ${currencyPronunciation}`
}

/**
 * Create accessible description for winnings status
 */
export function createWinningsStatusDescription(
  type: 'potential' | 'actual' | 'creator_reward' | 'none',
  status: string,
  amount: number,
): string {
  const typeDescriptions = {
    potential: 'Potential winnings if prediction is correct',
    actual: 'Confirmed winnings from correct prediction',
    creator_reward: 'Creator reward for market creation',
    none: 'No winnings available',
  }
  
  const statusDescriptions = {
    eligible: 'eligible for payout',
    won: 'successfully won',
    lost: 'prediction was incorrect',
    distributed: 'already distributed to wallet',
    pending: 'awaiting market resolution',
  }
  
  const baseDescription = typeDescriptions[type] || 'Winnings information'
  const statusDescription = statusDescriptions[status as keyof typeof statusDescriptions] || status
  
  if (amount <= 0) {
    return `${baseDescription}. No amount available.`
  }
  
  return `${baseDescription}. Status: ${statusDescription}.`
}
