import { Link } from 'react-router-dom';
import type { Chain } from 'wagmi/chains'
import { useCallback, useMemo, useState } from 'react'
import { useAccount, useChainId, useChains } from 'wagmi'
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

  // Toast notification utility
  const showToastNotification = useCallback((message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => {
      setShowToast(false)
    }, 3000)
  }, [])

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
          <div className="mt-4">
            <Link to="/my-markets" className="btn btn-primary">
              My Markets
            </Link>
          </div>
        </div>

        <div className="mb-8">
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
