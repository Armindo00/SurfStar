import { useEffect, useMemo, useState } from 'react'
import type { AnalyticsPeriod } from '../teamAnalyticsStats'
import type { EvolutionPoint } from '../teamAnalyticsStats'

type PeriodOption = {
  id: AnalyticsPeriod
  label: string
  shortLabel: string
}

type EvolutionMetric = 'success' | 'potential' | 'level'

type MetricConfig = {
  id: EvolutionMetric
  label: string
  shortLabel: string
  description: string
  emptyHint: string
  kind: 'percent' | 'level'
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

const METRICS: MetricConfig[] = [
  {
    id: 'success',
    label: 'Success rate',
    shortLabel: 'Success',
    description: 'Maneuver and combo success rate over time.',
    kind: 'percent',
    emptyHint: 'Log technical or combo attempts to track success rate.',
  },
  {
    id: 'potential',
    label: 'Waves with potential',
    shortLabel: 'Potential',
    description: 'Share of waves marked with potential.',
    kind: 'percent',
    emptyHint: 'Log waves in technical sessions to track potential rate.',
  },
  {
    id: 'level',
    label: 'Average level',
    shortLabel: 'Avg level',
    description: 'Average maneuver level across technical and combo attempts.',
    kind: 'level',
    emptyHint: 'Log maneuver levels in technical or combo sessions to track progress.',
  },
]

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

function buildLinePath(ys: (number | null)[], xs: number[]): string {
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

function metricHasData(metric: EvolutionMetric, points: EvolutionPoint[]): boolean {
  if (metric === 'success') return points.some((point) => point.successRate !== null)
  if (metric === 'potential') return points.some((point) => point.potentialRate !== null)
  return points.some((point) => point.avgManeuverLevel !== null)
}

function metricValues(metric: EvolutionMetric, points: EvolutionPoint[]): (number | null)[] {
  if (metric === 'success') return points.map((point) => point.successRate)
  if (metric === 'potential') return points.map((point) => point.potentialRate)
  return points.map((point) => point.avgManeuverLevel)
}

function formatMetricValue(metric: EvolutionMetric, value: number | null): string {
  if (value === null) return '—'
  if (metric === 'level') return value.toFixed(2)
  return `${value}%`
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
  const [metric, setMetric] = useState<EvolutionMetric>('success')

  const availableMetrics = useMemo(
    () => METRICS.filter((entry) => metricHasData(entry.id, points)),
    [points],
  )

  const hasAnyData = availableMetrics.length > 0

  useEffect(() => {
    if (!availableMetrics.some((entry) => entry.id === metric)) {
      setMetric(availableMetrics[0]?.id ?? 'success')
    }
  }, [availableMetrics, metric])

  const activeMetric = METRICS.find((entry) => entry.id === metric) ?? METRICS[0]
  const activeHasData = metricHasData(metric, points)

  const width = 360
  const height = 210
  const paddingLeft = 34
  const paddingRight = activeMetric.kind === 'level' ? 28 : 16
  const paddingTop = 24
  const paddingBottom = 30
  const plotWidth = width - paddingLeft - paddingRight
  const plotHeight = height - paddingTop - paddingBottom
  const plotTop = paddingTop
  const baseY = plotTop + plotHeight

  const xs = points.map((_, index) => xAtIndex(index, points.length, paddingLeft, plotWidth))
  const rawValues = metricValues(metric, points)
  const chartYs = rawValues.map((value) =>
    activeMetric.kind === 'level'
      ? levelToY(value, plotTop, plotHeight)
      : percentToY(value, plotTop, plotHeight),
  )

  const linePath = buildLinePath(chartYs, xs)
  const areaPath = buildAreaPath(chartYs, xs, baseY)
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

      {!hasAnyData ? (
        <p className="muted evolution-chart__empty">No training data in this period yet.</p>
      ) : (
        <>
          <div
            className="evolution-chart__metrics"
            role="tablist"
            aria-label="Chart metric"
          >
            {METRICS.map((entry) => {
              const enabled = metricHasData(entry.id, points)
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="tab"
                  aria-selected={metric === entry.id}
                  aria-disabled={!enabled}
                  disabled={!enabled}
                  className={
                    metric === entry.id
                      ? `chip chip--active evolution-chart__metric evolution-chart__metric--${entry.id}`
                      : `chip evolution-chart__metric evolution-chart__metric--${entry.id}`
                  }
                  onClick={() => setMetric(entry.id)}
                >
                  {entry.shortLabel}
                </button>
              )
            })}
          </div>

          <div className="evolution-chart__metric-head">
            <span className={`evolution-chart__key evolution-chart__key--${metric}`}>
              {activeMetric.label}
            </span>
            <p className="muted evolution-chart__metric-copy">{activeMetric.description}</p>
          </div>

          {!activeHasData ? (
            <p className="muted evolution-chart__hint">{activeMetric.emptyHint}</p>
          ) : (
            <div className="evolution-chart__plot">
              <svg
                className="evolution-chart__svg"
                viewBox={`0 0 ${width} ${height}`}
                role="img"
                aria-label={`${title} — ${activeMetric.label}`}
              >
                {(activeMetric.kind === 'percent' ? [0, 25, 50, 75, 100] : levelTicks).map(
                  (tick) => {
                    const y =
                      activeMetric.kind === 'percent'
                        ? percentToY(tick, plotTop, plotHeight)!
                        : levelToY(tick, plotTop, plotHeight)!
                    return (
                      <g key={`tick-${tick}`}>
                        <line
                          x1={paddingLeft}
                          x2={width - paddingRight}
                          y1={y}
                          y2={y}
                          className="evolution-chart__grid"
                        />
                        <text
                          x={4}
                          y={y + 4}
                          className="evolution-chart__tick"
                        >
                          {activeMetric.kind === 'percent' ? `${tick}%` : tick}
                        </text>
                        {activeMetric.kind === 'level' ? (
                          <text
                            x={width - 6}
                            y={y + 4}
                            textAnchor="end"
                            className="evolution-chart__tick evolution-chart__tick--level"
                          >
                            {tick}
                          </text>
                        ) : null}
                      </g>
                    )
                  },
                )}

                {areaPath ? (
                  <path
                    d={areaPath}
                    className={`evolution-chart__area evolution-chart__area--${metric}`}
                  />
                ) : null}
                {linePath ? (
                  <path
                    d={linePath}
                    className={`evolution-chart__line evolution-chart__line--${metric}`}
                  />
                ) : null}

                {points.map((point, index) => {
                  const x = xs[index]
                  const y = chartYs[index]
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
                      {y !== null ? (
                        <circle
                          cx={x}
                          cy={y}
                          r={4.5}
                          className={`evolution-chart__dot evolution-chart__dot--${metric}`}
                        />
                      ) : null}
                    </g>
                  )
                })}
              </svg>
            </div>
          )}

          <div className="table-wrap evolution-chart__table-wrap">
            <table className="data-table evolution-chart__table">
              <thead>
                <tr>
                  <th>{periodColumnLabel}</th>
                  <th>Sessions</th>
                  <th>Waves</th>
                  <th className={metric === 'success' ? 'evolution-chart__col--active' : undefined}>
                    Success
                  </th>
                  <th className={metric === 'level' ? 'evolution-chart__col--active' : undefined}>
                    Avg level
                  </th>
                  <th
                    className={metric === 'potential' ? 'evolution-chart__col--active' : undefined}
                  >
                    Potential
                  </th>
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
                    <td className={metric === 'success' ? 'evolution-chart__col--active' : undefined}>
                      {point.successRate === null ? (
                        '—'
                      ) : (
                        <span className="evolution-chart__cell evolution-chart__cell--success">
                          {formatMetricValue('success', point.successRate)}
                        </span>
                      )}
                    </td>
                    <td className={metric === 'level' ? 'evolution-chart__col--active' : undefined}>
                      {point.avgManeuverLevel === null ? (
                        '—'
                      ) : (
                        <span className="evolution-chart__cell evolution-chart__cell--level">
                          {formatMetricValue('level', point.avgManeuverLevel)}
                        </span>
                      )}
                    </td>
                    <td
                      className={metric === 'potential' ? 'evolution-chart__col--active' : undefined}
                    >
                      {point.potentialRate === null ? (
                        '—'
                      ) : (
                        <span className="evolution-chart__cell evolution-chart__cell--potential">
                          {formatMetricValue('potential', point.potentialRate)}
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
