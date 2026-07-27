import type { AnalyticsPeriod } from '../teamAnalyticsStats'
import type { EvolutionPoint } from '../teamAnalyticsStats'

type PeriodOption = {
  id: AnalyticsPeriod
  label: string
  shortLabel: string
}

type Props = {
  title: string
  subtitle?: string
  points: EvolutionPoint[]
  periodColumnLabel?: string
  period?: AnalyticsPeriod
  periodOptions?: PeriodOption[]
  onPeriodChange?: (period: AnalyticsPeriod) => void
}

const LEVEL_MIN = 1
const LEVEL_MAX = 4

function percentToY(value: number | null, plotTop: number, plotHeight: number): number | null {
  if (value === null) return null
  return plotTop + plotHeight - (Math.min(100, Math.max(0, value)) / 100) * plotHeight
}

function levelToY(value: number | null, plotTop: number, plotHeight: number): number | null {
  if (value === null) return null
  const clamped = Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, value))
  const pct = ((clamped - LEVEL_MIN) / (LEVEL_MAX - LEVEL_MIN)) * 100
  return plotTop + plotHeight - (pct / 100) * plotHeight
}

function xAtIndex(index: number, count: number, padding: number, plotWidth: number): number {
  return padding + (index / Math.max(count - 1, 1)) * plotWidth
}

function buildLinePath(
  ys: (number | null)[],
  xs: number[],
): string {
  const segments: string[] = []

  ys.forEach((y, index) => {
    if (y === null) return
    segments.push(`${segments.length === 0 ? 'M' : 'L'} ${xs[index].toFixed(2)} ${y.toFixed(2)}`)
  })

  return segments.join(' ')
}

function buildAreaPath(ys: (number | null)[], xs: number[], baseY: number): string {
  const line = buildLinePath(ys, xs)
  if (!line) return ''

  let firstIndex = -1
  let lastIndex = -1
  ys.forEach((y, index) => {
    if (y === null) return
    if (firstIndex === -1) firstIndex = index
    lastIndex = index
  })
  if (firstIndex === -1) return ''

  return `${line} L ${xs[lastIndex].toFixed(2)} ${baseY} L ${xs[firstIndex].toFixed(2)} ${baseY} Z`
}

