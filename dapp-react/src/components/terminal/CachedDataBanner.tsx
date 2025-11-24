interface CachedDataBannerProps {
  lastUpdated: Date
  onRefresh?: () => void
}

export default function CachedDataBanner({
  lastUpdated,
  onRefresh,
}: CachedDataBannerProps) {
  const getTimeAgo = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (hours > 0)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    if (seconds > 0)
      return `${seconds} second${seconds > 1 ? 's' : ''} ago`
    return 'just now'
  }

  return (
    <div
      className="mb-6 p-3 rounded-lg flex items-center justify-between gap-4 animate-fade-in"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-default)',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span
          className="icon-[mdi--clock-outline] w-5 h-5"
          style={{ color: 'var(--accent-amber)' }}
        />
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Showing cached data
          </p>
          <p
            className="text-xs"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Last updated
            {' '}
            {getTimeAgo(lastUpdated)}
          </p>
        </div>
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 text-sm font-medium rounded transition-all hover-lift"
          style={{
            background: 'var(--accent-cyan)',
            color: 'var(--text-inverse)',
          }}
          aria-label="Refresh data"
        >
          <span className="flex items-center gap-1">
            <span className="icon-[mdi--refresh] w-4 h-4" />
            <span>Refresh</span>
          </span>
        </button>
      )}
    </div>
  )
}
