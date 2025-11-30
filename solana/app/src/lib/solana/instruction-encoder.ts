/**
 * InstructionEncoder - Encodes instruction data using Borsh serialization
 * 
 * Provides methods for encoding all program instructions with proper discriminators.
 * Each instruction is prefixed with an 8-byte discriminator for identification.
 * 
 * @module instruction-encoder
 * 
 * @example
 * ```typescript
 * const encoder = new InstructionEncoder(programId)
 * 
 * const createMarketIx = encoder.createMarket(
 *   { matchId: 'MATCH_123', entryFee: BigInt(1e9), ... },
 *   { factory, market, creator, systemProgram }
 * )
 * ```
 */

import { PublicKey, TransactionInstruction } from '@solana/web3.js'
import { serialize, Schema } from 'borsh'
import {
  CreateMarketSchema,
  JoinMarketSchema,
  ResolveMarketSchema,
  WithdrawSchema,
  CreateMarketData,
  JoinMarketData,
  ResolveMarketData,
  WithdrawData,
  type CreateMarketParams,
  type JoinMarketParams,
  type ResolveMarketParams,
} from './borsh-schemas'

/**
 * Instruction discriminators (8-byte identifiers)
 * These must match the discriminators in the on-chain program
 * 
 * @constant DISCRIMINATORS
 */
const DISCRIMINATORS = {
  CREATE_MARKET: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
  JOIN_MARKET: Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]),
  RESOLVE_MARKET: Buffer.from([2, 0, 0, 0, 0, 0, 0, 0]),
  WITHDRAW: Buffer.from([3, 0, 0, 0, 0, 0, 0, 0]),
}

/**
 * InstructionEncoder class for encoding program instructions
 * 
 * @class InstructionEncoder
 */
export class InstructionEncoder {
  private programId: PublicKey

  /**
   * Create a new InstructionEncoder
   * 
   * @param {PublicKey} programId - Program ID for the target program
   */
  constructor(programId: PublicKey) {
    this.programId = programId
  }

