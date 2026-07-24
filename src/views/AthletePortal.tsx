import { useMemo } from 'react'
import { SideCompareChart } from '../components/SideCompareChart'
import { useApp } from '../AppContext'
import {
  buildAthleteHeatDetails,
  buildAthleteSessionSummaries,
  computeAthleteComboStats,
  computeAthleteGeneralStats,
  computeAthleteTechnicalStats,
  filterAthleteSessions,
} from '../athleteStats'
import { formatHeatTotal } from '../heatUtils'
import { LEVELS } from '../sessionStats'
import {
  COMBO_LEVEL_LABELS,
  DEFAULT_ATHLETE_SHARE_SETTINGS,
  MANEUVER_LABELS,
  TRAINING_MODE_LABELS,
  type ManeuverKind,
} from '../types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AthletePortal() {
  const { auth, trainingSessions, getSpot, getAthlete, logout } = useApp()

  if (auth?.role !== 'atleta') {
    return (
      <div className="ss-card">
        <p className="muted">Sign in as an athlete.</p>
      </div>
    )
  }

  const profile = getAthlete(auth.athleteId)
  const shareSettings = profile?.shareSettings ?? DEFAULT_ATHLETE_SHARE_SETTINGS

  const mySessions = useMemo(
    () => filterAthleteSessions(trainingSessions, auth.coachId, auth.athleteId),
    [trainingSessions, auth.coachId, auth.athleteId],
  )

  const general = useMemo(
    () => computeAthleteGeneralStats(mySessions, auth.athleteId),
    [mySessions, auth.athleteId],
  )

  const technicalStats = useMemo(
    () => (shareSettings.technicalStats ? computeAthleteTechnicalStats(mySessions, auth.athleteId) : null),
    [mySessions, auth.athleteId, shareSettings.technicalStats],
  )

  const comboStats = useMemo(
    () => (shareSettings.comboStats ? computeAthleteComboStats(mySessions, auth.athleteId) : null),
    [mySessions, auth.athleteId, shareSettings.comboStats],
  )

  const sessionSummaries = useMemo(
    () => (shareSettings.sessionHistory ? buildAthleteSessionSummaries(mySessions, auth.athleteId) : []),
    [mySessions, auth.athleteId, shareSettings.sessionHistory],
  )

  const heatDetails = useMemo(
    () => (shareSettings.heatDetails ? buildAthleteHeatDetails(mySessions, auth.athleteId) : []),
    [mySessions, auth.athleteId, shareSettings.heatDetails],
  )

  const hasSharedContent =
    shareSettings.technicalStats ||
    shareSettings.comboStats ||
    shareSettings.sessionHistory ||
    shareSettings.heatDetails

  return (
    <div className="dashboard athlete-portal">
      <header className="dashboard__hero">
        <p className="dashboard__hello">Hello,</p>
        <h1 className="dashboard__name">{auth.name}</h1>
        <p className="muted">Your statistics dashboard</p>
      </header>

      <div className="ss-card athlete-portal__section">
        <h2 className="page-title">General statistics</h2>
        <p className="muted stats-panel__sub">Always visible — your overall progress.</p>

        <div className="kpi-grid athlete-portal__kpi">
          <article className="kpi-card">
            <span className="kpi-card__label">Total waves</span>
            <strong className="kpi-card__value">{general.totalWaves}</strong>
          </article>
          <article className="kpi-card kpi-card--accent">
            <span className="kpi-card__label">Total trainings</span>
            <strong className="kpi-card__value">{general.totalTrainings}</strong>
          </article>
          <article className="kpi-card kpi-card--success">
            <span className="kpi-card__label">Heat wins</span>
            <strong className="kpi-card__value">{general.heatWins}</strong>
            <small className="kpi-card__hint">
              {general.heatParticipations} heats
            </small>
          </article>
          <article className="kpi-card">
            <span className="kpi-card__label">Avg heat score</span>
            <strong className="kpi-card__value">
              {general.avgHeatScore !== null ? formatHeatTotal(general.avgHeatScore) : '—'}
            </strong>
          </article>
          <article className="kpi-card kpi-card--success athlete-potential-kpi">
            <span className="kpi-card__label">Potential vs no potential</span>
            {general.withPotentialRate !== null && general.withoutPotentialRate !== null ? (
              <>
                <strong className="kpi-card__value">
                  {general.withPotentialRate}% / {general.withoutPotentialRate}%
                </strong>
                <div
                  className="athlete-potential-split-bar"
                  role="presentation"
                  aria-hidden="true"
                >
                  <span
                    className="athlete-potential-split-bar__yes"
                    style={{ width: `${general.withPotentialRate}%` }}
                  />
                  <span
                    className="athlete-potential-split-bar__no"
                    style={{ width: `${general.withoutPotentialRate}%` }}
                  />
                </div>
                <small className="kpi-card__hint">
                  With potential · No potential
                </small>
              </>
            ) : (
              <>
                <strong className="kpi-card__value">—</strong>
                <small className="kpi-card__hint">No waves logged yet</small>
              </>
            )}
          </article>
          <article className="kpi-card kpi-card--star">
            <span className="kpi-card__label">Stars landed</span>
            <strong className="kpi-card__value">{general.totalStars} ★</strong>
            <small className="kpi-card__hint">
              {general.technicalStars} technical · {general.comboStars} combo
            </small>
          </article>
        </div>
      </div>

      {hasSharedContent && (
        <div className="athlete-portal__shared-head">
          <h2 className="page-title">Shared by your coach</h2>
          <p className="muted">Extra details your coach chose to share with you.</p>
        </div>
      )}

      {shareSettings.technicalStats && technicalStats && (
        <div className="ss-card stats-panel athlete-portal__section">
          <h2 className="stats-panel__title">Technical training</h2>
          <p className="muted stats-panel__sub">
            {technicalStats.successfulManeuvers} successes in {technicalStats.totalManeuvers} attempts
          </p>

          <div className="kpi-grid athlete-portal__kpi athlete-portal__kpi--compact">
            <article className="kpi-card kpi-card--success">
              <span className="kpi-card__label">Overall success</span>
              <strong className="kpi-card__value">{technicalStats.overallSuccessRate}%</strong>
              <RateBar value={technicalStats.overallSuccessRate} />
            </article>
          </div>

          <SideCompareChart
            title="All maneuvers (R · T · P)"
            overallRate={technicalStats.overallSuccessRate}
            bySide={technicalStats.bySide}
          />

          <div className="side-chart-stack athlete-portal__stack">
            {KINDS.map((kind) => {
              const block = technicalStats.byKind[kind]
              if (block.total === 0) return null
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
      )}

      {shareSettings.comboStats && comboStats && (
        <div className="ss-card stats-panel athlete-portal__section">
          <h2 className="stats-panel__title">Combos</h2>
          <p className="muted stats-panel__sub">
            {comboStats.successfulAttempts} successes in {comboStats.totalAttempts} attempts
          </p>

          <div className="kpi-grid athlete-portal__kpi athlete-portal__kpi--compact">
            <article className="kpi-card kpi-card--success">
              <span className="kpi-card__label">Overall success</span>
              <strong className="kpi-card__value">{comboStats.overallSuccessRate}%</strong>
              <RateBar value={comboStats.overallSuccessRate} />
            </article>
          </div>

          <SideCompareChart
            title="All combo levels"
            overallRate={comboStats.overallSuccessRate}
            bySide={comboStats.bySide}
          />

          <div className="side-chart-stack athlete-portal__stack">
            {LEVELS.map((lvl) => {
              const row = comboStats.byLevel[lvl]
              if (row.attempts === 0) return null
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
      )}

      {shareSettings.heatDetails && heatDetails.length > 0 && (
        <div className="ss-card athlete-portal__section">
          <h2 className="page-title">Heat breakdown</h2>
          <ul className="athlete-history-list">
            {heatDetails.map((heat) => (
              <li key={`${heat.sessionId}-${heat.heatLabel}-${heat.sessionEndedAt}`}>
                <div>
                  <strong>{heat.heatLabel}</strong>
                  <p className="muted">{formatSessionDate(heat.sessionEndedAt)}</p>
                </div>
                <div className="athlete-history-list__meta">
                  <span>{formatHeatTotal(heat.total)}</span>
                  <span className={heat.won ? 'athlete-badge athlete-badge--win' : 'athlete-badge'}>
                    {heat.won ? 'Win' : `#${heat.placement}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {shareSettings.sessionHistory && sessionSummaries.length > 0 && (
        <div className="ss-card athlete-portal__section">
          <h2 className="page-title">Training history</h2>
          <ul className="athlete-history-list">
            {sessionSummaries.map(({ session, headline }) => (
              <li key={session.id}>
                <div>
                  <strong>{TRAINING_MODE_LABELS[session.mode]}</strong>
                  <p className="muted">
                    {getSpot(session.spotId)?.name ?? 'Spot'} · {session.condition} ·{' '}
                    {formatSessionDate(session.endedAt ?? session.startedAt)}
                  </p>
                </div>
                <div className="athlete-history-list__meta">
                  <span>{headline}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mySessions.length === 0 && (
        <div className="ss-card">
          <p className="muted">No completed sessions visible for you yet.</p>
        </div>
      )}

      {mySessions.length > 0 && !hasSharedContent && (
        <div className="ss-card athlete-portal__hint">
          <p className="muted">
            Your coach can share more detailed stats from <strong>Athletes & logins</strong>.
          </p>
        </div>
      )}

      <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={logout}>
        Sign out
      </button>
    </div>
  )
}
