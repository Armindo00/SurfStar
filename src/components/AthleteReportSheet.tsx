import { useState } from 'react'
import { AppLogo } from './AppLogo'
import {
  describeAnalyticsRange,
  describeAnalyticsRangeLong,
  evolutionColumnLabel,
} from '../analyticsRange'
import type { AthletePsychologyAnalytics } from '../athletePsychologyStats'
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
import { trainingModeLabel } from '../i18n/labels'
import { useI18n } from '../i18n'
import type { SurfSpot } from '../types'
import { AthleteReportDetailSections } from './AthleteReportDetailSections'

type Props = {
  athleteName: string
  coachName: string
  organizationName?: string | null
  analytics: AthletePeriodAnalytics
  heatAnalytics: AthleteHeatAnalyticsSummary
  sessionSummaries: AthleteSessionSummary[]
  getSpot: (id: string) => SurfSpot | undefined
  athleteId: string
  psychology?: AthletePsychologyAnalytics | null
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
  athleteId,
  psychology,
  onClose,
}: Props) {
  const { t, messages } = useI18n()
  const r = messages.analytics.analyticsReport
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
            <span>{r.coachCommentsOptional}</span>
            <textarea
              rows={4}
              value={coachComment}
              placeholder={r.coachCommentsPlaceholder}
              onChange={(event) => setCoachComment(event.target.value)}
            />
            <small className="muted">{r.coachCommentsNote}</small>
          </label>
          <div className="athlete-report-print-actions__buttons">
            <button type="button" className="btn btn--ghost btn--small" onClick={onClose}>
              {t('common.close')}
            </button>
            <button type="button" className="btn btn--gold btn--small" onClick={printReport}>
              {r.printSavePdf}
            </button>
          </div>
        </div>

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
                <strong>{formatAverageLevelValue(general.avgOverallManeuverLevel)}</strong>
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
            {general.avgOverallManeuverLevel !== null ? (
              <p className="athlete-report__note">{formatCombinedLevelSummary(general)}</p>
            ) : null}
          </section>

          {trimmedComment ? (
            <section className="athlete-report__section athlete-report__section--comments">
              <h2>{r.coachComments}</h2>
              <p className="athlete-report__comment">{trimmedComment}</p>
            </section>
          ) : null}

          {analytics.evolution.length > 0 ? (
            <section className="athlete-report__section">
              <h2>{r.evolution}</h2>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table">
                  <thead>
                    <tr>
                      <th>{evolutionColumn}</th>
                      <th>{r.sessions}</th>
                      <th>{r.wavesLogged}</th>
                      <th>{r.successCol}</th>
                      <th>{r.avgLevel}</th>
                      <th>{r.potentialCol}</th>
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
              <h2>{r.trainingMix}</h2>
              <ul className="athlete-report__breakdown">
                {Object.entries(sessionCountByMode).map(([mode, count]) => (
                  <li key={mode}>
                    <span>{trainingModeLabel(mode)}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <AthleteReportDetailSections
            analytics={analytics}
            general={general}
            heatAnalytics={heatAnalytics}
            athleteId={athleteId}
            psychology={psychology}
          />

          {sessionSummaries.length > 0 ? (
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
                    {sessionSummaries.map(({ session, headline }) => (
                      <tr key={session.id}>
                        <td>{formatSessionDate(session.endedAt ?? session.startedAt)}</td>
                        <td>{trainingModeLabel(session.mode)}</td>
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
              {t('analytics.analyticsReport.footerGenerated', {
                url: getAppSiteUrl(),
                date: formatShortDate(new Date()),
              })}
            </p>
          </footer>
        </article>
      </div>
    </div>
  )
}
