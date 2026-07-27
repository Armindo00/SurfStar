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

function levelToChart(value: number | null): number | null {
  if (value === null) return null
  return Math.min(100, Math.max(0, value * 20))
}

function buildPath(
  values: (number | null)[],
  width: number,
  height: number,
  padding: number,
): string {
  const plotW = width - padding * 2
  const plotH = height - padding * 2
  const segments: string[] = []

  values.forEach((value, index) => {
    if (value === null) return
    const x = padding + (index / Math.max(values.length - 1, 1)) * plotW
    const y = padding + plotH - (value / 100) * plotH
    segments.push(`${segments.length === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
  })

  return segments.join(' ')
}

function buildAreaPath(
  values: (number | null)[],
  width: number,
  height: number,
  padding: number,
): string {
  const line = buildPath(values, width, height, padding)
  if (!line) return ''

  const plotW = width - padding * 2
  const plotH = height - padding * 2
  const lastIndex = values.length - 1
  const lastX = padding + (lastIndex / Math.max(lastIndex, 1)) * plotW
  const baseY = padding + plotH

  let firstX = padding
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] !== null) {
      firstX = padding + (index / Math.max(values.length - 1, 1)) * plotW
      break
    }
  }

  return `${line} L ${lastX.toFixed(2)} ${baseY} L ${firstX.toFixed(2)} ${baseY} Z`
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
  const height = 200
  const padding = 32

  const successValues = points.map((p) => p.successRate)
  const potentialValues = points.map((p) => p.potentialRate)
  const levelValues = points.map((p) => levelToChart(p.avgManeuverLevel))

  const hasSuccess = successValues.some((v) => v !== null)
  const hasPotential = potentialValues.some((v) => v !== null)
  const hasLevel = levelValues.some((v) => v !== null)

  const successPath = buildPath(successValues, width, height, padding)
  const potentialPath = buildPath(potentialValues, width, height, padding)
  const levelPath = buildPath(levelValues, width, height, padding)
  const successArea = buildAreaPath(successValues, width, height, padding)

  const hasData = hasSuccess || hasPotential || hasLevel

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
              <span className="evolution-chart__key evolution-chart__key--success">Success rate</span>
            ) : null}
            {hasPotential ? (
              <span className="evolution-chart__key evolution-chart__key--potential">
                Waves with potential
              </span>
            ) : null}
            {hasLevel ? (
              <span className="evolution-chart__key evolution-chart__key--level">Avg level (T+C)</span>
            ) : null}
          </div>

          <div className="evolution-chart__plot">
            <svg
              className="evolution-chart__svg"
              viewBox={`0 0 ${width} ${height}`}
              role="img"
              aria-label={`${title} line chart`}
            >
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = padding + (height - padding * 2) * (1 - tick / 100)
                return (
                  <g key={tick}>
                    <line
                      x1={padding}
                      x2={width - padding}
                      y1={y}
                      y2={y}
                      className="evolution-chart__grid"
                    />
                    <text x={6} y={y + 4} className="evolution-chart__tick">
                      {tick}%
                    </text>
                  </g>
                )
              })}

              {successArea ? (
                <path d={successArea} className="evolution-chart__area evolution-chart__area--success" />
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
              {successPath ? (
                <path d={successPath} className="evolution-chart__line evolution-chart__line--success" />
              ) : null}

              {points.map((point, index) => {
                const x = padding + (index / Math.max(points.length - 1, 1)) * (width - padding * 2)
                const success = point.successRate
                const y =
                  success === null
                    ? null
                    : padding + (height - padding * 2) - (success / 100) * (height - padding * 2)

                return (
                  <g key={point.periodKey}>
                    <text
                      x={x}
                      y={height - 6}
                      textAnchor="middle"
                      className="evolution-chart__month"
                    >
                      {point.label}
                    </text>
                    {y !== null ? (
                      <circle
                        cx={x}
                        cy={y}
                        r={4.5}
                        className="evolution-chart__dot evolution-chart__dot--success"
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
