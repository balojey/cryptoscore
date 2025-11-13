import { Link } from 'react-router-dom'
import { useCallback, useMemo, useState } from 'react'
import type { Chain } from 'wagmi/chains'
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
  const [isModalOpen, setIsModalOpen] = useState(false)

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
          <p className="text-gray-600 mt-4">
            Ready to launch your own match market? Click below to create one!
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link to="/my-markets" className="btn btn-primary">
              My Markets
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-secondary"
            >
              Create Markets
            </button>
          </div>
        </div>

        {/* Modal for Creating Markets */}
        <dialog id="markets_modal" className={`modal ${isModalOpen ? 'modal-open' : ''}`}>
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg">Create a New Market</h3>
            <div className="py-4">
              <Markets />
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button onClick={() => setIsModalOpen(false)} className="btn">Close</button>
              </form>
            </div>
          </div>
        </dialog>
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
