import type { ExchangeRates } from '@/types/currency'
import { useState } from 'react'
import { ExchangeRateService } from '@/lib/exchangeRateService'

interface StaleRateWarningProps {
  exchangeRates: ExchangeRates
  onRefresh?: () => void
}

/**
 * Warning banner displayed when exchange rates are stale (older than 5 minutes)
 * Shows last update timestamp and allows user to dismiss or refresh
 */
export default function StaleRateWarning({
  exchangeRates,
  onRefresh,
}: StaleRateWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show if dismissed or rates are not stale
  if (isDismissed || !ExchangeRateService.isStale(exchangeRates)) {
    return null
  }

  const lastUpdated = ExchangeRateService.formatRateAge(exchangeRates)

  return (
    <div
      className="mb-6 p-4 rounded-lg flex items-center justify-between gap-4 animate-slide-in-down"
      style={{
        background: 'var(--bg-elevated)',
        border: '2px solid var(--accent-amber)',
        boxShadow: 'var(--shadow-lg)',
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span
          className="icon-[mdi--clock-alert-outline] w-6 h-6 flex-shrink-0"
          style={{ color: 'var(--accent-amber)' }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Exchange rates may be outdated
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Last updated
            {' '}
            {lastUpdated}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-sm font-medium rounded transition-all hover-lift"
            style={{
              background: 'var(--accent-amber)',
              color: 'var(--text-inverse)',
            }}
            aria-label="Refresh exchange rates"
          >
            <span className="flex items-center gap-1">
              <span className="icon-[mdi--refresh] w-4 h-4" />
              <span>Refresh</span>
            </span>
          </button>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded transition-all hover:bg-opacity-10"
          style={{
            color: 'var(--text-tertiary)',
          }}
          aria-label="Dismiss warning"
        >
          <span className="icon-[mdi--close] w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
