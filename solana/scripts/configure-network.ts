#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";

interface NetworkConfig {
  name: string;
  cluster: string;
  rpcUrl: string;
  walletPath: string;
  programIds: {
    factory: string;
    market: string;
    dashboard: string;
  };
}

interface AnchorConfig {
  toolchain?: any;
  features?: any;
  programs: Record<string, Record<string, string>>;
  registry?: any;
  provider: {
    cluster: string;
    wallet: string;
  };
  scripts?: any;
  test?: any;
}

class NetworkConfigurator {
  private configPath: string;
  private backupPath: string;

  constructor() {
    this.configPath = path.join(process.cwd(), "Anchor.toml");
    this.backupPath = path.join(process.cwd(), "Anchor.toml.backup");
  }

  private parseToml(content: string): AnchorConfig {
    // Simple TOML parser for our specific needs
    const lines = content.split('\n');
    const config: AnchorConfig = {
      programs: {},
      provider: { cluster: "", wallet: "" }
    };

    let currentSection = "";
    let currentProgramSection = "";

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const section = trimmed.slice(1, -1);
        
        if (section.startsWith('programs.')) {
          currentProgramSection = section.split('.')[1];
          currentSection = "programs";
          if (!config.programs[currentProgramSection]) {
            config.programs[currentProgramSection] = {};
          }
        } else {
          currentSection = section;
          currentProgramSection = "";
        }
      } else if (trimmed.includes('=') && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim().replace(/"/g, '');
        
        if (currentSection === "programs" && currentProgramSection) {
          config.programs[currentProgramSection][key.trim()] = value;
        } else if (currentSection === "provider") {
          (config.provider as any)[key.trim()] = value;
        }
      }
    }

