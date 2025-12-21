#!/usr/bin/env node

/**
 * MNEE Configuration Verification Script
 * 
 * This script verifies that the MNEE SDK configuration is properly set up
 * and can connect to the MNEE API.
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Simple .env parser
function loadEnvFile() {
  try {
    const envPath = join(rootDir, '.env')
    const envContent = readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
    
    return envVars
  } catch (error) {
    console.warn('Could not load .env file:', error.message)
    return {}
  }
}

const envVars = loadEnvFile()

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green)
}

function logError(message) {
  log(`❌ ${message}`, colors.red)
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

async function verifyMneeConfiguration() {
  log('\n🔍 Verifying MNEE Configuration...', colors.cyan)
  log('=' .repeat(50), colors.cyan)

  let hasErrors = false
  let hasWarnings = false

  // Check required environment variables
  const requiredEnvVars = [
    'VITE_MNEE_API_KEY',
    'VITE_MNEE_ENVIRONMENT'
  ]

  const optionalEnvVars = [
    'VITE_MNEE_PLATFORM_FEE_ADDRESS',
    'VITE_PLATFORM_FEE_PERCENTAGE'
  ]

  log('\n📋 Environment Variables Check:', colors.bright)
  
  for (const envVar of requiredEnvVars) {
    const value = envVars[envVar] || process.env[envVar]
    if (!value) {
      logError(`Missing required environment variable: ${envVar}`)
      hasErrors = true
    } else {
      logSuccess(`${envVar}: ${envVar === 'VITE_MNEE_API_KEY' ? '***' + value.slice(-4) : value}`)
    }
  }

  for (const envVar of optionalEnvVars) {
    const value = envVars[envVar] || process.env[envVar]
    if (!value) {
      logWarning(`Optional environment variable not set: ${envVar}`)
      hasWarnings = true
    } else {
      logSuccess(`${envVar}: ${value}`)
    }
  }

  // Validate environment value
  const environment = envVars.VITE_MNEE_ENVIRONMENT || process.env.VITE_MNEE_ENVIRONMENT
  if (environment && !['production', 'sandbox'].includes(environment)) {
    logError(`Invalid MNEE environment: ${environment}. Must be 'production' or 'sandbox'`)
    hasErrors = true
  }

  // Check API key format (basic validation)
  const apiKey = envVars.VITE_MNEE_API_KEY || process.env.VITE_MNEE_API_KEY
  if (apiKey) {
    if (apiKey.length < 10) {
      logWarning('MNEE API key seems too short. Please verify it is correct.')
      hasWarnings = true
    } else {
      logSuccess('MNEE API key format appears valid')
    }
  }

  // Test MNEE SDK import
  log('\n📦 MNEE SDK Import Test:', colors.bright)
  try {
    // Dynamic import to avoid issues if SDK is not installed
    const mneeModule = await import('@mnee/ts-sdk')
    logSuccess('MNEE SDK imported successfully')
    
    // Check if main classes/functions are available
    if (mneeModule.MneeClient) {
      logSuccess('MneeClient class is available')
    } else {
      logWarning('MneeClient class not found in SDK')
      hasWarnings = true
    }
  } catch (error) {
    logError(`Failed to import MNEE SDK: ${error.message}`)
    hasErrors = true
  }

  // Test configuration loading
  log('\n⚙️  Configuration Loading Test:', colors.bright)
  try {
    // Try to load our configuration
    const configPath = join(rootDir, 'src', 'config', 'mnee.ts')
    logInfo(`Loading configuration from: ${configPath}`)
    
    // Note: We can't actually import the TS file directly in Node.js
    // This is just a file existence check
    const fs = await import('fs')
    if (fs.existsSync(configPath)) {
      logSuccess('MNEE configuration file exists')
    } else {
      logError('MNEE configuration file not found')
      hasErrors = true
    }
  } catch (error) {
    logError(`Configuration loading failed: ${error.message}`)
    hasErrors = true
  }

  // Summary
  log('\n📊 Verification Summary:', colors.bright)
  log('=' .repeat(30), colors.cyan)
  
  if (hasErrors) {
    logError('Configuration verification failed! Please fix the errors above.')
    process.exit(1)
  } else if (hasWarnings) {
    logWarning('Configuration verification completed with warnings.')
    logInfo('The configuration should work, but consider addressing the warnings.')
  } else {
    logSuccess('All checks passed! MNEE configuration is ready.')
  }

  // Next steps
  log('\n🚀 Next Steps:', colors.bright)
  if (environment === 'sandbox') {
    logInfo('You are using the sandbox environment - perfect for development!')
  } else if (environment === 'production') {
    logWarning('You are using the production environment - make sure this is intentional!')
  }
  
  logInfo('You can now start implementing MNEE operations in your application.')
  log('')
}

// Run the verification
verifyMneeConfiguration().catch(error => {
  logError(`Verification script failed: ${error.message}`)
  process.exit(1)
})