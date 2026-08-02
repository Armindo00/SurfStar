import { EvolutionLineChart } from './EvolutionLineChart'
import { ManeuverLevelSuccessChart } from './ManeuverLevelSuccessChart'
import { SideCompareChart } from './SideCompareChart'
import type { AthleteSessionSummary } from '../athleteStats'
import type { AthleteHeatAnalyticsSummary } from '../heatAnalyticsStats'
import {
  EARLY_HEAT_TOTAL_TARGET,
  MAJOR_HEAT_WAVE_SCORE,
} from '../heatAnalyticsStats'
import { formatHeatElapsedMinutes } from '../heatUtils'
import {
  averageLevelHint,
  averageLevelTrendLabel,
  formatAverageLevelValue,
  formatCombinedLevelSummary,
  LEVELS,
} from '../sessionStats'
import {
  describeAnalyticsRange,
  evolutionChartTitle,
  evolutionColumnLabel,
} from '../analyticsRange'
import type { AthletePeriodAnalytics } from '../teamAnalyticsStats'
import { comboLevelLabel, maneuverLabel, trainingModeLabel } from '../i18n/labels'
import { useI18n } from '../i18n'
import type { AnalyticsTopicSheetCopy } from '../i18n/types'
import { formatSessionDate, resolveSessionSpotName } from '../sessionHistoryUtils'
import type { ManeuverKind, SurfSpot } from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

export type AnalyticsTopic =
  | 'performance'
  | 'volume'
  | 'wave-quality'
  | 'technical'
  | 'combos'
  | 'competition'

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

type Props = {
  topic: AnalyticsTopic
  analytics: AthletePeriodAnalytics
  heatAnalytics: AthleteHeatAnalyticsSummary
  sessionSummaries: AthleteSessionSummary[]
  getSpot: (id: string) => SurfSpot | undefined
  onClose: () => void
}

function topicTitle(topic: AnalyticsTopic, t: (key: string) => string): string {
  if (topic === 'technical') return t('analytics.topicTitles.technicalTraining')
  const key = topic === 'wave-quality' ? 'waveQuality' : topic
  return t(`analytics.topics.${key}`)
}

function topicEyebrow(topic: AnalyticsTopic, t: (key: string) => string): string {
  const key = topic === 'wave-quality' ? 'waveQuality' : topic
  return t(`analytics.topicEyebrows.${key}`)
}

