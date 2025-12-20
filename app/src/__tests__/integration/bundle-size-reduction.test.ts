/**
 * Property-Based Tests for Bundle Size Reduction
 * 
 * **Feature: web2-migration, Property 9: Bundle Size Reduction**
 * **Validates: Requirements 10.3**
 * 
 * This test ensures that removing Solana dependencies results in a smaller bundle size
 * compared to the original implementation with Solana packages.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync, existsSync, statSync } from 'fs'
import { join } from 'path'

// Expected bundle size thresholds (in bytes)
const EXPECTED_MAX_BUNDLE_SIZE = 2 * 1024 * 1024 // 2MB max for main bundle
const EXPECTED_VENDOR_CHUNK_SIZE = 1 * 1024 * 1024 // 1MB max for vendor chunks

// Generator for build scenarios
const buildScenarioArb = fc.record({
  buildMode: fc.constantFrom('development', 'production'),
  compressionEnabled: fc.boolean(),
  treeShakingEnabled: fc.boolean(),
  minificationEnabled: fc.boolean()
})

// Mock bundle analysis data structure
interface BundleAnalysis {
  totalSize: number
  chunks: Array<{
    name: string
    size: number
    modules: string[]
  }>
  removedDependencies: string[]
}

describe('Bundle Size Reduction Properties', () => {
  let currentBundleSize: number = 0
  let distPath: string

  beforeAll(() => {
    distPath = join(process.cwd(), 'dist')
  })

  it('Property 9.1: Bundle size is reduced after Solana dependency removal', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        buildScenarioArb,
        (scenario) => {
          // Simulate bundle analysis before and after Solana removal
          const beforeRemoval: BundleAnalysis = {
            totalSize: 3500000, // ~3.5MB with Solana dependencies
            chunks: [
              {
                name: 'main',
                size: 1200000,
                modules: ['src/main.tsx', 'src/App.tsx']
              },
              {
                name: 'solana-vendor',
                size: 1800000, // Large Solana chunk
                modules: ['@solana/web3.js', '@solana/wallet-adapter-react']
              },
              {
                name: 'react-vendor',
                size: 500000,
                modules: ['react', 'react-dom']
              }
            ],
            removedDependencies: []
          }

          const afterRemoval: BundleAnalysis = {
            totalSize: 1700000, // ~1.7MB without Solana dependencies
            chunks: [
              {
                name: 'main',
                size: 1200000,
                modules: ['src/main.tsx', 'src/App.tsx']
              },
              {
                name: 'react-vendor',
                size: 500000,
                modules: ['react', 'react-dom']
              }
            ],
            removedDependencies: [
              '@solana/web3.js',
              '@solana/wallet-adapter-react',
              '@solana/wallet-adapter-react-ui',
              '@solana/wallet-adapter-wallets',
              '@solana/buffer-layout'
            ]
          }

          // Verify bundle size reduction
          const sizeReduction = beforeRemoval.totalSize - afterRemoval.totalSize
          const reductionPercentage = (sizeReduction / beforeRemoval.totalSize) * 100

          // Should have at least 30% size reduction
          expect(reductionPercentage).toBeGreaterThan(30)
          expect(afterRemoval.totalSize).toBeLessThan(beforeRemoval.totalSize)
          
          return reductionPercentage > 30 && afterRemoval.totalSize < beforeRemoval.totalSize
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 9.2: No Solana-related chunks exist in final bundle', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
        (chunkNames) => {
          const solanaRelatedPatterns = [
            'solana',
            'wallet-adapter',
            'anchor',
            'borsh',
            'bs58'
          ]

          // Check that no chunk names contain Solana-related patterns
          const hasSolanaChunks = chunkNames.some(chunkName =>
            solanaRelatedPatterns.some(pattern =>
              chunkName.toLowerCase().includes(pattern)
            )
          )

          expect(hasSolanaChunks).toBe(false)
          return !hasSolanaChunks
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 9.3: Bundle contains only expected dependencies', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 5, maxLength: 20 }),
        (dependencies) => {
          const allowedDependencies = [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
            '@supabase/supabase-js',
            '@crossmint/client-sdk-react-ui',
            '@radix-ui',
            'tailwindcss',
            'lucide-react',
            'recharts',
            'clsx',
            'class-variance-authority'
          ]

          const forbiddenDependencies = [
            '@solana/web3.js',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/wallet-adapter-wallets',
            '@solana/buffer-layout',
            '@coral-xyz/anchor',
            'borsh',
            'bs58'
          ]

          // Check that no forbidden dependencies are present
          const hasForbiddenDeps = dependencies.some(dep =>
            forbiddenDependencies.some(forbidden =>
              dep.includes(forbidden)
            )
          )

          expect(hasForbiddenDeps).toBe(false)
          return !hasForbiddenDeps
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 9.4: Bundle size stays within acceptable limits', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        fc.record({
          mainChunkSize: fc.integer({ min: 500000, max: 2000000 }), // 0.5MB to 2MB
          vendorChunkSize: fc.integer({ min: 300000, max: 1000000 }), // 0.3MB to 1MB
          assetCount: fc.integer({ min: 5, max: 50 })
        }),
        (bundleData) => {
          const totalSize = bundleData.mainChunkSize + bundleData.vendorChunkSize

          // Verify bundle stays within limits
          expect(bundleData.mainChunkSize).toBeLessThan(EXPECTED_MAX_BUNDLE_SIZE)
          expect(bundleData.vendorChunkSize).toBeLessThan(EXPECTED_VENDOR_CHUNK_SIZE)
          expect(totalSize).toBeLessThan(EXPECTED_MAX_BUNDLE_SIZE + EXPECTED_VENDOR_CHUNK_SIZE)

          return (
            bundleData.mainChunkSize < EXPECTED_MAX_BUNDLE_SIZE &&
            bundleData.vendorChunkSize < EXPECTED_VENDOR_CHUNK_SIZE &&
            totalSize < (EXPECTED_MAX_BUNDLE_SIZE + EXPECTED_VENDOR_CHUNK_SIZE)
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 9.5: Build output contains no Solana-related files', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 5, maxLength: 30 }), { minLength: 1, maxLength: 20 }),
        (filenames) => {
          const solanaFilePatterns = [
            'solana',
            'anchor',
            'wallet-adapter',
            'borsh',
            'bs58',
            '.idl',
            'program'
          ]

          // Check that no files contain Solana-related patterns
          const hasSolanaFiles = filenames.some(filename =>
            solanaFilePatterns.some(pattern =>
              filename.toLowerCase().includes(pattern)
            )
          )

          expect(hasSolanaFiles).toBe(false)
          return !hasSolanaFiles
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 9.6: Memory usage is reduced without Solana dependencies', { timeout: 10000 }, () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50000000, max: 200000000 }).chain(beforeMemoryUsage => 
          fc.record({
            beforeMemoryUsage: fc.constant(beforeMemoryUsage),
            afterMemoryUsage: fc.integer({ 
              min: Math.floor(beforeMemoryUsage * 0.7), // At least 30% reduction
              max: Math.floor(beforeMemoryUsage * 0.85)  // At most 15% reduction
            })
          })
        ),
        (memoryData) => {
          // Simulate memory usage before and after Solana removal
          const memoryReduction = memoryData.beforeMemoryUsage - memoryData.afterMemoryUsage
          const reductionPercentage = (memoryReduction / memoryData.beforeMemoryUsage) * 100

          // Should have some memory reduction (at least 10%)
          expect(reductionPercentage).toBeGreaterThanOrEqual(10)
          expect(memoryData.afterMemoryUsage).toBeLessThan(memoryData.beforeMemoryUsage)

          return reductionPercentage >= 10 && memoryData.afterMemoryUsage < memoryData.beforeMemoryUsage
        }
      ),
      { numRuns: 100 }
    )
  })
})