import type { Currency } from '@/types/currency'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrency } from '@/hooks/useCurrency'
import { ExchangeRateService } from '@/lib/exchangeRateService'

interface CurrencyOption {
  value: Currency
  name: string
  symbol: string
  icon: string
  flag?: string
}

const currencyOptions: CurrencyOption[] = [
  {
    value: 'SOL',
    name: 'Solana',
    symbol: '◎',
    icon: 'cryptocurrency--sol',
  },
  {
    value: 'USD',
    name: 'US Dollar',
    symbol: '$',
    icon: 'mdi--currency-usd',
    flag: '🇺🇸',
  },
  {
    value: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    icon: 'mdi--currency-ngn',
    flag: '🇳🇬',
  },
]

export default function CurrencySelector() {
  const { currency, setCurrency, exchangeRates, isLoadingRates } = useCurrency()

  const currentOption = currencyOptions.find(opt => opt.value === currency)
  const isStale = exchangeRates ? ExchangeRateService.isStale(exchangeRates) : false
  const rateAge = exchangeRates ? ExchangeRateService.formatRateAge(exchangeRates) : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label="Change display currency"
          title="Change display currency"
          className="gap-2 relative"
        >
          {currentOption?.flag && (
            <span className="text-base leading-none">{currentOption.flag}</span>
          )}
          <span className="text-base leading-none">{currentOption?.symbol}</span>
          <span className="hidden sm:inline">{currentOption?.value}</span>

          {/* Loading indicator */}
          {isLoadingRates && (
            <span
              className="icon-[mdi--loading] w-4 h-4 animate-spin"
              aria-label="Loading exchange rates"
            />
          )}

          {/* Stale rate indicator */}
          {!isLoadingRates && isStale && (
            <span
              className="icon-[mdi--alert-circle-outline] w-4 h-4"
              style={{ color: 'var(--accent-amber)' }}
              aria-label="Exchange rates may be outdated"
              title="Exchange rates may be outdated"
            />
          )}

          <span className="icon-[mdi--chevron-down] w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-2">
          <DropdownMenuLabel>Display Currency</DropdownMenuLabel>
          <p
            className="text-xs mt-1 px-2"
            style={{ color: 'var(--text-disabled)' }}
          >
            Choose how to display monetary values
          </p>
        </div>

        <DropdownMenuSeparator />

        {currencyOptions.map((option) => {
          const isActive = currency === option.value
          const isDisabled
            = option.value !== 'SOL'
              && !exchangeRates
              && !isLoadingRates

          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => !isDisabled && setCurrency(option.value)}
              disabled={isDisabled}
              className="gap-3 py-3 cursor-pointer"
              style={{
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                background: isActive ? 'var(--bg-hover)' : 'transparent',
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
              }}
              role="menuitemradio"
              aria-checked={isActive}
              title={isDisabled ? 'Exchange rates unavailable' : undefined}
            >
              <div className="flex items-center gap-2 flex-shrink-0">
                {option.flag && (
                  <span className="text-lg leading-none">{option.flag}</span>
                )}
                <span className="text-lg leading-none">{option.symbol}</span>
              </div>

              <div className="flex-1">
                <div className="font-medium">{option.value}</div>
                <div
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {isDisabled ? 'Unavailable' : option.name}
                </div>
              </div>

              {/* Show exchange rate for non-SOL currencies */}
              {option.value !== 'SOL' && exchangeRates && (
                <div
                  className="text-xs text-right flex-shrink-0"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {option.value === 'USD' && (
                    <span>
                      {option.symbol}
                      {exchangeRates.SOL_USD.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                  {option.value === 'NGN' && (
                    <span>
                      {option.symbol}
                      {exchangeRates.SOL_NGN.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </div>
              )}

              {/* Show unavailable indicator for disabled options */}
              {isDisabled && (
                <span
                  className="icon-[mdi--lock-outline] w-4 h-4 flex-shrink-0"
                  style={{ color: 'var(--text-disabled)' }}
                  aria-hidden="true"
                />
              )}

              {isActive && !isDisabled && (
                <span
                  className="icon-[mdi--check] w-5 h-5 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />

        {/* Rate status section */}
        <div className="px-4 py-3">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Exchange Rates
          </p>

          {isLoadingRates && (
            <div
              className="text-xs flex items-center gap-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="icon-[mdi--loading] w-3 h-3 animate-spin" />
              <span>Updating rates...</span>
            </div>
          )}

          {!isLoadingRates && exchangeRates && (
            <div
              className="text-xs"
              style={{ color: isStale ? 'var(--accent-amber)' : 'var(--text-secondary)' }}
            >
              {isStale && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="icon-[mdi--alert-circle-outline] w-3 h-3" />
                  <span>Rates may be outdated</span>
                </div>
              )}
              <div>
                Last updated:
                {rateAge}
              </div>
            </div>
          )}

          {!isLoadingRates && !exchangeRates && (
            <div
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              No rates available
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
