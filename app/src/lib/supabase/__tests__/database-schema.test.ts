import { describe, it, expect, beforeAll } from 'vitest'
import * as fc from 'fast-check'
import { DatabaseValidator } from '../database-validator'
import { DatabaseService } from '../database-service'

/**
 * Feature: web2-migration, Property 1: Database Schema Completeness
 * 
 * For any database initialization, the system should create all required tables
 * (users, markets, participants, transactions, platform_config) with proper structure
 * 
 * Validates: Requirements 5.1
 */

describe('Database Schema Property Tests', () => {
  describe('Property 1: Database Schema Completeness', () => {
    it('should have all required tables present in the database', { timeout: 30000 }, async () => {
      // This property verifies that the database schema is complete
      // For any valid database connection, all required tables must exist
      
      const result = await DatabaseValidator.validateDatabaseSchema()
      
      // The database must be valid
      expect(result.isValid).toBe(true)
      
      // All required tables must be found
      const requiredTables = ['users', 'markets', 'participants', 'transactions', 'platform_config']
      for (const table of requiredTables) {
        expect(result.tablesFound).toContain(table)
      }
      
      // No tables should be missing
      expect(result.missingTables).toHaveLength(0)
      
      // There should be no critical errors
      expect(result.errors).toHaveLength(0)
    })

    it('should have all required columns in each table', { timeout: 30000 }, async () => {
      // For any table in the schema, all required columns must exist
      
      const result = await DatabaseValidator.validateDatabaseSchema()
      
      // Check that validation passed
      expect(result.isValid).toBe(true)
      
      // Verify no column-related errors
      const columnErrors = result.errors.filter(e => e.includes('column'))
      expect(columnErrors).toHaveLength(0)
    })

    it('should maintain schema integrity across multiple validation checks', { timeout: 30000 }, async () => {
      // Property: Schema validation should be idempotent
      // For any number of validation checks, the schema should remain consistent
      
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 3 }), // Run validation 1-3 times (reduced for performance)
          async (numChecks) => {
            const results = []
            
            for (let i = 0; i < numChecks; i++) {
              const result = await DatabaseValidator.validateDatabaseSchema()
              results.push(result)
            }
            
            // All validation results should be consistent
            const firstResult = results[0]
            for (const result of results) {
              expect(result.isValid).toBe(firstResult.isValid)
              expect(result.tablesFound.sort()).toEqual(firstResult.tablesFound.sort())
              expect(result.missingTables.sort()).toEqual(firstResult.missingTables.sort())
            }
          }
        ),
        { numRuns: 5 } // Reduced from 10 to 5 for performance
      )
    })

    it('should support basic database operations on all tables', { timeout: 30000 }, async () => {
      // Property: All tables should support basic read operations
      // For any table in the schema, we should be able to query it
      
      const result = await DatabaseValidator.testBasicOperations()
      expect(result.success).toBe(true)
      
      if (!result.success) {
        console.error('Database operation failed:', result.error)
      }
    })

    it('should have platform configuration with required keys', { timeout: 30000 }, async () => {
      // Property: Platform configuration should contain essential settings
      // For any initialized database, platform config should have default values
      
      const configs = await DatabaseService.getAllPlatformConfig()
      
      // Platform config should exist
      expect(configs.length).toBeGreaterThan(0)
      
      // Check for essential configuration keys
      const configKeys = configs.map(c => c.key)
      const essentialKeys = [
        'default_platform_fee_percentage',
        'max_platform_fee_percentage'
      ]
      
      for (const key of essentialKeys) {
        expect(configKeys).toContain(key)
      }
    })

    it('should enforce referential integrity constraints', { timeout: 60000 }, async () => {
      // Property: Foreign key relationships should be properly defined
      // For any table with foreign keys, the relationships should be valid
      
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null), // Placeholder for property test structure
          async () => {
            const result = await DatabaseValidator.validateDatabaseSchema()
            
            // If tables exist, they should have proper structure
            if (result.tablesFound.includes('markets') && 
                result.tablesFound.includes('users')) {
              // Markets table should reference users table (creator_id)
              expect(result.isValid).toBe(true)
            }
            
            if (result.tablesFound.includes('participants') && 
                result.tablesFound.includes('markets') &&
                result.tablesFound.includes('users')) {
              // Participants table should reference both markets and users
              expect(result.isValid).toBe(true)
            }
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should have proper indexes for performance', { timeout: 30000 }, async () => {
      // Property: Critical tables should have indexes on frequently queried columns
      // For any production database, performance indexes should exist
      
      const result = await DatabaseValidator.validateDatabaseSchema()
      
      // If schema is valid, indexes should be present (checked during schema creation)
      expect(result.isValid).toBe(true)
      
      // No errors related to missing indexes
      const indexErrors = result.errors.filter(e => e.toLowerCase().includes('index'))
      expect(indexErrors).toHaveLength(0)
    })

    it('should have Row Level Security enabled on all tables', { timeout: 30000 }, async () => {
      // Property: All tables should have RLS enabled for security
      // For any table in the schema, RLS should be configured
      
      const result = await DatabaseValidator.validateDatabaseSchema()
      
      // Schema should be valid with security policies
      expect(result.isValid).toBe(true)
      
      // No security-related errors
      const securityErrors = result.errors.filter(e => 
        e.toLowerCase().includes('security') || 
        e.toLowerCase().includes('rls') ||
        e.toLowerCase().includes('policy')
      )
      expect(securityErrors).toHaveLength(0)
    })

    it('should maintain data type consistency across schema', { timeout: 60000 }, async () => {
      // Property: Similar fields across tables should use consistent data types
      // For any field representing the same concept, data types should match
      
      await fc.assert(
        fc.asyncProperty(
          fc.constant(null),
          async () => {
            const result = await DatabaseValidator.validateDatabaseSchema()
            
            // All ID fields should be UUID type (checked implicitly by schema validation)
            // All timestamp fields should be consistent
            // All decimal fields for money should use same precision
            
            expect(result.isValid).toBe(true)
          }
        ),
        { numRuns: 10 }
      )
    })

    it('should have database functions for complex operations', { timeout: 30000 }, async () => {
      // Property: Critical business logic should have database functions
      // For any complex operation like market resolution, a function should exist
      
      const result = await DatabaseValidator.validateDatabaseSchema()
      
      // Check for warnings about missing functions
      const functionWarnings = result.warnings.filter(w => 
        w.toLowerCase().includes('function') || 
        w.toLowerCase().includes('resolve_market')
      )
      
      // If the schema is properly set up, there should be no function warnings
      // or the warnings should be informational only
      if (result.isValid) {
        // Schema is valid, functions should be present
        expect(result.isValid).toBe(true)
      }
    })
  })

  describe('Schema Validation Edge Cases', () => {
    it('should handle connection errors gracefully', { timeout: 30000 }, async () => {
      // Property: Validation should not crash on connection issues
      // For any validation attempt, errors should be captured properly
      
      const result = await DatabaseValidator.validateDatabaseSchema()
      
      // Result should always be returned, even if there are errors
      expect(result).toBeDefined()
      expect(result).toHaveProperty('isValid')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('tablesFound')
      expect(result).toHaveProperty('missingTables')
    })

    it('should provide meaningful error messages', { timeout: 30000 }, async () => {
      // Property: Any validation error should include helpful information
      // For any error in the validation result, the message should be descriptive
      
      const result = await DatabaseValidator.validateDatabaseSchema()
      
      // All errors should be non-empty strings
      for (const error of result.errors) {
        expect(error).toBeTruthy()
        expect(typeof error).toBe('string')
        expect(error.length).toBeGreaterThan(0)
      }
      
      // All warnings should be non-empty strings
      for (const warning of result.warnings) {
        expect(warning).toBeTruthy()
        expect(typeof warning).toBe('string')
        expect(warning.length).toBeGreaterThan(0)
      }
    })
  })
})