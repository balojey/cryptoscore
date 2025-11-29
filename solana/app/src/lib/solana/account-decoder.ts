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
    const decoded = deserialize(FactorySchema, data) as any
    return {
      authority: new PublicKey(decoded.authority),
      marketCount: BigInt(decoded.marketCount),
      totalVolume: BigInt(decoded.totalVolume),
    }
  }

  /**
   * Decode Market account data
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
   * Verify account discriminator
   */
  static verifyDiscriminator(data: Buffer, expectedType: keyof typeof DISCRIMINATORS): boolean {
    if (data.length === 0)
      return false
    const discriminator = data[0]
    return discriminator === DISCRIMINATORS[expectedType]
  }
}
