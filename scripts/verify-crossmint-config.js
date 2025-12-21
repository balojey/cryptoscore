#!/usr/bin/env node

/**
 * Crossmint Configuration Verification Script
 * 
 * Verifies that Crossmint is properly configured for social login.
 * Run this script to check your configuration before testing.
 * 
 * Usage: node scripts/verify-crossmint-config.js
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'cyan')
  console.log('='.repeat(60))
}

function logCheck(label, status, message = '') {
  const icon = status ? '✓' : '✗'
  const color = status ? 'green' : 'red'
  log(`${icon} ${label}`, color)
  if (message) {
    console.log(`  ${message}`)
  }
}

function loadEnvFile() {
  try {
    const envPath = join(__dirname, '..', '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    const env = {}
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim()
        }
      }
    })
    
    return env
  } catch (error) {
    log('Error: Could not read .env file', 'red')
    console.log(error.message)
    return null
  }
}

function verifyEnvironmentVariables(env) {
  logSection('Environment Variables')
  
  const apiKey = env.VITE_CROSSMINT_CLIENT_API_KEY
  const environment = env.VITE_CROSSMINT_ENVIRONMENT
  
  // Check API key
  const hasApiKey = Boolean(apiKey && apiKey !== 'your_crossmint_client_api_key_here')
  logCheck(
    'VITE_CROSSMINT_CLIENT_API_KEY',
    hasApiKey,
    hasApiKey ? `Set: ${apiKey.substring(0, 20)}...` : 'Not set or using placeholder'
  )
  
  // Check environment
  const validEnvironments = ['staging', 'production']
  const hasValidEnvironment = validEnvironments.includes(environment)
  logCheck(
    'VITE_CROSSMINT_ENVIRONMENT',
    hasValidEnvironment,
    hasValidEnvironment ? `Set to: ${environment}` : `Invalid or not set (should be 'staging' or 'production')`
  )
  
  // Determine API key type
  if (hasApiKey) {
    const isStaging = apiKey.startsWith('ck_staging_')
    const isProduction = apiKey.startsWith('ck_production_')
    
    if (isStaging) {
      log('  API Key Type: Staging', 'blue')
      if (environment !== 'staging') {
        log('  ⚠ Warning: Using staging API key but environment is not set to "staging"', 'yellow')
      }
    } else if (isProduction) {
      log('  API Key Type: Production', 'blue')
      if (environment !== 'production') {
        log('  ⚠ Warning: Using production API key but environment is not set to "production"', 'yellow')
      }
    } else {
      log('  ⚠ Warning: API key format not recognized', 'yellow')
    }
  }
  
  return hasApiKey && hasValidEnvironment
}

function verifyCodeConfiguration() {
  logSection('Code Configuration')
  
  try {
    // Check main.tsx
    const mainPath = join(__dirname, '..', 'src', 'main.tsx')
    const mainContent = readFileSync(mainPath, 'utf-8')
    
    // Check that loginMethods is NOT passed to CrossmintAuthProvider
    const hasLoginMethodsProp = mainContent.includes('loginMethods={')
    logCheck(
      'CrossmintAuthProvider (headless mode)',
      !hasLoginMethodsProp,
      hasLoginMethodsProp 
        ? '❌ Found loginMethods prop - this causes double modal issue'
        : '✓ No loginMethods prop - headless mode enabled'
    )
    
    // Check that CrossmintAuthProvider exists
    const hasCrossmintAuthProvider = mainContent.includes('<CrossmintAuthProvider')
    logCheck(
      'CrossmintAuthProvider present',
      hasCrossmintAuthProvider,
      hasCrossmintAuthProvider ? '✓ Found in main.tsx' : '❌ Not found in main.tsx'
    )
    
    // Check that CrossmintWalletProvider has createOnLogin
    const hasCreateOnLogin = mainContent.includes('createOnLogin={')
    logCheck(
      'CrossmintWalletProvider createOnLogin',
      hasCreateOnLogin,
      hasCreateOnLogin ? '✓ Wallet creation configured' : '❌ createOnLogin prop not found'
    )
    
    // Check AuthModal.tsx
    const authModalPath = join(__dirname, '..', 'src', 'components', 'auth', 'AuthModal.tsx')
    const authModalContent = readFileSync(authModalPath, 'utf-8')
    
    // Check that modal closes before login
    const closesBeforeLogin = authModalContent.includes('onOpenChange(false)') && 
                              authModalContent.includes('crossmintAuth.login')
    logCheck(
      'AuthModal closes before login',
      closesBeforeLogin,
      closesBeforeLogin ? '✓ Modal closes to prevent double modal' : '❌ Modal may not close before login'
    )
    
    // Check for auto-close on success
    const hasAutoClose = authModalContent.includes("crossmintAuth.status === 'logged-in'")
    logCheck(
      'Auto-close on successful auth',
      hasAutoClose,
      hasAutoClose ? '✓ Modal auto-closes on success' : '❌ Auto-close not implemented'
    )
    
    return !hasLoginMethodsProp && hasCrossmintAuthProvider && hasCreateOnLogin
  } catch (error) {
    log('Error: Could not verify code configuration', 'red')
    console.log(error.message)
    return false
  }
}

function printNextSteps(envValid, codeValid) {
  logSection('Next Steps')
  
  if (!envValid) {
    log('1. Configure environment variables in app/.env:', 'yellow')
    console.log('   - Set VITE_CROSSMINT_CLIENT_API_KEY')
    console.log('   - Set VITE_CROSSMINT_ENVIRONMENT (staging or production)')
    console.log('')
  }
  
  if (!codeValid) {
    log('2. Fix code configuration issues (see above)', 'yellow')
    console.log('')
  }
  
  log('3. Configure Redirect URIs in Crossmint Console:', 'yellow')
  console.log('   a. Go to: https://staging.crossmint.com/console (or production)')
  console.log('   b. Select your project')
  console.log('   c. Navigate to: Settings → Authentication → Redirect URIs')
  console.log('   d. Add these URIs:')
  console.log('      - http://localhost:5173')
  console.log('      - http://localhost:5173/')
  console.log('   e. For production, also add your domain:')
  console.log('      - https://yourdomain.com')
  console.log('      - https://yourdomain.com/')
  console.log('   f. Save the configuration')
  console.log('')
  
  log('4. Test the authentication flow:', 'yellow')
  console.log('   a. Start dev server: npm run dev')
  console.log('   b. Open: http://localhost:5173')
  console.log('   c. Open browser console (F12)')
  console.log('   d. Click "Connect to CryptoScore"')
  console.log('   e. Click any social login button')
  console.log('   f. Verify: No double modal appears')
  console.log('   g. Verify: Redirected to social provider')
  console.log('   h. Verify: Redirected back and authenticated')
  console.log('')
  
  log('5. Enable debug mode (optional):', 'yellow')
  console.log('   In browser console:')
  console.log("   localStorage.setItem('crossmint:debug', 'true')")
  console.log('')
  
  log('📚 Documentation:', 'cyan')
  console.log('   - Quick Fix: app/docs/CROSSMINT_QUICK_FIX.md')
  console.log('   - Troubleshooting: app/docs/CROSSMINT_TROUBLESHOOTING.md')
  console.log('   - Summary: CROSSMINT_FIX_SUMMARY.md')
}

function main() {
  log('\n🔍 Crossmint Configuration Verification\n', 'cyan')
  
  // Load and verify environment variables
  const env = loadEnvFile()
  if (!env) {
    process.exit(1)
  }
  
  const envValid = verifyEnvironmentVariables(env)
  const codeValid = verifyCodeConfiguration()
  
  // Print summary
  logSection('Summary')
  
  if (envValid && codeValid) {
    log('✓ Configuration looks good!', 'green')
    log('\n⚠ IMPORTANT: Make sure to configure Redirect URIs in Crossmint Console', 'yellow')
    log('  This is the most critical step for authentication to work.', 'yellow')
  } else {
    log('✗ Configuration issues found', 'red')
    log('  Please fix the issues above before testing.', 'red')
  }
  
  printNextSteps(envValid, codeValid)
  
  console.log('')
}

main()
