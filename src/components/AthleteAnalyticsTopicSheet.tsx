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
import {
  COMBO_LEVEL_LABELS,
  MANEUVER_LABELS,
  TRAINING_MODE_LABELS,
  type ManeuverKind,
} from '../types'
import { formatSessionDate, resolveSessionSpotName } from '../sessionHistoryUtils'
import type { SurfSpot } from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

export type AnalyticsTopic =
  | 'performance'
  | 'volume'
  | 'wave-quality'
  | 'technical'
  | 'combos'
  | 'competition'

const TOPIC_META: Record<
  AnalyticsTopic,
  { title: string; eyebrow: string }
> = {
  performance: { title: 'Performance', eyebrow: 'Levels & stars' },
  volume: { title: 'Training volume', eyebrow: 'Sessions & waves' },
  'wave-quality': { title: 'Wave quality', eyebrow: 'Potential selection' },
  technical: { title: 'Technical training', eyebrow: 'Maneuver breakdown' },
  combos: { title: 'Combos', eyebrow: 'Level-by-level detail' },
  competition: { title: 'Competition', eyebrow: 'Heats & scores' },
}

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

export function AthleteAnalyticsTopicSheet({
  topic,
  analytics,
  heatAnalytics,
  sessionSummaries,
  getSpot,
  onClose,
}: Props) {
  const meta = TOPIC_META[topic]
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
              {meta.eyebrow} · {periodLabel}
            </p>
            <h2 id="analytics-topic-title">{meta.title}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="analytics-topic-sheet__body">
          {topic === 'performance' ? (
            <>
              <div className="kpi-grid analytics-topic-sheet__kpis">
                <article className="kpi-card kpi-card--accent">
                  <span className="kpi-card__label">Combined avg level</span>
                  <strong className="kpi-card__value">
                    {formatAverageLevelValue(general.avgOverallManeuverLevel)}
                  </strong>
                  <small className="kpi-card__hint">{formatCombinedLevelSummary(general)}</small>
                </article>
                <article className="kpi-card kpi-card--success">
                  <span className="kpi-card__label">Stars landed</span>
                  <strong className="kpi-card__value">{general.totalStars}</strong>
                  <small className="kpi-card__hint">
                    Tech {general.technicalStars} · Combo {general.comboStars}
                  </small>
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">Total attempts</span>
                  <strong className="kpi-card__value">{general.totalManeuverAttempts}</strong>
                  <small className="kpi-card__hint">
                    Tech {general.technicalAttemptCount} · Combo {general.comboAttemptCount}
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
                subtitle="Success rate, combined avg level, and wave potential over time"
                points={analytics.evolution}
                periodColumnLabel={evolutionColumnLabel(analytics.range)}
              />
            </>
          ) : null}

          {topic === 'volume' ? (
            <>
              <div className="kpi-grid analytics-topic-sheet__kpis">
                <article className="kpi-card kpi-card--accent">
                  <span className="kpi-card__label">Completed sessions</span>
                  <strong className="kpi-card__value">{general.totalTrainings}</strong>
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">Waves logged</span>
                  <strong className="kpi-card__value">{general.totalWaves}</strong>
                </article>
              </div>

              {Object.keys(sessionCountByMode).length > 0 ? (
                <div className="analytics-topic-sheet__breakdown">
                  <h3 className="analytics-topic-sheet__section-title">By training type</h3>
                  <ul className="analytics-topic-sheet__breakdown-list">
                    {Object.entries(sessionCountByMode).map(([mode, count]) => (
                      <li key={mode}>
                        <span>{TRAINING_MODE_LABELS[mode as keyof typeof TRAINING_MODE_LABELS] ?? mode}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {sessionSummaries.length > 0 ? (
                <div className="analytics-topic-sheet__section">
                  <h3 className="analytics-topic-sheet__section-title">Session log</h3>
                  <ul className="team-analytics-sessions">
                    {sessionSummaries.map(({ session, headline }) => (
                      <li key={session.id} className="team-analytics-sessions__item">
                        <div>
                          <strong>{TRAINING_MODE_LABELS[session.mode]}</strong>
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
                <p className="muted">No completed sessions in this period.</p>
              )}
            </>
          ) : null}

          {topic === 'wave-quality' ? (
            <>
              <div className="kpi-grid analytics-topic-sheet__kpis">
                <article className="kpi-card kpi-card--accent">
                  <span className="kpi-card__label">With potential</span>
                  <strong className="kpi-card__value">
                    {general.withPotentialRate === null ? '—' : `${general.withPotentialRate}%`}
                  </strong>
                  {general.withPotentialRate !== null ? (
                    <RateBar value={general.withPotentialRate} />
                  ) : null}
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">Without potential</span>
                  <strong className="kpi-card__value">
                    {general.withoutPotentialRate === null ? '—' : `${general.withoutPotentialRate}%`}
                  </strong>
                  {general.withoutPotentialRate !== null ? (
                    <RateBar value={general.withoutPotentialRate} />
                  ) : null}
                </article>
              </div>

              <div className="analytics-topic-sheet__breakdown">
                <h3 className="analytics-topic-sheet__section-title">Wave counts</h3>
                <ul className="analytics-topic-sheet__breakdown-list">
                  <li>
                    <span>Total waves</span>
                    <strong>{general.totalWaves}</strong>
                  </li>
                  <li>
                    <span>With potential</span>
                    <strong>{general.withPotential}</strong>
                  </li>
                  <li>
                    <span>Without potential</span>
                    <strong>{general.withoutPotential}</strong>
                  </li>
                </ul>
              </div>

              <EvolutionLineChart
                title="Potential rate over time"
                subtitle="Share of waves marked with scoring potential"
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
                    <span className="kpi-card__label">Avg technical level</span>
                    <strong className="kpi-card__value">
                      {formatAverageLevelValue(analytics.technical.averageLevel)}
                    </strong>
                  </article>
                  <article className="kpi-card">
                    <span className="kpi-card__label">Success rate</span>
                    <strong className="kpi-card__value">{analytics.technical.overallSuccessRate}%</strong>
                    <small className="kpi-card__hint">
                      {analytics.technical.successfulManeuvers}/{analytics.technical.totalManeuvers}{' '}
                      maneuvers
                    </small>
                  </article>
                  <article className="kpi-card kpi-card--star">
                    <span className="kpi-card__label">Technical stars</span>
                    <strong className="kpi-card__value">{general.technicalStars}</strong>
                  </article>
                </div>

                <SideCompareChart
                  title="All maneuvers"
                  overallRate={analytics.technical.overallSuccessRate}
                  bySide={analytics.technical.bySide}
                />

                {KINDS.map((kind) => (
                  <div key={kind} className="analytics-topic-sheet__section">
                    <header className="stats-panel__head">
                      <h3 className="analytics-topic-sheet__section-title">{MANEUVER_LABELS[kind]}</h3>
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
              <p className="muted">No technical training sessions in this period.</p>
            )
          ) : null}

          {topic === 'combos' ? (
            analytics.combo ? (
              <>
                <div className="kpi-grid analytics-topic-sheet__kpis">
                  <article className="kpi-card kpi-card--accent">
                    <span className="kpi-card__label">Avg combo level</span>
                    <strong className="kpi-card__value">
                      {formatAverageLevelValue(analytics.combo.averageLevel)}
                    </strong>
                  </article>
                  <article className="kpi-card">
                    <span className="kpi-card__label">Success rate</span>
                    <strong className="kpi-card__value">{analytics.combo.overallSuccessRate}%</strong>
                    <small className="kpi-card__hint">
                      {analytics.combo.successfulAttempts}/{analytics.combo.totalAttempts} attempts
                    </small>
                  </article>
                  <article className="kpi-card kpi-card--star">
                    <span className="kpi-card__label">Combo stars</span>
                    <strong className="kpi-card__value">{general.comboStars}</strong>
                  </article>
                </div>

                <SideCompareChart
                  title="All combo levels"
                  overallRate={analytics.combo.overallSuccessRate}
                  bySide={analytics.combo.bySide}
                />

                <div className="side-chart-stack">
                  {LEVELS.map((lvl) => {
                    const row = analytics.combo!.byLevel[lvl]
                    return (
                      <SideCompareChart
                        key={String(lvl)}
                        title={COMBO_LEVEL_LABELS[lvl]}
                        subtitle={`${row.successes}/${row.attempts} successes overall`}
                        overallRate={row.rate}
                        bySide={row.bySide}
                      />
                    )
                  })}
                </div>
              </>
            ) : (
              <p className="muted">No combo sessions in this period.</p>
            )
          ) : null}

          {topic === 'competition' ? (
            <>
              <div className="kpi-grid analytics-topic-sheet__kpis">
                <article className="kpi-card kpi-card--accent">
                  <span className="kpi-card__label">Heat wins</span>
                  <strong className="kpi-card__value">{general.heatWins}</strong>
                  <small className="kpi-card__hint">{general.heatParticipations} heats</small>
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">Avg heat score</span>
                  <strong className="kpi-card__value">
                    {heatAnalytics.avgHeatScore === null ? '—' : heatAnalytics.avgHeatScore.toFixed(2)}
                  </strong>
                </article>
                <article className="kpi-card kpi-card--success">
                  <span className="kpi-card__label">Championship wins</span>
                  <strong className="kpi-card__value">{general.championshipWins}</strong>
                  <small className="kpi-card__hint">
                    {general.championshipWins === 1 ? 'title' : 'titles'} in period
                  </small>
                </article>
                <article className="kpi-card">
                  <span className="kpi-card__label">Win rate</span>
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
                    Rhythm metrics use wave timestamps vs heat timer. Major score ={' '}
                    {MAJOR_HEAT_WAVE_SCORE.toFixed(2)}+ pts. Based on{' '}
                    {heatAnalytics.heatsWithTiming} heat
                    {heatAnalytics.heatsWithTiming === 1 ? '' : 's'} with timer data.
                  </p>

                  <div className="analytics-topic-sheet__section">
                    <h3 className="analytics-topic-sheet__section-title">Opening & early rhythm</h3>
                    <div className="kpi-grid analytics-topic-sheet__kpis">
                      <article className="kpi-card kpi-card--accent">
                        <span className="kpi-card__label">Best wave · first 5 min</span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.avgBestWaveOpening === null
                            ? '—'
                            : heatAnalytics.avgBestWaveOpening.toFixed(2)}
                        </strong>
                        <small className="kpi-card__hint">Avg peak opening score</small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">
                          {EARLY_HEAT_TOTAL_TARGET}+ pts total · first 10 min
                        </span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.earlyTenPointsRate === null
                            ? '—'
                            : `${heatAnalytics.earlyTenPointsRate}%`}
                        </strong>
                        <small className="kpi-card__hint">
                          Avg early total{' '}
                          {heatAnalytics.avgEarlyTotalFirst10Min?.toFixed(2) ?? '—'} pts
                        </small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">Time to 1st wave</span>
                        <strong className="kpi-card__value">
                          {formatHeatElapsedMinutes(heatAnalytics.avgTimeToFirstWaveMin)}
                        </strong>
                        <small className="kpi-card__hint">
                          {heatAnalytics.heatsWithFirstWave} heat
                          {heatAnalytics.heatsWithFirstWave === 1 ? '' : 's'} with a wave logged
                        </small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">Time to 2 major scores</span>
                        <strong className="kpi-card__value">
                          {formatHeatElapsedMinutes(heatAnalytics.avgTimeToTwoMajorMin)}
                        </strong>
                        <small className="kpi-card__hint">
                          {heatAnalytics.heatsWithTwoMajor} heat
                          {heatAnalytics.heatsWithTwoMajor === 1 ? '' : 's'} reached pair
                        </small>
                      </article>
                    </div>
                  </div>

                  <div className="analytics-topic-sheet__section">
                    <h3 className="analytics-topic-sheet__section-title">Closing under pressure</h3>
                    <div className="kpi-grid analytics-topic-sheet__kpis">
                      <article className="kpi-card kpi-card--accent">
                        <span className="kpi-card__label">Best wave · last 5 min</span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.avgBestWaveClosing === null
                            ? '—'
                            : heatAnalytics.avgBestWaveClosing.toFixed(2)}
                        </strong>
                        <small className="kpi-card__hint">Avg peak closing score</small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">Major score · last 5 min</span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.closingMajorRate === null
                            ? '—'
                            : `${heatAnalytics.closingMajorRate}%`}
                        </strong>
                        <small className="kpi-card__hint">Heats with a late major wave</small>
                      </article>
                      <article className="kpi-card">
                        <span className="kpi-card__label">Clutch delta</span>
                        <strong className="kpi-card__value">
                          {heatAnalytics.clutchDelta === null
                            ? '—'
                            : `${heatAnalytics.clutchDelta >= 0 ? '+' : ''}${heatAnalytics.clutchDelta.toFixed(2)}`}
                        </strong>
                        <small className="kpi-card__hint">Closing best − opening best (avg)</small>
                      </article>
                    </div>
                  </div>
                </>
              ) : heatAnalytics.heatsTotal > 0 ? (
                <p className="muted analytics-topic-sheet__note">
                  {heatAnalytics.heatsTotal} heat{heatAnalytics.heatsTotal === 1 ? '' : 's'} found,
                  but none have timer data for rhythm analysis. Start the heat timer when logging
                  waves to unlock opening/closing metrics.
                </p>
              ) : null}

              {heatAnalytics.rows.length > 0 ? (
                <div className="analytics-topic-sheet__section">
                  <h3 className="analytics-topic-sheet__section-title">Heat log</h3>
                  <div className="table-wrap">
                    <table className="data-table data-table--compact">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Heat</th>
                          <th>Total</th>
                          <th>1st wave</th>
                          <th>Total ≤10m</th>
                          <th>{EARLY_HEAT_TOTAL_TARGET}+ ≤10m</th>
                          <th>2 maj time</th>
                          <th>Close 5m</th>
                          <th>Place</th>
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
                                  ? 'Yes'
                                  : 'No'}
                            </td>
                            <td>{formatHeatElapsedMinutes(row.timeToTwoMajorMin)}</td>
                            <td>
                              {row.hasTimerData
                                ? row.bestWaveClosing?.toFixed(2) ?? '—'
                                : '—'}
                            </td>
                            <td>
                              #{row.placement}
                              {row.won ? ' · Win' : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="muted">No heat or championship results in this period.</p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
