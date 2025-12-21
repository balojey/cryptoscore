/**
 * Debug test for mock database
 */

import { describe, it, expect } from 'vitest'
import { mockSupabaseClient, MockDatabaseTestUtils } from './mock-database'

describe('Debug Mock Database', () => {
  it('should debug mock database state', () => {
    console.log('Initial state:', mockSupabaseClient.getState())
    
    // Reset to ensure clean state
    mockSupabaseClient.reset()
    console.log('After reset:', mockSupabaseClient.getState())
    
    // Create platform config
    console.log('Creating platform config...')
    const config = MockDatabaseTestUtils.createTestPlatformConfig('test_key', 'test_value')
    console.log('Created config:', config)
    
    const stateAfterConfig = mockSupabaseClient.getState()
    console.log('State after config creation:', stateAfterConfig)
    console.log('Platform config map:', stateAfterConfig.platform_config)
    console.log('Platform config size:', stateAfterConfig.platform_config.size)
    console.log('Has test_key:', stateAfterConfig.platform_config.has('test_key'))
    
    // Create user
    console.log('Creating user...')
    const user = MockDatabaseTestUtils.createTestUser({ email: 'test@example.com' })
    console.log('Created user:', user)
    
    const stateAfterUser = mockSupabaseClient.getState()
    console.log('State after user creation:', stateAfterUser)
    console.log('Users map:', stateAfterUser.users)
    console.log('Users size:', stateAfterUser.users.size)
    console.log('Has user:', stateAfterUser.users.has(user.id))
    
    // Basic assertions
    expect(stateAfterConfig.platform_config.size).toBeGreaterThan(0)
    expect(stateAfterUser.users.size).toBeGreaterThan(0)
  })
})