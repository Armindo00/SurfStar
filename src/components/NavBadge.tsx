type Props = {
  count?: number
  className?: string
}

export function NavBadge({ count, className = 'nav-badge' }: Props) {
  if (!count || count <= 0) return null
  return <span className={className}>{count}</span>
}