export function EvolutionLineChart({
  title,
  subtitle,
  points,
  periodColumnLabel = 'Period',
  period,
  periodOptions,
  onPeriodChange,
}: Props) {
  const width = 360
  const height = 210
  const paddingLeft = 34
  const paddingRight = 28
  const paddingTop = 24
  const paddingBottom = 30
  const plotWidth = width - paddingLeft - paddingRight
  const plotHeight = height - paddingTop - paddingBottom
  const plotTop = paddingTop
  const baseY = plotTop + plotHeight

  const xs = points.map((_, index) => xAtIndex(index, points.length, paddingLeft, plotWidth))
  const successYs = points.map((point) => percentToY(point.successRate, plotTop, plotHeight))
  const potentialYs = points.map((point) => percentToY(point.potentialRate, plotTop, plotHeight))
  const levelYs = points.map((point) => levelToY(point.avgManeuverLevel, plotTop, plotHeight))

  const hasSuccess = successYs.some((y) => y !== null)
  const hasPotential = potentialYs.some((y) => y !== null)
  const hasLevel = levelYs.some((y) => y !== null)
  const hasData = hasSuccess || hasPotential || hasLevel

  const successPath = buildLinePath(successYs, xs)
  const potentialPath = buildLinePath(potentialYs, xs)
  const levelPath = buildLinePath(levelYs, xs)
  const successArea = buildAreaPath(successYs, xs, baseY)

  const levelTicks = [1, 2, 3, 4]

  return (
    <article className="evolution-chart ss-card">
      <header className="evolution-chart__head">
        <div className="evolution-chart__intro">
          <h3 className="evolution-chart__title">{title}</h3>
          {subtitle ? <p className="muted evolution-chart__sub">{subtitle}</p> : null}
        </div>
        {period && periodOptions && onPeriodChange ? (
          <div className="evolution-chart__periods" role="tablist" aria-label="Chart period">
            {periodOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={period === option.id}
                className={
                  period === option.id
                    ? 'chip chip--active evolution-chart__period'
                    : 'chip evolution-chart__period'
                }
                onClick={() => onPeriodChange(option.id)}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {!hasData ? (
        <p className="muted evolution-chart__empty">No training data in this period yet.</p>
      ) : (
        <>
          <div className="evolution-chart__legend">
            {hasSuccess ? (
              <span className="evolution-chart__key evolution-chart__key--success">Success rate (%)</span>
            ) : null}
            {hasPotential ? (
              <span className="evolution-chart__key evolution-chart__key--potential">
                Waves with potential (%)
              </span>
            ) : null}
            {hasLevel ? (
              <span className="evolution-chart__key evolution-chart__key--level">
                Avg level (1–4, right axis)
              </span>
            ) : null}
          </div>

          {!hasPotential && !hasLevel && hasSuccess ? (
            <p className="muted evolution-chart__hint">
              Potential % and avg level appear when you log waves and maneuver levels in technical or
              combo sessions.
            </p>
          ) : null}

          <div className="evolution-chart__plot">
            <svg
              className="evolution-chart__svg"
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`${title} line chart`}
            >
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = percentToY(tick, plotTop, plotHeight)!
                return (
                  <g key={`pct-${tick}`}>
                    <line
                      x1={paddingLeft}
                      x2={width - paddingRight}
                      y1={y}
                      y2={y}
                      className="evolution-chart__grid"
                    />
                    <text x={4} y={y + 4} className="evolution-chart__tick">
                      {tick}%
                    </text>
                  </g>
                )
              })}

              {hasLevel
                ? levelTicks.map((tick) => {
                    const y = levelToY(tick, plotTop, plotHeight)!
                    return (
                      <text
                        key={`lvl-${tick}`}
                        x={width - 6}
                        y={y + 4}
                        textAnchor="end"
                        className="evolution-chart__tick evolution-chart__tick--level"
                      >
                        {tick}
                      </text>
                    )
                  })
                : null}

              {successArea ? (
                <path d={successArea} className="evolution-chart__area evolution-chart__area--success" />
              ) : null}
              {successPath ? (
                <path d={successPath} className="evolution-chart__line evolution-chart__line--success" />
              ) : null}
              {potentialPath ? (
                <path
                  d={potentialPath}
                  className="evolution-chart__line evolution-chart__line--potential"
                />
              ) : null}
              {levelPath ? (
                <path d={levelPath} className="evolution-chart__line evolution-chart__line--level" />
              ) : null}

              {points.map((point, index) => {
                const x = xs[index]
                return (
                  <g key={point.periodKey}>
                    <text
                      x={x}
                      y={height - 8}
                      textAnchor="middle"
                      className="evolution-chart__month"
                    >
                      {point.label}
                    </text>
                    {successYs[index] !== null ? (
                      <circle
                        cx={x}
                        cy={successYs[index]!}
                        r={4}
                        className="evolution-chart__dot evolution-chart__dot--success"
                      />
                    ) : null}
                    {potentialYs[index] !== null ? (
                      <circle
                        cx={x}
                        cy={potentialYs[index]!}
                        r={4}
                        className="evolution-chart__dot evolution-chart__dot--potential"
                      />
                    ) : null}
                    {levelYs[index] !== null ? (
                      <circle
                        cx={x}
                        cy={levelYs[index]!}
                        r={4}
                        className="evolution-chart__dot evolution-chart__dot--level"
                      />
                    ) : null}
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="table-wrap evolution-chart__table-wrap">
            <table className="data-table evolution-chart__table">
              <thead>
                <tr>
                  <th>{periodColumnLabel}</th>
                  <th>Sessions</th>
                  <th>Waves</th>
                  <th>Success</th>
                  <th>Avg level</th>
                  <th>Potential</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.periodKey}>
                    <td>
                      <span className="evolution-chart__period-label">{point.label}</span>
                    </td>
                    <td>{point.sessions}</td>
                    <td>{point.waves}</td>
                    <td>
                      {point.successRate === null ? (
                        '—'
                      ) : (
                        <span className="evolution-chart__cell evolution-chart__cell--success">
                          {point.successRate}%
                        </span>
                      )}
                    </td>
                    <td>
                      {point.avgManeuverLevel === null ? (
                        '—'
                      ) : (
                        <span className="evolution-chart__cell evolution-chart__cell--level">
                          {point.avgManeuverLevel.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td>
                      {point.potentialRate === null ? (
                        '—'
                      ) : (
                        <span className="evolution-chart__cell evolution-chart__cell--potential">
                          {point.potentialRate}%
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </article>
  )
}
