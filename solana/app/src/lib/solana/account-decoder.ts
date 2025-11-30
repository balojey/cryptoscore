/**
 * AccountDecoder - Deserializes account data from on-chain state
 * 
 * Provides methods for decoding all program account types using Borsh deserialization.
 * Each account type has a discriminator byte at position 0 for type identification.
 * 
 * @module account-decoder
 * 
 * @example
 * ```typescript
 * const accountInfo = await connection.getAccountInfo(marketPDA)
 * if (accountInfo) {
 *   const market = AccountDecoder.decodeMarket(accountInfo.data)
 *   console.log('Market:', market)
 * }
 * ```
 */

import { PublicKey } from '@solana/web3.js'
import { deserialize } from 'borsh'

/**
 * Account discriminators (first byte of account data)
 * These must match the discriminators in the on-chain program
 * 
 * @constant DISCRIMINATORS
 */
const DISCRIMINATORS = {
  FACTORY: 0,
  MARKET: 1,
  PARTICIPANT: 2,
  USER_STATS: 3,
}

// Borsh schemas for account data
const FactorySchema = {
  struct: {
    discriminator: 'u8',
    authority: { array: { type: 'u8', len: 32 } },
    marketCount: 'u64',
    totalVolume: 'u64',
  },
}

const MarketSchema = {
  struct: {
    discriminator: 'u8',
    factory: { array: { type: 'u8', len: 32 } },
    creator: { array: { type: 'u8', len: 32 } },
    matchId: 'string',
    entryFee: 'u64',
    kickoffTime: 'u64',
    endTime: 'u64',
    isPublic: 'bool',
    status: 'u8',
    outcome: 'u8',
    totalPool: 'u64',
    participantCount: 'u64',
    homeCount: 'u64',
    drawCount: 'u64',
    awayCount: 'u64',
  },
}

const ParticipantSchema = {
  struct: {
    discriminator: 'u8',
    market: { array: { type: 'u8', len: 32 } },
    user: { array: { type: 'u8', len: 32 } },
    prediction: 'u8',
    hasWithdrawn: 'bool',
    joinedAt: 'u64',
  },
}

const UserStatsSchema = {
  struct: {
    discriminator: 'u8',
    user: { array: { type: 'u8', len: 32 } },
    totalMarkets: 'u64',
    totalWins: 'u64',
    totalEarnings: 'u64',
    currentStreak: 'u64',
  },
}

/**
 * Factory account data structure
 * 
 * @interface Factory
 * @property {PublicKey} authority - Factory authority
 * @property {bigint} marketCount - Total number of markets created
 * @property {bigint} totalVolume - Total volume across all markets in lamports
 */
export interface Factory {
  authority: PublicKey
  marketCount: bigint
  totalVolume: bigint
}

/**
 * Market account data structure
 * 
 * @interface Market
 * @property {PublicKey} factory - Factory PDA that created this market
 * @property {PublicKey} creator - Market creator's public key
 * @property {string} matchId - Unique match identifier
 * @property {bigint} entryFee - Entry fee in lamports
 * @property {bigint} kickoffTime - Match kickoff time (Unix timestamp)
 * @property {bigint} endTime - Market end time (Unix timestamp)
 * @property {boolean} isPublic - Whether market is public or private
 * @property {number} status - Market status (0 = Open, 1 = Live, 2 = Resolved)
 * @property {number} outcome - Match outcome (0 = HOME, 1 = DRAW, 2 = AWAY, 255 = None)
 * @property {bigint} totalPool - Total pool size in lamports
 * @property {bigint} participantCount - Total number of participants
 * @property {bigint} homeCount - Number of HOME predictions
 * @property {bigint} drawCount - Number of DRAW predictions
 * @property {bigint} awayCount - Number of AWAY predictions
 */
export interface Market {
  factory: PublicKey
  creator: PublicKey
  matchId: string
  entryFee: bigint
  kickoffTime: bigint
  endTime: bigint
  isPublic: boolean
  status: number
  outcome: number
  totalPool: bigint
  participantCount: bigint
  homeCount: bigint
  drawCount: bigint
  awayCount: bigint
}

/**
 * Participant account data structure
 * 
 * @interface Participant
 * @property {PublicKey} market - Market PDA
 * @property {PublicKey} user - Participant's public key
 * @property {number} prediction - User's prediction (0 = HOME, 1 = DRAW, 2 = AWAY)
 * @property {boolean} hasWithdrawn - Whether user has withdrawn rewards
 * @property {bigint} joinedAt - Timestamp when user joined (Unix timestamp)
 */
export interface Participant {
  market: PublicKey
  user: PublicKey
  prediction: number
  hasWithdrawn: boolean
  joinedAt: bigint
}

/**
 * UserStats account data structure
 * 
 * @interface UserStats
 * @property {PublicKey} user - User's public key
 * @property {bigint} totalMarkets - Total markets participated in
 * @property {bigint} totalWins - Total wins
 * @property {bigint} totalEarnings - Total earnings in lamports
 * @property {bigint} currentStreak - Current winning streak
 */
