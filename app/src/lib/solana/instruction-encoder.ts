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

import type { PublicKey } from '@solana/web3.js'
import type { CreateMarketParams, JoinMarketParams, ResolveMarketParams } from './borsh-schemas'
import { Buffer } from 'buffer'
import { TransactionInstruction } from '@solana/web3.js'
import { serialize } from 'borsh'
import {
  CreateMarketData,

  CreateMarketSchema,
  JoinMarketData,

  JoinMarketSchema,
  ResolveMarketData,

  ResolveMarketSchema,
} from './borsh-schemas'

/**
 * Synchronous discriminator calculation using pre-computed values
 * Anchor uses the first 8 bytes of SHA256("global:snake_case_name")
 * Note: Even though IDL uses camelCase, discriminators are based on Rust snake_case
 */
function getDiscriminator(name: string): Buffer {
  // Pre-computed discriminators to avoid async crypto in browser
  const discriminators: Record<string, number[]> = {
    initialize_market: [35, 35, 189, 193, 155, 48, 170, 203],
    join_market: [141, 113, 87, 152, 182, 213, 41, 202],
    resolve_market: [155, 23, 80, 173, 46, 74, 23, 239],
    withdraw_rewards: [10, 214, 219, 139, 205, 22, 251, 21],
  }

  const disc = discriminators[name]
  if (!disc) {
    throw new Error(`Unknown instruction: ${name}`)
  }

  return Buffer.from(disc)
}

/**
 * Instruction discriminators (8-byte identifiers)
 * These must match the discriminators in the on-chain program
 * Anchor generates these from the Rust function name (snake_case)
 *
 * @constant DISCRIMINATORS
 */
const DISCRIMINATORS = {
  CREATE_MARKET: getDiscriminator('initialize_market'),
  JOIN_MARKET: getDiscriminator('join_market'),
  RESOLVE_MARKET: getDiscriminator('resolve_market'),
  WITHDRAW: getDiscriminator('withdraw_rewards'),
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
   * @param {object} accounts - Required accounts for the instruction
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
    },
  ): TransactionInstruction {
    const instructionData = new CreateMarketData(params)
    const data = Buffer.concat([
      DISCRIMINATORS.CREATE_MARKET,
      Buffer.from(serialize(CreateMarketSchema, instructionData)),
    ])

    // Account order must match the Rust struct:
    // 1. market, 2. factory, 3. creator, 4. system_program
    return new TransactionInstruction({
      keys: [
        { pubkey: accounts.market, isSigner: false, isWritable: true },
        { pubkey: accounts.factory, isSigner: false, isWritable: false },
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
   * @param {object} accounts - Required accounts for the instruction
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
    },
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
   * Encode ResolveMarket instruction with on-chain fee distribution
   *
   * @param {ResolveMarketParams} params - Market resolution parameters
   * @param {object} accounts - Required accounts for the instruction
   * @param {PublicKey} accounts.market - Market PDA
   * @param {PublicKey} accounts.resolver - Resolver (signer) - can be creator or participant
   * @param {PublicKey} accounts.creator - Market creator's address for fee distribution
   * @param {PublicKey} accounts.platform - Platform address for fee distribution
   * @param {PublicKey} [accounts.participant] - Optional participant PDA (required if resolver is not creator)
   * @returns {TransactionInstruction} Encoded instruction
   *
   * @example
   * ```typescript
   * // Creator resolving
   * const ix = encoder.resolveMarket(
   *   { outcome: 0 }, // 0 = HOME, 1 = DRAW, 2 = AWAY
   *   { market, resolver: creator, creator, platform }
   * )
   * 
   * // Participant resolving
   * const ix = encoder.resolveMarket(
   *   { outcome: 0 },
   *   { market, resolver: participant, creator, platform, participant: participantPda }
   * )
   * ```
   */
  resolveMarket(
    params: ResolveMarketParams,
    accounts: {
      market: PublicKey
      resolver: PublicKey
      creator: PublicKey
      platform: PublicKey
      participant?: PublicKey
    },
  ): TransactionInstruction {
    const instructionData = new ResolveMarketData(params)
    const data = Buffer.concat([
      DISCRIMINATORS.RESOLVE_MARKET,
      Buffer.from(serialize(ResolveMarketSchema, instructionData)),
    ])

    // Account order: 1. market, 2. resolver, 3. creator, 4. platform, 5. participant (optional)
    const keys = [
      { pubkey: accounts.market, isSigner: false, isWritable: true },
      { pubkey: accounts.resolver, isSigner: true, isWritable: false },
      { pubkey: accounts.creator, isSigner: false, isWritable: true },
      { pubkey: accounts.platform, isSigner: false, isWritable: true },
    ]

    // Add participant account if provided
    if (accounts.participant) {
      keys.push({ pubkey: accounts.participant, isSigner: false, isWritable: false })
    }

    return new TransactionInstruction({
      keys,
      programId: this.programId,
      data,
    })
  }

  /**
   * Encode Withdraw instruction
   *
   * Note: Withdraw has no parameters, only the discriminator is sent
   *
   * @param {object} accounts - Required accounts for the instruction
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
