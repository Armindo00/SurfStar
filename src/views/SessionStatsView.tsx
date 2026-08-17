import { computeComboSessionStats, computeSessionStats, LEVELS } from '../sessionStats'
import { useI18n } from '../i18n'
import { computeCustomSessionStats } from '../customTrainingStats'
import { CustomButtonStatsList } from '../components/CustomButtonStatsList'
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
import { comboLevelLabel, maneuverLabel } from '../i18n/labels'
import type { ManeuverKind } from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

export function SessionStatsView() {
  const { t } = useI18n()
  const { activeSession, activeAthleteId, setView, getAthlete } = useApp()

  if (!activeSession) {
    return (
      <div className="ss-flow">
        <ScreenHeader title={t('nav.statistics')} onBack={() => setView('coach-home')} />
        <p className="muted">{t('session.noActiveSession')}</p>
      </div>
    )
  }

  const sessionMode = resolveSessionMode(activeSession)
  const backView = liveStatsBackView(activeSession)
  const athleteName = activeAthleteId ? getAthlete(activeAthleteId)?.name : t('ui.session.allAthletes')

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
    const templateName = activeSession.customTemplateName ?? t('ui.session.customTrainingFallback')

    return (
      <div className="ss-flow stats-page">
        <ScreenHeader title={t('session.liveStatsTitles.custom', { templateName })} onBack={() => setView(backView)} />

        <p className="stats-page__meta">
          {t('ui.session.athleteLabel')} <strong>{athleteName}</strong>
        </p>

        <div className="kpi-grid">
          <article className="kpi-card">
            <span className="kpi-card__label">{t('ui.stats.attempts')}</span>
            <strong className="kpi-card__value">{stats.totalAttempts}</strong>
          </article>
          <article className="kpi-card kpi-card--accent">
            <span className="kpi-card__label">{t('ui.stats.waves')}</span>
            <strong className="kpi-card__value">{stats.waveStats.totalWaves}</strong>
          </article>
          <article className="kpi-card kpi-card--success">
            <span className="kpi-card__label">{t('ui.stats.overallSuccess')}</span>
            <strong className="kpi-card__value">{stats.overallSuccessRate}%</strong>
            <RateBar value={stats.overallSuccessRate} />
          </article>
        </div>

        <CustomButtonStatsList buttons={stats.byButton} />
      </div>
    )
  }

  if (sessionMode === 'combos') {
    const stats = computeComboSessionStats(activeSession, activeAthleteId)

    return (
      <div className="ss-flow stats-page">
        <ScreenHeader title={t('session.liveStatsTitles.combos')} onBack={() => setView(backView)} />

        <p className="stats-page__meta">
          {t('ui.session.athleteLabel')} <strong>{athleteName}</strong>
        </p>

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
          <h2 className="stats-panel__title">{t('ui.stats.combosOverview')}</h2>
          <p className="muted stats-panel__sub">
            {t('ui.stats.successesInAttempts', {
              successes: stats.successfulAttempts,
              attempts: stats.totalAttempts,
            })}
          </p>
          <SideCompareChart
            title={t('analytics.allComboLevels')}
            overallRate={stats.overallSuccessRate}
            bySide={stats.bySide}
          />
        </div>

        <div className="ss-card stats-panel">
          <header className="stats-panel__head">
            <h2 className="stats-panel__title">{t('ui.stats.byComboLevel')}</h2>
            <span className="stats-badge">{t('ui.stats.frontsideVsBackside')}</span>
          </header>
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
      </div>
    )
  }

  if (sessionMode !== 'tecnico') {
    return (
      <div className="ss-flow stats-page">
        <ScreenHeader title={liveStatsTitle(activeSession)} onBack={() => setView(backView)} />
        <div className="ss-card stats-panel">
          <p className="muted">{t('ui.stats.liveStatsUnavailable')}</p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => setView(backView)}>
            {t('ui.session.backToSession')}
          </button>
        </div>
      </div>
    )
  }

  const stats = computeSessionStats(activeSession, activeAthleteId)

  return (
    <div className="ss-flow stats-page">
      <ScreenHeader title={t('session.liveStatsTitles.technical')} onBack={() => setView(backView)} />

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
        <h2 className="stats-panel__title">{t('ui.stats.maneuversOverview')}</h2>
          <p className="muted stats-panel__sub">
            {t('ui.stats.successesInAttempts', {
              successes: stats.successfulManeuvers,
              attempts: stats.totalManeuvers,
            })}
          </p>
          <SideCompareChart
            title={t('analytics.allManeuvers')}
          overallRate={stats.overallSuccessRate}
          bySide={stats.bySide}
        />
      </div>

      <div className="ss-card stats-panel">
        <header className="stats-panel__head">
          <h2 className="stats-panel__title">{t('ui.stats.byManeuverType')}</h2>
          <span className="stats-badge">{t('ui.stats.frontsideVsBackside')}</span>
        </header>
        <div className="side-chart-stack">
          {KINDS.map((kind) => {
            const block = stats.byKind[kind]
            return (
              <SideCompareChart
                key={kind}
                title={maneuverLabel(kind)}
                subtitle={t('session.register.successesOverall', {
                  successes: block.successes,
                  total: block.total,
                })}
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
            <h2 className="stats-panel__title">{maneuverLabel(kind)}</h2>
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
                      <td>{lvl === 'estrela' ? t('ui.stats.starLevel') : t('ui.stats.levelN', { level: lvl })}</td>
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
