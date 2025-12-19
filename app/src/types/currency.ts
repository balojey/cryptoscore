/**
 * Currency Types
 *
 * Type definitions for currency display and exchange rate management
 */

export type Currency = 'SOL' | 'USD' | 'NGN'

export interface ExchangeRates {
  SOL_USD: number
  SOL_NGN: number
  lastUpdated: number // Unix timestamp in milliseconds
}

export interface CachedExchangeRates extends ExchangeRates {
  version: number // Cache version for future migrations
}

export interface FormatOptions {
  showSymbol?: boolean
  showSOLEquivalent?: boolean
  decimals?: number
  targetCurrency?: Currency
}

export interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  exchangeRates: ExchangeRates | null
  isLoadingRates: boolean
  ratesError: string | null
  convertFromLamports: (lamports: number, targetCurrency?: Currency) => number
  formatCurrency: (lamports: number, options?: FormatOptions) => string
  refreshRates: () => Promise<void>
}
