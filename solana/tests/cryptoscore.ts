import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { CryptoscoreFactory } from "../target/types/cryptoscore_factory";
import { CryptoscoreMarket } from "../target/types/cryptoscore_market";
import { CryptoscoreDashboard } from "../target/types/cryptoscore_dashboard";

describe("CryptoScore Programs", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const factoryProgram = anchor.workspace.CryptoscoreFactory as Program<CryptoscoreFactory>;
  const marketProgram = anchor.workspace.CryptoscoreMarket as Program<CryptoscoreMarket>;
  const dashboardProgram = anchor.workspace.CryptoscoreDashboard as Program<CryptoscoreDashboard>;

  it("Factory program initializes!", async () => {
    const tx = await factoryProgram.methods.initializeFactory().rpc();
    console.log("Factory initialization signature", tx);
  });

  it("Market program initializes!", async () => {
    const tx = await marketProgram.methods.initializeMarket().rpc();
    console.log("Market initialization signature", tx);
  });

  it("Dashboard program responds!", async () => {
    const tx = await dashboardProgram.methods.getAllMarkets().rpc();
    console.log("Dashboard query signature", tx);
  });
});
