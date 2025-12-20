#!/usr/bin/env node

/**
 * Current Environment Script
 * Shows the currently active environment configuration
 */

const fs = require('fs');
const path = require('path');

class CurrentEnvironment {
  constructor() {
    this.rootDir = process.cwd();
    this.appDir = path.join(this.rootDir, 'app');
  }

  displayCurrent() {
    console.log('🔍 Current Environment Configuration:\n');
    
    try {
      // Check root .env file
      const rootEnvPath = path.join(this.rootDir, '.env');
      const appEnvPath = path.join(this.appDir, '.env');
      
      if (fs.existsSync(rootEnvPath)) {
        console.log('📁 Root Environment (.env):');
        this.displayEnvFile(rootEnvPath);
        console.log();
      }
      
      if (fs.existsSync(appEnvPath)) {
        console.log('📁 App Environment (app/.env):');
        this.displayEnvFile(appEnvPath);
        console.log();
      }
      
      if (!fs.existsSync(rootEnvPath) && !fs.existsSync(appEnvPath)) {
        console.log('❌ No active environment configuration found');
        console.log('💡 Run one of the configure commands to set up an environment:');
        console.log('   npm run configure:development');
        console.log('   npm run configure:staging');
        console.log('   npm run configure:production');
        return;
      }
      
      // Detect which environment is active
      const activeEnv = this.detectActiveEnvironment();
      if (activeEnv) {
        console.log(`🎯 Detected Environment: ${activeEnv.toUpperCase()}`);
      }
      
    } catch (error) {
      console.error('❌ Error reading environment configuration:', error.message);
    }
  }

  displayEnvFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const config = this.parseEnvFile(content);
      
      // Display key configuration values
      const keyVars = [
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'VITE_CROSSMINT_CLIENT_API_KEY',
        'VITE_CROSSMINT_ENVIRONMENT',
        'NODE_ENV',
        'LOG_LEVEL'
      ];
      
      keyVars.forEach(varName => {
        if (config[varName]) {
          const value = this.maskSensitiveValue(varName, config[varName]);
          console.log(`   ${varName}: ${value}`);
        }
      });
      
      // Check configuration status
      const isConfigured = this.isEnvironmentConfigured(config);
      console.log(`   Status: ${isConfigured ? '✅ Configured' : '⚠️  Needs Configuration'}`);
      
    } catch (error) {
      console.log(`   ❌ Error reading file: ${error.message}`);
    }
  }

  parseEnvFile(content) {
    const config = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        config[key.trim()] = value;
      }
    }
    
    return config;
  }

  maskSensitiveValue(varName, value) {
    if (value.includes('your_') || value.length < 10) {
      return value; // Show placeholder values as-is
    }
    
    if (varName.includes('KEY') || varName.includes('SECRET')) {
      // Mask API keys and secrets
      return value.substring(0, 8) + '***' + value.substring(value.length - 4);
    }
    
    if (varName.includes('URL')) {
      // Mask URLs
      try {
        const urlObj = new URL(value);
        const hostname = urlObj.hostname;
        const parts = hostname.split('.');
        if (parts.length > 2) {
          parts[0] = parts[0].substring(0, 4) + '***';
        }
        return `${urlObj.protocol}//${parts.join('.')}${urlObj.pathname}`;
      } catch {
        return value.substring(0, 20) + '***';
      }
    }
    
    return value;
  }

  detectActiveEnvironment() {
    const appEnvPath = path.join(this.appDir, '.env');
    
    if (!fs.existsSync(appEnvPath)) {
      return null;
    }
    
    try {
      const content = fs.readFileSync(appEnvPath, 'utf8');
      const config = this.parseEnvFile(content);
      
      // Check NODE_ENV first
      if (config.NODE_ENV) {
        return config.NODE_ENV;
      }
      
      // Check Crossmint environment
      if (config.VITE_CROSSMINT_ENVIRONMENT) {
        const crossmintEnv = config.VITE_CROSSMINT_ENVIRONMENT;
        if (crossmintEnv === 'production') return 'production';
        if (crossmintEnv === 'staging') return 'staging';
        return 'development';
      }
      
      // Check LOG_LEVEL as fallback
      if (config.LOG_LEVEL) {
        const logLevel = config.LOG_LEVEL;
        if (logLevel === 'warn' || logLevel === 'error') return 'production';
        if (logLevel === 'info') return 'staging';
        if (logLevel === 'debug') return 'development';
      }
      
      return null;
      
    } catch {
      return null;
    }
  }

  isEnvironmentConfigured(config) {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_CROSSMINT_CLIENT_API_KEY'
    ];
    
    return requiredVars.every(varName => {
      const value = config[varName];
      return value && !value.includes('your_') && value.length > 10;
    });
  }
}

// CLI interface
function main() {
  const current = new CurrentEnvironment();
  current.displayCurrent();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { CurrentEnvironment };