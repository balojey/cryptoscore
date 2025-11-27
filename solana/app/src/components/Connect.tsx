import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import Account from './Account'

export default function Connect() {
  const { publicKey, wallet, connected } = useWallet()
  const { setVisible } = useWalletModal()

  function openConnectModal() {
    setVisible(true)
  }

  return (
    <div className="flex items-center gap-2">
      {!connected
        ? (
            <Button
              variant="default"
              size="default"
              onClick={openConnectModal}
              className="gap-2"
            >
              <span className="icon-[mdi--wallet]" />
              <span>Connect</span>
            </Button>
          )
        : (
            <Account
              address={publicKey?.toBase58() || ''}
              walletName={wallet?.adapter.name}
              walletIcon={wallet?.adapter.icon}
            />
          )}
    </div>
  )
}
