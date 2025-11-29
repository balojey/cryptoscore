/**
 * AccountDecoder - Deserializes account data from on-chain state
 * 
 * Provides methods for decoding all program account types.
 */

import { PublicKey } from '@solana/web3.js'
import { deserialize } from 'borsh'

// Account discriminators
const DISCRIMINATORS = {
  FACTORY: 0,
  MARKET: 1,
  PARTICIPANT: 2,
  USER_STATS: 3,
}

// Data classes for deserialization
class FactoryData {
  discriminator: number
  authority: Uint8Array
  marketCount: bigint
  totalVolume: bigint

  constructor(fields: any) {
    this.discriminator = fields.discriminator
    this.authority = fields.authority
    this.marketCount = fields.marketCount
    this.totalVolume = fields.totalVolume
  }
}

class MarketData {
  discriminator: number
  factory: Uint8Array
  creator: Uint8Array
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

  constructor(fields: any) {
    this.discriminator = fields.discriminator
    this.factory = fields.factory
    this.creator = fields.creator
    this.matchId = fields.matchId
    this.entryFee = fields.entryFee
    this.kickoffTime = fields.kickoffTime
    this.endTime = fields.endTime
    this.isPublic = fields.isPublic
    this.status = fields.status
    this.outcome = fields.outcome
    this.totalPool = fields.totalPool
    this.participantCount = fields.participantCount
    this.homeCount = fields.homeCount
    this.drawCount = fields.drawCount
    this.awayCount = fields.awayCount
  }
}

class ParticipantData {
  discriminator: number
  market: Uint8Array
  user: Uint8Array
  prediction: number
  hasWithdrawn: boolean
  joinedAt: bigint

  constructor(fields: any) {
    this.discriminator = fields.discriminator
    this.market = fields.market
    this.user = fields.user
    this.prediction = fields.prediction
    this.hasWithdrawn = fields.hasWithdrawn
    this.joinedAt = fields.joinedAt
  }
}

class UserStatsData {
  discriminator: number
  user: Uint8Array
  totalMarkets: bigint
  totalWins: bigint
  totalEarnings: bigint
  currentStreak: bigint

  constructor(fields: any) {
    this.discriminator = fields.discriminator
    this.user = fields.user
    this.totalMarkets = fields.totalMarkets
    this.totalWins = fields.totalWins
    this.totalEarnings = fields.totalEarnings
    this.currentStreak = fields.currentStreak
  }
}

// Borsh schemas for account data
const FactorySchema = new Map<any, any>([
  [
    FactoryData,
    {
      kind: 'struct',
      fields: [
        ['discriminator', 'u8'],
        ['authority', [32]],
        ['marketCount', 'u64'],
        ['totalVolume', 'u64'],
      ],
    },
  ],
])

const MarketSchema = new Map<any, any>([
  [
    MarketData,
    {
      kind: 'struct',
      fields: [
        ['discriminator', 'u8'],
        ['factory', [32]],
        ['creator', [32]],
        ['matchId', 'string'],
        ['entryFee', 'u64'],
        ['kickoffTime', 'u64'],
        ['endTime', 'u64'],
        ['isPublic', 'bool'],
        ['status', 'u8'],
        ['outcome', 'u8'],
        ['totalPool', 'u64'],
        ['participantCount', 'u64'],
        ['homeCount', 'u64'],
        ['drawCount', 'u64'],
        ['awayCount', 'u64'],
      ],
    },
  ],
])

const ParticipantSchema = new Map<any, any>([
  [
    ParticipantData,
    {
      kind: 'struct',
      fields: [
        ['discriminator', 'u8'],
        ['market', [32]],
        ['user', [32]],
        ['prediction', 'u8'],
        ['hasWithdrawn', 'bool'],
        ['joinedAt', 'u64'],
      ],
    },
  ],
])

const UserStatsSchema = new Map<any, any>([
  [
    UserStatsData,
    {
      kind: 'struct',
      fields: [
        ['discriminator', 'u8'],
        ['user', [32]],
        ['totalMarkets', 'u64'],
        ['totalWins', 'u64'],
        ['totalEarnings', 'u64'],
        ['currentStreak', 'u64'],
      ],
    },
  ],
])

export interface Factory {
  authority: PublicKey
  marketCount: bigint
  totalVolume: bigint
}

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

export interface Participant {
  market: PublicKey
  user: PublicKey
  prediction: number
  hasWithdrawn: boolean
  joinedAt: bigint
}

export interface UserStats {
  user: PublicKey
  totalMarkets: bigint
  totalWins: bigint
  totalEarnings: bigint
  currentStreak: bigint
}

export class AccountDecoder {
  /**
   * Decode Factory account data
   */
  static decodeFactory(data: Buffer): Factory {
    const decoded = deserialize(FactorySchema, FactoryData, data) as FactoryData
    return {
      authority: new PublicKey(decoded.authority),
      marketCount: decoded.marketCount,
      totalVolume: decoded.totalVolume,
    }
  }

  /**
   * Decode Market account data
   */
  static decodeMarket(data: Buffer): Market {
    const decoded = deserialize(MarketSchema, MarketData, data) as MarketData
    return {
      factory: new PublicKey(decoded.factory),
      creator: new PublicKey(decoded.creator),
      matchId: decoded.matchId,
      entryFee: decoded.entryFee,
      kickoffTime: decoded.kickoffTime,
      endTime: decoded.endTime,
      isPublic: decoded.isPublic,
      status: decoded.status,
      outcome: decoded.outcome,
      totalPool: decoded.totalPool,
      participantCount: decoded.participantCount,
      homeCount: decoded.homeCount,
      drawCount: decoded.drawCount,
      awayCount: decoded.awayCount,
    }
  }

  /**
   * Decode Participant account data
   */
  static decodeParticipant(data: Buffer): Participant {
    const decoded = deserialize(ParticipantSchema, ParticipantData, data) as ParticipantData
    return {
      market: new PublicKey(decoded.market),
      user: new PublicKey(decoded.user),
      prediction: decoded.prediction,
      hasWithdrawn: decoded.hasWithdrawn,
      joinedAt: decoded.joinedAt,
    }
  }

  /**
   * Decode UserStats account data
   */
  static decodeUserStats(data: Buffer): UserStats {
    const decoded = deserialize(UserStatsSchema, UserStatsData, data) as UserStatsData
    return {
      user: new PublicKey(decoded.user),
      totalMarkets: decoded.totalMarkets,
      totalWins: decoded.totalWins,
      totalEarnings: decoded.totalEarnings,
      currentStreak: decoded.currentStreak,
    }
  }

  /**
   * Verify account discriminator
   */
  static verifyDiscriminator(data: Buffer, expectedType: keyof typeof DISCRIMINATORS): boolean {
    if (data.length === 0)
      return false
    const discriminator = data[0]
    return discriminator === DISCRIMINATORS[expectedType]
  }
}
