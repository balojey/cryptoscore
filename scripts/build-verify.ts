#!/usr/bin/env ts-node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface BuildArtifact {
  name: string;
  path: string;
  required: boolean;
  type: "binary" | "idl" | "keypair";
}

class BuildVerifier {
  private artifacts: BuildArtifact[] = [
    // Program binaries
    { name: "Factory Program", path: "target/deploy/cryptoscore_factory.so", required: true, type: "binary" },
    { name: "Market Program", path: "target/deploy/cryptoscore_market.so", required: true, type: "binary" },
    { name: "Dashboard Program", path: "target/deploy/cryptoscore_dashboard.so", required: true, type: "binary" },
    
    // IDL files
    { name: "Factory IDL", path: "target/idl/cryptoscore_factory.json", required: true, type: "idl" },
    { name: "Market IDL", path: "target/idl/cryptoscore_market.json", required: true, type: "idl" },
    { name: "Dashboard IDL", path: "target/idl/cryptoscore_dashboard.json", required: true, type: "idl" },
    
    // Program keypairs
    { name: "Factory Keypair", path: "target/deploy/cryptoscore_factory-keypair.json", required: true, type: "keypair" },
    { name: "Market Keypair", path: "target/deploy/cryptoscore_market-keypair.json", required: true, type: "keypair" },
    { name: "Dashboard Keypair", path: "target/deploy/cryptoscore_dashboard-keypair.json", required: true, type: "keypair" }
  ];

  private checkFileExists(artifact: BuildArtifact): boolean {
    const fullPath = path.join(process.cwd(), artifact.path);
    return fs.existsSync(fullPath);
  }

  private getFileSize(artifact: BuildArtifact): number {
    const fullPath = path.join(process.cwd(), artifact.path);
    try {
      const stats = fs.statSync(fullPath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  private validateIdl(artifact: BuildArtifact): boolean {
    if (artifact.type !== "idl") return true;
    
    try {
      const fullPath = path.join(process.cwd(), artifact.path);
      const idlContent = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      
      // Basic IDL validation
      const requiredFields = ["version", "name", "instructions", "accounts"];
      for (const field of requiredFields) {
        if (!idlContent[field]) {
          console.error(`   ❌ IDL missing required field: ${field}`);
          return false;
        }
      }
      
      // Check if instructions array is not empty
      if (!Array.isArray(idlContent.instructions) || idlContent.instructions.length === 0) {
        console.error(`   ❌ IDL has no instructions defined`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error(`   ❌ Invalid IDL JSON: ${error}`);
      return false;
    }
  }

  private validateKeypair(artifact: BuildArtifact): boolean {
    if (artifact.type !== "keypair") return true;
    
    try {
      const fullPath = path.join(process.cwd(), artifact.path);
      const keypairData = JSON.parse(fs.readFileSync(fullPath, "utf8"));
      
      // Validate keypair format
      if (!Array.isArray(keypairData) || keypairData.length !== 64) {
        console.error(`   ❌ Invalid keypair format (expected 64-byte array)`);
        return false;
      }
      
      // Validate all elements are numbers in valid range
      for (let i = 0; i < keypairData.length; i++) {
        if (typeof keypairData[i] !== "number" || keypairData[i] < 0 || keypairData[i] > 255) {
          console.error(`   ❌ Invalid byte at position ${i}: ${keypairData[i]}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error(`   ❌ Invalid keypair JSON: ${error}`);
      return false;
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  private checkAnchorVersion(): string {
    try {
      const output = execSync("anchor --version", { encoding: "utf8" });
      return output.trim();
    } catch {
      return "Not installed";
    }
  }

  private checkSolanaVersion(): string {
    try {
      const output = execSync("solana --version", { encoding: "utf8" });
      return output.trim();
    } catch {
      return "Not installed";
    }
  }

  private checkRustVersion(): string {
    try {
      const output = execSync("rustc --version", { encoding: "utf8" });
      return output.trim();
    } catch {
      return "Not installed";
    }
  }

  async verify(): Promise<boolean> {
    console.log("🔍 Verifying build artifacts...\n");
    
    // Check tool versions
    console.log("📋 Tool Versions:");
    console.log(`   Anchor: ${this.checkAnchorVersion()}`);
    console.log(`   Solana: ${this.checkSolanaVersion()}`);
    console.log(`   Rust: ${this.checkRustVersion()}`);
    console.log();

    let allValid = true;
    const results: Array<{ artifact: BuildArtifact; exists: boolean; valid: boolean; size: number }> = [];

    // Check each artifact
    for (const artifact of this.artifacts) {
      const exists = this.checkFileExists(artifact);
      const size = exists ? this.getFileSize(artifact) : 0;
      let valid = exists;

      if (exists) {
        // Perform type-specific validation
        switch (artifact.type) {
          case "idl":
            valid = this.validateIdl(artifact);
            break;
          case "keypair":
            valid = this.validateKeypair(artifact);
            break;
          case "binary":
            // For binaries, just check they're not empty
            valid = size > 0;
            break;
        }
      }

      results.push({ artifact, exists, valid, size });

      if (artifact.required && (!exists || !valid)) {
        allValid = false;
      }
    }

    // Display results
    console.log("📁 Build Artifacts:");
    for (const result of results) {
      const { artifact, exists, valid, size } = result;
      const status = exists && valid ? "✅" : artifact.required ? "❌" : "⚠️";
      const sizeStr = exists ? this.formatFileSize(size) : "N/A";
      
      console.log(`   ${status} ${artifact.name}`);
      console.log(`      Path: ${artifact.path}`);
      console.log(`      Size: ${sizeStr}`);
      
      if (exists && !valid) {
        console.log(`      Issue: Validation failed`);
      } else if (!exists && artifact.required) {
        console.log(`      Issue: Required file missing`);
      }
      console.log();
    }

    // Summary
    const requiredCount = this.artifacts.filter(a => a.required).length;
    const validRequired = results.filter(r => r.artifact.required && r.exists && r.valid).length;
    
    console.log("📊 Summary:");
    console.log(`   Required artifacts: ${validRequired}/${requiredCount}`);
    console.log(`   Status: ${allValid ? "✅ Ready for deployment" : "❌ Build issues found"}`);

    if (!allValid) {
      console.log("\n💡 To fix build issues:");
      console.log("   1. Run 'anchor build' to rebuild programs");
      console.log("   2. Check program source code for compilation errors");
      console.log("   3. Ensure all programs are properly configured in Anchor.toml");
    }

    return allValid;
  }

  async build(): Promise<boolean> {
    console.log("🔨 Building programs...\n");
    
    try {
      console.log("Running: anchor build");
      const output = execSync("anchor build", { 
        encoding: "utf8",
        stdio: "inherit"
      });
      
      console.log("\n✅ Build completed");
      return true;
    } catch (error) {
      console.error("\n❌ Build failed:", error);
      return false;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "verify";
  
  const verifier = new BuildVerifier();
  
  switch (command) {
    case "build":
      const buildSuccess = await verifier.build();
      if (buildSuccess) {
        await verifier.verify();
      }
      process.exit(buildSuccess ? 0 : 1);
      break;
      
    case "verify":
    default:
      const isValid = await verifier.verify();
      process.exit(isValid ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { BuildVerifier };