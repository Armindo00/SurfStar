import { HeatResultsTable } from './HeatResultsTable'
import { buildHeatLiveSnapshots, EARLY_HEAT_TOTAL_TARGET } from '../heatAnalyticsStats'
import {
  formatHeatElapsedMinutes,
  formatHeatTotal,
  formatWaveScoreCompact,
  heatIsFinished,
  heatIsRunning,
} from '../heatUtils'
import type { TrainingSession } from '../types'

function heatStatusLabel(running: boolean, finished: boolean): string {
  if (running) return 'Running'
  if (finished) return 'Finished'
  return 'Not started'
}

type Props = {
  session: TrainingSession
  getAthleteName: (id: string) => string
  /** When true, only show heats that ended (for session history). */
  finishedOnly?: boolean
  emptyMessage?: string
  rhythmEmptyMessage?: string
}

export function HeatLiveStatsPanel({
  session,
  getAthleteName,
  finishedOnly = false,
  emptyMessage = 'No heats with surfers assigned yet.',
  rhythmEmptyMessage = 'Start the heat timer to unlock rhythm stats for this surfer.',
}: Props) {
  const snapshots = buildHeatLiveSnapshots(session).filter(
    ({ heat }) => !finishedOnly || heatIsFinished(heat),
  )

  if (snapshots.length === 0) {
    return (
      <div className="ss-card stats-panel">
        <p className="muted">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      {snapshots.map(({ heat, athletes }) => {
        const running = heatIsRunning(heat)
        const finished = heatIsFinished(heat)

        return (
          <div key={heat.id} className="ss-card stats-panel heat-live-stats">
            <header className="stats-panel__head">
              <div>
                <h2 className="stats-panel__title">{heat.label}</h2>
                <p className="muted stats-panel__sub">
                  {heat.durationMinutes} min · {heatStatusLabel(running, finished)}
                </p>
              </div>
              <span className="stats-badge">{athletes.length} surfers</span>
            </header>

            <div className="heat-live-stats__leaderboard">
              {athletes.map((athlete) => {
                const name = getAthleteName(athlete.athleteId)
                return (
                  <article
                    key={athlete.athleteId}
                    className={`heat-live-stats__athlete ${athlete.placement === 1 ? 'heat-live-stats__athlete--lead' : ''}`}
                  >
                    <header className="heat-live-stats__athlete-head">
                      <div>
                        <span className="heat-live-stats__place">#{athlete.placement}</span>
                        <strong>{name}</strong>
                      </div>
                      <strong className="heat-live-stats__total">{formatHeatTotal(athlete.total)}</strong>
                    </header>

                    <div className="kpi-grid heat-live-stats__kpis">
                      <article className="kpi-card kpi-card--compact">
                        <span className="kpi-card__label">Waves</span>
                        <strong className="kpi-card__value">{athlete.waveCount}</strong>
                      </article>
                      <article className="kpi-card kpi-card--compact">
                        <span className="kpi-card__label">Best wave</span>
                        <strong className="kpi-card__value">
                          {athlete.bestWave === null ? '—' : formatWaveScoreCompact(athlete.bestWave)}
                        </strong>
                      </article>
                      <article className="kpi-card kpi-card--compact kpi-card--accent">
                        <span className="kpi-card__label">Counting</span>
                        <strong className="kpi-card__value heat-live-stats__counting">
                          {athlete.countingScores.length === 0
                            ? '—'
                            : athlete.countingScores
                                .map((score) => formatWaveScoreCompact(score))
                                .join(' + ')}
                        </strong>
                      </article>
                    </div>

                    {athlete.timing.hasTimerData ? (
                      <ul className="heat-live-stats__rhythm">
                        <li>
                          <span>1st wave</span>
                          <strong>{formatHeatElapsedMinutes(athlete.timing.timeToFirstWaveMin)}</strong>
                        </li>
                        <li>
                          <span>Total ≤10m</span>
                          <strong>{athlete.timing.earlyTotalFirst10Min?.toFixed(2) ?? '—'}</strong>
                        </li>
                        <li>
                          <span>{EARLY_HEAT_TOTAL_TARGET}+ ≤10m</span>
                          <strong>
                            {athlete.timing.reachedTenPointsInEarlyWindow ? 'Yes' : 'No'}
                          </strong>
                        </li>
                        <li>
                          <span>Best open 5m</span>
                          <strong>{athlete.timing.bestWaveOpening?.toFixed(2) ?? '—'}</strong>
                        </li>
                        <li>
                          <span>Best close 5m</span>
                          <strong>{athlete.timing.bestWaveClosing?.toFixed(2) ?? '—'}</strong>
                        </li>
                      </ul>
                    ) : (
                      <p className="muted heat-live-stats__rhythm-empty">{rhythmEmptyMessage}</p>
                    )}
                  </article>
                )
              })}
            </div>

            {heat.waveScores.length > 0 ? (
              <HeatResultsTable heat={heat} getAthleteName={getAthleteName} />
            ) : null}
          </div>
        )
      })}
    </>
  )
}
