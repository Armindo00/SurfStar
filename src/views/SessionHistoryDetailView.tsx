import { useMemo } from 'react'
import { HeatResultsTable } from '../components/HeatResultsTable'
import { ManeuverLevelSuccessChart } from '../components/ManeuverLevelSuccessChart'
import { ScreenHeader } from '../components/ScreenHeader'
import { SeaAnalysisStatsPanel } from '../components/SeaAnalysisStatsPanel'
import { SideCompareChart } from '../components/SideCompareChart'
import { useApp } from '../AppContext'
import {
  athleteNamesForSession,
  formatSessionDateTime,
  formatSessionDuration,
  resolveSessionSpotName,
} from '../sessionHistoryUtils'
import { computeComboSessionStats, computeSessionStats, LEVELS } from '../sessionStats'
import { heatIsFinished } from '../heatUtils'
import {
  COMBO_LEVEL_LABELS,
  MANEUVER_LABELS,
  TRAINING_MODE_LABELS,
  type ManeuverKind,
  type TrainingSession,
} from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

function TechnicalStatsBlock({
  session,
  athleteId,
}: {
  session: TrainingSession
  athleteId: string
}) {
  const stats = computeSessionStats(session, athleteId)

  return (
    <>
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
        <SideCompareChart
          title="All maneuvers (R · T · P)"
          overallRate={stats.overallSuccessRate}
          bySide={stats.bySide}
        />
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
        </div>
      ))}
    </>
  )
}

function ComboStatsBlock({
  session,
  athleteId,
}: {
  session: TrainingSession
  athleteId: string
}) {
  const stats = computeComboSessionStats(session, athleteId)

  return (
    <>
      <div className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">Waves</span>
          <strong className="kpi-card__value">{stats.waveStats.totalWaves}</strong>
        </article>
        <article className="kpi-card kpi-card--success">
          <span className="kpi-card__label">Overall success</span>
          <strong className="kpi-card__value">{stats.overallSuccessRate}%</strong>
          <RateBar value={stats.overallSuccessRate} />
        </article>
      </div>

      <div className="ss-card stats-panel">
        <SideCompareChart
          title="All combo levels"
          overallRate={stats.overallSuccessRate}
          bySide={stats.bySide}
        />
      </div>

      <div className="ss-card stats-panel">
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
    </>
  )
}

export function SessionHistoryDetailView() {
  const { historySession, getSpot, getAthlete, closeHistorySession } = useApp()

  const getAthleteName = useMemo(
    () => (id: string) => getAthlete(id)?.name ?? 'Athlete',
    [getAthlete],
  )

  if (!historySession || !historySession.endedAt) {
    return (
      <div className="ss-flow">
        <ScreenHeader title="Session detail" onBack={closeHistorySession} />
        <p className="muted">Session not found.</p>
      </div>
    )
  }

  const spotName = resolveSessionSpotName(historySession, getSpot)
  const finishedHeats = historySession.heats.filter(heatIsFinished)

  return (
    <div className="ss-flow stats-page">
      <ScreenHeader title="Session detail" onBack={closeHistorySession} />

      <div className="ss-card history-detail-hero">
        <span className="history-card__mode">{TRAINING_MODE_LABELS[historySession.mode]}</span>
        <h2 className="page-title">{spotName}</h2>
        <p className="history-detail-hero__meta">
          {formatSessionDateTime(historySession.endedAt)} ·{' '}
          {formatSessionDuration(historySession.startedAt, historySession.endedAt)}
        </p>
        <p className="muted">
          {historySession.condition || 'No condition'} ·{' '}
          {athleteNamesForSession(historySession, getAthlete)}
        </p>
      </div>

      {historySession.coachNotes ? (
        <div className="ss-card history-notes">
          <h3 className="stats-panel__title">Coach notes</h3>
          <p className="history-notes__body">{historySession.coachNotes}</p>
        </div>
      ) : null}

      {historySession.mode === 'tecnico'
        ? historySession.athleteIds.map((athleteId) => (
            <section key={athleteId} className="history-athlete-stats">
              <h2 className="stats-page__meta">
                Athlete: <strong>{getAthleteName(athleteId)}</strong>
              </h2>
              <TechnicalStatsBlock session={historySession} athleteId={athleteId} />
            </section>
          ))
        : null}

      {historySession.mode === 'combos'
        ? historySession.athleteIds.map((athleteId) => (
            <section key={athleteId} className="history-athlete-stats">
              <h2 className="stats-page__meta">
                Athlete: <strong>{getAthleteName(athleteId)}</strong>
              </h2>
              <ComboStatsBlock session={historySession} athleteId={athleteId} />
            </section>
          ))
        : null}

      {historySession.mode === 'heats' || historySession.mode === 'campeonato' ? (
        finishedHeats.length === 0 ? (
          <div className="ss-card">
            <p className="muted">No finished heats in this session.</p>
          </div>
        ) : (
          finishedHeats.map((heat) => (
            <div key={heat.id} className="ss-card stats-panel">
              <h2 className="stats-panel__title">{heat.label}</h2>
              <HeatResultsTable heat={heat} getAthleteName={getAthleteName} />
            </div>
          ))
        )
      ) : null}

      {historySession.mode === 'sea-analysis' && historySession.seaAnalysis ? (
        <div className="ss-card stats-panel">
          <h2 className="stats-panel__title">Sea analysis results</h2>
          <SeaAnalysisStatsPanel state={historySession.seaAnalysis} readOnly />
        </div>
      ) : null}
    </div>
  )
}
