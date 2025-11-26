import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert, expect } from "chai";
import { CryptoscoreFactory } from "../target/types/cryptoscore_factory";
import { CryptoscoreMarket } from "../target/types/cryptoscore_market";
import { CryptoscoreDashboard } from "../target/types/cryptoscore_dashboard";

describe("CryptoScore Factory Program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const factoryProgram = anchor.workspace.CryptoscoreFactory as Program<CryptoscoreFactory>;
  const authority = provider.wallet as anchor.Wallet;

  let factoryPda: PublicKey;
  let factoryBump: number;

  before(async () => {
    // Derive factory PDA
    [factoryPda, factoryBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory")],
      factoryProgram.programId
    );
  });

  describe("Factory Initialization", () => {
    it("Initializes factory with valid platform fee", async () => {
      const platformFeeBps = 100; // 1%

      const tx = await factoryProgram.methods
        .initializeFactory(platformFeeBps)
        .accounts({
          factory: factoryPda,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Factory initialization signature:", tx);

      // Fetch and verify factory account
      const factoryAccount = await factoryProgram.account.factory.fetch(factoryPda);
      
      assert.equal(factoryAccount.authority.toString(), authority.publicKey.toString());
      assert.equal(factoryAccount.marketCount.toNumber(), 0);
      assert.equal(factoryAccount.platformFeeBps, platformFeeBps);
      assert.equal(factoryAccount.bump, factoryBump);
    });

    it("Fails to initialize with invalid platform fee (>10%)", async () => {
      const invalidFeeBps = 1001; // 10.01%
      
      // Create a new keypair for this test to avoid account already exists error
      const testAuthority = Keypair.generate();
      
      // Airdrop SOL to test authority
      const airdropSig = await provider.connection.requestAirdrop(
        testAuthority.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      try {
        await factoryProgram.methods
          .initializeFactory(invalidFeeBps)
          .accounts({
            factory: factoryPda,
            authority: testAuthority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([testAuthority])
          .rpc();
        
        assert.fail("Should have failed with invalid platform fee");
      } catch (error) {
        assert.include(error.toString(), "InvalidPlatformFee");
      }
    });
  });

  describe("Market Creation", () => {
    const matchId = "EPL-2024-TEST-001";
    const entryFee = new BN(1_000_000_000); // 1 SOL
    let kickoffTime: BN;
    let endTime: BN;
    let marketRegistryPda: PublicKey;
    let marketAccount: Keypair;

    before(async () => {
      // Set times in the future
      const now = Math.floor(Date.now() / 1000);
      kickoffTime = new BN(now + 3600); // 1 hour from now
      endTime = new BN(now + 7200); // 2 hours from now

      // Derive market registry PDA
      [marketRegistryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market_registry"),
          factoryPda.toBuffer(),
          Buffer.from(matchId),
        ],
        factoryProgram.programId
      );

      // Create market account keypair
      marketAccount = Keypair.generate();
    });

    it("Creates a public market with valid parameters", async () => {
      const isPublic = true;

      const tx = await factoryProgram.methods
        .createMarket(matchId, entryFee, kickoffTime, endTime, isPublic)
        .accounts({
          factory: factoryPda,
          marketRegistry: marketRegistryPda,
          marketAccount: marketAccount.publicKey,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Market creation signature:", tx);

      // Fetch and verify market registry
      const marketRegistry = await factoryProgram.account.marketRegistry.fetch(marketRegistryPda);
      
      assert.equal(marketRegistry.factory.toString(), factoryPda.toString());
      assert.equal(marketRegistry.marketAddress.toString(), marketAccount.publicKey.toString());
      assert.equal(marketRegistry.creator.toString(), authority.publicKey.toString());
      assert.equal(marketRegistry.matchId, matchId);
      assert.equal(marketRegistry.isPublic, isPublic);
      assert.equal(marketRegistry.entryFee.toString(), entryFee.toString());
      assert.equal(marketRegistry.kickoffTime.toString(), kickoffTime.toString());
      assert.equal(marketRegistry.endTime.toString(), endTime.toString());

      // Verify factory market count incremented
      const factoryAccount = await factoryProgram.account.factory.fetch(factoryPda);
      assert.equal(factoryAccount.marketCount.toNumber(), 1);
    });

    it("Creates a private market", async () => {
      const privateMatchId = "EPL-2024-TEST-002";
      const isPublic = false;

      const [privateMarketRegistryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market_registry"),
          factoryPda.toBuffer(),
          Buffer.from(privateMatchId),
        ],
        factoryProgram.programId
      );

      const privateMarketAccount = Keypair.generate();

      await factoryProgram.methods
        .createMarket(privateMatchId, entryFee, kickoffTime, endTime, isPublic)
        .accounts({
          factory: factoryPda,
          marketRegistry: privateMarketRegistryPda,
          marketAccount: privateMarketAccount.publicKey,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const marketRegistry = await factoryProgram.account.marketRegistry.fetch(privateMarketRegistryPda);
      assert.equal(marketRegistry.isPublic, false);

      // Verify factory market count incremented
      const factoryAccount = await factoryProgram.account.factory.fetch(factoryPda);
      assert.equal(factoryAccount.marketCount.toNumber(), 2);
    });

    it("Fails to create market with empty match ID", async () => {
      const emptyMatchId = "";
      const testMarketAccount = Keypair.generate();

      const [testMarketRegistryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market_registry"),
          factoryPda.toBuffer(),
          Buffer.from(emptyMatchId),
        ],
        factoryProgram.programId
      );

      try {
        await factoryProgram.methods
          .createMarket(emptyMatchId, entryFee, kickoffTime, endTime, true)
          .accounts({
            factory: factoryPda,
            marketRegistry: testMarketRegistryPda,
            marketAccount: testMarketAccount.publicKey,
            creator: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        assert.fail("Should have failed with invalid match ID");
      } catch (error) {
        assert.include(error.toString(), "InvalidMatchId");
      }
    });

    it("Fails to create market with zero entry fee", async () => {
      const zeroFeeMatchId = "EPL-2024-TEST-003";
      const zeroFee = new BN(0);
      const testMarketAccount = Keypair.generate();

      const [testMarketRegistryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market_registry"),
          factoryPda.toBuffer(),
          Buffer.from(zeroFeeMatchId),
        ],
        factoryProgram.programId
      );

      try {
        await factoryProgram.methods
          .createMarket(zeroFeeMatchId, zeroFee, kickoffTime, endTime, true)
          .accounts({
            factory: factoryPda,
            marketRegistry: testMarketRegistryPda,
            marketAccount: testMarketAccount.publicKey,
            creator: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        assert.fail("Should have failed with zero entry fee");
      } catch (error) {
        assert.include(error.toString(), "ZeroEntryFee");
      }
    });

    it("Fails to create market with kickoff time in the past", async () => {
      const pastMatchId = "EPL-2024-TEST-004";
      const now = Math.floor(Date.now() / 1000);
      const pastKickoffTime = new BN(now - 3600); // 1 hour ago
      const testMarketAccount = Keypair.generate();

      const [testMarketRegistryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market_registry"),
          factoryPda.toBuffer(),
          Buffer.from(pastMatchId),
        ],
        factoryProgram.programId
      );

      try {
        await factoryProgram.methods
          .createMarket(pastMatchId, entryFee, pastKickoffTime, endTime, true)
          .accounts({
            factory: factoryPda,
            marketRegistry: testMarketRegistryPda,
            marketAccount: testMarketAccount.publicKey,
            creator: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        assert.fail("Should have failed with invalid kickoff time");
      } catch (error) {
        assert.include(error.toString(), "InvalidKickoffTime");
      }
    });

    it("Fails to create market with end time before kickoff time", async () => {
      const invalidTimeMatchId = "EPL-2024-TEST-005";
      const now = Math.floor(Date.now() / 1000);
      const futureKickoffTime = new BN(now + 7200); // 2 hours from now
      const invalidEndTime = new BN(now + 3600); // 1 hour from now (before kickoff)
      const testMarketAccount = Keypair.generate();

      const [testMarketRegistryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market_registry"),
          factoryPda.toBuffer(),
          Buffer.from(invalidTimeMatchId),
        ],
        factoryProgram.programId
      );

      try {
        await factoryProgram.methods
          .createMarket(invalidTimeMatchId, entryFee, futureKickoffTime, invalidEndTime, true)
          .accounts({
            factory: factoryPda,
            marketRegistry: testMarketRegistryPda,
            marketAccount: testMarketAccount.publicKey,
            creator: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        assert.fail("Should have failed with invalid end time");
      } catch (error) {
        assert.include(error.toString(), "InvalidEndTime");
      }
    });

    it("Emits MarketCreated event", async () => {
      const eventMatchId = "EPL-2024-TEST-006";
      const eventMarketAccount = Keypair.generate();

      const [eventMarketRegistryPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market_registry"),
          factoryPda.toBuffer(),
          Buffer.from(eventMatchId),
        ],
        factoryProgram.programId
      );

      const listener = factoryProgram.addEventListener("MarketCreated", (event) => {
        console.log("MarketCreated event:", event);
        assert.equal(event.matchId, eventMatchId);
        assert.equal(event.creator.toString(), authority.publicKey.toString());
        assert.equal(event.entryFee.toString(), entryFee.toString());
        assert.equal(event.isPublic, true);
      });

      await factoryProgram.methods
        .createMarket(eventMatchId, entryFee, kickoffTime, endTime, true)
        .accounts({
          factory: factoryPda,
          marketRegistry: eventMarketRegistryPda,
          marketAccount: eventMarketAccount.publicKey,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Give some time for event to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      await factoryProgram.removeEventListener(listener);
    });
  });

  describe("Market Querying", () => {
    it("Calls get_markets instruction", async () => {
      // This is a placeholder test as get_markets is meant to be called off-chain
      // In practice, clients would fetch market registry accounts directly
      
      try {
        await factoryProgram.methods
          .getMarkets(null, null, 0, 10)
          .accounts({
            factory: factoryPda,
          })
          .rpc();
        
        console.log("get_markets called successfully");
      } catch (error) {
        console.log("get_markets error (expected for view function):", error.message);
      }
    });
  });
});