    return config;
  }

  private generateToml(config: AnchorConfig): string {
    let toml = `[toolchain]

[features]
resolution = true
skip-lint = false

`;

    // Programs section
    for (const [network, programs] of Object.entries(config.programs)) {
      toml += `[programs.${network}]\n`;
      for (const [program, id] of Object.entries(programs)) {
        toml += `${program} = "${id}"\n`;
      }
      toml += '\n';
    }

    // Registry section
    toml += `[registry]
url = "https://api.apr.dev"

`;

    // Provider section
    toml += `[provider]
cluster = "${config.provider.cluster}"
wallet = "${config.provider.wallet}"

`;

    // Scripts section
    toml += `[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

`;

    // Test section
    toml += `[test]
startup_wait = 5000
shutdown_wait = 2000
upgradeable = false

[test.validator]
url = "http://127.0.0.1:8899"
ledger = ".anchor/test-ledger"
reset = true
verifyFees = false
bind_address = "127.0.0.1"
rpc_port = 8899
faucet_port = 9900
slots_per_epoch = "32"
`;

    return toml;
  }

  private getNetworkConfigs(): Record<string, NetworkConfig> {
    return {
      localnet: {
        name: "localnet",
        cluster: "localnet",
        rpcUrl: "http://127.0.0.1:8899",
        walletPath: "~/.config/solana/id.json",
        programIds: {
          factory: "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP",
          market: "94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ",
          dashboard: "95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR"
        }
      },
      devnet: {
        name: "devnet",
        cluster: "devnet",
        rpcUrl: "https://api.devnet.solana.com",
        walletPath: "~/.config/solana/id.json",
        programIds: {
          factory: "93CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhP",
          market: "94CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhQ",
          dashboard: "95CjfuYYswDbcjasA1PTUmHhsqFsBQC4JnsiKB8nKJhR"
        }
      },
      testnet: {
        name: "testnet",
        cluster: "testnet",
        rpcUrl: "https://api.testnet.solana.com",
        walletPath: "~/.config/solana/id.json",
        programIds: {
          factory: "TestnetFactoryId1111111111111111111111111",
          market: "TestnetMarketId11111111111111111111111111",
          dashboard: "TestnetDashboardId111111111111111111111111"
        }
      },
      "mainnet-beta": {
        name: "mainnet-beta",
        cluster: "mainnet-beta",
        rpcUrl: "https://api.mainnet-beta.solana.com",
        walletPath: "~/.config/solana/mainnet-wallet.json",
        programIds: {
          factory: "MainnetFactoryId111111111111111111111111",
          market: "MainnetMarketId1111111111111111111111111",
          dashboard: "MainnetDashboardId11111111111111111111111"
        }
      }
    };
  }

  private createBackup(): void {
    if (fs.existsSync(this.configPath)) {
      fs.copyFileSync(this.configPath, this.backupPath);
      console.log(`📋 Backup created: ${this.backupPath}`);
    }
  }

  private restoreBackup(): void {
    if (fs.existsSync(this.backupPath)) {
      fs.copyFileSync(this.backupPath, this.configPath);
      console.log(`🔄 Configuration restored from backup`);
    }
  }

  async configure(networkName: string): Promise<void> {
    const networks = this.getNetworkConfigs();
    const network = networks[networkName];
    
    if (!network) {
      throw new Error(`Unknown network: ${networkName}. Available: ${Object.keys(networks).join(", ")}`);
    }

    console.log(`🔧 Configuring for ${network.name} network...`);

    // Create backup
    this.createBackup();

    try {
      // Read current config
      let currentConfig: AnchorConfig;
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, "utf8");
        currentConfig = this.parseToml(content);
      } else {
        currentConfig = {
          programs: {},
          provider: { cluster: "", wallet: "" }
        };
      }

      // Update configuration
      currentConfig.provider.cluster = network.cluster;
      currentConfig.provider.wallet = network.walletPath;

      // Update program IDs for the target network
      currentConfig.programs[network.name] = {
        cryptoscore_factory: network.programIds.factory,
        cryptoscore_market: network.programIds.market,
        cryptoscore_dashboard: network.programIds.dashboard
      };

      // Generate and write new config
      const newToml = this.generateToml(currentConfig);
      fs.writeFileSync(this.configPath, newToml);

      console.log(`✅ Anchor.toml configured for ${network.name}`);
      console.log(`   Cluster: ${network.cluster}`);
      console.log(`   RPC URL: ${network.rpcUrl}`);
      console.log(`   Wallet: ${network.walletPath}`);
      console.log(`   Factory Program: ${network.programIds.factory}`);
      console.log(`   Market Program: ${network.programIds.market}`);
      console.log(`   Dashboard Program: ${network.programIds.dashboard}`);

    } catch (error) {
      console.error(`❌ Configuration failed: ${error}`);
      this.restoreBackup();
      throw error;
    }
  }

  async generateEnvFile(networkName: string): Promise<void> {
    const networks = this.getNetworkConfigs();
    const network = networks[networkName];
    
    if (!network) {
      throw new Error(`Unknown network: ${networkName}`);
    }

    const envContent = `# Solana Network Configuration for ${network.name}
# Generated at: ${new Date().toISOString()}

# Network Settings
SOLANA_NETWORK=${network.name}
ANCHOR_PROVIDER_URL=${network.rpcUrl}
ANCHOR_WALLET=${network.walletPath}

# Program IDs
FACTORY_PROGRAM_ID=${network.programIds.factory}
MARKET_PROGRAM_ID=${network.programIds.market}
DASHBOARD_PROGRAM_ID=${network.programIds.dashboard}

# Frontend Environment Variables (copy to app/.env)
VITE_SOLANA_NETWORK=${network.name}
VITE_SOLANA_RPC_URL=${network.rpcUrl}
VITE_FACTORY_PROGRAM_ID=${network.programIds.factory}
VITE_MARKET_PROGRAM_ID=${network.programIds.market}
VITE_DASHBOARD_PROGRAM_ID=${network.programIds.dashboard}
`;

    const envPath = path.join(process.cwd(), `.env.${network.name}`);
    fs.writeFileSync(envPath, envContent);
    
    console.log(`📄 Environment file created: .env.${network.name}`);
  }

  listNetworks(): void {
    const networks = this.getNetworkConfigs();
    
    console.log("🌐 Available Networks:\n");
    
    for (const [name, config] of Object.entries(networks)) {
      console.log(`📍 ${name.toUpperCase()}`);
      console.log(`   Cluster: ${config.cluster}`);
      console.log(`   RPC URL: ${config.rpcUrl}`);
      console.log(`   Wallet: ${config.walletPath}`);
      console.log(`   Programs:`);
      console.log(`     Factory: ${config.programIds.factory}`);
      console.log(`     Market: ${config.programIds.market}`);
      console.log(`     Dashboard: ${config.programIds.dashboard}`);
      console.log();
    }
  }

  getCurrentNetwork(): string | null {
    if (!fs.existsSync(this.configPath)) {
      return null;
    }

    const content = fs.readFileSync(this.configPath, "utf8");
    const config = this.parseToml(content);
    
    return config.provider.cluster || null;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const network = args[1];

  const configurator = new NetworkConfigurator();

  try {
    switch (command) {
      case "set":
        if (!network) {
          console.error("❌ Network name required");
          console.log("Usage: configure-network set <network>");
          process.exit(1);
        }
        await configurator.configure(network);
        await configurator.generateEnvFile(network);
        break;

      case "list":
        configurator.listNetworks();
        break;

      case "current":
        const current = configurator.getCurrentNetwork();
        if (current) {
          console.log(`Current network: ${current}`);
        } else {
          console.log("No network configured");
        }
        break;

      case "env":
        if (!network) {
          console.error("❌ Network name required");
          console.log("Usage: configure-network env <network>");
          process.exit(1);
        }
        await configurator.generateEnvFile(network);
        break;

      default:
        console.log("🔧 Solana Network Configurator\n");
        console.log("Usage:");
        console.log("  configure-network set <network>    - Configure Anchor.toml for network");
        console.log("  configure-network list             - List available networks");
        console.log("  configure-network current          - Show current network");
        console.log("  configure-network env <network>    - Generate .env file for network");
        console.log("\nAvailable networks: localnet, devnet, testnet, mainnet-beta");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { NetworkConfigurator };