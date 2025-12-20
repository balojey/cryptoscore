import { Buffer } from 'buffer'
import {
  CrossmintAuthProvider,
  CrossmintProvider,
  CrossmintWalletProvider,
} from '@crossmint/client-sdk-react-ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { useMemo } from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import { ConfigurationError } from './components/ConfigurationError'
import {
  CROSSMINT_CLIENT_API_KEY,
  CROSSMINT_ENVIRONMENT,
  CROSSMINT_LOGIN_METHODS,
  isCrossmintEnabled,
} from './config/crossmint'
import {
  getConsoleUrl,
  shouldEnableCrossmint,
  validateCrossmintConfiguration,
} from './lib/crossmint/config-validator'
import { UnifiedWalletProvider } from './contexts/UnifiedWalletContext'
import { AuthProvider } from './contexts/AuthContext'

import './style.css'

// Polyfill Buffer for browser
window.Buffer = Buffer

const queryClient = new QueryClient()

function Root() {
  // Validate Crossmint configuration on startup
  const crossmintValidation = useMemo(() => {
    // Only validate if user is attempting to use Crossmint
    if (shouldEnableCrossmint(CROSSMINT_CLIENT_API_KEY)) {
      return validateCrossmintConfiguration({
        clientApiKey: CROSSMINT_CLIENT_API_KEY,
        environment: CROSSMINT_ENVIRONMENT,
      })
    }
    return { valid: true, errors: [], warnings: [] }
  }, [])

  // Check if Crossmint is enabled and valid
  const crossmintEnabled = isCrossmintEnabled() && crossmintValidation.valid

  // Display configuration error if validation fails
  if (shouldEnableCrossmint(CROSSMINT_CLIENT_API_KEY) && !crossmintValidation.valid) {
    return (
      <React.StrictMode>
        <ConfigurationError
          result={crossmintValidation}
          consoleUrl={getConsoleUrl(CROSSMINT_ENVIRONMENT)}
        />
      </React.StrictMode>
    )
  }

  // Log warnings to console if any
  if (crossmintValidation.warnings.length > 0) {
    console.warn('Crossmint Configuration Warnings:')
    crossmintValidation.warnings.forEach((warning) => {
      console.warn(`  - ${warning}`)
    })
  }

  return (
    <React.StrictMode>
      {crossmintEnabled ? (
        // Wrap with Crossmint providers when enabled
        <CrossmintProvider apiKey={CROSSMINT_CLIENT_API_KEY}>
          <CrossmintAuthProvider
            loginMethods={CROSSMINT_LOGIN_METHODS}
            appearance={{
              borderRadius: 'md',
            }}
          >
            <CrossmintWalletProvider 
              createOnLogin={{
                chain: 'solana',
                signer: {
                  type: 'email',
                },
              }}
            >
              <UnifiedWalletProvider>
                <AuthProvider>
                  <QueryClientProvider client={queryClient}>
                    <App />
                  </QueryClientProvider>
                </AuthProvider>
              </UnifiedWalletProvider>
            </CrossmintWalletProvider>
          </CrossmintAuthProvider>
        </CrossmintProvider>
      ) : (
        // Fallback when Crossmint is not configured
        <UnifiedWalletProvider>
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              <App />
            </QueryClientProvider>
          </AuthProvider>
        </UnifiedWalletProvider>
      )}
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration)
      })
      .catch((error) => {
        console.log('SW registration failed:', error)
      })
  })
}
