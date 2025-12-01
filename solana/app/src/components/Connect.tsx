import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Button } from '@/components/ui/button'
import Account from './Account'

export default function Connect() {
  const { publicKey, wallet, connected } = useWallet()
  const { setVisible } = useWalletModal()
  
  const network = import.meta.env.VITE_SOLANA_NETWORK || 'devnet'
  const networkColors = {
    'mainnet-beta': 'bg-green-500/10 text-green-400 border-green-500/20',
    'devnet': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'testnet': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }

  function openConnectModal() {
    setVisible(true)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Network indicator */}
      <div className={`px-2 py-1 rounded-md text-xs font-medium border ${networkColors[network as keyof typeof networkColors]}`}>
        {network.toUpperCase()}
      </div>
      
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
