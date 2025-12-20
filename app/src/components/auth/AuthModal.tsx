/**
 * Authentication Modal Component
 *
 * Provides a unified authentication experience with social login
 * via Crossmint for the web2 migration.
 *
 * @module components/auth/AuthModal
 */

import { useAuth as useCrossmintAuth } from '@crossmint/client-sdk-react-ui'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { isCrossmintEnabled } from '@/config/crossmint'
import { useAuth } from '@/contexts/AuthContext'
import { WALLET_ERROR_CODES, WalletErrorHandler } from '@/lib/crossmint/wallet-error-handler'

/**
 * Props for AuthModal component
 */
export interface AuthModalProps {
  /** Controls whether the modal is visible */
  open: boolean

  /** Callback function to control modal visibility */
  onOpenChange: (open: boolean) => void
}

/**
 * Authentication Modal Component
 *
 * Displays a social authentication interface that allows users to login
 * with social methods via Crossmint (Google, Email).
 *
 * Features:
 * - Social login options (Google, Email)
 * - Loading states during authentication
 * - Error handling with user-friendly messages
 * - Automatic modal closure on successful authentication
 *
 * @param props - Component props
 * @returns Authentication modal component
 *
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 *
 * <AuthModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const crossmintAuth = useCrossmintAuth()
  const auth = useAuth()

  const [isLoading, setIsLoading] = useState(false)

  const crossmintEnabled = isCrossmintEnabled()

  // Log auth state for debugging
  console.log('[AuthModal] Auth state:', {
    crossmintStatus: crossmintAuth.status,
    user: auth.user,
    walletAddress: auth.walletAddress,
    enabled: crossmintEnabled,
  })

  // Close modal automatically when authentication completes
  useEffect(() => {
    if (auth.user && open) {
      console.log('[AuthModal] Authentication successful, closing modal')
      onOpenChange(false)
    }
  }, [auth.user, open, onOpenChange])

  // Cleanup: Ensure body scroll is restored when modal closes
  useEffect(() => {
    if (!open) {
      // Small delay to ensure all modal cleanup is complete
      const timer = setTimeout(() => {
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [open])

  /**
   * Handle social login via Crossmint
   *
   * Opens Crossmint's native authentication modal with all social login options.
   * The Crossmint modal will show Google and Email options.
   */
  const handleSocialLogin = async () => {
    setIsLoading(true)

    try {
      // Close our custom modal
      onOpenChange(false)

      // Trigger Crossmint's native login modal
      // This will show all configured login methods (Google, Email)
      await crossmintAuth.login()

      console.log('[AuthModal] Crossmint login modal opened')
    }
    catch (error) {
      console.error('[AuthModal] Login error:', error)

      // Use WalletErrorHandler to parse and log the error
      WalletErrorHandler.logError(error, 'socialLogin', 'crossmint')
      const walletError = WalletErrorHandler.parseError(error, 'crossmint', 'socialLogin')

      // Get user-friendly error message
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)

      // Show appropriate error message based on error type
      if (walletError.code === WALLET_ERROR_CODES.AUTH_CANCELLED) {
        toast.info('Authentication was cancelled')
      }
      else if (walletError.code === WALLET_ERROR_CODES.AUTH_TIMEOUT) {
        toast.error('Authentication timed out. Please try again.')
      }
      else if (WalletErrorHandler.isRecoverable(walletError)) {
        toast.error(`${errorMessage} Please try again.`)
      }
      else {
        toast.error(errorMessage)
      }

      // Reopen the modal if authentication failed
      onOpenChange(true)
    }
    finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-jakarta">
            Connect to CryptoScore
          </DialogTitle>
          <DialogDescription>
            Sign in with your preferred social account to get started
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {/* Social Login Option */}
          {crossmintEnabled ? (
            <Button
              variant="outline"
              size="lg"
              onClick={handleSocialLogin}
              disabled={isLoading}
              className="w-full justify-start gap-3 h-14"
            >
              {isLoading ? (
                <span className="icon-[mdi--loading] w-6 h-6 animate-spin" />
              ) : (
                <span className="icon-[mdi--account-circle] w-6 h-6" />
              )}
              <div className="flex-1 text-left">
                <div className="font-semibold">Social Login</div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Google, Email
                </div>
              </div>
            </Button>
          ) : (
            <div className="text-center p-4">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Social login is not configured. Please check your Crossmint settings.
              </p>
            </div>
          )}

          {/* Info Text */}
          <p
            className="text-xs text-center mt-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            By connecting, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
