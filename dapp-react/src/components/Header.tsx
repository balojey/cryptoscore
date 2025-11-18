import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Connect from './Connect'
import SearchBar from './SearchBar'

export default function Header() {
  const [showSearch, setShowSearch] = useState(false)
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  return (
    <header 
      className="sticky top-0 z-50 w-full backdrop-blur-sm"
      style={{ 
        background: 'rgba(11, 14, 17, 0.9)',
        borderBottom: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 group">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(0,212,255,0.5)]"
                style={{ color: 'var(--accent-cyan)' }}
              >
                <path
                  d="M12 2L2 7V17L12 22L22 17V7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 12L22 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 12V22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 12L2 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span 
                className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tighter transition-colors hidden sm:block"
                style={{ color: 'var(--text-primary)' }}
              >
                CryptoScore
              </span>
            </Link>
          </div>

          {/* Center - Search (Desktop only, on home page) */}
          {isHomePage && (
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar placeholder="Search markets by team, competition..." />
            </div>
          )}

          {/* Right - Actions */}
          <div className="flex items-center gap-3">
            {/* Search Toggle (Mobile) */}
            {isHomePage && (
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-cyan)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <span className="icon-[mdi--magnify] w-5 h-5" />
              </button>
            )}

            {/* My Markets Link */}
            <Link
              to="/my-markets"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ 
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-default)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-cyan)'
                e.currentTarget.style.color = 'var(--accent-cyan)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-default)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              <span className="icon-[mdi--view-dashboard-outline] w-4 h-4" />
              <span>My Markets</span>
            </Link>

            {/* Wallet Connect */}
            <Connect />
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isHomePage && showSearch && (
          <div className="md:hidden pb-4">
            <SearchBar placeholder="Search markets..." />
          </div>
        )}
      </div>
    </header>
  )
}