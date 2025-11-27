import { useWallet } from '@solana/wallet-adapter-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { shortenAddress } from '../utils/formatters'
import Balance from './Balance'

interface AccountProps {
  address: string
  walletName: string | undefined
  walletIcon: string | undefined
}

export default function Account({ address, walletName, walletIcon }: AccountProps) {
  const { disconnect } = useWallet()
  const [isOpen, setIsOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  function handleDisconnect() {
    disconnect()
    setIsOpen(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Account Button */}
      <button
        type="button"
        className="flex items-center gap-2 sm:gap-3 p-2 pr-3 sm:pr-4 rounded-[14px] shadow-sm transition-all"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }}
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2">
          {walletIcon
            ? (
                <img
                  src={walletIcon}
                  alt={walletName || 'Wallet'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                />
              )
            : (
                <span className="icon-[mdi--wallet] w-7 h-7 sm:w-8 sm:h-8" style={{ color: 'var(--text-primary)' }} />
              )}
          <span className="font-sans font-semibold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
            {shortenAddress(address)}
          </span>
        </div>
        <span className="icon-[mdi--chevron-down] w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {/* Modal Content */}
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            {walletIcon
              ? (
                  <img
                    src={walletIcon}
                    alt={walletName || 'Wallet'}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                  />
                )
              : (
                  <span className="icon-[mdi--wallet] w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" style={{ color: 'var(--text-primary)' }} />
                )}
            <div className="min-w-0">
              <DialogTitle className="font-jakarta text-lg sm:text-xl">Account</DialogTitle>
              {walletName && (
                <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-tertiary)' }}>
                  Connected with
                  {' '}
                  {walletName}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:gap-4 mt-3 sm:mt-4">
          {/* Address display with copy button */}
          <div>
            <p className="text-xs font-semibold uppercase mb-1.5 sm:mb-2" style={{ color: 'var(--text-tertiary)' }}>
              Your Address
            </p>
            <div
              className="flex items-center gap-2 p-2.5 sm:p-3 rounded-[12px]"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <span className="font-mono text-xs sm:text-sm flex-grow truncate" style={{ color: 'var(--text-secondary)' }}>
                {address}
              </span>
              <button
                onClick={handleCopy}
                className="p-1.5 sm:p-2 rounded-lg transition-colors flex-shrink-0"
                style={{ color: 'var(--text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
                title="Copy Address"
              >
                {isCopied
                  ? <span className="icon-[mdi--check] w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent-green)' }} />
                  : <span className="icon-[mdi--content-copy] w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="p-3 sm:p-4 rounded-[12px]" style={{ background: 'var(--bg-secondary)' }}>
            <p className="text-xs sm:text-sm mb-1.5 sm:mb-2 font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              Your Balance
            </p>
            <Balance />
          </div>

          {/* Faucet Link */}
          <a
            href="https://faucet.solana.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-[12px] transition-all hover-lift"
            style={{
              background: 'var(--info-bg)',
              color: 'var(--accent-cyan)',
              border: '1px solid var(--info-border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)'
              e.currentTarget.style.borderColor = 'var(--accent-cyan)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--info-bg)'
              e.currentTarget.style.borderColor = 'var(--info-border)'
            }}
          >
            <span className="icon-[mdi--faucet] w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-bold text-sm sm:text-base">Get Test Tokens</span>
              <span className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                Use the faucet for free SOL
              </span>
            </div>
            <span className="icon-[mdi--open-in-new] w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          </a>

          {/* Disconnect Button */}
          <button
            type="button"
            className="flex items-center justify-center gap-2 h-11 sm:h-12 px-4 rounded-[12px] font-sans text-sm sm:text-base font-bold transition-all"
            style={{
              background: 'var(--accent-red)',
              color: 'var(--text-inverse)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--accent-red-hover)'
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--accent-red)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onClick={handleDisconnect}
            title="Disconnect Wallet"
          >
            <span className="icon-[mdi--logout] w-4 h-4 sm:w-5 sm:h-5" />
            <span>Disconnect Wallet</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
