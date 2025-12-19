import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Markets } from './market/Markets'
import PublicMarkets from './market/PublicMarkets'
import { UserMarkets } from './market/UserMarkets'

export default function Content() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  function openModal() {
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-24">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <h1
            className="font-jakarta text-4xl sm:text-5xl font-bold mb-4 tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            The Premier Sports Prediction Market
          </h1>
          <p className="text-lg sm:text-xl" style={{ color: 'var(--text-secondary)' }}>
            Challenge the crowd, predict game outcomes, and earn rewards. Your sports knowledge is your greatest asset.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={openModal}
              className="btn-primary btn-lg w-full sm:w-auto"
            >
              <span className="icon-[mdi--plus-circle-outline] w-5 h-5" />
              <span>Create Market</span>
            </button>
            <Link
              to="/dashboard"
              className="btn-secondary btn-lg w-full sm:w-auto"
            >
              <span className="icon-[mdi--monitor-dashboard] w-5 h-5" />
              <span>Dashboard</span>
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
            <span className="icon-[mdi--stadium-outline] w-8 h-8" style={{ color: 'var(--accent-green)' }} />
            <h2 className="font-jakarta text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Open Markets
            </h2>
          </div>
          <PublicMarkets />
        </div>

      </div>

      {/* Create Market Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          style={{ background: 'var(--bg-overlay)' }}
          onClick={closeModal}
        >
          <div
            className="rounded-[16px] shadow-2xl w-11/12 max-w-5xl flex flex-col max-h-[90vh]"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-6"
              style={{ borderBottom: '1px solid var(--border-default)' }}
            >
              <h3 className="font-jakarta text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Create a New Market
              </h3>
              <button
                type="button"
                className="h-10 w-10 flex items-center justify-center rounded-full transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
