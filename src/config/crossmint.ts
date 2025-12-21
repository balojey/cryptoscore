/**
 * Crossmint Configuration
 *
 * Configuration for Crossmint authentication and wallet management.
 * Supports social login (Google, email OTP) and automatic EVM
 * wallet creation for authenticated users.
 *
 * @module config/crossmint
 * @see {@link https://docs.crossmint.com/ Crossmint Documentation}
 */

/**
 * Crossmint environment type
 * - `staging`: Development and testing environment with staging API endpoints
 * - `production`: Live production environment with production API endpoints
 */
export type CrossmintEnvironment = 'staging' | 'production'

/**
 * Supported authentication methods for Crossmint
 * - `google`: Google OAuth authentication
 * - `email`: Email OTP (one-time password) authentication
 * - `web3:ethereum-only`: Web3 wallet authentication (EVM only)
 */
export type CrossmintLoginMethod
  = | 'google'
    // | 'twitter'
    // | 'farcaster'
    | 'email'
    // | 'web3:ethereum-only'

/**
 * Crossmint configuration interface
 *
 * Defines the complete configuration required to initialize Crossmint SDK
 * providers in the application.
 */
export interface CrossmintConfig {
  /** Client API key obtained from Crossmint console */
  clientApiKey: string

  /** Environment setting (staging for development, production for live) */
  environment: CrossmintEnvironment

  /** Array of enabled authentication methods */
  loginMethods: CrossmintLoginMethod[]

  /** Wallet creation and management configuration */
  walletConfig: {
    /** Blockchain network (EVM chains supported) */
    chain: 'ethereum-sepolia' | 'base' | 'polygon' | 'arbitrum' | 'optimism'

    /** Wallet signer configuration */
    signer: {
      /**
       * Signer type for wallet operations
       * Note: 'passkey' is supported for EVM chains
       */
      type: 'passkey'
    }
  }
}

/**
 * Crossmint client API key from environment variables
 *
 * Set via `VITE_CROSSMINT_CLIENT_API_KEY` in .env file.
 * Obtain from: https://www.crossmint.com/console
 *
 * @constant
 */
export const CROSSMINT_CLIENT_API_KEY = import.meta.env.VITE_CROSSMINT_CLIENT_API_KEY || ''

/**
 * Crossmint environment setting
 *
 * Set via `VITE_CROSSMINT_ENVIRONMENT` in .env file.
 * Defaults to 'staging' if not specified.
 *
 * @constant
 */
export const CROSSMINT_ENVIRONMENT: CrossmintEnvironment
  = (import.meta.env.VITE_CROSSMINT_ENVIRONMENT || 'staging') as CrossmintEnvironment

/**
 * Supported authentication methods
 *
 * All available login methods enabled for the application.
 * Users can choose any of these methods to authenticate.
 *
 * @constant
 */
export const CROSSMINT_LOGIN_METHODS: CrossmintLoginMethod[] = [
  'google',
  // 'twitter',
  // 'farcaster',
  'email',
  // 'web3:solana-only',
]

/**
 * Wallet creation configuration
 *
 * Defines how Crossmint creates and manages wallets for authenticated users.
 * - Creates EVM wallets automatically on first login
 * - Uses passkey signer for transaction signing (supported for EVM chains)
 * - Uses Ethereum Sepolia testnet for development
 *
 * @constant
 */
export const CROSSMINT_WALLET_CONFIG = {
  chain: 'ethereum-sepolia' as const,
  signer: {
    type: 'passkey' as const,
  },
}

/**
 * Complete Crossmint configuration object
 *
 * Combines all configuration values into a single object that can be
 * passed to Crossmint SDK providers.
 *
 * @constant
 */
export const crossmintConfig: CrossmintConfig = {
  clientApiKey: CROSSMINT_CLIENT_API_KEY,
  environment: CROSSMINT_ENVIRONMENT,
  loginMethods: CROSSMINT_LOGIN_METHODS,
  walletConfig: CROSSMINT_WALLET_CONFIG,
}

/**
 * Validate Crossmint configuration
 *
 * Performs basic validation of required environment variables.
 * For comprehensive validation, use `validateCrossmintConfiguration`
 * from `@/lib/crossmint/config-validator` instead.
 *
 * @returns Object containing validation result and optional error message
 * @returns {boolean} valid - True if configuration is valid
 * @returns {string} [error] - Error message if validation fails
 *
 * @deprecated Use validateCrossmintConfiguration from config-validator instead
 *
 * @example
 * ```typescript
 * const result = validateCrossmintConfig()
 * if (!result.valid) {
 *   console.error(result.error)
 * }
 * ```
 */
export function validateCrossmintConfig(): {
  valid: boolean
  error?: string
} {
  if (!CROSSMINT_CLIENT_API_KEY) {
    return {
      valid: false,
      error: 'VITE_CROSSMINT_CLIENT_API_KEY is not set in environment variables',
    }
  }

  if (!['staging', 'production'].includes(CROSSMINT_ENVIRONMENT)) {
    return {
      valid: false,
      error: `Invalid VITE_CROSSMINT_ENVIRONMENT: ${CROSSMINT_ENVIRONMENT}. Must be 'staging' or 'production'`,
    }
  }

  return { valid: true }
}

/**
 * Check if Crossmint integration is enabled
 *
 * Determines whether Crossmint features should be available based on
 * the presence of a valid API key in the configuration.
 *
 * @returns True if Crossmint API key is configured, false otherwise
 *
 * @example
 * ```typescript
 * if (isCrossmintEnabled()) {
 *   // Show social login options
 * } else {
 *   // Show only traditional wallet options
 * }
 * ```
 */
export function isCrossmintEnabled(): boolean {
  return Boolean(CROSSMINT_CLIENT_API_KEY)
}

/**
 * Get Crossmint console URL
 *
 * Returns the appropriate Crossmint console URL based on the
 * configured environment (staging or production).
 *
 * @returns Console URL for the current environment
 *
 * @example
 * ```typescript
 * const consoleUrl = getCrossmintConsoleUrl()
 * // Returns: https://www.crossmint.com/console (production)
 * // or: https://staging.crossmint.com/console (staging)
 * ```
 */
export function getCrossmintConsoleUrl(): string {
  return CROSSMINT_ENVIRONMENT === 'production'
    ? 'https://www.crossmint.com/console'
    : 'https://staging.crossmint.com/console'
}

/**
 * API scopes required for Crossmint integration
 *
 * These scopes define the permissions needed for the application
 * to interact with Crossmint's API:
 * - `users.create`: Create new user accounts
 * - `users.read`: Read user profile information
 * - `wallets.read`: Read wallet addresses and balances
 *
 * @constant
 */
export const CROSSMINT_API_SCOPES = [
  'users.create',
  'users.read',
  'wallets.read',
  'wallets:transactions.create',
  'wallets:transactions.sign',
  'wallets:transactions.read',
  'wallets:signatures.create',
  'wallets:signatures.read',
  'wallets:messages.sign'
] as const

/**
 * Type representing valid Crossmint API scopes
 */
export type CrossmintApiScope = typeof CROSSMINT_API_SCOPES[number]
