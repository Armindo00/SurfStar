import { computeComboSessionStats, computeSessionStats, LEVELS } from '../sessionStats'
import { computeCustomSessionStats } from '../customTrainingStats'
import { HeatLiveStatsPanel } from '../components/HeatLiveStatsPanel'
import { SideCompareChart } from '../components/SideCompareChart'
import { ManeuverLevelSuccessChart } from '../components/ManeuverLevelSuccessChart'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import {
  isHeatLikeSession,
  liveStatsBackView,
  liveStatsTitle,
  resolveSessionMode,
} from '../sessionModeUtils'
import { COMBO_LEVEL_LABELS, MANEUVER_LABELS, type ManeuverKind } from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
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

  const sessionMode = resolveSessionMode(activeSession)
  const backView = liveStatsBackView(activeSession)
  const athleteName = activeAthleteId ? getAthlete(activeAthleteId)?.name : 'All athletes'

  if (isHeatLikeSession(activeSession)) {
    const title = liveStatsTitle(activeSession)

    return (
      <div className="ss-flow stats-page heat-live-stats-page">
        <ScreenHeader title={title} onBack={() => setView(backView)} />
        <HeatLiveStatsPanel
          session={activeSession}
          getAthleteName={(id) => getAthlete(id)?.name ?? 'Athlete'}
        />
      </div>
    )
  }

  if (sessionMode === 'custom') {
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

  if (sessionMode === 'combos') {
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

  if (sessionMode !== 'tecnico') {
    return (
      <div className="ss-flow stats-page">
        <ScreenHeader title={liveStatsTitle(activeSession)} onBack={() => setView(backView)} />
        <div className="ss-card stats-panel">
          <p className="muted">Live stats are not available for this session type.</p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setView(backView)}>
            Back to session
          </button>
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
