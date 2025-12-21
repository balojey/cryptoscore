/**
 * Crossmint Wallet Utilities
 *
 * Utilities for EVM wallet address validation and formatting
 * for Crossmint-created wallets.
 */

/**
 * Validate EVM wallet address format
 *
 * Checks if a string is a valid Ethereum-style address (0x format).
 * EVM addresses are 42 characters long (including 0x prefix) and contain
 * only hexadecimal characters.
 *
 * @param address - Address string to validate
 * @returns True if address is valid EVM format, false otherwise
 *
 * @example
 * ```typescript
 * isValidEvmAddress('0x742d35Cc6634C0532925a3b8D4C9db96DfbBfC88') // true
 * isValidEvmAddress('invalid-address') // false
 * isValidEvmAddress('') // false
 * ```
 */
export function isValidEvmAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false
  }

  // EVM addresses must start with 0x
  if (!address.startsWith('0x')) {
    return false
  }

  // EVM addresses are exactly 42 characters (0x + 40 hex chars)
  if (address.length !== 42) {
    return false
  }

  // Check if remaining characters are valid hexadecimal
  const hexPart = address.slice(2)
  const hexRegex = /^[0-9a-fA-F]+$/
  
  return hexRegex.test(hexPart)
}

/**
 * Format EVM address for display
 *
 * Formats an EVM address for display by showing first 6 and last 4 characters
 * with ellipsis in between. Useful for UI components where space is limited.
 *
 * @param address - EVM address to format
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Formatted address string
 *
 * @example
 * ```typescript
 * formatEvmAddress('0x742d35Cc6634C0532925a3b8D4C9db96DfbBfC88')
 * // Returns: '0x742d...fC88'
 * ```
 */
export function formatEvmAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!isValidEvmAddress(address)) {
    return address
  }

  if (address.length <= startChars + endChars) {
    return address
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Normalize EVM address to lowercase
 *
 * Converts an EVM address to lowercase format for consistent storage
 * and comparison. EVM addresses are case-insensitive but lowercase
 * is the standard format for storage.
 *
 * @param address - EVM address to normalize
 * @returns Lowercase EVM address
 *
 * @example
 * ```typescript
 * normalizeEvmAddress('0x742D35CC6634C0532925A3B8D4C9DB96DFBBFC88')
 * // Returns: '0x742d35cc6634c0532925a3b8d4c9db96dfbbfc88'
 * ```
 */
export function normalizeEvmAddress(address: string): string {
  if (!isValidEvmAddress(address)) {
    return address
  }

  return address.toLowerCase()
}

/**
 * Check if address is a zero address
 *
 * Determines if an EVM address is the zero address (0x0000...0000).
 * The zero address is often used as a null value in smart contracts.
 *
 * @param address - EVM address to check
 * @returns True if address is zero address, false otherwise
 *
 * @example
 * ```typescript
 * isZeroAddress('0x0000000000000000000000000000000000000000') // true
 * isZeroAddress('0x742d35Cc6634C0532925a3b8D4C9db96DfbBfC88') // false
 * ```
 */
export function isZeroAddress(address: string): boolean {
  // Normalize first to handle case-insensitive comparison
  const normalized = address.toLowerCase()
  
  if (!isValidEvmAddress(normalized)) {
    return false
  }

  const zeroAddress = '0x0000000000000000000000000000000000000000'
  return normalized === zeroAddress
}

/**
 * Generate a random EVM address for testing
 *
 * Creates a random valid EVM address for use in tests and development.
 * This is NOT a real wallet address and should never be used for actual
 * transactions.
 *
 * @returns Random valid EVM address
 *
 * @example
 * ```typescript
 * const testAddress = generateRandomEvmAddress()
 * console.log(testAddress) // '0x742d35cc6634c0532925a3b8d4c9db96dfbbfc88'
 * ```
 */
export function generateRandomEvmAddress(): string {
  const chars = '0123456789abcdef'
  let address = '0x'
  
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return address
}

/**
 * Compare two EVM addresses for equality
 *
 * Compares two EVM addresses in a case-insensitive manner.
 * Both addresses are normalized to lowercase before comparison.
 *
 * @param address1 - First EVM address
 * @param address2 - Second EVM address
 * @returns True if addresses are equal, false otherwise
 *
 * @example
 * ```typescript
 * compareEvmAddresses(
 *   '0x742D35CC6634C0532925A3B8D4C9DB96DFBBFC88',
 *   '0x742d35cc6634c0532925a3b8d4c9db96dfbbfc88'
 * ) // true
 * ```
 */
export function compareEvmAddresses(address1: string, address2: string): boolean {
  if (!isValidEvmAddress(address1) || !isValidEvmAddress(address2)) {
    return false
  }

  return normalizeEvmAddress(address1) === normalizeEvmAddress(address2)
}