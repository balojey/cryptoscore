// MNEE unit conversion utilities

import { MNEE_TOKEN_CONFIG, MNEE_FEE_CONFIG } from '../../config/mnee'
import { MneeValidationError } from './types'

export interface ConversionOptions {
  includeSymbol?: boolean
  decimals?: number
  locale?: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  normalizedAmount?: number
}

/**
 * MNEE Unit Conversion Utilities
 * Handles conversion between atomic units and MNEE tokens with validation
 */
export class MneeUnitConverter {
  private static readonly ATOMIC_UNITS_PER_TOKEN = MNEE_TOKEN_CONFIG.atomicUnitsPerToken
  private static readonly DEFAULT_DECIMALS = MNEE_TOKEN_CONFIG.decimals
  private static readonly TOKEN_SYMBOL = MNEE_TOKEN_CONFIG.symbol

  /**
   * Convert MNEE tokens to atomic units
   * @param mneeAmount Amount in MNEE tokens
   * @returns Amount in atomic units
   */
  static toAtomicUnits(mneeAmount: number): number {
    if (typeof mneeAmount !== 'number') {
      throw new MneeValidationError(`Invalid MNEE amount type: expected number, got ${typeof mneeAmount}`)
    }

    if (isNaN(mneeAmount)) {
      throw new MneeValidationError('MNEE amount cannot be NaN')
    }

    if (!isFinite(mneeAmount)) {
      throw new MneeValidationError('MNEE amount must be finite')
    }

    if (mneeAmount < 0) {
      throw new MneeValidationError('MNEE amount cannot be negative')
    }

    // Use Math.floor to ensure we don't have fractional atomic units
    const atomicAmount = Math.floor(mneeAmount * this.ATOMIC_UNITS_PER_TOKEN)
    
    return atomicAmount
  }

  /**
   * Convert atomic units to MNEE tokens
   * @param atomicAmount Amount in atomic units
   * @returns Amount in MNEE tokens
   */
  static fromAtomicUnits(atomicAmount: number): number {
    if (typeof atomicAmount !== 'number') {
      throw new MneeValidationError(`Invalid atomic amount type: expected number, got ${typeof atomicAmount}`)
    }

    if (isNaN(atomicAmount)) {
      throw new MneeValidationError('Atomic amount cannot be NaN')
    }

    if (!isFinite(atomicAmount)) {
      throw new MneeValidationError('Atomic amount must be finite')
    }

    if (atomicAmount < 0) {
      throw new MneeValidationError('Atomic amount cannot be negative')
    }

    if (!Number.isInteger(atomicAmount)) {
      throw new MneeValidationError('Atomic amount must be an integer')
    }

    return atomicAmount / this.ATOMIC_UNITS_PER_TOKEN
  }

