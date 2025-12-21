import type { ExchangeRates } from '@/types/currency'
import { useState } from 'react'
import { ExchangeRateService } from '@/lib/exchangeRateService'

interface OfflineModeBannerProps {
  exchangeRates: ExchangeRates | null
  ratesError: string | null
  onRefresh?: () => void
}

/**
 * Info banner displayed when using cached rates offline or when rate fetch fails
 * Shows appropriate messages based on the error state and available cached rates
 */
export default function OfflineModeBanner({
  exchangeRates,
  ratesError,
  onRefresh,
}: OfflineModeBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Don't show if dismissed or no error
  if (isDismissed || !ratesError) {
    return null
  }

  // Determine the message based on whether we have cached rates
  const hasCachedRates = exchangeRates !== null
  const lastUpdated = exchangeRates
    ? ExchangeRateService.formatRateAge(exchangeRates)
    : null

  return (
    <div
      className="mb-6 p-4 rounded-lg flex items-center justify-between gap-4 animate-slide-in-down"
      style={{
        background: 'var(--bg-elevated)',
        border: hasCachedRates
          ? '2px solid var(--accent-amber)'
          : '2px solid var(--accent-red)',
        boxShadow: 'var(--shadow-lg)',
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span
          className={`w-6 h-6 flex-shrink-0 ${
            hasCachedRates
              ? 'icon-[mdi--cloud-off-outline]'
              : 'icon-[mdi--alert-circle-outline]'
          }`}
          style={{
            color: hasCachedRates ? 'var(--accent-amber)' : 'var(--accent-red)',
          }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          {hasCachedRates
            ? (
                <>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Using cached exchange rates
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Unable to fetch latest rates. Last updated
                    {' '}
                    {lastUpdated}
                  </p>
                </>
              )
            : (
                <>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Currency conversion unavailable
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {ratesError || 'Unable to fetch exchange rates. Displaying values in SOL.'}
                  </p>
                </>
              )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 text-sm font-medium rounded transition-all hover-lift"
            style={{
              background: hasCachedRates
                ? 'var(--accent-amber)'
                : 'var(--accent-cyan)',
              color: 'var(--text-inverse)',
            }}
            aria-label="Retry fetching exchange rates"
          >
            <span className="flex items-center gap-1">
              <span className="icon-[mdi--refresh] w-4 h-4" />
              <span>Retry</span>
            </span>
          </button>
        )}
        <button
          onClick={() => setIsDismissed(true)}
          className="p-1.5 rounded transition-all hover:bg-opacity-10"
          style={{
            color: 'var(--text-tertiary)',
          }}
          aria-label="Dismiss banner"
        >
          <span className="icon-[mdi--close] w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
