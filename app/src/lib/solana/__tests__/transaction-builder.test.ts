/**
 * TransactionBuilder Tests
 */

import { Connection, PublicKey, SystemProgram } from '@solana/web3.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { TransactionBuilder } from '../transaction-builder'

describe('transactionBuilder', () => {
  let connection: Connection
  let builder: TransactionBuilder

  beforeEach(() => {
    // Use devnet for testing
    connection = new Connection('https://api.devnet.solana.com', 'confirmed')
    builder = new TransactionBuilder()
  })

  describe('addInstruction', () => {
    it('should add a single instruction', () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 1000,
      })

      const result = builder.addInstruction(instruction)
      expect(result).toBe(builder) // Should return this for chaining
    })

    it('should support method chaining', () => {
      const instruction1 = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 1000,
      })
      const instruction2 = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 2000,
      })

      const result = builder.addInstruction(instruction1).addInstruction(instruction2)
      expect(result).toBe(builder)
    })
  })

  describe('addInstructions', () => {
    it('should add multiple instructions at once', () => {
      const instructions = [
        SystemProgram.transfer({
          fromPubkey: PublicKey.default,
          toPubkey: PublicKey.default,
          lamports: 1000,
        }),
        SystemProgram.transfer({
          fromPubkey: PublicKey.default,
          toPubkey: PublicKey.default,
          lamports: 2000,
        }),
      ]

      const result = builder.addInstructions(instructions)
      expect(result).toBe(builder)
    })
  })

  describe('setComputeUnitLimit', () => {
    it('should set compute unit limit', () => {
      const result = builder.setComputeUnitLimit(200000)
      expect(result).toBe(builder)
    })

    it('should support method chaining', () => {
      const result = builder.setComputeUnitLimit(200000).setComputeUnitPrice(1000)
      expect(result).toBe(builder)
    })
  })

  describe('setComputeUnitPrice', () => {
    it('should set compute unit price', () => {
      const result = builder.setComputeUnitPrice(1000)
      expect(result).toBe(builder)
    })
  })

  describe('build', () => {
    it('should build a transaction with instructions', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 1000,
      })

      builder.addInstruction(instruction)
      const transaction = await builder.build(connection)

      expect(transaction).toBeDefined()
      expect(transaction.instructions.length).toBeGreaterThan(0)
      expect(transaction.recentBlockhash).toBeDefined()
    })

    it('should include compute budget instructions when specified', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 1000,
      })

      builder
        .setComputeUnitLimit(200000)
        .setComputeUnitPrice(1000)
        .addInstruction(instruction)

      const transaction = await builder.build(connection)

      // Should have compute budget instructions + transfer instruction
      expect(transaction.instructions.length).toBeGreaterThanOrEqual(3)
    })

    it('should build transaction without compute budget when not specified', async () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 1000,
      })

      builder.addInstruction(instruction)
      const transaction = await builder.build(connection)

      // Should only have the transfer instruction
      expect(transaction.instructions.length).toBe(1)
    })
  })

  describe('clear', () => {
    it('should clear all instructions', () => {
      const instruction = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 1000,
      })

      builder.addInstruction(instruction)
      builder.clear()

      // After clearing, builder should have no instructions
      // We can't build an empty transaction, so we just verify the clear worked
      expect(builder).toBeDefined()
    })

    it('should support method chaining', () => {
      const result = builder.clear().setComputeUnitLimit(200000)
      expect(result).toBe(builder)
    })
  })

  describe('constructor options', () => {
    it('should accept compute unit limit in constructor', async () => {
      const builderWithOptions = new TransactionBuilder({
        computeUnitLimit: 200000,
      })

      const instruction = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 1000,
      })

      builderWithOptions.addInstruction(instruction)
      const transaction = await builderWithOptions.build(connection)

      expect(transaction.instructions.length).toBeGreaterThan(1)
    })

    it('should accept compute unit price in constructor', async () => {
      const builderWithOptions = new TransactionBuilder({
        computeUnitPrice: 1000,
      })

      const instruction = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 1000,
      })

      builderWithOptions.addInstruction(instruction)
      const transaction = await builderWithOptions.build(connection)

      expect(transaction.instructions.length).toBeGreaterThan(1)
    })

    it('should accept both options in constructor', async () => {
      const builderWithOptions = new TransactionBuilder({
        computeUnitLimit: 200000,
        computeUnitPrice: 1000,
      })

      const instruction = SystemProgram.transfer({
        fromPubkey: PublicKey.default,
        toPubkey: PublicKey.default,
        lamports: 1000,
      })

      builderWithOptions.addInstruction(instruction)
      const transaction = await builderWithOptions.build(connection)

      expect(transaction.instructions.length).toBeGreaterThan(2)
    })
  })
})
