interface QuickFiltersProps {
  activeFilter?: string
  onFilterChange?: (filter: string) => void
}

const filters = [
  { id: 'all', label: 'All Markets', icon: 'mdi--view-grid-outline' },
  { id: 'live', label: 'Live', icon: 'mdi--lightning-bolt' },
  { id: 'ending-soon', label: 'Ending Soon', icon: 'mdi--clock-alert-outline' },
  { id: 'high-volume', label: 'High Volume', icon: 'mdi--trending-up' },
]

export default function QuickFilters({ activeFilter = 'all', onFilterChange }: QuickFiltersProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {filters.map(filter => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onFilterChange?.(filter.id)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
          style={{
            background: activeFilter === filter.id ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
            color: activeFilter === filter.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
            border: `1px solid ${activeFilter === filter.id ? 'var(--accent-cyan)' : 'var(--border-default)'}`,
          }}
          onMouseEnter={(e) => {
            if (activeFilter !== filter.id) {
              e.currentTarget.style.borderColor = 'var(--border-hover)'
            }
          }}
          onMouseLeave={(e) => {
            if (activeFilter !== filter.id) {
              e.currentTarget.style.borderColor = 'var(--border-default)'
            }
          }}
        >
          <span className={`icon-[${filter.icon}] w-4 h-4`} />
          <span>{filter.label}</span>
        </button>
      ))}
    </div>
  )
}
