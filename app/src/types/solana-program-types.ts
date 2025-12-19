/**
 * Solana Program Types - TypeScript interfaces for program accounts
 *
 * Defines all types used in the Solana program integration.
 */

import type { PublicKey } from '@solana/web3.js'

/**
 * Market status enum
 */
export enum MarketStatus {
  Open = 0,
  Live = 1,
  Resolved = 2,
  Cancelled = 3,
}

/**
 * Match outcome enum
 * Note: Must match Rust enum order (0-indexed)
 */
export enum MatchOutcome {
  Home = 0,
  Draw = 1,
  Away = 2,
}

/**
 * Prediction choice enum
 * Note: Must match Rust enum order (0-indexed)
 */
export enum PredictionChoice {
  Home = 0,
  Draw = 1,
  Away = 2,
}

/**
 * Factory account interface
 */
export interface Factory {
  authority: PublicKey
  marketCount: bigint
  totalVolume: bigint
}

/**
 * Market account interface
 */
export interface Market {
  factory: PublicKey
  creator: PublicKey
  matchId: string
  entryFee: bigint
  kickoffTime: bigint
  endTime: bigint
  isPublic: boolean
  status: MarketStatus
  outcome: MatchOutcome
  totalPool: bigint
  participantCount: bigint
  homeCount: bigint
  drawCount: bigint
  awayCount: bigint
}

/**
 * Participant account interface
 */
export interface Participant {
  market: PublicKey
  user: PublicKey
  prediction: PredictionChoice
  hasWithdrawn: boolean
  joinedAt: bigint
}

/**
 * UserStats account interface
 */
export interface UserStats {
  user: PublicKey
  totalMarkets: bigint
  totalWins: bigint
  totalEarnings: bigint
  currentStreak: bigint
}

/**
 * Parameters for creating a market
 */
export interface CreateMarketParams {
  matchId: string
  entryFee: bigint
  kickoffTime: bigint
  endTime: bigint
  isPublic: boolean
}

/**
 * Parameters for joining a market
 */
export interface JoinMarketParams {
  prediction: PredictionChoice
}

/**
 * Parameters for resolving a market
 */
export interface ResolveMarketParams {
  outcome: MatchOutcome
}

/**
 * Market with address (for UI display)
 */
export interface MarketWithAddress extends Market {
  address: PublicKey
}

/**
 * Participant with address (for UI display)
 */
export interface ParticipantWithAddress extends Participant {
  address: PublicKey
}
