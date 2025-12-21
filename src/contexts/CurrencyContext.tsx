import type { Currency, CurrencyContextType, ExchangeRates, FormatOptions } from '@/types/currency'
import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react'
import { ExchangeRateService } from '@/lib/exchangeRateService'

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const LAMPORTS_PER_SOL = 1_000_000_000

/**
 * Get currency symbol for display
 */
function getCurrencySymbol(currency: Currency): string {
  switch (currency) {
    case 'SOL':
      return '◎'
    case 'USD':
      return '$'
    case 'NGN':
      return '₦'
  }
}

/**
 * Get number of decimal places for currency
 */
function getCurrencyDecimals(currency: Currency): number {
  switch (currency) {
    case 'SOL':
      return 4
    case 'USD':
    case 'NGN':
      return 2
  }
}

/**
 * Format number with thousand separators
 */
function formatWithSeparators(value: number, decimals: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  // Load saved currency preference
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('cryptoscore-currency')
    return (saved as Currency) || 'SOL'
  })

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(() => {
    // Load cached rates on mount
    return ExchangeRateService.getCachedRates()
  })

  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [ratesError, setRatesError] = useState<string | null>(null)

  /**
   * Fetch exchange rates from API
   */
  const fetchRates = useCallback(async () => {
    setIsLoadingRates(true)
    setRatesError(null)

    try {
      const rates = await ExchangeRateService.fetchRates()
      setExchangeRates(rates)
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch exchange rates'
      setRatesError(errorMessage)

      // Try to use cached rates as fallback
      const cached = ExchangeRateService.getCachedRates()
      if (cached && !exchangeRates) {
        setExchangeRates(cached)
      }

      // If no cached rates available and user is on USD/NGN, switch to SOL
      if (!cached && !exchangeRates && currency !== 'SOL') {
        setCurrencyState('SOL')
        localStorage.setItem('cryptoscore-currency', 'SOL')
      }
    }
    finally {
      setIsLoadingRates(false)
    }
  }, [exchangeRates, currency])

  /**
   * Fetch rates on mount and set up interval
   */
  useEffect(() => {
    // Fetch immediately on mount
    fetchRates()

    // Set up 5-minute interval for rate updates (reduced API calls)
    const intervalId = setInterval(() => {
      fetchRates()
    }, 300000) // 5 minutes (matches STALE_THRESHOLD)

    return () => clearInterval(intervalId)
  }, [fetchRates])

  /**
   * Save currency preference to localStorage
   */
  const setCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem('cryptoscore-currency', newCurrency)
  }, [])

  /**
   * Convert lamports to target currency
   */
  const convertFromLamports = useCallback(
    (lamports: number, targetCurrency?: Currency): number => {
      const sol = lamports / LAMPORTS_PER_SOL
      const target = targetCurrency || currency

      if (target === 'SOL') {
        return sol
      }

      if (!exchangeRates) {
        // No rates available, return SOL value
        return sol
      }

      switch (target) {
        case 'USD':
          return sol * exchangeRates.SOL_USD
        case 'NGN':
          return sol * exchangeRates.SOL_NGN
        default:
          return sol
      }
    },
    [currency, exchangeRates],
  )

  /**
   * Format lamports as currency string
   */
  const formatCurrency = useCallback(
    (lamports: number, options?: FormatOptions): string => {
      const {
        showSymbol = true,
        showSOLEquivalent = false,
        decimals,
        targetCurrency,
      } = options || {}

      const target = targetCurrency || currency
      const value = convertFromLamports(lamports, target)
      const decimalPlaces = decimals ?? getCurrencyDecimals(target)
      const symbol = getCurrencySymbol(target)

      // Handle edge cases
      if (value === 0) {
        const formatted = formatWithSeparators(0, decimalPlaces)
        return showSymbol ? `${symbol}${formatted}` : formatted
      }

      // Handle very small amounts in fiat currencies
      if (target !== 'SOL' && value < 0.01) {
        return showSymbol ? `< ${symbol}0.01` : '< 0.01'
      }

      const formatted = formatWithSeparators(value, decimalPlaces)
      let result = showSymbol ? `${symbol}${formatted}` : formatted

      // Add SOL equivalent if requested and not already in SOL
      if (showSOLEquivalent && target !== 'SOL') {
        const solValue = lamports / LAMPORTS_PER_SOL
        const solFormatted = formatWithSeparators(solValue, 4)
        result += ` (◎${solFormatted})`
      }

      return result
    },
    [currency, convertFromLamports],
  )

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      exchangeRates,
      isLoadingRates,
      ratesError,
      convertFromLamports,
      formatCurrency,
      refreshRates: fetchRates,
    }),
    [
      currency,
      setCurrency,
      exchangeRates,
      isLoadingRates,
      ratesError,
      convertFromLamports,
      formatCurrency,
      fetchRates,
    ],
  )

  return <CurrencyContext value={value}>{children}</CurrencyContext>
}

export function useCurrency() {
  const context = use(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
