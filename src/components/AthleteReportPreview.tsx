import { AppLogo } from './AppLogo'
import {
  EvolutionChartStack,
  SideCompareFigure,
} from './AthleteReportChartFigures'
import type { AthleteGeneralStats } from '../athleteStats'
import type { PdfEvolutionCharts, SideCompareChart } from '../athleteReportPdfEvolution'
import type { TrainingMixRow } from '../buildAthleteReportPdf'
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
  evolutionCharts: PdfEvolutionCharts
  maneuverLabels: Record<string, string>
  technicalSideCharts: SideCompareChart[]
  comboSideCharts: SideCompareChart[]
  trainingMix: TrainingMixRow[]
  performanceLines: string[]
  sessionRows: { date: string; mode: string; spot: string; summary: string }[]
  r: AnalyticsReportCopy
  formatAvgLevel: (value: number | null) => string
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
  evolutionCharts,
  maneuverLabels,
  technicalSideCharts,
  comboSideCharts,
  trainingMix,
  performanceLines,
  sessionRows,
  r,
  formatAvgLevel,
}: Props) {
  const sideLabels = {
    success: r.successCol,
    avgLevel: r.avgLevel,
    frontside: r.frontside,
    backside: r.backside,
  }

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

      {evolutionCharts.periodLabels.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.evolution}</h2>
          <EvolutionChartStack
            charts={evolutionCharts}
            maneuverLabels={maneuverLabels}
            labels={{
              potential: r.pdfChartPotentialEvolution,
              maneuverSuccess: r.pdfChartManeuverSuccessEvolution,
              maneuverLevel: r.pdfChartManeuverLevelEvolution,
              comboSuccess: r.pdfChartComboSuccessEvolution,
              comboLevel: r.pdfChartComboLevelEvolution,
            }}
          />
        </section>
      ) : null}

      {technicalSideCharts.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.pdfTechnicalSideCharts}</h2>
          <div className="athlete-report__side-chart-grid">
            {technicalSideCharts.map((chart) => (
              <SideCompareFigure key={chart.title} chart={chart} labels={sideLabels} />
            ))}
          </div>
        </section>
      ) : null}

      {comboSideCharts.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.pdfComboSideCharts}</h2>
          <div className="athlete-report__side-chart-grid">
            {comboSideCharts.map((chart) => (
              <SideCompareFigure key={chart.title} chart={chart} labels={sideLabels} />
            ))}
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
