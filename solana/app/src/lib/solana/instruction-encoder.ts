/**
 * InstructionEncoder - Encodes instruction data using Borsh serialization
 * 
 * Provides methods for encoding all program instructions with proper discriminators.
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

// Instruction discriminators (8-byte identifiers)
const DISCRIMINATORS = {
  CREATE_MARKET: Buffer.from([0, 0, 0, 0, 0, 0, 0, 0]),
  JOIN_MARKET: Buffer.from([1, 0, 0, 0, 0, 0, 0, 0]),
  RESOLVE_MARKET: Buffer.from([2, 0, 0, 0, 0, 0, 0, 0]),
  WITHDRAW: Buffer.from([3, 0, 0, 0, 0, 0, 0, 0]),
}

export class InstructionEncoder {
  private programId: PublicKey

  constructor(programId: PublicKey) {
    this.programId = programId
  }

  /**
   * Encode CreateMarket instruction
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
      Buffer.from(serialize(CreateMarketSchema as unknown as Schema, instructionData)),
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
      Buffer.from(serialize(JoinMarketSchema as unknown as Schema, instructionData)),
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
      Buffer.from(serialize(ResolveMarketSchema as unknown as Schema, instructionData)),
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
   */
  withdraw(accounts: {
    market: PublicKey
    participant: PublicKey
    user: PublicKey
    systemProgram: PublicKey
  }): TransactionInstruction {
    const instructionData = new WithdrawData()
    const data = Buffer.concat([
      DISCRIMINATORS.WITHDRAW,
      Buffer.from(serialize(WithdrawSchema as unknown as Schema, instructionData)),
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
}
