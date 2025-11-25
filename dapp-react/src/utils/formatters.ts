/**
 * Shortens an Ethereum address to show first 6 and last 4 characters
 * @param address - The full Ethereum address
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
 * Formats a number with commas for thousands separator
 * @param value - Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

/**
 * Formats a currency amount with proper decimal places
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: '$')
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = '$', decimals: number = 2): string {
  return `${currency}${amount.toFixed(decimals)}`
}
