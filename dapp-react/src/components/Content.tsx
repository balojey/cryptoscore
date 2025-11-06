import type { Chain } from 'wagmi/chains'
import { useCallback, useMemo, useState } from 'react'
import { useAccount, useChainId, useChains } from 'wagmi'
import { shortenAddress } from '../utils/formatters'
import Balance from './Balance'
import { Markets } from './Markets' // Import Markets component

export default function Content() {
  // Account and contract hooks
  const { address } = useAccount()
  const chainId = useChainId()
  const chains = useChains()

  // Get the connected chain instead of using config
  const connectedChain = useMemo(() => {
    return chains.find((chain: Chain) => chain.id === chainId) || chains[0]
  }, [chains, chainId])

  const [toastMessage, setToastMessage] = useState('')
  const [showToast, setShowToast] = useState(false)

  // Account display helpers
  const displayAddress = address ? shortenAddress(address) : 'Not connected'

  // Toast notification utility
  const showToastNotification = useCallback((message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }, [])

  // Handle copying address to clipboard
  function copyAddress() {
    if (address) {
      navigator.clipboard.writeText(address)
      showToastNotification('Address copied to clipboard!')
    }
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-mono font-bold text-black mb-2 tracking-wide">
            Sports Predictive Market
          </h1>
          <p className="text-xl text-gray-600 font-mono flex items-center justify-center gap-2">
            <span>Predict the outcome of your favorite sports</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* User Info Panel (Left Side) */}
          <div className="card bg-white shadow-lg border border-gray-200 h-fit lg:col-span-1">
            <div className="card-body">
              <h2 className="card-title text-black mb-4 flex items-center">
                <span className="icon-[mdi--account-circle] w-5 h-5 mr-2" />
                Account Info
              </h2>

              {/* Wallet Address */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Wallet Address</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs hover:-translate-y-px transition-transform"
                    disabled={!address}
                    onClick={copyAddress}
                  >
                    <span className="icon-[mdi--content-copy] w-3 h-3" />
                  </button>
                </div>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
                  {displayAddress}
                </div>
              </div>

              {/* Network & Balance Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Network Info */}
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Network
                  </div>
                  <div className="text-sm text-gray-800">
                    {connectedChain.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Chain ID:
                    {' '}
                    {' '}
                    {connectedChain.id}
                  </div>
                </div>

                {/* Balance Info */}
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Balance
                  </div>
                  <div className="flex items-center space-x-1 mb-1">
                    {address ? <Balance address={address} /> : <span className="font-mono font-semibold">0 PAS</span>}
                  </div>
                  <a
                    href="https://faucet.polkadot.io/?parachain=1111"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span className="icon-[mdi--water] w-3 h-3" />
                    <span>Get Testnet PAS</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Markets Component (Right Side) */}
          <div className="lg:col-span-2">
            <Markets />
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast toast-top toast-end">
          <div className="alert alert-success">
            <span className="icon-[mdi--check-circle] w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  )
}
