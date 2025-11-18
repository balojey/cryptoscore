interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className = '', width = '100%', height = '1rem' }: SkeletonProps) {
  return (
    <div
      className={`skeleton rounded ${className}`}
      style={{
        width,
        height,
        background: 'var(--bg-secondary)',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }}
    />
  )
}

export function MarketCardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="120px" height="24px" />
        <Skeleton width="60px" height="20px" />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton width="64px" height="64px" className="rounded-lg" />
        <div className="flex-1">
          <Skeleton width="80%" height="20px" className="mb-2" />
          <Skeleton width="60%" height="16px" />
        </div>
        <Skeleton width="64px" height="64px" className="rounded-lg" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton width="100%" height="8px" />
        <Skeleton width="100%" height="8px" />
        <Skeleton width="100%" height="8px" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton width="100px" height="16px" />
        <Skeleton width="80px" height="16px" />
      </div>
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card">
      <Skeleton width="120px" height="16px" className="mb-2" />
      <Skeleton width="160px" height="32px" className="mb-1" />
      <Skeleton width="80px" height="14px" />
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="card">
      <Skeleton width="150px" height="20px" className="mb-4" />
      <Skeleton width="100%" height="300px" className="rounded-lg" />
    </div>
  )
}
