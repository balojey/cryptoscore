import { Link } from 'react-router-dom'

type Timeframe = '24h' | '7d' | '30d' | 'all'

interface TerminalHeaderProps {
  selectedTimeframe: Timeframe
  onTimeframeChange: (timeframe: Timeframe) => void
}

export default function TerminalHeader({
  selectedTimeframe,
  onTimeframeChange,
}: TerminalHeaderProps) {
  const timeframes: { value: Timeframe, label: string }[] = [
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: 'all', label: 'All Time' },
  ]

  return (
    <div
      className="mb-6 md:mb-8 p-4 md:p-6 rounded-lg animate-fade-in"
      style={{
        background: 'var(--bg-elevated)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title Section with Live Indicator */}
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl md:text-3xl font-bold font-display"
            style={{ color: 'var(--text-primary)' }}
          >
            Trading Terminal
          </h1>
          <span
            className="flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full animate-pulse-glow"
            style={{
              background: 'var(--accent-green)',
              color: 'var(--text-inverse)',
            }}
            aria-live="polite"
            aria-label="Live trading terminal"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--text-inverse)' }}
              aria-hidden="true"
            />
            LIVE
          </span>
        </div>

        {/* Actions Section */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Timeframe Selector */}
          <div
            className="flex gap-2"
            role="radiogroup"
            aria-label="Select timeframe"
          >
            {timeframes.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onTimeframeChange(value)}
                className="px-3 py-1.5 text-sm font-medium rounded transition-all hover-lift"
                style={{
                  background: selectedTimeframe === value ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                  color: selectedTimeframe === value ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: `1px solid ${selectedTimeframe === value ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
                }}
                role="radio"
                aria-checked={selectedTimeframe === value}
                aria-label={`${label} timeframe`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Leaderboard Link */}
          <Link
            to="/leaderboard"
            className="px-4 py-1.5 text-sm font-medium rounded transition-all hover-lift flex items-center gap-2"
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
            aria-label="View leaderboard"
          >
            <span className="icon-[mdi--trophy] w-4 h-4" aria-hidden="true" />
            Leaderboard
          </Link>

          {/* View All Markets CTA */}
          <Link
            to="/markets"
            className="px-4 py-1.5 text-sm font-medium rounded transition-all hover-lift hover-glow"
            style={{
              background: 'var(--accent-cyan)',
              color: 'var(--text-inverse)',
              border: '1px solid var(--accent-cyan)',
            }}
            aria-label="View all markets"
          >
            View All Markets →
          </Link>
        </div>
      </div>
    </div>
  )
}
