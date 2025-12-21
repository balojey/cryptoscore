import type { ThemePreset } from '@/contexts/ThemeContext'
import { Menu } from 'lucide-react'
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
import CurrencySelector from '../CurrencySelector'
import ThemeSwitcher from '../ThemeSwitcher'

export default function Header() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  // Helper function to determine if a navigation link is active
  const isActiveRoute = (path: string): boolean => {
    if (path === '/markets') {
      return location.pathname === '/markets' || location.pathname.startsWith('/markets/')
    }
    return location.pathname === path
  }

  // Helper function to get active state styles for navigation buttons
  const getActiveStyles = (isActive: boolean) => ({
    background: isActive ? 'var(--accent-cyan)' : undefined,
    color: isActive ? 'var(--text-inverse)' : undefined,
    borderColor: isActive ? 'var(--accent-cyan)' : undefined,
  })

  // Helper function to get active state styles for mobile menu items
  const getMobileActiveStyles = (isActive: boolean) => ({
    color: isActive ? 'var(--accent-cyan)' : undefined,
    background: isActive ? 'var(--bg-hover)' : undefined,
  })
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

          {/* Desktop Navigation and Utilities */}
          <div className="hidden md:flex items-center gap-3">
            {/* Primary Navigation Links */}
            <Button
              variant="outline"
              size="sm"
              asChild
              style={getActiveStyles(isActiveRoute('/markets'))}
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
              style={getActiveStyles(isActiveRoute('/terminal'))}
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
              style={getActiveStyles(isActiveRoute('/dashboard'))}
            >
              <Link to="/dashboard">
                <span className="icon-[mdi--view-dashboard-outline] w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </Button>

            {/* Utility Controls */}
            <CurrencySelector />
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
              {/* Navigation Links */}
              <DropdownMenuItem asChild>
                <Link
                  to="/markets"
                  className="flex items-center gap-2 cursor-pointer"
                  style={getMobileActiveStyles(isActiveRoute('/markets'))}
                >
                  <span className="icon-[mdi--chart-box-outline] w-4 h-4" />
                  <span>Markets</span>
                  {isActiveRoute('/markets') && (
                    <span className="icon-[mdi--check] w-4 h-4 ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  to="/terminal"
                  className="flex items-center gap-2 cursor-pointer"
                  style={getMobileActiveStyles(isActiveRoute('/terminal'))}
                >
                  <span className="icon-[mdi--monitor-dashboard] w-4 h-4" />
                  <span>Terminal</span>
                  {isActiveRoute('/terminal') && (
                    <span className="icon-[mdi--check] w-4 h-4 ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 cursor-pointer"
                  style={getMobileActiveStyles(isActiveRoute('/dashboard'))}
                >
                  <span className="icon-[mdi--view-dashboard-outline] w-4 h-4" />
                  <span>Dashboard</span>
                  {isActiveRoute('/dashboard') && (
                    <span className="icon-[mdi--check] w-4 h-4 ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Currency Selector Section */}
              <div className="px-2 py-2">
                <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Currency
                </div>
                <CurrencySelector />
              </div>

              <DropdownMenuSeparator />

              {/* Theme Selector Section */}
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

              {/* Wallet Connection */}
              <div className="px-2 py-2">
                <Connect />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
