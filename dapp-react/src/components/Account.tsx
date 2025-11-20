import { useEffect, useRef, useState } from 'react'
import { useDisconnect } from 'wagmi'
import { shortenAddress } from '../utils/formatters'
import Balance from './Balance'

interface AccountProps {
  address: `0x${string}`
  connectorName: string | undefined
  connectorIcon: string | undefined
}

export default function Account({ address, connectorName, connectorIcon }: AccountProps) {
  const { disconnect } = useDisconnect()
  const [isOpen, setIsOpen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function handleDisconnect() {
    disconnect()
    localStorage.clear()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(address).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    })
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node))
        setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        type="button"
        className="flex items-center gap-3 p-2 pr-4 rounded-[14px] shadow-sm transition-all"
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
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {connectorIcon
            ? (
                <img
                  src={connectorIcon}
                  alt={connectorName || 'Connector'}
                  className="w-8 h-8 rounded-full"
                />
              )
            : (
                <span className="icon-[mdi--wallet] w-8 h-8" style={{ color: 'var(--text-primary)' }} />
              )}
          <span className="font-sans font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            {shortenAddress(address)}
          </span>
        </div>
        <span className={`icon-[mdi--chevron-down] w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full right-0 mt-2 w-80 rounded-[16px] shadow-xl z-10 p-4"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex flex-col gap-4">
            {/* Address display with copy button */}
            <div>
              <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Your Address</p>
              <div
                className="flex items-center gap-2 p-2 rounded-[12px]"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <span className="font-mono text-sm flex-grow truncate" style={{ color: 'var(--text-secondary)' }}>{address}</span>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg transition-colors flex-shrink-0"
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
                    ? <span className="icon-[mdi--check] w-5 h-5" style={{ color: 'var(--accent-green)' }} />
                    : <span className="icon-[mdi--content-copy] w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="p-4 rounded-[12px]" style={{ background: 'var(--bg-secondary)' }}>
              <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Your Balance</p>
              <Balance address={address} />
            </div>

            {/* Faucet Link */}
            <a
              href="https://faucet.polkadot.io/?parachain=1111"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 p-4 rounded-[12px] transition-colors"
              style={{
                background: 'var(--info-bg)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--info-border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--info-bg)'
              }}
            >
              <span className="icon-[mdi--faucet] w-7 h-7" />
              <div className="flex flex-col">
                <span className="font-bold text-base">Get Test Tokens</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Use the faucet for free PAS</span>
              </div>
            </a>

            {/* Disconnect Button */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 h-11 px-4 rounded-[12px] font-sans text-base font-bold transition-colors"
              style={{
                background: 'var(--accent-red)',
                color: 'var(--text-inverse)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-red-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--accent-red)'
              }}
              onClick={handleDisconnect}
              title="Disconnect"
            >
              <span className="icon-[mdi--logout] w-5 h-5" />
              <span>Disconnect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
