// MNEE SDK configuration
// Configuration for MNEE token operations and SDK integration

import type { Environment } from '@mnee/ts-sdk'

// Environment configuration
const mneeApiKey = import.meta.env.VITE_MNEE_API_KEY
const mneeEnvironment = (import.meta.env.VITE_MNEE_ENVIRONMENT || 'sandbox') as Environment

if (!mneeApiKey) {
  throw new Error('Missing MNEE API key. Please set VITE_MNEE_API_KEY in your environment variables.')
}

// Validate environment
const validEnvironments: Environment[] = ['production', 'sandbox']
if (!validEnvironments.includes(mneeEnvironment)) {
  throw new Error(`Invalid MNEE environment: ${mneeEnvironment}. Must be one of: ${validEnvironments.join(', ')}`)
}

// MNEE SDK configuration
export const MNEE_SDK_CONFIG = {
  apiKey: mneeApiKey,
  environment: mneeEnvironment,
} as const

// MNEE token configuration
export const MNEE_TOKEN_CONFIG = {
  // 1 MNEE = 100,000 atomic units
  atomicUnitsPerToken: 100000,
  decimals: 5, // Display precision for MNEE tokens
  symbol: 'MNEE',
  name: 'MNEE Token',
} as const

// Environment-specific configuration
export const MNEE_ENV_CONFIG = {
  environment: mneeEnvironment,
  isProduction: mneeEnvironment === 'production',
  isSandbox: mneeEnvironment === 'sandbox',
  apiKey: mneeApiKey,
} as const

// Fee configuration for MNEE operations
export const MNEE_FEE_CONFIG = {
  // Platform fee address (will be set based on environment)
  platformFeeAddress: import.meta.env.VITE_MNEE_PLATFORM_FEE_ADDRESS || '',
  // Default platform fee percentage
  platformFeePercentage: Number(import.meta.env.VITE_PLATFORM_FEE_PERCENTAGE) || 5.0,
  // Minimum transfer amount in atomic units
  minTransferAmount: 1000, // 0.01 MNEE
  // Maximum transfer amount in atomic units (for safety)
  maxTransferAmount: 100000000000, // 1,000,000 MNEE
} as const

// Validation functions
export function validateMneeConfig(): void {
  if (!mneeApiKey) {
    throw new Error('MNEE API key is required')
  }
  
  if (!validEnvironments.includes(mneeEnvironment)) {
    throw new Error(`Invalid MNEE environment: ${mneeEnvironment}`)
  }
  
  console.log(`MNEE SDK configured for ${mneeEnvironment} environment`)
}

// Unit conversion utilities
export const MNEE_UNITS = {
  /**
   * Convert MNEE tokens to atomic units
   * @param mneeAmount Amount in MNEE tokens
   * @returns Amount in atomic units
   */
  toAtomicUnits(mneeAmount: number): number {
    return Math.floor(mneeAmount * MNEE_TOKEN_CONFIG.atomicUnitsPerToken)
  },

  /**
   * Convert atomic units to MNEE tokens
   * @param atomicAmount Amount in atomic units
   * @returns Amount in MNEE tokens
   */
  fromAtomicUnits(atomicAmount: number): number {
    return atomicAmount / MNEE_TOKEN_CONFIG.atomicUnitsPerToken
  },

  /**
   * Format atomic units as MNEE token string
   * @param atomicAmount Amount in atomic units
   * @param options Formatting options
   * @returns Formatted MNEE amount string
   */
  formatMneeAmount(
    atomicAmount: number, 
    options: { 
      includeSymbol?: boolean
      decimals?: number 
    } = {}
  ): string {
    const { includeSymbol = true, decimals = MNEE_TOKEN_CONFIG.decimals } = options
    const mneeAmount = this.fromAtomicUnits(atomicAmount)
    const formatted = mneeAmount.toFixed(decimals)
    return includeSymbol ? `${formatted} ${MNEE_TOKEN_CONFIG.symbol}` : formatted
  },

  /**
   * Parse MNEE amount string to atomic units
   * @param mneeAmountString String representation of MNEE amount
   * @returns Amount in atomic units
   */
  parseMneeAmount(mneeAmountString: string): number {
    const cleaned = mneeAmountString.replace(/[^\d.-]/g, '')
    const mneeAmount = parseFloat(cleaned)
    if (isNaN(mneeAmount)) {
      throw new Error(`Invalid MNEE amount: ${mneeAmountString}`)
    }
    return this.toAtomicUnits(mneeAmount)
  },

  /**
   * Validate MNEE amount is within acceptable range
   * @param atomicAmount Amount in atomic units
   * @returns True if valid, throws error if invalid
   */
  validateAmount(atomicAmount: number): boolean {
    if (atomicAmount < 0) {
      throw new Error('MNEE amount cannot be negative')
    }
    if (atomicAmount < MNEE_FEE_CONFIG.minTransferAmount) {
      throw new Error(`MNEE amount too small. Minimum: ${this.formatMneeAmount(MNEE_FEE_CONFIG.minTransferAmount)}`)
    }
    if (atomicAmount > MNEE_FEE_CONFIG.maxTransferAmount) {
      throw new Error(`MNEE amount too large. Maximum: ${this.formatMneeAmount(MNEE_FEE_CONFIG.maxTransferAmount)}`)
    }
    return true
  }
}

// Export configuration validation
export { validateMneeConfig as default }