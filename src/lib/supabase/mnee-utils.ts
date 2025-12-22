/**
 * MNEE Unit Conversion Utilities
 * 
 * Handles conversion between MNEE tokens and atomic units
 * 1 MNEE = 100,000 atomic units
 */

// Constants for MNEE unit conversion
export const MNEE_ATOMIC_UNITS_PER_TOKEN = 100000
export const MNEE_DECIMAL_PLACES = 5

/**
 * Convert MNEE tokens to atomic units
 * @param mneeAmount - Amount in MNEE tokens (decimal)
 * @returns Amount in atomic units (integer)
 */
export function mneeToAtomic(mneeAmount: number): number {
  return Math.floor(mneeAmount * MNEE_ATOMIC_UNITS_PER_TOKEN)
}

/**
 * Convert atomic units to MNEE tokens
 * @param atomicAmount - Amount in atomic units (integer)
 * @returns Amount in MNEE tokens (decimal)
 */
export function atomicToMnee(atomicAmount: number): number {
  return atomicAmount / MNEE_ATOMIC_UNITS_PER_TOKEN
}

/**
 * Format atomic units as MNEE tokens with proper decimal places
 * @param atomicAmount - Amount in atomic units
 * @param options - Formatting options
 * @returns Formatted MNEE amount string
 */
export function formatMneeAmount(
  atomicAmount: number,
  options: {
    includeSymbol?: boolean
    decimalPlaces?: number
  } = {}
): string {
  const { includeSymbol = true, decimalPlaces = MNEE_DECIMAL_PLACES } = options
  
  const mneeAmount = atomicToMnee(atomicAmount)
  const formatted = mneeAmount.toFixed(decimalPlaces)
  
  return includeSymbol ? `${formatted} MNEE` : formatted
}

/**
 * Parse MNEE amount string to atomic units
 * @param mneeAmountString - String representation of MNEE amount
 * @returns Amount in atomic units
 */
export function parseMneeAmount(mneeAmountString: string): number {
  // Remove MNEE symbol and whitespace
  const cleanAmount = mneeAmountString.replace(/[^\d.-]/g, '')
  const mneeAmount = parseFloat(cleanAmount)
  
  if (isNaN(mneeAmount)) {
    throw new Error('Invalid MNEE amount format')
  }
  
  return mneeToAtomic(mneeAmount)
}

/**
 * Validate MNEE amount is within acceptable range
 * @param atomicAmount - Amount in atomic units
 * @param options - Validation options
 * @returns True if amount is valid
 */
export function validateMneeAmount(
  atomicAmount: number,
  options: {
    min?: number // minimum in atomic units
    max?: number // maximum in atomic units
  } = {}
): boolean {
  const { min = 0, max = Number.MAX_SAFE_INTEGER } = options
  
  return (
    Number.isInteger(atomicAmount) &&
    atomicAmount >= min &&
    atomicAmount <= max
  )
}

/**
 * Enhanced amount object with both atomic and decimal representations
 */
export interface MneeAmount {
  atomic: number
  decimal: number
  formatted: string
}

/**
 * Create a MneeAmount object from atomic units
 * @param atomicAmount - Amount in atomic units
 * @returns MneeAmount object with both representations
 */
export function createMneeAmount(atomicAmount: number): MneeAmount {
  const decimal = atomicToMnee(atomicAmount)
  const formatted = formatMneeAmount(atomicAmount)
  
  return {
    atomic: atomicAmount,
    decimal,
    formatted
  }
}

/**
 * Create a MneeAmount object from decimal MNEE tokens
 * @param decimalAmount - Amount in MNEE tokens
 * @returns MneeAmount object with both representations
 */
export function createMneeAmountFromDecimal(decimalAmount: number): MneeAmount {
  const atomic = mneeToAtomic(decimalAmount)
  const formatted = formatMneeAmount(atomic)
  
  return {
    atomic,
    decimal: decimalAmount,
    formatted
  }
}