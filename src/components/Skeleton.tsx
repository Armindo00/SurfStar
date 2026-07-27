type Props = {
  lines?: number
  className?: string
}

export function Skeleton({ lines = 3, className }: Props) {
  const rootClass = className ? `skeleton-block ${className}` : 'skeleton-block'
  return (
    <div className={rootClass} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton-line" style={{ width: i === lines - 1 ? '72%' : '100%' }} />
      ))}
    </div>
  )
}

export function SkeletonCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="ss-card skeleton-card" aria-busy="true" aria-label="Loading">
      <Skeleton lines={lines} />
    </div>
  )
}
