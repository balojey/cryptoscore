/**
 * Crossmint Configuration Validator
 *
 * Validates Crossmint configuration and environment variables
 * to ensure proper setup before application initialization.
 */

import type { CrossmintEnvironment } from '@/config/crossmint'

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Configuration validation error codes
 */
export enum ConfigErrorCode {
  MISSING_API_KEY = 'MISSING_API_KEY',
  INVALID_API_KEY_FORMAT = 'INVALID_API_KEY_FORMAT',
  INVALID_ENVIRONMENT = 'INVALID_ENVIRONMENT',
  MISSING_ENVIRONMENT = 'MISSING_ENVIRONMENT',
}

/**
 * Validate API key format
 * Crossmint API keys typically follow a specific pattern
 */
function validateApiKeyFormat(apiKey: string): boolean {
  // Basic validation: non-empty string with reasonable length
  if (!apiKey || apiKey.trim().length === 0) {
    return false
  }

  // API keys should be at least 20 characters
  if (apiKey.length < 20) {
    return false
  }

  // Check for placeholder values
  const placeholders = [
    'your_crossmint_client_api_key_here',
    'your_api_key_here',
    'placeholder',
    'test',
    'example',
  ]

  if (placeholders.some(placeholder => apiKey.toLowerCase().includes(placeholder))) {
    return false
  }

  return true
}

/**
 * Validate environment value
 */
function validateEnvironment(environment: string): boolean {
  return environment === 'staging' || environment === 'production'
}

/**
 * Validate Crossmint configuration
 *
 * Performs comprehensive validation of all Crossmint-related
 * environment variables and configuration values.
 *
 * @param config - Configuration object to validate
 * @returns Validation result with errors and warnings
 */
export function validateCrossmintConfiguration(config: {
  clientApiKey: string
  environment: string
}): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Validate API key presence
  if (!config.clientApiKey) {
    errors.push(
      'VITE_CROSSMINT_CLIENT_API_KEY is missing. '
      + 'Get your API key from https://www.crossmint.com/console',
    )
  }
  else if (!validateApiKeyFormat(config.clientApiKey)) {
    errors.push(
      'VITE_CROSSMINT_CLIENT_API_KEY appears to be invalid. '
      + 'Please check your API key format and ensure it\'s not a placeholder value.',
    )
  }

  // Validate environment
  if (!config.environment) {
    errors.push(
      'VITE_CROSSMINT_ENVIRONMENT is missing. '
      + 'Must be set to either "staging" or "production".',
    )
  }
  else if (!validateEnvironment(config.environment)) {
    errors.push(
      `VITE_CROSSMINT_ENVIRONMENT has invalid value: "${config.environment}". `
      + 'Must be either "staging" or "production".',
    )
  }

  // Add warnings for development environment
  if (config.environment === 'production') {
    warnings.push(
      'Using production Crossmint environment. '
      + 'Ensure you are using production API keys and not staging keys.',
    )
  }

  // Warn if using staging in what appears to be a production build
  if (config.environment === 'staging' && import.meta.env.PROD) {
    warnings.push(
      'Using staging Crossmint environment in production build. '
      + 'Consider switching to production environment for live deployments.',
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get environment-specific console URL
 */
export function getConsoleUrl(environment: CrossmintEnvironment): string {
  return environment === 'production'
    ? 'https://www.crossmint.com/console'
    : 'https://staging.crossmint.com/console'
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  const messages: string[] = []

  if (result.errors.length > 0) {
    messages.push('Configuration Errors:')
    result.errors.forEach((error, index) => {
      messages.push(`  ${index + 1}. ${error}`)
    })
  }

  if (result.warnings.length > 0) {
    if (messages.length > 0) {
      messages.push('')
    }
    messages.push('Configuration Warnings:')
    result.warnings.forEach((warning, index) => {
      messages.push(`  ${index + 1}. ${warning}`)
    })
  }

  return messages.join('\n')
}

/**
 * Create a detailed error message for missing configuration
 */
export function createConfigurationErrorMessage(result: ValidationResult): string {
  const lines: string[] = [
    '❌ Crossmint Configuration Error',
    '',
    'The application cannot start because Crossmint is not properly configured.',
    '',
  ]

  lines.push(formatValidationErrors(result))

  lines.push('')
  lines.push('To fix this:')
  lines.push('1. Copy .env.example to .env if you haven\'t already')
  lines.push('2. Get your Crossmint API key from https://www.crossmint.com/console')
  lines.push('3. Add your API key to the .env file:')
  lines.push('   VITE_CROSSMINT_CLIENT_API_KEY=your_actual_api_key')
  lines.push('4. Set the environment (staging for development):')
  lines.push('   VITE_CROSSMINT_ENVIRONMENT=staging')
  lines.push('5. Restart the development server')

  return lines.join('\n')
}

/**
 * Check if Crossmint should be enabled
 * Returns true if configuration is present (even if invalid)
 */
export function shouldEnableCrossmint(apiKey: string): boolean {
  return Boolean(apiKey && apiKey.trim().length > 0)
}
