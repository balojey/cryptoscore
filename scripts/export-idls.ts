#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface IdlExportConfig {
  sourceDir: string;
  targetDir: string;
  programs: string[];
}

class IdlExporter {
  private config: IdlExportConfig;

  constructor(config?: Partial<IdlExportConfig>) {
    this.config = {
      sourceDir: path.join(process.cwd(), "target", "idl"),
      targetDir: path.join(process.cwd(), "app", "src", "idl"),
      programs: ["cryptoscore_factory", "cryptoscore_market", "cryptoscore_dashboard"],
      ...config
    };
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }

  private validateIdl(idlPath: string): boolean {
    try {
      const idlContent = JSON.parse(fs.readFileSync(idlPath, "utf8"));
      
      // Basic IDL validation
      const requiredFields = ["version", "name", "instructions"];
      for (const field of requiredFields) {
        if (!idlContent[field]) {
          console.error(`❌ IDL missing required field: ${field}`);
          return false;
        }
      }
      
      // Check if instructions array exists and has content
      if (!Array.isArray(idlContent.instructions)) {
        console.error(`❌ IDL instructions must be an array`);
        return false;
      }
      
      console.log(`✅ IDL validation passed: ${path.basename(idlPath)}`);
      console.log(`   Program: ${idlContent.name}`);
      console.log(`   Version: ${idlContent.version}`);
      console.log(`   Instructions: ${idlContent.instructions.length}`);
      console.log(`   Accounts: ${idlContent.accounts?.length || 0}`);
      console.log(`   Types: ${idlContent.types?.length || 0}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Invalid IDL JSON: ${error}`);
      return false;
    }
  }

