/**
 * Shortens a wallet address to show first 6 and last 4 characters
 * Works for both Ethereum and Solana addresses
 * @param address - The full wallet address
 * @param prefixLength - Number of characters to show at start (default: 6)
 * @param suffixLength - Number of characters to show at end (default: 4)
 * @returns Shortened address string
 */
export function shortenAddress(
  address: string,
  prefixLength: number = 6,
  suffixLength: number = 4,
): string {
  if (!address)
    return ''
  if (address.length <= prefixLength + suffixLength)
    return address

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`
}

/**
 * Formats a timestamp to show relative time (e.g., "5m ago", "2h ago", "3d ago")
 * @param timestamp - The Date object to format
 * @returns Formatted relative time string
 */
export function formatTime(timestamp: Date): string {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60)
    return `${minutes}m ago`
  if (hours < 24)
    return `${hours}h ago`
  return `${days}d ago`
}

/**
 * Formats SOL amounts with proper decimal places and symbol
 * @param lamports - Amount in lamports (1 SOL = 1,000,000,000 lamports)
 * @param decimals - Number of decimal places to show (default: 4)
 * @param showSymbol - Whether to show SOL symbol (default: true)
 * @returns Formatted SOL amount string
 */
export function formatSOL(
  lamports: number | bigint,
  decimals: number = 4,
  showSymbol: boolean = true,
): string {
  const sol = Number(lamports) / 1_000_000_000
  const formatted = sol.toFixed(decimals)
  return showSymbol ? `${formatted} SOL` : formatted
}

/**
 * Formats large numbers with appropriate suffixes (K, M, B)
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 1): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(decimals)}B`
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(decimals)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(decimals)}K`
  }
  return num.toFixed(decimals)
}

/**
 * Formats percentage values with proper decimal places
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get currency symbol for a given currency
 * @param currency - The currency code
 * @returns Currency symbol string
 */
export function getCurrencySymbol(currency: 'SOL' | 'USD' | 'NGN'): string {
  switch (currency) {
    case 'SOL':
      return '◎'
    case 'USD':
      return '$'
    case 'NGN':
      return '₦'
    default:
      return ''
  }
}

/**
 * Get number of decimal places for a given currency
 * @param currency - The currency code
 * @returns Number of decimal places
 */
export function getCurrencyDecimals(currency: 'SOL' | 'USD' | 'NGN'): number {
  switch (currency) {
    case 'SOL':
      return 4
    case 'USD':
    case 'NGN':
      return 2
    default:
      return 2
  }
}

/**
 * Format number with thousand separators
 * @param value - The number to format
 * @param decimals - Number of decimal places
 * @returns Formatted number string with thousand separators
 */
function formatWithThousandSeparators(value: number, decimals: number): string {
  const parts = value.toFixed(decimals).split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

/**
 * Convert lamports to target currency amount
 * @param lamports - Amount in lamports
 * @param targetCurrency - Target currency (SOL, USD, NGN)
 * @param exchangeRates - Current exchange rates (null for SOL)
 * @returns Converted amount in target currency
 */
function convertLamportsToAmount(
  lamports: number,
  targetCurrency: 'SOL' | 'USD' | 'NGN',
  exchangeRates: { SOL_USD: number, SOL_NGN: number } | null,
): number {
  // Convert lamports to SOL first
  const sol = lamports / 1_000_000_000

  // If target is SOL, return SOL amount
  if (targetCurrency === 'SOL') {
    return sol
  }

  // For other currencies, need exchange rates
  if (!exchangeRates) {
    return sol // Fallback to SOL if no rates available
  }

  // Convert SOL to target currency
  switch (targetCurrency) {
    case 'USD':
      return sol * exchangeRates.SOL_USD
    case 'NGN':
      return sol * exchangeRates.SOL_NGN
    default:
      return sol
  }
}

/**
 * Format currency amount with proper symbol and decimals
 * Handles edge cases like zero values, very small amounts, and very large amounts
 * @param lamports - Amount in lamports
 * @param currency - Target currency
 * @param exchangeRates - Current exchange rates (null for SOL-only)
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  lamports: number,
  currency: 'SOL' | 'USD' | 'NGN',
  exchangeRates: { SOL_USD: number, SOL_NGN: number } | null,
  options: {
    showSymbol?: boolean
    decimals?: number
  } = {},
): string {
  const { showSymbol = true, decimals } = options

  // Handle zero or null values
  if (!lamports || lamports === 0) {
    const defaultDecimals = decimals ?? getCurrencyDecimals(currency)
    const formatted = (0).toFixed(defaultDecimals)
    return showSymbol ? `${getCurrencySymbol(currency)}${formatted}` : formatted
  }

  // Convert to target currency
  const amount = convertLamportsToAmount(lamports, currency, exchangeRates)
  const currencyDecimals = decimals ?? getCurrencyDecimals(currency)

  // Handle very small amounts (< 0.01 for fiat currencies)
  if (currency !== 'SOL' && amount > 0 && amount < 0.01) {
    return showSymbol ? `< ${getCurrencySymbol(currency)}0.01` : '< 0.01'
  }

  // Handle very large amounts (use K/M/B suffixes for amounts > 1M)
  if (amount >= 1_000_000) {
    const formatted = formatNumber(amount, 1)
    return showSymbol ? `${getCurrencySymbol(currency)}${formatted}` : formatted
  }

  // Format with thousand separators for NGN
  let formatted: string
  if (currency === 'NGN') {
    formatted = formatWithThousandSeparators(amount, currencyDecimals)
  }
  else {
    formatted = amount.toFixed(currencyDecimals)
  }

  return showSymbol ? `${getCurrencySymbol(currency)}${formatted}` : formatted
}

/**
 * Format amount with SOL equivalent display
 * Returns both the primary formatted value and the SOL equivalent
 * @param lamports - Amount in lamports
 * @param currency - Target currency
 * @param exchangeRates - Current exchange rates
 * @returns Object with primary and equivalent formatted strings
 */
export function formatWithSOLEquivalent(
  lamports: number,
  currency: 'SOL' | 'USD' | 'NGN',
  exchangeRates: { SOL_USD: number, SOL_NGN: number } | null,
): { primary: string, equivalent: string } {
  const primary = formatCurrency(lamports, currency, exchangeRates)

  // If already in SOL, no equivalent needed
  if (currency === 'SOL') {
    return { primary, equivalent: '' }
  }

  // Format SOL equivalent
  const sol = lamports / 1_000_000_000
  const equivalent = `${getCurrencySymbol('SOL')}${sol.toFixed(4)}`

  return { primary, equivalent }
}
