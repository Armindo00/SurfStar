import { useEffect, useMemo, useState } from 'react'
import { NavBadge } from '../components/NavBadge'
import { DeleteAccountPanel } from '../components/DeleteAccountPanel'
import { LanguagePicker } from '../components/LanguagePicker'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import { UNSEEN } from '../unseenDomains'
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
    markSeen,
    countUnseen,
  } = useApp()
  const { t, messages } = useI18n()
  const A = messages.athlete
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
    return (coachId: string) => map.get(coachId) ?? t('roles.coach')
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

  const equipmentReviewItems = useMemo(
    () => equipmentEvaluations.filter((item) => item.athleteId === athleteId),
    [equipmentEvaluations, athleteId],
  )

  const heatItems = useMemo(
    () => heatDetails.map((heat) => ({ id: `${heat.sessionId}:${heat.heatLabel}` })),
    [heatDetails],
  )

  const sessionHistoryItems = useMemo(
    () => sessionSummaries.map((row) => ({ id: row.session.id })),
    [sessionSummaries],
  )

  const unseenEquipmentReviews = countUnseen(UNSEEN.athleteEquipmentReviews, equipmentReviewItems)
  const unseenPairing = countUnseen(
    UNSEEN.athletePairing,
    pendingLinks.map((link) => ({ id: link.id })),
  )
  const unseenCheckins = countUnseen(
    UNSEEN.athleteCheckins,
    pendingSessionFeedback.map((session) => ({ id: session.id })),
  )
  const unseenTrainingHistory = countUnseen(UNSEEN.athleteTrainingHistory, sessionHistoryItems)
  const unseenHeats = countUnseen(UNSEEN.athleteHeats, heatItems)

  const sharingCoachCount = activeLinks.filter((link) =>
    Object.values(link.shareSettings).some(Boolean),
  ).length

  const dashboardActions: DashboardAction[] = [
    {
      id: 'material',
      label: A.actions.equipmentManagement.label,
      description: A.actions.equipmentManagement.description ?? '',
      icon: '⇄',
    },
    {
      id: 'equipment-reviews',
      label: A.actions.equipmentReviews.label,
      description:
        unseenEquipmentReviews > 0
          ? t(
              unseenEquipmentReviews === 1
                ? 'athlete.actions.equipmentReviews.descriptionNew'
                : 'athlete.actions.equipmentReviews.descriptionNewPlural',
              { count: unseenEquipmentReviews },
            )
          : equipmentReviewItems.length > 0
            ? t(
                equipmentReviewItems.length === 1
                  ? 'athlete.actions.equipmentReviews.descriptionCount'
                  : 'athlete.actions.equipmentReviews.descriptionCountPlural',
                { count: equipmentReviewItems.length },
              )
            : A.actions.equipmentReviews.descriptionDefault ?? '',
      icon: '★',
      badge: unseenEquipmentReviews || undefined,
    },
    {
      id: 'coaches',
      label: A.actions.linkedCoaches.label,
      description:
        unseenPairing > 0
          ? t(
              unseenPairing === 1
                ? 'athlete.actions.linkedCoaches.descriptionNew'
                : 'athlete.actions.linkedCoaches.descriptionNewPlural',
              { count: unseenPairing },
            )
          : A.actions.linkedCoaches.descriptionDefault ?? '',
      icon: '◉',
      badge: unseenPairing || undefined,
    },
    {
      id: 'shared-stats',
      label: A.actions.sharedStatistics.label,
      description:
        sharingCoachCount > 0
          ? t(
              sharingCoachCount === 1
                ? 'athlete.actions.sharedStatistics.descriptionSharing'
                : 'athlete.actions.sharedStatistics.descriptionSharingPlural',
              { count: sharingCoachCount },
            )
          : A.actions.sharedStatistics.descriptionDefault ?? '',
      icon: '▤',
    },
    {
      id: 'checkins',
      label: A.actions.mentalCheckins.label,
      description:
        unseenCheckins > 0
          ? t(
              unseenCheckins === 1
                ? 'athlete.actions.mentalCheckins.descriptionWaiting'
                : 'athlete.actions.mentalCheckins.descriptionWaitingPlural',
              { count: unseenCheckins },
            )
          : A.actions.mentalCheckins.descriptionDefault ?? '',
      icon: '◎',
      badge: unseenCheckins || undefined,
    },
    {
      id: 'evolution',
      label: A.actions.evolution.label,
      description: A.actions.evolution.description ?? '',
      icon: '↗',
    },
    {
      id: 'heats',
      label: A.actions.heatHistory.label,
      description:
        unseenHeats > 0
          ? t(
              unseenHeats === 1
                ? 'athlete.actions.heatHistory.descriptionNew'
                : 'athlete.actions.heatHistory.descriptionNewPlural',
              { count: unseenHeats },
            )
          : heatDetails.length > 0
            ? t('athlete.actions.heatHistory.descriptionCount', { count: heatDetails.length })
            : A.actions.heatHistory.descriptionDefault ?? '',
      icon: '★',
      badge: unseenHeats || undefined,
    },
    {
      id: 'training-history',
      label: A.actions.trainingHistory.label,
      description:
        unseenTrainingHistory > 0
          ? t(
              unseenTrainingHistory === 1
                ? 'athlete.actions.trainingHistory.descriptionNew'
                : 'athlete.actions.trainingHistory.descriptionNewPlural',
              { count: unseenTrainingHistory },
            )
          : sessionSummaries.length > 0
            ? t('athlete.actions.trainingHistory.descriptionCount', { count: sessionSummaries.length })
            : A.actions.trainingHistory.descriptionDefault ?? '',
      icon: '☰',
      badge: unseenTrainingHistory || undefined,
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
      if (!result.ok) setPairingError(result.error ?? t('errors.updateRequestFailed'))
      else markSeen(UNSEEN.athletePairing, [linkId])
    } finally {
      setPairingBusy(null)
    }
  }

  const handleLeaveCoach = async (linkId: string) => {
    setPairingError('')
    setPairingBusy(linkId)
    try {
      const result = await revokePairing(linkId)
      if (!result.ok) setPairingError(result.error ?? t('errors.leaveCoachFailed'))
    } finally {
      setPairingBusy(null)
    }
  }

  const markActionSeen = (id: DashboardAction['id']) => {
    switch (id) {
      case 'equipment-reviews':
        markSeen(
          UNSEEN.athleteEquipmentReviews,
          equipmentReviewItems.map((item) => item.id),
        )
        break
      case 'coaches':
        markSeen(
          UNSEEN.athletePairing,
          pendingLinks.map((link) => link.id),
        )
        break
      case 'checkins':
        markSeen(
          UNSEEN.athleteCheckins,
          pendingSessionFeedback.map((session) => session.id),
        )
        break
      case 'training-history':
        markSeen(
          UNSEEN.athleteTrainingHistory,
          sessionHistoryItems.map((item) => item.id),
        )
        break
      case 'heats':
        markSeen(
          UNSEEN.athleteHeats,
          heatItems.map((item) => item.id),
        )
        break
      default:
        break
    }
  }

  const handleAction = (id: DashboardAction['id']) => {
    markActionSeen(id)
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
        <p className="muted">{A.signInRequired}</p>
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
        <p className="dashboard__hello">{A.hello}</p>
        <h1 className="dashboard__name">{auth.name}</h1>
        <p className="muted">{A.dashboardSubtitle}</p>
      </header>

      <div className="ss-card athlete-portal__section athlete-portal__general">
        <h2 className="page-title">{t('athlete.generalStatistics')}</h2>
        <p className="muted stats-panel__sub">{A.generalStatisticsSub}</p>

        <div className="kpi-grid athlete-portal__kpi">
          <article className="kpi-card">
            <span className="kpi-card__label">{A.totalWaves}</span>
            <strong className="kpi-card__value">{stats.totalWaves}</strong>
          </article>
          <article className="kpi-card kpi-card--accent">
            <span className="kpi-card__label">{A.totalTrainings}</span>
            <strong className="kpi-card__value">{stats.totalTrainings}</strong>
          </article>
          <article className="kpi-card kpi-card--success">
            <span className="kpi-card__label">{A.heatWins}</span>
            <strong className="kpi-card__value">{stats.heatWins}</strong>
            <small className="kpi-card__hint">{t('athlete.heats', { count: stats.heatParticipations })}</small>
          </article>
          <article className="kpi-card kpi-card--success">
            <span className="kpi-card__label">{A.championshipWins}</span>
            <strong className="kpi-card__value">{stats.championshipWins}</strong>
            <small className="kpi-card__hint">
              {stats.championshipWins === 1 ? A.titleWon : A.titlesWon}
            </small>
          </article>
          <article className="kpi-card">
            <span className="kpi-card__label">{A.avgHeatScore}</span>
            <strong className="kpi-card__value">
              {stats.avgHeatScore !== null ? formatHeatTotal(stats.avgHeatScore) : '—'}
            </strong>
          </article>
          <article className="kpi-card kpi-card--success athlete-potential-kpi">
            <span className="kpi-card__label">{A.wavesWithPotential}</span>
            {stats.withPotentialRate !== null ? (
              <>
                <strong className="kpi-card__value">{stats.withPotentialRate}%</strong>
                <RateBar value={stats.withPotentialRate} />
              </>
            ) : (
              <>
                <strong className="kpi-card__value">—</strong>
                <small className="kpi-card__hint">{A.noWavesLogged}</small>
              </>
            )}
          </article>
          <article className="kpi-card kpi-card--accent">
            <span className="kpi-card__label">{A.avgLevelCombined}</span>
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
            <span className="kpi-card__label">{A.starsLanded}</span>
            <strong className="kpi-card__value">{stats.totalStars} ★</strong>
            <small className="kpi-card__hint">
              {t('athlete.starsBreakdown', {
                technical: stats.technicalStars,
                combo: stats.comboStars,
              })}
            </small>
          </article>
        </div>
      </div>

      <nav className="action-list athlete-portal__nav" aria-label={A.dashboardNavLabel}>
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
              <NavBadge count={action.badge} className="athlete-portal__nav-badge" />
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
          <p className="muted">{A.noSessionsHint}</p>
        </div>
      ) : null}

      {mySessions.length > 0 && !hasEvolutionData && sharingCoachCount === 0 ? (
        <div className="ss-card athlete-portal__hint">
          <p className="muted">{A.shareMoreHint}</p>
        </div>
      ) : null}

      <button type="button" className="btn btn--outline btn--block" onClick={() => setView('help')}>
        {A.helpAndInstall}
      </button>

      <button type="button" className="btn btn--outline btn--block" onClick={openContact}>
        {A.contactSurfStar}
      </button>

      <div className="ss-card stats-panel">
        <LanguagePicker />
      </div>

      <DeleteAccountPanel roleLabel="athlete" />

      <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={logout}>
        {A.signOut}
      </button>
    </div>
  )
}