  /**
   * Format atomic units as MNEE token string with proper formatting
   * @param atomicAmount Amount in atomic units
   * @param options Formatting options
   * @returns Formatted MNEE amount string
   */
  static formatMneeAmount(atomicAmount: number, options: ConversionOptions = {}): string {
    const {
      includeSymbol = true,
      decimals = this.DEFAULT_DECIMALS,
      locale = 'en-US'
    } = options

    const mneeAmount = this.fromAtomicUnits(atomicAmount)
    
    // Use toLocaleString for proper number formatting
    const formatted = mneeAmount.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: false // Don't use thousands separators for token amounts
    })

    return includeSymbol ? `${formatted} ${this.TOKEN_SYMBOL}` : formatted
  }

  /**
   * Parse MNEE amount string to atomic units with validation
   * @param mneeAmountString String representation of MNEE amount
   * @returns Amount in atomic units
   */
  static parseMneeAmount(mneeAmountString: string): number {
    if (typeof mneeAmountString !== 'string') {
      throw new MneeValidationError(`Invalid input type: expected string, got ${typeof mneeAmountString}`)
    }

    // Clean the string: remove symbol, whitespace, and non-numeric characters except decimal point
    const cleaned = mneeAmountString
      .replace(new RegExp(this.TOKEN_SYMBOL, 'gi'), '') // Remove MNEE symbol (case insensitive)
      .replace(/\s+/g, '') // Remove whitespace
      .replace(/[^\d.-]/g, '') // Keep only digits, decimal point, and minus sign

    if (!cleaned) {
      throw new MneeValidationError('Empty or invalid MNEE amount string')
    }

    const mneeAmount = parseFloat(cleaned)
    
    if (isNaN(mneeAmount)) {
      throw new MneeValidationError(`Invalid MNEE amount: ${mneeAmountString}`)
    }

    return this.toAtomicUnits(mneeAmount)
  }

  /**
   * Validate MNEE amount is within acceptable range
   * @param atomicAmount Amount in atomic units
   * @returns ValidationResult with details
   */
  static validateAmount(atomicAmount: number): ValidationResult {
    try {
      this.validateAtomicAmount(atomicAmount)
      return {
        isValid: true,
        normalizedAmount: atomicAmount
      }
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      }
    }
  }

  /**
   * Validate MNEE token amount (before conversion to atomic units)
   * @param mneeAmount Amount in MNEE tokens
   * @returns ValidationResult with details
   */
  static validateMneeAmount(mneeAmount: number): ValidationResult {
    try {
      const atomicAmount = this.toAtomicUnits(mneeAmount)
      return this.validateAmount(atomicAmount)
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error'
      }
    }
  }

  /**
   * Get minimum transferable amount in MNEE tokens
   * @returns Minimum amount in MNEE tokens
   */
  static getMinimumAmount(): number {
    return this.fromAtomicUnits(MNEE_FEE_CONFIG.minTransferAmount)
  }

  /**
   * Get maximum transferable amount in MNEE tokens
   * @returns Maximum amount in MNEE tokens
   */
  static getMaximumAmount(): number {
    return this.fromAtomicUnits(MNEE_FEE_CONFIG.maxTransferAmount)
  }

  /**
   * Format minimum amount as string
   * @param options Formatting options
   * @returns Formatted minimum amount
   */
  static formatMinimumAmount(options: ConversionOptions = {}): string {
    return this.formatMneeAmount(MNEE_FEE_CONFIG.minTransferAmount, options)
  }

  /**
   * Format maximum amount as string
   * @param options Formatting options
   * @returns Formatted maximum amount
   */
  static formatMaximumAmount(options: ConversionOptions = {}): string {
    return this.formatMneeAmount(MNEE_FEE_CONFIG.maxTransferAmount, options)
  }

  /**
   * Check if amount is within valid range
   * @param atomicAmount Amount in atomic units
   * @returns True if within range
   */
  static isWithinRange(atomicAmount: number): boolean {
    return atomicAmount >= MNEE_FEE_CONFIG.minTransferAmount && 
           atomicAmount <= MNEE_FEE_CONFIG.maxTransferAmount
  }

  /**
   * Round MNEE amount to valid precision
   * @param mneeAmount Amount in MNEE tokens
   * @returns Rounded amount that can be converted to atomic units without precision loss
   */
  static roundToValidPrecision(mneeAmount: number): number {
    // Convert to atomic units and back to ensure valid precision
    const atomicAmount = Math.floor(mneeAmount * this.ATOMIC_UNITS_PER_TOKEN)
    return atomicAmount / this.ATOMIC_UNITS_PER_TOKEN
  }

  /**
   * Calculate platform fee for a given amount
   * @param atomicAmount Base amount in atomic units
   * @param feePercentage Fee percentage (default from config)
   * @returns Fee amount in atomic units
   */
  static calculatePlatformFee(
    atomicAmount: number, 
    feePercentage: number = MNEE_FEE_CONFIG.platformFeePercentage
  ): number {
    if (feePercentage < 0 || feePercentage > 100) {
      throw new MneeValidationError(`Invalid fee percentage: ${feePercentage}. Must be between 0 and 100`)
    }

    const feeAmount = Math.floor(atomicAmount * (feePercentage / 100))
    return Math.max(feeAmount, 0) // Ensure non-negative fee
  }

  /**
   * Calculate net amount after platform fee
   * @param atomicAmount Gross amount in atomic units
   * @param feePercentage Fee percentage (default from config)
   * @returns Net amount in atomic units
   */
  static calculateNetAmount(
    atomicAmount: number, 
    feePercentage: number = MNEE_FEE_CONFIG.platformFeePercentage
  ): number {
    const feeAmount = this.calculatePlatformFee(atomicAmount, feePercentage)
    return atomicAmount - feeAmount
  }

  /**
   * Batch convert multiple MNEE amounts to atomic units
   * @param mneeAmounts Array of MNEE token amounts
   * @returns Array of atomic unit amounts
   */
  static batchToAtomicUnits(mneeAmounts: number[]): number[] {
    return mneeAmounts.map(amount => this.toAtomicUnits(amount))
  }

  /**
   * Batch convert multiple atomic amounts to MNEE tokens
   * @param atomicAmounts Array of atomic unit amounts
   * @returns Array of MNEE token amounts
   */
  static batchFromAtomicUnits(atomicAmounts: number[]): number[] {
    return atomicAmounts.map(amount => this.fromAtomicUnits(amount))
  }

  /**
   * Get conversion rate information
   * @returns Conversion rate details
   */
  static getConversionInfo() {
    return {
      atomicUnitsPerToken: this.ATOMIC_UNITS_PER_TOKEN,
      decimals: this.DEFAULT_DECIMALS,
      symbol: this.TOKEN_SYMBOL,
      minAmount: this.getMinimumAmount(),
      maxAmount: this.getMaximumAmount(),
      platformFeePercentage: MNEE_FEE_CONFIG.platformFeePercentage
    }
  }

  // Private helper methods

  /**
   * Internal validation for atomic amounts
   * @param atomicAmount Amount in atomic units
   */
  private static validateAtomicAmount(atomicAmount: number): void {
    if (atomicAmount < 0) {
      throw new MneeValidationError('Amount cannot be negative')
    }

    if (atomicAmount < MNEE_FEE_CONFIG.minTransferAmount) {
      const minFormatted = this.formatMneeAmount(MNEE_FEE_CONFIG.minTransferAmount)
      throw new MneeValidationError(`Amount too small. Minimum: ${minFormatted}`)
    }

    if (atomicAmount > MNEE_FEE_CONFIG.maxTransferAmount) {
      const maxFormatted = this.formatMneeAmount(MNEE_FEE_CONFIG.maxTransferAmount)
      throw new MneeValidationError(`Amount too large. Maximum: ${maxFormatted}`)
    }

    // Check for precision issues
    if (!Number.isInteger(atomicAmount)) {
      throw new MneeValidationError('Atomic amount must be an integer')
    }
  }
}

// Export convenience functions for backward compatibility
export const {
  toAtomicUnits,
  fromAtomicUnits,
  formatMneeAmount,
  parseMneeAmount,
  validateAmount,
  validateMneeAmount,
  getMinimumAmount,
  getMaximumAmount,
  isWithinRange,
  roundToValidPrecision,
  calculatePlatformFee,
  calculateNetAmount
} = MneeUnitConverter

// Export the class as default
export default MneeUnitConverter