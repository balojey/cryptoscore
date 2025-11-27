import type { ThemePreset } from '@/contexts/ThemeContext'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { themePresets, useTheme } from '@/contexts/ThemeContext'
import Connect from '../Connect'
import SearchBar from '../SearchBar'
import ThemeSwitcher from '../ThemeSwitcher'

export default function Header() {
  const [showSearch, setShowSearch] = useState(false)
  const location = useLocation()
  const isMarketsPage = location.pathname === '/markets' || location.pathname.startsWith('/markets/')
  const { theme, setTheme } = useTheme()
  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-sm"
      style={{
        background: 'var(--bg-overlay)',
        borderBottom: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
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
                className="font-['Plus_Jakarta_Sans'] text-xl sm:text-2xl font-bold tracking-tighter transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                CryptoScore
              </span>
            </Link>
          </div>

          {/* Center - Search (Desktop only, on markets page) */}
          {isMarketsPage && (
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar placeholder="Search markets by team, competition..." />
            </div>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              style={{
                background: location.pathname === '/' ? 'var(--accent-cyan)' : undefined,
                color: location.pathname === '/' ? 'var(--text-inverse)' : undefined,
                borderColor: location.pathname === '/' ? 'var(--accent-cyan)' : undefined,
              }}
            >
              <Link to="/">
                <span className="icon-[mdi--home] w-4 h-4" />
                <span>Home</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              style={{
                background: location.pathname === '/markets' || location.pathname.startsWith('/markets/') ? 'var(--accent-cyan)' : undefined,
                color: location.pathname === '/markets' || location.pathname.startsWith('/markets/') ? 'var(--text-inverse)' : undefined,
                borderColor: location.pathname === '/markets' || location.pathname.startsWith('/markets/') ? 'var(--accent-cyan)' : undefined,
              }}
            >
              <Link to="/markets">
                <span className="icon-[mdi--chart-box-outline] w-4 h-4" />
                <span>Markets</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              style={{
                background: location.pathname === '/terminal' ? 'var(--accent-cyan)' : undefined,
                color: location.pathname === '/terminal' ? 'var(--text-inverse)' : undefined,
                borderColor: location.pathname === '/terminal' ? 'var(--accent-cyan)' : undefined,
              }}
            >
              <Link to="/terminal">
                <span className="icon-[mdi--monitor-dashboard] w-4 h-4" />
                <span>Terminal</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              style={{
                background: location.pathname === '/dashboard' ? 'var(--accent-cyan)' : undefined,
                color: location.pathname === '/dashboard' ? 'var(--text-inverse)' : undefined,
                borderColor: location.pathname === '/dashboard' ? 'var(--accent-cyan)' : undefined,
              }}
            >
              <Link to="/dashboard">
                <span className="icon-[mdi--view-dashboard-outline] w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              style={{
                background: location.pathname === '/leaderboard' ? 'var(--accent-cyan)' : undefined,
                color: location.pathname === '/leaderboard' ? 'var(--text-inverse)' : undefined,
                borderColor: location.pathname === '/leaderboard' ? 'var(--accent-cyan)' : undefined,
              }}
            >
              <Link to="/leaderboard">
                <span className="icon-[mdi--trophy] w-4 h-4" />
                <span>Leaderboard</span>
              </Link>
            </Button>

            <ThemeSwitcher />

            <Connect />
          </div>

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
                style={{
                  color: 'var(--text-primary)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isMarketsPage && (
                <>
                  <DropdownMenuItem
                    onClick={() => setShowSearch(!showSearch)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="icon-[mdi--magnify] w-4 h-4" />
                    <span>{showSearch ? 'Hide Search' : 'Show Search'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem asChild>
                <Link
                  to="/"
                  className="flex items-center gap-2 cursor-pointer"
                  style={{
                    color: location.pathname === '/' ? 'var(--accent-cyan)' : undefined,
                    background: location.pathname === '/' ? 'var(--bg-hover)' : undefined,
                  }}
                >
                  <span className="icon-[mdi--home] w-4 h-4" />
                  <span>Home</span>
                  {location.pathname === '/' && (
                    <span className="icon-[mdi--check] w-4 h-4 ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  to="/markets"
                  className="flex items-center gap-2 cursor-pointer"
                  style={{
                    color: location.pathname === '/markets' || location.pathname.startsWith('/markets/') ? 'var(--accent-cyan)' : undefined,
                    background: location.pathname === '/markets' || location.pathname.startsWith('/markets/') ? 'var(--bg-hover)' : undefined,
                  }}
                >
                  <span className="icon-[mdi--chart-box-outline] w-4 h-4" />
                  <span>Markets</span>
                  {(location.pathname === '/markets' || location.pathname.startsWith('/markets/')) && (
                    <span className="icon-[mdi--check] w-4 h-4 ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  to="/terminal"
                  className="flex items-center gap-2 cursor-pointer"
                  style={{
                    color: location.pathname === '/terminal' ? 'var(--accent-cyan)' : undefined,
                    background: location.pathname === '/terminal' ? 'var(--bg-hover)' : undefined,
                  }}
                >
                  <span className="icon-[mdi--monitor-dashboard] w-4 h-4" />
                  <span>Terminal</span>
                  {location.pathname === '/terminal' && (
                    <span className="icon-[mdi--check] w-4 h-4 ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 cursor-pointer"
                  style={{
                    color: location.pathname === '/dashboard' ? 'var(--accent-cyan)' : undefined,
                    background: location.pathname === '/dashboard' ? 'var(--bg-hover)' : undefined,
                  }}
                >
                  <span className="icon-[mdi--view-dashboard-outline] w-4 h-4" />
                  <span>Dashboard</span>
                  {location.pathname === '/dashboard' && (
                    <span className="icon-[mdi--check] w-4 h-4 ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  to="/leaderboard"
                  className="flex items-center gap-2 cursor-pointer"
                  style={{
                    color: location.pathname === '/leaderboard' ? 'var(--accent-cyan)' : undefined,
                    background: location.pathname === '/leaderboard' ? 'var(--bg-hover)' : undefined,
                  }}
                >
                  <span className="icon-[mdi--trophy] w-4 h-4" />
                  <span>Leaderboard</span>
                  {location.pathname === '/leaderboard' && (
                    <span className="icon-[mdi--check] w-4 h-4 ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <div className="px-2 py-2">
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Theme:
                  {' '}
                  {themePresets[theme].name}
                </div>
                {(Object.keys(themePresets) as ThemePreset[]).map((presetKey) => {
                  const preset = themePresets[presetKey]
                  const isActive = theme === presetKey

                  return (
                    <DropdownMenuItem
                      key={presetKey}
                      onClick={() => setTheme(presetKey)}
                      className="gap-3 py-2 cursor-pointer"
                      style={{
                        color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        background: isActive ? 'var(--bg-hover)' : 'transparent',
                      }}
                    >
                      <span className={`icon-[${preset.icon}] w-4 h-4 flex-shrink-0`} />
                      <span className="flex-1">{preset.name}</span>
                      {isActive && (
                        <span className="icon-[mdi--check] w-4 h-4 flex-shrink-0" />
                      )}
                    </DropdownMenuItem>
                  )
                })}
              </div>

              <DropdownMenuSeparator />

              <div className="px-2 py-2">
                <Connect />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Search Bar */}
        {isMarketsPage && showSearch && (
          <div className="md:hidden pb-4">
            <SearchBar placeholder="Search markets..." />
          </div>
        )}
      </div>
    </header>
  )
}
