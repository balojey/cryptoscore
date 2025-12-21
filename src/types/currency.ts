/**
 * Currency types and utilities for the Web2 migration
 * 
 * Replaces Solana lamports with decimal-based currency system
 */

export type Currency = 'MNEE' | 'USD' | 'EUR' | 'GBP'

export interface ExchangeRates {
  MNEE_USD: number
  MNEE_EUR: number
  MNEE_GBP: number
  lastUpdated: number // Unix timestamp in milliseconds
}

export interface CachedExchangeRates extends ExchangeRates {
  version: number // Cache version for future migrations
}

export interface CurrencyAmount {
  value: number // Decimal value (e.g., 1.5 for 1.5 tokens)
  formatted: string // Formatted display string (e.g., "1.50 MNEE")
}

export interface CurrencyConfig {
  symbol: string // Currency symbol (e.g., "MNEE", "USD")
  decimals: number // Number of decimal places to display
  prefix?: string // Optional prefix (e.g., "$")
  suffix?: string // Optional suffix (e.g., " MNEE")
}

export interface FormatOptions {
  showSymbol?: boolean
  showMNEEEquivalent?: boolean
  decimals?: number
  targetCurrency?: Currency
}

export interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  exchangeRates: ExchangeRates | null
  isLoadingRates: boolean
  ratesError: string | null
  convertAmount: (amount: number, targetCurrency?: Currency) => number
  formatCurrency: (amount: number, options?: FormatOptions) => string
  refreshRates: () => Promise<void>
}

// Default currency configuration for MNEE tokens
export const MNEE_CONFIG: CurrencyConfig = {
  symbol: 'MNEE',
  decimals: 2,
  suffix: ' MNEE',
}

// Currency configurations
export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  MNEE: { symbol: 'MNEE', decimals: 2, suffix: ' MNEE' },
  USD: { symbol: 'USD', decimals: 2, prefix: '$' },
  EUR: { symbol: 'EUR', decimals: 2, prefix: '€' },
  GBP: { symbol: 'GBP', decimals: 2, prefix: '£' },
}

/**
 * Format a decimal amount according to currency configuration
 */
export function formatCurrency(amount: number, config: CurrencyConfig = MNEE_CONFIG): string {
  const formatted = amount.toFixed(config.decimals)
  return `${config.prefix || ''}${formatted}${config.suffix || ''}`
}

/**
 * Parse a currency string back to decimal amount
 */
export function parseCurrency(value: string, config: CurrencyConfig = MNEE_CONFIG): number {
  // Remove prefix and suffix
  let cleaned = value
  if (config.prefix) {
    cleaned = cleaned.replace(config.prefix, '')
  }
  if (config.suffix) {
    cleaned = cleaned.replace(config.suffix, '')
  }
  
  return parseFloat(cleaned.trim()) || 0
}

/**
 * Create a CurrencyAmount object
 */
export function createCurrencyAmount(value: number, config: CurrencyConfig = MNEE_CONFIG): CurrencyAmount {
  return {
    value,
    formatted: formatCurrency(value, config),
  }
}

// Legacy Solana conversion utilities (for migration period only)
export const LAMPORTS_PER_SOL = 1_000_000_000

/**
 * Convert lamports to decimal SOL (for migration compatibility)
 * @deprecated Use decimal amounts directly in new code
 */
export function lamportsToSol(lamports: bigint | number): number {
  const lamportValue = typeof lamports === 'bigint' ? Number(lamports) : lamports
  return lamportValue / LAMPORTS_PER_SOL
}

/**
 * Convert decimal SOL to lamports (for migration compatibility)
 * @deprecated Use decimal amounts directly in new code
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * LAMPORTS_PER_SOL)
}