  private generateTypeScriptTypes(idlPath: string, outputPath: string): void {
    try {
      const idlContent = JSON.parse(fs.readFileSync(idlPath, "utf8"));
      const programName = idlContent.name;
      
      // Generate TypeScript type definitions
      let typeContent = `// Auto-generated TypeScript types for ${programName}
// Generated at: ${new Date().toISOString()}

export interface ${this.toPascalCase(programName)}Program {
  version: "${idlContent.version}";
  name: "${programName}";
  instructions: [
`;

      // Add instruction types
      for (const instruction of idlContent.instructions || []) {
        typeContent += `    {
      name: "${instruction.name}";
      accounts: [
`;
        for (const account of instruction.accounts || []) {
          typeContent += `        {
          name: "${account.name}";
          isMut: ${account.isMut};
          isSigner: ${account.isSigner};
        },
`;
        }
        typeContent += `      ];
      args: [
`;
        for (const arg of instruction.args || []) {
          typeContent += `        {
          name: "${arg.name}";
          type: "${arg.type}";
        },
`;
        }
        typeContent += `      ];
    },
`;
      }

      typeContent += `  ];
  accounts: [
`;

      // Add account types
      for (const account of idlContent.accounts || []) {
        typeContent += `    {
      name: "${account.name}";
      type: {
        kind: "struct";
        fields: [
`;
        for (const field of account.type.fields || []) {
          typeContent += `          {
            name: "${field.name}";
            type: "${field.type}";
          },
`;
        }
        typeContent += `        ];
      };
    },
`;
      }

      typeContent += `  ];
}

export const ${this.toCamelCase(programName)}Idl: ${this.toPascalCase(programName)}Program = ${JSON.stringify(idlContent, null, 2)} as ${this.toPascalCase(programName)}Program;
`;

      fs.writeFileSync(outputPath, typeContent);
      console.log(`📝 Generated TypeScript types: ${outputPath}`);
      
    } catch (error) {
      console.error(`❌ Failed to generate TypeScript types: ${error}`);
    }
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^|_)([a-z])/g, (_, __, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private generateIndexFile(): void {
    const indexPath = path.join(this.config.targetDir, "index.ts");
    
    let indexContent = `// Auto-generated IDL exports
// Generated at: ${new Date().toISOString()}

`;

    for (const program of this.config.programs) {
      const programName = this.toPascalCase(program);
      indexContent += `export { default as ${programName}IDL } from "./${program}.json";
export * from "./${program}.types";
`;
    }

    indexContent += `
// Program ID constants
export const PROGRAM_IDS = {
`;

    for (const program of this.config.programs) {
      const constantName = program.toUpperCase().replace('CRYPTOSCORE_', '');
      indexContent += `  ${constantName}: process.env.VITE_${constantName}_PROGRAM_ID || "",
`;
    }

    indexContent += `} as const;
`;

    fs.writeFileSync(indexPath, indexContent);
    console.log(`📝 Generated index file: ${indexPath}`);
  }

  async exportIdls(): Promise<void> {
    console.log("📄 Exporting IDL files for frontend integration...\n");

    // Ensure target directory exists
    this.ensureDirectoryExists(this.config.targetDir);

    let allValid = true;

    for (const program of this.config.programs) {
      const sourceFile = `${program}.json`;
      const sourcePath = path.join(this.config.sourceDir, sourceFile);
      const targetPath = path.join(this.config.targetDir, sourceFile);
      const typesPath = path.join(this.config.targetDir, `${program}.types.ts`);

      console.log(`🔄 Processing ${program}...`);

      // Check if source IDL exists
      if (!fs.existsSync(sourcePath)) {
        console.error(`❌ Source IDL not found: ${sourcePath}`);
        allValid = false;
        continue;
      }

      // Validate IDL
      if (!this.validateIdl(sourcePath)) {
        allValid = false;
        continue;
      }

      // Copy IDL file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied IDL: ${sourceFile}`);

      // Generate TypeScript types
      this.generateTypeScriptTypes(sourcePath, typesPath);

      console.log();
    }

    if (allValid) {
      // Generate index file
      this.generateIndexFile();
      
      console.log("🎉 IDL export completed successfully!");
      console.log(`📁 IDL files exported to: ${this.config.targetDir}`);
      console.log("\n💡 Next steps:");
      console.log("   1. Import IDLs in your frontend code:");
      console.log("      import { FactoryIDL, MarketIDL, DashboardIDL } from './idl'");
      console.log("   2. Use with Anchor Program:");
      console.log("      const program = new Program(FactoryIDL, programId, provider)");
    } else {
      throw new Error("IDL export failed due to validation errors");
    }
  }

  async buildAndExport(): Promise<void> {
    console.log("🔨 Building programs before IDL export...\n");
    
    try {
      execSync("anchor build", { 
        stdio: "inherit",
        cwd: process.cwd()
      });
      
      console.log("\n✅ Build completed, proceeding with IDL export...\n");
      await this.exportIdls();
    } catch (error) {
      console.error("❌ Build failed:", error);
      throw error;
    }
  }

  listIdls(): void {
    console.log("📋 Available IDL files:\n");
    
    if (!fs.existsSync(this.config.sourceDir)) {
      console.log("❌ IDL source directory not found. Run 'anchor build' first.");
      return;
    }

    const files = fs.readdirSync(this.config.sourceDir);
    const idlFiles = files.filter(f => f.endsWith('.json'));

    if (idlFiles.length === 0) {
      console.log("❌ No IDL files found. Run 'anchor build' first.");
      return;
    }

    for (const file of idlFiles) {
      const filePath = path.join(this.config.sourceDir, file);
      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024).toFixed(1);
      
      console.log(`📄 ${file}`);
      console.log(`   Size: ${size} KB`);
      console.log(`   Modified: ${stats.mtime.toISOString()}`);
      
      // Try to read program info
      try {
        const idl = JSON.parse(fs.readFileSync(filePath, "utf8"));
        console.log(`   Program: ${idl.name}`);
        console.log(`   Version: ${idl.version}`);
        console.log(`   Instructions: ${idl.instructions?.length || 0}`);
      } catch {
        console.log(`   Status: Invalid JSON`);
      }
      
      console.log();
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "export";
  
  const exporter = new IdlExporter();
  
  try {
    switch (command) {
      case "export":
        await exporter.exportIdls();
        break;
        
      case "build":
        await exporter.buildAndExport();
        break;
        
      case "list":
        exporter.listIdls();
        break;
        
      default:
        console.log("📄 IDL Exporter\n");
        console.log("Usage:");
        console.log("  export-idls export    - Export IDL files to frontend");
        console.log("  export-idls build     - Build programs and export IDLs");
        console.log("  export-idls list      - List available IDL files");
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

export { IdlExporter };