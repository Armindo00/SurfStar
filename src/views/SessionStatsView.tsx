import { computeComboSessionStats, computeSessionStats, LEVELS } from '../sessionStats'
import { computeCustomSessionStats } from '../customTrainingStats'
import { HeatResultsTable } from '../components/HeatResultsTable'
import { SideCompareChart } from '../components/SideCompareChart'
import { ManeuverLevelSuccessChart } from '../components/ManeuverLevelSuccessChart'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import {
  buildHeatLiveSnapshots,
  EARLY_HEAT_TOTAL_TARGET,
} from '../heatAnalyticsStats'
import {
  formatHeatElapsedMinutes,
  formatHeatTotal,
  formatWaveScoreCompact,
  heatIsFinished,
  heatIsRunning,
} from '../heatUtils'
import { COMBO_LEVEL_LABELS, MANEUVER_LABELS, type ManeuverKind } from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

function heatStatusLabel(running: boolean, finished: boolean): string {
  if (running) return 'Running'
  if (finished) return 'Finished'
  return 'Not started'
}

function sessionStatsBackView(mode: string): 'combos' | 'custom' | 'heats' | 'campeonato' | 'training' {
  if (mode === 'combos') return 'combos'
  if (mode === 'custom') return 'custom'
  if (mode === 'heats') return 'heats'
  if (mode === 'campeonato') return 'campeonato'
  return 'training'
}

