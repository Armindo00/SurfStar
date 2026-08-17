import { useMemo } from 'react'
import { useI18n } from '../i18n'
import { HeatLiveStatsPanel } from '../components/HeatLiveStatsPanel'
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
import { CustomButtonStatsList } from '../components/CustomButtonStatsList'
import { computeCustomSessionStats } from '../customTrainingStats'
import { isHeatLikeSession } from '../sessionModeUtils'
import { comboLevelLabel, maneuverLabel, trainingModeLabel } from '../i18n/labels'
import type { ManeuverKind, TrainingSession } from '../types'

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
  const { t } = useI18n()
  const stats = computeSessionStats(session, athleteId)

  return (
    <>
      <div className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">{t('ui.stats.waves')}</span>
          <strong className="kpi-card__value">{stats.waveStats.totalWaves}</strong>
        </article>
        <article className="kpi-card kpi-card--accent">
          <span className="kpi-card__label">{t('ui.stats.withPotential')}</span>
          <strong className="kpi-card__value">{stats.waveStats.withPotential}</strong>
        </article>
        <article className="kpi-card">
          <span className="kpi-card__label">{t('ui.stats.noPotential')}</span>
          <strong className="kpi-card__value">{stats.waveStats.withoutPotential}</strong>
        </article>
        <article className="kpi-card kpi-card--success">
          <span className="kpi-card__label">{t('ui.stats.overallSuccess')}</span>
          <strong className="kpi-card__value">{stats.overallSuccessRate}%</strong>
          <RateBar value={stats.overallSuccessRate} />
        </article>
      </div>

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">{t('ui.stats.maneuversOverview')}</h2>
        <SideCompareChart
          title={t('analytics.allManeuvers')}
          overallRate={stats.overallSuccessRate}
          bySide={stats.bySide}
        />
      </div>

      {KINDS.map((kind) => (
        <div key={kind} className="ss-card stats-panel">
          <header className="stats-panel__head">
            <h2 className="stats-panel__title">{maneuverLabel(kind)}</h2>
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
  const { t } = useI18n()
  const stats = computeComboSessionStats(session, athleteId)

  return (
    <>
      <div className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">{t('ui.stats.waves')}</span>
          <strong className="kpi-card__value">{stats.waveStats.totalWaves}</strong>
        </article>
        <article className="kpi-card kpi-card--success">
          <span className="kpi-card__label">{t('ui.stats.overallSuccess')}</span>
          <strong className="kpi-card__value">{stats.overallSuccessRate}%</strong>
          <RateBar value={stats.overallSuccessRate} />
        </article>
      </div>

      <div className="ss-card stats-panel">
        <SideCompareChart
          title={t('analytics.allComboLevels')}
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
      </div>
    </>
  )
}

function CustomStatsBlock({
  session,
  athleteId,
}: {
  session: TrainingSession
  athleteId: string
}) {
  const { t } = useI18n()
  const stats = computeCustomSessionStats(session, athleteId)

  return (
    <>
      <div className="kpi-grid">
        <article className="kpi-card">
          <span className="kpi-card__label">{t('ui.stats.attempts')}</span>
          <strong className="kpi-card__value">{stats.totalAttempts}</strong>
        </article>
        <article className="kpi-card kpi-card--success">
          <span className="kpi-card__label">{t('ui.stats.overallSuccess')}</span>
          <strong className="kpi-card__value">{stats.overallSuccessRate}%</strong>
          <RateBar value={stats.overallSuccessRate} />
        </article>
      </div>

      <CustomButtonStatsList buttons={stats.byButton} />
    </>
  )
}

export function SessionHistoryDetailView() {
  const { t } = useI18n()
  const { historySession, getSpot, getAthlete, closeHistorySession } = useApp()

  const getAthleteName = useMemo(
    () => (id: string) => getAthlete(id)?.name ?? 'Athlete',
    [getAthlete],
  )

  if (!historySession || !historySession.endedAt) {
    return (
      <div className="ss-flow">
        <ScreenHeader title={t('nav.sessionDetail')} onBack={closeHistorySession} />
        <p className="muted">{t('ui.session.sessionNotFound')}</p>
      </div>
    )
  }

  const spotName = resolveSessionSpotName(historySession, getSpot)

  return (
    <div className={`ss-flow stats-page ${isHeatLikeSession(historySession) ? 'heat-live-stats-page' : ''}`}>
      <ScreenHeader title={t('nav.sessionDetail')} onBack={closeHistorySession} />

      <div className="ss-card history-detail-hero">
        <span className="history-card__mode">{trainingModeLabel(historySession.mode)}</span>
        <h2 className="page-title">{spotName}</h2>
        <p className="history-detail-hero__meta">
          {formatSessionDateTime(historySession.endedAt)} ·{' '}
          {formatSessionDuration(historySession.startedAt, historySession.endedAt)}
        </p>
        <p className="muted">
          {historySession.condition || t('session.history.noCondition')} ·{' '}
          {athleteNamesForSession(historySession, getAthlete)}
        </p>
      </div>

      {historySession.coachNotes ? (
        <div className="ss-card history-notes">
          <h3 className="stats-panel__title">{t('ui.stats.coachNotes')}</h3>
          <p className="history-notes__body">{historySession.coachNotes}</p>
        </div>
      ) : null}

      {historySession.mode === 'tecnico'
        ? historySession.athleteIds.map((athleteId) => (
            <section key={athleteId} className="history-athlete-stats">
              <h2 className="stats-page__meta">
                {t('ui.session.athleteLabel')} <strong>{getAthleteName(athleteId)}</strong>
              </h2>
              <TechnicalStatsBlock session={historySession} athleteId={athleteId} />
            </section>
          ))
        : null}

      {historySession.mode === 'combos'
        ? historySession.athleteIds.map((athleteId) => (
            <section key={athleteId} className="history-athlete-stats">
              <h2 className="stats-page__meta">
                {t('ui.session.athleteLabel')} <strong>{getAthleteName(athleteId)}</strong>
              </h2>
              <ComboStatsBlock session={historySession} athleteId={athleteId} />
            </section>
          ))
        : null}

      {historySession.mode === 'custom'
        ? historySession.athleteIds.map((athleteId) => (
            <section key={athleteId} className="history-athlete-stats">
              <h2 className="stats-page__meta">
                {t('ui.session.athleteLabel')} <strong>{getAthleteName(athleteId)}</strong>
                {historySession.customTemplateName ? (
                  <span className="muted"> · {historySession.customTemplateName}</span>
                ) : null}
              </h2>
              <CustomStatsBlock session={historySession} athleteId={athleteId} />
            </section>
          ))
        : null}

      {isHeatLikeSession(historySession) ? (
        <HeatLiveStatsPanel
          session={historySession}
          getAthleteName={getAthleteName}
          finishedOnly
          emptyMessage="No finished heats in this session."
          rhythmEmptyMessage="Heat timer was not started — rhythm stats unavailable."
        />
      ) : null}

      {historySession.mode === 'sea-analysis' && historySession.seaAnalysis ? (
        <div className="ss-card stats-panel">
          <h2 className="stats-panel__title">{t('ui.stats.seaAnalysisResults')}</h2>
          <SeaAnalysisStatsPanel state={historySession.seaAnalysis} readOnly frozenAt={historySession.endedAt} />
        </div>
      ) : null}
    </div>
  )
}
