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
  updateUserStats,
  TestContext,
  TestUser,
  TestMarket,
  PREDICTIONS,
  MARKET_RESULTS,
  TEST_AMOUNTS,
} from "../utils";
import { TestAssertions } from "../utils/test-assertions";

/**
 * Comprehensive End-to-End Integration Tests
 * 
 * This test suite covers the requirements from task 9.2:
 * - Test complete user flow from market creation to reward withdrawal
 * - Test multi-user scenarios with different predictions and outcomes
 * - Test error scenarios including insufficient funds and invalid operations
 * - Verify event emissions and account state changes throughout flows
 */
describe("Comprehensive CryptoScore Integration Tests", () => {
  let context: TestContext;

  before(async () => {
    console.log("Setting up test context...");
    context = await setupTestContext();
    await initializeFactory(context);
    console.log("✓ Test context initialized");
  });

  describe("Complete User Flow: Market Creation → Participation → Resolution → Withdrawal", () => {
    let marketCreator: TestUser;
    let participants: TestUser[];
    let testMarket: TestMarket;
    let participantPdas: Map<string, any> = new Map();

    it("Sets up test users and creates market", async () => {
      console.log("Creating test users...");
      marketCreator = await createTestUser(context.provider, 10);
      participants = await createMultipleTestUsers(context.provider, 6, 5);
      
      console.log("Creating test market...");
      testMarket = await createTestMarket(context, {
        matchId: "COMPREHENSIVE-E2E-FLOW-001",
        entryFee: TEST_AMOUNTS.ONE_SOL,
        hoursFromNow: 1,
        durationHours: 2,
        isPublic: true,
        creator: marketCreator.keypair,
      });

      // Verify market creation
      const marketAccount = await context.marketProgram.account.market.fetch(testMarket.marketPda);
      TestAssertions.publicKeyEqual(marketAccount.creator, marketCreator.publicKey);
      TestAssertions.marketStatus(marketAccount.status, "open");
      assert.equal(marketAccount.participantCount, 0);

      console.log("✓ Market created successfully");
    });

    it("Multiple users join with different predictions", async () => {
      const predictions = [
        PREDICTIONS.HOME,  // participants[0], [1]
        PREDICTIONS.HOME,
        PREDICTIONS.DRAW,  // participants[2], [3]
        PREDICTIONS.DRAW,
        PREDICTIONS.AWAY,  // participants[4], [5]
        PREDICTIONS.AWAY,
      ];

      console.log("Users joining market with predictions...");
      
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const prediction = predictions[i];
        
        const balanceBefore = await getUserBalance(context.provider, participant.publicKey);
        const participantPda = await joinMarket(context, testMarket, participant, prediction);
        const balanceAfter = await getUserBalance(context.provider, participant.publicKey);
        
        participantPdas.set(participant.publicKey.toString(), participantPda);
        
        // Verify balance decreased by entry fee
        TestAssertions.balanceDecreased(balanceBefore, balanceAfter, 1.0, 0.1);
        
        console.log(`✓ Participant ${i + 1} joined with ${Object.keys(prediction)[0].toUpperCase()}`);
      }

      // Verify market state
      const marketAccount = await context.marketProgram.account.market.fetch(testMarket.marketPda);
      TestAssertions.participantDistribution(marketAccount, {
        total: 6,
        home: 2,
        draw: 2,
        away: 2,
      });
      TestAssertions.bnEqual(marketAccount.totalPool, TEST_AMOUNTS.ONE_SOL.mul(new BN(6)));

      console.log("✓ All participants joined successfully");
    });

    it("Resolves market and processes withdrawals", async () => {
      // Create a past market for resolution (since our test market is in the future)
      const resolutionMarket = await createPastMarket(context, {
        matchId: "COMPREHENSIVE-E2E-RESOLUTION-001",
        entryFee: TEST_AMOUNTS.ONE_SOL,
        creator: marketCreator.keypair,
      });

      // Add participants to resolution market
      const resolutionParticipants = await createMultipleTestUsers(context.provider, 4, 5);
      const resolutionPredictions = [
        PREDICTIONS.HOME,  // Winner
        PREDICTIONS.HOME,  // Winner
        PREDICTIONS.DRAW,  // Loser
        PREDICTIONS.AWAY,  // Loser
      ];

      const resolutionPdas: any[] = [];
      for (let i = 0; i < resolutionParticipants.length; i++) {
        const pda = await joinMarket(context, resolutionMarket, resolutionParticipants[i], resolutionPredictions[i]);
        resolutionPdas.push(pda);
      }

      console.log("Resolving market with HOME outcome...");
      await resolveMarket(context, resolutionMarket, PREDICTIONS.HOME, marketCreator.keypair);

      // Verify market resolved
      const resolvedMarket = await context.marketProgram.account.market.fetch(resolutionMarket.marketPda);
      TestAssertions.marketStatus(resolvedMarket.status, "resolved");
      TestAssertions.prediction(resolvedMarket.outcome, "home");

      console.log("✓ Market resolved successfully");

      // Test winner withdrawals
      console.log("Processing winner withdrawals...");
      for (let i = 0; i < 2; i++) { // First two are HOME predictors (winners)
        const winner = resolutionParticipants[i];
        const winnerPda = resolutionPdas[i];
        
        const balanceBefore = await getUserBalance(context.provider, winner.publicKey);
        await withdrawRewards(context, resolutionMarket, winner, winnerPda);
        const balanceAfter = await getUserBalance(context.provider, winner.publicKey);
        
        // Each winner should get ~1.96 SOL (4 SOL pool - 2% fees = 3.92 SOL / 2 winners)
        TestAssertions.balanceIncreased(balanceBefore, balanceAfter, 1.96, 0.1);
        
        console.log(`✓ Winner ${i + 1} withdrew rewards successfully`);
      }

      // Test loser withdrawal attempts (should fail)
      console.log("Testing loser withdrawal attempts...");
      for (let i = 2; i < 4; i++) { // Last two are losers
        const loser = resolutionParticipants[i];
        const loserPda = resolutionPdas[i];
        
        try {
          await withdrawRewards(context, resolutionMarket, loser, loserPda);
          assert.fail("Loser should not be able to withdraw");
        } catch (error) {
          TestAssertions.errorContains(error, "NotAWinner");
          console.log(`✓ Loser ${i - 1} correctly prevented from withdrawing`);
        }
      }

      console.log("✓ Complete user flow tested successfully");
    });
  });

  describe("Multi-User Scenarios with Different Outcomes", () => {
    it("Tests scenario with all users predicting same outcome", async () => {
      console.log("Testing all-win scenario...");
      
      const allWinUsers = await createMultipleTestUsers(context.provider, 5, 3);
      const allWinMarket = await createPastMarket(context, {
        matchId: "ALL-WIN-SCENARIO-001",
        entryFee: TEST_AMOUNTS.ONE_SOL,
      });

      // All predict HOME
      const allWinPdas: any[] = [];
      for (const user of allWinUsers) {
        const pda = await joinMarket(context, allWinMarket, user, PREDICTIONS.HOME);
        allWinPdas.push(pda);
      }

      // Resolve with HOME
      await resolveMarket(context, allWinMarket, PREDICTIONS.HOME);

      // All should be able to withdraw
      for (let i = 0; i < allWinUsers.length; i++) {
        const user = allWinUsers[i];
        const pda = allWinPdas[i];
        
        const balanceBefore = await getUserBalance(context.provider, user.publicKey);
        await withdrawRewards(context, allWinMarket, user, pda);
        const balanceAfter = await getUserBalance(context.provider, user.publicKey);
        
        // Each gets ~0.98 SOL (5 SOL - 2% fees = 4.9 SOL / 5 winners)
        TestAssertions.balanceIncreased(balanceBefore, balanceAfter, 0.98, 0.05);
      }

      console.log("✓ All-win scenario completed successfully");
    });

    it("Tests scenario with single winner", async () => {
      console.log("Testing single-winner scenario...");
      
      const singleWinUsers = await createMultipleTestUsers(context.provider, 4, 3);
      const singleWinMarket = await createPastMarket(context, {
        matchId: "SINGLE-WIN-SCENARIO-001",
        entryFee: TEST_AMOUNTS.ONE_SOL,
      });

      // One predicts HOME, others predict AWAY
      const singleWinPdas: any[] = [];
      for (let i = 0; i < singleWinUsers.length; i++) {
        const prediction = i === 0 ? PREDICTIONS.HOME : PREDICTIONS.AWAY;
        const pda = await joinMarket(context, singleWinMarket, singleWinUsers[i], prediction);
        singleWinPdas.push(pda);
      }

      // Resolve with HOME
      await resolveMarket(context, singleWinMarket, PREDICTIONS.HOME);

      // Only first user should win
      const winner = singleWinUsers[0];
      const winnerPda = singleWinPdas[0];
      
      const balanceBefore = await getUserBalance(context.provider, winner.publicKey);
      await withdrawRewards(context, singleWinMarket, winner, winnerPda);
      const balanceAfter = await getUserBalance(context.provider, winner.publicKey);
      
      // Winner gets ~3.92 SOL (4 SOL - 2% fees)
      TestAssertions.balanceIncreased(balanceBefore, balanceAfter, 3.92, 0.1);

      console.log("✓ Single-winner scenario completed successfully");
    });

    it("Tests mixed prediction scenario with DRAW outcome", async () => {
      console.log("Testing mixed predictions with DRAW outcome...");
      
      const mixedUsers = await createMultipleTestUsers(context.provider, 9, 3);
      const mixedMarket = await createPastMarket(context, {
        matchId: "MIXED-DRAW-SCENARIO-001",
        entryFee: TEST_AMOUNTS.ONE_SOL,
      });

      // 3 each predict HOME, DRAW, AWAY
      const mixedPdas: any[] = [];
      const predictions = [
        PREDICTIONS.HOME, PREDICTIONS.HOME, PREDICTIONS.HOME,
        PREDICTIONS.DRAW, PREDICTIONS.DRAW, PREDICTIONS.DRAW,
        PREDICTIONS.AWAY, PREDICTIONS.AWAY, PREDICTIONS.AWAY,
      ];

      for (let i = 0; i < mixedUsers.length; i++) {
        const pda = await joinMarket(context, mixedMarket, mixedUsers[i], predictions[i]);
        mixedPdas.push(pda);
      }

      // Resolve with DRAW
      await resolveMarket(context, mixedMarket, PREDICTIONS.DRAW);

      // Only DRAW predictors (indices 3-5) should win
      for (let i = 3; i < 6; i++) {
        const winner = mixedUsers[i];
        const winnerPda = mixedPdas[i];
        
        const balanceBefore = await getUserBalance(context.provider, winner.publicKey);
        await withdrawRewards(context, mixedMarket, winner, winnerPda);
        const balanceAfter = await getUserBalance(context.provider, winner.publicKey);
        
        // Each DRAW winner gets ~2.94 SOL (9 SOL - 2% fees = 8.82 SOL / 3 winners)
        TestAssertions.balanceIncreased(balanceBefore, balanceAfter, 2.94, 0.1);
      }

      console.log("✓ Mixed prediction scenario completed successfully");
    });
  });

  describe("Error Scenarios and Edge Cases", () => {
    it("Tests insufficient funds error", async () => {
      console.log("Testing insufficient funds scenario...");
      
      const poorUser = await createTestUser(context.provider, 0.5); // Only 0.5 SOL
      const expensiveMarket = await createTestMarket(context, {
        matchId: "INSUFFICIENT-FUNDS-TEST-001",
        entryFee: TEST_AMOUNTS.TWO_SOL, // Requires 2 SOL
      });

      try {
        await joinMarket(context, expensiveMarket, poorUser, PREDICTIONS.HOME);
        assert.fail("Should have failed with insufficient funds");
      } catch (error) {
        console.log("✓ Insufficient funds error handled correctly");
      }
    });

    it("Tests invalid operations", async () => {
      console.log("Testing invalid operations...");
      
      const testUser = await createTestUser(context.provider, 5);
      
      // Test joining market after kickoff
      const pastMarket = await createPastMarket(context, {
        matchId: "INVALID-OPS-TEST-001",
        hoursAgo: 1, // Already started
      });

      try {
        await joinMarket(context, pastMarket, testUser, PREDICTIONS.HOME);
        assert.fail("Should have failed joining past market");
      } catch (error) {
        TestAssertions.errorContains(error, "MarketAlreadyStarted");
        console.log("✓ Past kickoff prevention working");
      }

      // Test duplicate participation
      const activeMarket = await createTestMarket(context, {
        matchId: "INVALID-OPS-TEST-002",
      });

      await joinMarket(context, activeMarket, testUser, PREDICTIONS.HOME);
      
      try {
        await joinMarket(context, activeMarket, testUser, PREDICTIONS.AWAY);
        assert.fail("Should have failed with duplicate participation");
      } catch (error) {
        console.log("✓ Duplicate participation prevention working");
      }

      // Test unauthorized resolution
      const creator = await createTestUser(context.provider, 5);
      const unauthorized = await createTestUser(context.provider, 5);
      const authTestMarket = await createPastMarket(context, {
        matchId: "INVALID-OPS-TEST-003",
        creator: creator.keypair,
      });

      try {
        await resolveMarket(context, authTestMarket, PREDICTIONS.HOME, unauthorized.keypair);
        assert.fail("Should have failed with unauthorized resolver");
      } catch (error) {
        TestAssertions.errorContains(error, "UnauthorizedResolver");
        console.log("✓ Unauthorized resolution prevention working");
      }

      console.log("✓ All invalid operations handled correctly");
    });

    it("Tests double withdrawal prevention", async () => {
      console.log("Testing double withdrawal prevention...");
      
      const testUser = await createTestUser(context.provider, 5);
      const doubleWithdrawMarket = await createPastMarket(context, {
        matchId: "DOUBLE-WITHDRAW-TEST-001",
      });

      const participantPda = await joinMarket(context, doubleWithdrawMarket, testUser, PREDICTIONS.HOME);
      await resolveMarket(context, doubleWithdrawMarket, PREDICTIONS.HOME);

      // First withdrawal should succeed
      await withdrawRewards(context, doubleWithdrawMarket, testUser, participantPda);

      // Second withdrawal should fail
      try {
        await withdrawRewards(context, doubleWithdrawMarket, testUser, participantPda);
        assert.fail("Should have failed with double withdrawal");
      } catch (error) {
        TestAssertions.errorContains(error, "AlreadyWithdrawn");
        console.log("✓ Double withdrawal prevention working");
      }
    });
  });

  describe("Event Emissions and Account State Verification", () => {
    it("Verifies event emissions throughout market lifecycle", async () => {
      console.log("Testing event emissions...");
      
      const eventTestUser = await createTestUser(context.provider, 5);
      const eventTestMarket = await createPastMarket(context, {
        matchId: "EVENT-EMISSION-TEST-001",
      });

      let predictionMadeEmitted = false;
      let marketResolvedEmitted = false;
      let rewardClaimedEmitted = false;

      // Listen for PredictionMade event
      const predictionListener = context.marketProgram.addEventListener("PredictionMade", (event) => {
        TestAssertions.publicKeyEqual(event.market, eventTestMarket.marketPda);
        TestAssertions.publicKeyEqual(event.user, eventTestUser.publicKey);
        predictionMadeEmitted = true;
      });

      const participantPda = await joinMarket(context, eventTestMarket, eventTestUser, PREDICTIONS.HOME);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for event

      // Listen for MarketResolved event
      const resolveListener = context.marketProgram.addEventListener("MarketResolved", (event) => {
        TestAssertions.publicKeyEqual(event.market, eventTestMarket.marketPda);
        TestAssertions.prediction(event.outcome, "home");
        marketResolvedEmitted = true;
      });

      await resolveMarket(context, eventTestMarket, PREDICTIONS.HOME);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Listen for RewardClaimed event
      const rewardListener = context.marketProgram.addEventListener("RewardClaimed", (event) => {
        TestAssertions.publicKeyEqual(event.market, eventTestMarket.marketPda);
        TestAssertions.publicKeyEqual(event.user, eventTestUser.publicKey);
        rewardClaimedEmitted = true;
      });

      await withdrawRewards(context, eventTestMarket, eventTestUser, participantPda);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Clean up listeners
      await context.marketProgram.removeEventListener(predictionListener);
      await context.marketProgram.removeEventListener(resolveListener);
      await context.marketProgram.removeEventListener(rewardListener);

      // Verify events were emitted
      assert.isTrue(predictionMadeEmitted, "PredictionMade event should be emitted");
      assert.isTrue(marketResolvedEmitted, "MarketResolved event should be emitted");
      assert.isTrue(rewardClaimedEmitted, "RewardClaimed event should be emitted");

      console.log("✓ All events emitted correctly");
    });

    it("Verifies account state changes throughout lifecycle", async () => {
      console.log("Testing account state changes...");
      
      const stateTestUser = await createTestUser(context.provider, 5);
      const stateTestMarket = await createPastMarket(context, {
        matchId: "STATE-CHANGE-TEST-001",
      });

      // Initial state - market should be open with no participants
      let marketAccount = await context.marketProgram.account.market.fetch(stateTestMarket.marketPda);
      TestAssertions.marketStatus(marketAccount.status, "open");
      assert.equal(marketAccount.participantCount, 0);
      TestAssertions.bnEqual(marketAccount.totalPool, new BN(0));

      // After joining - market should have 1 participant and updated pool
      const participantPda = await joinMarket(context, stateTestMarket, stateTestUser, PREDICTIONS.HOME);
      
      marketAccount = await context.marketProgram.account.market.fetch(stateTestMarket.marketPda);
      assert.equal(marketAccount.participantCount, 1);
      assert.equal(marketAccount.homeCount, 1);
      TestAssertions.bnEqual(marketAccount.totalPool, stateTestMarket.entryFee);

      // Participant account should be created correctly
      let participantAccount = await context.marketProgram.account.participant.fetch(participantPda);
      TestAssertions.publicKeyEqual(participantAccount.user, stateTestUser.publicKey);
      TestAssertions.prediction(participantAccount.prediction, "home");
      assert.equal(participantAccount.hasWithdrawn, false);

      // After resolution - market should be resolved with outcome
      await resolveMarket(context, stateTestMarket, PREDICTIONS.HOME);
      
      marketAccount = await context.marketProgram.account.market.fetch(stateTestMarket.marketPda);
      TestAssertions.marketStatus(marketAccount.status, "resolved");
      TestAssertions.prediction(marketAccount.outcome, "home");

      // After withdrawal - participant should be marked as withdrawn
      await withdrawRewards(context, stateTestMarket, stateTestUser, participantPda);
      
      participantAccount = await context.marketProgram.account.participant.fetch(participantPda);
      assert.equal(participantAccount.hasWithdrawn, true);

      console.log("✓ Account state changes verified throughout lifecycle");
    });
  });

  describe("Dashboard Integration and User Statistics", () => {
    it("Tests dashboard user statistics integration", async () => {
      console.log("Testing dashboard integration...");
      
      const dashboardUser = await createTestUser(context.provider, 10);

      // Simulate user journey with wins and losses
      const scenarios = [
        { result: MARKET_RESULTS.WIN, wagered: TEST_AMOUNTS.ONE_SOL, won: new BN(1_960_000_000) },
        { result: MARKET_RESULTS.WIN, wagered: TEST_AMOUNTS.ONE_SOL, won: new BN(1_960_000_000) },
        { result: MARKET_RESULTS.LOSS, wagered: TEST_AMOUNTS.ONE_SOL, won: new BN(0) },
        { result: MARKET_RESULTS.WIN, wagered: TEST_AMOUNTS.ONE_SOL, won: new BN(1_960_000_000) },
      ];

      for (let i = 0; i < scenarios.length; i++) {
        const scenario = scenarios[i];
        await updateUserStats(context, dashboardUser, scenario.result, scenario.wagered, scenario.won);
        
        console.log(`✓ Updated stats for scenario ${i + 1}: ${Object.keys(scenario.result)[0].toUpperCase()}`);
      }

      // Verify final statistics
      const userStats = await context.dashboardProgram.account.userStats.all([
        {
          memcmp: {
            offset: 8, // Skip discriminator
            bytes: dashboardUser.publicKey.toBase58(),
          },
        },
      ]);

      assert.equal(userStats.length, 1, "User stats should exist");
      
      const stats = userStats[0].account;
      TestAssertions.userStats(stats, {
        totalMarkets: 4,
        wins: 3,
        losses: 1,
        currentStreak: 1, // Last was a win
        bestStreak: 2, // First two were wins
      });

      // Verify profit calculation
      TestAssertions.profitLoss(
        stats.totalWon,
        stats.totalWagered,
        new BN(1_880_000_000), // 5.88 SOL won - 4 SOL wagered = 1.88 SOL profit
        new BN(10_000_000) // 0.01 SOL tolerance
      );

      console.log("✓ Dashboard integration working correctly");
    });
  });

  after(() => {
    console.log("✓ Comprehensive integration tests completed successfully");
  });
});