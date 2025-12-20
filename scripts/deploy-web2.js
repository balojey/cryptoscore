#!/usr/bin/env node

/**
 * Web2 Deployment Script for CryptoScore
 * Handles deployment to different environments (development, staging, production)
 * Updated for Supabase backend without Solana dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class Web2Deployer {
  constructor(environment) {
    this.environment = environment;
    this.supportedEnvironments = ['development', 'staging', 'production'];
    
    if (!this.supportedEnvironments.includes(environment)) {
      throw new Error(`Unsupported environment: ${environment}. Supported: ${this.supportedEnvironments.join(', ')}`);
    }
  }

  async deploy() {
    console.log(`🚀 Starting Web2 deployment to ${this.environment}...`);
    
    try {
      // Step 1: Validate environment configuration
      await this.validateEnvironment();
      
      // Step 2: Validate Supabase connection
      await this.validateSupabase();
      
      // Step 3: Build the application
      await this.buildApplication();
      
      // Step 4: Run deployment based on environment
      await this.deployToEnvironment();
      
      // Step 5: Post-deployment tasks
      await this.postDeployment();
      
      console.log(`🎉 Web2 deployment to ${this.environment} completed successfully!`);
      
    } catch (error) {
      console.error(`❌ Deployment failed:`, error.message);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log(`🔍 Validating ${this.environment} environment...`);
    
    const envFile = `.env.${this.environment}`;
    
    // Check if environment files exist
    if (!fs.existsSync(envFile)) {
      throw new Error(`Environment file not found: ${envFile}`);
    }
    
    // Load and validate required environment variables
    const envContent = fs.readFileSync(envFile, 'utf8');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_CROSSMINT_CLIENT_API_KEY',
      'VITE_CROSSMINT_ENVIRONMENT'
    ];
    
    for (const varName of requiredVars) {
      if (!envContent.includes(varName) || envContent.includes(`${varName}=your_`)) {
        throw new Error(`Missing or placeholder value for ${varName} in ${envFile}`);
      }
    }
    
    console.log(`   ✅ Environment validation passed`);
  }

  async validateSupabase() {
    console.log(`🔗 Validating Supabase configuration...`);
    
    // Load environment variables from the specific environment file
    const envFile = `.env.${this.environment}`;
    const envContent = fs.readFileSync(envFile, 'utf8');
    
    // Extract Supabase URL
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    if (!urlMatch || urlMatch[1].includes('your_')) {
      throw new Error('Invalid Supabase URL in environment file');
    }
    
    const supabaseUrl = urlMatch[1].trim();
    
    // Validate URL format
    if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
      throw new Error('Supabase URL format is invalid');
    }
    
    console.log(`   ✅ Supabase URL validated: ${supabaseUrl}`);
    
    // Check for service role key in production
    if (this.environment === 'production') {
      if (!envContent.includes('VITE_SUPABASE_SERVICE_ROLE_KEY') || 
          envContent.includes('VITE_SUPABASE_SERVICE_ROLE_KEY=your_')) {
        console.log('   ⚠️  Service role key not configured (may be needed for admin functions)');
      }
    }
    
    console.log(`   ✅ Supabase configuration validated`);
  }

  async buildApplication() {
    console.log(`🔨 Building application for ${this.environment}...`);
    
    // Copy environment file to app directory
    const envFile = `.env.${this.environment}`;
    const appEnvFile = `app/.env`;
    
    fs.copyFileSync(envFile, appEnvFile);
    console.log(`   ✅ Environment file copied to app/.env`);
    
    // Build the application
    try {
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: path.join(process.cwd(), 'app')
      });
      console.log(`   ✅ Application built successfully`);
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
    
    // Validate build output
    const distDir = path.join(process.cwd(), 'app', 'dist');
    if (!fs.existsSync(distDir)) {
      throw new Error('Build output directory not found');
    }
    
    const indexFile = path.join(distDir, 'index.html');
    if (!fs.existsSync(indexFile)) {
      throw new Error('Build output missing index.html');
    }
    
    console.log(`   ✅ Build output validated`);
  }

  async deployToEnvironment() {
    console.log(`📦 Deploying to ${this.environment}...`);
    
    switch (this.environment) {
      case 'development':
        await this.deployToDevelopment();
        break;
      case 'staging':
        await this.deployToStaging();
        break;
      case 'production':
        await this.deployToProduction();
        break;
    }
  }

  async deployToDevelopment() {
    console.log(`   🔧 Development deployment (local preview)`);
    console.log(`   📁 Build output available in: app/dist/`);
    console.log(`   🌐 Run 'npm run preview' to test the build locally`);
    console.log(`   🔗 Local preview will be available at: http://localhost:4173`);
  }

  async deployToStaging() {
    console.log(`   🔧 Staging deployment`);
    console.log(`   📁 Build output ready in: app/dist/`);
    console.log(`   🌐 Deploy the dist/ folder to your staging environment`);
    console.log(`   💡 Recommended platforms:`);
    console.log(`      - Vercel: vercel --prod`);
    console.log(`      - Netlify: netlify deploy --prod --dir=dist`);
    console.log(`      - GitHub Pages: Deploy dist/ folder`);
    console.log(`   ⚠️  Ensure environment variables are configured on the platform`);
    
    // Example deployment commands (commented out)
    // For Vercel: execSync('vercel --prod', { cwd: 'app', stdio: 'inherit' });
    // For Netlify: execSync('netlify deploy --prod --dir=dist', { cwd: 'app', stdio: 'inherit' });
  }

  async deployToProduction() {
    console.log(`   🔧 Production deployment`);
    console.log(`   📁 Build output ready in: app/dist/`);
    console.log(`   🌐 Deploy the dist/ folder to your production environment`);
    console.log(`   ⚠️  IMPORTANT: Ensure all environment variables are properly configured`);
    console.log(`   🔐 Security checklist:`);
    console.log(`      - Supabase RLS policies are enabled`);
    console.log(`      - Crossmint is configured for production`);
    console.log(`      - API keys are production-ready`);
    console.log(`      - HTTPS is enabled`);
    
    // Example deployment commands (commented out)
    // For Vercel: execSync('vercel --prod', { cwd: 'app', stdio: 'inherit' });
    // For Netlify: execSync('netlify deploy --prod --dir=dist', { cwd: 'app', stdio: 'inherit' });
  }

  async postDeployment() {
    console.log(`🔧 Running post-deployment tasks...`);
    
    // Create deployment record
    const deploymentRecord = {
      environment: this.environment,
      timestamp: new Date().toISOString(),
      version: this.getVersion(),
      buildHash: this.getBuildHash(),
      platform: 'web2',
      backend: 'supabase',
      authentication: 'crossmint-evm'
    };
    
    const deploymentsDir = path.join(process.cwd(), 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const recordFile = path.join(deploymentsDir, `${this.environment}-latest.json`);
    fs.writeFileSync(recordFile, JSON.stringify(deploymentRecord, null, 2));
    
    console.log(`   ✅ Deployment record saved: ${recordFile}`);
    
    // Display deployment summary
    this.displayDeploymentSummary(deploymentRecord);
  }

  getVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return packageJson.version;
    } catch {
      return 'unknown';
    }
  }

  getBuildHash() {
    try {
      // Simple hash based on build timestamp
      return Date.now().toString(36);
    } catch {
      return 'unknown';
    }
  }

  displayDeploymentSummary(record) {
    console.log(`\n📋 Deployment Summary:`);
    console.log(`   Environment: ${record.environment}`);
    console.log(`   Version: ${record.version}`);
    console.log(`   Build Hash: ${record.buildHash}`);
    console.log(`   Platform: ${record.platform}`);
    console.log(`   Backend: ${record.backend}`);
    console.log(`   Authentication: ${record.authentication}`);
    console.log(`   Deployed At: ${record.timestamp}`);
    console.log(`   Build Output: app/dist/`);
    
    if (this.environment === 'development') {
      console.log(`\n🔧 Next Steps:`);
      console.log(`   1. Run 'npm run preview' to test the build`);
      console.log(`   2. Check app/dist/ for build artifacts`);
      console.log(`   3. Test Supabase connection and data flow`);
    } else {
      console.log(`\n🔧 Next Steps:`);
      console.log(`   1. Upload app/dist/ to your hosting platform`);
      console.log(`   2. Configure environment variables on the platform`);
      console.log(`   3. Test the deployed application`);
      console.log(`   4. Verify Supabase connection and real-time features`);
      console.log(`   5. Test Crossmint authentication flow`);
    }
    
    console.log(`\n🔗 Useful Links:`);
    console.log(`   Supabase Dashboard: https://app.supabase.com/projects`);
    console.log(`   Crossmint Console: https://www.crossmint.com/console`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const environment = args[0];
  
  if (!environment) {
    console.error('❌ Environment required');
    console.log('Usage: node scripts/deploy-web2.js <environment>');
    console.log('Available environments: development, staging, production');
    process.exit(1);
  }
  
  try {
    const deployer = new Web2Deployer(environment);
    await deployer.deploy();
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { Web2Deployer };