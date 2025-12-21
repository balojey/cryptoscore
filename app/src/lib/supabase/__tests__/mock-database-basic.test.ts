/**
 * Basic test for mock database functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mockSupabaseClient, MockDatabaseTestUtils } from './mock-database'

describe('Mock Database Basic Tests', () => {
  beforeEach(() => {
    mockSupabaseClient.reset()
  })

  it('should create and retrieve platform config', () => {
    // Create platform config
    const config = MockDatabaseTestUtils.createTestPlatformConfig('test_key', 'test_value')
    
    expect(config.key).toBe('test_key')
    expect(config.value).toBe('test_value')
    
    // Verify it's in the database
    const state = mockSupabaseClient.getState()
    expect(state.platform_config.has('test_key')).toBe(true)
    expect(state.platform_config.get('test_key')).toEqual(config)
  })

  it('should create and retrieve users', () => {
    // Create user
    const user = MockDatabaseTestUtils.createTestUser({
      email: 'test@example.com',
      display_name: 'Test User'
    })
    
    expect(user.email).toBe('test@example.com')
    expect(user.display_name).toBe('Test User')
    
    // Verify it's in the database
    const state = mockSupabaseClient.getState()
    expect(state.users.has(user.id)).toBe(true)
    expect(state.users.get(user.id)).toEqual(user)
  })

  it('should reset database correctly', () => {
    // Create some data
    MockDatabaseTestUtils.createTestUser()
    MockDatabaseTestUtils.createTestPlatformConfig('test_key', 'test_value')
    
    // Verify data exists
    let state = mockSupabaseClient.getState()
    expect(state.users.size).toBe(1)
    expect(state.platform_config.size).toBe(1)
    
    // Reset
    mockSupabaseClient.reset()
    
    // Verify data is gone
    state = mockSupabaseClient.getState()
    expect(state.users.size).toBe(0)
    expect(state.platform_config.size).toBe(0)
  })

  it('should handle multiple platform configs', () => {
    // Create multiple configs
    const configs = [
      MockDatabaseTestUtils.createTestPlatformConfig('config1', 'value1'),
      MockDatabaseTestUtils.createTestPlatformConfig('config2', 'value2'),
      MockDatabaseTestUtils.createTestPlatformConfig('config3', 'value3'),
      MockDatabaseTestUtils.createTestPlatformConfig('config4', 'value4'),
    ]
    
    // Verify all configs exist
    const state = mockSupabaseClient.getState()
    expect(state.platform_config.size).toBe(4)
    
    for (const config of configs) {
      expect(state.platform_config.has(config.key)).toBe(true)
      expect(state.platform_config.get(config.key)).toEqual(config)
    }
  })
})