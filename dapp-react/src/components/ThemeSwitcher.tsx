import { useState } from 'react'
import { ThemePreset, themePresets, useTheme } from '../contexts/ThemeContext'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {/* Theme Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-default)',
          background: 'var(--bg-elevated)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-cyan)'
          e.currentTarget.style.color = 'var(--accent-cyan)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-default)'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }}
        aria-label="Change theme (Ctrl+Shift+T)"
        aria-expanded={isOpen}
        title="Change theme (Ctrl+Shift+T to cycle)"
      >
        <span className={`icon-[${themePresets[theme].icon}] w-5 h-5`} />
        <span className="hidden sm:inline">{themePresets[theme].name}</span>
        <span className={`icon-[mdi--chevron-down] w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div
            className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
            }}
            role="menu"
            aria-orientation="vertical"
          >
            <div
              className="px-4 py-3 border-b"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Choose Theme
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--text-disabled)' }}
              >
                Press Ctrl+Shift+T to cycle
              </p>
            </div>

            <div className="py-2">
              {(Object.keys(themePresets) as ThemePreset[]).map((presetKey) => {
                const preset = themePresets[presetKey]
                const isActive = theme === presetKey

                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => {
                      setTheme(presetKey)
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all"
                    style={{
                      color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--bg-hover)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-hover)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }
                    }}
                    role="menuitem"
                  >
                    {/* Icon */}
                    <span className={`icon-[${preset.icon}] w-5 h-5 flex-shrink-0`} />

                    {/* Name */}
                    <span className="flex-1 text-left">{preset.name}</span>

                    {/* Active Indicator */}
                    {isActive && (
                      <span className="icon-[mdi--check] w-5 h-5 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Preview Colors */}
            <div
              className="px-4 py-3 border-t"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                Preview
              </p>
              <div className="flex gap-2">
                <div
                  className="w-8 h-8 rounded-lg border-2"
                  style={{
                    background: 'var(--accent-cyan)',
                    borderColor: 'var(--border-default)',
                  }}
                  title="Primary Accent"
                />
                <div
                  className="w-8 h-8 rounded-lg border-2"
                  style={{
                    background: 'var(--accent-green)',
                    borderColor: 'var(--border-default)',
                  }}
                  title="Success"
                />
                <div
                  className="w-8 h-8 rounded-lg border-2"
                  style={{
                    background: 'var(--accent-red)',
                    borderColor: 'var(--border-default)',
                  }}
                  title="Error"
                />
                <div
                  className="w-8 h-8 rounded-lg border-2"
                  style={{
                    background: 'var(--accent-amber)',
                    borderColor: 'var(--border-default)',
                  }}
                  title="Warning"
                />
                <div
                  className="w-8 h-8 rounded-lg border-2"
                  style={{
                    background: 'var(--accent-purple)',
                    borderColor: 'var(--border-default)',
                  }}
                  title="Info"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
