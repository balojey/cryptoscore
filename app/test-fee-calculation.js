// Simple test for fee calculation
const { calculateFeeDistribution, FEE_DISTRIBUTION, BASIS_POINTS_DIVISOR } = require('./src/config/fees.ts')

// Test with 1 SOL (1,000,000,000 lamports)
const totalPool = BigInt(1_000_000_000)

console.log('Testing fee distribution with 1 SOL pool:')
console.log('Total pool:', totalPool.toString(), 'lamports')

const distribution = calculateFeeDistribution(totalPool)

console.log('Creator fee (2%):', distribution.creatorFee.toString(), 'lamports')
console.log('Platform fee (3%):', distribution.platformFee.toString(), 'lamports') 
console.log('Participant pool (95%):', distribution.participantPool.toString(), 'lamports')

// Verify totals add up
const total = distribution.creatorFee + distribution.platformFee + distribution.participantPool
console.log('Total calculated:', total.toString(), 'lamports')
console.log('Matches original pool:', total === totalPool)

// Convert to SOL for readability
console.log('\nIn SOL:')
console.log('Creator fee:', Number(distribution.creatorFee) / 1_000_000_000, 'SOL')
console.log('Platform fee:', Number(distribution.platformFee) / 1_000_000_000, 'SOL')
console.log('Participant pool:', Number(distribution.participantPool) / 1_000_000_000, 'SOL')