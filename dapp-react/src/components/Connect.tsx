import type { Chain } from 'wagmi/chains'
import { useMemo, useRef } from 'react'
import { useAccount, useChainId, useChains, useConnect, useConnectorClient } from 'wagmi'
import { Button } from '@/components/ui/button'
import { ensurePaseoTestnet } from '../utils/chain'
import Account from './Account'

// Popular wallets for when no connectors are available
const popularWallets = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg',
    downloadUrl: 'https://metamask.io/download/',
  },
  {
    id: 'talisman',
    name: 'Talisman',
    icon: 'https://pbs.twimg.com/profile_images/1777249249997590528/5sS2f7pS_400x400.jpg',
    downloadUrl: 'https://www.talisman.xyz/',
  },
  {
    id: 'polkadot-js',
    name: 'Polkadot{.js} Extension',
    icon: 'https://polkadot.js.org/assets/polkadotjs-logo.svg',
    downloadUrl: 'https://polkadot.js.org/extension/',
  },
  {
    id: 'fearless',
    name: 'Fearless Wallet',
    icon: 'https://fearlesswallet.io/assets/images/fearless-logo-512.png',
    downloadUrl: 'https://fearlesswallet.io/',
  },
  {
    id: 'subwallet',
    name: 'SubWallet',
    icon: 'https://subwallet.app/icons/icon-192x192.png',
    downloadUrl: 'https://subwallet.app/',
  },
  {
    id: 'polkawallet',
    name: 'PolkaWallet',
    icon: 'https://polkawallet.io/static/media/icon-512.3b6f4f0b.png',
    downloadUrl: 'https://polkawallet.io/',
  },
  {
    id: 'nova',
    name: 'Nova Wallet',
    icon: 'https://nova.app/static/media/nova-icon.6f3b3c7a.png',
    downloadUrl: 'https://nova.app/',
  },
]

export default function Connect() {
  const connectModalRef = useRef<HTMLDialogElement>(null)
  const chainId = useChainId()
  const chains = useChains()
  const { connect, connectors, error, status } = useConnect()
  const { address, isConnected, connector } = useAccount()
  const { data: connectorClient } = useConnectorClient()

  const connectedChain = useMemo(() => {
    return chains.find((chain: Chain) => chain.id === chainId) || chains[0]
  }, [chains, chainId])

  const filteredConnectors = useMemo(() => {
    return connectors.filter((c) => {
      const id = c.id.toLowerCase()
      const allowed = [
        'metamask',
        'talisman',
        'polkadot',
        'polkadot-js',
        'polkadotjs',
        'fearless',
        'subwallet',
        'polkawallet',
        'nova',
        'walletconnect',
        'walletconnectv2',
        'coinbase',
        'injected',
        'brave',
        'trust',
        'ledger',
        'argent',
      ]
      return allowed.some(substr => id.includes(substr))
    })
  }, [connectors])

  function openConnectModal() {
    connectModalRef.current?.showModal()
  }

  function closeConnectModal() {
    connectModalRef.current?.close()
  }

  async function handleConnect(connector: any) {
    try {
      connect({ connector, chainId: connectedChain.id as any })
      closeConnectModal()
      if (connectorClient) {
        await ensurePaseoTestnet(connectorClient)
      }
    }
    catch (err) {
      console.error('Failed to connect:', err)
      closeConnectModal()
    }
  }

  return (
    <>
      {/* Connect/Disconnect Buttons */}
      <div className="flex items-center gap-2">
        {!isConnected
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
                address={address as `0x${string}`}
                connectorName={connector?.name}
                connectorIcon={connector?.icon}
              />
            )}
      </div>

      {/* Modal */}
      <dialog ref={connectModalRef} className="modal modal-bottom sm:modal-middle">
        <div
          className="modal-box max-w-sm rounded-[16px] shadow-2xl"
          style={{
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2
                className="font-header font-bold text-xl"
                style={{ color: 'var(--text-primary)' }}
              >
                Connect Wallet
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                Network:
                {' '}
                <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{connectedChain.name}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeConnectModal}
              className="h-8 w-8"
            >
              <span className="icon-[mdi--close] w-5 h-5" />
            </Button>
          </div>

          {/* Wallets */}
          <div className="space-y-4">
            {filteredConnectors.length > 0
              ? (
                  /* Available Connectors */
                  <div className="space-y-3">
                    {filteredConnectors.map(conn => (
                      <button
                        key={conn.id}
                        type="button"
                        disabled={status === 'pending'}
                        className="w-full flex items-center gap-4 p-4 rounded-[12px] transition-all disabled:opacity-50 disabled:cursor-wait"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                        onMouseEnter={(e) => {
                          if (status !== 'pending') {
                            e.currentTarget.style.borderColor = 'var(--accent-cyan)'
                            e.currentTarget.style.background = 'var(--bg-hover)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (status !== 'pending') {
                            e.currentTarget.style.borderColor = 'var(--border-default)'
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                          }
                        }}
                        onClick={() => handleConnect(conn)}
                      >
                        {conn.icon
                          ? (
                              <img
                                src={conn.icon}
                                alt={conn.name}
                                className="w-8 h-8 rounded-full"
                              />
                            )
                          : (
                              <span className="icon-[mdi--wallet-outline] w-8 h-8" style={{ color: 'var(--text-secondary)' }} />
                            )}
                        <span className="font-sans font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                          {status === 'pending' ? 'Connecting...' : conn.name}
                        </span>
                        {status === 'pending' && <span className="icon-[mdi--loading] animate-spin ml-auto" style={{ color: 'var(--accent-cyan)' }} />}
                      </button>
                    ))}
                  </div>
                )
              : (
                  /* No Connectors - Show Popular Wallets */
                  <div className="space-y-4 pt-2">
                    <div className="text-center">
                      <span className="icon-[mdi--wallet-outline] w-12 h-12 mx-auto mb-2" style={{ color: 'var(--text-disabled)' }} />
                      <p className="text-base font-medium" style={{ color: 'var(--text-secondary)' }}>
                        No wallet extensions detected.
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Please install a wallet to continue.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {popularWallets.map(wallet => (
                        <a
                          key={wallet.id}
                          href={wallet.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-4 p-4 rounded-[12px] transition-all"
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-primary)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--accent-cyan)'
                            e.currentTarget.style.background = 'var(--bg-hover)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--border-default)'
                            e.currentTarget.style.background = 'var(--bg-secondary)'
                          }}
                        >
                          <img
                            src={wallet.icon}
                            alt={wallet.name}
                            className="w-8 h-8 rounded-full"
                          />
                          <span className="font-sans font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
                            Install
                            {' '}
                            {wallet.name}
                          </span>
                          <span className="icon-[mdi--arrow-top-right-thin-circle-outline] w-5 h-5 ml-auto" style={{ color: 'var(--text-tertiary)' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
          </div>

          {/* Error Display */}
          {error && (
            <div
              className="flex items-center gap-2 mt-6 p-3 rounded-[12px] text-sm"
              style={{
                background: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                color: 'var(--error)',
              }}
            >
              <span className="icon-[mdi--alert-circle-outline] w-5 h-5" />
              <span>{error.message}</span>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={closeConnectModal}>close</button>
        </form>
      </dialog>
    </>
  )
}
