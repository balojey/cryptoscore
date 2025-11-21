interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'info'
}

export default function ErrorBanner({
  message,
  onRetry,
  onDismiss,
  type = 'error',
}: ErrorBannerProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return 'mdi--alert-circle'
      case 'warning':
        return 'mdi--alert'
      case 'info':
        return 'mdi--information'
      default:
        return 'mdi--alert-circle'
    }
  }

  const getColor = () => {
    switch (type) {
      case 'error':
        return 'var(--accent-red)'
      case 'warning':
        return 'var(--accent-amber)'
      case 'info':
        return 'var(--accent-cyan)'
      default:
        return 'var(--accent-red)'
    }
  }

  return (
    <div
      className="mb-6 p-4 rounded-lg flex items-center justify-between gap-4 animate-slide-in-down"
      style={{
        background: 'var(--bg-elevated)',
        border: `2px solid ${getColor()}`,
        boxShadow: 'var(--shadow-lg)',
      }}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span
          className={`icon-[${getIcon()}] w-6 h-6 flex-shrink-0`}
          style={{ color: getColor() }}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {message}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-sm font-medium rounded transition-all hover-lift"
            style={{
              background: getColor(),
              color: 'var(--text-inverse)',
            }}
            aria-label="Retry loading data"
          >
            <span className="flex items-center gap-1">
              <span className="icon-[mdi--refresh] w-4 h-4" />
              <span>Retry</span>
            </span>
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded transition-all hover:bg-opacity-10"
            style={{
              color: 'var(--text-tertiary)',
            }}
            aria-label="Dismiss error"
          >
            <span className="icon-[mdi--close] w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}
