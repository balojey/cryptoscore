import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";

/**
 * Pre-funded test accounts for consistent testing
 */
export class TestAccounts {
  private static instance: TestAccounts;
  private accounts: Map<string, Keypair> = new Map();
  private provider: anchor.AnchorProvider;

  private constructor(provider: anchor.AnchorProvider) {
    this.provider = provider;
  }

  public static getInstance(provider: anchor.AnchorProvider): TestAccounts {
    if (!TestAccounts.instance) {
      TestAccounts.instance = new TestAccounts(provider);
    }
    return TestAccounts.instance;
  }

  /**
   * Get or create a named test account
   */
  public async getAccount(name: string, solAmount: number = 10): Promise<Keypair> {
    if (this.accounts.has(name)) {
      return this.accounts.get(name)!;
    }

    const keypair = Keypair.generate();
    
    // Fund the account
    const airdropSig = await this.provider.connection.requestAirdrop(
      keypair.publicKey,
      solAmount * anchor.web3.LAMPORTS_PER_SOL
    );
    await this.provider.connection.confirmTransaction(airdropSig);

    this.accounts.set(name, keypair);
    return keypair;
  }

  /**
   * Get multiple test accounts at once
   */
  public async getAccounts(names: string[], solAmount: number = 10): Promise<Map<string, Keypair>> {
    const accounts = new Map<string, Keypair>();
    
    for (const name of names) {
      const account = await this.getAccount(name, solAmount);
      accounts.set(name, account);
    }
    
    return accounts;
  }

  /**
   * Create a batch of numbered accounts (user1, user2, etc.)
   */
  public async createUserBatch(count: number, prefix: string = "user", solAmount: number = 10): Promise<Keypair[]> {
    const users: Keypair[] = [];
    
    for (let i = 1; i <= count; i++) {
      const user = await this.getAccount(`${prefix}${i}`, solAmount);
      users.push(user);
    }
    
    return users;
  }

  /**
   * Fund an existing account with more SOL
   */
  public async fundAccount(publicKey: PublicKey, solAmount: number): Promise<void> {
    const airdropSig = await this.provider.connection.requestAirdrop(
      publicKey,
      solAmount * anchor.web3.LAMPORTS_PER_SOL
    );
    await this.provider.connection.confirmTransaction(airdropSig);
  }

  /**
   * Get account balance in SOL
   */
  public async getBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.provider.connection.getBalance(publicKey);
    return balance / anchor.web3.LAMPORTS_PER_SOL;
  }

  /**
   * Clear all cached accounts (useful for test isolation)
   */
  public clear(): void {
    this.accounts.clear();
  }

  /**
   * Get all account names
   */
  public getAccountNames(): string[] {
    return Array.from(this.accounts.keys());
  }

  /**
   * Check if account exists
   */
  public hasAccount(name: string): boolean {
    return this.accounts.has(name);
  }
}

/**
 * Predefined test account roles for common scenarios
 */
export const TEST_ROLES = {
  CREATOR: "market_creator",
  WINNER: "winner_user",
  LOSER: "loser_user",
  PARTICIPANT_1: "participant_1",
  PARTICIPANT_2: "participant_2", 
  PARTICIPANT_3: "participant_3",
  ADMIN: "admin_user",
  OBSERVER: "observer_user",
} as const;

/**
 * Helper function to get test accounts instance
 */
export function getTestAccounts(provider: anchor.AnchorProvider): TestAccounts {
  return TestAccounts.getInstance(provider);
}