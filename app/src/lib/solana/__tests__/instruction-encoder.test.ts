/**
 * InstructionEncoder Tests
 */

import { PublicKey, SystemProgram } from '@solana/web3.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { InstructionEncoder } from '../instruction-encoder'

describe('instructionEncoder', () => {
  let encoder: InstructionEncoder
  let programId: PublicKey
  let testAccounts: {
    factory: PublicKey
    market: PublicKey
    creator: PublicKey
    user: PublicKey
    participant: PublicKey
    resolver: PublicKey
    platform: PublicKey
  }

  beforeEach(() => {
    programId = new PublicKey('11111111111111111111111111111111')
    encoder = new InstructionEncoder(programId)

    testAccounts = {
      factory: new PublicKey('11111111111111111111111111111112'),
      market: new PublicKey('11111111111111111111111111111113'),
      creator: new PublicKey('11111111111111111111111111111114'),
      user: new PublicKey('11111111111111111111111111111115'),
      participant: new PublicKey('11111111111111111111111111111116'),
      resolver: new PublicKey('11111111111111111111111111111117'),
      platform: new PublicKey('2xUfnnyizenM7a9jWHtgxdCWCTE11afRUhX5YeFSrVTn'),
    }
  })

  describe('createMarket', () => {
    it('should encode createMarket instruction with valid parameters', () => {
      const params = {
        matchId: 'match_123',
        entryFee: BigInt(1000000000), // 1 SOL
        kickoffTime: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
        endTime: BigInt(Math.floor(Date.now() / 1000) + 7200), // 2 hours from now
        isPublic: true,
      }

      const instruction = encoder.createMarket(params, {
        factory: testAccounts.factory,
        market: testAccounts.market,
        creator: testAccounts.creator,
        systemProgram: SystemProgram.programId,
      })

      expect(instruction).toBeDefined()
      expect(instruction.programId).toEqual(programId)
      expect(instruction.keys.length).toBe(4)
      expect(instruction.data.length).toBeGreaterThan(8) // Discriminator + data
    })

    it('should set correct account metas for createMarket', () => {
      const params = {
        matchId: 'match_123',
        entryFee: BigInt(1000000000),
        kickoffTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
        endTime: BigInt(Math.floor(Date.now() / 1000) + 7200),
        isPublic: true,
      }

      const instruction = encoder.createMarket(params, {
        factory: testAccounts.factory,
        market: testAccounts.market,
        creator: testAccounts.creator,
        systemProgram: SystemProgram.programId,
      })

      // Factory: writable, not signer
      expect(instruction.keys[0].pubkey).toEqual(testAccounts.factory)
      expect(instruction.keys[0].isWritable).toBe(true)
      expect(instruction.keys[0].isSigner).toBe(false)

      // Market: writable, not signer
      expect(instruction.keys[1].pubkey).toEqual(testAccounts.market)
      expect(instruction.keys[1].isWritable).toBe(true)
      expect(instruction.keys[1].isSigner).toBe(false)

      // Creator: writable, signer
      expect(instruction.keys[2].pubkey).toEqual(testAccounts.creator)
      expect(instruction.keys[2].isWritable).toBe(true)
      expect(instruction.keys[2].isSigner).toBe(true)

      // System program: not writable, not signer
      expect(instruction.keys[3].pubkey).toEqual(SystemProgram.programId)
      expect(instruction.keys[3].isWritable).toBe(false)
      expect(instruction.keys[3].isSigner).toBe(false)
    })

    it('should handle private market creation', () => {
      const params = {
        matchId: 'private_match',
        entryFee: BigInt(500000000),
        kickoffTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
        endTime: BigInt(Math.floor(Date.now() / 1000) + 7200),
        isPublic: false,
      }

      const instruction = encoder.createMarket(params, {
        factory: testAccounts.factory,
        market: testAccounts.market,
        creator: testAccounts.creator,
        systemProgram: SystemProgram.programId,
      })

      expect(instruction).toBeDefined()
      expect(instruction.data.length).toBeGreaterThan(8)
    })
  })

  describe('joinMarket', () => {
    it('should encode joinMarket instruction with HOME prediction', () => {
      const params = { prediction: 0 } // HOME

      const instruction = encoder.joinMarket(params, {
        market: testAccounts.market,
        participant: testAccounts.participant,
        user: testAccounts.user,
        systemProgram: SystemProgram.programId,
      })

      expect(instruction).toBeDefined()
      expect(instruction.programId).toEqual(programId)
      expect(instruction.keys.length).toBe(4)
      expect(instruction.data.length).toBeGreaterThan(8)
    })

    it('should encode joinMarket instruction with DRAW prediction', () => {
      const params = { prediction: 1 } // DRAW

      const instruction = encoder.joinMarket(params, {
        market: testAccounts.market,
        participant: testAccounts.participant,
        user: testAccounts.user,
        systemProgram: SystemProgram.programId,
      })

      expect(instruction).toBeDefined()
    })

    it('should encode joinMarket instruction with AWAY prediction', () => {
      const params = { prediction: 2 } // AWAY

      const instruction = encoder.joinMarket(params, {
        market: testAccounts.market,
        participant: testAccounts.participant,
        user: testAccounts.user,
        systemProgram: SystemProgram.programId,
      })

      expect(instruction).toBeDefined()
    })

    it('should set correct account metas for joinMarket', () => {
      const params = { prediction: 0 }

      const instruction = encoder.joinMarket(params, {
        market: testAccounts.market,
        participant: testAccounts.participant,
        user: testAccounts.user,
        systemProgram: SystemProgram.programId,
      })

      // Market: writable, not signer
      expect(instruction.keys[0].pubkey).toEqual(testAccounts.market)
      expect(instruction.keys[0].isWritable).toBe(true)
      expect(instruction.keys[0].isSigner).toBe(false)

      // Participant: writable, not signer
      expect(instruction.keys[1].pubkey).toEqual(testAccounts.participant)
      expect(instruction.keys[1].isWritable).toBe(true)
      expect(instruction.keys[1].isSigner).toBe(false)

      // User: writable, signer
      expect(instruction.keys[2].pubkey).toEqual(testAccounts.user)
      expect(instruction.keys[2].isWritable).toBe(true)
      expect(instruction.keys[2].isSigner).toBe(true)

      // System program: not writable, not signer
      expect(instruction.keys[3].pubkey).toEqual(SystemProgram.programId)
      expect(instruction.keys[3].isWritable).toBe(false)
      expect(instruction.keys[3].isSigner).toBe(false)
    })
  })

  describe('resolveMarket', () => {
    it('should encode resolveMarket instruction with HOME outcome', () => {
      const params = { outcome: 0 } // HOME

      const instruction = encoder.resolveMarket(params, {
        market: testAccounts.market,
        resolver: testAccounts.resolver,
        creator: testAccounts.creator,
        platform: testAccounts.platform,
      })

      expect(instruction).toBeDefined()
      expect(instruction.programId).toEqual(programId)
      expect(instruction.keys.length).toBe(4)
      expect(instruction.data.length).toBeGreaterThan(8)
    })

    it('should encode resolveMarket instruction with DRAW outcome', () => {
      const params = { outcome: 1 } // DRAW

      const instruction = encoder.resolveMarket(params, {
        market: testAccounts.market,
        resolver: testAccounts.resolver,
        creator: testAccounts.creator,
        platform: testAccounts.platform,
      })

      expect(instruction).toBeDefined()
    })

    it('should encode resolveMarket instruction with AWAY outcome', () => {
      const params = { outcome: 2 } // AWAY

      const instruction = encoder.resolveMarket(params, {
        market: testAccounts.market,
        resolver: testAccounts.resolver,
        creator: testAccounts.creator,
        platform: testAccounts.platform,
      })

      expect(instruction).toBeDefined()
    })

    it('should set correct account metas for resolveMarket', () => {
      const params = { outcome: 0 }

      const instruction = encoder.resolveMarket(params, {
        market: testAccounts.market,
        resolver: testAccounts.resolver,
        creator: testAccounts.creator,
        platform: testAccounts.platform,
      })

      // Market: writable, not signer
      expect(instruction.keys[0].pubkey).toEqual(testAccounts.market)
      expect(instruction.keys[0].isWritable).toBe(true)
      expect(instruction.keys[0].isSigner).toBe(false)

      // Resolver: not writable, signer
      expect(instruction.keys[1].pubkey).toEqual(testAccounts.resolver)
      expect(instruction.keys[1].isWritable).toBe(false)
      expect(instruction.keys[1].isSigner).toBe(true)

      // Creator: writable, not signer
      expect(instruction.keys[2].pubkey).toEqual(testAccounts.creator)
      expect(instruction.keys[2].isWritable).toBe(true)
      expect(instruction.keys[2].isSigner).toBe(false)

      // Platform: writable, not signer
      expect(instruction.keys[3].pubkey).toEqual(testAccounts.platform)
      expect(instruction.keys[3].isWritable).toBe(true)
      expect(instruction.keys[3].isSigner).toBe(false)
    })
  })

  describe('withdraw', () => {
    it('should encode withdraw instruction', () => {
      const instruction = encoder.withdraw({
        market: testAccounts.market,
        participant: testAccounts.participant,
        user: testAccounts.user,
        systemProgram: SystemProgram.programId,
      })

      expect(instruction).toBeDefined()
      expect(instruction.programId).toEqual(programId)
      expect(instruction.keys.length).toBe(4)
      // Withdraw only has discriminator (8 bytes), no additional data
      expect(instruction.data.length).toBe(8)
    })

    it('should set correct account metas for withdraw', () => {
      const instruction = encoder.withdraw({
        market: testAccounts.market,
        participant: testAccounts.participant,
        user: testAccounts.user,
        systemProgram: SystemProgram.programId,
      })

      // Market: writable, not signer
      expect(instruction.keys[0].pubkey).toEqual(testAccounts.market)
      expect(instruction.keys[0].isWritable).toBe(true)
      expect(instruction.keys[0].isSigner).toBe(false)

      // Participant: writable, not signer
      expect(instruction.keys[1].pubkey).toEqual(testAccounts.participant)
      expect(instruction.keys[1].isWritable).toBe(true)
      expect(instruction.keys[1].isSigner).toBe(false)

      // User: writable, signer
      expect(instruction.keys[2].pubkey).toEqual(testAccounts.user)
      expect(instruction.keys[2].isWritable).toBe(true)
      expect(instruction.keys[2].isSigner).toBe(true)

      // System program: not writable, not signer
      expect(instruction.keys[3].pubkey).toEqual(SystemProgram.programId)
      expect(instruction.keys[3].isWritable).toBe(false)
      expect(instruction.keys[3].isSigner).toBe(false)
    })
  })

  describe('discriminators', () => {
    it('should use different discriminators for each instruction', () => {
      const createInstruction = encoder.createMarket(
        {
          matchId: 'test',
          entryFee: BigInt(1000000000),
          kickoffTime: BigInt(Math.floor(Date.now() / 1000) + 3600),
          endTime: BigInt(Math.floor(Date.now() / 1000) + 7200),
          isPublic: true,
        },
        {
          factory: testAccounts.factory,
          market: testAccounts.market,
          creator: testAccounts.creator,
          systemProgram: SystemProgram.programId,
        },
      )

      const joinInstruction = encoder.joinMarket(
        { prediction: 0 },
        {
          market: testAccounts.market,
          participant: testAccounts.participant,
          user: testAccounts.user,
          systemProgram: SystemProgram.programId,
        },
      )

      const resolveInstruction = encoder.resolveMarket(
        { outcome: 0 },
        {
          market: testAccounts.market,
          resolver: testAccounts.resolver,
          creator: testAccounts.creator,
          platform: testAccounts.platform,
        },
      )

      const withdrawInstruction = encoder.withdraw({
        market: testAccounts.market,
        participant: testAccounts.participant,
        user: testAccounts.user,
        systemProgram: SystemProgram.programId,
      })

      // First 8 bytes should be different for each instruction
      const createDiscriminator = createInstruction.data.slice(0, 8).toString('hex')
      const joinDiscriminator = joinInstruction.data.slice(0, 8).toString('hex')
      const resolveDiscriminator = resolveInstruction.data.slice(0, 8).toString('hex')
      const withdrawDiscriminator = withdrawInstruction.data.slice(0, 8).toString('hex')

      expect(createDiscriminator).not.toBe(joinDiscriminator)
      expect(createDiscriminator).not.toBe(resolveDiscriminator)
      expect(createDiscriminator).not.toBe(withdrawDiscriminator)
      expect(joinDiscriminator).not.toBe(resolveDiscriminator)
      expect(joinDiscriminator).not.toBe(withdrawDiscriminator)
      expect(resolveDiscriminator).not.toBe(withdrawDiscriminator)
    })
  })
})
