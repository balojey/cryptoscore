/**
 * Configuration Error Component
 *
 * Displays configuration errors when the application
 * cannot start due to missing or invalid configuration.
 */

import type { ValidationResult } from '@/lib/crossmint/config-validator'
import { formatValidationErrors } from '@/lib/crossmint/config-validator'

interface ConfigurationErrorProps {
  result: ValidationResult
  consoleUrl: string
}

export function ConfigurationError({ result, consoleUrl }: ConfigurationErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-gray-900 dark:to-red-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="flex-shrink-0">
            <svg
              className="w-12 h-12 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Configuration Error
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              The application cannot start because Crossmint is not properly configured.
            </p>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <pre className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap font-mono">
            {formatValidationErrors(result)}
          </pre>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              How to fix this:
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Copy <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">.env.example</code> to <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">.env</code> if you haven't already</li>
              <li>
                Get your Crossmint API key from{' '}
                <a
                  href={consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Crossmint Console
                </a>
              </li>
              <li>Add your API key to the <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">.env</code> file</li>
              <li>Set the environment to <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">staging</code> for development</li>
              <li>Restart the development server</li>
            </ol>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
              Example .env configuration:
            </h3>
            <pre className="text-xs text-blue-800 dark:text-blue-300 font-mono">
              {`VITE_CROSSMINT_CLIENT_API_KEY=your_actual_api_key_here
VITE_CROSSMINT_ENVIRONMENT=staging`}
            </pre>
          </div>

          {result.warnings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                ⚠️ Warnings
              </h3>
              <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                {result.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Check the{' '}
            <a
              href="https://docs.crossmint.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Crossmint documentation
            </a>
            {' '}or contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
