import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, Connection } from "@solana/web3.js";
import { CryptoscoreFactory } from "../../target/types/cryptoscore_factory";
import { CryptoscoreMarket } from "../../target/types/cryptoscore_market";
import { CryptoscoreDashboard } from "../../target/types/cryptoscore_dashboard";

export interface TestContext {
  provider: anchor.AnchorProvider;
  factoryProgram: Program<CryptoscoreFactory>;
  marketProgram: Program<CryptoscoreMarket>;
  dashboardProgram: Program<CryptoscoreDashboard>;
  authority: anchor.Wallet;
  factoryPda: PublicKey;
  factoryBump: number;
}

export interface TestUser {
  keypair: Keypair;
  publicKey: PublicKey;
}

export interface TestMarket {
  matchId: string;
  marketPda: PublicKey;
  marketBump: number;
  marketRegistryPda: PublicKey;
  entryFee: BN;
  kickoffTime: BN;
  endTime: BN;
  isPublic: boolean;
}

/**
 * Initialize test environment with programs and authority
 */
export async function setupTestContext(): Promise<TestContext> {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const factoryProgram = anchor.workspace.CryptoscoreFactory as Program<CryptoscoreFactory>;
  const marketProgram = anchor.workspace.CryptoscoreMarket as Program<CryptoscoreMarket>;
  const dashboardProgram = anchor.workspace.CryptoscoreDashboard as Program<CryptoscoreDashboard>;
  const authority = provider.wallet as anchor.Wallet;

  // Derive factory PDA
  const [factoryPda, factoryBump] = PublicKey.findProgramAddressSync(
    [Buffer.from("factory")],
    factoryProgram.programId
  );

  return {
    provider,
    factoryProgram,
    marketProgram,
    dashboardProgram,
    authority,
    factoryPda,
    factoryBump,
  };
}

/**
 * Create and fund a test user with SOL
 */
export async function createTestUser(
  provider: anchor.AnchorProvider,
  solAmount: number = 5
): Promise<TestUser> {
  const keypair = Keypair.generate();
  
  // Airdrop SOL to test user
  const airdropSig = await provider.connection.requestAirdrop(
    keypair.publicKey,
    solAmount * anchor.web3.LAMPORTS_PER_SOL
  );
  await provider.connection.confirmTransaction(airdropSig);

  return {
    keypair,
    publicKey: keypair.publicKey,
  };
}

/**
 * Initialize factory if not already initialized
 */
export async function initializeFactory(
  context: TestContext,
  platformFeeBps: number = 100
): Promise<void> {
  try {
    // Check if factory already exists
    await context.factoryProgram.account.factory.fetch(context.factoryPda);
    console.log("Factory already initialized");
    return;
  } catch (error) {
    // Factory doesn't exist, initialize it
    console.log("Initializing factory...");
  }

  await context.factoryProgram.methods
    .initializeFactory(platformFeeBps)
    .accounts({
      factory: context.factoryPda,
      authority: context.authority.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Factory initialized successfully");
}

/**
 * Create a test market with default parameters
 */
export async function createTestMarket(
  context: TestContext,
  options: {
    matchId?: string;
    entryFee?: BN;
    hoursFromNow?: number;
    durationHours?: number;
    isPublic?: boolean;
    creator?: Keypair;
  } = {}
): Promise<TestMarket> {
  const {
    matchId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entryFee = new BN(1_000_000_000), // 1 SOL
    hoursFromNow = 1,
    durationHours = 2,
    isPublic = true,
    creator,
  } = options;

  const now = Math.floor(Date.now() / 1000);
  const kickoffTime = new BN(now + hoursFromNow * 3600);
  const endTime = new BN(now + (hoursFromNow + durationHours) * 3600);

  // Derive market PDA
  const [marketPda, marketBump] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("market"),
      context.factoryPda.toBuffer(),
      Buffer.from(matchId),
    ],
    context.marketProgram.programId
  );

  // Derive market registry PDA
  const [marketRegistryPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("market_registry"),
      context.factoryPda.toBuffer(),
      Buffer.from(matchId),
    ],
    context.factoryProgram.programId
  );

  const marketAccount = Keypair.generate();
  const creatorKey = creator ? creator.publicKey : context.authority.publicKey;
  const signers = creator ? [creator] : [];

  // Create market via factory
  await context.factoryProgram.methods
    .createMarket(matchId, entryFee, kickoffTime, endTime, isPublic)
    .accounts({
      factory: context.factoryPda,
      marketRegistry: marketRegistryPda,
      marketAccount: marketAccount.publicKey,
      creator: creatorKey,
      systemProgram: SystemProgram.programId,
    })
    .signers(signers)
    .rpc();

  // Initialize market
  await context.marketProgram.methods
    .initializeMarket(matchId, entryFee, kickoffTime, endTime, isPublic)
    .accounts({
      market: marketPda,
      factory: context.factoryPda,
      creator: creatorKey,
      systemProgram: SystemProgram.programId,
    })
    .signers(signers)
    .rpc();

  return {
    matchId,
    marketPda,
    marketBump,
    marketRegistryPda,
    entryFee,
    kickoffTime,
    endTime,
    isPublic,
  };
}

