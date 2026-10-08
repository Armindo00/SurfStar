import type { PdfEvolutionCharts } from '../athleteReportPdfEvolution'
import type { SideCompareChart } from '../athleteReportPdfEvolution'

const MANEUVER_COLORS: Record<string, string> = {
  rail: '#0284c7',
  'top-turn': '#059669',
  progressive: '#d97706',
}

export type LineSeries = {
  label: string
  color: string
  values: (number | null)[]
  scale: 'percent' | 'level'
}

function valueToY(value: number, scale: 'percent' | 'level', plotTop: number, plotH: number): number {
  const pct = scale === 'percent' ? Math.min(100, Math.max(0, value)) / 100 : Math.min(4, Math.max(0, value)) / 4
  return plotTop + plotH - pct * plotH
}

function buildLinePath(xs: number[], ys: (number | null)[]): string {
  const parts: string[] = []
  let segment: string[] = []
  ys.forEach((y, i) => {
    if (y === null) {
      if (segment.length) parts.push(segment.join(' '))
      segment = []
      return
    }
    const cmd = segment.length === 0 ? 'M' : 'L'
    segment.push(`${cmd}${xs[i].toFixed(1)},${y.toFixed(1)}`)
  })
  if (segment.length) parts.push(segment.join(' '))
  return parts.join(' ')
}

export function LineChartFigure({
  title,
  xLabels,
  series,
}: {
  title: string
  xLabels: string[]
  series: LineSeries[]
}) {
  const active = series.filter((s) => s.values.some((v) => v !== null))
  if (xLabels.length === 0 || active.length === 0) return null

  const width = 320
  const height = 132
  const pad = { l: 8, r: 8, t: 22, b: 26 }
  const plotW = width - pad.l - pad.r
  const plotH = height - pad.t - pad.b
  const xs = xLabels.map((_, i) => pad.l + (i / Math.max(xLabels.length - 1, 1)) * plotW)

  return (
    <figure className="athlete-report__chart">
      <figcaption className="athlete-report__chart-title">{title}</figcaption>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const y = pad.t + plotH * (1 - frac)
          return (
            <line
              key={frac}
              x1={pad.l}
              y1={y}
              x2={width - pad.r}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
          )
        })}
        <rect x={pad.l} y={pad.t} width={plotW} height={plotH} fill="none" stroke="#cbd5e1" strokeWidth={1} />
        {active.map((s) => {
          const ys = s.values.map((v) => (v === null ? null : valueToY(v, s.scale, pad.t, plotH)))
          const path = buildLinePath(xs, ys)
          if (!path) return null
          return (
            <g key={s.label}>
              <path d={path} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" />
              {ys.map((y, i) =>
                y === null ? null : (
                  <circle key={`${s.label}-${i}`} cx={xs[i]} cy={y} r={2.5} fill={s.color} />
                ),
              )}
            </g>
          )
        })}
        {xLabels.map((label, i) => (
          <text
            key={label + i}
            x={xs[i]}
            y={height - 6}
            textAnchor="middle"
            fontSize={7}
            fill="#64748b"
          >
            {label.length > 9 ? `${label.slice(0, 8)}…` : label}
          </text>
        ))}
      </svg>
      <ul className="athlete-report__chart-legend athlete-report__chart-legend--wrap">
        {active.map((s) => (
          <li key={s.label}>
            <i className="athlete-report__swatch" style={{ background: s.color }} /> {s.label}
          </li>
        ))}
      </ul>
    </figure>
  )
}

