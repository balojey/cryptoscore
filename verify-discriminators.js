#!/usr/bin/env node
/**
 * Verify that instruction discriminators match Anchor's expectations
 */

const crypto = require('crypto')

function getDiscriminator(name) {
  const hash = crypto.createHash('sha256')
  hash.update(`global:${name}`)
  return Array.from(hash.digest().subarray(0, 8))
}

console.log('Anchor Instruction Discriminators:')
console.log('===================================\n')

const instructions = [
  'initialize_market',
  'join_market',
  'resolve_market',
  'withdraw_rewards',
]

instructions.forEach((name) => {
  const disc = getDiscriminator(name)
  console.log(`${name}:`)
  console.log(`  Decimal: [${dis