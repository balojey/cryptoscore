/**
 * Borsh Schemas - Type definitions for instruction serialization
 * 
 * Defines Borsh schemas for all program instructions.
 */

// Data classes for serialization (must be declared before schemas)
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

export class JoinMarketData {
  prediction: number

  constructor(fields: JoinMarketParams) {
    this.prediction = fields.prediction
  }
}

export class ResolveMarketData {
  outcome: number

  constructor(fields: ResolveMarketParams) {
    this.outcome = fields.outcome
  }
}

export class WithdrawData {
  constructor() {}
}

/**
 * Schema for CreateMarket instruction
 */
export const CreateMarketSchema = new Map<any, any>([
  [
    CreateMarketData,
    {
      kind: 'struct',
      fields: [
        ['matchId', 'string'],
        ['entryFee', 'u64'],
        ['kickoffTime', 'u64'],
        ['endTime', 'u64'],
        ['isPublic', 'bool'],
      ],
    },
  ],
])

/**
 * Schema for JoinMarket instruction
 */
export const JoinMarketSchema = new Map<any, any>([
  [
    JoinMarketData,
    {
      kind: 'struct',
      fields: [['prediction', 'u8']],
    },
  ],
])

/**
 * Schema for ResolveMarket instruction
 */
export const ResolveMarketSchema = new Map<any, any>([
  [
    ResolveMarketData,
    {
      kind: 'struct',
      fields: [['outcome', 'u8']],
    },
  ],
])

/**
 * Schema for Withdraw instruction (no parameters needed)
 */
export const WithdrawSchema = new Map<any, any>([
  [
    WithdrawData,
    {
      kind: 'struct',
      fields: [],
    },
  ],
])

// Export types for TypeScript
export type CreateMarketParams = {
  matchId: string
  entryFee: bigint
  kickoffTime: bigint
  endTime: bigint
  isPublic: boolean
}

export type JoinMarketParams = {
  prediction: number
}

export type ResolveMarketParams = {
  outcome: number
}
