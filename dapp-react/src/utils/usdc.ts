/**
 * USDC Asset utilities for Polkadot Asset Hub
 * USDC Asset ID: 1337
 * Decimals: 6
 */

export const USDC_ASSET = {
  id: 1337,
  decimals: 6,
  symbol: 'USDC',
  name: 'USD Coin'
} as const

/**
 * Converts USDC amount from human-readable format to contract format (6 decimals)
 * @param amount - Human-readable USDC amount (e.g., "100.50")
 * @returns BigInt representation with 6 decimal places
 */
export function parseUSDC(amount: string | number): bigint {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount
  const [whole, decimal = ''] = amountStr.split('.')
  
  // Pad or truncate decimal part to 6 digits
  const paddedDecimal = decimal.padEnd(6, '0').slice(0, 6)
  
  return BigInt(whole + paddedDecimal)
}

/**
 * Converts USDC amount from contract format to human-readable format
 * @param amount - BigInt amount with 6 decimal places
 * @param precision - Number of decimal places to show (default: 2)
 * @returns Formatted USDC amount string
 */
export function formatUSDC(amount: bigint, precision: number = 2): string {
  const divisor = BigInt(10 ** USDC_ASSET.decimals)
  const whole = amount / divisor
  const remainder = amount % divisor
  
  // Convert remainder to decimal string with proper padding
  const decimalStr = remainder.toString().padStart(6, '0')
  
  // Truncate to desired precision
  const truncatedDecimal = decimalStr.slice(0, precision)
  
  if (precision === 0) {
    return whole.toString()
  }
  
  return `${whole.toString()}.${truncatedDecimal}`
}

/**
 * Formats USDC amount with currency symbol
 * @param amount - BigInt amount with 6 decimal places
 * @param precision - Number of decimal places to show (default: 2)
 * @returns Formatted USDC amount with symbol (e.g., "$100.50")
 */
export function formatUSDCWithSymbol(amount: bigint, precision: number = 2): string {
  return `$${formatUSDC(amount, precision)}`
}

/**
 * Validates if a string is a valid USDC amount
 * @param amount - String to validate
 * @returns True if valid USDC amount
 */
export function isValidUSDCAmount(amount: string): boolean {
  if (!amount || amount.trim() === '') return false
  
  const regex = /^\d+(\.\d{1,6})?$/
  return regex.test(amount.trim())
}

/**
 * Converts PAS amount (18 decimals) to equivalent USDC representation
 * This is a utility for migration purposes - assumes 1:1 conversion rate
 * @param pasAmount - PAS amount in wei (18 decimals)
 * @returns USDC amount (6 decimals)
 */
export function pasToUSDC(pasAmount: bigint): bigint {
  // Convert from 18 decimals to 6 decimals
  const conversionFactor = BigInt(10 ** 12) // 18 - 6 = 12
  return pasAmount / conversionFactor
}

/**
 * Converts USDC amount to equivalent PAS representation
 * This is a utility for migration purposes - assumes 1:1 conversion rate
 * @param usdcAmount - USDC amount (6 decimals)
 * @returns PAS amount in wei (18 decimals)
 */
export function usdcToPAS(usdcAmount: bigint): bigint {
  // Convert from 6 decimals to 18 decimals
  const conversionFactor = BigInt(10 ** 12) // 18 - 6 = 12
  return usdcAmount * conversionFactor
}

/**
 * Checks if amount has sufficient balance
 * @param amount - Amount to check
 * @param balance - Available balance
 * @returns True if sufficient balance
 */
export function hasSufficientUSDCBalance(amount: bigint, balance: bigint): boolean {
  return balance >= amount
}

/**
 * Calculates percentage of total pool
 * @param amount - Individual amount
 * @param total - Total pool amount
 * @returns Percentage as number (0-100)
 */
export function calculateUSDCPercentage(amount: bigint, total: bigint): number {
  if (total === 0n) return 0
  return Number((amount * 100n) / total)
}