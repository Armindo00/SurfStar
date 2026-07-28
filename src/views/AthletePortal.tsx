import { useEffect, useMemo, useState } from 'react'
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
import {
  averageLevelHint,
  averageLevelTrendLabel,
  formatAverageLevelValue,
  formatCombinedLevelSummary,
} from '../sessionStats'
import { buildAthleteEvolution } from '../teamAnalyticsStats'
import type { AthleteShareSettings } from '../types'
import { AthletePortalSheetView } from './athlete-portal/AthletePortalSheets'
import type { AthletePortalSheet } from './athlete-portal/types'

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

type DashboardAction = {
  id: AthletePortalSheet | 'material' | 'equipment-reviews'
  label: string
  description: string
  icon: string
  badge?: number
}

export function AthletePortal() {
  const {
    auth,
    trainingSessions,
    athleteLinks,
    sessionAthleteFeedback,
    getSpot,
    logout,
    respondToPairing,
    revokePairing,
    refreshPairingData,
    setView,
    pendingSessionFeedback,
    equipmentEvaluations,
    openContact,
    refreshAthleteEquipment,
  } = useApp()
  const [pairingBusy, setPairingBusy] = useState<string | null>(null)
  const [pairingError, setPairingError] = useState('')
  const [sheet, setSheet] = useState<AthletePortalSheet | null>(null)

  useEffect(() => {
    void refreshPairingData()
  }, [refreshPairingData])

  useEffect(() => {
    if (auth?.role === 'atleta') void refreshAthleteEquipment(auth.athleteId)
  }, [auth, refreshAthleteEquipment])

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

  const coachName = useMemo(() => {
    const map = new Map<string, string>()
    for (const link of athleteLinks) {
      if (link.coachName) map.set(link.coachId, link.coachName)
    }
    return (coachId: string) => map.get(coachId) ?? 'Coach'
  }, [athleteLinks])

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

  const evolutionPreview = useMemo(
    () => (isAthlete ? buildAthleteEvolution(mySessions, athleteId, '6m') : []),
    [isAthlete, mySessions, athleteId],
  )

  const hasEvolutionData = evolutionPreview.some(
    (point) => point.avgManeuverLevel !== null || point.successRate !== null,
  )

  const pendingCheckins = pendingSessionFeedback.length

  const equipmentReviewCount = useMemo(
    () => equipmentEvaluations.filter((item) => item.athleteId === athleteId).length,
    [equipmentEvaluations, athleteId],
  )

  const sharingCoachCount = activeLinks.filter((link) =>
    Object.values(link.shareSettings).some(Boolean),
  ).length

  const dashboardActions: DashboardAction[] = [
    {
      id: 'material',
      label: 'Equipment management',
      description: 'Boards, fins and setup',
      icon: '⇄',
    },
    {
      id: 'equipment-reviews',
      label: 'Coach equipment reviews',
      description:
        equipmentReviewCount > 0
          ? `${equipmentReviewCount} review${equipmentReviewCount === 1 ? '' : 's'} from your coaches`
          : 'Ratings and comments on your gear',
      icon: '★',
      badge: equipmentReviewCount || undefined,
    },
    {
      id: 'coaches',
      label: 'Linked coaches',
      description: 'Pairing code and requests',
      icon: '◉',
      badge: pendingLinks.length || undefined,
    },
    {
      id: 'shared-stats',
      label: 'Shared statistics',
      description:
        sharingCoachCount > 0
          ? `${sharingCoachCount} coach${sharingCoachCount === 1 ? '' : 'es'} sharing data`
          : 'Details shared by your coaches',
      icon: '▤',
    },
    {
      id: 'checkins',
      label: 'Mental check-ins',
      description: 'Complete after each session',
      icon: '◎',
      badge: pendingCheckins || undefined,
    },
    {
      id: 'evolution',
      label: 'Evolution chart',
      description: '6 months · 1 month · 1 week',
      icon: '↗',
    },
    {
      id: 'heats',
      label: 'Heat history',
      description: heatDetails.length > 0 ? `${heatDetails.length} heats` : 'Competition results',
      icon: '★',
    },
    {
      id: 'training-history',
      label: 'Training history',
      description:
        sessionSummaries.length > 0
          ? `${sessionSummaries.length} sessions`
          : 'Training sessions shared by your coaches',
      icon: '☰',
    },
  ]

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

  const handleAction = (id: DashboardAction['id']) => {
    if (id === 'material') {
      setView('athlete-material')
      return
    }
    if (id === 'equipment-reviews') {
      setView('athlete-equipment-reviews')
      return
    }
    setSheet(id)
  }

  if (!isAthlete || !auth) {
    return (
      <div className="ss-card">
        <p className="muted">Sign in as an athlete.</p>
      </div>
    )
  }

  if (sheet) {
    return (
      <>
        <AthletePortalSheetView
          sheet={sheet}
          onClose={() => setSheet(null)}
          auth={{ name: auth.name, pairingCode: auth.pairingCode }}
          activeLinks={activeLinks}
          pendingLinks={pendingLinks}
          pairingError={pairingError}
          pairingBusy={pairingBusy}
          onCopyCode={copyCode}
          onPairingResponse={handlePairingResponse}
          onLeaveCoach={handleLeaveCoach}
          mySessions={mySessions}
          athleteId={athleteId}
          technicalStats={technicalStats}
          comboStats={comboStats}
          sessionSummaries={sessionSummaries}
          heatDetails={heatDetails}
          sessionAthleteFeedback={sessionAthleteFeedback}
          pendingCheckins={pendingCheckins}
          pendingSessions={pendingSessionFeedback}
          getSpot={getSpot}
          coachName={coachName}
        />
      </>
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
    championshipWins: 0,
    avgHeatScore: null,
    totalStars: 0,
    technicalStars: 0,
    comboStars: 0,
    avgTechnicalManeuverLevel: null,
    avgComboLevel: null,
    avgOverallManeuverLevel: null,
    totalManeuverAttempts: 0,
    technicalAttemptCount: 0,
    comboAttemptCount: 0,
  }

  return (
    <div className="dashboard athlete-portal">
      <header className="dashboard__hero">
        <p className="dashboard__hello">Hello,</p>
        <h1 className="dashboard__name">{auth.name}</h1>
        <p className="muted">Your statistics across all linked coaches</p>
      </header>

      <div className="ss-card athlete-portal__section athlete-portal__general">
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
            <small className="kpi-card__hint">{stats.heatParticipations} heats</small>
          </article>
          <article className="kpi-card kpi-card--success">
            <span className="kpi-card__label">Championship wins</span>
            <strong className="kpi-card__value">{stats.championshipWins}</strong>
            <small className="kpi-card__hint">
              {stats.championshipWins === 1 ? 'title won' : 'titles won'}
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
          <article className="kpi-card kpi-card--accent">
            <span className="kpi-card__label">Avg level · technical + combos</span>
            <strong className="kpi-card__value">
              {formatAverageLevelValue(stats.avgOverallManeuverLevel)}
            </strong>
            <small className="kpi-card__hint">{formatCombinedLevelSummary(stats)}</small>
            {stats.avgOverallManeuverLevel !== null ? (
              <small className="kpi-card__hint">
                {averageLevelHint(stats.avgOverallManeuverLevel)} ·{' '}
                {averageLevelTrendLabel(stats.avgOverallManeuverLevel)}
              </small>
            ) : (
              <small className="kpi-card__hint">{averageLevelHint(null)}</small>
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

      <nav className="action-list athlete-portal__nav" aria-label="Athlete dashboard sections">
        {dashboardActions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="action-list__item athlete-portal__nav-item"
            onClick={() => handleAction(action.id)}
          >
            <span className="athlete-portal__nav-main">
              <span className="athlete-portal__nav-icon" aria-hidden="true">
                {action.icon}
              </span>
              <span>
                <strong>{action.label}</strong>
                <small>{action.description}</small>
              </span>
            </span>
            {action.badge ? (
              <span className="athlete-portal__nav-badge">{action.badge}</span>
            ) : (
              <span className="athlete-portal__nav-chevron" aria-hidden="true">
                ›
              </span>
            )}
          </button>
        ))}
      </nav>

      {mySessions.length === 0 ? (
        <div className="ss-card athlete-portal__hint">
          <p className="muted">No completed sessions visible for you yet. Share your pairing code with a coach.</p>
        </div>
      ) : null}

      {mySessions.length > 0 && !hasEvolutionData && sharingCoachCount === 0 ? (
        <div className="ss-card athlete-portal__hint">
          <p className="muted">
            Your coaches can share more detailed stats from <strong>Athletes & pairing</strong>.
          </p>
        </div>
      ) : null}

      <button type="button" className="btn btn--outline btn--block" onClick={() => setView('help')}>
        Help & install guide
      </button>

      <button type="button" className="btn btn--outline btn--block" onClick={openContact}>
        Contact SurfStar
      </button>

      <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={logout}>
        Sign out
      </button>
    </div>
  )
}
