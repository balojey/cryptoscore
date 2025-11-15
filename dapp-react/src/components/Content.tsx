import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Markets } from './Markets'
import PublicMarkets from './PublicMarkets'
import { UserMarkets } from './UserMarkets'

export default function Content() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  function openModal() {
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
  }

  return (
    <div className="bg-[#F5F7FA] min-h-screen">
      <div className="container mx-auto px-4 py-16 sm:py-24 space-y-24">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-jakarta text-4xl sm:text-5xl font-bold text-[#1E293B] mb-4 tracking-tight">
            The Premier Sports Prediction Market
          </h1>
          <p className="text-lg sm:text-xl text-slate-600">
            Challenge the crowd, predict game outcomes, and earn rewards. Your sports knowledge is your greatest asset.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={openModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-8 bg-[#0A84FF] text-white rounded-[12px] font-sans text-base font-bold uppercase tracking-wider transition-all hover:bg-blue-600 active:bg-blue-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              <span className="icon-[mdi--plus-circle-outline] w-5 h-5" />
              <span>Create Market</span>
            </button>
            <Link
              to="/my-markets"
              className="w-full sm:w-auto flex items-center justify-center gap-2 h-12 px-8 bg-transparent text-[#0A84FF] rounded-[12px] font-sans text-base font-bold uppercase tracking-wider transition-all border-2 border-[#0A84FF] hover:bg-[#0A84FF]/10 active:bg-[#0A84FF]/20"
            >
              <span className="icon-[mdi--view-dashboard-outline] w-5 h-5" />
              <span>My Markets</span>
            </Link>
          </div>
        </div>

        {/* User's Markets Section */}
        <div className="max-w-7xl mx-auto">
          <UserMarkets />
        </div>

        {/* Public Markets Section */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <span className="icon-[mdi--stadium-outline] w-8 h-8 text-[#0BC95A]" />
            <h2 className="font-jakarta text-3xl font-bold text-[#1E293B]">
              Open Markets
            </h2>
          </div>
          <PublicMarkets />
        </div>

      </div>

      {/* Create Market Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-[16px] shadow-2xl w-11/12 max-w-5xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="font-jakarta text-2xl font-bold text-[#1E293B]">Create a New Market</h3>
              <button
                type="button"
                className="h-10 w-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                onClick={closeModal}
              >
                <span className="icon-[mdi--close] w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <Markets />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
