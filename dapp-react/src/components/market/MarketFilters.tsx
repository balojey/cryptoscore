import { useState } from 'react'

export interface FilterOptions {
  status: 'all' | 'open' | 'live' | 'resolved'
  sortBy: 'newest' | 'ending-soon' | 'highest-pool' | 'most-participants'
  isPublic?: boolean
  timeRange?: 'all' | 'today' | 'week' | 'month'
  minPoolSize?: number
  maxPoolSize?: number
  minEntryFee?: number
  maxEntryFee?: number
}

interface MarketFiltersProps {
  filters: FilterOptions
  onFilterChange: (filters: FilterOptions) => void
}

export default function MarketFilters({ filters, onFilterChange }: MarketFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusOptions = [
    { value: 'all', label: 'All Markets', icon: 'mdi--view-grid-outline' },
    { value: 'open', label: 'Open', icon: 'mdi--door-open' },
    { value: 'live', label: 'Live', icon: 'mdi--lightning-bolt' },
    { value: 'resolved', label: 'Resolved', icon: 'mdi--check-circle' },
  ] as const

  const sortOptions = [
    { value: 'newest', label: 'Newest First', icon: 'mdi--clock-outline' },
    { value: 'ending-soon', label: 'Ending Soon', icon: 'mdi--clock-alert-outline' },
    { value: 'highest-pool', label: 'Highest Pool', icon: 'mdi--trending-up' },
    { value: 'most-participants', label: 'Most Popular', icon: 'mdi--account-group' },
  ] as const

  const FilterButton = ({
    active,
    onClick,
    icon,
    label,
  }: {
    active: boolean
    onClick: () => void
    icon: string
    label: string
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
      style={{
        background: active ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
        color: active ? 'var(--text-inverse)' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--border-hover)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--border-default)'
        }
      }}
    >
      <span className={`icon-[${icon}] w-4 h-4`} />
      <span>{label}</span>
    </button>
  )

  return (
    <div className="space-y-4">
      {/* Quick Filters - Always Visible */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Status:
        </span>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(option => (
            <FilterButton
              key={option.value}
              active={filters.status === option.value}
              onClick={() => onFilterChange({ ...filters, status: option.value })}
              icon={option.icon}
              label={option.label}
            />
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <span className={`icon-[mdi--${isExpanded ? 'chevron-up' : 'chevron-down'}] w-5 h-5`} />
          <span>
            {isExpanded ? 'Hide' : 'Show'}
            {' '}
            Advanced Filters
          </span>
        </button>
      </div>

      {/* Advanced Filters - Expandable */}
      {isExpanded && (
        <div className="space-y-4 animate-slide-up">
          {/* Sort Options */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Sort by:
            </span>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map(option => (
                <FilterButton
                  key={option.value}
                  active={filters.sortBy === option.value}
                  onClick={() => onFilterChange({ ...filters, sortBy: option.value })}
                  icon={option.icon}
                  label={option.label}
                />
              ))}
            </div>
          </div>

          {/* Time Range Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Time:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All Time', icon: 'mdi--calendar' },
                { value: 'today', label: 'Today', icon: 'mdi--calendar-today' },
                { value: 'week', label: 'This Week', icon: 'mdi--calendar-week' },
                { value: 'month', label: 'This Month', icon: 'mdi--calendar-month' },
              ].map(option => (
                <FilterButton
                  key={option.value}
                  active={filters.timeRange === option.value || (!filters.timeRange && option.value === 'all')}
                  onClick={() => onFilterChange({ ...filters, timeRange: option.value as any })}
                  icon={option.icon}
                  label={option.label}
                />
              ))}
            </div>
          </div>

          {/* Pool Size & Entry Fee Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Min Pool Size */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                Min Pool Size (PAS)
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Any"
                value={filters.minPoolSize || ''}
                onChange={e => onFilterChange({
                  ...filters,
                  minPoolSize: e.target.value ? Number(e.target.value) : undefined,
                })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Min Entry Fee */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                Min Entry Fee (PAS)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Any"
                value={filters.minEntryFee || ''}
                onChange={e => onFilterChange({
                  ...filters,
                  minEntryFee: e.target.value ? Number(e.target.value) : undefined,
                })}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(filters.status !== 'all'
        || filters.sortBy !== 'newest'
        || filters.timeRange !== 'all'
        || filters.minPoolSize !== undefined
        || filters.minEntryFee !== undefined) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Active filters:
          </span>
          {filters.status !== 'all' && (
            <span
              className="badge badge-sm"
              style={{
                background: 'var(--accent-cyan-glow)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--accent-cyan)',
              }}
            >
              {statusOptions.find(o => o.value === filters.status)?.label}
            </span>
          )}
          {filters.sortBy !== 'newest' && (
            <span
              className="badge badge-sm"
              style={{
                background: 'var(--accent-purple-glow)',
                color: 'var(--accent-purple)',
                border: '1px solid var(--accent-purple)',
              }}
            >
              {sortOptions.find(o => o.value === filters.sortBy)?.label}
            </span>
          )}
          {filters.timeRange && filters.timeRange !== 'all' && (
            <span
              className="badge badge-sm"
              style={{
                background: 'var(--accent-amber-glow)',
                color: 'var(--accent-amber)',
                border: '1px solid var(--accent-amber)',
              }}
            >
              {filters.timeRange === 'today'
                ? 'Today'
                : filters.timeRange === 'week' ? 'This Week' : 'This Month'}
            </span>
          )}
          {filters.minPoolSize !== undefined && (
            <span
              className="badge badge-sm"
              style={{
                background: 'var(--accent-green-glow)',
                color: 'var(--accent-green)',
                border: '1px solid var(--accent-green)',
              }}
            >
              Pool ≥
              {' '}
              {filters.minPoolSize}
              {' '}
              PAS
            </span>
          )}
          {filters.minEntryFee !== undefined && (
            <span
              className="badge badge-sm"
              style={{
                background: 'var(--accent-green-glow)',
                color: 'var(--accent-green)',
                border: '1px solid var(--accent-green)',
              }}
            >
              Entry ≥
              {' '}
              {filters.minEntryFee}
              {' '}
              PAS
            </span>
          )}
          <button
            type="button"
            onClick={() => onFilterChange({
              status: 'all',
              sortBy: 'newest',
              timeRange: 'all',
              minPoolSize: undefined,
              maxPoolSize: undefined,
              minEntryFee: undefined,
              maxEntryFee: undefined,
            })}
            className="text-xs hover:underline"
            style={{ color: 'var(--accent-red)' }}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
