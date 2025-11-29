/**
 * PDAUtils - Program Derived Address utilities
 * 
 * Provides methods for deriving all program PDAs.
 */

import { PublicKey } from '@solana/web3.js'

export interface PDAResult {
  pda: PublicKey
  bump: number
}

export class PDAUtils {
  private programId: PublicKey

  constructor(programId: PublicKey) {
    this.programId = programId
  }

  /**
   * Find Factory PDA
   * Seeds: ["factory"]
   */
  async findFactoryPDA(): Promise<PDAResult> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('factory')],
      this.programId
    )
    return { pda, bump }
  }

  /**
   * Find Market PDA
   * Seeds: ["market", factory_pubkey, match_id]
   */
  async findMarketPDA(factory: PublicKey, matchId: string): Promise<PDAResult> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('market'), factory.toBuffer(), Buffer.from(matchId)],
      this.programId
    )
    return { pda, bump }
  }

  /**
   * Find Participant PDA
   * Seeds: ["participant", market_pubkey, user_pubkey]
   */
  async findParticipantPDA(market: PublicKey, user: PublicKey): Promise<PDAResult> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('participant'), market.toBuffer(), user.toBuffer()],
      this.programId
    )
    return { pda, bump }
  }

  /**
   * Find UserStats PDA
   * Seeds: ["user_stats", user_pubkey]
   */
  async findUserStatsPDA(user: PublicKey): Promise<PDAResult> {
    const [pda, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('user_stats'), user.toBuffer()],
      this.programId
    )
    return { pda, bump }
  }
}
