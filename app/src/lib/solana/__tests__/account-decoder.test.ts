/**
 * AccountDecoder Tests
 */

import { PublicKey } from '@solana/web3.js'
import { serialize } from 'borsh'
import { describe, expect, it } from 'vitest'
import { AccountDecoder } from '../account-decoder'

describe('accountDecoder', () => {
  describe('decodeFactory', () => {
    it('should decode factory account data', () => {
      const authority = new PublicKey('11111111111111111111111111111112')
      const marketCount = BigInt(10)
      const totalVolume = BigInt(5000000000)

      // Create mock account data
      const schema = {
        struct: {
          discriminator: 'u8',
          authority: { array: { type: 'u8', len: 32 } },
          marketCount: 'u64',
          totalVolume: 'u64',
        },
      }

      const data = {
        discriminator: 0,
        authority: Array.from(authority.toBuffer()),
        marketCount: marketCount.toString(),
        totalVolume: totalVolume.toString(),
      }

      const buffer = Buffer.from(serialize(schema, data))
      const decoded = AccountDecoder.decodeFactory(buffer)

      expect(decoded.authority.toString()).toBe(authority.toString())
      expect(decoded.marketCount).toBe(marketCount)
      expect(decoded.totalVolume).toBe(totalVolume)
    })
  })

  describe('decodeMarket', () => {
    it('should decode market account data', () => {
      const factory = new PublicKey('11111111111111111111111111111112')
      const creator = new PublicKey('11111111111111111111111111111113')
      const matchId = 'match_123'
      const entryFee = BigInt(1000000000)
      const kickoffTime = BigInt(Math.floor(Date.now() / 1000) + 3600)
      const endTime = BigInt(Math.floor(Date.now() / 1000) + 7200)
      const isPublic = true
      const status = 0 // Open
      const outcome = 0 // None
      const totalPool = BigInt(5000000000)
      const participantCount = BigInt(5)
      const homeCount = BigInt(2)
      const drawCount = BigInt(1)
      const awayCount = BigInt(2)

      const schema = {
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

      const data = {
        discriminator: 1,
        factory: Array.from(factory.toBuffer()),
        creator: Array.from(creator.toBuffer()),
        matchId,
        entryFee: entryFee.toString(),
        kickoffTime: kickoffTime.toString(),
        endTime: endTime.toString(),
        isPublic,
        status,
        outcome,
        totalPool: totalPool.toString(),
        participantCount: participantCount.toString(),
        homeCount: homeCount.toString(),
        drawCount: drawCount.toString(),
        awayCount: awayCount.toString(),
      }

      const buffer = Buffer.from(serialize(schema, data))
      const decoded = AccountDecoder.decodeMarket(buffer)

      expect(decoded.factory.toString()).toBe(factory.toString())
      expect(decoded.creator.toString()).toBe(creator.toString())
      expect(decoded.matchId).toBe(matchId)
      expect(decoded.entryFee).toBe(entryFee)
      expect(decoded.kickoffTime).toBe(kickoffTime)
      expect(decoded.endTime).toBe(endTime)
      expect(decoded.isPublic).toBe(isPublic)
      expect(decoded.status).toBe(status)
      expect(decoded.outcome).toBe(outcome)
      expect(decoded.totalPool).toBe(totalPool)
      expect(decoded.participantCount).toBe(participantCount)
      expect(decoded.homeCount).toBe(homeCount)
      expect(decoded.drawCount).toBe(drawCount)
      expect(decoded.awayCount).toBe(awayCount)
    })

    it('should decode private market', () => {
      const factory = new PublicKey('11111111111111111111111111111112')
      const creator = new PublicKey('11111111111111111111111111111113')

      const schema = {
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

      const data = {
        discriminator: 1,
        factory: Array.from(factory.toBuffer()),
        creator: Array.from(creator.toBuffer()),
        matchId: 'private_match',
        entryFee: '500000000',
        kickoffTime: (Math.floor(Date.now() / 1000) + 3600).toString(),
        endTime: (Math.floor(Date.now() / 1000) + 7200).toString(),
        isPublic: false,
        status: 0,
        outcome: 0,
        totalPool: '0',
        participantCount: '0',
        homeCount: '0',
        drawCount: '0',
        awayCount: '0',
      }

      const buffer = Buffer.from(serialize(schema, data))
      const decoded = AccountDecoder.decodeMarket(buffer)

      expect(decoded.isPublic).toBe(false)
      expect(decoded.matchId).toBe('private_match')
    })
  })

  describe('decodeParticipant', () => {
    it('should decode participant account data with HOME prediction', () => {
      const market = new PublicKey('11111111111111111111111111111112')
      const user = new PublicKey('11111111111111111111111111111113')
      const prediction = 0 // HOME
      const hasWithdrawn = false
      const joinedAt = BigInt(Math.floor(Date.now() / 1000))

      const schema = {
        struct: {
          discriminator: 'u8',
          market: { array: { type: 'u8', len: 32 } },
          user: { array: { type: 'u8', len: 32 } },
          prediction: 'u8',
          hasWithdrawn: 'bool',
          joinedAt: 'u64',
        },
      }

      const data = {
        discriminator: 2,
        market: Array.from(market.toBuffer()),
        user: Array.from(user.toBuffer()),
        prediction,
        hasWithdrawn,
        joinedAt: joinedAt.toString(),
      }

      const buffer = Buffer.from(serialize(schema, data))
      const decoded = AccountDecoder.decodeParticipant(buffer)

      expect(decoded.market.toString()).toBe(market.toString())
      expect(decoded.user.toString()).toBe(user.toString())
      expect(decoded.prediction).toBe(prediction)
      expect(decoded.hasWithdrawn).toBe(hasWithdrawn)
      expect(decoded.joinedAt).toBe(joinedAt)
    })

    it('should decode participant with DRAW prediction', () => {
      const market = new PublicKey('11111111111111111111111111111112')
      const user = new PublicKey('11111111111111111111111111111113')

      const schema = {
        struct: {
          discriminator: 'u8',
          market: { array: { type: 'u8', len: 32 } },
          user: { array: { type: 'u8', len: 32 } },
          prediction: 'u8',
          hasWithdrawn: 'bool',
          joinedAt: 'u64',
        },
      }

      const data = {
        discriminator: 2,
        market: Array.from(market.toBuffer()),
        user: Array.from(user.toBuffer()),
        prediction: 1, // DRAW
        hasWithdrawn: false,
        joinedAt: Math.floor(Date.now() / 1000).toString(),
      }

      const buffer = Buffer.from(serialize(schema, data))
      const decoded = AccountDecoder.decodeParticipant(buffer)

      expect(decoded.prediction).toBe(1)
    })

    it('should decode participant with AWAY prediction', () => {
      const market = new PublicKey('11111111111111111111111111111112')
      const user = new PublicKey('11111111111111111111111111111113')

      const schema = {
        struct: {
          discriminator: 'u8',
          market: { array: { type: 'u8', len: 32 } },
          user: { array: { type: 'u8', len: 32 } },
          prediction: 'u8',
          hasWithdrawn: 'bool',
          joinedAt: 'u64',
        },
      }

      const data = {
        discriminator: 2,
        market: Array.from(market.toBuffer()),
        user: Array.from(user.toBuffer()),
        prediction: 2, // AWAY
        hasWithdrawn: false,
        joinedAt: Math.floor(Date.now() / 1000).toString(),
      }

      const buffer = Buffer.from(serialize(schema, data))
      const decoded = AccountDecoder.decodeParticipant(buffer)

      expect(decoded.prediction).toBe(2)
    })

    it('should decode participant who has withdrawn', () => {
      const market = new PublicKey('11111111111111111111111111111112')
      const user = new PublicKey('11111111111111111111111111111113')

      const schema = {
        struct: {
          discriminator: 'u8',
          market: { array: { type: 'u8', len: 32 } },
          user: { array: { type: 'u8', len: 32 } },
          prediction: 'u8',
          hasWithdrawn: 'bool',
          joinedAt: 'u64',
        },
      }

      const data = {
        discriminator: 2,
        market: Array.from(market.toBuffer()),
        user: Array.from(user.toBuffer()),
        prediction: 0,
        hasWithdrawn: true,
        joinedAt: Math.floor(Date.now() / 1000).toString(),
      }

      const buffer = Buffer.from(serialize(schema, data))
      const decoded = AccountDecoder.decodeParticipant(buffer)

      expect(decoded.hasWithdrawn).toBe(true)
    })
  })

  describe('decodeUserStats', () => {
    it('should decode user stats account data', () => {
      const user = new PublicKey('11111111111111111111111111111113')
      const totalMarkets = BigInt(20)
      const totalWins = BigInt(15)
      const totalEarnings = BigInt(10000000000)
      const currentStreak = BigInt(5)

      const schema = {
        struct: {
          discriminator: 'u8',
          user: { array: { type: 'u8', len: 32 } },
          totalMarkets: 'u64',
          totalWins: 'u64',
          totalEarnings: 'u64',
          currentStreak: 'u64',
        },
      }

      const data = {
        discriminator: 3,
        user: Array.from(user.toBuffer()),
        totalMarkets: totalMarkets.toString(),
        totalWins: totalWins.toString(),
        totalEarnings: totalEarnings.toString(),
        currentStreak: currentStreak.toString(),
      }

      const buffer = Buffer.from(serialize(schema, data))
      const decoded = AccountDecoder.decodeUserStats(buffer)

      expect(decoded.user.toString()).toBe(user.toString())
      expect(decoded.totalMarkets).toBe(totalMarkets)
      expect(decoded.totalWins).toBe(totalWins)
      expect(decoded.totalEarnings).toBe(totalEarnings)
      expect(decoded.currentStreak).toBe(currentStreak)
    })

    it('should decode user stats with zero values', () => {
      const user = new PublicKey('11111111111111111111111111111113')

      const schema = {
        struct: {
          discriminator: 'u8',
          user: { array: { type: 'u8', len: 32 } },
          totalMarkets: 'u64',
          totalWins: 'u64',
          totalEarnings: 'u64',
          currentStreak: 'u64',
        },
      }

      const data = {
        discriminator: 3,
        user: Array.from(user.toBuffer()),
        totalMarkets: '0',
        totalWins: '0',
        totalEarnings: '0',
        currentStreak: '0',
      }

      const buffer = Buffer.from(serialize(schema, data))
      const decoded = AccountDecoder.decodeUserStats(buffer)

      expect(decoded.totalMarkets).toBe(BigInt(0))
      expect(decoded.totalWins).toBe(BigInt(0))
      expect(decoded.totalEarnings).toBe(BigInt(0))
      expect(decoded.currentStreak).toBe(BigInt(0))
    })
  })

  describe('verifyDiscriminator', () => {
    it('should verify factory discriminator', () => {
      const buffer = Buffer.from([0, 1, 2, 3, 4])
      expect(AccountDecoder.verifyDiscriminator(buffer, 'FACTORY')).toBe(true)
    })

    it('should verify market discriminator', () => {
      const buffer = Buffer.from([1, 1, 2, 3, 4])
      expect(AccountDecoder.verifyDiscriminator(buffer, 'MARKET')).toBe(true)
    })

    it('should verify participant discriminator', () => {
      const buffer = Buffer.from([2, 1, 2, 3, 4])
      expect(AccountDecoder.verifyDiscriminator(buffer, 'PARTICIPANT')).toBe(true)
    })

    it('should verify user stats discriminator', () => {
      const buffer = Buffer.from([3, 1, 2, 3, 4])
      expect(AccountDecoder.verifyDiscriminator(buffer, 'USER_STATS')).toBe(true)
    })

    it('should return false for wrong discriminator', () => {
      const buffer = Buffer.from([5, 1, 2, 3, 4])
      expect(AccountDecoder.verifyDiscriminator(buffer, 'FACTORY')).toBe(false)
    })

    it('should return false for empty buffer', () => {
      const buffer = Buffer.from([])
      expect(AccountDecoder.verifyDiscriminator(buffer, 'FACTORY')).toBe(false)
    })
  })
})
