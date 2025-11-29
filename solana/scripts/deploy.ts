#!/usr/bin/env ts-node

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";

// Import IDL types (these will be generated after build)
type FactoryProgram = any;
type MarketProgram = any;
type DashboardProgram = any;

interface DeploymentConfig {
  network: "localnet" | "devnet" | "testnet" | "mainnet-beta";
  rpcUrl: string;
  walletPath: string;
  programIds: {
    factory: string;
    market: string;
    dashboard: string;
  };
}

interface DeploymentResult {
  network: string;
  programIds: {
    factory: string;
    market: string;
    dashboard: string;
  };
  deployedAt: string;
  txSignatures: {
    factory?: string;
    market?: string;
    dashboard?: string;
  };
}

class ProgramDeployer {
  private connection: Connection;
  private wallet: anchor.Wallet;
  private provider: anchor.AnchorProvider;
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, "confirmed");
    
    // Load wallet keypair
    const walletKeypair = this.loadWallet(config.walletPath);
    this.wallet = new anchor.Wallet(walletKeypair);
    
    // Set up provider
    this.provider = new anchor.AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: "confirmed" }
    );
    anchor.setProvider(this.provider);
  }

  private loadWallet(walletPath: string): Keypair {
    try {
      // Expand tilde to home directory
      const expandedPath = walletPath.replace(/^~/, process.env.HOME || '');
      const walletData = JSON.parse(fs.readFileSync(expandedPath, "utf8"));
      return Keypair.fromSecretKey(new Uint8Array(walletData));
    } catch (error) {
      throw new Error(`Failed to load wallet from ${walletPath}: ${error}`);
    }
  }

  private async verifyBuild(): Promise<boolean> {
    console.log("🔍 Verifying program builds...");
    
    const requiredFiles = [
      "target/deploy/cryptoscore_factory.so",
      "target/deploy/cryptoscore_market.so", 
      "target/deploy/cryptoscore_dashboard.so",
      "target/idl/cryptoscore_factory.json",
      "target/idl/cryptoscore_market.json",
      "target/idl/cryptoscore_dashboard.json"
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Missing required file: ${file}`);
        return false;
      }
    }

    console.log("✅ All required build artifacts found");
    return true;
  }

  private async checkWalletBalance(): Promise<void> {
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    const solBalance = balance / anchor.web3.LAMPORTS_PER_SOL;
    
    console.log(`💰 Wallet balance: ${solBalance} SOL`);
    
    if (solBalance < 0.1) {
      throw new Error("Insufficient SOL balance for deployment. Need at least 0.1 SOL");
    }
  }

  private async deployProgram(
    programName: string,
    programId: string
  ): Promise<string | null> {
    try {
      console.log(`🚀 Deploying ${programName} program...`);
      console.log(`   Program ID: ${programId}`);
      
      // Use anchor deploy command for the specific program
      const { execSync } = require("child_process");
      
      const deployCommand = `anchor deploy --program-name ${programName.toLowerCase()} --provider.cluster ${this.config.network}`;
      
      console.log(`   Running: ${deployCommand}`);
      const output = execSync(deployCommand, { 
        encoding: "utf8",
        cwd: process.cwd()
      });
      
      console.log(`✅ ${programName} deployed successfully`);
      
      // Extract transaction signature from output if available
      const txMatch = output.match(/Transaction signature: ([A-Za-z0-9]+)/);
      return txMatch ? txMatch[1] : null;
      
    } catch (error) {
      console.error(`❌ Failed to deploy ${programName}:`, error);
      throw error;
    }
  }

  private async exportIdlFiles(): Promise<void> {
    console.log("📄 Exporting IDL files for frontend integration...");
    
    const idlDir = path.join(process.cwd(), "app", "src", "idl");
    
    // Create IDL directory if it doesn't exist
    if (!fs.existsSync(idlDir)) {
      fs.mkdirSync(idlDir, { recursive: true });
    }

    const programs = ["factory", "market", "dashboard"];
    
    for (const program of programs) {
      const sourcePath = path.join(process.cwd(), "target", "idl", `cryptoscore_${program}.json`);
      const destPath = path.join(idlDir, `cryptoscore_${program}.json`);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`   ✅ Exported ${program} IDL to app/src/idl/`);
      } else {
        console.warn(`   ⚠️  IDL file not found: ${sourcePath}`);
      }
    }
  }

  private async updateFrontendConfig(result: DeploymentResult): Promise<void> {
    console.log("🔧 Updating frontend configuration...");
    
    const configPath = path.join(process.cwd(), "app", "src", "config", "programs.ts");
    
    const configContent = `// Auto-generated program configuration
// Generated at: ${result.deployedAt}
// Network: ${result.network}

export const PROGRAM_IDS = {
  factory: "${result.programIds.factory}",
  market: "${result.programIds.market}",
  dashboard: "${result.programIds.dashboard}",
} as const;

export const NETWORK = "${result.network}";

export const RPC_URL = "${this.config.rpcUrl}";

// Program IDLs
export { default as FactoryIDL } from "../idl/cryptoscore_factory.json";
export { default as MarketIDL } from "../idl/cryptoscore_market.json";
export { default as DashboardIDL } from "../idl/cryptoscore_dashboard.json";
`;

    // Ensure config directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, configContent);
    console.log("   ✅ Frontend configuration updated");
  }

  private saveDeploymentResult(result: DeploymentResult): void {
    const resultsDir = path.join(process.cwd(), "deployments");
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `${result.network}-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
    console.log(`📝 Deployment result saved to: ${filepath}`);
  }

  async deploy(): Promise<DeploymentResult> {
    console.log(`🚀 Starting deployment to ${this.config.network}...`);
    console.log(`   RPC URL: ${this.config.rpcUrl}`);
    console.log(`   Wallet: ${this.wallet.publicKey.toString()}`);
    
    // Pre-deployment checks
    if (!(await this.verifyBuild())) {
      throw new Error("Build verification failed");
    }
    
    await this.checkWalletBalance();
    
    const result: DeploymentResult = {
      network: this.config.network,
      programIds: this.config.programIds,
      deployedAt: new Date().toISOString(),
      txSignatures: {}
    };

    try {
      // Deploy programs in order: Factory -> Market -> Dashboard
      result.txSignatures.factory = await this.deployProgram(
        "cryptoscore_factory",
        this.config.programIds.factory
      );

      result.txSignatures.market = await this.deployProgram(
        "cryptoscore_market", 
        this.config.programIds.market
      );

      result.txSignatures.dashboard = await this.deployProgram(
        "cryptoscore_dashboard",
        this.config.programIds.dashboard
      );

      // Post-deployment tasks
      await this.exportIdlFiles();
      await this.updateFrontendConfig(result);
      this.saveDeploymentResult(result);

      console.log("🎉 Deployment completed successfully!");
      console.log("\n📋 Deployment Summary:");
      console.log(`   Network: ${result.network}`);
      console.log(`   Factory Program: ${result.programIds.factory}`);
      console.log(`   Market Program: ${result.programIds.market}`);
      console.log(`   Dashboard Program: ${result.programIds.dashboard}`);
      
      if (result.txSignatures.factory) {
        console.log(`   Factory TX: ${result.txSignatures.factory}`);
      }
      if (result.txSignatures.market) {
        console.log(`   Market TX: ${result.txSignatures.market}`);
      }
      if (result.txSignatures.dashboard) {
        console.log(`   Dashboard TX: ${result.txSignatures.dashboard}`);
      }

      return result;

    } catch (error) {
      console.error("❌ Deployment failed:", error);
      throw error;
    }
  }
}