export function AthleteAnalyticsTopicSheet({
  topic,
  analytics,
  heatAnalytics,
  sessionSummaries,
  getSpot,
  onClose,
}: Props) {
  const { t, messages } = useI18n()
  const s: AnalyticsTopicSheetCopy = messages.analytics.topicSheet
  const general = analytics.general
  const periodLabel = describeAnalyticsRange(analytics.range)

  const sessionCountByMode = analytics.sessions.reduce(
    (acc, session) => {
      acc[session.mode] = (acc[session.mode] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal sheet sheet--tall analytics-topic-sheet team-analytics-page"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-topic-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">
              {topicEyebrow(topic, t)} · {periodLabel}
            </p>
            <h2 id="analytics-topic-title">{topicTitle(topic, t)}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </div>

        <div className="analytics-topic-sheet__body">
          {topic === 'performance' ? (
            <>
              <div className="kpi-grid analytics-topic-sheet__kpis">
                <article className="kpi-card kpi-card--accent">
                  <span className="kpi-card__label">{s.combinedAvgLevel}</span>
                  <strong className="kpi-card__value">
                    {formatAverageLevelValue(general.avgOverallManeuverLevel)}
                  </strong>
                  <small className="kpi-card__hint">{formatCombinedLevelSummary(general)}</small>
                </article>
                <article className="kpi-card kpi-card--success">
                  <span className="kpi-card__label">{s.starsLanded}</span>
                  <strong className="kpi-card__value">{general.totalStars}</strong>
                  <small className="kpi-card__hint">
                    {t('analytics.topicSheet.techComboShort', {
                      technical: general.technicalStars,
                      combo: general.comboStars,
                    })}
                  </small>
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">{s.totalAttempts}</span>
                  <strong className="kpi-card__value">{general.totalManeuverAttempts}</strong>
                  <small className="kpi-card__hint">
                    {t('analytics.topicSheet.techComboShort', {
                      technical: general.technicalAttemptCount,
                      combo: general.comboAttemptCount,
                    })}
                  </small>
                </article>
              </div>

              {general.avgOverallManeuverLevel !== null ? (
                <p className="muted analytics-topic-sheet__note">
                  {averageLevelHint(general.avgOverallManeuverLevel)} ·{' '}
                  {averageLevelTrendLabel(general.avgOverallManeuverLevel)}
                </p>
              ) : null}

              <EvolutionLineChart
                title={evolutionChartTitle(analytics.range)}
                subtitle={t('analytics.evolutionChartTitle')}
                points={analytics.evolution}
                periodColumnLabel={evolutionColumnLabel(analytics.range)}
              />
            </>
          ) : null}

          {topic === 'volume' ? (
            <>
              <div className="kpi-grid analytics-topic-sheet__kpis">
                <article className="kpi-card kpi-card--accent">
                  <span className="kpi-card__label">{s.completedSessions}</span>
                  <strong className="kpi-card__value">{general.totalTrainings}</strong>
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">{s.wavesLogged}</span>
                  <strong className="kpi-card__value">{general.totalWaves}</strong>
                </article>
              </div>

              {Object.keys(sessionCountByMode).length > 0 ? (
                <div className="analytics-topic-sheet__breakdown">
                  <h3 className="analytics-topic-sheet__section-title">{s.byTrainingType}</h3>
                  <ul className="analytics-topic-sheet__breakdown-list">
                    {Object.entries(sessionCountByMode).map(([mode, count]) => (
                      <li key={mode}>
                        <span>{trainingModeLabel(mode)}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {sessionSummaries.length > 0 ? (
                <div className="analytics-topic-sheet__section">
                  <h3 className="analytics-topic-sheet__section-title">{s.sessionLog}</h3>
                  <ul className="team-analytics-sessions">
                    {sessionSummaries.map(({ session, headline }) => (
                      <li key={session.id} className="team-analytics-sessions__item">
                        <div>
                          <strong>{trainingModeLabel(session.mode)}</strong>
                          <small>
                            {formatSessionDate(session.endedAt ?? session.startedAt)} ·{' '}
                            {resolveSessionSpotName(session, getSpot)} · {session.condition || '—'}
                          </small>
                        </div>
                        <span>{headline}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="muted">{s.noSessionsInPeriod}</p>
              )}
            </>
          ) : null}

          {topic === 'wave-quality' ? (
            <>
              <div className="kpi-grid analytics-topic-sheet__kpis">
                <article className="kpi-card kpi-card--accent">
                  <span className="kpi-card__label">{s.withPotential}</span>
                  <strong className="kpi-card__value">
                    {general.withPotentialRate === null ? '—' : `${general.withPotentialRate}%`}
                  </strong>
                  {general.withPotentialRate !== null ? (
                    <RateBar value={general.withPotentialRate} />
                  ) : null}
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">{s.withoutPotential}</span>
                  <strong className="kpi-card__value">
                    {general.withoutPotentialRate === null ? '—' : `${general.withoutPotentialRate}%`}
                  </strong>
                  {general.withoutPotentialRate !== null ? (
                    <RateBar value={general.withoutPotentialRate} />
                  ) : null}
                </article>
              </div>

              <div className="analytics-topic-sheet__breakdown">
                <h3 className="analytics-topic-sheet__section-title">{s.waveCounts}</h3>
                <ul className="analytics-topic-sheet__breakdown-list">
                  <li>
                    <span>{s.totalWaves}</span>
                    <strong>{general.totalWaves}</strong>
                  </li>
                  <li>
                    <span>{s.withPotential}</span>
                    <strong>{general.withPotential}</strong>
                  </li>
                  <li>
                    <span>{s.withoutPotential}</span>
                    <strong>{general.withoutPotential}</strong>
                  </li>
                </ul>
              </div>

              <EvolutionLineChart
                title={t('analytics.potentialRateOverTime')}
                subtitle={t('analytics.potentialRateSubtitle')}
                points={analytics.evolution}
                periodColumnLabel={evolutionColumnLabel(analytics.range)}
              />
            </>
          ) : null}

          {topic === 'technical' ? (
            analytics.technical ? (
              <>
                <div className="kpi-grid analytics-topic-sheet__kpis">
                  <article className="kpi-card kpi-card--accent">
                    <span className="kpi-card__label">{s.avgTechnicalLevel}</span>
                    <strong className="kpi-card__value">
                      {formatAverageLevelValue(analytics.technical.averageLevel)}
                    </strong>
                  </article>
                  <article className="kpi-card">
                    <span className="kpi-card__label">{s.successRate}</span>
                    <strong className="kpi-card__value">{analytics.technical.overallSuccessRate}%</strong>
                    <small className="kpi-card__hint">
                      {t('analytics.topicSheet.maneuversCount', {
                        made: analytics.technical.successfulManeuvers,
                        total: analytics.technical.totalManeuvers,
                      })}
                    </small>
                  </article>
                  <article className="kpi-card kpi-card--star">
                    <span className="kpi-card__label">{s.technicalStars}</span>
                    <strong className="kpi-card__value">{general.technicalStars}</strong>
                  </article>
                </div>

                <SideCompareChart
                  title={t('analytics.allManeuvers')}
                  overallRate={analytics.technical.overallSuccessRate}
                  bySide={analytics.technical.bySide}
                />

                {KINDS.map((kind) => (
                  <div key={kind} className="analytics-topic-sheet__section">
                    <header className="stats-panel__head">
                      <h3 className="analytics-topic-sheet__section-title">{maneuverLabel(kind)}</h3>
                      <span className="stats-badge">
                        {analytics.technical!.byKind[kind].successes}/
                        {analytics.technical!.byKind[kind].total} ·{' '}
                        {analytics.technical!.byKind[kind].rate}%
                      </span>
                    </header>
                    <ManeuverLevelSuccessChart byLevel={analytics.technical!.byKind[kind].byLevel} />
                  </div>
                ))}
              </>
            ) : (
              <p className="muted">{s.noTechnicalSessions}</p>
            )
          ) : null}

          {topic === 'combos' ? (
            analytics.combo ? (
              <>
                <div className="kpi-grid analytics-topic-sheet__kpis">
                  <article className="kpi-card kpi-card--accent">
                    <span className="kpi-card__label">{s.avgComboLevel}</span>
                    <strong className="kpi-card__value">
                      {formatAverageLevelValue(analytics.combo.averageLevel)}
                    </strong>
                  </article>
                  <article className="kpi-card">
                    <span className="kpi-card__label">{s.successRate}</span>
                    <strong className="kpi-card__value">{analytics.combo.overallSuccessRate}%</strong>
                    <small className="kpi-card__hint">
                      {t('analytics.topicSheet.attemptsCount', {
                        made: analytics.combo.successfulAttempts,
                        total: analytics.combo.totalAttempts,
                      })}
                    </small>
                  </article>
                  <article className="kpi-card kpi-card--star">
                    <span className="kpi-card__label">{s.comboStars}</span>
                    <strong className="kpi-card__value">{general.comboStars}</strong>
                  </article>
                </div>

                <SideCompareChart
                  title={t('analytics.allComboLevels')}
                  overallRate={analytics.combo.overallSuccessRate}
                  bySide={analytics.combo.bySide}
                />

                <div className="side-chart-stack">
                  {LEVELS.map((lvl) => {
                    const row = analytics.combo!.byLevel[lvl]
                    return (
                      <SideCompareChart
                        key={String(lvl)}
                        title={comboLevelLabel(lvl)}
                        subtitle={t('session.register.successesOverall', {
                          successes: row.successes,
                          total: row.attempts,
                        })}
                        overallRate={row.rate}
                        bySide={row.bySide}
                      />
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="muted">{s.noComboSessions}</p>
            )
          ) : null}

          {topic === 'competition' ? (
            <>
              <div className="kpi-grid analytics-topic-sheet__kpis">
                <article className="kpi-card kpi-card--accent">
                  <span className="kpi-card__label">{s.heatWins}</span>
                  <strong className="kpi-card__value">{general.heatWins}</strong>
                  <small className="kpi-card__hint">
                    {t('analytics.topicSheet.heatsCount', { count: general.heatParticipations })}
                  </small>
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">{s.avgHeatScore}</span>
                  <strong className="kpi-card__value">
                    {heatAnalytics.avgHeatScore === null ? '—' : heatAnalytics.avgHeatScore.toFixed(2)}
                  </strong>
                </article>
                <article className="kpi-card kpi-card--success">
                  <span className="kpi-card__label">{s.championshipWins}</span>
                  <strong className="kpi-card__value">{general.championshipWins}</strong>
                  <small className="kpi-card__hint">
                    {general.championshipWins === 1 ? s.titleInPeriod : s.titlesInPeriod}
                  </small>
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">{s.winRate}</span>
                  <strong className="kpi-card__value">
                    {general.heatParticipations
                      ? `${Math.round((general.heatWins / general.heatParticipations) * 100)}%`
                      : '—'}
                  </strong>
                </article>
              </div>

              {heatAnalytics.heatsWithTiming > 0 ? (
                <>
                  <p className="muted analytics-topic-sheet__note">
                    {t(
                      heatAnalytics.heatsWithTiming === 1
                        ? 'analytics.topicSheet.rhythmNote'
                        : 'analytics.topicSheet.rhythmNotePlural',
                      {
                        score: MAJOR_HEAT_WAVE_SCORE.toFixed(2),
                        count: heatAnalytics.heatsWithTiming,
                      },
                    )}
                  </p>

                  <div className="analytics-topic-sheet__section">
                    <h3 className="analytics-topic-sheet__section-title">{s.openingEarlyRhythm}</h3>
                    <div className="kpi-grid analytics-topic-sheet__kpis">
                      <article className="kpi-card kpi-card--accent">
                        <span className="kpi-card__label">{s.bestWaveFirst5}</span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.avgBestWaveOpening === null
                            ? '—'
                            : heatAnalytics.avgBestWaveOpening.toFixed(2)}
                        </strong>
                        <small className="kpi-card__hint">{s.avgPeakOpening}</small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">
                          {t('analytics.topicSheet.earlyTotalFirst10', {
                            target: EARLY_HEAT_TOTAL_TARGET,
                          })}
                        </span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.earlyTenPointsRate === null
                            ? '—'
                            : `${heatAnalytics.earlyTenPointsRate}%`}
                        </strong>
                        <small className="kpi-card__hint">
                          {t('analytics.topicSheet.avgEarlyTotal', {
                            total: heatAnalytics.avgEarlyTotalFirst10Min?.toFixed(2) ?? '—',
                          })}
                        </small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">{s.timeToFirstWave}</span>
                        <strong className="kpi-card__value">
                          {formatHeatElapsedMinutes(heatAnalytics.avgTimeToFirstWaveMin)}
                        </strong>
                        <small className="kpi-card__hint">
                          {t(
                            heatAnalytics.heatsWithFirstWave === 1
                              ? 'analytics.topicSheet.heatsWithWave'
                              : 'analytics.topicSheet.heatsWithWavePlural',
                            { count: heatAnalytics.heatsWithFirstWave },
                          )}
                        </small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">{s.timeToTwoMajor}</span>
                        <strong className="kpi-card__value">
                          {formatHeatElapsedMinutes(heatAnalytics.avgTimeToTwoMajorMin)}
                        </strong>
                        <small className="kpi-card__hint">
                          {t(
                            heatAnalytics.heatsWithTwoMajor === 1
                              ? 'analytics.topicSheet.heatsReachedPair'
                              : 'analytics.topicSheet.heatsReachedPairPlural',
                            { count: heatAnalytics.heatsWithTwoMajor },
                          )}
                        </small>
                      </article>
                    </div>
                  </div>

                  <div className="analytics-topic-sheet__section">
                    <h3 className="analytics-topic-sheet__section-title">{s.closingUnderPressure}</h3>
                    <div className="kpi-grid analytics-topic-sheet__kpis">
                      <article className="kpi-card kpi-card--accent">
                        <span className="kpi-card__label">{s.bestWaveLast5}</span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.avgBestWaveClosing === null
                            ? '—'
                            : heatAnalytics.avgBestWaveClosing.toFixed(2)}
                        </strong>
                        <small className="kpi-card__hint">{s.avgPeakClosing}</small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">{s.majorScoreLast5}</span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.closingMajorRate === null
                            ? '—'
                            : `${heatAnalytics.closingMajorRate}%`}
                        </strong>
                        <small className="kpi-card__hint">{s.heatsLateMajor}</small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">{s.clutchDelta}</span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.clutchDelta === null
                            ? '—'
                            : `${heatAnalytics.clutchDelta >= 0 ? '+' : ''}${heatAnalytics.clutchDelta.toFixed(2)}`}
                        </strong>
                        <small className="kpi-card__hint">{s.clutchDeltaHint}</small>
                      </article>
                    </div>
                  </div>
                </>
              ) : heatAnalytics.heatsTotal > 0 ? (
                <p className="muted analytics-topic-sheet__note">
                  {t(
                    heatAnalytics.heatsTotal === 1
                      ? 'analytics.topicSheet.noTimerRhythm'
                      : 'analytics.topicSheet.noTimerRhythmPlural',
                    { count: heatAnalytics.heatsTotal },
                  )}
                </p>
              ) : null}

              {heatAnalytics.rows.length > 0 ? (
                <div className="analytics-topic-sheet__section">
                  <h3 className="analytics-topic-sheet__section-title">{s.heatLog}</h3>
                  <div className="table-wrap">
                    <table className="data-table data-table--compact">
                      <thead>
                        <tr>
                          <th>{messages.analytics.analyticsReport.date}</th>
                          <th>{messages.analytics.analyticsReport.heat}</th>
                          <th>{messages.analytics.analyticsReport.total}</th>
                          <th>{messages.analytics.analyticsReport.firstWave}</th>
                          <th>{messages.analytics.analyticsReport.totalUnder10}</th>
                          <th>
                            {t('analytics.analyticsReport.earlyTargetUnder10', {
                              target: EARLY_HEAT_TOTAL_TARGET,
                            })}
                          </th>
                          <th>{messages.analytics.analyticsReport.twoMajorTime}</th>
                          <th>{messages.analytics.analyticsReport.close5m}</th>
                          <th>{messages.analytics.analyticsReport.place}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heatAnalytics.rows.map((row) => (
                          <tr key={`${row.sessionId}-${row.heatLabel}`}>
                            <td>{formatSessionDate(row.sessionEndedAt)}</td>
                            <td>{row.heatLabel}</td>
                            <td>{row.total.toFixed(2)}</td>
                            <td>{formatHeatElapsedMinutes(row.timeToFirstWaveMin)}</td>
                            <td>
                              {row.hasTimerData
                                ? row.earlyTotalFirst10Min?.toFixed(2) ?? '—'
                                : '—'}
                            </td>
                            <td>
                              {!row.hasTimerData
                                ? '—'
                                : row.reachedTenPointsInEarlyWindow
                                  ? s.yes
                                  : s.no}
                            </td>
                            <td>{formatHeatElapsedMinutes(row.timeToTwoMajorMin)}</td>
                            <td>
                              {row.hasTimerData
                                ? row.bestWaveClosing?.toFixed(2) ?? '—'
                                : '—'}
                            </td>
                            <td>
                              #{row.placement}
                              {row.won ? s.winSuffix : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="muted">{s.noHeatResults}</p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
