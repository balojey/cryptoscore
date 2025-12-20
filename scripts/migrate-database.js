#!/usr/bin/env node

/**
 * Database Migration Script for CryptoScore Web2
 * Handles database schema migrations and updates
 */

const fs = require('fs');
const path = require('path');

class DatabaseMigrator {
  constructor() {
    this.migrationDir = path.join(process.cwd(), 'app', 'supabase', 'migrations');
  }

  async migrate() {
    console.log('🔄 Running database migrations...');
    
    try {
      // Step 1: Validate migration files
      await this.validateMigrations();
      
      // Step 2: Display migration instructions
      await this.displayInstructions();
      
      console.log('✅ Migration instructions provided!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }

  async validateMigrations() {
    console.log('🔍 Validating migration files...');
    
    if (!fs.existsSync(this.migrationDir)) {
      throw new Error(`Migration directory not found: ${this.migrationDir}`);
    }
    
    const migrationFiles = fs.readdirSync(this.migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      throw new Error('No migration files found');
    }
    
    console.log(`   ✅ Found ${migrationFiles.length} migration file(s):`);
    migrationFiles.forEach(file => {
      console.log(`      - ${file}`);
    });
  }

  async displayInstructions() {
    console.log('\n📋 Migration Instructions:');
    console.log('Since we\'re using Supabase, migrations need to be run through the Supabase dashboard:');
    console.log('');
    console.log('1. 🌐 Go to your Supabase project dashboard');
    console.log('2. 📊 Navigate to the SQL Editor');
    console.log('3. 📁 Run each migration file in order:');
    
    const migrationFiles = fs.readdirSync(this.migrationDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    migrationFiles.forEach((file, index) => {
      const filePath = path.join(this.migrationDir, file);
      console.log(`\n   ${index + 1}. Run migration: ${file}`);
      console.log(`      File location: ${filePath}`);
      
      // Show first few lines of the migration
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').slice(0, 3);
        console.log('      Preview:');
        lines.forEach(line => {
          if (line.trim()) {
            console.log(`        ${line.trim()}`);
          }
        });
        if (content.split('\n').length > 3) {
          console.log('        ...');
        }
      } catch (error) {
        console.log('      (Could not read file)');
      }
    });
    
    console.log('\n4. ✅ Verify that all tables and indexes were created successfully');
    console.log('5. 🔐 Configure Row Level Security (RLS) policies if needed');
    console.log('');
    console.log('💡 Alternative: Use Supabase CLI for automated migrations:');
    console.log('   supabase db push');
    console.log('');
    console.log('🔗 Supabase Dashboard: https://app.supabase.com/projects');
  }
}

// CLI interface
async function main() {
  try {
    const migrator = new DatabaseMigrator();
    await migrator.migrate();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DatabaseMigrator };