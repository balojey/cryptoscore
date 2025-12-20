/**
 * Fee Distribution Configuration
 * 
 * Defines fee percentages and platform address for market resolution
 */

// Platform address for fee collection (EVM address format)
export const PLATFORM_ADDRESS = '0x742d35Cc6634C0532925a3b8D4C9db96DfbBb0b1' // Placeholder EVM address

// Fee distribution percentages (in basis points for precision)
export const FEE_DISTRIBUTION = {
  // Creator fee: 2% (200 basis points)
  CREATOR_FEE_BPS: 200,
  
  // Platform fee: 3% (300 basis points)  
  PLATFORM_FEE_BPS: 300,
  
  // Participant pool: 95% (remaining after fees)
  // This is calculated as 10000 - CREATOR_FEE_BPS - PLATFORM_FEE_BPS
  get PARTICIPANT_POOL_BPS() {
    return 10000 - this.CREATOR_FEE_BPS - this.PLATFORM_FEE_BPS
  }
} as const

// Basis points conversion constant
export const BASIS_POINTS_DIVISOR = 10000

/**
 * Fee distribution interface for type safety
 */
export interface FeeDistribution {
  creatorFee: bigint
  platformFee: bigint
  participantPool: bigint
}

/**
 * Calculate fee distribution from total pool amount
 * 
 * @param totalPool - Total pool amount in base units
 * @returns Fee distribution breakdown
 */
export function calculateFeeDistribution(totalPool: bigint): FeeDistribution {
  const creatorFee = (totalPool * BigInt(FEE_DISTRIBUTION.CREATOR_FEE_BPS)) / BigInt(BASIS_POINTS_DIVISOR)
  const platformFee = (totalPool * BigInt(FEE_DISTRIBUTION.PLATFORM_FEE_BPS)) / BigInt(BASIS_POINTS_DIVISOR)
  const participantPool = totalPool - creatorFee - platformFee
  
  return {
    creatorFee,
    platformFee,
    participantPool
  }
}

/**
 * Validate fee distribution percentages
 * Ensures total doesn't exceed 100%
 */
export function validateFeeDistribution(): boolean {
  const totalBps = FEE_DISTRIBUTION.CREATOR_FEE_BPS + FEE_DISTRIBUTION.PLATFORM_FEE_BPS
  return totalBps <= BASIS_POINTS_DIVISOR
}

// Validate configuration on module load
if (!validateFeeDistribution()) {
  throw new Error('Invalid fee distribution configuration: total fees exceed 100%')
}