export function EvolutionChartStack({
  charts,
  maneuverLabels,
  labels,
}: {
  charts: PdfEvolutionCharts
  maneuverLabels: Record<string, string>
  labels: {
    potential: string
    maneuverSuccess: string
    maneuverLevel: string
    comboSuccess: string
    comboLevel: string
  }
}) {
  const { periodLabels } = charts
  if (periodLabels.length === 0) return null

  return (
    <div className="athlete-report__chart-stack">
      <LineChartFigure
        title={labels.potential}
        xLabels={periodLabels}
        series={[
          {
            label: labels.potential,
            color: '#0ea5e9',
            values: charts.potentialRates,
            scale: 'percent',
          },
        ]}
      />
      <LineChartFigure
        title={labels.maneuverSuccess}
        xLabels={periodLabels}
        series={charts.maneuverSeries
          .filter((s) => s.successRates.some((v) => v !== null))
          .map((s) => ({
            label: maneuverLabels[s.kind] ?? s.kind,
            color: MANEUVER_COLORS[s.kind] ?? '#64748b',
            values: s.successRates,
            scale: 'percent' as const,
          }))}
      />
      <LineChartFigure
        title={labels.maneuverLevel}
        xLabels={periodLabels}
        series={charts.maneuverSeries
          .filter((s) => s.avgLevels.some((v) => v !== null))
          .map((s) => ({
            label: maneuverLabels[s.kind] ?? s.kind,
            color: MANEUVER_COLORS[s.kind] ?? '#64748b',
            values: s.avgLevels,
            scale: 'level' as const,
          }))}
      />
      {charts.comboSuccessRates.some((v) => v !== null) ? (
        <LineChartFigure
          title={labels.comboSuccess}
          xLabels={periodLabels}
          series={[
            {
              label: labels.comboSuccess,
              color: '#a855f7',
              values: charts.comboSuccessRates,
              scale: 'percent',
            },
          ]}
        />
      ) : null}
      {charts.comboAvgLevels.some((v) => v !== null) ? (
        <LineChartFigure
          title={labels.comboLevel}
          xLabels={periodLabels}
          series={[
            {
              label: labels.comboLevel,
              color: '#a855f7',
              values: charts.comboAvgLevels,
              scale: 'level',
            },
          ]}
        />
      ) : null}
    </div>
  )
}

function SideBarPair({
  subtitle,
  frontLabel,
  backLabel,
  frontValue,
  backValue,
  scale,
}: {
  subtitle: string
  frontLabel: string
  backLabel: string
  frontValue: number | null
  backValue: number | null
  scale: 'percent' | 'level'
}) {
  if (frontValue === null && backValue === null) return null
  const maxH = 48
  const toH = (v: number | null) => {
    if (v === null) return 0
    const pct = scale === 'percent' ? v / 100 : v / 4
    return Math.max(2, pct * maxH)
  }
  const fmt = (v: number | null) => (v === null ? '—' : scale === 'percent' ? `${v}%` : v.toFixed(2))

  return (
    <div className="athlete-report__side-pair">
      <p className="athlete-report__side-pair-label">{subtitle}</p>
      <div className="athlete-report__side-bars">
        <div className="athlete-report__side-bar-col">
          <span className="athlete-report__side-bar-value">{fmt(frontValue)}</span>
          <div className="athlete-report__side-bar-track">
            <div
              className="athlete-report__side-bar-fill athlete-report__side-bar-fill--fs"
              style={{ height: `${toH(frontValue)}px` }}
            />
          </div>
          <span className="athlete-report__side-bar-name">{frontLabel}</span>
        </div>
        <div className="athlete-report__side-bar-col">
          <span className="athlete-report__side-bar-value">{fmt(backValue)}</span>
          <div className="athlete-report__side-bar-track">
            <div
              className="athlete-report__side-bar-fill athlete-report__side-bar-fill--bs"
              style={{ height: `${toH(backValue)}px` }}
            />
          </div>
          <span className="athlete-report__side-bar-name">{backLabel}</span>
        </div>
      </div>
    </div>
  )
}

export function SideCompareFigure({
  chart,
  labels,
}: {
  chart: SideCompareChart
  labels: { success: string; avgLevel: string; frontside: string; backside: string }
}) {
  return (
    <article className="athlete-report__side-chart">
      <h3 className="athlete-report__side-chart-title">{chart.title}</h3>
      <SideBarPair
        subtitle={labels.success}
        frontLabel={labels.frontside}
        backLabel={labels.backside}
        frontValue={chart.frontsideSuccess}
        backValue={chart.backsideSuccess}
        scale="percent"
      />
      <SideBarPair
        subtitle={labels.avgLevel}
        frontLabel={labels.frontside}
        backLabel={labels.backside}
        frontValue={chart.frontsideLevel}
        backValue={chart.backsideLevel}
        scale="level"
      />
    </article>
  )
}
