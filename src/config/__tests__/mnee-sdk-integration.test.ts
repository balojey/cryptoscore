import { describe, it, expect } from 'vitest'
import Mnee from '@mnee/ts-sdk'
import { MNEE_SDK_CONFIG } from '../mnee'

describe('MNEE SDK Integration', () => {
  it('should be able to import MNEE SDK', () => {
    expect(Mnee).toBeDefined()
    expect(typeof Mnee).toBe('function')
  })

  it('should be able to create MNEE instance with configuration', () => {
    expect(() => {
      const mnee = new Mnee(MNEE_SDK_CONFIG)
      expect(mnee).toBeDefined()
      expect(typeof mnee.balance).toBe('function')
      expect(typeof mnee.transfer).toBe('function')
      expect(typeof mnee.config).toBe('function')
    }).not.toThrow()
  })

  it('should have expected methods on MNEE instance', () => {
    const mnee = new Mnee(MNEE_SDK_CONFIG)
    
    // Balance operations
    expect(typeof mnee.balance).toBe('function')
    expect(typeof mnee.balances).toBe('function')
    
    // Transfer operations
    expect(typeof mnee.transfer).toBe('function')
    expect(typeof mnee.validateMneeTx).toBe('function')
    
    // Utility methods
    expect(typeof mnee.toAtomicAmount).toBe('function')
    expect(typeof mnee.fromAtomicAmount).toBe('function')
    
    // Configuration
    expect(typeof mnee.config).toBe('function')
    
    // Transaction management
    expect(typeof mnee.getTxStatus).toBe('function')
    expect(typeof mnee.recentTxHistory).toBe('function')
  })

  it('should have correct unit conversion methods', () => {
    const mnee = new Mnee(MNEE_SDK_CONFIG)
    
    // Test atomic conversion
    expect(mnee.toAtomicAmount(1)).toBe(100000)
    expect(mnee.toAtomicAmount(0.5)).toBe(50000)
    
    expect(mnee.fromAtomicAmount(100000)).toBe(1)
    expect(mnee.fromAtomicAmount(50000)).toBe(0.5)
  })

  it('should have HDWallet static methods available', () => {
    expect(Mnee.HDWallet).toBeDefined()
    expect(typeof Mnee.HDWallet.generateMnemonic).toBe('function')
    expect(typeof Mnee.HDWallet.isValidMnemonic).toBe('function')
  })
})