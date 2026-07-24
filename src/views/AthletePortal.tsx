import { useEffect, useMemo, useState } from 'react'
import { SideCompareChart } from '../components/SideCompareChart'
import { useApp } from '../AppContext'
import {
  buildAthleteHeatDetails,
  buildAthleteSessionSummaries,
  computeAthleteComboStats,
  computeAthleteGeneralStats,
  computeAthleteTechnicalStats,
  filterAthleteSessionsForShare,
  filterAthleteSessionsGlobal,
} from '../athleteStats'
import { formatHeatTotal } from '../heatUtils'
import { resolveSessionSpotName } from '../sessionHistoryUtils'
import { LEVELS } from '../sessionStats'
import {
  COMBO_LEVEL_LABELS,
  MANEUVER_LABELS,
  TRAINING_MODE_LABELS,
  type AthleteShareSettings,
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
  const { auth, trainingSessions, athleteLinks, getSpot, logout, respondToPairing, revokePairing, refreshPairingData } =
    useApp()
  const [pairingBusy, setPairingBusy] = useState<string | null>(null)
  const [pairingError, setPairingError] = useState('')

  useEffect(() => {
    void refreshPairingData()
  }, [refreshPairingData])

  useEffect(() => {
    const onFocus = () => {
      void refreshPairingData()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshPairingData])

  const isAthlete = auth?.role === 'atleta'
  const athleteId = isAthlete ? auth.athleteId : ''

  const activeLinks = useMemo(
    () => athleteLinks.filter((l) => l.status === 'active'),
    [athleteLinks],
  )
  const pendingLinks = useMemo(
    () => athleteLinks.filter((l) => l.status === 'pending'),
    [athleteLinks],
  )

  const coachesWithShare = (key: keyof AthleteShareSettings) =>
    new Set(
      activeLinks.filter((l) => l.shareSettings[key]).map((l) => l.coachId),
    )

  const mySessions = useMemo(
    () => (isAthlete ? filterAthleteSessionsGlobal(trainingSessions, athleteId) : []),
    [isAthlete, trainingSessions, athleteId],
  )

  const general = useMemo(
    () => (isAthlete ? computeAthleteGeneralStats(mySessions, athleteId) : null),
    [isAthlete, mySessions, athleteId],
  )

  const technicalSessions = useMemo(
    () =>
      isAthlete
        ? filterAthleteSessionsForShare(trainingSessions, athleteId, coachesWithShare('technicalStats'))
        : [],
    [isAthlete, trainingSessions, athleteId, activeLinks],
  )

  const comboSessions = useMemo(
    () =>
      isAthlete
        ? filterAthleteSessionsForShare(trainingSessions, athleteId, coachesWithShare('comboStats'))
        : [],
    [isAthlete, trainingSessions, athleteId, activeLinks],
  )

  const historySessions = useMemo(
    () =>
      isAthlete
        ? filterAthleteSessionsForShare(trainingSessions, athleteId, coachesWithShare('sessionHistory'))
        : [],
    [isAthlete, trainingSessions, athleteId, activeLinks],
  )

  const heatSessions = useMemo(
    () =>
      isAthlete
        ? filterAthleteSessionsForShare(trainingSessions, athleteId, coachesWithShare('heatDetails'))
        : [],
    [isAthlete, trainingSessions, athleteId, activeLinks],
  )

  const technicalStats = useMemo(
    () => (technicalSessions.length ? computeAthleteTechnicalStats(technicalSessions, athleteId) : null),
    [technicalSessions, athleteId],
  )

  const comboStats = useMemo(
    () => (comboSessions.length ? computeAthleteComboStats(comboSessions, athleteId) : null),
    [comboSessions, athleteId],
  )

  const sessionSummaries = useMemo(
    () => buildAthleteSessionSummaries(historySessions, athleteId),
    [historySessions, athleteId],
  )

  const heatDetails = useMemo(
    () => buildAthleteHeatDetails(heatSessions, athleteId),
    [heatSessions, athleteId],
  )

  const hasSharedContent =
    Boolean(technicalStats) ||
    Boolean(comboStats) ||
    sessionSummaries.length > 0 ||
    heatDetails.length > 0

  const copyCode = async () => {
    if (!isAthlete) return
    try {
      await navigator.clipboard.writeText(auth.pairingCode)
    } catch {
      /* ignore */
    }
  }

  const handlePairingResponse = async (linkId: string, accept: boolean) => {
    setPairingError('')
    setPairingBusy(linkId)
    try {
      const result = await respondToPairing(linkId, accept)
      if (!result.ok) setPairingError(result.error ?? 'Could not update request.')
    } finally {
      setPairingBusy(null)
    }
  }

  const handleLeaveCoach = async (linkId: string) => {
    setPairingError('')
    setPairingBusy(linkId)
    try {
      const result = await revokePairing(linkId)
      if (!result.ok) setPairingError(result.error ?? 'Could not leave coach.')
    } finally {
      setPairingBusy(null)
    }
  }

  if (!isAthlete || !auth) {
    return (
      <div className="ss-card">
        <p className="muted">Sign in as an athlete.</p>
      </div>
    )
  }

  const stats = general ?? {
    totalTrainings: 0,
    totalWaves: 0,
    withPotential: 0,
    withoutPotential: 0,
    withPotentialRate: null,
    withoutPotentialRate: null,
    heatWins: 0,
    heatParticipations: 0,
    avgHeatScore: null,
    totalStars: 0,
    technicalStars: 0,
    comboStars: 0,
  }

  return (
    <div className="dashboard athlete-portal">
      <header className="dashboard__hero">
        <p className="dashboard__hello">Hello,</p>
        <h1 className="dashboard__name">{auth.name}</h1>
        <p className="muted">Your statistics across all linked coaches</p>
      </header>

      <div className="ss-card athlete-portal__section pairing-panel">
        <h2 className="page-title">Your pairing code</h2>
        <p className="muted stats-panel__sub">
          Share this code with any coach. They send a request — you must accept before they can log
          your sessions.
        </p>
        <div className="pairing-code-box">
          <strong className="pairing-code-box__code">{auth.pairingCode || '—'}</strong>
          <button type="button" className="btn btn--ghost btn--small" onClick={copyCode}>
            Copy
          </button>
        </div>

        {pairingError ? <p className="login-error">{pairingError}</p> : null}

        {pendingLinks.length > 0 ? (
          <>
            <h3 className="pairing-panel__title">Coach requests</h3>
            <ul className="pairing-list">
              {pendingLinks.map((link) => (
                <li key={link.id} className="pairing-list__item pairing-list__item--actions">
                  <span>
                    <strong>{link.coachName ?? 'Coach'}</strong>
                    <small>wants to link with you</small>
                  </span>
                  <span className="pairing-list__buttons">
                    <button
                      type="button"
                      className="btn btn--primary btn--small"
                      disabled={pairingBusy === link.id}
                      onClick={() => handlePairingResponse(link.id, true)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      disabled={pairingBusy === link.id}
                      onClick={() => handlePairingResponse(link.id, false)}
                    >
                      Decline
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {activeLinks.length > 0 ? (
          <>
            <h3 className="pairing-panel__title">Linked coaches</h3>
            <ul className="pairing-list">
              {activeLinks.map((link) => (
                <li key={link.id} className="pairing-list__item pairing-list__item--actions">
                  <span>
                    <strong>{link.coachName ?? 'Coach'}</strong>
                    <small>Active</small>
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={pairingBusy === link.id}
                    onClick={() => handleLeaveCoach(link.id)}
                  >
                    Leave
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="muted">No coaches linked yet. Share your code to get started.</p>
        )}
      </div>

      <div className="ss-card athlete-portal__section">
        <h2 className="page-title">General statistics</h2>
        <p className="muted stats-panel__sub">
          Combined from every coach you train with — your progress stays with you.
        </p>

        <div className="kpi-grid athlete-portal__kpi">
          <article className="kpi-card">
            <span className="kpi-card__label">Total waves</span>
            <strong className="kpi-card__value">{stats.totalWaves}</strong>
          </article>
          <article className="kpi-card kpi-card--accent">
            <span className="kpi-card__label">Total trainings</span>
            <strong className="kpi-card__value">{stats.totalTrainings}</strong>
          </article>
          <article className="kpi-card kpi-card--success">
            <span className="kpi-card__label">Heat wins</span>
            <strong className="kpi-card__value">{stats.heatWins}</strong>
            <small className="kpi-card__hint">
              {stats.heatParticipations} heats
            </small>
          </article>
          <article className="kpi-card">
            <span className="kpi-card__label">Avg heat score</span>
            <strong className="kpi-card__value">
              {stats.avgHeatScore !== null ? formatHeatTotal(stats.avgHeatScore) : '—'}
            </strong>
          </article>
          <article className="kpi-card kpi-card--success athlete-potential-kpi">
            <span className="kpi-card__label">Waves with potential</span>
            {stats.withPotentialRate !== null ? (
              <>
                <strong className="kpi-card__value">{stats.withPotentialRate}%</strong>
                <RateBar value={stats.withPotentialRate} />
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
            <strong className="kpi-card__value">{stats.totalStars} ★</strong>
            <small className="kpi-card__hint">
              {stats.technicalStars} technical · {stats.comboStars} combo
            </small>
          </article>
        </div>
      </div>

      {hasSharedContent && (
        <div className="athlete-portal__shared-head">
          <h2 className="page-title">Shared by your coaches</h2>
          <p className="muted">Extra details each coach chose to share from their sessions.</p>
        </div>
      )}

      {technicalStats && (
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

      {comboStats && (
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

      {heatDetails.length > 0 && (
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

      {sessionSummaries.length > 0 && (
        <div className="ss-card athlete-portal__section">
          <h2 className="page-title">Training history</h2>
          <ul className="athlete-history-list">
            {sessionSummaries.map(({ session, headline }) => (
              <li key={session.id}>
                <div>
                  <strong>{TRAINING_MODE_LABELS[session.mode]}</strong>
                  <p className="muted">
                    {resolveSessionSpotName(session, getSpot)} · {session.condition} ·{' '}
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
            Your coaches can share more detailed stats from <strong>Athletes & pairing</strong>.
          </p>
        </div>
      )}

      <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={logout}>
        Sign out
      </button>
    </div>
  )
}
