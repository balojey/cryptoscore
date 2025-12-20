#!/usr/bin/env node

/**
 * Database Seeding Script for CryptoScore Web2
 * Seeds the database with test data for development
 */

const fs = require('fs');
const path = require('path');

class DatabaseSeeder {
  constructor() {
    this.seedData = {
      users: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          wallet_address: '0x1234567890123456789012345678901234567890',
          email: 'alice@example.com',
          display_name: 'Alice Johnson'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          wallet_address: '0x2345678901234567890123456789012345678901',
          email: 'bob@example.com',
          display_name: 'Bob Smith'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          wallet_address: '0x3456789012345678901234567890123456789012',
          email: 'charlie@example.com',
          display_name: 'Charlie Brown'
        }
      ],
      markets: [
        {
          id: '660e8400-e29b-41d4-a716-446655440001',
          creator_id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Premier League: Manchester City vs Arsenal',
          description: 'Who will win the Premier League match between Manchester City and Arsenal?',
          entry_fee: 10.0,
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          status: 'active',
          total_pool: 0,
          platform_fee_percentage: 5.0
        },
        {
          id: '660e8400-e29b-41d4-a716-446655440002',
          creator_id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'NBA Finals: Lakers vs Celtics',
          description: 'Predict the winner of the NBA Finals game between Lakers and Celtics',
          entry_fee: 25.0,
          end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          status: 'active',
          total_pool: 0,
          platform_fee_percentage: 5.0
        }
      ],
      platform_config: [
        {
          key: 'platform_fee_percentage',
          value: { percentage: 5.0, max_percentage: 10.0 }
        },
        {
          key: 'min_market_duration',
          value: { hours: 1 }
        },
        {
          key: 'max_market_duration',
          value: { days: 30 }
        }
      ]
    };
  }

  async seed() {
    console.log('🌱 Seeding database with test data...');
    
    try {
      // Step 1: Generate seed SQL
      await this.generateSeedSQL();
      
      // Step 2: Display seeding instructions
      await this.displayInstructions();
      
      console.log('✅ Seed data generated successfully!');
      
    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
      process.exit(1);
    }
  }

  async generateSeedSQL() {
    console.log('📝 Generating seed SQL...');
    
    const seedDir = path.join(process.cwd(), 'app', 'supabase', 'seed');
    if (!fs.existsSync(seedDir)) {
      fs.mkdirSync(seedDir, { recursive: true });
    }
    
    let sql = `-- CryptoScore Web2 Seed Data
-- Generated at: ${new Date().toISOString()}
-- This file contains test data for development

-- Clear existing data (be careful in production!)
DELETE FROM transactions;
DELETE FROM participants;
DELETE FROM markets;
DELETE FROM users;
DELETE FROM platform_config;

-- Insert test users
`;
    
    // Generate users
    this.seedData.users.forEach(user => {
      sql += `INSERT INTO users (id, wallet_address, email, display_name, created_at, updated_at) VALUES (
  '${user.id}',
  '${user.wallet_address}',
  '${user.email}',
  '${user.display_name}',
  NOW(),
  NOW()
);
`;
    });
    
    sql += `\n-- Insert test markets\n`;
    
    // Generate markets
    this.seedData.markets.forEach(market => {
      sql += `INSERT INTO markets (id, creator_id, title, description, entry_fee, end_time, status, total_pool, platform_fee_percentage, created_at, updated_at) VALUES (
  '${market.id}',
  '${market.creator_id}',
  '${market.title}',
  '${market.description}',
  ${market.entry_fee},
  '${market.end_time}',
  '${market.status}',
  ${market.total_pool},
  ${market.platform_fee_percentage},
  NOW(),
  NOW()
);
`;
    });
    
    sql += `\n-- Insert platform configuration\n`;
    
    // Generate platform config
    this.seedData.platform_config.forEach(config => {
      sql += `INSERT INTO platform_config (key, value, updated_at) VALUES (
  '${config.key}',
  '${JSON.stringify(config.value)}'::jsonb,
  NOW()
);
`;
    });
    
    sql += `\n-- Add some sample participants
INSERT INTO participants (id, market_id, user_id, prediction, entry_amount, potential_winnings, joined_at) VALUES (
  gen_random_uuid(),
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  'Manchester City',
  10.0,
  19.0,
  NOW()
);

INSERT INTO participants (id, market_id, user_id, prediction, entry_amount, potential_winnings, joined_at) VALUES (
  gen_random_uuid(),
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440003',
  'Arsenal',
  10.0,
  19.0,
  NOW()
);

-- Update market total pools
UPDATE markets SET total_pool = 20.0 WHERE id = '660e8400-e29b-41d4-a716-446655440001';

-- Add some transaction history
INSERT INTO transactions (id, user_id, market_id, type, amount, description, created_at) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440002',
  '660e8400-e29b-41d4-a716-446655440001',
  'market_entry',
  10.0,
  'Joined market: Premier League: Manchester City vs Arsenal',
  NOW()
);

INSERT INTO transactions (id, user_id, market_id, type, amount, description, created_at) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440003',
  '660e8400-e29b-41d4-a716-446655440001',
  'market_entry',
  10.0,
  'Joined market: Premier League: Manchester City vs Arsenal',
  NOW()
);

-- Verify data
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Markets' as table_name, COUNT(*) as count FROM markets
UNION ALL
SELECT 'Participants' as table_name, COUNT(*) as count FROM participants
UNION ALL
SELECT 'Transactions' as table_name, COUNT(*) as count FROM transactions
UNION ALL
SELECT 'Platform Config' as table_name, COUNT(*) as count FROM platform_config;
`;
    
    const seedFile = path.join(seedDir, 'seed.sql');
    fs.writeFileSync(seedFile, sql);
    
    console.log(`   ✅ Seed SQL generated: ${seedFile}`);
  }

  async displayInstructions() {
    console.log('\n📋 Seeding Instructions:');
    console.log('To seed your Supabase database with test data:');
    console.log('');
    console.log('1. 🌐 Go to your Supabase project dashboard');
    console.log('2. 📊 Navigate to the SQL Editor');
    console.log('3. 📁 Copy and paste the contents of the seed file:');
    console.log(`      ${path.join(process.cwd(), 'app', 'supabase', 'seed', 'seed.sql')}`);
    console.log('4. ▶️  Run the SQL script');
    console.log('5. ✅ Verify that test data was inserted correctly');
    console.log('');
    console.log('🧪 Test Data Includes:');
    console.log(`   - ${this.seedData.users.length} test users with EVM wallet addresses`);
    console.log(`   - ${this.seedData.markets.length} sample prediction markets`);
    console.log('   - Sample participants and transactions');
    console.log('   - Platform configuration settings');
    console.log('');
    console.log('⚠️  Warning: This will delete existing data! Only use in development.');
    console.log('');
    console.log('🔗 Supabase Dashboard: https://app.supabase.com/projects');
  }
}

// CLI interface
async function main() {
  try {
    const seeder = new DatabaseSeeder();
    await seeder.seed();
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { DatabaseSeeder };