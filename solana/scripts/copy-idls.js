#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the TypeScript IDL files and extract the JSON
const factoryIdlPath = path.join(__dirname, '../target/types/cryptoscore_factory.ts');
const dashboardIdlPath = path.join(__dirname, '../target/types/cryptoscore_dashboard.ts');
const marketIdlPath = path.join(__dirname, '../target/types/cryptoscore_market.ts');

// Output paths
const factoryJsonPath = path.join(__dirname, '../app/src/idl/cryptoscore_factory.json');
const dashboardJsonPath = path.join(__dirname, '../app/src/idl/cryptoscore_dashboard.json');
const marketJsonPath = path.join(__dirname, '../app/src/idl/cryptoscore_market.json');

// Program IDs from declare_id! in Rust programs
const PROGRAM_IDS = {
  factory: '93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP',
  dashboard: '95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR',
  market: '94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ',
};

// Helper function to extract and save IDL
function extractAndSaveIdl(filePath, outputPath, programName, typeName, programId) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(new RegExp(`export const IDL: ${typeName} = ({[\\s\\S]*});`));
    
    if (match) {
      const idlJson = match[1];
      // Use eval to parse the JavaScript object (safe in this controlled context)
      const idl = eval(`(${idlJson})`);
      
      // Add address at top level (required by Anchor 0.30+)
      if (!idl.address) {
        idl.address = programId;
        console.log(`  ℹ️  Added address: ${programId}`);
      }
      
      // Also add metadata with program address for compatibility
      if (!idl.metadata) {
        idl.metadata = { address: programId };
        console.log(`  ℹ️  Added metadata.address: ${programId}`);
      }
      
      fs.writeFileSync(outputPath, JSON.stringify(idl, null, 2));
      console.log(`✅ ${programName} IDL copied successfully`);
      return true;
    } else {
      console.error(`❌ Failed to extract ${programName} IDL`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${programName} IDL:`, error.message);
    return false;
  }
}

// Process all three IDLs
console.log('📦 Copying IDL files...\n');

const factorySuccess = extractAndSaveIdl(factoryIdlPath, factoryJsonPath, 'Factory', 'CryptoscoreFactory', PROGRAM_IDS.factory);
const dashboardSuccess = extractAndSaveIdl(dashboardIdlPath, dashboardJsonPath, 'Dashboard', 'CryptoscoreDashboard', PROGRAM_IDS.dashboard);
const marketSuccess = extractAndSaveIdl(marketIdlPath, marketJsonPath, 'Market', 'CryptoscoreMarket', PROGRAM_IDS.market);

console.log('\n' + '='.repeat(50));
if (factorySuccess && dashboardSuccess && marketSuccess) {
  console.log('✅ All IDL files copied successfully!');
} else {
  console.log('⚠️  Some IDL files failed to copy. Check errors above.');
}
console.log('📁 Location: app/src/idl/');
console.log('='.repeat(50));
