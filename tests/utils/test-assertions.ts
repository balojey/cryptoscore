import { assert } from "chai";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

/**
 * Custom assertions for CryptoScore testing
 */
export class TestAssertions {
  /**
   * Assert that a BN value equals expected amount
   */
  static bnEqual(actual: BN, expected: BN, message?: string): void {
    assert.equal(
      actual.toString(),
      expected.toString(),
      message || `Expected ${expected.toString()}, got ${actual.toString()}`
    );
  }

  /**
   * Assert that a BN value is greater than expected
   */
  static bnGreaterThan(actual: BN, expected: BN, message?: string): void {
    assert.isTrue(
      actual.gt(expected),
      message || `Expected ${actual.toString()} to be greater than ${expected.toString()}`
    );
  }

  /**
   * Assert that a BN value is less than expected
   */
  static bnLessThan(actual: BN, expected: BN, message?: string): void {
    assert.isTrue(
      actual.lt(expected),
      message || `Expected ${actual.toString()} to be less than ${expected.toString()}`
    );
  }

  /**
   * Assert that a PublicKey equals expected key
   */
  static publicKeyEqual(actual: PublicKey, expected: PublicKey, message?: string): void {
    assert.equal(
      actual.toString(),
      expected.toString(),
      message || `Expected ${expected.toString()}, got ${actual.toString()}`
    );
  }

  /**
   * Assert that a market status matches expected
   */
  static marketStatus(actual: any, expected: "open" | "live" | "resolved" | "cancelled", message?: string): void {
    const statusKey = Object.keys(actual)[0];
    assert.equal(
      statusKey,
      expected,
      message || `Expected market status ${expected}, got ${statusKey}`
    );
  }

  /**
   * Assert that a prediction matches expected outcome
   */
  static prediction(actual: any, expected: "home" | "draw" | "away", message?: string): void {
    const predictionKey = Object.keys(actual)[0];
    assert.equal(
      predictionKey,
      expected,
      message || `Expected prediction ${expected}, got ${predictionKey}`
    );
  }

  /**
   * Assert that a balance increased by approximately expected amount (accounting for fees)
   */
  static balanceIncreased(
    balanceBefore: number,
    balanceAfter: number,
    expectedIncrease: number,
    tolerance: number = 0.01,
    message?: string
  ): void {
    const actualIncrease = balanceAfter - balanceBefore;
    const diff = Math.abs(actualIncrease - expectedIncrease);
    
    assert.isTrue(
      diff <= tolerance,
      message || `Expected balance increase of ~${expectedIncrease} SOL, got ${actualIncrease} SOL (diff: ${diff})`
    );
  }

  /**
   * Assert that a balance decreased by approximately expected amount
   */
  static balanceDecreased(
    balanceBefore: number,
    balanceAfter: number,
    expectedDecrease: number,
    tolerance: number = 0.01,
    message?: string
  ): void {
    const actualDecrease = balanceBefore - balanceAfter;
    const diff = Math.abs(actualDecrease - expectedDecrease);
    
    assert.isTrue(
      diff <= tolerance,
      message || `Expected balance decrease of ~${expectedDecrease} SOL, got ${actualDecrease} SOL (diff: ${diff})`
    );
  }

  /**
   * Assert that participant counts match expected distribution
   */
  static participantDistribution(
    market: any,
    expected: { total: number; home: number; draw: number; away: number },
    message?: string
  ): void {
    assert.equal(market.participantCount, expected.total, `Total participants: ${message}`);
    assert.equal(market.homeCount, expected.home, `Home predictions: ${message}`);
    assert.equal(market.drawCount, expected.draw, `Draw predictions: ${message}`);
    assert.equal(market.awayCount, expected.away, `Away predictions: ${message}`);
  }

  /**
   * Assert that user stats match expected values
   */
  static userStats(
    stats: any,
    expected: {
      totalMarkets?: number;
      wins?: number;
      losses?: number;
      currentStreak?: number;
      bestStreak?: number;
    },
    message?: string
  ): void {
    if (expected.totalMarkets !== undefined) {
      assert.equal(stats.totalMarkets, expected.totalMarkets, `Total markets: ${message}`);
    }
    if (expected.wins !== undefined) {
      assert.equal(stats.wins, expected.wins, `Wins: ${message}`);
    }
    if (expected.losses !== undefined) {
      assert.equal(stats.losses, expected.losses, `Losses: ${message}`);
    }
    if (expected.currentStreak !== undefined) {
      assert.equal(stats.currentStreak, expected.currentStreak, `Current streak: ${message}`);
    }
    if (expected.bestStreak !== undefined) {
      assert.equal(stats.bestStreak, expected.bestStreak, `Best streak: ${message}`);
    }
  }

