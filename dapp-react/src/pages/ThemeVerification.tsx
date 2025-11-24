/**
 * Theme Verification Page
 * Visual testing page for all 6 theme presets on Trading Terminal components
 */

import type { ThemePreset } from '../contexts/ThemeContext'
import type { ThemeVerificationResult } from '../utils/themeVerification'
import { useEffect, useState } from 'react'
import { themePresets, useTheme } from '../contexts/ThemeContext'
import { generateVerificationReport, verifyAllThemes } from '../utils/themeVerification'

export function ThemeVerification() {
  const { theme, setTheme } = useTheme()
  const [verificationResults, setVerificationResults] = useState<ThemeVerificationResult[]>([])
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    // Run verification on mount
    const results = verifyAllThemes()
    setVerificationResults(results)
  }, [])

  const themes: ThemePreset[] = [
    'dark-terminal',
    'ocean-blue',
    'forest-green',
    'sunset-orange',
    'purple-haze',
    'light-mode',
  ]

  const downloadReport = () => {
    const report = generateVerificationReport(verificationResults)
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `theme-verification-report-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div
          className="mb-8 p-6 rounded-lg"
          style={{
            background: 'var(--bg-elevated)',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Theme Verification
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Visual and automated testing for all 6 theme presets
          </p>
        </div>

        {/* Current Theme Info */}
        <div
          className="mb-6 p-4 rounded-lg"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
                Current Theme
              </p>
              <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {themePresets[theme].name}
              </p>
            </div>
            <button
              onClick={() => setShowReport(!showReport)}
              className="px-4 py-2 rounded transition-all"
              style={{
                background: 'var(--accent-cyan)',
                color: 'var(--text-inverse)',
              }}
            >
              {showReport ? 'Hide Report' : 'Show Report'}
            </button>
          </div>
        </div>

        {/* Verification Report */}
        {showReport && (
          <div
            className="mb-6 p-6 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Automated Verification Results
              </h2>
              <button
                onClick={downloadReport}
                className="px-4 py-2 text-sm rounded transition-all"
                style={{
                  background: 'var(--accent-green)',
                  color: 'var(--text-inverse)',
                }}
              >
                Download Report
              </button>
            </div>

            <div className="space-y-4">
              {verificationResults.map((result) => {
                const preset = themePresets[result.theme]
                return (
                  <div
                    key={result.theme}
                    className="p-4 rounded-lg"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: `2px solid ${result.passed ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {preset.name}
                      </h3>
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          background: result.passed ? 'var(--accent-green)' : 'var(--accent-red)',
                          color: 'var(--text-inverse)',
                        }}
                      >
                        {result.passed ? '✅ PASSED' : '❌ FAILED'}
                      </span>
                    </div>

                    {result.errors.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent-red)' }}>
                          Errors:
                        </p>
                        <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                          {result.errors.map((error, i) => (
                            <li key={i}>
                              •
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.warnings.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--accent-amber)' }}>
                          Warnings:
                        </p>
                        <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
                          {result.warnings.map((warning, i) => (
                            <li key={i}>
                              •
                              {warning}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          CSS Variables
                        </p>
                        <p style={{ color: 'var(--text-secondary)' }}>
                          {result.cssVariables.defined.length}
                          {' '}
                          /
                          {result.cssVariables.defined.length + result.cssVariables.missing.length}
                          {' '}
                          defined
                        </p>
                      </div>
                      <div>
                        <p className="font-medium mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          Shadow Intensities
                        </p>
                        <p style={{ color: result.shadowIntensities.appropriate ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
                          {result.shadowIntensities.appropriate ? 'Appropriate' : 'Needs Review'}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Theme Switcher Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Theme Selector
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {themes.map((themeKey) => {
              const preset = themePresets[themeKey]
              const result = verificationResults.find(r => r.theme === themeKey)
              const isActive = theme === themeKey

              return (
                <button
                  key={themeKey}
                  onClick={() => setTheme(themeKey)}
                  className="p-4 rounded-lg transition-all hover:scale-105"
                  style={{
                    background: isActive ? 'var(--accent-cyan)' : 'var(--bg-elevated)',
                    border: `2px solid ${isActive ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
                    boxShadow: isActive ? 'var(--shadow-xl)' : 'var(--shadow-md)',
                  }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={`icon-[${preset.icon}] w-8 h-8`} style={{ color: isActive ? 'var(--text-inverse)' : 'var(--text-primary)' }} />
                    <span className="text-sm font-medium" style={{ color: isActive ? 'var(--text-inverse)' : 'var(--text-primary)' }}>
                      {preset.name}
                    </span>
                    {result && (
                      <span className="text-xs" style={{ color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)' }}>
                        {result.passed ? '✅' : '❌'}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Visual Component Tests */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Visual Component Tests
          </h2>

          {/* Backgrounds Test */}
          <div
            className="p-6 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Backgrounds
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded" style={{ background: 'var(--bg-primary)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Primary</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Secondary</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Elevated</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--bg-hover)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Hover</p>
              </div>
            </div>
          </div>

          {/* Accents Test */}
          <div
            className="p-6 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Accent Colors
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded" style={{ background: 'var(--accent-cyan)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-inverse)' }}>Cyan</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--accent-green)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-inverse)' }}>Green</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--accent-red)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-inverse)' }}>Red</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--accent-amber)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-inverse)' }}>Amber</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--accent-purple)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-inverse)' }}>Purple</p>
              </div>
            </div>
          </div>

          {/* Text Colors Test */}
          <div
            className="p-6 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Text Colors
            </h3>
            <div className="space-y-2">
              <p className="text-lg" style={{ color: 'var(--text-primary)' }}>Primary Text - Main content</p>
              <p className="text-base" style={{ color: 'var(--text-secondary)' }}>Secondary Text - Supporting content</p>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Tertiary Text - Labels and hints</p>
              <p className="text-sm" style={{ color: 'var(--text-disabled)' }}>Disabled Text - Inactive elements</p>
            </div>
          </div>

          {/* Shadows Test */}
          <div
            className="p-6 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Shadow Intensities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-sm)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>SM</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-md)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>MD</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-lg)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>LG</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-xl)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>XL</p>
              </div>
              <div className="p-4 rounded" style={{ background: 'var(--bg-secondary)', boxShadow: 'var(--shadow-2xl)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>2XL</p>
              </div>
            </div>
          </div>

          {/* Buttons Test */}
          <div
            className="p-6 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Buttons
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                className="px-4 py-2 rounded transition-all hover-lift"
                style={{
                  background: 'var(--accent-cyan)',
                  color: 'var(--text-inverse)',
                }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded transition-all hover-lift"
                style={{
                  background: 'var(--accent-green)',
                  color: 'var(--text-inverse)',
                }}
              >
                Success Button
              </button>
              <button
                className="px-4 py-2 rounded transition-all hover-lift"
                style={{
                  background: 'var(--accent-red)',
                  color: 'var(--text-inverse)',
                }}
              >
                Danger Button
              </button>
              <button
                className="px-4 py-2 rounded transition-all hover-lift"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                }}
              >
                Secondary Button
              </button>
            </div>
          </div>

          {/* Cards Test */}
          <div
            className="p-6 rounded-lg"
            style={{
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Cards
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Card Title</h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Card content with secondary text</p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--accent-cyan)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-cyan)' }}>Highlighted Card</h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Card with accent border</p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                <h4 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Elevated Card</h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Card with stronger shadow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
