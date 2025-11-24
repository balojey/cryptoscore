import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
    <Button
      variant={active ? 'default' : 'secondary'}
      size="sm"
      onClick={onClick}
      className="gap-2 whitespace-nowrap"
    >
      <span className={`icon-[${icon}] w-4 h-4`} />
      <span>{label}</span>
    </Button>
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2"
        >
          <span className={`icon-[mdi--${isExpanded ? 'chevron-up' : 'chevron-down'}] w-5 h-5`} />
          <span>
            {isExpanded ? 'Hide' : 'Show'}
            {' '}
            Advanced Filters
          </span>
        </Button>
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

          {/* Publicity Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Visibility:
            </span>
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filters.isPublic === undefined}
                onClick={() => onFilterChange({ ...filters, isPublic: undefined })}
                icon="mdi--eye-outline"
                label="All Markets"
              />
              <FilterButton
                active={filters.isPublic === true}
                onClick={() => onFilterChange({ ...filters, isPublic: true })}
                icon="mdi--earth"
                label="Public Only"
              />
              <FilterButton
                active={filters.isPublic === false}
                onClick={() => onFilterChange({ ...filters, isPublic: false })}
                icon="mdi--lock-outline"
                label="Private Only"
              />
            </div>
          </div>

          {/* Pool Size & Entry Fee Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Min Pool Size */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                Min Pool Size (PAS)
              </label>
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="Any"
                value={filters.minPoolSize || ''}
                onChange={e => onFilterChange({
                  ...filters,
                  minPoolSize: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>

            {/* Min Entry Fee */}
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-tertiary)' }}>
                Min Entry Fee (PAS)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Any"
                value={filters.minEntryFee || ''}
                onChange={e => onFilterChange({
                  ...filters,
                  minEntryFee: e.target.value ? Number(e.target.value) : undefined,
                })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(filters.status !== 'all'
        || filters.sortBy !== 'newest'
        || filters.timeRange !== 'all'
        || filters.isPublic !== undefined
        || filters.minPoolSize !== undefined
        || filters.minEntryFee !== undefined) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Active filters:
          </span>
          {filters.status !== 'all' && (
            <Badge variant="default">
              {statusOptions.find(o => o.value === filters.status)?.label}
            </Badge>
          )}
          {filters.sortBy !== 'newest' && (
            <Badge variant="info">
              {sortOptions.find(o => o.value === filters.sortBy)?.label}
            </Badge>
          )}
          {filters.timeRange && filters.timeRange !== 'all' && (
            <Badge variant="warning">
              {filters.timeRange === 'today'
                ? 'Today'
                : filters.timeRange === 'week' ? 'This Week' : 'This Month'}
            </Badge>
          )}
          {filters.isPublic !== undefined && (
            <Badge variant={filters.isPublic ? 'default' : 'info'}>
              {filters.isPublic ? 'Public' : 'Private'}
            </Badge>
          )}
          {filters.minPoolSize !== undefined && (
            <Badge variant="success">
              Pool ≥
              {' '}
              {filters.minPoolSize}
              {' '}
              PAS
            </Badge>
          )}
          {filters.minEntryFee !== undefined && (
            <Badge variant="success">
              Entry ≥
              {' '}
              {filters.minEntryFee}
              {' '}
              PAS
            </Badge>
          )}
          <Button
            variant="link"
            size="sm"
            onClick={() => onFilterChange({
              status: 'all',
              sortBy: 'newest',
              timeRange: 'all',
              minPoolSize: undefined,
              maxPoolSize: undefined,
              minEntryFee: undefined,
              maxEntryFee: undefined,
            })}
            className="text-xs h-auto p-0"
            style={{ color: 'var(--accent-red)' }}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