export interface UserStats {
  user: PublicKey
  totalMarkets: bigint
  totalWins: bigint
  totalEarnings: bigint
  currentStreak: bigint
}

/**
 * AccountDecoder class for deserializing account data
 * 
 * @class AccountDecoder
 * 
 * @example
 * ```typescript
 * const accountInfo = await connection.getAccountInfo(marketPDA)
 * if (accountInfo && AccountDecoder.verifyDiscriminator(accountInfo.data, 'MARKET')) {
 *   const market = AccountDecoder.decodeMarket(accountInfo.data)
 * }
 * ```
 */
export class AccountDecoder {
  /**
   * Decode Factory account data
   * 
   * @param {Buffer} data - Raw account data from Solana
   * @returns {Factory} Decoded factory account
   * @throws {Error} If deserialization fails
   * 
   * @example
   * ```typescript
   * const factory = AccountDecoder.decodeFactory(accountInfo.data)
   * console.log('Market count:', factory.marketCount)
   * ```
   */
  static decodeFactory(data: Buffer): Factory {
    const decoded = deserialize(FactorySchema, data) as any
    return {
      authority: new PublicKey(decoded.authority),
      marketCount: BigInt(decoded.marketCount),
      totalVolume: BigInt(decoded.totalVolume),
    }
  }

  /**
   * Decode Market account data
   * 
   * @param {Buffer} data - Raw account data from Solana
   * @returns {Market} Decoded market account
   * @throws {Error} If deserialization fails
   * 
   * @example
   * ```typescript
   * const market = AccountDecoder.decodeMarket(accountInfo.data)
   * console.log('Match ID:', market.matchId)
   * console.log('Entry fee:', market.entryFee)
   * console.log('Status:', market.status)
   * ```
   */
  static decodeMarket(data: Buffer): Market {
    const decoded = deserialize(MarketSchema, data) as any
    return {
      factory: new PublicKey(decoded.factory),
      creator: new PublicKey(decoded.creator),
      matchId: decoded.matchId,
      entryFee: BigInt(decoded.entryFee),
      kickoffTime: BigInt(decoded.kickoffTime),
      endTime: BigInt(decoded.endTime),
      isPublic: decoded.isPublic,
      status: decoded.status,
      outcome: decoded.outcome,
      totalPool: BigInt(decoded.totalPool),
      participantCount: BigInt(decoded.participantCount),
      homeCount: BigInt(decoded.homeCount),
      drawCount: BigInt(decoded.drawCount),
      awayCount: BigInt(decoded.awayCount),
    }
  }

  /**
   * Decode Participant account data
   * 
   * @param {Buffer} data - Raw account data from Solana
   * @returns {Participant} Decoded participant account
   * @throws {Error} If deserialization fails
   * 
   * @example
   * ```typescript
   * const participant = AccountDecoder.decodeParticipant(accountInfo.data)
   * console.log('Prediction:', participant.prediction)
   * console.log('Has withdrawn:', participant.hasWithdrawn)
   * ```
   */
  static decodeParticipant(data: Buffer): Participant {
    const decoded = deserialize(ParticipantSchema, data) as any
    return {
      market: new PublicKey(decoded.market),
      user: new PublicKey(decoded.user),
      prediction: decoded.prediction,
      hasWithdrawn: decoded.hasWithdrawn,
      joinedAt: BigInt(decoded.joinedAt),
    }
  }

  /**
   * Decode UserStats account data
   * 
   * @param {Buffer} data - Raw account data from Solana
   * @returns {UserStats} Decoded user stats account
   * @throws {Error} If deserialization fails
   * 
   * @example
   * ```typescript
   * const stats = AccountDecoder.decodeUserStats(accountInfo.data)
   * console.log('Total wins:', stats.totalWins)
   * console.log('Win streak:', stats.currentStreak)
   * ```
   */
  static decodeUserStats(data: Buffer): UserStats {
    const decoded = deserialize(UserStatsSchema, data) as any
    return {
      user: new PublicKey(decoded.user),
      totalMarkets: BigInt(decoded.totalMarkets),
      totalWins: BigInt(decoded.totalWins),
      totalEarnings: BigInt(decoded.totalEarnings),
      currentStreak: BigInt(decoded.currentStreak),
    }
  }

  /**
   * Verify account discriminator matches expected type
   * 
   * @param {Buffer} data - Raw account data
   * @param {keyof typeof DISCRIMINATORS} expectedType - Expected account type
   * @returns {boolean} True if discriminator matches
   * 
   * @example
   * ```typescript
   * if (AccountDecoder.verifyDiscriminator(data, 'MARKET')) {
   *   const market = AccountDecoder.decodeMarket(data)
   * } else {
   *   console.error('Wrong account type')
   * }
   * ```
   */
  static verifyDiscriminator(data: Buffer, expectedType: keyof typeof DISCRIMINATORS): boolean {
    if (data.length === 0)
      return false
    const discriminator = data[0]
    return discriminator === DISCRIMINATORS[expectedType]
  }
}
