/**
 * Borsh Schemas - Type definitions for instruction serialization
 *
 * This module defines Borsh schemas for all program instructions.
 * Borsh (Binary Object Representation Serializer for Hashing) is used
 * by Solana programs for efficient binary serialization.
 *
 * @module borsh-schemas
 *
 * @example
 * ```typescript
 * import { CreateMarketData, CreateMarketSchema } from './borsh-schemas'
 * import { serialize } from 'borsh'
 *
 * const data = new CreateMarketData({
 *   matchId: 'MATCH_123',
 *   entryFee: BigInt(1_000_000_000),
 *   kickoffTime: BigInt(Date.now() / 1000 + 3600),
 *   endTime: BigInt(Date.now() / 1000 + 7200),
 *   isPublic: true,
 * })
 *
 * const serialized = serialize(CreateMarketSchema, data)
 * ```
 */

/**
 * Data class for CreateMarket instruction
 *
 * @class CreateMarketData
 * @property {string} matchId - Unique identifier for the football match
 * @property {bigint} entryFee - Entry fee in lamports (1 SOL = 1_000_000_000 lamports)
 * @property {bigint} kickoffTime - Match kickoff time as Unix timestamp
 * @property {bigint} endTime - Market end time as Unix timestamp
 * @property {boolean} isPublic - Whether the market is public or private
 */
export class CreateMarketData {
  matchId: string
  entryFee: bigint
  kickoffTime: bigint
  endTime: bigint
  isPublic: boolean

  constructor(fields: CreateMarketParams) {
    this.matchId = fields.matchId
    this.entryFee = fields.entryFee
    this.kickoffTime = fields.kickoffTime
    this.endTime = fields.endTime
    this.isPublic = fields.isPublic
  }
}

/**
 * Data class for JoinMarket instruction
 *
 * @class JoinMarketData
 * @property {number} prediction - User's prediction (0 = HOME, 1 = DRAW, 2 = AWAY)
 */
export class JoinMarketData {
  prediction: number

  constructor(fields: JoinMarketParams) {
    this.prediction = fields.prediction
  }
}

/**
 * Data class for ResolveMarket instruction
 *
 * @class ResolveMarketData
 * @property {number} outcome - Match outcome (0 = HOME, 1 = DRAW, 2 = AWAY)
 */
export class ResolveMarketData {
  outcome: number

  constructor(fields: ResolveMarketParams) {
    this.outcome = fields.outcome
  }
}

/**
 * Data class for Withdraw instruction
 *
 * @class WithdrawData
 * @description Withdraw instruction has no parameters
 */
export class WithdrawData {
  constructor() {}
}

/**
 * Borsh schema for CreateMarket instruction
 *
 * @constant CreateMarketSchema
 * @description Defines the binary layout for CreateMarket instruction data
 *
 * Field types:
 * - string: Variable-length UTF-8 string
 * - u64: 64-bit unsigned integer (bigint in TypeScript)
 * - bool: Boolean value (1 byte)
 */
export const CreateMarketSchema = {
  struct: {
    matchId: 'string',
    entryFee: 'u64',
    kickoffTime: 'u64',
    endTime: 'u64',
    isPublic: 'bool',
  },
}

/**
 * Borsh schema for JoinMarket instruction
 *
 * @constant JoinMarketSchema
 * @description Defines the binary layout for JoinMarket instruction data
 *
 * Field types:
 * - u8: 8-bit unsigned integer (0-255)
 */
export const JoinMarketSchema = {
  struct: {
    prediction: 'u8',
  },
}

/**
 * Borsh schema for ResolveMarket instruction
 *
 * @constant ResolveMarketSchema
 * @description Defines the binary layout for ResolveMarket instruction data
 *
 * Field types:
 * - u8: 8-bit unsigned integer (0-255)
 */
export const ResolveMarketSchema = {
  struct: {
    outcome: 'u8',
  },
}

/**
 * Borsh schema for Withdraw instruction
 *
 * @constant WithdrawSchema
 * @description Empty schema as Withdraw instruction has no parameters
 */
export const WithdrawSchema = {
  struct: {},
}

/**
 * TypeScript type for CreateMarket instruction parameters
 *
 * @typedef {object} CreateMarketParams
 * @property {string} matchId - Unique identifier for the football match
 * @property {bigint} entryFee - Entry fee in lamports
 * @property {bigint} kickoffTime - Match kickoff time as Unix timestamp
 * @property {bigint} endTime - Market end time as Unix timestamp
 * @property {boolean} isPublic - Whether the market is public or private
 */
export interface CreateMarketParams {
  matchId: string
  entryFee: bigint
  kickoffTime: bigint
  endTime: bigint
  isPublic: boolean
}

/**
 * TypeScript type for JoinMarket instruction parameters
 *
 * @typedef {object} JoinMarketParams
 * @property {number} prediction - User's prediction (0 = HOME, 1 = DRAW, 2 = AWAY)
 */
export interface JoinMarketParams {
  prediction: number
}

/**
 * TypeScript type for ResolveMarket instruction parameters
 *
 * @typedef {object} ResolveMarketParams
 * @property {number} outcome - Match outcome (0 = HOME, 1 = DRAW, 2 = AWAY)
 */
export interface ResolveMarketParams {
  outcome: number
}
