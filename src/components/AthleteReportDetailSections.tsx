import type { ReactNode } from 'react'
import type { AthletePsychologyAnalytics } from '../athletePsychologyStats'
import {
  EARLY_HEAT_TOTAL_TARGET,
  MAJOR_HEAT_WAVE_SCORE,
  type AthleteHeatAnalyticsSummary,
} from '../heatAnalyticsStats'
import type { AthleteGeneralStats } from '../athleteStats'
import { formatHeatElapsedMinutes } from '../heatUtils'
import { formatSessionDate } from '../sessionHistoryUtils'
import {
  formatAverageLevelValue,
  LEVELS,
  rate,
  type ComboSessionStatsSnapshot,
  type LevelSuccessStats,
  type SidePairStats,
} from '../sessionStats'
import type { AthletePeriodAnalytics } from '../teamAnalyticsStats'
import { comboLevelLabel, levelLabelEn, maneuverLabel } from '../i18n/labels'
import { useI18n } from '../i18n'
import type { AnalyticsReportCopy } from '../i18n/types'
import type {
  ComboLevel,
  ManeuverKind,
  ManeuverLevel,
  ManeuverLog,
  TrainingSession,
  WaveSide,
} from '../types'

type ReportCopy = AnalyticsReportCopy

const TECHNICAL_KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']
const COMBO_LEVELS: ComboLevel[] = [1, 2, 3, 'estrela']

function misses(stats: LevelSuccessStats): number {
  return Math.max(0, stats.attempts - stats.successes)
}

function rateLabel(stats: LevelSuccessStats): string {
  return stats.attempts === 0 ? '—' : `${stats.rate}%`
}

function emptySidePair(): SidePairStats {
  return {
    frontside: { attempts: 0, successes: 0, rate: 0 },
    backside: { attempts: 0, successes: 0, rate: 0 },
  }
}

function tallyLevelSide(logs: { level: ManeuverLevel | ComboLevel; side: WaveSide; success: boolean }[]) {
  const byLevel: Record<ManeuverLevel, SidePairStats> = {
    1: emptySidePair(),
    2: emptySidePair(),
    3: emptySidePair(),
    estrela: emptySidePair(),
  }

  for (const log of logs) {
    byLevel[log.level][log.side].attempts += 1
    if (log.success) byLevel[log.level][log.side].successes += 1
  }

  for (const level of LEVELS) {
    byLevel[level].frontside.rate = rate(
      byLevel[level].frontside.successes,
      byLevel[level].frontside.attempts,
    )
    byLevel[level].backside.rate = rate(
      byLevel[level].backside.successes,
      byLevel[level].backside.attempts,
    )
  }

  return byLevel
}

function tallyLevelStats(
  logs: { level: ManeuverLevel | ComboLevel; success: boolean }[],
): Record<ManeuverLevel, LevelSuccessStats> {
  const byLevel: Record<ManeuverLevel, LevelSuccessStats> = {
    1: { attempts: 0, successes: 0, rate: 0 },
    2: { attempts: 0, successes: 0, rate: 0 },
    3: { attempts: 0, successes: 0, rate: 0 },
    estrela: { attempts: 0, successes: 0, rate: 0 },
  }

  for (const log of logs) {
    byLevel[log.level].attempts += 1
    if (log.success) byLevel[log.level].successes += 1
  }

  for (const level of LEVELS) {
    byLevel[level].rate = rate(byLevel[level].successes, byLevel[level].attempts)
  }

  return byLevel
}

function collectManeuverLogs(
  sessions: TrainingSession[],
  athleteId: string,
  kind?: ManeuverKind,
): ManeuverLog[] {
  const logs: ManeuverLog[] = []
  for (const session of sessions) {
    if (session.mode !== 'tecnico') continue
    for (const wave of session.waves) {
      if (wave.athleteId !== athleteId) continue
      for (const log of wave.maneuvers) {
        if (kind && log.kind !== kind) continue
        logs.push(log)
      }
    }
  }
  return logs
}

function ReportSubheading({ children }: { children: ReactNode }) {
  return <h3 className="athlete-report__subsection-title">{children}</h3>
}

