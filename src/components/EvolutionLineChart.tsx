import type { EvolutionMonthPoint } from '../teamAnalyticsStats'

type Props = {
  title: string
  subtitle?: string
  points: EvolutionMonthPoint[]
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

export function EvolutionLineChart({ title, subtitle, points }: Props) {
  const width = 320
  const height = 180
  const padding = 28

  const successValues = points.map((p) => p.successRate)
  const potentialValues = points.map((p) => p.potentialRate)
  const hasSuccess = successValues.some((v) => v !== null)
  const hasPotential = potentialValues.some((v) => v !== null)

  const successPath = buildPath(successValues, width, height, padding)
  const potentialPath = buildPath(potentialValues, width, height, padding)

  return (
    <article className="evolution-chart">
      <header className="evolution-chart__head">
        <div>
          <h3 className="evolution-chart__title">{title}</h3>
          {subtitle ? <p className="muted evolution-chart__sub">{subtitle}</p> : null}
        </div>
      </header>

      {!hasSuccess && !hasPotential ? (
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
          </div>

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
                  <text x={4} y={y + 4} className="evolution-chart__tick">
                    {tick}
                  </text>
                </g>
              )
            })}

            {potentialPath ? (
              <path d={potentialPath} className="evolution-chart__line evolution-chart__line--potential" />
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
                <g key={point.monthKey}>
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className="evolution-chart__month"
                  >
                    {point.label}
                  </text>
                  {y !== null ? (
                    <circle cx={x} cy={y} r={4} className="evolution-chart__dot evolution-chart__dot--success" />
                  ) : null}
                </g>
              )
            })}
          </svg>

          <div className="evolution-chart__table-wrap">
            <table className="data-table evolution-chart__table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Sessions</th>
                  <th>Waves</th>
                  <th>Success</th>
                  <th>Potential</th>
                </tr>
              </thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.monthKey}>
                    <td>{point.label}</td>
                    <td>{point.sessions}</td>
                    <td>{point.waves}</td>
                    <td>{point.successRate === null ? '—' : `${point.successRate}%`}</td>
                    <td>{point.potentialRate === null ? '—' : `${point.potentialRate}%`}</td>
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
