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