  /**
   * Assert that a transaction signature is valid
   */
  static validTransactionSignature(signature: string, message?: string): void {
    assert.isString(signature, message || "Transaction signature should be a string");
    assert.isTrue(signature.length > 0, message || "Transaction signature should not be empty");
    // Base58 signature should be 87-88 characters
    assert.isTrue(
      signature.length >= 87 && signature.length <= 88,
      message || `Transaction signature should be 87-88 characters, got ${signature.length}`
    );
  }

  /**
   * Assert that an error contains expected message
   */
  static errorContains(error: any, expectedMessage: string, message?: string): void {
    const errorString = error.toString();
    assert.include(
      errorString,
      expectedMessage,
      message || `Expected error to contain "${expectedMessage}", got: ${errorString}`
    );
  }

  /**
   * Assert that a timestamp is within expected range
   */
  static timestampInRange(
    actual: BN | number,
    expectedMin: number,
    expectedMax: number,
    message?: string
  ): void {
    const actualNum = typeof actual === "number" ? actual : actual.toNumber();
    assert.isTrue(
      actualNum >= expectedMin && actualNum <= expectedMax,
      message || `Expected timestamp between ${expectedMin} and ${expectedMax}, got ${actualNum}`
    );
  }

  /**
   * Assert that a percentage is within valid range (0-100)
   */
  static validPercentage(actual: number, message?: string): void {
    assert.isTrue(
      actual >= 0 && actual <= 100,
      message || `Expected percentage between 0-100, got ${actual}`
    );
  }

  /**
   * Assert that win rate calculation is correct
   */
  static winRate(wins: number, totalMarkets: number, expectedRate: number, tolerance: number = 0.01): void {
    const actualRate = totalMarkets > 0 ? (wins / totalMarkets) * 100 : 0;
    const diff = Math.abs(actualRate - expectedRate);
    
    assert.isTrue(
      diff <= tolerance,
      `Expected win rate ${expectedRate}%, got ${actualRate}% (diff: ${diff}%)`
    );
  }

  /**
   * Assert that profit/loss calculation is correct
   */
  static profitLoss(totalWon: BN, totalWagered: BN, expectedPL: BN, tolerance: BN = new BN(1000)): void {
    const actualPL = totalWon.sub(totalWagered);
    const diff = actualPL.sub(expectedPL).abs();
    
    assert.isTrue(
      diff.lte(tolerance),
      `Expected P/L ${expectedPL.toString()}, got ${actualPL.toString()} (diff: ${diff.toString()})`
    );
  }

  /**
   * Assert that market pool calculation is correct (accounting for fees)
   */
  static marketPool(
    actualPool: BN,
    entryFee: BN,
    participantCount: number,
    message?: string
  ): void {
    const expectedPool = entryFee.mul(new BN(participantCount));
    TestAssertions.bnEqual(
      actualPool,
      expectedPool,
      message || `Market pool calculation`
    );
  }

  /**
   * Assert that reward calculation is correct (accounting for fees)
   */
  static rewardCalculation(
    actualReward: BN,
    totalPool: BN,
    winnerCount: number,
    creatorFeeBps: number = 100,
    platformFeeBps: number = 100,
    message?: string
  ): void {
    // Calculate expected reward after fees
    const totalFeeBps = creatorFeeBps + platformFeeBps;
    const feeAmount = totalPool.mul(new BN(totalFeeBps)).div(new BN(10000));
    const netPool = totalPool.sub(feeAmount);
    const expectedReward = netPool.div(new BN(winnerCount));
    
    // Allow for small rounding differences
    const tolerance = new BN(1000); // 1000 lamports tolerance
    const diff = actualReward.sub(expectedReward).abs();
    
    assert.isTrue(
      diff.lte(tolerance),
      message || `Expected reward ~${expectedReward.toString()}, got ${actualReward.toString()} (diff: ${diff.toString()})`
    );
  }
}