/**
 * Hook to prevent body scroll lock issues with modals
 * 
 * This hook monitors for stale scroll locks that can occur when:
 * - Multiple modals are opened/closed rapidly
 * - Wallet disconnect/reconnect happens quickly
 * - Modal cleanup fails due to race conditions
 */
import { useEffect } from 'react'

export function useScrollLockCleanup() {
  useEffect(() => {
    const checkScrollLock = () => {
      // Check if any modals are actually open
      const hasOpenDialog = document.querySelector('[role="dialog"][data-state="open"]')
      const hasWalletModal = document.querySelector('.wallet-adapter-modal-wrapper')
      const hasCrossmintModal = document.querySelector('[data-crossmint-modal]')
      
      const hasAnyModal = hasOpenDialog || hasWalletModal || hasCrossmintModal
      
      // If no modals are open but body is locked, clean it up
      if (!hasAnyModal && document.body.style.overflow === 'hidden') {
        console.log('[ScrollLockCleanup] Removing stale scroll lock')
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
      }
    }

    // Check immediately on mount
    checkScrollLock()

    // Check periodically (every second)
    const interval = setInterval(checkScrollLock, 1000)

    // Also check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkScrollLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