function ReportSideTable({
  bySide,
  caption,
  r,
}: {
  bySide: SidePairStats
  caption?: string
  r: ReportCopy
}) {
  const rows = [
    { label: r.frontside, stats: bySide.frontside },
    { label: r.backside, stats: bySide.backside },
  ] as const

  if (rows.every(({ stats }) => stats.attempts === 0)) return null

  return (
    <div className="table-wrap athlete-report__table-wrap">
      {caption ? <p className="athlete-report__table-caption">{caption}</p> : null}
      <table className="data-table athlete-report__table athlete-report__detail-table">
        <thead>
          <tr>
            <th>{r.side}</th>
            <th>{r.attempts}</th>
            <th>{r.made}</th>
            <th>{r.missed}</th>
            <th>{r.success}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, stats }) => (
            <tr key={label}>
              <td>{label}</td>
              <td>{stats.attempts}</td>
              <td>{stats.successes}</td>
              <td>{misses(stats)}</td>
              <td>{rateLabel(stats)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReportLevelMakeMissTable({
  byLevel,
  labelForLevel,
  r,
}: {
  byLevel: Record<number | 'estrela', LevelSuccessStats>
  labelForLevel: (level: number | 'estrela') => string
  r: ReportCopy
}) {
  const levels = LEVELS.filter((level) => byLevel[level].attempts > 0)
  if (levels.length === 0) return null

  return (
    <div className="table-wrap athlete-report__table-wrap">
      <table className="data-table athlete-report__table athlete-report__detail-table">
        <thead>
          <tr>
            <th>{r.level}</th>
            <th>{r.attempts}</th>
            <th>{r.made}</th>
            <th>{r.missed}</th>
            <th>{r.success}</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((level) => {
            const row = byLevel[level]
            return (
              <tr key={String(level)}>
                <td>{labelForLevel(level)}</td>
                <td>{row.attempts}</td>
                <td>{row.successes}</td>
                <td>{misses(row)}</td>
                <td>{rateLabel(row)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ReportLevelSideMatrix({
  byLevelSide,
  labelForLevel,
  r,
}: {
  byLevelSide: Record<ManeuverLevel, SidePairStats>
  labelForLevel: (level: ManeuverLevel) => string
  r: ReportCopy
}) {
  const levels = LEVELS.filter(
    (level) =>
      byLevelSide[level].frontside.attempts > 0 || byLevelSide[level].backside.attempts > 0,
  )
  if (levels.length === 0) return null

  return (
    <div className="table-wrap athlete-report__table-wrap">
      <table className="data-table athlete-report__table athlete-report__detail-table athlete-report__matrix-table">
        <thead>
          <tr>
            <th rowSpan={2}>{r.level}</th>
            <th colSpan={4}>{r.frontside}</th>
            <th colSpan={4}>{r.backside}</th>
          </tr>
          <tr>
            <th>{r.attShort}</th>
            <th>{r.made}</th>
            <th>{r.missShort}</th>
            <th>%</th>
            <th>{r.attShort}</th>
            <th>{r.made}</th>
            <th>{r.missShort}</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {levels.map((level) => {
            const fs = byLevelSide[level].frontside
            const bs = byLevelSide[level].backside
            return (
              <tr key={String(level)}>
                <td>{labelForLevel(level)}</td>
                <td>{fs.attempts ? String(fs.attempts) : '—'}</td>
                <td>{fs.attempts ? String(fs.successes) : '—'}</td>
                <td>{fs.attempts ? String(misses(fs)) : '—'}</td>
                <td>{fs.attempts ? rateLabel(fs) : '—'}</td>
                <td>{bs.attempts ? String(bs.attempts) : '—'}</td>
                <td>{bs.attempts ? String(bs.successes) : '—'}</td>
                <td>{bs.attempts ? String(misses(bs)) : '—'}</td>
                <td>{bs.attempts ? rateLabel(bs) : '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ReportComboLevelBlock({ combo, r, t }: { combo: ComboSessionStatsSnapshot; r: ReportCopy; t: (key: string, params?: Record<string, string | number>) => string }) {
  const activeLevels = COMBO_LEVELS.filter((level) => combo.byLevel[level].attempts > 0)
  if (activeLevels.length === 0) return null

  return (
    <>
      <ReportSubheading>{r.byComboLevelMadeMiss}</ReportSubheading>
      <ReportLevelMakeMissTable
        byLevel={combo.byLevel}
        labelForLevel={(level) => comboLevelLabel(level as ComboLevel)}
        r={r}
      />

      <div className="athlete-report__subsection-stack">
        {activeLevels.map((level) => {
          const row = combo.byLevel[level]
          return (
            <div key={String(level)} className="athlete-report__subsection">
              <ReportSubheading>
                {t('analytics.analyticsReport.comboLevelSide', {
                  level: comboLevelLabel(level),
                })}
              </ReportSubheading>
              <ReportSideTable bySide={row.bySide} r={r} />
            </div>
          )
        })}
      </div>

      <ReportSubheading>{r.comboLevelMatrix}</ReportSubheading>
      <ReportLevelSideMatrix
        byLevelSide={Object.fromEntries(
          activeLevels.map((level) => [level, combo.byLevel[level].bySide]),
        ) as Record<ManeuverLevel, SidePairStats>}
        labelForLevel={(level) => comboLevelLabel(level as ComboLevel)}
        r={r}
      />
    </>
  )
}

function ReportPsychologySection({
  psychology,
  r,
  t,
}: {
  psychology: AthletePsychologyAnalytics
  r: ReportCopy
  t: (key: string, params?: Record<string, string | number>) => string
}) {
  if (psychology.checkIns === 0) return null

  const summaryKey =
    psychology.checkIns === 1
      ? 'analytics.analyticsReport.checkInsSummary'
      : 'analytics.analyticsReport.checkInsSummaryPlural'

  return (
    <section className="athlete-report__section">
      <h2>{r.psychologyCheckins}</h2>
      <p className="athlete-report__lead">
        {t(summaryKey, {
          count: psychology.checkIns,
          avg: psychology.averageOverall?.toFixed(1) ?? '—',
          rate: psychology.feedbackRate === null ? '—' : `${psychology.feedbackRate}%`,
        })}
      </p>

      <ReportSubheading>{r.questionAverages}</ReportSubheading>
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

      {psychology.timeline.length > 0 ? (
        <>
          <ReportSubheading>{r.checkInTimeline}</ReportSubheading>
          <div className="table-wrap athlete-report__table-wrap">
            <table className="data-table athlete-report__table athlete-report__detail-table">
              <thead>
                <tr>
                  <th>{r.date}</th>
                  <th>{r.avgScore}</th>
                  <th>{r.note}</th>
                </tr>
              </thead>
              <tbody>
                {psychology.timeline.map(({ feedback, averageScore }) => (
                  <tr key={feedback.id}>
                    <td>{formatSessionDate(feedback.submittedAt)}</td>
                    <td>{averageScore === null ? '—' : `${averageScore.toFixed(1)}/5`}</td>
                    <td>{feedback.writtenNote?.trim() || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  )
}

type Props = {
  analytics: AthletePeriodAnalytics
  general: AthleteGeneralStats
  heatAnalytics: AthleteHeatAnalyticsSummary
  athleteId: string
  psychology?: AthletePsychologyAnalytics | null
}

export function AthleteReportDetailSections({
  analytics,
  general,
  heatAnalytics,
  athleteId,
  psychology,
}: Props) {
  const { t, messages } = useI18n()
  const r = messages.analytics.analyticsReport
  const { technical, combo, sessions } = analytics
  const allTechnicalLogs = collectManeuverLogs(sessions, athleteId)

  return (
    <>
      <section className="athlete-report__section">
        <h2>{r.waveQuality}</h2>
        <div className="table-wrap athlete-report__table-wrap">
          <table className="data-table athlete-report__table athlete-report__detail-table">
            <tbody>
              <tr>
                <th scope="row">{r.totalWaves}</th>
                <td>{general.totalWaves}</td>
              </tr>
              <tr>
                <th scope="row">{r.withPotential}</th>
                <td>
                  {general.withPotential} ({general.withPotentialRate ?? '—'}%)
                </td>
              </tr>
              <tr>
                <th scope="row">{r.withoutPotential}</th>
                <td>
                  {general.withoutPotential} ({general.withoutPotentialRate ?? '—'}%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="athlete-report__section">
        <h2>{r.performanceBreakdown}</h2>
        <div className="table-wrap athlete-report__table-wrap">
          <table className="data-table athlete-report__table athlete-report__detail-table">
            <tbody>
              <tr>
                <th scope="row">{r.combinedAvgLevel}</th>
                <td>{formatAverageLevelValue(general.avgOverallManeuverLevel)}</td>
              </tr>
              <tr>
                <th scope="row">{r.technicalAvgLevel}</th>
                <td>{formatAverageLevelValue(general.avgTechnicalManeuverLevel)}</td>
              </tr>
              <tr>
                <th scope="row">{r.comboAvgLevel}</th>
                <td>{formatAverageLevelValue(general.avgComboLevel)}</td>
              </tr>
              <tr>
                <th scope="row">{r.totalAttempts}</th>
                <td>{general.totalManeuverAttempts}</td>
              </tr>
              <tr>
                <th scope="row">{r.technicalAttempts}</th>
                <td>{general.technicalAttemptCount}</td>
              </tr>
              <tr>
                <th scope="row">{r.comboAttempts}</th>
                <td>{general.comboAttemptCount}</td>
              </tr>
              <tr>
                <th scope="row">{r.starsTechnicalCombo}</th>
                <td>
                  {general.totalStars} ({general.technicalStars} / {general.comboStars})
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {technical ? (
        <section className="athlete-report__section">
          <h2>{r.technicalFullBreakdown}</h2>
          <p className="athlete-report__lead">
            {t('analytics.analyticsReport.technicalLead', {
              rate: technical.overallSuccessRate,
              level: formatAverageLevelValue(technical.averageLevel),
              made: technical.successfulManeuvers,
              total: technical.totalManeuvers,
            })}
          </p>

          <ReportSubheading>{r.allManeuversSide}</ReportSubheading>
          <ReportSideTable bySide={technical.bySide} r={r} />

          <ReportSubheading>{r.allManeuversLevel}</ReportSubheading>
          <ReportLevelMakeMissTable
            byLevel={tallyLevelStats(allTechnicalLogs)}
            labelForLevel={(level) => levelLabelEn(level as ManeuverLevel)}
            r={r}
          />

          <ReportSubheading>{r.allManeuversMatrix}</ReportSubheading>
          <ReportLevelSideMatrix
            byLevelSide={tallyLevelSide(allTechnicalLogs)}
            labelForLevel={levelLabelEn}
            r={r}
          />

          <div className="athlete-report__subsection-stack">
            {TECHNICAL_KINDS.map((kind) => {
              const block = technical.byKind[kind]
              if (block.total === 0) return null
              const kindLogs = collectManeuverLogs(sessions, athleteId, kind)

              return (
                <div key={kind} className="athlete-report__subsection">
                  <ReportSubheading>
                    {t('analytics.analyticsReport.maneuverMade', {
                      maneuver: maneuverLabel(kind),
                      made: block.successes,
                      total: block.total,
                      rate: block.rate,
                    })}
                  </ReportSubheading>
                  <ReportSideTable bySide={block.bySide} caption={r.frontsideVsBackside} r={r} />
                  <ReportSubheading>
                    {t('analytics.analyticsReport.maneuverByLevel', { maneuver: maneuverLabel(kind) })}
                  </ReportSubheading>
                  <ReportLevelMakeMissTable
                    byLevel={block.byLevel}
                    labelForLevel={(level) => levelLabelEn(level as ManeuverLevel)}
                    r={r}
                  />
                  <ReportSubheading>
                    {t('analytics.analyticsReport.maneuverMatrix', { maneuver: maneuverLabel(kind) })}
                  </ReportSubheading>
                  <ReportLevelSideMatrix
                    byLevelSide={tallyLevelSide(kindLogs)}
                    labelForLevel={levelLabelEn}
                    r={r}
                  />
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {combo ? (
        <section className="athlete-report__section">
          <h2>{r.combosFullBreakdown}</h2>
          <p className="athlete-report__lead">
            {t('analytics.analyticsReport.combosLead', {
              rate: combo.overallSuccessRate,
              level: formatAverageLevelValue(combo.averageLevel),
              made: combo.successfulAttempts,
              total: combo.totalAttempts,
            })}
          </p>

          <ReportSubheading>{r.allCombosSide}</ReportSubheading>
          <ReportSideTable bySide={combo.bySide} r={r} />

          <ReportComboLevelBlock combo={combo} r={r} t={t} />
        </section>
      ) : null}

      {psychology ? <ReportPsychologySection psychology={psychology} r={r} t={t} /> : null}

      {heatAnalytics.heatsTotal > 0 ? (
        <section className="athlete-report__section">
          <h2>{r.competitionHeatsRhythm}</h2>
          <p className="athlete-report__lead">
            {t('analytics.analyticsReport.competitionLead', {
              heats: general.heatParticipations,
              wins: general.heatWins,
              score: heatAnalytics.avgHeatScore?.toFixed(2) ?? '—',
            })}
            {general.championshipWins > 0
              ? ` · ${t(
                  general.championshipWins === 1
                    ? 'analytics.analyticsReport.championshipTitle'
                    : 'analytics.analyticsReport.championshipTitles',
                  { count: general.championshipWins },
                )}`
              : ''}
          </p>

          {heatAnalytics.heatsWithTiming > 0 ? (
            <>
              <p className="athlete-report__note">
                {t(
                  heatAnalytics.heatsWithTiming === 1
                    ? 'analytics.analyticsReport.rhythmNote'
                    : 'analytics.analyticsReport.rhythmNotePlural',
                  {
                    score: MAJOR_HEAT_WAVE_SCORE.toFixed(2),
                    count: heatAnalytics.heatsWithTiming,
                  },
                )}
              </p>

              <ReportSubheading>{r.openingEarlyRhythm}</ReportSubheading>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table athlete-report__detail-table">
                  <tbody>
                    <tr>
                      <th scope="row">{r.bestWaveFirst5Avg}</th>
                      <td>{heatAnalytics.avgBestWaveOpening?.toFixed(2) ?? '—'}</td>
                    </tr>
                    <tr>
                      <th scope="row">
                        {t('analytics.analyticsReport.earlyTotalTarget', {
                          target: EARLY_HEAT_TOTAL_TARGET,
                        })}
                      </th>
                      <td>
                        {t('analytics.analyticsReport.earlyTotalAvg', {
                          rate:
                            heatAnalytics.earlyTenPointsRate == null
                              ? '—'
                              : `${heatAnalytics.earlyTenPointsRate}%`,
                          total: heatAnalytics.avgEarlyTotalFirst10Min?.toFixed(2) ?? '—',
                        })}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">{r.timeToFirstWaveAvg}</th>
                      <td>
                        {formatHeatElapsedMinutes(heatAnalytics.avgTimeToFirstWaveMin)} ·{' '}
                        {t(
                          heatAnalytics.heatsWithFirstWave === 1
                            ? 'analytics.analyticsReport.heatCount'
                            : 'analytics.analyticsReport.heatCountPlural',
                          { count: heatAnalytics.heatsWithFirstWave },
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">{r.timeToTwoMajorAvg}</th>
                      <td>
                        {formatHeatElapsedMinutes(heatAnalytics.avgTimeToTwoMajorMin)} ·{' '}
                        {t(
                          heatAnalytics.heatsWithTwoMajor === 1
                            ? 'analytics.analyticsReport.heatCount'
                            : 'analytics.analyticsReport.heatCountPlural',
                          { count: heatAnalytics.heatsWithTwoMajor },
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ReportSubheading>{r.closingUnderPressure}</ReportSubheading>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table athlete-report__detail-table">
                  <tbody>
                    <tr>
                      <th scope="row">{r.bestWaveLast5Avg}</th>
                      <td>{heatAnalytics.avgBestWaveClosing?.toFixed(2) ?? '—'}</td>
                    </tr>
                    <tr>
                      <th scope="row">{r.majorScoreLast5}</th>
                      <td>
                        {heatAnalytics.closingMajorRate == null
                          ? '—'
                          : `${heatAnalytics.closingMajorRate}%`}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">{r.clutchDelta}</th>
                      <td>
                        {heatAnalytics.clutchDelta === null
                          ? '—'
                          : `${heatAnalytics.clutchDelta >= 0 ? '+' : ''}${heatAnalytics.clutchDelta.toFixed(2)}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="athlete-report__note">
              {t(
                heatAnalytics.heatsTotal === 1
                  ? 'analytics.analyticsReport.noTimerData'
                  : 'analytics.analyticsReport.noTimerDataPlural',
                { count: heatAnalytics.heatsTotal },
              )}
            </p>
          )}

          {heatAnalytics.rows.length > 0 ? (
            <>
              <ReportSubheading>{r.heatLog}</ReportSubheading>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table athlete-report__detail-table">
                  <thead>
                    <tr>
                      <th>{r.date}</th>
                      <th>{r.heat}</th>
                      <th>{r.total}</th>
                      <th>{r.firstWave}</th>
                      <th>{r.totalUnder10}</th>
                      <th>
                        {t('analytics.analyticsReport.earlyTargetUnder10', {
                          target: EARLY_HEAT_TOTAL_TARGET,
                        })}
                      </th>
                      <th>{r.twoMajorTime}</th>
                      <th>{r.close5m}</th>
                      <th>{r.place}</th>
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
                          {row.hasTimerData ? row.earlyTotalFirst10Min?.toFixed(2) ?? '—' : '—'}
                        </td>
                        <td>
                          {!row.hasTimerData
                            ? '—'
                            : row.reachedTenPointsInEarlyWindow
                              ? r.yes
                              : r.no}
                        </td>
                        <td>{formatHeatElapsedMinutes(row.timeToTwoMajorMin)}</td>
                        <td>
                          {row.hasTimerData ? row.bestWaveClosing?.toFixed(2) ?? '—' : '—'}
                        </td>
                        <td>
                          #{row.placement}
                          {row.won ? r.winSuffix : ''}
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
    </>
  )
}
