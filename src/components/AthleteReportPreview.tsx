import { AppLogo } from './AppLogo'
import type { AthleteGeneralStats } from '../athleteStats'
import type { EvolutionPoint } from '../teamAnalyticsStats'
import type { ManeuverSummaryRow, TrainingMixRow } from '../buildAthleteReportPdf'
import type { AnalyticsReportCopy } from '../i18n/types'

type Props = {
  athleteName: string
  coachName: string
  organizationName?: string | null
  rangeLabel: string
  reportTitle: string
  generatedAt: string
  footerLine: string
  coachComment?: string
  general: AthleteGeneralStats
  evolution: EvolutionPoint[]
  evolutionColumnLabel: string
  trainingMix: TrainingMixRow[]
  maneuverSummaries: ManeuverSummaryRow[]
  performanceLines: string[]
  sessionRows: { date: string; mode: string; spot: string; summary: string }[]
  r: AnalyticsReportCopy
  formatAvgLevel: (value: number | null) => string
}

function EvolutionBars({
  points,
  legendSuccess,
  legendPotential,
}: {
  points: EvolutionPoint[]
  legendSuccess: string
  legendPotential: string
}) {
  if (points.length === 0) return null
  const width = 320
  const height = 140
  const pad = { l: 8, r: 8, t: 8, b: 28 }
  const plotW = width - pad.l - pad.r
  const plotH = height - pad.t - pad.b
  const groupW = plotW / points.length

  return (
    <figure className="athlete-report__chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true">
        {points.map((point, index) => {
          const gx = pad.l + index * groupW + groupW / 2
          const successH = ((point.successRate ?? 0) / 100) * plotH
          const potentialH = ((point.potentialRate ?? 0) / 100) * plotH
          const baseY = pad.t + plotH
          return (
            <g key={point.periodKey}>
              <rect
                x={gx - 7}
                y={baseY - successH}
                width={6}
                height={successH}
                fill="#059669"
                rx={1}
              />
              <rect
                x={gx + 1}
                y={baseY - potentialH}
                width={6}
                height={potentialH}
                fill="#0ea5e9"
                rx={1}
              />
              <text
                x={gx - groupW / 2 + 2}
                y={height - 6}
                fontSize={8}
                fill="#64748b"
              >
                {point.label.length > 10 ? `${point.label.slice(0, 9)}…` : point.label}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="athlete-report__chart-legend">
        <span>
          <i className="athlete-report__swatch athlete-report__swatch--success" /> {legendSuccess}
        </span>
        <span>
          <i className="athlete-report__swatch athlete-report__swatch--potential" /> {legendPotential}
        </span>
      </figcaption>
    </figure>
  )
}

function MixBars({ rows }: { rows: TrainingMixRow[] }) {
  if (rows.length === 0) return null
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <ul className="athlete-report__bar-list">
      {rows.map((row) => (
        <li key={row.label}>
          <span>{row.label}</span>
          <div className="athlete-report__bar-track">
            <div className="athlete-report__bar-fill" style={{ width: `${(row.count / max) * 100}%` }} />
          </div>
          <strong>{row.count}</strong>
        </li>
      ))}
    </ul>
  )
}

export function AthleteReportPreview({
  athleteName,
  coachName,
  organizationName,
  rangeLabel,
  reportTitle,
  generatedAt,
  footerLine,
  coachComment,
  general,
  evolution,
  evolutionColumnLabel,
  trainingMix,
  maneuverSummaries,
  performanceLines,
  sessionRows,
  r,
  formatAvgLevel,
}: Props) {
  return (
    <article className="athlete-report">
      <header className="athlete-report__header">
        <div className="athlete-report__brand">
          <AppLogo size="sm" />
          <div>
            <p className="athlete-report__eyebrow">{r.sheetEyebrow}</p>
            <h1 id="athlete-report-title">{athleteName}</h1>
            <p className="athlete-report__subtitle">{reportTitle}</p>
          </div>
        </div>
        <dl className="athlete-report__meta">
          <div>
            <dt>{r.period}</dt>
            <dd>{rangeLabel}</dd>
          </div>
          <div>
            <dt>{r.coach}</dt>
            <dd>{coachName}</dd>
          </div>
          {organizationName ? (
            <div>
              <dt>{r.organization}</dt>
              <dd>{organizationName}</dd>
            </div>
          ) : null}
          <div>
            <dt>{r.generated}</dt>
            <dd>{generatedAt}</dd>
          </div>
        </dl>
      </header>

      <section className="athlete-report__section">
        <h2>{r.summary}</h2>
        <div className="athlete-report__kpi-grid">
          <article>
            <span>{r.sessions}</span>
            <strong>{general.totalTrainings}</strong>
          </article>
          <article>
            <span>{r.wavesLogged}</span>
            <strong>{general.totalWaves}</strong>
          </article>
          <article>
            <span>{r.avgLevel}</span>
            <strong>{formatAvgLevel(general.avgOverallManeuverLevel)}</strong>
          </article>
          <article>
            <span>{r.potentialRate}</span>
            <strong>{general.withPotentialRate === null ? '—' : `${general.withPotentialRate}%`}</strong>
          </article>
          <article>
            <span>{r.stars}</span>
            <strong>{general.totalStars}</strong>
          </article>
          <article>
            <span>{r.heatWins}</span>
            <strong>{general.heatWins}</strong>
          </article>
        </div>
      </section>

      {coachComment ? (
        <section className="athlete-report__section athlete-report__section--comments">
          <h2>{r.coachComments}</h2>
          <p className="athlete-report__comment">{coachComment}</p>
        </section>
      ) : null}

      {evolution.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.evolution}</h2>
          <EvolutionBars
            points={evolution}
            legendSuccess={r.chartLegendSuccess}
            legendPotential={r.chartLegendPotential}
          />
          <div className="table-wrap athlete-report__table-wrap">
            <table className="data-table athlete-report__table">
              <thead>
                <tr>
                  <th>{evolutionColumnLabel}</th>
                  <th>{r.sessions}</th>
                  <th>{r.wavesLogged}</th>
                  <th>{r.successCol}</th>
                  <th>{r.avgLevel}</th>
                  <th>{r.potentialCol}</th>
                </tr>
              </thead>
              <tbody>
                {evolution.map((point) => (
                  <tr key={point.periodKey}>
                    <td>{point.label}</td>
                    <td>{point.sessions}</td>
                    <td>{point.waves}</td>
                    <td>{point.successRate === null ? '—' : `${point.successRate}%`}</td>
                    <td>{point.avgManeuverLevel === null ? '—' : point.avgManeuverLevel.toFixed(2)}</td>
                    <td>{point.potentialRate === null ? '—' : `${point.potentialRate}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {trainingMix.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.trainingMix}</h2>
          <MixBars rows={trainingMix} />
        </section>
      ) : null}

      {performanceLines.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.performanceOverview}</h2>
          <ul className="athlete-report__highlights">
            {performanceLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {maneuverSummaries.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.maneuvers}</h2>
          <div className="table-wrap athlete-report__table-wrap">
            <table className="data-table athlete-report__table">
              <thead>
                <tr>
                  <th>{r.maneuvers}</th>
                  <th>{r.attempts}</th>
                  <th>{r.successCol}</th>
                </tr>
              </thead>
              <tbody>
                {maneuverSummaries.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>{row.attempts}</td>
                    <td>{row.rate === null ? '—' : `${row.rate}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {sessionRows.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.sessionLog}</h2>
          <div className="table-wrap athlete-report__table-wrap">
            <table className="data-table athlete-report__table">
              <thead>
                <tr>
                  <th>{r.date}</th>
                  <th>{r.mode}</th>
                  <th>{r.spot}</th>
                  <th>{r.summaryCol}</th>
                </tr>
              </thead>
              <tbody>
                {sessionRows.map((row, index) => (
                  <tr key={`${row.date}-${index}`}>
                    <td>{row.date}</td>
                    <td>{row.mode}</td>
                    <td>{row.spot}</td>
                    <td>{row.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <footer className="athlete-report__footer">
        <p>{footerLine}</p>
      </footer>
    </article>
  )
}
