/**
 * Authentication Modal Component
 *
 * Provides a unified authentication experience with both social login
 * (via Crossmint) and traditional Solana wallet connections.
 *
 * @module components/auth/AuthModal
 */

import { useAuth } from '@crossmint/client-sdk-react-ui'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
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
 * Displays a unified authentication interface that allows users to choose
 * between social login methods (via Crossmint) and traditional Solana
 * wallet connections.
 *
 * Features:
 * - Social login options (Google, Email)
 * - Traditional wallet connection (Phantom, Solflare, etc.)
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
  const crossmintAuth = useAuth()
  const { setVisible: setWalletModalVisible } = useWalletModal()

  const [isLoading, setIsLoading] = useState(false)
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null)

  const crossmintEnabled = isCrossmintEnabled()

  // Log Crossmint auth state for debugging
  console.log('[AuthModal] Crossmint auth state:', {
    status: crossmintAuth.status,
    user: crossmintAuth.user,
    enabled: crossmintEnabled,
  })

  // Close modal automatically when authentication completes
  useEffect(() => {
    if (crossmintAuth.status === 'logged-in' && open) {
      console.log('[AuthModal] Authentication successful, closing modal')
      onOpenChange(false)
      toast.success('Successfully connected!')
    }
  }, [crossmintAuth.status, open, onOpenChange])

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
    setLoadingMethod('social')

    try {
      // Close our custom modal
      onOpenChange(false)

      // Trigger Crossmint's native login modal
      // This will show all configured login methods (Google, Twitter, Farcaster, Email)
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
      setLoadingMethod(null)
    }
  }

  /**
   * Handle traditional wallet connection
   *
   * Opens the Solana wallet adapter modal to allow users to connect
   * their traditional crypto wallets (Phantom, Solflare, etc.).
   */
  const handleWalletConnect = () => {
    setIsLoading(true)
    setLoadingMethod('wallet')

    try {
      // Close auth modal
      onOpenChange(false)

      // Open the wallet adapter modal
      setWalletModalVisible(true)
    }
    catch (error) {
      // Use WalletErrorHandler to parse and log the error
      WalletErrorHandler.logError(error, 'walletConnect', 'adapter')
      const walletError = WalletErrorHandler.parseError(error, 'adapter', 'walletConnect')

      // Get user-friendly error message
      const errorMessage = WalletErrorHandler.getUserMessage(walletError)
      toast.error(errorMessage)
    }
    finally {
      setIsLoading(false)
      setLoadingMethod(null)
    }
  }

  /**
   * Check if a specific authentication method is currently loading
   *
   * @param method - The authentication method to check
   * @returns True if the method is currently processing
   */
  const isMethodLoading = (method: string) => {
    return isLoading && loadingMethod === method
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-jakarta">
            Connect to CryptoScore
          </DialogTitle>
          <DialogDescription>
            Choose your preferred authentication method to get started
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {/* Social Login Option */}
          {crossmintEnabled && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleSocialLogin}
              disabled={isLoading}
              className="w-full justify-start gap-3 h-14"
            >
              {isMethodLoading('social') ? (
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
          )}

          {/* Traditional Wallet Option */}
          <Button
            variant="outline"
            size="lg"
            onClick={handleWalletConnect}
            disabled={isLoading}
            className="w-full justify-start gap-3 h-14"
          >
            {isMethodLoading('wallet') ? (
              <span className="icon-[mdi--loading] w-6 h-6 animate-spin" />
            ) : (
              <span className="icon-[mdi--wallet] w-6 h-6" />
            )}
            <div className="flex-1 text-left">
              <div className="font-semibold">Wallet Connection</div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Phantom, Solflare, Backpack, etc.
              </div>
            </div>
          </Button>

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
