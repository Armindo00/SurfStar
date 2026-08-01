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
import {
  COMBO_LEVEL_LABELS,
  MANEUVER_LABELS,
  type ComboLevel,
  type ManeuverKind,
  type ManeuverLevel,
  type ManeuverLog,
  type TrainingSession,
  type WaveSide,
} from '../types'
import { levelLabelEn } from './ManeuverLevelSuccessChart'

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

function ReportSideTable({ bySide, caption }: { bySide: SidePairStats; caption?: string }) {
  const rows = [
    { label: 'Frontside', stats: bySide.frontside },
    { label: 'Backside', stats: bySide.backside },
  ] as const

  if (rows.every(({ stats }) => stats.attempts === 0)) return null

  return (
    <div className="table-wrap athlete-report__table-wrap">
      {caption ? <p className="athlete-report__table-caption">{caption}</p> : null}
      <table className="data-table athlete-report__table athlete-report__detail-table">
        <thead>
          <tr>
            <th>Side</th>
            <th>Attempts</th>
            <th>Made</th>
            <th>Missed</th>
            <th>Success</th>
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
}: {
  byLevel: Record<number | 'estrela', LevelSuccessStats>
  labelForLevel: (level: number | 'estrela') => string
}) {
  const levels = LEVELS.filter((level) => byLevel[level].attempts > 0)
  if (levels.length === 0) return null

  return (
    <div className="table-wrap athlete-report__table-wrap">
      <table className="data-table athlete-report__table athlete-report__detail-table">
        <thead>
          <tr>
            <th>Level</th>
            <th>Attempts</th>
            <th>Made</th>
            <th>Missed</th>
            <th>Success</th>
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
}: {
  byLevelSide: Record<ManeuverLevel, SidePairStats>
  labelForLevel: (level: ManeuverLevel) => string
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
            <th rowSpan={2}>Level</th>
            <th colSpan={4}>Frontside</th>
            <th colSpan={4}>Backside</th>
          </tr>
          <tr>
            <th>Att.</th>
            <th>Made</th>
            <th>Miss</th>
            <th>%</th>
            <th>Att.</th>
            <th>Made</th>
            <th>Miss</th>
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

function ReportComboLevelBlock({ combo }: { combo: ComboSessionStatsSnapshot }) {
  const activeLevels = COMBO_LEVELS.filter((level) => combo.byLevel[level].attempts > 0)
  if (activeLevels.length === 0) return null

  return (
    <>
      <ReportSubheading>By combo level · made vs missed</ReportSubheading>
      <ReportLevelMakeMissTable
        byLevel={combo.byLevel}
        labelForLevel={(level) => COMBO_LEVEL_LABELS[level as ComboLevel]}
      />

      <div className="athlete-report__subsection-stack">
        {activeLevels.map((level) => {
          const row = combo.byLevel[level]
          return (
            <div key={String(level)} className="athlete-report__subsection">
              <ReportSubheading>{COMBO_LEVEL_LABELS[level]} · frontside vs backside</ReportSubheading>
              <ReportSideTable bySide={row.bySide} />
            </div>
          )
        })}
      </div>

      <ReportSubheading>Combo levels · level × side matrix</ReportSubheading>
      <ReportLevelSideMatrix
        byLevelSide={Object.fromEntries(
          activeLevels.map((level) => [level, combo.byLevel[level].bySide]),
        ) as Record<ManeuverLevel, SidePairStats>}
        labelForLevel={(level) => COMBO_LEVEL_LABELS[level as ComboLevel]}
      />
    </>
  )
}

function ReportPsychologySection({ psychology }: { psychology: AthletePsychologyAnalytics }) {
  if (psychology.checkIns === 0) return null

  return (
    <section className="athlete-report__section">
      <h2>Psychology check-ins</h2>
      <p className="athlete-report__lead">
        {psychology.checkIns} check-in{psychology.checkIns === 1 ? '' : 's'} · avg overall{' '}
        {psychology.averageOverall?.toFixed(1) ?? '—'}/5 · feedback rate{' '}
        {psychology.feedbackRate === null ? '—' : `${psychology.feedbackRate}%`}
      </p>

      <ReportSubheading>Question averages (0–5)</ReportSubheading>
      <div className="table-wrap athlete-report__table-wrap">
        <table className="data-table athlete-report__table athlete-report__detail-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Average</th>
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
          <ReportSubheading>Check-in timeline</ReportSubheading>
          <div className="table-wrap athlete-report__table-wrap">
            <table className="data-table athlete-report__table athlete-report__detail-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Avg score</th>
                  <th>Note</th>
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
  const { technical, combo, sessions } = analytics
  const allTechnicalLogs = collectManeuverLogs(sessions, athleteId)

  return (
    <>
      <section className="athlete-report__section">
        <h2>Wave quality</h2>
        <div className="table-wrap athlete-report__table-wrap">
          <table className="data-table athlete-report__table athlete-report__detail-table">
            <tbody>
              <tr>
                <th scope="row">Total waves</th>
                <td>{general.totalWaves}</td>
              </tr>
              <tr>
                <th scope="row">With potential</th>
                <td>
                  {general.withPotential} ({general.withPotentialRate ?? '—'}%)
                </td>
              </tr>
              <tr>
                <th scope="row">Without potential</th>
                <td>
                  {general.withoutPotential} ({general.withoutPotentialRate ?? '—'}%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="athlete-report__section">
        <h2>Performance breakdown</h2>
        <div className="table-wrap athlete-report__table-wrap">
          <table className="data-table athlete-report__table athlete-report__detail-table">
            <tbody>
              <tr>
                <th scope="row">Combined avg level</th>
                <td>{formatAverageLevelValue(general.avgOverallManeuverLevel)}</td>
              </tr>
              <tr>
                <th scope="row">Technical avg level</th>
                <td>{formatAverageLevelValue(general.avgTechnicalManeuverLevel)}</td>
              </tr>
              <tr>
                <th scope="row">Combo avg level</th>
                <td>{formatAverageLevelValue(general.avgComboLevel)}</td>
              </tr>
              <tr>
                <th scope="row">Total attempts</th>
                <td>{general.totalManeuverAttempts}</td>
              </tr>
              <tr>
                <th scope="row">Technical attempts</th>
                <td>{general.technicalAttemptCount}</td>
              </tr>
              <tr>
                <th scope="row">Combo attempts</th>
                <td>{general.comboAttemptCount}</td>
              </tr>
              <tr>
                <th scope="row">Stars (technical / combo)</th>
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
          <h2>Technical training — full breakdown</h2>
          <p className="athlete-report__lead">
            Overall {technical.overallSuccessRate}% success · avg level{' '}
            {formatAverageLevelValue(technical.averageLevel)} · {technical.successfulManeuvers}/
            {technical.totalManeuvers} maneuvers made
          </p>

          <ReportSubheading>All maneuvers · frontside vs backside</ReportSubheading>
          <ReportSideTable bySide={technical.bySide} />

          <ReportSubheading>All maneuvers · by level (made vs missed)</ReportSubheading>
          <ReportLevelMakeMissTable
            byLevel={tallyLevelStats(allTechnicalLogs)}
            labelForLevel={(level) => levelLabelEn(level as ManeuverLevel)}
          />

          <ReportSubheading>All maneuvers · level × side matrix</ReportSubheading>
          <ReportLevelSideMatrix
            byLevelSide={tallyLevelSide(allTechnicalLogs)}
            labelForLevel={levelLabelEn}
          />

          <div className="athlete-report__subsection-stack">
            {TECHNICAL_KINDS.map((kind) => {
              const block = technical.byKind[kind]
              if (block.total === 0) return null
              const kindLogs = collectManeuverLogs(sessions, athleteId, kind)

              return (
                <div key={kind} className="athlete-report__subsection">
                  <ReportSubheading>
                    {MANEUVER_LABELS[kind]} · {block.successes}/{block.total} made ({block.rate}%)
                  </ReportSubheading>
                  <ReportSideTable bySide={block.bySide} caption="Frontside vs backside" />
                  <ReportSubheading>{MANEUVER_LABELS[kind]} · by level</ReportSubheading>
                  <ReportLevelMakeMissTable
                    byLevel={block.byLevel}
                    labelForLevel={(level) => levelLabelEn(level as ManeuverLevel)}
                  />
                  <ReportSubheading>{MANEUVER_LABELS[kind]} · level × side</ReportSubheading>
                  <ReportLevelSideMatrix
                    byLevelSide={tallyLevelSide(kindLogs)}
                    labelForLevel={levelLabelEn}
                  />
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {combo ? (
        <section className="athlete-report__section">
          <h2>Combos — full breakdown</h2>
          <p className="athlete-report__lead">
            Overall {combo.overallSuccessRate}% success · avg level{' '}
            {formatAverageLevelValue(combo.averageLevel)} · {combo.successfulAttempts}/
            {combo.totalAttempts} attempts made
          </p>

          <ReportSubheading>All combos · frontside vs backside</ReportSubheading>
          <ReportSideTable bySide={combo.bySide} />

          <ReportComboLevelBlock combo={combo} />
        </section>
      ) : null}

      {psychology ? <ReportPsychologySection psychology={psychology} /> : null}

      {heatAnalytics.heatsTotal > 0 ? (
        <section className="athlete-report__section">
          <h2>Competition — heats & rhythm</h2>
          <p className="athlete-report__lead">
            {general.heatParticipations} heats · {general.heatWins} wins · avg score{' '}
            {heatAnalytics.avgHeatScore?.toFixed(2) ?? '—'}
            {general.championshipWins > 0
              ? ` · ${general.championshipWins} championship title${general.championshipWins === 1 ? '' : 's'}`
              : ''}
          </p>

          {heatAnalytics.heatsWithTiming > 0 ? (
            <>
              <p className="athlete-report__note">
                Rhythm metrics use wave timestamps vs heat timer. Major score ={' '}
                {MAJOR_HEAT_WAVE_SCORE.toFixed(2)}+ pts · based on {heatAnalytics.heatsWithTiming}{' '}
                heat{heatAnalytics.heatsWithTiming === 1 ? '' : 's'} with timer data.
              </p>

              <ReportSubheading>Opening & early rhythm</ReportSubheading>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table athlete-report__detail-table">
                  <tbody>
                    <tr>
                      <th scope="row">Best wave · first 5 min (avg)</th>
                      <td>{heatAnalytics.avgBestWaveOpening?.toFixed(2) ?? '—'}</td>
                    </tr>
                    <tr>
                      <th scope="row">{EARLY_HEAT_TOTAL_TARGET}+ pts total · first 10 min</th>
                      <td>
                        {heatAnalytics.earlyTenPointsRate == null
                          ? '—'
                          : `${heatAnalytics.earlyTenPointsRate}%`}
                        {' · avg '}
                        {heatAnalytics.avgEarlyTotalFirst10Min?.toFixed(2) ?? '—'} pts
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Time to 1st wave (avg)</th>
                      <td>
                        {formatHeatElapsedMinutes(heatAnalytics.avgTimeToFirstWaveMin)} ·{' '}
                        {heatAnalytics.heatsWithFirstWave} heat
                        {heatAnalytics.heatsWithFirstWave === 1 ? '' : 's'}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Time to 2 major scores (avg)</th>
                      <td>
                        {formatHeatElapsedMinutes(heatAnalytics.avgTimeToTwoMajorMin)} ·{' '}
                        {heatAnalytics.heatsWithTwoMajor} heat
                        {heatAnalytics.heatsWithTwoMajor === 1 ? '' : 's'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <ReportSubheading>Closing under pressure</ReportSubheading>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table athlete-report__detail-table">
                  <tbody>
                    <tr>
                      <th scope="row">Best wave · last 5 min (avg)</th>
                      <td>{heatAnalytics.avgBestWaveClosing?.toFixed(2) ?? '—'}</td>
                    </tr>
                    <tr>
                      <th scope="row">Major score · last 5 min</th>
                      <td>
                        {heatAnalytics.closingMajorRate == null
                          ? '—'
                          : `${heatAnalytics.closingMajorRate}%`}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Clutch delta (close − open)</th>
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
              {heatAnalytics.heatsTotal} heat{heatAnalytics.heatsTotal === 1 ? '' : 's'} logged, but
              none have timer data for rhythm analysis.
            </p>
          )}

          {heatAnalytics.rows.length > 0 ? (
            <>
              <ReportSubheading>Heat log</ReportSubheading>
              <div className="table-wrap athlete-report__table-wrap">
                <table className="data-table athlete-report__table athlete-report__detail-table">
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
                          {row.hasTimerData ? row.earlyTotalFirst10Min?.toFixed(2) ?? '—' : '—'}
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
                          {row.hasTimerData ? row.bestWaveClosing?.toFixed(2) ?? '—' : '—'}
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
            </>
          ) : null}
        </section>
      ) : null}
    </>
  )
}
