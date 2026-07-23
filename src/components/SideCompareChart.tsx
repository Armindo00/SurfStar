import type { LevelSuccessStats, SidePairStats } from '../sessionStats'

type Props = {
  title: string
  subtitle?: string
  overallRate?: number
  overallLabel?: string
  bySide: SidePairStats
}

function SideBar({
  label,
  stats,
  variant,
}: {
  label: string
  stats: LevelSuccessStats
  variant: 'fs' | 'bs'
}) {
  return (
    <div className="side-chart__row">
      <span className="side-chart__label">{label}</span>
      <div className="side-chart__track" aria-hidden="true">
        <div
          className={`side-chart__fill side-chart__fill--${variant}`}
          style={{ width: `${Math.min(100, stats.rate)}%` }}
        />
      </div>
      <span className="side-chart__meta">
        <strong>{stats.rate}%</strong>
        <small>
          {stats.successes}/{stats.attempts}
        </small>
      </span>
    </div>
  )
}

export function SideCompareChart({ title, subtitle, overallRate, overallLabel, bySide }: Props) {
  return (
    <article className="side-chart">
      <header className="side-chart__head">
        <div>
          <h3 className="side-chart__title">{title}</h3>
          {subtitle ? <p className="muted side-chart__sub">{subtitle}</p> : null}
        </div>
        {overallRate !== undefined ? (
          <span className="side-chart__overall">
            {overallLabel ?? 'Overall'} <strong>{overallRate}%</strong>
          </span>
        ) : null}
      </header>
      <div className="side-chart__bars">
        <SideBar label="Frontside" stats={bySide.frontside} variant="fs" />
        <SideBar label="Backside" stats={bySide.backside} variant="bs" />
      </div>
    </article>
  )
}