// Network configurations
const NETWORK_CONFIGS: Record<string, DeploymentConfig> = {
  localnet: {
    network: "localnet",
    rpcUrl: "http://127.0.0.1:8899",
    walletPath: "~/.config/solana/id.json",
    programIds: {
      factory: "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP",
      market: "94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ", 
      dashboard: "95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR"
    }
  },
  devnet: {
    network: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
    walletPath: "~/.config/solana/id.json",
    programIds: {
      factory: "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP",
      market: "94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ",
      dashboard: "95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR"
    }
  },
  testnet: {
    network: "testnet", 
    rpcUrl: "https://api.testnet.solana.com",
    walletPath: "~/.config/solana/id.json",
    programIds: {
      factory: "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP",
      market: "94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ",
      dashboard: "95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR"
    }
  },
  "mainnet-beta": {
    network: "mainnet-beta",
    rpcUrl: "https://api.mainnet-beta.solana.com", 
    walletPath: "~/.config/solana/mainnet-wallet.json",
    programIds: {
      factory: "MainnetFactoryId111111111111111111111111",
      market: "MainnetMarketId1111111111111111111111111",
      dashboard: "MainnetDashboardId11111111111111111111111"
    }
  }
};

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const network = args[0] || "devnet";
  
  if (!NETWORK_CONFIGS[network]) {
    console.error(`❌ Unknown network: ${network}`);
    console.log("Available networks:", Object.keys(NETWORK_CONFIGS).join(", "));
    process.exit(1);
  }

  try {
    const config = NETWORK_CONFIGS[network];
    const deployer = new ProgramDeployer(config);
    await deployer.deploy();
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ProgramDeployer, NETWORK_CONFIGS };
export type { DeploymentConfig, DeploymentResult };