  /**
   * Encode CreateMarket instruction
   * 
   * @param {CreateMarketParams} params - Market creation parameters
   * @param {Object} accounts - Required accounts for the instruction
   * @param {PublicKey} accounts.factory - Factory PDA
   * @param {PublicKey} accounts.market - Market PDA (to be created)
   * @param {PublicKey} accounts.creator - Market creator (signer)
   * @param {PublicKey} accounts.systemProgram - System program ID
   * @returns {TransactionInstruction} Encoded instruction
   * 
   * @example
   * ```typescript
   * const ix = encoder.createMarket(
   *   {
   *     matchId: 'MATCH_123',
   *     entryFee: BigInt(1_000_000_000), // 1 SOL
   *     kickoffTime: BigInt(Date.now() / 1000 + 3600),
   *     endTime: BigInt(Date.now() / 1000 + 7200),
   *     isPublic: true,
   *   },
   *   { factory, market, creator, systemProgram }
   * )
   * ```
   */
  createMarket(
    params: CreateMarketParams,
    accounts: {
      factory: PublicKey
      market: PublicKey
      creator: PublicKey
      systemProgram: PublicKey
    }
  ): TransactionInstruction {
    const instructionData = new CreateMarketData(params)
    const data = Buffer.concat([
      DISCRIMINATORS.CREATE_MARKET,
      Buffer.from(serialize(CreateMarketSchema, instructionData)),
    ])

    return new TransactionInstruction({
      keys: [
        { pubkey: accounts.factory, isSigner: false, isWritable: true },
        { pubkey: accounts.market, isSigner: false, isWritable: true },
        { pubkey: accounts.creator, isSigner: true, isWritable: true },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    })
  }

  /**
   * Encode JoinMarket instruction
   * 
   * @param {JoinMarketParams} params - Join market parameters
   * @param {Object} accounts - Required accounts for the instruction
   * @param {PublicKey} accounts.market - Market PDA
   * @param {PublicKey} accounts.participant - Participant PDA (to be created)
   * @param {PublicKey} accounts.user - User wallet (signer)
   * @param {PublicKey} accounts.systemProgram - System program ID
   * @returns {TransactionInstruction} Encoded instruction
   * 
   * @example
   * ```typescript
   * const ix = encoder.joinMarket(
   *   { prediction: 0 }, // 0 = HOME, 1 = DRAW, 2 = AWAY
   *   { market, participant, user, systemProgram }
   * )
   * ```
   */
  joinMarket(
    params: JoinMarketParams,
    accounts: {
      market: PublicKey
      participant: PublicKey
      user: PublicKey
      systemProgram: PublicKey
    }
  ): TransactionInstruction {
    const instructionData = new JoinMarketData(params)
    const data = Buffer.concat([
      DISCRIMINATORS.JOIN_MARKET,
      Buffer.from(serialize(JoinMarketSchema, instructionData)),
    ])

    return new TransactionInstruction({
      keys: [
        { pubkey: accounts.market, isSigner: false, isWritable: true },
        { pubkey: accounts.participant, isSigner: false, isWritable: true },
        { pubkey: accounts.user, isSigner: true, isWritable: true },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    })
  }

  /**
   * Encode ResolveMarket instruction
   * 
   * @param {ResolveMarketParams} params - Market resolution parameters
   * @param {Object} accounts - Required accounts for the instruction
   * @param {PublicKey} accounts.market - Market PDA
   * @param {PublicKey} accounts.resolver - Resolver wallet (signer, must be creator)
   * @returns {TransactionInstruction} Encoded instruction
   * 
   * @example
   * ```typescript
   * const ix = encoder.resolveMarket(
   *   { outcome: 0 }, // 0 = HOME, 1 = DRAW, 2 = AWAY
   *   { market, resolver }
   * )
   * ```
   */
  resolveMarket(
    params: ResolveMarketParams,
    accounts: {
      market: PublicKey
      resolver: PublicKey
    }
  ): TransactionInstruction {
    const instructionData = new ResolveMarketData(params)
    const data = Buffer.concat([
      DISCRIMINATORS.RESOLVE_MARKET,
      Buffer.from(serialize(ResolveMarketSchema, instructionData)),
    ])

    return new TransactionInstruction({
      keys: [
        { pubkey: accounts.market, isSigner: false, isWritable: true },
        { pubkey: accounts.resolver, isSigner: true, isWritable: false },
      ],
      programId: this.programId,
      data,
    })
  }

  /**
   * Encode Withdraw instruction
   * 
   * Note: Withdraw has no parameters, only the discriminator is sent
   * 
   * @param {Object} accounts - Required accounts for the instruction
   * @param {PublicKey} accounts.market - Market PDA
   * @param {PublicKey} accounts.participant - Participant PDA
   * @param {PublicKey} accounts.user - User wallet (signer)
   * @param {PublicKey} accounts.systemProgram - System program ID
   * @returns {TransactionInstruction} Encoded instruction
   * 
   * @example
   * ```typescript
   * const ix = encoder.withdraw({
   *   market,
   *   participant,
   *   user,
   *   systemProgram
   * })
   * ```
   */
  withdraw(accounts: {
    market: PublicKey
    participant: PublicKey
    user: PublicKey
    systemProgram: PublicKey
  }): TransactionInstruction {
    // Withdraw instruction only needs the discriminator, no additional data
    const data = DISCRIMINATORS.WITHDRAW

    return new TransactionInstruction({
      keys: [
        { pubkey: accounts.market, isSigner: false, isWritable: true },
        { pubkey: accounts.participant, isSigner: false, isWritable: true },
        { pubkey: accounts.user, isSigner: true, isWritable: true },
        { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
      ],
      programId: this.programId,
      data,
    })
  }
}
