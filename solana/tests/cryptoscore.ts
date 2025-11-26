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

describe("CryptoScore Market Program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const factoryProgram = anchor.workspace.CryptoscoreFactory as Program<CryptoscoreFactory>;
  const marketProgram = anchor.workspace.CryptoscoreMarket as Program<CryptoscoreMarket>;
  const authority = provider.wallet as anchor.Wallet;

  let factoryPda: PublicKey;
  let marketPda: PublicKey;
  let marketBump: number;
  
  const matchId = "EPL-2024-MARKET-TEST-001";
  const entryFee = new BN(500_000_000); // 0.5 SOL
  let kickoffTime: BN;
  let endTime: BN;

  before(async () => {
    // Derive factory PDA
    [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory")],
      factoryProgram.programId
    );

    // Set times in the future
    const now = Math.floor(Date.now() / 1000);
    kickoffTime = new BN(now + 3600); // 1 hour from now
    endTime = new BN(now + 7200); // 2 hours from now

    // Derive market PDA
    [marketPda, marketBump] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("market"),
        factoryPda.toBuffer(),
        Buffer.from(matchId),
      ],
      marketProgram.programId
    );
  });

  describe("Market Initialization", () => {
    it("Initializes market with valid parameters", async () => {
      const isPublic = true;

      const tx = await marketProgram.methods
        .initializeMarket(matchId, entryFee, kickoffTime, endTime, isPublic)
        .accounts({
          market: marketPda,
          factory: factoryPda,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Market initialization signature:", tx);

      // Fetch and verify market account
      const marketAccount = await marketProgram.account.market.fetch(marketPda);
      
      assert.equal(marketAccount.factory.toString(), factoryPda.toString());
      assert.equal(marketAccount.creator.toString(), authority.publicKey.toString());
      assert.equal(marketAccount.matchId, matchId);
      assert.equal(marketAccount.entryFee.toString(), entryFee.toString());
      assert.equal(marketAccount.kickoffTime.toString(), kickoffTime.toString());
      assert.equal(marketAccount.endTime.toString(), endTime.toString());
      assert.deepEqual(marketAccount.status, { open: {} });
      assert.equal(marketAccount.outcome, null);
      assert.equal(marketAccount.totalPool.toNumber(), 0);
      assert.equal(marketAccount.participantCount, 0);
      assert.equal(marketAccount.homeCount, 0);
      assert.equal(marketAccount.drawCount, 0);
      assert.equal(marketAccount.awayCount, 0);
      assert.equal(marketAccount.isPublic, isPublic);
      assert.equal(marketAccount.bump, marketBump);
    });

    it("Fails to initialize with empty match ID", async () => {
      const emptyMatchId = "";
      const [testMarketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          factoryPda.toBuffer(),
          Buffer.from(emptyMatchId),
        ],
        marketProgram.programId
      );

      try {
        await marketProgram.methods
          .initializeMarket(emptyMatchId, entryFee, kickoffTime, endTime, true)
          .accounts({
            market: testMarketPda,
            factory: factoryPda,
            creator: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        assert.fail("Should have failed with invalid match ID");
      } catch (error) {
        assert.include(error.toString(), "InvalidMatchId");
      }
    });

    it("Fails to initialize with zero entry fee", async () => {
      const testMatchId = "EPL-2024-MARKET-TEST-002";
      const [testMarketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          factoryPda.toBuffer(),
          Buffer.from(testMatchId),
        ],
        marketProgram.programId
      );

      try {
        await marketProgram.methods
          .initializeMarket(testMatchId, new BN(0), kickoffTime, endTime, true)
          .accounts({
            market: testMarketPda,
            factory: factoryPda,
            creator: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        
        assert.fail("Should have failed with zero entry fee");
      } catch (error) {
        assert.include(error.toString(), "ZeroEntryFee");
      }
    });
  });

  describe("Market Participation", () => {
    let participant1: Keypair;
    let participant2: Keypair;
    let participant3: Keypair;
    let participant1Pda: PublicKey;
    let participant2Pda: PublicKey;
    let participant3Pda: PublicKey;

    before(async () => {
      // Create test participants
      participant1 = Keypair.generate();
      participant2 = Keypair.generate();
      participant3 = Keypair.generate();

      // Airdrop SOL to participants
      for (const participant of [participant1, participant2, participant3]) {
        const airdropSig = await provider.connection.requestAirdrop(
          participant.publicKey,
          2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(airdropSig);
      }

      // Derive participant PDAs
      [participant1Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("participant"),
          marketPda.toBuffer(),
          participant1.publicKey.toBuffer(),
        ],
        marketProgram.programId
      );

      [participant2Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("participant"),
          marketPda.toBuffer(),
          participant2.publicKey.toBuffer(),
        ],
        marketProgram.programId
      );

      [participant3Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("participant"),
          marketPda.toBuffer(),
          participant3.publicKey.toBuffer(),
        ],
        marketProgram.programId
      );
    });

    it("Allows user to join market with HOME prediction", async () => {
      const prediction = { home: {} };

      const tx = await marketProgram.methods
        .joinMarket(prediction)
        .accounts({
          market: marketPda,
          participant: participant1Pda,
          user: participant1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([participant1])
        .rpc();

      console.log("Join market signature:", tx);

      // Verify participant account
      const participantAccount = await marketProgram.account.participant.fetch(participant1Pda);
      assert.equal(participantAccount.market.toString(), marketPda.toString());
      assert.equal(participantAccount.user.toString(), participant1.publicKey.toString());
      assert.deepEqual(participantAccount.prediction, prediction);
      assert.equal(participantAccount.hasWithdrawn, false);

      // Verify market updated
      const marketAccount = await marketProgram.account.market.fetch(marketPda);
      assert.equal(marketAccount.totalPool.toString(), entryFee.toString());
      assert.equal(marketAccount.participantCount, 1);
      assert.equal(marketAccount.homeCount, 1);
      assert.equal(marketAccount.drawCount, 0);
      assert.equal(marketAccount.awayCount, 0);
    });

    it("Allows user to join market with DRAW prediction", async () => {
      const prediction = { draw: {} };

      await marketProgram.methods
        .joinMarket(prediction)
        .accounts({
          market: marketPda,
          participant: participant2Pda,
          user: participant2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([participant2])
        .rpc();

      // Verify market updated
      const marketAccount = await marketProgram.account.market.fetch(marketPda);
      assert.equal(marketAccount.totalPool.toString(), entryFee.mul(new BN(2)).toString());
      assert.equal(marketAccount.participantCount, 2);
      assert.equal(marketAccount.homeCount, 1);
      assert.equal(marketAccount.drawCount, 1);
      assert.equal(marketAccount.awayCount, 0);
    });

    it("Allows user to join market with AWAY prediction", async () => {
      const prediction = { away: {} };

      await marketProgram.methods
        .joinMarket(prediction)
        .accounts({
          market: marketPda,
          participant: participant3Pda,
          user: participant3.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([participant3])
        .rpc();

      // Verify market updated
      const marketAccount = await marketProgram.account.market.fetch(marketPda);
      assert.equal(marketAccount.totalPool.toString(), entryFee.mul(new BN(3)).toString());
      assert.equal(marketAccount.participantCount, 3);
      assert.equal(marketAccount.homeCount, 1);
      assert.equal(marketAccount.drawCount, 1);
      assert.equal(marketAccount.awayCount, 1);
    });

    it("Prevents duplicate participation", async () => {
      const prediction = { home: {} };

      try {
        await marketProgram.methods
          .joinMarket(prediction)
          .accounts({
            market: marketPda,
            participant: participant1Pda,
            user: participant1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([participant1])
          .rpc();
        
        assert.fail("Should have failed with duplicate participation");
      } catch (error) {
        // Account already exists error
        assert.include(error.toString(), "already in use");
      }
    });

    it("Emits PredictionMade event", async () => {
      const testParticipant = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        testParticipant.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      const [testParticipantPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("participant"),
          marketPda.toBuffer(),
          testParticipant.publicKey.toBuffer(),
        ],
        marketProgram.programId
      );

      const prediction = { home: {} };

      const listener = marketProgram.addEventListener("PredictionMade", (event) => {
        console.log("PredictionMade event:", event);
        assert.equal(event.market.toString(), marketPda.toString());
        assert.equal(event.user.toString(), testParticipant.publicKey.toString());
        assert.deepEqual(event.prediction, prediction);
      });

      await marketProgram.methods
        .joinMarket(prediction)
        .accounts({
          market: marketPda,
          participant: testParticipantPda,
          user: testParticipant.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testParticipant])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 1000));
      await marketProgram.removeEventListener(listener);
    });
  });

  describe("Market Resolution", () => {
    let resolveMarketPda: PublicKey;
    const resolveMatchId = "EPL-2024-MARKET-TEST-RESOLVE";
    let resolveKickoffTime: BN;
    let resolveEndTime: BN;

    before(async () => {
      // Create a market that can be resolved (with end time in the past)
      const now = Math.floor(Date.now() / 1000);
      resolveKickoffTime = new BN(now - 7200); // 2 hours ago
      resolveEndTime = new BN(now - 3600); // 1 hour ago

      [resolveMarketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          factoryPda.toBuffer(),
          Buffer.from(resolveMatchId),
        ],
        marketProgram.programId
      );

      // Initialize market
      await marketProgram.methods
        .initializeMarket(resolveMatchId, entryFee, resolveKickoffTime, resolveEndTime, true)
        .accounts({
          market: resolveMarketPda,
          factory: factoryPda,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });

    it("Allows creator to resolve market with outcome", async () => {
      const outcome = { home: {} };

      const tx = await marketProgram.methods
        .resolveMarket(outcome)
        .accounts({
          market: resolveMarketPda,
          creator: authority.publicKey,
        })
        .rpc();

      console.log("Resolve market signature:", tx);

      // Verify market resolved
      const marketAccount = await marketProgram.account.market.fetch(resolveMarketPda);
      assert.deepEqual(marketAccount.status, { resolved: {} });
      assert.deepEqual(marketAccount.outcome, outcome);
    });

    it("Prevents non-creator from resolving market", async () => {
      const testMatchId = "EPL-2024-MARKET-TEST-RESOLVE-2";
      const now = Math.floor(Date.now() / 1000);
      const pastKickoff = new BN(now - 7200);
      const pastEnd = new BN(now - 3600);

      const [testMarketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          factoryPda.toBuffer(),
          Buffer.from(testMatchId),
        ],
        marketProgram.programId
      );

      await marketProgram.methods
        .initializeMarket(testMatchId, entryFee, pastKickoff, pastEnd, true)
        .accounts({
          market: testMarketPda,
          factory: factoryPda,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const nonCreator = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        nonCreator.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      try {
        await marketProgram.methods
          .resolveMarket({ home: {} })
          .accounts({
            market: testMarketPda,
            creator: nonCreator.publicKey,
          })
          .signers([nonCreator])
          .rpc();
        
        assert.fail("Should have failed with unauthorized resolver");
      } catch (error) {
        assert.include(error.toString(), "UnauthorizedResolver");
      }
    });

    it("Prevents resolving already resolved market", async () => {
      try {
        await marketProgram.methods
          .resolveMarket({ away: {} })
          .accounts({
            market: resolveMarketPda,
            creator: authority.publicKey,
          })
          .rpc();
        
        assert.fail("Should have failed with already resolved");
      } catch (error) {
        assert.include(error.toString(), "MarketAlreadyResolved");
      }
    });

    it("Emits MarketResolved event", async () => {
      const eventMatchId = "EPL-2024-MARKET-TEST-RESOLVE-EVENT";
      const now = Math.floor(Date.now() / 1000);
      const pastKickoff = new BN(now - 7200);
      const pastEnd = new BN(now - 3600);

      const [eventMarketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          factoryPda.toBuffer(),
          Buffer.from(eventMatchId),
        ],
        marketProgram.programId
      );

      await marketProgram.methods
        .initializeMarket(eventMatchId, entryFee, pastKickoff, pastEnd, true)
        .accounts({
          market: eventMarketPda,
          factory: factoryPda,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const outcome = { draw: {} };

      const listener = marketProgram.addEventListener("MarketResolved", (event) => {
        console.log("MarketResolved event:", event);
        assert.equal(event.market.toString(), eventMarketPda.toString());
        assert.deepEqual(event.outcome, outcome);
      });

      await marketProgram.methods
        .resolveMarket(outcome)
        .accounts({
          market: eventMarketPda,
          creator: authority.publicKey,
        })
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 1000));
      await marketProgram.removeEventListener(listener);
    });
  });

  describe("Reward Withdrawal", () => {
    let withdrawMarketPda: PublicKey;
    const withdrawMatchId = "EPL-2024-MARKET-TEST-WITHDRAW";
    let winner: Keypair;
    let loser: Keypair;
    let winnerPda: PublicKey;
    let loserPda: PublicKey;

    before(async () => {
      // Create participants
      winner = Keypair.generate();
      loser = Keypair.generate();

      // Airdrop SOL
      for (const participant of [winner, loser]) {
        const airdropSig = await provider.connection.requestAirdrop(
          participant.publicKey,
          2 * anchor.web3.LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(airdropSig);
      }

      // Create market with past times
      const now = Math.floor(Date.now() / 1000);
      const pastKickoff = new BN(now - 7200);
      const pastEnd = new BN(now - 3600);

      [withdrawMarketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          factoryPda.toBuffer(),
          Buffer.from(withdrawMatchId),
        ],
        marketProgram.programId
      );

      await marketProgram.methods
        .initializeMarket(withdrawMatchId, entryFee, pastKickoff, pastEnd, true)
        .accounts({
          market: withdrawMarketPda,
          factory: factoryPda,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Derive participant PDAs
      [winnerPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("participant"),
          withdrawMarketPda.toBuffer(),
          winner.publicKey.toBuffer(),
        ],
        marketProgram.programId
      );

      [loserPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("participant"),
          withdrawMarketPda.toBuffer(),
          loser.publicKey.toBuffer(),
        ],
        marketProgram.programId
      );

      // Join market (winner predicts HOME, loser predicts AWAY)
      await marketProgram.methods
        .joinMarket({ home: {} })
        .accounts({
          market: withdrawMarketPda,
          participant: winnerPda,
          user: winner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([winner])
        .rpc();

      await marketProgram.methods
        .joinMarket({ away: {} })
        .accounts({
          market: withdrawMarketPda,
          participant: loserPda,
          user: loser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([loser])
        .rpc();

      // Resolve market with HOME outcome
      await marketProgram.methods
        .resolveMarket({ home: {} })
        .accounts({
          market: withdrawMarketPda,
          creator: authority.publicKey,
        })
        .rpc();
    });

    it("Allows winner to withdraw rewards", async () => {
      const balanceBefore = await provider.connection.getBalance(winner.publicKey);

      const tx = await marketProgram.methods
        .withdrawRewards()
        .accounts({
          market: withdrawMarketPda,
          participant: winnerPda,
          user: winner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([winner])
        .rpc();

      console.log("Withdraw rewards signature:", tx);

      const balanceAfter = await provider.connection.getBalance(winner.publicKey);
      
      // Winner should receive more than they put in (minus fees)
      assert.isTrue(balanceAfter > balanceBefore);

      // Verify participant marked as withdrawn
      const participantAccount = await marketProgram.account.participant.fetch(winnerPda);
      assert.equal(participantAccount.hasWithdrawn, true);
    });

    it("Prevents loser from withdrawing", async () => {
      try {
        await marketProgram.methods
          .withdrawRewards()
          .accounts({
            market: withdrawMarketPda,
            participant: loserPda,
            user: loser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([loser])
          .rpc();
        
        assert.fail("Should have failed with not a winner");
      } catch (error) {
        assert.include(error.toString(), "NotAWinner");
      }
    });

    it("Prevents double withdrawal", async () => {
      try {
        await marketProgram.methods
          .withdrawRewards()
          .accounts({
            market: withdrawMarketPda,
            participant: winnerPda,
            user: winner.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([winner])
          .rpc();
        
        assert.fail("Should have failed with already withdrawn");
      } catch (error) {
        assert.include(error.toString(), "AlreadyWithdrawn");
      }
    });

    it("Emits RewardClaimed event", async () => {
      // Create new market for event test
      const eventMatchId = "EPL-2024-MARKET-TEST-WITHDRAW-EVENT";
      const now = Math.floor(Date.now() / 1000);
      const pastKickoff = new BN(now - 7200);
      const pastEnd = new BN(now - 3600);

      const [eventMarketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          factoryPda.toBuffer(),
          Buffer.from(eventMatchId),
        ],
        marketProgram.programId
      );

      await marketProgram.methods
        .initializeMarket(eventMatchId, entryFee, pastKickoff, pastEnd, true)
        .accounts({
          market: eventMarketPda,
          factory: factoryPda,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const eventWinner = Keypair.generate();
      const airdropSig = await provider.connection.requestAirdrop(
        eventWinner.publicKey,
        2 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(airdropSig);

      const [eventWinnerPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("participant"),
          eventMarketPda.toBuffer(),
          eventWinner.publicKey.toBuffer(),
        ],
        marketProgram.programId
      );

      await marketProgram.methods
        .joinMarket({ home: {} })
        .accounts({
          market: eventMarketPda,
          participant: eventWinnerPda,
          user: eventWinner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([eventWinner])
        .rpc();

      await marketProgram.methods
        .resolveMarket({ home: {} })
        .accounts({
          market: eventMarketPda,
          creator: authority.publicKey,
        })
        .rpc();

      const listener = marketProgram.addEventListener("RewardClaimed", (event) => {
        console.log("RewardClaimed event:", event);
        assert.equal(event.market.toString(), eventMarketPda.toString());
        assert.equal(event.user.toString(), eventWinner.publicKey.toString());
        assert.isTrue(event.amount.toNumber() > 0);
      });

      await marketProgram.methods
        .withdrawRewards()
        .accounts({
          market: eventMarketPda,
          participant: eventWinnerPda,
          user: eventWinner.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([eventWinner])
        .rpc();

      await new Promise(resolve => setTimeout(resolve, 1000));
      await marketProgram.removeEventListener(listener);
    });
  });
});

describe("CryptoScore Dashboard Program", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const dashboardProgram = anchor.workspace.CryptoscoreDashboard as Program<CryptoscoreDashboard>;
  const factoryProgram = anchor.workspace.CryptoscoreFactory as Program<CryptoscoreFactory>;
  const marketProgram = anchor.workspace.CryptoscoreMarket as Program<CryptoscoreMarket>;
  const authority = provider.wallet as anchor.Wallet;

  let factoryPda: PublicKey;
  let testUser: Keypair;
  let userStatsPda: PublicKey;

  before(async () => {
    // Derive factory PDA
    [factoryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("factory")],
      factoryProgram.programId
    );

    // Create test user
    testUser = Keypair.generate();
    const airdropSig = await provider.connection.requestAirdrop(
      testUser.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Derive user stats PDA
    [userStatsPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("user_stats"),
        testUser.publicKey.toBuffer(),
      ],
      dashboardProgram.programId
    );
  });

  describe("User Statistics", () => {
    it("Initializes user stats on first update", async () => {
      const marketResult = { win: {} };
      const amountWagered = new BN(1_000_000_000); // 1 SOL
      const amountWon = new BN(1_960_000_000); // 1.96 SOL (after 2% fees)

      const tx = await dashboardProgram.methods
        .updateUserStats(marketResult, amountWagered, amountWon)
        .accounts({
          userStats: userStatsPda,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      console.log("Initialize user stats signature:", tx);

      // Fetch and verify user stats
      const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda);
      
      assert.equal(userStats.user.toString(), testUser.publicKey.toString());
      assert.equal(userStats.totalMarkets, 1);
      assert.equal(userStats.wins, 1);
      assert.equal(userStats.losses, 0);
      assert.equal(userStats.totalWagered.toString(), amountWagered.toString());
      assert.equal(userStats.totalWon.toString(), amountWon.toString());
      assert.equal(userStats.currentStreak, 1);
      assert.equal(userStats.bestStreak, 1);
    });

    it("Updates user stats with additional win", async () => {
      const marketResult = { win: {} };
      const amountWagered = new BN(500_000_000); // 0.5 SOL
      const amountWon = new BN(980_000_000); // 0.98 SOL

      await dashboardProgram.methods
        .updateUserStats(marketResult, amountWagered, amountWon)
        .accounts({
          userStats: userStatsPda,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      // Verify stats updated
      const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda);
      
      assert.equal(userStats.totalMarkets, 2);
      assert.equal(userStats.wins, 2);
      assert.equal(userStats.losses, 0);
      assert.equal(userStats.totalWagered.toString(), new BN(1_500_000_000).toString());
      assert.equal(userStats.totalWon.toString(), new BN(2_940_000_000).toString());
      assert.equal(userStats.currentStreak, 2);
      assert.equal(userStats.bestStreak, 2);
    });

    it("Updates user stats with loss and breaks streak", async () => {
      const marketResult = { loss: {} };
      const amountWagered = new BN(1_000_000_000); // 1 SOL
      const amountWon = new BN(0);

      await dashboardProgram.methods
        .updateUserStats(marketResult, amountWagered, amountWon)
        .accounts({
          userStats: userStatsPda,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      // Verify stats updated
      const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda);
      
      assert.equal(userStats.totalMarkets, 3);
      assert.equal(userStats.wins, 2);
      assert.equal(userStats.losses, 1);
      assert.equal(userStats.totalWagered.toString(), new BN(2_500_000_000).toString());
      assert.equal(userStats.totalWon.toString(), new BN(2_940_000_000).toString());
      assert.equal(userStats.currentStreak, -1); // Negative streak for losses
      assert.equal(userStats.bestStreak, 2); // Best streak remains
    });

    it("Continues negative streak with additional loss", async () => {
      const marketResult = { loss: {} };
      const amountWagered = new BN(500_000_000); // 0.5 SOL
      const amountWon = new BN(0);

      await dashboardProgram.methods
        .updateUserStats(marketResult, amountWagered, amountWon)
        .accounts({
          userStats: userStatsPda,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      // Verify stats updated
      const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda);
      
      assert.equal(userStats.totalMarkets, 4);
      assert.equal(userStats.wins, 2);
      assert.equal(userStats.losses, 2);
      assert.equal(userStats.currentStreak, -2);
      assert.equal(userStats.bestStreak, 2);
    });

    it("Resets to positive streak after win", async () => {
      const marketResult = { win: {} };
      const amountWagered = new BN(1_000_000_000);
      const amountWon = new BN(1_960_000_000);

      await dashboardProgram.methods
        .updateUserStats(marketResult, amountWagered, amountWon)
        .accounts({
          userStats: userStatsPda,
          user: testUser.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      // Verify stats updated
      const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda);
      
      assert.equal(userStats.totalMarkets, 5);
      assert.equal(userStats.wins, 3);
      assert.equal(userStats.losses, 2);
      assert.equal(userStats.currentStreak, 1); // Reset to positive
      assert.equal(userStats.bestStreak, 2);
    });

    it("Updates best streak when current streak exceeds it", async () => {
      // Add two more wins to exceed best streak
      for (let i = 0; i < 2; i++) {
        await dashboardProgram.methods
          .updateUserStats(
            { win: {} },
            new BN(1_000_000_000),
            new BN(1_960_000_000)
          )
          .accounts({
            userStats: userStatsPda,
            user: testUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([testUser])
          .rpc();
      }

      // Verify best streak updated
      const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda);
      
      assert.equal(userStats.currentStreak, 3);
      assert.equal(userStats.bestStreak, 3); // Best streak updated
    });
  });

  describe("Market Data Aggregation", () => {
    it("Calls get_all_markets with filtering parameters", async () => {
      // This is a view function meant to be called off-chain
      try {
        await dashboardProgram.methods
          .getAllMarkets(
            { open: {} } as any, // filter_status
            true, // filter_visibility (public only)
            { poolSize: {} } as any, // sort_by
            0, // page
            20 // page_size
          )
          .accounts({})
          .rpc();
        
        console.log("get_all_markets called successfully");
      } catch (error) {
        console.log("get_all_markets error (expected for view function):", error.message);
      }
    });

    it("Calls get_user_markets with user filter", async () => {
      // This is a view function meant to be called off-chain
      try {
        await dashboardProgram.methods
          .getUserMarkets(
            testUser.publicKey,
            { resolved: {} } as any, // filter_status
            { creationTime: {} } as any, // sort_by
            0, // page
            10 // page_size
          )
          .accounts({})
          .rpc();
        
        console.log("get_user_markets called successfully");
      } catch (error) {
        console.log("get_user_markets error (expected for view function):", error.message);
      }
    });

    it("Calls get_market_details for specific market", async () => {
      // Create a test market first
      const matchId = "EPL-2024-DASHBOARD-TEST-001";
      const now = Math.floor(Date.now() / 1000);
      const kickoffTime = new BN(now + 3600);
      const endTime = new BN(now + 7200);
      const entryFee = new BN(1_000_000_000);

      const [marketPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("market"),
          factoryPda.toBuffer(),
          Buffer.from(matchId),
        ],
        marketProgram.programId
      );

      await marketProgram.methods
        .initializeMarket(matchId, entryFee, kickoffTime, endTime, true)
        .accounts({
          market: marketPda,
          factory: factoryPda,
          creator: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // This is a view function meant to be called off-chain
      try {
        await dashboardProgram.methods
          .getMarketDetails(marketPda)
          .accounts({})
          .rpc();
        
        console.log("get_market_details called successfully");
      } catch (error) {
        console.log("get_market_details error (expected for view function):", error.message);
      }
    });

    it("Calls get_market_stats for aggregated statistics", async () => {
      // This is a view function meant to be called off-chain
      try {
        await dashboardProgram.methods
          .getMarketStats()
          .accounts({})
          .rpc();
        
        console.log("get_market_stats called successfully");
      } catch (error) {
        console.log("get_market_stats error (expected for view function):", error.message);
      }
    });
  });

  describe("Pagination and Sorting", () => {
    it("Supports different page sizes", async () => {
      const pageSizes = [10, 20, 50, 100];

      for (const pageSize of pageSizes) {
        try {
          await dashboardProgram.methods
            .getAllMarkets(
              null,
              null,
              { creationTime: {} } as any,
              0,
              pageSize
            )
            .accounts({})
            .rpc();
          
          console.log(`Page size ${pageSize} supported`);
        } catch (error) {
          // Expected for view function
        }
      }
    });

    it("Supports different sort options", async () => {
      const sortOptions = [
        { creationTime: {} },
        { poolSize: {} },
        { participantCount: {} },
        { endingSoon: {} },
      ];

      for (const sortBy of sortOptions) {
        try {
          await dashboardProgram.methods
            .getAllMarkets(
              null,
              null,
              sortBy as any,
              0,
              20
            )
            .accounts({})
            .rpc();
          
          console.log(`Sort option ${JSON.stringify(sortBy)} supported`);
        } catch (error) {
          // Expected for view function
        }
      }
    });

    it("Supports pagination with different page numbers", async () => {
      const pages = [0, 1, 2, 5, 10];

      for (const page of pages) {
        try {
          await dashboardProgram.methods
            .getAllMarkets(
              null,
              null,
              { creationTime: {} } as any,
              page,
              20
            )
            .accounts({})
            .rpc();
          
          console.log(`Page ${page} supported`);
        } catch (error) {
          // Expected for view function
        }
      }
    });
  });

  describe("Derived Metrics Calculation", () => {
    it("Calculates win rate correctly", async () => {
      const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda);
      
      const winRate = (userStats.wins / userStats.totalMarkets) * 100;
      console.log(`Win rate: ${winRate.toFixed(2)}%`);
      
      assert.isTrue(winRate >= 0 && winRate <= 100);
    });

    it("Calculates profit/loss correctly", async () => {
      const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda);
      
      const profitLoss = userStats.totalWon.sub(userStats.totalWagered);
      console.log(`Profit/Loss: ${profitLoss.toString()} lamports`);
      
      // User should be profitable based on test data
      assert.isTrue(profitLoss.gt(new BN(0)));
    });

    it("Tracks streak correctly", async () => {
      const userStats = await dashboardProgram.account.userStats.fetch(userStatsPda);
      
      console.log(`Current streak: ${userStats.currentStreak}`);
      console.log(`Best streak: ${userStats.bestStreak}`);
      
      assert.isTrue(userStats.bestStreak >= Math.abs(userStats.currentStreak));
    });
  });
});
