import { useState } from 'react'
import { AppLogo } from './AppLogo'
import {
  describeAnalyticsRange,
  describeAnalyticsRangeLong,
  evolutionColumnLabel,
} from '../analyticsRange'
import type { AthleteSessionSummary } from '../athleteStats'
import type { AthleteHeatAnalyticsSummary } from '../heatAnalyticsStats'
import { formatShortDate, formatShortDateTime } from '../dateFormat'
import { getAppSiteUrl } from '../config'
import {
  formatAverageLevelValue,
  formatCombinedLevelSummary,
} from '../sessionStats'
import type { AthletePeriodAnalytics } from '../teamAnalyticsStats'
import { formatSessionDate, resolveSessionSpotName } from '../sessionHistoryUtils'
import { TRAINING_MODE_LABELS, type SurfSpot } from '../types'

type Props = {
  athleteName: string
  coachName: string
  organizationName?: string | null
  analytics: AthletePeriodAnalytics
  heatAnalytics: AthleteHeatAnalyticsSummary
  sessionSummaries: AthleteSessionSummary[]
  getSpot: (id: string) => SurfSpot | undefined
  onClose: () => void
}

function printReport() {
  window.print()
}

export function AthleteReportSheet({
  athleteName,
  coachName,
  organizationName,
  analytics,
  heatAnalytics,
  sessionSummaries,
  getSpot,
  onClose,
}: Props) {
  const [coachComment, setCoachComment] = useState('')
  const trimmedComment = coachComment.trim()
  const general = analytics.general
  const generatedAt = formatShortDateTime(new Date())
  const rangeLabel = describeAnalyticsRange(analytics.range)
  const reportTitle = describeAnalyticsRangeLong(analytics.range)
  const evolutionColumn = evolutionColumnLabel(analytics.range)

  const sessionCountByMode = analytics.sessions.reduce(
    (acc, session) => {
      acc[session.mode] = (acc[session.mode] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="athlete-report-backdrop" role="presentation" onClick={onClose}>
      <div
        className="athlete-report-print-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby="athlete-report-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="athlete-report-print-actions no-print">
          <label className="field field--pro athlete-report__comment-field">
            <span>Coach comments (optional)</span>
            <textarea
              rows={4}
              value={coachComment}
              placeholder="Add a short summary for parents or the athlete — e.g. progress, focus areas, next steps…"
              onChange={(event) => setCoachComment(event.target.value)}
            />
            <small className="muted">
              Not saved — only included in this export. Appears in the PDF when you print.
            </small>
          </label>
          <div className="athlete-report-print-actions__buttons">
            <button type="button" className="btn btn--ghost btn--small" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn--gold btn--small" onClick={printReport}>
              Print / Save as PDF
            </button>
          </div>
        </div>

        <article className="athlete-report">
          <header className="athlete-report__header">
            <div className="athlete-report__brand">
              <AppLogo size="sm" />
              <div>
                <p className="athlete-report__eyebrow">SurfStar performance report</p>
                <h1 id="athlete-report-title">{athleteName}</h1>
                <p className="athlete-report__subtitle">{reportTitle}</p>
              </div>
            </div>
            <dl className="athlete-report__meta">
              <div>
                <dt>Period</dt>
                <dd>{rangeLabel}</dd>
              </div>
              <div>
                <dt>Coach</dt>
                <dd>{coachName}</dd>
              </div>
              {organizationName ? (
                <div>
                  <dt>Organization</dt>
                  <dd>{organizationName}</dd>
                </div>
              ) : null}
              <div>
                <dt>Generated</dt>
                <dd>{generatedAt}</dd>
              </div>
            </dl>
          </header>

          <section className="athlete-report__section">
            <h2>Summary</h2>
            <div className="athlete-report__kpi-grid">
              <article>
                <span>Sessions</span>
                <strong>{general.totalTrainings}</strong>
              </article>
              <article>
                <span>Waves logged</span>
                <strong>{general.totalWaves}</strong>
              </article>
              <article>
                <span>Avg level</span>
                <strong>{formatAverageLevelValue(general.avgOverallManeuverLevel)}</strong>
              </article>
              <article>
                <span>Potential rate</span>
                <strong>{general.withPotentialRate === null ? '—' : `${general.withPotentialRate}%`}</strong>
              </article>
              <article>
                <span>Stars</span>
                <strong>{general.totalStars}</strong>
              </article>
              <article>
                <span>Heat wins</span>
                <strong>{general.heatWins}</strong>
              </article>
            </div>
            {general.avgOverallManeuverLevel !== null ? (
              <p className="athlete-report__note">{formatCombinedLevelSummary(general)}</p>
            ) : null}
          </section>

          {trimmedComment ? (
            <section className="athlete-report__section athlete-report__section--comments">
              <h2>Coach comments</h2>
              <p className="athlete-report__comment">{trimmedComment}</p>
            </section>
          ) : null}

          {analytics.evolution.length > 0 ? (
            <section className="athlete-report__section">
              <h2>Evolution</h2>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table">
                  <thead>
                    <tr>
                      <th>{evolutionColumn}</th>
                      <th>Sessions</th>
                      <th>Waves</th>
                      <th>Success</th>
                      <th>Avg level</th>
                      <th>Potential</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.evolution.map((point) => (
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

          {Object.keys(sessionCountByMode).length > 0 ? (
            <section className="athlete-report__section">
              <h2>Training mix</h2>
              <ul className="athlete-report__breakdown">
                {Object.entries(sessionCountByMode).map(([mode, count]) => (
                  <li key={mode}>
                    <span>{TRAINING_MODE_LABELS[mode as keyof typeof TRAINING_MODE_LABELS] ?? mode}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {analytics.technical ? (
            <section className="athlete-report__section">
              <h2>Technical training</h2>
              <p>
                Success rate {analytics.technical.overallSuccessRate}% · Avg level{' '}
                {formatAverageLevelValue(analytics.technical.averageLevel)} · {general.technicalStars} stars
              </p>
            </section>
          ) : null}

          {analytics.combo ? (
            <section className="athlete-report__section">
              <h2>Combos</h2>
              <p>
                Success rate {analytics.combo.overallSuccessRate}% · Avg level{' '}
                {formatAverageLevelValue(analytics.combo.averageLevel)} · {general.comboStars} stars
              </p>
            </section>
          ) : null}

          {heatAnalytics.heatsTotal > 0 ? (
            <section className="athlete-report__section">
              <h2>Competition</h2>
              <p>
                {general.heatParticipations} heats · {general.heatWins} wins · Avg score{' '}
                {heatAnalytics.avgHeatScore?.toFixed(2) ?? '—'}
                {general.championshipWins > 0 ? ` · ${general.championshipWins} championship title(s)` : ''}
              </p>
            </section>
          ) : null}

          {sessionSummaries.length > 0 ? (
            <section className="athlete-report__section">
              <h2>Session log</h2>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Mode</th>
                      <th>Spot</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionSummaries.map(({ session, headline }) => (
                      <tr key={session.id}>
                        <td>{formatSessionDate(session.endedAt ?? session.startedAt)}</td>
                        <td>{TRAINING_MODE_LABELS[session.mode]}</td>
                        <td>{resolveSessionSpotName(session, getSpot)}</td>
                        <td>{headline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <footer className="athlete-report__footer">
            <p>
              Generated by SurfStar · {getAppSiteUrl()} · {formatShortDate(new Date())}
            </p>
          </footer>
        </article>
      </div>
    </div>
  )
}
