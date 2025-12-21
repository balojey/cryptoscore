#!/usr/bin/env node

/**
 * Twitter Login Diagnostic Script
 * 
 * Helps diagnose why Twitter login is not working.
 * Run this to check your configuration.
 * 
 * Usage: node scripts/diagnose-twitter-login.js
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(70))
  log(title, 'cyan')
  console.log('='.repeat(70))
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
    return null
  }
}

function checkEnvironment(env) {
  logSection('Environment Configuration')
  
  const apiKey = env.VITE_CROSSMINT_CLIENT_API_KEY
  const environment = env.VITE_CROSSMINT_ENVIRONMENT
  
  const hasApiKey = Boolean(apiKey && apiKey !== 'your_crossmint_client_api_key_here')
  logCheck('Crossmint API Key', hasApiKey)
  
  if (hasApiKey) {
    const isStaging = apiKey.startsWith('ck_staging_')
    const isProduction = apiKey.startsWith('ck_production_')
    
    if (isStaging) {
      log('  Environment: Staging', 'blue')
      if (environment !== 'staging') {
        log('  ⚠ Warning: API key is staging but environment is not set to "staging"', 'yellow')
      }
    } else if (isProduction) {
      log('  Environment: Production', 'blue')
      if (environment !== 'production') {
        log('  ⚠ Warning: API key is production but environment is not set to "production"', 'yellow')
      }
    }
  }
  
  return hasApiKey
}

function checkCodeConfiguration() {
  logSection('Code Configuration')
  
  try {
    const mainPath = join(__dirname, '..', 'src', 'main.tsx')
    const mainContent = readFileSync(mainPath, 'utf-8')
    
    // Check if twitter is in loginMethods
    const hasTwitterInLoginMethods = mainContent.includes("'twitter'")
    logCheck(
      'Twitter in loginMethods',
      hasTwitterInLoginMethods,
      hasTwitterInLoginMethods 
        ? '✓ Twitter is configured in loginMethods array'
        : '❌ Twitter is NOT in loginMethods - add it to enable Twitter login'
    )
    
    // Check loginMethods prop exists
    const hasLoginMethodsProp = mainContent.includes('loginMethods={')
    logCheck(
      'loginMethods prop present',
      hasLoginMethodsProp,
      hasLoginMethodsProp
        ? '✓ loginMethods prop is configured'
        : '❌ loginMethods prop is missing - Crossmint modal won\'t show'
    )
    
    return hasTwitterInLoginMethods && hasLoginMethodsProp
  } catch (error) {
    log('Error: Could not check code configuration', 'red')
    return false
  }
}

function printTwitterDiagnostics() {
  logSection('Twitter Login Diagnostics')
  
  log('\n🔍 Common Twitter Login Issues:\n', 'yellow')
  
  console.log('1. Twitter OAuth Not Enabled in Crossmint Console')
  console.log('   → Go to: https://staging.crossmint.com/console')
  console.log('   → Settings → Authentication → Social Providers → Twitter')
  console.log('   → Click "Enable" or "Configure"')
  console.log('')
  
  console.log('2. Redirect URI Not Configured')
  console.log('   → Go to: Settings → Authentication → Redirect URIs')
  console.log('   → Add: http://localhost:5173')
  console.log('   → Add: http://localhost:5173/')
  console.log('')
  
  console.log('3. Twitter App in Restricted Mode')
  console.log('   → If using your own Twitter OAuth app:')
  console.log('   → Go to: https://developer.twitter.com/en/portal/dashboard')
  console.log('   → Check app is not in restricted mode')
  console.log('   → Ensure OAuth 2.0 is enabled')
  console.log('')
  
  console.log('4. Missing OAuth Scopes')
  console.log('   → Ensure Twitter OAuth has "users.read" scope')
  console.log('   → Check in Crossmint console or Twitter Developer Portal')
  console.log('')
}

function printDebuggingSteps() {
  logSection('Debugging Steps')
  
  log('\n📋 Follow these steps to debug:\n', 'cyan')
  
  console.log('Step 1: Enable Debug Mode')
  console.log('  In browser console:')
  console.log("  localStorage.setItem('crossmint:debug', 'true')")
  console.log('')
  
  console.log('Step 2: Test Twitter Login')
  console.log('  1. npm run dev')
  console.log('  2. Open http://localhost:5173')
  console.log('  3. Open DevTools (F12) → Console tab')
  console.log('  4. Click "Connect to CryptoScore"')
  console.log('  5. Click "Social Login"')
  console.log('  6. Look for Twitter option in Crossmint modal')
  console.log('')
  
  console.log('Step 3: Check Console Logs')
  console.log('  Look for errors related to:')
  console.log('  - "twitter"')
  console.log('  - "oauth"')
  console.log('  - "redirect_uri"')
  console.log('  - "unauthorized"')
  console.log('')
  
  console.log('Step 4: Check Network Tab')
  console.log('  1. DevTools → Network tab')
  console.log('  2. Try Twitter login')
  console.log('  3. Look for failed requests (red)')
  console.log('  4. Check requests to:')
  console.log('     - crossmint.com/api/oauth/twitter')
  console.log('     - twitter.com/i/oauth2/authorize')
  console.log('')
}

function printQuickFixes() {
  logSection('Quick Fixes')
  
  log('\n🔧 Try these quick fixes:\n', 'green')
  
  console.log('Fix 1: Use Crossmint\'s Managed Twitter OAuth')
  console.log('  → In Crossmint console')
  console.log('  → Settings → Social Providers → Twitter')
  console.log('  → Select "Use Crossmint\'s Twitter OAuth"')
  console.log('  → This is the easiest option!')
  console.log('')
  
  console.log('Fix 2: Clear Browser State')
  console.log('  In browser console:')
  console.log('  localStorage.clear()')
  console.log('  sessionStorage.clear()')
  console.log('  Then refresh the page')
  console.log('')
  
  console.log('Fix 3: Try Incognito Mode')
  console.log('  → Open browser in incognito/private mode')
  console.log('  → This rules out extensions and cached state')
  console.log('')
  
  console.log('Fix 4: Check Crossmint Status')
  console.log('  → Go to: https://status.crossmint.com')
  console.log('  → Check if Twitter OAuth service is operational')
  console.log('')
}

function printNextSteps(envValid, codeValid) {
  logSection('Next Steps')
  
  if (!envValid) {
    log('❌ Fix environment configuration first', 'red')
    console.log('   → Set VITE_CROSSMINT_CLIENT_API_KEY in .env')
    console.log('   → Set VITE_CROSSMINT_ENVIRONMENT to "staging" or "production"')
    console.log('')
  }
  
  if (!codeValid) {
    log('❌ Fix code configuration', 'red')
    console.log('   → Ensure "twitter" is in loginMethods array')
    console.log('   → Check main.tsx configuration')
    console.log('')
  }
  
  if (envValid && codeValid) {
    log('✓ Configuration looks good!', 'green')
    console.log('')
    log('⚠ Most likely issue: Twitter OAuth not enabled in Crossmint console', 'yellow')
    console.log('')
    console.log('Action Required:')
    console.log('1. Go to: https://staging.crossmint.com/console')
    console.log('2. Settings → Authentication → Social Providers')
    console.log('3. Enable Twitter OAuth')
    console.log('4. Configure redirect URIs')
    console.log('5. Test again')
    console.log('')
  }
  
  log('📚 Full troubleshooting guide: TWITTER_LOGIN_TROUBLESHOOTING.md', 'cyan')
}

function main() {
  log('\n🐦 Twitter Login Diagnostic Tool\n', 'cyan')
  
  const env = loadEnvFile()
  if (!env) {
    process.exit(1)
  }
  
  const envValid = checkEnvironment(env)
  const codeValid = checkCodeConfiguration()
  
  printTwitterDiagnostics()
  printDebuggingSteps()
  printQuickFixes()
  printNextSteps(envValid, codeValid)
  
  console.log('')
}

main()
