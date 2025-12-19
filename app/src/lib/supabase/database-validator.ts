import { supabase } from '@/config/supabase'
import { DatabaseService } from './database-service'

export interface DatabaseValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  tablesFound: string[]
  missingTables: string[]
}

export class DatabaseValidator {
  private static readonly REQUIRED_TABLES = [
    'users',
    'markets', 
    'participants',
    'transactions',
    'platform_config'
  ]

  private static readonly REQUIRED_COLUMNS = {
    users: ['id', 'wallet_address', 'email', 'display_name', 'created_at', 'updated_at'],
    markets: ['id', 'creator_id', 'title', 'description', 'entry_fee', 'end_time', 'status', 'resolution_outcome', 'total_pool', 'platform_fee_percentage', 'created_at', 'updated_at'],
    participants: ['id', 'market_id', 'user_id', 'prediction', 'entry_amount', 'potential_winnings', 'actual_winnings', 'joined_at'],
    transactions: ['id', 'user_id', 'market_id', 'type', 'amount', 'description', 'created_at'],
    platform_config: ['key', 'value', 'updated_at']
  }

  static async validateDatabaseSchema(): Promise<DatabaseValidationResult> {
    const result: DatabaseValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      tablesFound: [],
      missingTables: []
    }

    try {
      // Check each required table by attempting to query it
      for (const tableName of this.REQUIRED_TABLES) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1)

          if (error) {
            // If error code indicates table doesn't exist
            if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
              result.missingTables.push(tableName)
              result.errors.push(`Required table '${tableName}' is missing`)
              result.isValid = false
            } else {
              // Table exists but there might be other issues
              result.tablesFound.push(tableName)
              result.warnings.push(`Table '${tableName}' exists but query failed: ${error.message}`)
            }
          } else {
            // Table exists and is queryable
            result.tablesFound.push(tableName)
          }
        } catch (tableError) {
          result.missingTables.push(tableName)
          result.errors.push(`Required table '${tableName}' is missing or inaccessible`)
          result.isValid = false
        }
      }

      // Check for platform configuration
      await this.validatePlatformConfig(result)

      // Only validate functions if we have basic tables
      if (result.tablesFound.length > 0) {
        await this.validateDatabaseFunctions(result)
      }

    } catch (error) {
      result.isValid = false
      result.errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  private static async validateTableColumns(tableName: string, result: DatabaseValidationResult): Promise<void> {
    // Since we can't access information_schema through Supabase REST API,
    // we'll validate columns by attempting to select specific columns
    try {
      const requiredColumns = this.REQUIRED_COLUMNS[tableName as keyof typeof this.REQUIRED_COLUMNS] || []
      
      if (requiredColumns.length > 0) {
        const { error } = await supabase
          .from(tableName)
          .select(requiredColumns.join(','))
          .limit(1)

        if (error) {
          // If specific columns are missing, the query will fail
          result.warnings.push(`Could not validate all columns for table '${tableName}': ${error.message}`)
        }
      }
    } catch (error) {
      result.warnings.push(`Error validating columns for table '${tableName}': ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static async validatePlatformConfig(result: DatabaseValidationResult): Promise<void> {
    try {
      const configs = await DatabaseService.getAllPlatformConfig()
      
      const requiredConfigs = [
        'default_platform_fee_percentage',
        'max_platform_fee_percentage',
        'min_market_duration_hours',
        'max_market_duration_days'
      ]

      const existingConfigKeys = configs.map(c => c.key)

      for (const requiredConfig of requiredConfigs) {
        if (!existingConfigKeys.includes(requiredConfig)) {
          result.warnings.push(`Recommended platform config '${requiredConfig}' is missing`)
        }
      }

      if (configs.length === 0) {
        result.warnings.push('No platform configuration found. Consider running the schema setup.')
      }

    } catch (error) {
      result.warnings.push(`Could not validate platform configuration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private static async validateDatabaseFunctions(result: DatabaseValidationResult): Promise<void> {
    // Since we can't access information_schema.routines through Supabase REST API,
    // we'll just add a warning that functions should be validated manually
    // The functions are created in the migration, so if the migration succeeded, they should exist
    result.warnings.push('Database functions cannot be validated through REST API. Ensure resolve_market function exists.')
  }

  static async testBasicOperations(): Promise<{ success: boolean; error?: string }> {
    try {
      // Test basic read operation
      const { error } = await supabase
        .from('platform_config')
        .select('key')
        .limit(1)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}