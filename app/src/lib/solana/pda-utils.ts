/**
 * PDAUtils - Program Derived Address utilities
 *
 * Provides methods for deriving all program PDAs (Program Derived Addresses).
 * PDAs are deterministic addresses derived from seeds and a program ID.
 *
 * @module pda-utils
 *
 * @example
 * ```typescript
 * const pdaUtils = new PDAUtils(programId)
 *
 * const { pda: factoryPDA, bump } = await pdaUtils.findFactoryPDA()
 * const { pda: marketPDA } = await pdaUtils.findMarketPDA(factoryPDA, 'MATCH_123')
 * ```
 */

import { PublicKey } from '@solana/web3.js'

/**
 * Result of PDA derivation
 *
 * @interface PDAResult
 * @property {PublicKey} pda - Derived program address
 * @property {number} bump - Bump seed used for derivation (0-255)
 */
export interface PDAResult {
  pda: PublicKey
  bump: number
}

/**
 * PDAUtils class for deriving program addresses
 *
 * @class PDAUtils
 *
 * @example
 * ```typescript
 * const pdaUtils = new PDAUtils(programId)
 * const { pda, bump } = await pdaUtils.findMarketPDA(factory, matchId)
 * ```
 */
export class PDAUtils {
  private programId: PublicKey

  /**
   * Create a new PDAUtils instance
   *
   * @param {PublicKey} programId - Program ID for PDA derivation
   */
  constructor(programId: PublicKey) {
    this.programId = programId
  }

  /**
   * Find Factory PDA
   *
   * Seeds: ["factory"]
   *
   * @returns {Promise<PDAResult>} Factory PDA and bump seed
   *
   * @example
   * ```typescript
   * const { pda: factoryPDA, bump } = await pdaUtils.findFactoryPDA()
   * console.log('Factory:', factoryPDA.toBase58())
   * ```
   */
  async findFactoryPDA(): Promise<PDAResult> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('factory')],
      this.programId,
    )
    return { pda, bump }
  }

  /**
   * Find Market PDA
   *
   * Seeds: ["market", factory_pubkey, match_id]
   *
   * @param {PublicKey} factory - Factory PDA
   * @param {string} matchId - Unique match identifier
   * @returns {Promise<PDAResult>} Market PDA and bump seed
   *
   * @example
   * ```typescript
   * const { pda: marketPDA } = await pdaUtils.findMarketPDA(
   *   factoryPDA,
   *   'MATCH_123'
   * )
   * ```
   */
  async findMarketPDA(factory: PublicKey, matchId: string): Promise<PDAResult> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('market'), factory.toBuffer(), Buffer.from(matchId)],
      this.programId,
    )
    return { pda, bump }
  }

  /**
   * Find Participant PDA
   *
   * Seeds: ["participant", market_pubkey, user_pubkey]
   *
   * @param {PublicKey} market - Market PDA
   * @param {PublicKey} user - User's public key
   * @returns {Promise<PDAResult>} Participant PDA and bump seed
   *
   * @example
   * ```typescript
   * const { pda: participantPDA } = await pdaUtils.findParticipantPDA(
   *   marketPDA,
   *   wallet.publicKey
   * )
   * ```
   */
  async findParticipantPDA(market: PublicKey, user: PublicKey): Promise<PDAResult> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('participant'), market.toBuffer(), user.toBuffer()],
      this.programId,
    )
    return { pda, bump }
  }

  /**
   * Find UserStats PDA
   *
   * Seeds: ["user_stats", user_pubkey]
   *
   * @param {PublicKey} user - User's public key
   * @returns {Promise<PDAResult>} UserStats PDA and bump seed
   *
   * @example
   * ```typescript
   * const { pda: userStatsPDA } = await pdaUtils.findUserStatsPDA(
   *   wallet.publicKey
   * )
   * ```
   */
  async findUserStatsPDA(user: PublicKey): Promise<PDAResult> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('user_stats'), user.toBuffer()],
      this.programId,
    )
    return { pda, bump }
  }
}
