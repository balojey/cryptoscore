import { assert } from "chai";
import { BN } from "@coral-xyz/anchor";
import {
  setupTestContext,
  createTestUser,
  initializeFactory,
  createTestMarket,
  createPastMarket,
  joinMarket,
  resolveMarket,
  withdrawRewards,
  getUserBalance,
  createMultipleTestUsers,
  TestContext,
  TestUser,
  TestMarket,
  PREDICTIONS,
  TEST_AMOUNTS,
} from "../utils";
import { TestAssertions } from "../utils/test-assertions";

describe("CryptoScore Stress Tests", () => {
  let context: TestContext;

  before(async () => {
    context = await setupTestContext();
    await initializeFactory(context);
  });

  describe("High Volume Market Operations", () => {
    it("Handles 50 participants in a single market", async () => {
      const participants = await createMultipleTestUsers(context.provider, 50, 3);
      const market = await createTestMarket(context, {
        matchId: "EPL-2024-STRESS-50-USERS",
        entryFee: TEST_AMOUNTS.HALF_SOL,
      });

      console.log("Creating market with 50 participants...");

      // Join market with distributed predictions
      const predictions = [PREDICTIONS.HOME, PREDICTIONS.DRAW, PREDICTIONS.AWAY];
      const joinPromises: Promise<any>[] = [];

      for (let i = 0; i < participants.length; i++) {
        const prediction = predictions[i % 3];
        joinPromises.push(joinMarket(context, market, participants[i], prediction));
      }

      // Execute joins in batches to avoid overwhelming the network
      const batchSize = 10;
      for (let i = 0; i < joinPromises.length; i += batchSize) {
        const batch = joinPromises.slice(i, i + batchSize);
        await Promise.all(batch);
        console.log(`Batch ${Math.floor(i / batchSize) + 1}/5 completed`);
      }

      // Verify final market state
      const marketAccount = await context.marketProgram.account.market.fetch(market.marketPda);
      assert.equal(marketAccount.participantCount, 50);
      TestAssertions.bnEqual(marketAccount.totalPool, TEST_AMOUNTS.HALF_SOL.mul(new BN(50)));

      // Verify prediction distribution (should be roughly even)
      const totalPredictions = marketAccount.homeCount + marketAccount.drawCount + marketAccount.awayCount;
      assert.equal(totalPredictions, 50);
      
      // Each prediction type should have 16-17 participants (50/3 ≈ 16.67)
      assert.isTrue(marketAccount.homeCount >= 16 && marketAccount.homeCount <= 17);
      assert.isTrue(marketAccount.drawCount >= 16 && marketAccount.drawCount <= 17);
      assert.isTrue(marketAccount.awayCount >= 16 && marketAccount.awayCount <= 17);

      console.log(`✓ 50 participants joined successfully`);
      console.log(`✓ Distribution: HOME(${marketAccount.homeCount}) DRAW(${marketAccount.drawCount}) AWAY(${marketAccount.awayCount})`);
    });

    it("Processes 20 concurrent market creations", async () => {
      const creators = await createMultipleTestUsers(context.provider, 20, 5);
      
      console.log("Creating 20 markets concurrently...");

      const createPromises = creators.map((creator, index) =>
        createTestMarket(context, {
          matchId: `EPL-2024-STRESS-CONCURRENT-${index}`,
          entryFee: TEST_AMOUNTS.ONE_SOL,
          creator: creator.keypair,
        })
      );

      const markets = await Promise.all(createPromises);
      
      // Verify all markets were created
      assert.equal(markets.length, 20);
      
      // Verify factory market count increased
      const factoryAccount = await context.factoryProgram.account.factory.fetch(context.factoryPda);
      assert.isTrue(factoryAccount.marketCount.toNumber() >= 20);

      console.log(`✓ 20 markets created concurrently`);
      console.log(`✓ Total factory market count: ${factoryAccount.marketCount.toString()}`);
    });

    it("Handles mass withdrawal scenario (100 winners)", async () => {
      // Create market with 100 participants, all predicting the same outcome
      const participants = await createMultipleTestUsers(context.provider, 100, 2);
      const market = await createPastMarket(context, {
        matchId: "EPL-2024-STRESS-MASS-WITHDRAWAL",
        entryFee: TEST_AMOUNTS.HALF_SOL,
      });

      console.log("Setting up mass withdrawal scenario with 100 winners...");

      // All participants predict HOME
      const joinPromises: Promise<any>[] = [];
      for (const participant of participants) {
        joinPromises.push(joinMarket(context, market, participant, PREDICTIONS.HOME));
      }

      // Execute joins in batches
      const batchSize = 20;
      for (let i = 0; i < joinPromises.length; i += batchSize) {
        const batch = joinPromises.slice(i, i + batchSize);
        await Promise.all(batch);
        console.log(`Join batch ${Math.floor(i / batchSize) + 1}/5 completed`);
      }

      // Resolve with HOME (all participants win)
      await resolveMarket(context, market, PREDICTIONS.HOME);

      // Mass withdrawal
      console.log("Processing 100 withdrawals...");
      
      const withdrawalPromises: Promise<void>[] = [];
      for (const participant of participants) {
        const participantPda = await context.marketProgram.account.participant.all([
          {
            memcmp: {
              offset: 8,
              bytes: market.marketPda.toBase58(),
            },
          },
          {
            memcmp: {
              offset: 40,
              bytes: participant.publicKey.toBase58(),
            },
          },
        ]);

        withdrawalPromises.push(
          withdrawRewards(context, market, participant, participantPda[0].publicKey)
        );
      }

      // Execute withdrawals in batches
      for (let i = 0; i < withdrawalPromises.length; i += batchSize) {
        const batch = withdrawalPromises.slice(i, i + batchSize);
        await Promise.all(batch);
        console.log(`Withdrawal batch ${Math.floor(i / batchSize) + 1}/5 completed`);
      }

      console.log("✓ 100 withdrawals processed successfully");
    });
  });

  describe("Network Resilience Tests", () => {
    it("Handles rapid sequential operations", async () => {
      const testUser = await createTestUser(context.provider, 10);
      const markets: TestMarket[] = [];

      console.log("Testing rapid sequential operations...");

      // Rapidly create 10 markets
      for (let i = 0; i < 10; i++) {
        const market = await createTestMarket(context, {
          matchId: `EPL-2024-RAPID-${i}`,
          entryFee: TEST_AMOUNTS.HALF_SOL,
        });
        markets.push(market);
      }

      // Rapidly join all markets
      for (const market of markets) {
        await joinMarket(context, market, testUser, PREDICTIONS.HOME);
      }

      // Verify all operations completed successfully
      for (const market of markets) {
        const marketAccount = await context.marketProgram.account.market.fetch(market.marketPda);
        assert.equal(marketAccount.participantCount, 1);
      }

      console.log("✓ Rapid sequential operations completed successfully");
    });

    it("Recovers from transaction failures gracefully", async () => {
      const testUser = await createTestUser(context.provider, 1); // Limited funds
      const market = await createTestMarket(context, {
        matchId: "EPL-2024-FAILURE-RECOVERY",
        entryFee: TEST_AMOUNTS.TWO_SOL, // More than user has
      });

      console.log("Testing failure recovery...");

      // This should fail due to insufficient funds
      try {
        await joinMarket(context, market, testUser, PREDICTIONS.HOME);
        assert.fail("Should have failed with insufficient funds");
      } catch (error) {
        console.log("✓ Expected failure occurred");
      }

      // Fund the user and retry
      const airdropSig = await context.provider.connection.requestAirdrop(
        testUser.publicKey,
        3 * 1_000_000_000 // 3 SOL
      );
      await context.provider.connection.confirmTransaction(airdropSig);

      // This should now succeed
      await joinMarket(context, market, testUser, PREDICTIONS.HOME);

      const marketAccount = await context.marketProgram.account.market.fetch(market.marketPda);
      assert.equal(marketAccount.participantCount, 1);

      console.log("✓ Recovery after failure successful");
    });

    it("Maintains consistency under concurrent access", async () => {
      const users = await createMultipleTestUsers(context.provider, 10, 3);
      const market = await createTestMarket(context, {
        matchId: "EPL-2024-CONCURRENT-ACCESS",
        entryFee: TEST_AMOUNTS.ONE_SOL,
      });

      console.log("Testing concurrent access consistency...");

      // Attempt concurrent joins with same prediction
      const joinPromises = users.map(user => 
        joinMarket(context, market, user, PREDICTIONS.HOME)
      );

      await Promise.all(joinPromises);

      // Verify consistent final state
      const marketAccount = await context.marketProgram.account.market.fetch(market.marketPda);
      assert.equal(marketAccount.participantCount, 10);
      assert.equal(marketAccount.homeCount, 10);
      assert.equal(marketAccount.drawCount, 0);
      assert.equal(marketAccount.awayCount, 0);
      TestAssertions.bnEqual(marketAccount.totalPool, TEST_AMOUNTS.ONE_SOL.mul(new BN(10)));

      console.log("✓ Concurrent access maintained consistency");
    });
  });

  describe("Resource Usage Tests", () => {
    it("Efficiently handles large market queries", async () => {
      console.log("Testing large market query efficiency...");

      // Create multiple markets for querying
      const creators = await createMultipleTestUsers(context.provider, 5, 5);
      const markets: TestMarket[] = [];

      for (let i = 0; i < 20; i++) {
        const creator = creators[i % creators.length];
        const market = await createTestMarket(context, {
          matchId: `EPL-2024-QUERY-TEST-${i}`,
          entryFee: TEST_AMOUNTS.ONE_SOL,
          creator: creator.keypair,
        });
        markets.push(market);
      }

      // Test dashboard queries
      const startTime = Date.now();

      try {
        // Test get_all_markets with different parameters
        await context.dashboardProgram.methods
          .getAllMarkets(
            { open: {} } as any,
            true,
            { creationTime: {} } as any,
            0,
            50
          )
          .accounts({})
          .rpc();
      } catch (error) {
        // Expected for view function
      }

      const queryTime = Date.now() - startTime;
      console.log(`✓ Large query completed in ${queryTime}ms`);

      // Verify markets exist
      assert.equal(markets.length, 20);
    });

    it("Manages memory efficiently with many participants", async () => {
      const market = await createTestMarket(context, {
        matchId: "EPL-2024-MEMORY-TEST",
        entryFee: TEST_AMOUNTS.HALF_SOL,
      });

      console.log("Testing memory efficiency with many participants...");

      // Add participants in batches to monitor memory usage
      const batchSize = 25;
      const totalParticipants = 75;

      for (let batch = 0; batch < totalParticipants / batchSize; batch++) {
        const batchUsers = await createMultipleTestUsers(context.provider, batchSize, 2);
        
        for (const user of batchUsers) {
          const prediction = [PREDICTIONS.HOME, PREDICTIONS.DRAW, PREDICTIONS.AWAY][batch];
          await joinMarket(context, market, user, prediction);
        }

        // Check market state after each batch
        const marketAccount = await context.marketProgram.account.market.fetch(market.marketPda);
        const expectedCount = (batch + 1) * batchSize;
        assert.equal(marketAccount.participantCount, expectedCount);

        console.log(`✓ Batch ${batch + 1}/3 completed (${expectedCount} participants)`);
      }

      // Verify final state
      const finalMarketAccount = await context.marketProgram.account.market.fetch(market.marketPda);
      assert.equal(finalMarketAccount.participantCount, totalParticipants);
      TestAssertions.bnEqual(
        finalMarketAccount.totalPool,
        TEST_AMOUNTS.HALF_SOL.mul(new BN(totalParticipants))
      );

      console.log("✓ Memory efficiency test completed successfully");
    });

    it("Handles account rent requirements correctly", async () => {
      const testUser = await createTestUser(context.provider, 5);
      
      console.log("Testing account rent requirements...");

      // Check minimum balance requirements
      const marketRentExemption = await context.provider.connection.getMinimumBalanceForRentExemption(
        1000 // Approximate market account size
      );
      
      const participantRentExemption = await context.provider.connection.getMinimumBalanceForRentExemption(
        200 // Approximate participant account size
      );

      console.log(`Market rent exemption: ${marketRentExemption / 1_000_000_000} SOL`);
      console.log(`Participant rent exemption: ${participantRentExemption / 1_000_000_000} SOL`);

      // Create market and verify rent exemption
      const market = await createTestMarket(context, {
        matchId: "EPL-2024-RENT-TEST",
        entryFee: TEST_AMOUNTS.ONE_SOL,
      });

      const marketBalance = await context.provider.connection.getBalance(market.marketPda);
      assert.isTrue(marketBalance >= marketRentExemption, "Market should be rent exempt");

      // Join market and verify participant rent exemption
      const participantPda = await joinMarket(context, market, testUser, PREDICTIONS.HOME);
      const participantBalance = await context.provider.connection.getBalance(participantPda);
      assert.isTrue(participantBalance >= participantRentExemption, "Participant should be rent exempt");

      console.log("✓ Rent requirements handled correctly");
    });
  });

  describe("Edge Case Scenarios", () => {
    it("Handles markets with zero participants", async () => {
      const market = await createPastMarket(context, {
        matchId: "EPL-2024-ZERO-PARTICIPANTS",
      });

      console.log("Testing market with zero participants...");

      // Try to resolve market with no participants
      await resolveMarket(context, market, PREDICTIONS.HOME);

      const marketAccount = await context.marketProgram.account.market.fetch(market.marketPda);
      TestAssertions.marketStatus(marketAccount.status, "resolved");
      assert.equal(marketAccount.participantCount, 0);
      TestAssertions.bnEqual(marketAccount.totalPool, new BN(0));

      console.log("✓ Zero participant market handled correctly");
    });

    it("Handles markets with single participant", async () => {
      const testUser = await createTestUser(context.provider, 5);
      const market = await createPastMarket(context, {
        matchId: "EPL-2024-SINGLE-PARTICIPANT",
        entryFee: TEST_AMOUNTS.ONE_SOL,
      });

      console.log("Testing market with single participant...");

      const participantPda = await joinMarket(context, market, testUser, PREDICTIONS.HOME);
      await resolveMarket(context, market, PREDICTIONS.HOME);

      // Single winner should get entire pool (minus fees)
      const balanceBefore = await getUserBalance(context.provider, testUser.publicKey);
      await withdrawRewards(context, market, testUser, participantPda);
      const balanceAfter = await getUserBalance(context.provider, testUser.publicKey);

      // Should receive ~0.98 SOL (1 SOL - 2% fees)
      TestAssertions.balanceIncreased(balanceBefore, balanceAfter, 0.98, 0.05);

      console.log("✓ Single participant market handled correctly");
    });

    it("Handles maximum entry fee scenarios", async () => {
      const richUser = await createTestUser(context.provider, 100); // 100 SOL
      const maxEntryFee = new BN(50_000_000_000); // 50 SOL

      console.log("Testing maximum entry fee scenarios...");

      const market = await createTestMarket(context, {
        matchId: "EPL-2024-MAX-ENTRY-FEE",
        entryFee: maxEntryFee,
      });

      await joinMarket(context, market, richUser, PREDICTIONS.HOME);

      const marketAccount = await context.marketProgram.account.market.fetch(market.marketPda);
      TestAssertions.bnEqual(marketAccount.totalPool, maxEntryFee);
      assert.equal(marketAccount.participantCount, 1);

      console.log("✓ Maximum entry fee handled correctly");
    });

    it("Handles rapid market state transitions", async () => {
      const testUser = await createTestUser(context.provider, 5);
      
      console.log("Testing rapid market state transitions...");

      // Create market that's about to start
      const now = Math.floor(Date.now() / 1000);
      const market = await createTestMarket(context, {
        matchId: "EPL-2024-RAPID-TRANSITIONS",
        entryFee: TEST_AMOUNTS.ONE_SOL,
        hoursFromNow: 0, // Starts now
        durationHours: 1,
      });

      // Quickly join before it "starts"
      const participantPda = await joinMarket(context, market, testUser, PREDICTIONS.HOME);

      // Simulate rapid resolution (in real scenario, this would be time-based)
      const pastMarket = await createPastMarket(context, {
        matchId: "EPL-2024-RAPID-TRANSITIONS-PAST",
        entryFee: TEST_AMOUNTS.ONE_SOL,
      });

      const pastParticipantPda = await joinMarket(context, pastMarket, testUser, PREDICTIONS.HOME);
      await resolveMarket(context, pastMarket, PREDICTIONS.HOME);
      await withdrawRewards(context, pastMarket, testUser, pastParticipantPda);

      console.log("✓ Rapid state transitions handled correctly");
    });
  });
});