/**
 * Create a test market that's ready for resolution (in the past)
 */
export async function createPastMarket(
  context: TestContext,
  options: {
    matchId?: string;
    entryFee?: BN;
    hoursAgo?: number;
    durationHours?: number;
    isPublic?: boolean;
    creator?: Keypair;
  } = {}
): Promise<TestMarket> {
  const {
    hoursAgo = 3,
    durationHours = 2,
    ...restOptions
  } = options;

  const now = Math.floor(Date.now() / 1000);
  const kickoffTime = new BN(now - hoursAgo * 3600);
  const endTime = new BN(now - (hoursAgo - durationHours) * 3600);

  return createTestMarket(context, {
    ...restOptions,
    hoursFromNow: -hoursAgo,
    durationHours,
  });
}

/**
 * Join a market with a specific prediction
 */
export async function joinMarket(
  context: TestContext,
  market: TestMarket,
  user: TestUser,
  prediction: { home: {} } | { draw: {} } | { away: {} }
): Promise<PublicKey> {
  // Derive participant PDA
  const [participantPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("participant"),
      market.marketPda.toBuffer(),
      user.publicKey.toBuffer(),
    ],
    context.marketProgram.programId
  );

  await context.marketProgram.methods
    .joinMarket(prediction)
    .accounts({
      market: market.marketPda,
      participant: participantPda,
      user: user.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([user.keypair])
    .rpc();

  return participantPda;
}

/**
 * Resolve a market with a specific outcome
 * @deprecated Manual resolution is deprecated in favor of automated resolution
 */
export async function resolveMarket(
  context: TestContext,
  market: TestMarket,
  outcome: { home: {} } | { draw: {} } | { away: {} },
  creator?: Keypair
): Promise<void> {
  throw new Error('Manual market resolution has been disabled. Markets are now resolved automatically.')
}

/**
 * Withdraw rewards for a participant
 * @deprecated Manual withdrawal is deprecated in favor of automated distribution
 */
export async function withdrawRewards(
  context: TestContext,
  market: TestMarket,
  user: TestUser,
  participantPda: PublicKey
): Promise<void> {
  throw new Error('Manual withdrawal has been disabled. Winnings are automatically distributed when markets resolve.')
}

/**
 * Get user balance in SOL
 */
export async function getUserBalance(
  provider: anchor.AnchorProvider,
  publicKey: PublicKey
): Promise<number> {
  const balance = await provider.connection.getBalance(publicKey);
  return balance / anchor.web3.LAMPORTS_PER_SOL;
}

/**
 * Wait for a specified number of milliseconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate multiple test users at once
 */
export async function createMultipleTestUsers(
  provider: anchor.AnchorProvider,
  count: number,
  solAmount: number = 5
): Promise<TestUser[]> {
  const users: TestUser[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUser(provider, solAmount);
    users.push(user);
  }
  
  return users;
}

/**
 * Create a user stats PDA for dashboard testing
 */
export function getUserStatsPda(
  dashboardProgram: Program<CryptoscoreDashboard>,
  userPublicKey: PublicKey
): PublicKey {
  const [userStatsPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("user_stats"),
      userPublicKey.toBuffer(),
    ],
    dashboardProgram.programId
  );
  
  return userStatsPda;
}

/**
 * Update user stats for dashboard testing
 */
export async function updateUserStats(
  context: TestContext,
  user: TestUser,
  marketResult: { win: {} } | { loss: {} },
  amountWagered: BN,
  amountWon: BN
): Promise<void> {
  const userStatsPda = getUserStatsPda(context.dashboardProgram, user.publicKey);

  await context.dashboardProgram.methods
    .updateUserStats(marketResult, amountWagered, amountWon)
    .accounts({
      userStats: userStatsPda,
      user: user.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([user.keypair])
    .rpc();
}

/**
 * Prediction outcome types for easier testing
 */
export const PREDICTIONS = {
  HOME: { home: {} },
  DRAW: { draw: {} },
  AWAY: { away: {} },
} as const;

/**
 * Market result types for dashboard testing
 */
export const MARKET_RESULTS = {
  WIN: { win: {} },
  LOSS: { loss: {} },
} as const;

/**
 * Common test amounts in lamports
 */
export const TEST_AMOUNTS = {
  HALF_SOL: new BN(500_000_000),
  ONE_SOL: new BN(1_000_000_000),
  TWO_SOL: new BN(2_000_000_000),
  FIVE_SOL: new BN(5_000_000_000),
} as const;