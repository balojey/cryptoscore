import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useUnifiedWallet } from '@/contexts/UnifiedWalletContext'
import { AuthModal } from './auth/AuthModal'
import Account from './Account'

export default function Connect() {
  const { connected, walletAddress, walletName, walletIcon, user } = useUnifiedWallet()
  const [authModalOpen, setAuthModalOpen] = useState(false)

  function openAuthModal() {
    setAuthModalOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {!connected
          ? (
              <Button
                variant="default"
                size="default"
                onClick={openAuthModal}
                className="gap-2"
              >
                <span className="icon-[mdi--wallet]" />
                <span>Connect</span>
              </Button>
            )
          : (
              <Account
                address={walletAddress || ''}
                walletName={walletName}
                walletIcon={walletIcon}
                user={user}
              />
            )}
      </div>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  )
}
