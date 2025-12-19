/**
 * Fee Calculation Utilities
 * 
 * Provides utilities for calculating and formatting fee distributions
 */

import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { calculateFeeDistribution, type FeeDistribution, PLATFORM_ADDRESS } from '../../config/fees'
import { SolanaUtils } from './utils'

/**
 * Enhanced fee distribution with addresses for transfers
 */
export interface FeeDistributionWithAddresses extends FeeDistribution {
  creatorAddress: PublicKey
  platformAddress: PublicKey
}

/**
 * Calculate fee distribution with target addresses
 * 
 * @param totalPool - Total pool amount in lamports
 * @param creatorAddress - Market creator's address
 * @returns Fee distribution with target addresses
 */
export function calculateFeeDistributionWithAddresses(
  totalPool: bigint,
  creatorAddress: PublicKey
): FeeDistributionWithAddresses {
  const distribution = calculateFeeDistribution(totalPool)
  
  return {
    ...distribution,
    creatorAddress,
    platformAddress: PLATFORM_ADDRESS
  }
}

/**
 * Create transfer instructions for fee distribution
 * 
 * @param fromAddress - Source address (market PDA)
 * @param distribution - Fee distribution with addresses
 * @returns Array of transfer instructions
 */
export function createFeeDistributionInstructions(
  fromAddress: PublicKey,
  distribution: FeeDistributionWithAddresses
): TransactionInstruction[] {
  const instructions: TransactionInstruction[] = []
  
  // Transfer creator fee
  if (distribution.creatorFee > 0n) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: fromAddress,
        toPubkey: distribution.creatorAddress,
        lamports: Number(distribution.creatorFee)
      })
    )
  }
  
  // Transfer platform fee
  if (distribution.platformFee > 0n) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: fromAddress,
        toPubkey: distribution.platformAddress,
        lamports: Number(distribution.platformFee)
      })
    )
  }
  
  return instructions
}

/**
 * Format fee distribution for display
 * 
 * @param distribution - Fee distribution
 * @returns Formatted fee breakdown
 */
export function formatFeeDistribution(distribution: FeeDistribution) {
  return {
    creatorFee: SolanaUtils.formatSol(Number(distribution.creatorFee)),
    platformFee: SolanaUtils.formatSol(Number(distribution.platformFee)),
    participantPool: SolanaUtils.formatSol(Number(distribution.participantPool)),
    total: SolanaUtils.formatSol(
      Number(distribution.creatorFee + distribution.platformFee + distribution.participantPool)
    )
  }
}

/**
 * Validate fee distribution amounts
 * 
 * @param distribution - Fee distribution to validate
 * @param totalPool - Expected total pool amount
 * @returns True if distribution is valid
 */
export function validateFeeDistributionAmounts(
  distribution: FeeDistribution,
  totalPool: bigint
): boolean {
  const calculatedTotal = distribution.creatorFee + distribution.platformFee + distribution.participantPool
  return calculatedTotal === totalPool
}

/**
 * Get fee distribution summary for logging
 * 
 * @param distribution - Fee distribution
 * @returns Summary object for logging
 */
export function getFeeDistributionSummary(distribution: FeeDistributionWithAddresses) {
  return {
    creatorFee: {
      amount: SolanaUtils.formatSol(Number(distribution.creatorFee)),
      address: distribution.creatorAddress.toBase58()
    },
    platformFee: {
      amount: SolanaUtils.formatSol(Number(distribution.platformFee)),
      address: distribution.platformAddress.toBase58()
    },
    participantPool: {
      amount: SolanaUtils.formatSol(Number(distribution.participantPool))
    }
  }
}