export function SessionStatsView() {
  const { activeSession, activeAthleteId, setView, getAthlete } = useApp()

  if (!activeSession) {
    return (
      <div className="ss-flow">
        <ScreenHeader title="Statistics" onBack={() => setView('coach-home')} />
        <p className="muted">No active session.</p>
      </div>
    )
  }

  const backView = sessionStatsBackView(activeSession.mode)
  const athleteName = activeAthleteId ? getAthlete(activeAthleteId)?.name : 'All athletes'

  if (activeSession.mode === 'heats' || activeSession.mode === 'campeonato') {
    const snapshots = buildHeatLiveSnapshots(activeSession)
    const title =
      activeSession.mode === 'campeonato' ? 'Live stats · Championship' : 'Live stats · Heat'

    return (
      <div className="ss-flow stats-page">
        <ScreenHeader title={title} onBack={() => setView(backView)} />

        {snapshots.length === 0 ? (
          <div className="ss-card stats-panel">
            <p className="muted">No heats with surfers assigned yet.</p>
          </div>
        ) : (
          snapshots.map(({ heat, athletes }) => {
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
                    const name = getAthlete(athlete.athleteId)?.name ?? 'Athlete'
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
                              <strong>
                                {athlete.timing.earlyTotalFirst10Min?.toFixed(2) ?? '—'}
                              </strong>
                            </li>
                            <li>
                              <span>{EARLY_HEAT_TOTAL_TARGET}+ ≤10m</span>
                              <strong>
                                {athlete.timing.reachedTenPointsInEarlyWindow ? 'Yes' : 'No'}
                              </strong>
                            </li>
                            <li>
                              <span>Best open 5m</span>
                              <strong>
                                {athlete.timing.bestWaveOpening?.toFixed(2) ?? '—'}
                              </strong>
                            </li>
                            <li>
                              <span>Best close 5m</span>
                              <strong>
                                {athlete.timing.bestWaveClosing?.toFixed(2) ?? '—'}
                              </strong>
                            </li>
                          </ul>
                        ) : (
                          <p className="muted heat-live-stats__rhythm-empty">
                            Start the heat timer to unlock rhythm stats for this surfer.
                          </p>
                        )}
                      </article>
                    )
                  })}
                </div>

                {heat.waveScores.length > 0 ? (
                  <HeatResultsTable
                    heat={heat}
                    getAthleteName={(id) => getAthlete(id)?.name ?? 'Athlete'}
                  />
                ) : null}
              </div>
            )
          })
        )}
      </div>
    )
  }

  if (activeSession.mode === 'custom') {
    const stats = computeCustomSessionStats(activeSession, activeAthleteId)
    const templateName = activeSession.customTemplateName ?? 'Custom training'

    return (
      <div className="ss-flow stats-page">
        <ScreenHeader title={`Live stats · ${templateName}`} onBack={() => setView(backView)} />

        <p className="stats-page__meta">
          Athlete: <strong>{athleteName}</strong>
        </p>

        <div className="kpi-grid">
          <article className="kpi-card">
            <span className="kpi-card__label">Attempts</span>
            <strong className="kpi-card__value">{stats.totalAttempts}</strong>
          </article>
          <article className="kpi-card kpi-card--accent">
            <span className="kpi-card__label">Waves</span>
            <strong className="kpi-card__value">{stats.waveStats.totalWaves}</strong>
          </article>
          <article className="kpi-card kpi-card--success">
            <span className="kpi-card__label">Overall success</span>
            <strong className="kpi-card__value">{stats.overallSuccessRate}%</strong>
            <RateBar value={stats.overallSuccessRate} />
          </article>
        </div>

        {stats.byButton.map((button) => (
          <div key={button.buttonId} className="ss-card stats-panel">
            <header className="stats-panel__head">
              <h2 className="stats-panel__title">{button.label}</h2>
              <span className="stats-badge">
                {button.successes}/{button.attempts} · {button.rate}%
              </span>
            </header>
            {Object.values(button.byLevel).some((level) => level.attempts > 0) ? (
              <div className="table-wrap stats-panel__table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Attempts</th>
                      <th>Successes</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(button.byLevel).map((level) => (
                      <tr key={level.levelId}>
                        <td>{level.label}</td>
                        <td>{level.attempts}</td>
                        <td className="data-table__ok">{level.successes}</td>
                        <td>
                          <span className="data-table__rate">{level.rate}%</span>
                          <RateBar value={level.rate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted">No level breakdown yet.</p>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (activeSession.mode === 'combos') {
    const stats = computeComboSessionStats(activeSession, activeAthleteId)

    return (
      <div className="ss-flow stats-page">
        <ScreenHeader title="Live stats · Combos" onBack={() => setView(backView)} />

        <p className="stats-page__meta">
          Athlete: <strong>{athleteName}</strong>
        </p>

        <div className="kpi-grid">
          <article className="kpi-card">
            <span className="kpi-card__label">Waves</span>
            <strong className="kpi-card__value">{stats.waveStats.totalWaves}</strong>
          </article>
          <article className="kpi-card kpi-card--accent">
            <span className="kpi-card__label">With potential</span>
            <strong className="kpi-card__value">{stats.waveStats.withPotential}</strong>
          </article>
          <article className="kpi-card">
            <span className="kpi-card__label">No potential</span>
            <strong className="kpi-card__value">{stats.waveStats.withoutPotential}</strong>
          </article>
          <article className="kpi-card kpi-card--success">
            <span className="kpi-card__label">Overall success</span>
            <strong className="kpi-card__value">{stats.overallSuccessRate}%</strong>
            <RateBar value={stats.overallSuccessRate} />
          </article>
        </div>

        <div className="ss-card stats-panel">
          <h2 className="stats-panel__title">Combos — overview</h2>
          <p className="muted stats-panel__sub">
            {stats.successfulAttempts} successes in {stats.totalAttempts} attempts
          </p>
          <SideCompareChart
            title="All levels"
            overallRate={stats.overallSuccessRate}
            bySide={stats.bySide}
          />
        </div>

        <div className="ss-card stats-panel">
          <header className="stats-panel__head">
            <h2 className="stats-panel__title">By combo level</h2>
            <span className="stats-badge">Frontside vs backside</span>
          </header>
          <div className="side-chart-stack">
            {LEVELS.map((lvl) => {
              const row = stats.byLevel[lvl]
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
        </div>
      </div>
    )
  }

  const stats = computeSessionStats(activeSession, activeAthleteId)

  return (
    <div className="ss-flow stats-page">
      <ScreenHeader title="Live stats · Technical" onBack={() => setView(backView)} />

      <p className="stats-page__meta">
        Athlete: <strong>{athleteName}</strong>
      </p>

      <div className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">Waves</span>
          <strong className="kpi-card__value">{stats.waveStats.totalWaves}</strong>
        </article>
        <article className="kpi-card kpi-card--accent">
          <span className="kpi-card__label">With potential</span>
          <strong className="kpi-card__value">{stats.waveStats.withPotential}</strong>
        </article>
        <article className="kpi-card">
          <span className="kpi-card__label">No potential</span>
          <strong className="kpi-card__value">{stats.waveStats.withoutPotential}</strong>
        </article>
        <article className="kpi-card kpi-card--success">
          <span className="kpi-card__label">Overall success</span>
          <strong className="kpi-card__value">{stats.overallSuccessRate}%</strong>
          <RateBar value={stats.overallSuccessRate} />
        </article>
      </div>

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">Maneuvers — overview</h2>
        <p className="muted stats-panel__sub">
          {stats.successfulManeuvers} successes in {stats.totalManeuvers} attempts
        </p>
        <SideCompareChart
          title="All maneuvers (R · T · P)"
          overallRate={stats.overallSuccessRate}
          bySide={stats.bySide}
        />
      </div>

      <div className="ss-card stats-panel">
        <header className="stats-panel__head">
          <h2 className="stats-panel__title">By maneuver type</h2>
          <span className="stats-badge">Frontside vs backside</span>
        </header>
        <div className="side-chart-stack">
          {KINDS.map((kind) => {
            const block = stats.byKind[kind]
            return (
              <SideCompareChart
                key={kind}
                title={MANEUVER_LABELS[kind]}
                subtitle={`${block.successes}/${block.total} successes overall`}
                overallRate={block.rate}
                bySide={block.bySide}
              />
            )
          })}
        </div>
      </div>

      {KINDS.map((kind) => (
        <div key={kind} className="ss-card stats-panel">
          <header className="stats-panel__head">
            <h2 className="stats-panel__title">{MANEUVER_LABELS[kind]}</h2>
            <span className="stats-badge">
              {stats.byKind[kind].successes}/{stats.byKind[kind].total} · {stats.byKind[kind].rate}%
            </span>
          </header>
          <ManeuverLevelSuccessChart byLevel={stats.byKind[kind].byLevel} />
          <div className="table-wrap stats-panel__table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Attempts</th>
                  <th>Successes</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((lvl) => {
                  const row = stats.byKind[kind].byLevel[lvl]
                  return (
                    <tr key={String(lvl)}>
                      <td>{lvl === 'estrela' ? 'Star ★' : `Level ${lvl}`}</td>
                      <td>{row.attempts}</td>
                      <td className="data-table__ok">{row.successes}</td>
                      <td>
                        <span className="data-table__rate">{row.rate}%</span>
                        <RateBar value={row.rate} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
