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
        className="flex items-center gap-3 bg-white p-2 pr-4 rounded-[14px] border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
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
                <span className="icon-[mdi--wallet] w-8 h-8 text-[#1E293B]" />
              )}
          <span className="font-sans font-semibold text-base text-[#1E293B]">
            {shortenAddress(address)}
          </span>
        </div>
        <span className={`icon-[mdi--chevron-down] w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-[16px] border border-slate-200 shadow-xl z-10 p-4">
          <div className="flex flex-col gap-4">
            {/* Address display with copy button */}
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400 mb-1">Your Address</p>
              <div className="flex items-center gap-2 p-2 bg-slate-100 rounded-[12px]">
                <span className="font-mono text-sm text-slate-700 flex-grow truncate">{address}</span>
                <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-slate-200 transition-colors flex-shrink-0" title="Copy Address">
                  {isCopied
                    ? <span className="icon-[mdi--check] w-5 h-5 text-green-500" />
                    : <span className="icon-[mdi--content-copy] w-5 h-5 text-slate-500" />}
                </button>
              </div>
            </div>

            {/* Balance */}
            <div className="p-4 bg-slate-50 rounded-[12px]">
              <p className="text-sm text-slate-500 mb-1">Your Balance</p>
              <Balance address={address} />
            </div>

            {/* Faucet Link */}
            <a
              href="https://faucet.polkadot.io/?parachain=1111"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 p-4 rounded-[12px] bg-blue-50 text-[#0A84FF] hover:bg-blue-100 transition-colors"
            >
              <span className="icon-[mdi--faucet] w-7 h-7" />
              <div className="flex flex-col">
                <span className="font-bold text-base">Get Test Tokens</span>
                <span className="text-sm text-blue-900/70">Use the faucet for free PAS</span>
              </div>
            </a>

            {/* Disconnect Button */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 h-11 px-4 text-white rounded-[12px] font-sans text-base font-bold bg-[#DC2626] hover:bg-red-600 transition-colors"
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
