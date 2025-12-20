#!/usr/bin/env node

/**
 * List Available Environments Script
 * Shows all available deployment environments and their configurations
 */

const fs = require('fs');
const path = require('path');

class EnvironmentLister {
  constructor() {
    this.rootDir = process.cwd();
  }

  listEnvironments() {
    console.log('🌐 Available Deployment Environments:\n');
    
    const environments = this.getAvailableEnvironments();
    
    if (environments.length === 0) {
      console.log('❌ No environment files found');
      console.log('💡 Create environment files like .env.development, .env.staging, .env.production');
      return;
    }
    
    environments.forEach(env => {
      this.displayEnvironment(env);
    });
    
    console.log('\n🔧 Usage:');
    console.log('  npm run configure:development  - Set development environment');
    console.log('  npm run configure:staging      - Set staging environment');
    console.log('  npm run configure:production   - Set production environment');
    console.log('  npm run deploy:development     - Deploy to development');
    console.log('  npm run deploy:staging         - Deploy to staging');
    console.log('  npm run deploy:production      - Deploy to production');
  }

  getAvailableEnvironments() {
    const envFiles = fs.readdirSync(this.rootDir)
      .filter(file => file.startsWith('.env.') && !file.endsWith('.example'))
      .map(file => file.replace('.env.', ''));
    
    return envFiles;
  }

  displayEnvironment(envName) {
    const envFile = path.join(this.rootDir, `.env.${envName}`);
    
    console.log(`📍 ${envName.toUpperCase()}`);
    
    try {
      const content = fs.readFileSync(envFile, 'utf8');
      const config = this.parseEnvFile(content);
      
      // Display key configuration values
      if (config.VITE_SUPABASE_URL) {
        const url = config.VITE_SUPABASE_URL;
        const maskedUrl = url.includes('your_') ? url : this.maskUrl(url);
        console.log(`   Supabase URL: ${maskedUrl}`);
      }
      
      if (config.VITE_CROSSMINT_ENVIRONMENT) {
        console.log(`   Crossmint Environment: ${config.VITE_CROSSMINT_ENVIRONMENT}`);
      }
      
      if (config.NODE_ENV) {
        console.log(`   Node Environment: ${config.NODE_ENV}`);
      }
      
      if (config.LOG_LEVEL) {
        console.log(`   Log Level: ${config.LOG_LEVEL}`);
      }
      
      // Check if configuration is complete
      const isConfigured = this.isEnvironmentConfigured(config);
      console.log(`   Status: ${isConfigured ? '✅ Configured' : '⚠️  Needs Configuration'}`);
      
    } catch (error) {
      console.log(`   Status: ❌ Error reading file`);
    }
    
    console.log();
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

  maskUrl(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      const parts = hostname.split('.');
      if (parts.length > 2) {
        parts[0] = parts[0].substring(0, 4) + '***';
      }
      return `${urlObj.protocol}//${parts.join('.')}${urlObj.pathname}`;
    } catch {
      return url.substring(0, 20) + '***';
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
  const lister = new EnvironmentLister();
  lister.listEnvironments();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { EnvironmentLister };