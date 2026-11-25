import { AppLogo } from './AppLogo'
import {
  EvolutionChartStack,
  OpenVsCloseFigure,
  SideCompareFigure,
} from './AthleteReportChartFigures'
import { WaveMatrixPanel } from './WaveMatrixPanel'
import type { AthletePsychologyAnalytics } from '../athletePsychologyStats'
import type { AthleteGeneralStats } from '../athleteStats'
import type { PdfEvolutionCharts, SideCompareChart } from '../athleteReportPdfEvolution'
import type {
  DomainSummaryRow,
  ReportCallout,
  TrainingMixRow,
} from '../buildAthleteReportPdf'
import type { AthleteHeatAnalyticsSummary } from '../heatAnalyticsStats'
import { formatSessionDate } from '../sessionHistoryUtils'
import type { AnalyticsReportCopy } from '../i18n/types'
import { useI18n } from '../i18n'

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
  psychology?: AthletePsychologyAnalytics | null
  heatAnalytics?: AthleteHeatAnalyticsSummary | null
  strengths: ReportCallout[]
  attention: ReportCallout[]
  comparisonNotes?: string[]
  comparisonTitle?: string
  domainRows: DomainSummaryRow[]
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

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''))
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
  psychology,
  heatAnalytics,
  strengths,
  attention,
  comparisonNotes = [],
  comparisonTitle,
  domainRows,
  r,
  formatAvgLevel,
}: Props) {
  const { t } = useI18n()
  const sideLabels = {
    success: r.successCol,
    avgLevel: r.avgLevel,
    frontside: r.frontside,
    backside: r.backside,
  }

  const psych =
    psychology && psychology.checkIns > 0
      ? (() => {
          const ranked = [...psychology.byQuestion].sort((a, b) => b.average - a.average)
          return {
            highest: ranked[0],
            lowest: ranked[ranked.length - 1],
            notes: psychology.timeline.filter((row) => row.feedback.writtenNote?.trim()),
          }
        })()
      : null

  const decision = coachComment?.trim() || r.periodDecisionEmpty
  const subtitle = interpolate(r.technicalSubtitle, {
    level: formatAvgLevel(general.avgTechnicalManeuverLevel),
    combo: formatAvgLevel(general.avgComboLevel),
    sessions: general.totalTrainings,
  })

  return (
    <article className="athlete-report">
      <header className="athlete-report__header">
        <div className="athlete-report__brand">
          <AppLogo size="sm" />
          <div>
            <p className="athlete-report__eyebrow">
              {r.sheetEyebrow} · {r.executiveLabel}
            </p>
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
        <div className="athlete-report__exec-hero">
          <article className="athlete-report__exec-card">
            <span>{r.overallAvgLevel}</span>
            <strong>{formatAvgLevel(general.avgOverallManeuverLevel)}</strong>
            <small>{subtitle}</small>
          </article>
          <article className="athlete-report__exec-card">
            <span>{r.periodDecision}</span>
            <strong className="athlete-report__exec-card-focus">{decision}</strong>
            <small>{r.periodDecisionHint}</small>
          </article>
        </div>
      </section>

      {comparisonNotes.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{comparisonTitle ?? t('analytics.comparison.title')}</h2>
          <p className="muted">{t('analytics.comparison.subtitle')}</p>
          <ul className="result-comparison-notes__list">
            {comparisonNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : strengths.length > 0 || attention.length > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.strengthsAttentionTitle}</h2>
          <div className="athlete-report__psych-callouts">
            <div className="athlete-report__psych-callout athlete-report__psych-callout--hi">
              <strong>{r.strengths}</strong>
              {strengths.length === 0 ? (
                <small>—</small>
              ) : (
                strengths.map((item) => (
                  <small key={`${item.label}-${item.value}`}>
                    {item.label} · {item.value}
                  </small>
                ))
              )}
            </div>
            <div className="athlete-report__psych-callout athlete-report__psych-callout--lo">
              <strong>{r.attention}</strong>
              {attention.length === 0 ? (
                <small>—</small>
              ) : (
                attention.map((item) => (
                  <small key={`${item.label}-${item.value}`}>
                    {item.label} · {item.value}
                  </small>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {general.totalWaves > 0 ? (
        <section className="athlete-report__section athlete-report__topic-page">
          <WaveMatrixPanel matrix={general.matrix} totalWaves={general.totalWaves} />
        </section>
      ) : null}

      <section className="athlete-report__section">
        <h2>{r.domainSummaryTitle}</h2>
        <div className="table-wrap athlete-report__table-wrap">
          <table className="data-table athlete-report__table athlete-report__detail-table">
            <thead>
              <tr>
                <th>{r.domainCol}</th>
                <th>{r.keyMetricCol}</th>
                <th>{r.valueCol}</th>
              </tr>
            </thead>
            <tbody>
              {domainRows.map((row) => (
                <tr key={row.domain}>
                  <td>{row.domain}</td>
                  <td>{row.metric}</td>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {coachComment ? (
        <section className="athlete-report__section athlete-report__section--comments">
          <h2>{r.coachComments}</h2>
          <p className="athlete-report__comment">{coachComment}</p>
        </section>
      ) : null}

      {performanceLines.length > 0 ? (
        <section className="athlete-report__section athlete-report__topic-page">
          <h2>{r.performanceOverview}</h2>
          <ul className="athlete-report__highlights">
            {performanceLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {technicalSideCharts.length > 0 ? (
        <section className="athlete-report__section athlete-report__topic-page">
          <h2>{r.pdfTechnicalSideCharts}</h2>
          <div className="athlete-report__side-chart-grid">
            {technicalSideCharts.map((chart) => (
              <SideCompareFigure key={chart.title} chart={chart} labels={sideLabels} />
            ))}
          </div>
        </section>
      ) : null}

      {comboSideCharts.length > 0 ? (
        <section className="athlete-report__section athlete-report__topic-page">
          <h2>{r.pdfComboSideCharts}</h2>
          <div className="athlete-report__side-chart-grid">
            {comboSideCharts.map((chart) => (
              <SideCompareFigure key={chart.title} chart={chart} labels={sideLabels} />
            ))}
          </div>
        </section>
      ) : null}

      {heatAnalytics && heatAnalytics.heatsTotal > 0 ? (
        <section className="athlete-report__section athlete-report__topic-page">
          <h2>{r.competitionHeatsRhythm}</h2>
          <div className="athlete-report__kpi-grid">
            <article>
              <span>{r.heatWins}</span>
              <strong>{heatAnalytics.rows.filter((row) => row.won).length}</strong>
            </article>
            <article>
              <span>{r.avgLevel}</span>
              <strong>{heatAnalytics.avgHeatScore?.toFixed(1) ?? '—'}</strong>
            </article>
            <article>
              <span>{r.earlyTenPoints}</span>
              <strong>
                {heatAnalytics.earlyTenPointsRate === null
                  ? '—'
                  : `${heatAnalytics.earlyTenPointsRate}%`}
              </strong>
            </article>
            <article>
              <span>{r.clutchDelta}</span>
              <strong>
                {heatAnalytics.clutchDelta === null
                  ? '—'
                  : `${heatAnalytics.clutchDelta > 0 ? '+' : ''}${heatAnalytics.clutchDelta.toFixed(1)}`}
              </strong>
            </article>
            <article>
              <span>{r.timeToFirstWaveAvg}</span>
              <strong>
                {heatAnalytics.avgTimeToFirstWaveMin === null
                  ? '—'
                  : `${heatAnalytics.avgTimeToFirstWaveMin.toFixed(1)}'`}
              </strong>
            </article>
            <article>
              <span>{r.timeToTwoMajorAvg}</span>
              <strong>
                {heatAnalytics.avgTimeToTwoMajorMin === null
                  ? '—'
                  : `${heatAnalytics.avgTimeToTwoMajorMin.toFixed(1)}'`}
              </strong>
            </article>
          </div>

          {heatAnalytics.heatsWithTiming > 0 ? (
            <OpenVsCloseFigure
              title={r.openVsCloseTitle}
              openLabel={r.openShort}
              closeLabel={r.closeShort}
              openValue={heatAnalytics.avgBestWaveOpening}
              closeValue={heatAnalytics.avgBestWaveClosing}
              hint={
                heatAnalytics.clutchDelta === null
                  ? undefined
                  : `${r.clutchDelta} ${heatAnalytics.clutchDelta > 0 ? '+' : ''}${heatAnalytics.clutchDelta.toFixed(1)}`
              }
            />
          ) : null}

          {heatAnalytics.rows.length > 0 ? (
            <>
              <h3 className="athlete-report__subsection-title">{r.heatLog}</h3>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table athlete-report__detail-table">
                  <thead>
                    <tr>
                      <th>{r.heat}</th>
                      <th>{r.total}</th>
                      <th>{r.place}</th>
                      <th>{r.earlyTenPoints}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heatAnalytics.rows.slice(0, 12).map((row) => (
                      <tr key={`${row.sessionId}-${row.heatId}`}>
                        <td>{row.heatLabel}</td>
                        <td>{row.total.toFixed(1)}</td>
                        <td>
                          {row.placement}
                          {row.won ? r.winSuffix : ''}
                        </td>
                        <td>
                          {row.hasTimerData
                            ? row.reachedTenPointsInEarlyWindow
                              ? r.yes
                              : r.no
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      {psych && psychology ? (
        <section className="athlete-report__section athlete-report__topic-page">
          <h2>{r.psychologyCheckins}</h2>

          <div className="athlete-report__kpi-grid athlete-report__kpi-grid--psych">
            <article>
              <span>{r.psychologyCheckInsLabel}</span>
              <strong>{psychology.checkIns}</strong>
            </article>
            <article>
              <span>{r.psychologyAvgLabel}</span>
              <strong>{psychology.averageOverall?.toFixed(1) ?? '—'}</strong>
            </article>
            <article>
              <span>{r.psychologyResponseLabel}</span>
              <strong>
                {psychology.feedbackRate === null ? '—' : `${psychology.feedbackRate}%`}
              </strong>
            </article>
          </div>

          {psych.highest && psych.lowest ? (
            <>
              <h3 className="athlete-report__subsection-title">{r.psychologyStandouts}</h3>
              <div className="athlete-report__psych-callouts">
                <div className="athlete-report__psych-callout athlete-report__psych-callout--hi">
                  <strong>{r.psychologyHighest}</strong>
                  <small>
                    {psych.highest.label} · {psych.highest.average.toFixed(1)}
                  </small>
                </div>
                <div className="athlete-report__psych-callout athlete-report__psych-callout--lo">
                  <strong>{r.psychologyNeedsAttention}</strong>
                  <small>
                    {psych.lowest.label} · {psych.lowest.average.toFixed(1)}
                  </small>
                </div>
              </div>
            </>
          ) : null}

          <h3 className="athlete-report__subsection-title">{r.questionAverages}</h3>
          <div className="table-wrap athlete-report__table-wrap">
            <table className="data-table athlete-report__table athlete-report__detail-table">
              <thead>
                <tr>
                  <th>{r.question}</th>
                  <th>{r.average}</th>
                </tr>
              </thead>
              <tbody>
                {psychology.byQuestion.map((entry) => (
                  <tr key={entry.key}>
                    <td>{entry.label}</td>
                    <td>{entry.average.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {psych.notes.length > 0 ? (
            <>
              <h3 className="athlete-report__subsection-title">{r.psychologyAthleteNotes}</h3>
              <ul className="athlete-report__psych-notes">
                {psych.notes.map(({ feedback, averageScore }) => (
                  <li key={feedback.id}>
                    <strong>
                      {formatSessionDate(feedback.submittedAt)}
                      {averageScore === null ? '' : ` · ${averageScore.toFixed(1)}/5`}
                    </strong>
                    <span>{feedback.writtenNote!.trim()}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
      ) : null}

      {trainingMix.length > 0 ? (
        <section className="athlete-report__section athlete-report__topic-page">
          <h2>{r.trainingMix}</h2>
          <MixBars rows={trainingMix} />
        </section>
      ) : null}

      {sessionRows.length > 0 ? (
        <section className="athlete-report__section athlete-report__topic-page">
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

      {evolutionCharts.periodLabels.length > 0 ? (
        <section className="athlete-report__section athlete-report__topic-page">
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

      <footer className="athlete-report__footer">
        <p>{footerLine}</p>
      </footer>
    </article>
  )
}
