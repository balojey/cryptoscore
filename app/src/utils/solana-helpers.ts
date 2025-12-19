/**
 * Solana Program Helper Utilities
 * Provides type-safe wrappers for interacting with CryptoScore Solana programs
 *
 * NOTE: This file contains legacy Anchor-based helpers.
 * For new code, use the Anchor-free utilities in lib/solana/
 */

import type { Market, MarketDashboardInfo } from '../types'
import { PublicKey } from '@solana/web3.js'
import {
  DASHBOARD_PROGRAM_ID,
  FACTORY_PROGRAM_ID,
  MARKET_PROGRAM_ID,
} from '../config/programs'

/**
 * Market Status enum matching Solana program
 */
export enum MarketStatus {
  Open = 0,
  Live = 1,
  Resolved = 2,
  Cancelled = 3,
}

/**
 * Match Outcome enum matching Solana program
 */
export enum MatchOutcome {
  Home = 0,
  Draw = 1,
  Away = 2,
}

/**
 * Sort options for market queries
 */
export enum SortOption {
  CreationTime = 0,
  PoolSize = 1,
  ParticipantCount = 2,
  EndingSoon = 3,
}

/**
 * DEPRECATED: Use PDAUtils from lib/solana/pda-utils.ts instead
 * These Anchor-based program helpers are no longer needed
 */

/**
 * Derive Factory PDA
 */
export function getFactoryPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('factory')],
    new PublicKey(FACTORY_PROGRAM_ID),
  )
}

/**
 * Derive Market PDA
 */
export function getMarketPDA(factory: PublicKey, marketCount: number): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('market'),
      factory.toBuffer(),
      Buffer.from(marketCount.toString()),
    ],
    new PublicKey(MARKET_PROGRAM_ID),
  )
}

/**
 * Derive Market Registry PDA
 */
export function getMarketRegistryPDA(factory: PublicKey, marketAddress: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('market_registry'),
      factory.toBuffer(),
      marketAddress.toBuffer(),
    ],
    new PublicKey(FACTORY_PROGRAM_ID),
  )
}

/**
 * Derive Participant PDA
 */
export function getParticipantPDA(market: PublicKey, user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('participant'),
      market.toBuffer(),
      user.toBuffer(),
    ],
    new PublicKey(MARKET_PROGRAM_ID),
  )
}

/**
 * Derive User Stats PDA
 */
export function getUserStatsPDA(user: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('user_stats'),
      user.toBuffer(),
    ],
    new PublicKey(DASHBOARD_PROGRAM_ID),
  )
}

/**
 * Transform MarketSummary from Dashboard to Market type
 */
export function transformMarketSummary(summary: any): Market {
  return {
    marketAddress: summary.marketAddress.toString(),
    matchId: BigInt(summary.matchId),
    creator: summary.creator.toString(),
    entryFee: BigInt(summary.entryFee.toString()),
    resolved: summary.status === MarketStatus.Resolved,
    participantsCount: BigInt(summary.participantCount),
    isPublic: summary.isPublic,
    startTime: BigInt(summary.kickoffTime.toString()),
    homeCount: BigInt(summary.homeCount),
    awayCount: BigInt(summary.awayCount),
    drawCount: BigInt(summary.drawCount),
  }
}

/**
 * Transform MarketDetails from Dashboard to MarketDashboardInfo type
 */
export function transformMarketDetails(details: any): MarketDashboardInfo {
  return {
    marketAddress: details.marketAddress.toString(),
    matchId: BigInt(details.matchId),
    creator: details.creator.toString(),
    entryFee: BigInt(details.entryFee.toString()),
    resolved: details.status === MarketStatus.Resolved,
    winner: details.outcome ?? 0,
    participantsCount: BigInt(details.participantCount),
    isPublic: details.isPublic,
    startTime: BigInt(details.kickoffTime.toString()),
    homeCount: BigInt(details.homeCount),
    awayCount: BigInt(details.awayCount),
    drawCount: BigInt(details.drawCount),
  }
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSOL(lamports: bigint | number): number {
  return Number(lamports) / 1_000_000_000
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.floor(sol * 1_000_000_000))
}

/**
 * Calculate pool size in SOL
 */
export function calculatePoolSize(entryFee: bigint, participantCount: bigint): number {
  return lamportsToSOL(entryFee * participantCount)
}

/**
 * Calculate prediction distribution percentages
 */
export function calculateDistribution(homeCount: bigint, drawCount: bigint, awayCount: bigint) {
  const total = Number(homeCount) + Number(drawCount) + Number(awayCount)

  if (total === 0) {
    return { homePercent: 0, drawPercent: 0, awayPercent: 0 }
  }

  return {
    homePercent: (Number(homeCount) / total) * 100,
    drawPercent: (Number(drawCount) / total) * 100,
    awayPercent: (Number(awayCount) / total) * 100,
  }
}

/**
 * Check if market is open for joining
 */
export function isMarketOpen(market: Market): boolean {
  const now = Math.floor(Date.now() / 1000)
  const startTime = Number(market.startTime)
  return !market.resolved && startTime > now
}

/**
 * Check if market is live (started but not resolved)
 */
export function isMarketLive(market: Market): boolean {
  const now = Math.floor(Date.now() / 1000)
  const startTime = Number(market.startTime)
  return !market.resolved && startTime <= now
}

/**
 * Get market status string
 */
export function getMarketStatusString(market: Market): string {
  if (market.resolved)
    return 'Resolved'
  if (isMarketLive(market))
    return 'Live'
  if (isMarketOpen(market))
    return 'Open'
  return 'Unknown'
}

/**
 * Get time until market starts (in seconds)
 */
export function getTimeUntilStart(market: Market): number {
  const now = Math.floor(Date.now() / 1000)
  const startTime = Number(market.startTime)
  return Math.max(0, startTime - now)
}

/**
 * Check if market is ending soon (< 24 hours)
 */
export function isEndingSoon(market: Market): boolean {
  const timeUntilStart = getTimeUntilStart(market)
  const hoursUntilStart = timeUntilStart / 3600
  return hoursUntilStart > 0 && hoursUntilStart < 24
}

/**
 * Format match outcome to string
 */
export function formatOutcome(outcome: number): string {
  switch (outcome) {
    case MatchOutcome.Home:
      return 'HOME'
    case MatchOutcome.Draw:
      return 'DRAW'
    case MatchOutcome.Away:
      return 'AWAY'
    default:
      return 'UNKNOWN'
  }
}

/**
 * Parse match outcome from string
 */
export function parseOutcome(outcome: string): MatchOutcome {
  switch (outcome.toUpperCase()) {
    case 'HOME':
      return MatchOutcome.Home
    case 'DRAW':
      return MatchOutcome.Draw
    case 'AWAY':
      return MatchOutcome.Away
    default:
      throw new Error(`Invalid outcome: ${outcome}`)
  }
}
