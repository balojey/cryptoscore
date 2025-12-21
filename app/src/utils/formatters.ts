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
 * Formats MNEE token amounts with proper decimal places and symbol
 * @param amount - Amount in decimal format (e.g., 1.5 for 1.5 MNEE)
 * @param decimals - Number of decimal places to show (default: 2)
 * @param showSymbol - Whether to show MNEE symbol (default: true)
 * @returns Formatted MNEE amount string
 */
export function formatMNEE(
  amount: number,
  decimals: number = 2,
  showSymbol: boolean = true,
): string {
  const formatted = amount.toFixed(decimals)
  return showSymbol ? `${formatted} MNEE` : formatted
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
export function getCurrencySymbol(currency: 'MNEE' | 'USD' | 'EUR' | 'GBP'): string {
  switch (currency) {
    case 'MNEE':
      return 'Ⓜ'
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    default:
      return ''
  }
}

/**
 * Get number of decimal places for a given currency
 * @param currency - The currency code
 * @returns Number of decimal places
 */
export function getCurrencyDecimals(currency: 'MNEE' | 'USD' | 'EUR' | 'GBP'): number {
  switch (currency) {
    case 'MNEE':
      return 2
    case 'USD':
    case 'EUR':
    case 'GBP':
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
 * Convert decimal amount to target currency amount
 * @param amount - Amount in decimal format
 * @param targetCurrency - Target currency (MNEE, USD, EUR, GBP)
 * @param exchangeRates - Current exchange rates (null for MNEE)
 * @returns Converted amount in target currency
 */
function convertAmountToTarget(
  amount: number,
  targetCurrency: 'MNEE' | 'USD' | 'EUR' | 'GBP',
  exchangeRates: { MNEE_USD: number, MNEE_EUR: number, MNEE_GBP: number } | null,
): number {
  // If target is MNEE, return amount as-is
  if (targetCurrency === 'MNEE') {
    return amount
  }

  // For other currencies, need exchange rates
  if (!exchangeRates) {
    return amount // Fallback to original amount if no rates available
  }

  // Convert MNEE to target currency
  switch (targetCurrency) {
    case 'USD':
      return amount * exchangeRates.MNEE_USD
    case 'EUR':
      return amount * exchangeRates.MNEE_EUR
    case 'GBP':
      return amount * exchangeRates.MNEE_GBP
    default:
      return amount
  }
}

/**
 * Format currency amount with proper symbol and decimals
 * Handles edge cases like zero values, very small amounts, and very large amounts
 * @param amount - Amount in decimal format
 * @param currency - Target currency
 * @param exchangeRates - Current exchange rates (null for MNEE-only)
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: 'MNEE' | 'USD' | 'EUR' | 'GBP',
  exchangeRates: { MNEE_USD: number, MNEE_EUR: number, MNEE_GBP: number } | null,
  options: {
    showSymbol?: boolean
    decimals?: number
  } = {},
): string {
  const { showSymbol = true, decimals } = options

  // Handle zero or null values
  if (!amount || amount === 0) {
    const defaultDecimals = decimals ?? getCurrencyDecimals(currency)
    const formatted = (0).toFixed(defaultDecimals)
    return showSymbol ? `${getCurrencySymbol(currency)}${formatted}` : formatted
  }

  // Convert to target currency
  const convertedAmount = convertAmountToTarget(amount, currency, exchangeRates)
  const currencyDecimals = decimals ?? getCurrencyDecimals(currency)

  // Handle very small amounts (< 0.01 for fiat currencies)
  if (currency !== 'MNEE' && convertedAmount > 0 && convertedAmount < 0.01) {
    return showSymbol ? `< ${getCurrencySymbol(currency)}0.01` : '< 0.01'
  }

  // Handle very large amounts (use K/M/B suffixes for amounts > 1M)
  if (convertedAmount >= 1_000_000) {
    const formatted = formatNumber(convertedAmount, 1)
    return showSymbol ? `${getCurrencySymbol(currency)}${formatted}` : formatted
  }

  // Format with thousand separators for certain currencies
  let formatted: string
  if (currency === 'EUR' || currency === 'GBP') {
    formatted = formatWithThousandSeparators(convertedAmount, currencyDecimals)
  }
  else {
    formatted = convertedAmount.toFixed(currencyDecimals)
  }

  return showSymbol ? `${getCurrencySymbol(currency)}${formatted}` : formatted
}

/**
 * Format amount with MNEE equivalent display
 * Returns both the primary formatted value and the MNEE equivalent
 * @param amount - Amount in decimal format
 * @param currency - Target currency
 * @param exchangeRates - Current exchange rates
 * @returns Object with primary and equivalent formatted strings
 */
export function formatWithMNEEEquivalent(
  amount: number,
  currency: 'MNEE' | 'USD' | 'EUR' | 'GBP',
  exchangeRates: { MNEE_USD: number, MNEE_EUR: number, MNEE_GBP: number } | null,
): { primary: string, equivalent: string } {
  const primary = formatCurrency(amount, currency, exchangeRates)

  // If already in MNEE, no equivalent needed
  if (currency === 'MNEE') {
    return { primary, equivalent: '' }
  }

  // Format MNEE equivalent
  const equivalent = `${getCurrencySymbol('MNEE')}${amount.toFixed(2)}`

  return { primary, equivalent }
}

/**
 * Formats SOL amounts with proper decimal places and symbol
 * @param amount - Amount in lamports or SOL (depending on context)
 * @param decimals - Number of decimal places to show (default: 4)
 * @param showSymbol - Whether to show SOL symbol (default: true)
 * @returns Formatted SOL amount string
 */
export function formatSOL(
  amount: number,
  decimals: number = 4,
  showSymbol: boolean = true,
): string {
  // Convert lamports to SOL if amount is very large (likely lamports)
  const solAmount = amount > 1_000_000 ? amount / 1_000_000_000 : amount
  const formatted = solAmount.toFixed(decimals)
  return showSymbol ? `${formatted} SOL` : formatted
}

/**
 * Format amount with SOL equivalent display
 * Returns both the primary formatted value and the SOL equivalent
 * @param amount - Amount in decimal format
 * @param currency - Target currency
 * @param exchangeRates - Current exchange rates (should include SOL rates)
 * @returns Object with primary and equivalent formatted strings
 */
export function formatWithSOLEquivalent(
  amount: number,
  currency: 'MNEE' | 'USD' | 'EUR' | 'GBP' | 'SOL',
  exchangeRates: { MNEE_USD: number, MNEE_EUR: number, MNEE_GBP: number, SOL_USD?: number } | null,
): { primary: string, equivalent: string } {
  const primary = currency === 'SOL' 
    ? formatSOL(amount)
    : formatCurrency(amount, currency, exchangeRates)

  // If already in SOL, no equivalent needed
  if (currency === 'SOL') {
    return { primary, equivalent: '' }
  }

  // For SOL equivalent, we need to convert from the current currency
  // This is a simplified conversion - in practice you'd need proper exchange rates
  const solEquivalent = formatSOL(amount * 0.001, 4) // Placeholder conversion rate
  
  return { primary, equivalent: solEquivalent }
}
