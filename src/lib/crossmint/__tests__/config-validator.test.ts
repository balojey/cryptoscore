/**
 * Tests for Crossmint configuration validator
 */

import { describe, expect, it } from 'vitest'
import {
  createConfigurationErrorMessage,
  formatValidationErrors,
  getConsoleUrl,
  shouldEnableCrossmint,
  validateCrossmintConfiguration,
} from '../config-validator'

describe('validateCrossmintConfiguration', () => {
  it('should pass validation with valid configuration', () => {
    const result = validateCrossmintConfiguration({
      clientApiKey: 'sk_staging_1234567890abcdefghijklmnopqrstuvwxyz',
      environment: 'staging',
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail validation when API key is missing', () => {
    const result = validateCrossmintConfiguration({
      clientApiKey: '',
      environment: 'staging',
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('VITE_CROSSMINT_CLIENT_API_KEY is missing')
  })

  it('should fail validation when API key is a placeholder', () => {
    const result = validateCrossmintConfiguration({
      clientApiKey: 'your_crossmint_client_api_key_here',
      environment: 'staging',
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('appears to be invalid')
  })

  it('should fail validation when API key is too short', () => {
    const result = validateCrossmintConfiguration({
      clientApiKey: 'short',
      environment: 'staging',
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('appears to be invalid')
  })

  it('should fail validation when environment is missing', () => {
    const result = validateCrossmintConfiguration({
      clientApiKey: 'sk_staging_1234567890abcdefghijklmnopqrstuvwxyz',
      environment: '',
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('VITE_CROSSMINT_ENVIRONMENT is missing')
  })

  it('should fail validation when environment is invalid', () => {
    const result = validateCrossmintConfiguration({
      clientApiKey: 'sk_staging_1234567890abcdefghijklmnopqrstuvwxyz',
      environment: 'development',
    })

    expect(result.valid).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('invalid value: "development"')
  })

  it('should add warning when using production environment', () => {
    const result = validateCrossmintConfiguration({
      clientApiKey: 'sk_production_1234567890abcdefghijklmnopqrstuvwxyz',
      environment: 'production',
    })

    expect(result.valid).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('Using production Crossmint environment')
  })

  it('should fail with multiple errors when both API key and environment are invalid', () => {
    const result = validateCrossmintConfiguration({
      clientApiKey: '',
      environment: 'invalid',
    })

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})

describe('shouldEnableCrossmint', () => {
  it('should return true when API key is present', () => {
    expect(shouldEnableCrossmint('sk_staging_1234567890abcdefghijklmnopqrstuvwxyz')).toBe(true)
  })

  it('should return false when API key is empty', () => {
    expect(shouldEnableCrossmint('')).toBe(false)
  })

  it('should return false when API key is whitespace', () => {
    expect(shouldEnableCrossmint('   ')).toBe(false)
  })
})

describe('getConsoleUrl', () => {
  it('should return production URL for production environment', () => {
    const url = getConsoleUrl('production')
    expect(url).toBe('https://www.crossmint.com/console')
  })

  it('should return staging URL for staging environment', () => {
    const url = getConsoleUrl('staging')
    expect(url).toBe('https://staging.crossmint.com/console')
  })
})

describe('formatValidationErrors', () => {
  it('should format errors correctly', () => {
    const result = {
      valid: false,
      errors: ['Error 1', 'Error 2'],
      warnings: [],
    }

    const formatted = formatValidationErrors(result)
    expect(formatted).toContain('Configuration Errors:')
    expect(formatted).toContain('1. Error 1')
    expect(formatted).toContain('2. Error 2')
  })

  it('should format warnings correctly', () => {
    const result = {
      valid: true,
      errors: [],
      warnings: ['Warning 1', 'Warning 2'],
    }

    const formatted = formatValidationErrors(result)
    expect(formatted).toContain('Configuration Warnings:')
    expect(formatted).toContain('1. Warning 1')
    expect(formatted).toContain('2. Warning 2')
  })

  it('should format both errors and warnings', () => {
    const result = {
      valid: false,
      errors: ['Error 1'],
      warnings: ['Warning 1'],
    }

    const formatted = formatValidationErrors(result)
    expect(formatted).toContain('Configuration Errors:')
    expect(formatted).toContain('Configuration Warnings:')
  })
})

describe('createConfigurationErrorMessage', () => {
  it('should create a detailed error message', () => {
    const result = {
      valid: false,
      errors: ['API key is missing'],
      warnings: [],
    }

    const message = createConfigurationErrorMessage(result)
    expect(message).toContain('Configuration Error')
    expect(message).toContain('API key is missing')
    expect(message).toContain('To fix this:')
    expect(message).toContain('.env.example')
  })
})
