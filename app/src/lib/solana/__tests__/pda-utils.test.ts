/**
 * PDAUtils Tests
 */

import { PublicKey } from '@solana/web3.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { PDAUtils } from '../pda-utils'

describe('pDAUtils', () => {
  let pdaUtils: PDAUtils
  let programId: PublicKey

  beforeEach(() => {
    programId = new PublicKey('11111111111111111111111111111111')
    pdaUtils = new PDAUtils(programId)
  })

  describe('findFactoryPDA', () => {
    it('should derive factory PDA', async () => {
      const result = await pdaUtils.findFactoryPDA()

      expect(result).toBeDefined()
      expect(result.pda).toBeInstanceOf(PublicKey)
      expect(result.bump).toBeGreaterThanOrEqual(0)
      expect(result.bump).toBeLessThanOrEqual(255)
    })

    it('should derive same PDA for same program ID', async () => {
      const result1 = await pdaUtils.findFactoryPDA()
      const result2 = await pdaUtils.findFactoryPDA()

      expect(result1.pda.toString()).toBe(result2.pda.toString())
      expect(result1.bump).toBe(result2.bump)
    })

    it('should derive different PDA for different program ID', async () => {
      const otherProgramId = new PublicKey('11111111111111111111111111111112')
      const otherPdaUtils = new PDAUtils(otherProgramId)

      const result1 = await pdaUtils.findFactoryPDA()
      const result2 = await otherPdaUtils.findFactoryPDA()

      expect(result1.pda.toString()).not.toBe(result2.pda.toString())
    })
  })

  describe('findMarketPDA', () => {
    it('should derive market PDA with factory and match ID', async () => {
      const factory = new PublicKey('11111111111111111111111111111112')
      const matchId = 'match_123'

      const result = await pdaUtils.findMarketPDA(factory, matchId)

      expect(result).toBeDefined()
      expect(result.pda).toBeInstanceOf(PublicKey)
      expect(result.bump).toBeGreaterThanOrEqual(0)
      expect(result.bump).toBeLessThanOrEqual(255)
    })

    it('should derive same PDA for same inputs', async () => {
      const factory = new PublicKey('11111111111111111111111111111112')
      const matchId = 'match_123'

      const result1 = await pdaUtils.findMarketPDA(factory, matchId)
      const result2 = await pdaUtils.findMarketPDA(factory, matchId)

      expect(result1.pda.toString()).toBe(result2.pda.toString())
      expect(result1.bump).toBe(result2.bump)
    })

    it('should derive different PDA for different match IDs', async () => {
      const factory = new PublicKey('11111111111111111111111111111112')

      const result1 = await pdaUtils.findMarketPDA(factory, 'match_123')
      const result2 = await pdaUtils.findMarketPDA(factory, 'match_456')

      expect(result1.pda.toString()).not.toBe(result2.pda.toString())
    })

    it('should derive different PDA for different factories', async () => {
      const factory1 = new PublicKey('11111111111111111111111111111112')
      const factory2 = new PublicKey('11111111111111111111111111111113')
      const matchId = 'match_123'

      const result1 = await pdaUtils.findMarketPDA(factory1, matchId)
      const result2 = await pdaUtils.findMarketPDA(factory2, matchId)

      expect(result1.pda.toString()).not.toBe(result2.pda.toString())
    })

    it('should handle long match IDs within limits', async () => {
      const factory = new PublicKey('11111111111111111111111111111112')
      // Use a reasonable length match ID (Solana has max seed length of 32 bytes per seed)
      const longMatchId = `match_${'a'.repeat(20)}`

      const result = await pdaUtils.findMarketPDA(factory, longMatchId)

      expect(result).toBeDefined()
      expect(result.pda).toBeInstanceOf(PublicKey)
    })
  })

  describe('findParticipantPDA', () => {
    it('should derive participant PDA with market and user', async () => {
      const market = new PublicKey('11111111111111111111111111111112')
      const user = new PublicKey('11111111111111111111111111111113')

      const result = await pdaUtils.findParticipantPDA(market, user)

      expect(result).toBeDefined()
      expect(result.pda).toBeInstanceOf(PublicKey)
      expect(result.bump).toBeGreaterThanOrEqual(0)
      expect(result.bump).toBeLessThanOrEqual(255)
    })

    it('should derive same PDA for same inputs', async () => {
      const market = new PublicKey('11111111111111111111111111111112')
      const user = new PublicKey('11111111111111111111111111111113')

      const result1 = await pdaUtils.findParticipantPDA(market, user)
      const result2 = await pdaUtils.findParticipantPDA(market, user)

      expect(result1.pda.toString()).toBe(result2.pda.toString())
      expect(result1.bump).toBe(result2.bump)
    })

    it('should derive different PDA for different users', async () => {
      const market = new PublicKey('11111111111111111111111111111112')
      const user1 = new PublicKey('11111111111111111111111111111113')
      const user2 = new PublicKey('11111111111111111111111111111114')

      const result1 = await pdaUtils.findParticipantPDA(market, user1)
      const result2 = await pdaUtils.findParticipantPDA(market, user2)

      expect(result1.pda.toString()).not.toBe(result2.pda.toString())
    })

    it('should derive different PDA for different markets', async () => {
      const market1 = new PublicKey('11111111111111111111111111111112')
      const market2 = new PublicKey('11111111111111111111111111111113')
      const user = new PublicKey('11111111111111111111111111111114')

      const result1 = await pdaUtils.findParticipantPDA(market1, user)
      const result2 = await pdaUtils.findParticipantPDA(market2, user)

      expect(result1.pda.toString()).not.toBe(result2.pda.toString())
    })
  })

  describe('findUserStatsPDA', () => {
    it('should derive user stats PDA', async () => {
      const user = new PublicKey('11111111111111111111111111111113')

      const result = await pdaUtils.findUserStatsPDA(user)

      expect(result).toBeDefined()
      expect(result.pda).toBeInstanceOf(PublicKey)
      expect(result.bump).toBeGreaterThanOrEqual(0)
      expect(result.bump).toBeLessThanOrEqual(255)
    })

    it('should derive same PDA for same user', async () => {
      const user = new PublicKey('11111111111111111111111111111113')

      const result1 = await pdaUtils.findUserStatsPDA(user)
      const result2 = await pdaUtils.findUserStatsPDA(user)

      expect(result1.pda.toString()).toBe(result2.pda.toString())
      expect(result1.bump).toBe(result2.bump)
    })

    it('should derive different PDA for different users', async () => {
      const user1 = new PublicKey('11111111111111111111111111111113')
      const user2 = new PublicKey('11111111111111111111111111111114')

      const result1 = await pdaUtils.findUserStatsPDA(user1)
      const result2 = await pdaUtils.findUserStatsPDA(user2)

      expect(result1.pda.toString()).not.toBe(result2.pda.toString())
    })
  })

  describe('pDA determinism', () => {
    it('should always derive the same PDAs for the same inputs', async () => {
      const factory = new PublicKey('11111111111111111111111111111112')
      const market = new PublicKey('11111111111111111111111111111113')
      const user = new PublicKey('11111111111111111111111111111114')
      const matchId = 'match_123'

      // Run multiple times to ensure determinism
      const factoryResults = await Promise.all([
        pdaUtils.findFactoryPDA(),
        pdaUtils.findFactoryPDA(),
        pdaUtils.findFactoryPDA(),
      ])

      const marketResults = await Promise.all([
        pdaUtils.findMarketPDA(factory, matchId),
        pdaUtils.findMarketPDA(factory, matchId),
        pdaUtils.findMarketPDA(factory, matchId),
      ])

      const participantResults = await Promise.all([
        pdaUtils.findParticipantPDA(market, user),
        pdaUtils.findParticipantPDA(market, user),
        pdaUtils.findParticipantPDA(market, user),
      ])

      const userStatsResults = await Promise.all([
        pdaUtils.findUserStatsPDA(user),
        pdaUtils.findUserStatsPDA(user),
        pdaUtils.findUserStatsPDA(user),
      ])

      // All factory PDAs should be identical
      expect(factoryResults[0].pda.toString()).toBe(factoryResults[1].pda.toString())
      expect(factoryResults[1].pda.toString()).toBe(factoryResults[2].pda.toString())

      // All market PDAs should be identical
      expect(marketResults[0].pda.toString()).toBe(marketResults[1].pda.toString())
      expect(marketResults[1].pda.toString()).toBe(marketResults[2].pda.toString())

      // All participant PDAs should be identical
      expect(participantResults[0].pda.toString()).toBe(participantResults[1].pda.toString())
      expect(participantResults[1].pda.toString()).toBe(participantResults[2].pda.toString())

      // All user stats PDAs should be identical
      expect(userStatsResults[0].pda.toString()).toBe(userStatsResults[1].pda.toString())
      expect(userStatsResults[1].pda.toString()).toBe(userStatsResults[2].pda.toString())
    })
  })
})
