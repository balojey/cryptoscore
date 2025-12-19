#!/usr/bin/env node

/**
 * Script to push database schema to Supabase
 * Usage: node app/scripts/push-schema.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zqkozbrijpkmgwhcbgrb.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hSiR0dT-PSTI5cw0zHi9jg_-NbgVWK-';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function pushSchema() {
  try {
    console.log('📦 Reading schema file...');
    const schemaPath = join(__dirname, '..', 'supabase', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    console.log('🚀 Pushing schema to Supabase...');
    console.log('⚠️  Note: This requires service role key for full schema operations');
    console.log('');
    console.log('Please follow these steps instead:');
    console.log('');
    console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Click "New query"');
    console.log('4. Copy the contents of app/supabase/schema.sql');
    console.log('5. Paste into the SQL editor');
    console.log('6. Click "Run" to execute');
    console.log('');
    console.log('Alternatively, use the Supabase CLI with proper credentials:');
    console.log('');
    console.log('  npx supabase link --project-ref zqkozbrijpkmgwhcbgrb');
    console.log('  npx supabase db push');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

pushSchema();
