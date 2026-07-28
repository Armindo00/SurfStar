import { useMemo, useState } from 'react'
import { useApp } from '../../AppContext'
import { EvolutionLineChart } from '../../components/EvolutionLineChart'
import { ScreenHeader } from '../../components/ScreenHeader'
import { SideCompareChart } from '../../components/SideCompareChart'
import type { AthleteHeatDetail } from '../../athleteStats'
import { feedbackHasPsychologySurvey } from '../../athletePsychologyStats'
import {
  averagePsychologyScore,
  PSYCHOLOGY_SURVEY_QUESTIONS,
} from '../../psychologySurvey'
import { coachIdsWithPsychologyCheckins } from '../../psychologyCheckins'
import { formatHeatTotal } from '../../heatUtils'
import {
  formatSessionDate,
  formatSessionDateTime,
  resolveSessionSpotName,
} from '../../sessionHistoryUtils'
import { LEVELS, type ComboSessionStatsSnapshot, type SessionStatsSnapshot } from '../../sessionStats'
import {
  ANALYTICS_PERIOD_OPTIONS,
  analyticsPeriodLabel,
  buildAthleteEvolution,
  type AnalyticsPeriod,
} from '../../teamAnalyticsStats'
import {
  COMBO_LEVEL_LABELS,
  MANEUVER_LABELS,
  TRAINING_MODE_LABELS,
  type CoachAthleteLink,
  type ManeuverKind,
  type SessionAthleteFeedback,
  type AthleteShareSettings,
  type SurfSpot,
  type TrainingSession,
} from '../../types'
import type { AthletePortalSheet } from './types'

const KINDS: ManeuverKind[] = ['rail', 'top-turn', 'progressive']

const SHARE_LABELS: { key: keyof AthleteShareSettings; label: string }[] = [
  { key: 'technicalStats', label: 'Technical' },
  { key: 'comboStats', label: 'Combos' },
  { key: 'sessionHistory', label: 'History' },
  { key: 'heatDetails', label: 'Heats' },
]

function RateBar({ value }: { value: number }) {
  return (
    <div className="rate-bar" role="presentation">
      <div className="rate-bar__fill" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}

export type AthletePortalSheetProps = {
  sheet: AthletePortalSheet
  onClose: () => void
  auth: { name: string; pairingCode: string }
  activeLinks: CoachAthleteLink[]
  pendingLinks: CoachAthleteLink[]
  pairingError: string
  pairingBusy: string | null
  onCopyCode: () => void
  onPairingResponse: (linkId: string, accept: boolean) => void
  onLeaveCoach: (linkId: string) => void
  mySessions: TrainingSession[]
  athleteId: string
  technicalStats: SessionStatsSnapshot | null
  comboStats: ComboSessionStatsSnapshot | null
  sessionSummaries: { session: TrainingSession; headline: string }[]
  heatDetails: AthleteHeatDetail[]
  sessionAthleteFeedback: SessionAthleteFeedback[]
  pendingCheckins: number
  pendingSessions: TrainingSession[]
  getSpot: (id: string) => SurfSpot | undefined
  coachName: (coachId: string) => string
}

export function AthletePortalSheetView(props: AthletePortalSheetProps) {
  switch (props.sheet) {
    case 'coaches':
      return <CoachesSheet {...props} />
    case 'shared-stats':
      return <SharedStatsSheet {...props} />
    case 'checkins':
      return <CheckinsSheet {...props} />
    case 'heats':
      return <HeatsSheet {...props} />
    case 'training-history':
      return <TrainingHistorySheet {...props} />
    case 'evolution':
      return <EvolutionSheet {...props} />
    default:
      return null
  }
}

function CoachesSheet({
  onClose,
  auth,
  activeLinks,
  pendingLinks,
  pairingError,
  pairingBusy,
  onCopyCode,
  onPairingResponse,
  onLeaveCoach,
}: AthletePortalSheetProps) {
  return (
    <div className="athlete-sheet">
      <ScreenHeader title="Linked coaches" onBack={onClose} />
      <div className="athlete-sheet__body">
        <div className="ss-card pairing-panel">
          <h2 className="page-title">Your pairing code</h2>
          <p className="muted stats-panel__sub">
            Share this code with any coach. They send a request — you must accept before they can log
            your sessions.
          </p>
          <div className="pairing-code-box">
            <strong className="pairing-code-box__code">{auth.pairingCode || '—'}</strong>
            <button type="button" className="btn btn--ghost btn--small" onClick={onCopyCode}>
              Copy
            </button>
          </div>
          {pairingError ? <p className="login-error">{pairingError}</p> : null}
        </div>

        {pendingLinks.length > 0 ? (
          <div className="ss-card athlete-sheet__block">
            <h3 className="pairing-panel__title">Coach requests</h3>
            <ul className="pairing-list">
              {pendingLinks.map((link) => (
                <li key={link.id} className="pairing-list__item pairing-list__item--actions">
                  <span className="pairing-list__info">
                    <strong>{link.coachName ?? 'Coach'}</strong>
                    <small>wants to link with you</small>
                  </span>
                  <span className="pairing-list__buttons">
                    <button
                      type="button"
                      className="btn btn--primary btn--small"
                      disabled={pairingBusy === link.id}
                      onClick={() => onPairingResponse(link.id, true)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      disabled={pairingBusy === link.id}
                      onClick={() => onPairingResponse(link.id, false)}
                    >
                      Decline
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="ss-card athlete-sheet__block">
          <h3 className="pairing-panel__title">Linked coaches</h3>
          {activeLinks.length > 0 ? (
            <ul className="pairing-list">
              {activeLinks.map((link) => (
                <li key={link.id} className="pairing-list__item pairing-list__item--actions">
                  <span className="pairing-list__info">
                    <strong>{link.coachName ?? 'Coach'}</strong>
                    <small>Active</small>
                  </span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={pairingBusy === link.id}
                    onClick={() => onLeaveCoach(link.id)}
                  >
                    Leave
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No coaches linked yet. Share your code to get started.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SharedStatsSheet({
  onClose,
  activeLinks,
  technicalStats,
  comboStats,
}: AthletePortalSheetProps) {
  const sharingCoaches = activeLinks.filter((link) =>
    SHARE_LABELS.some(({ key }) => link.shareSettings[key]),
  )

  return (
    <div className="athlete-sheet">
      <ScreenHeader title="Shared statistics" onBack={onClose} />
      <div className="athlete-sheet__body">
        <div className="ss-card athlete-sheet__block">
          <h2 className="page-title">What each coach shares</h2>
          <p className="muted stats-panel__sub">
            Coaches choose what to show you from their sessions. Your general stats always stay with
            you.
          </p>
          {sharingCoaches.length > 0 ? (
            <ul className="athlete-share-coaches">
              {sharingCoaches.map((link) => (
                <li key={link.id} className="athlete-share-coaches__item">
                  <strong>{link.coachName ?? 'Coach'}</strong>
                  <div className="athlete-share-coaches__tags">
                    {SHARE_LABELS.filter(({ key }) => link.shareSettings[key]).map(({ key, label }) => (
                      <span key={key} className="athlete-share-coaches__tag">
                        {label}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No coach has shared detailed stats yet.</p>
          )}
        </div>

        {technicalStats ? (
          <div className="ss-card stats-panel athlete-sheet__block">
            <h2 className="stats-panel__title">Technical training</h2>
            <p className="muted stats-panel__sub">
              {technicalStats.successfulManeuvers} successes in {technicalStats.totalManeuvers}{' '}
              attempts
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
        ) : null}

        {comboStats ? (
          <div className="ss-card stats-panel athlete-sheet__block">
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
        ) : null}

        {!technicalStats && !comboStats ? (
          <div className="ss-card athlete-sheet__block">
            <p className="muted">
              Ask your coaches to enable sharing from <strong>Athletes & pairing</strong> in their
              app.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CheckinsSheet({
  onClose,
  athleteId,
  mySessions,
  sessionAthleteFeedback,
  activeLinks,
  coachName,
}: AthletePortalSheetProps) {
  const { openSessionFeedback } = useApp()
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)

  const psychologyCoachIds = useMemo(
    () => coachIdsWithPsychologyCheckins(activeLinks),
    [activeLinks],
  )

  const feedbackBySessionId = useMemo(() => {
    const map = new Map<string, SessionAthleteFeedback>()
    for (const row of sessionAthleteFeedback) {
      if (row.athleteId === athleteId && feedbackHasPsychologySurvey(row)) {
        map.set(row.sessionId, row)
      }
    }
    return map
  }, [sessionAthleteFeedback, athleteId])

  const checkinSessions = useMemo(
    () =>
      mySessions
        .filter(
          (session) => Boolean(session.endedAt) && psychologyCoachIds.has(session.coachId),
        )
        .sort(
          (a, b) =>
            new Date(b.endedAt ?? b.startedAt).getTime() -
            new Date(a.endedAt ?? a.startedAt).getTime(),
        )
        .map((session) => ({
          session,
          feedback: feedbackBySessionId.get(session.id) ?? null,
          completed: feedbackBySessionId.has(session.id),
        })),
    [mySessions, psychologyCoachIds, feedbackBySessionId],
  )

  const pendingCount = checkinSessions.filter((row) => !row.completed).length

  const toggleSession = (sessionId: string) => {
    setExpandedSessionId((current) => (current === sessionId ? null : sessionId))
  }

  return (
    <div className="athlete-sheet">
      <ScreenHeader title="Mental check-ins" onBack={onClose} />
      <div className="athlete-sheet__body">
        {checkinSessions.length > 0 ? (
          <div className="ss-card athlete-sheet__block">
            <h2 className="page-title">Training sessions</h2>
            <p className="muted stats-panel__sub">
              {pendingCount > 0
                ? `${pendingCount} check-in${pendingCount === 1 ? '' : 's'} still waiting. Tap a session to view details or complete it.`
                : 'Tap a completed session to review your answers.'}
            </p>
            <ul className="athlete-checkin-list">
              {checkinSessions.map(({ session, feedback, completed }) => {
                const sessionDate = session.endedAt ?? session.startedAt
                const expanded = expandedSessionId === session.id
                return (
                  <li
                    key={session.id}
                    className={
                      completed
                        ? 'athlete-checkin-list__item athlete-checkin-list__item--done'
                        : 'athlete-checkin-list__item athlete-checkin-list__item--pending'
                    }
                  >
                    <button
                      type="button"
                      className="athlete-checkin-list__row"
                      aria-expanded={expanded}
                      onClick={() => toggleSession(session.id)}
                    >
                      <div className="athlete-checkin-list__summary">
                        <strong>{TRAINING_MODE_LABELS[session.mode]}</strong>
                        <p className="muted">
                          {formatSessionDateTime(sessionDate)} · {coachName(session.coachId)}
                        </p>
                      </div>
                      {completed && feedback ? (
                        <span className="athlete-checkin-list__badge athlete-checkin-list__badge--done">
                          {averagePsychologyScore(feedback.psychologyScores!).toFixed(1)}/5
                        </span>
                      ) : (
                        <span className="athlete-checkin-list__badge athlete-checkin-list__badge--pending">
                          Pending
                        </span>
                      )}
                    </button>

                    {expanded && completed && feedback ? (
                      <div className="athlete-checkin-list__detail">
                        <ul className="athlete-checkin-timeline__scores">
                          {PSYCHOLOGY_SURVEY_QUESTIONS.map((question) => (
                            <li key={question.id}>
                              <span>{question.label}</span>
                              <strong>{feedback.psychologyScores![question.id]}/5</strong>
                            </li>
                          ))}
                        </ul>
                        {feedback.writtenNote?.trim() ? (
                          <p className="athlete-checkin-timeline__note">{feedback.writtenNote}</p>
                        ) : null}
                      </div>
                    ) : null}

                    {expanded && !completed ? (
                      <div className="athlete-checkin-list__prompt" role="status">
                        <p>
                          You have not completed this check-in yet. It only takes a minute and helps
                          your coach support you between sessions.
                        </p>
                        <button
                          type="button"
                          className="btn btn--primary btn--block"
                          onClick={() => openSessionFeedback(session.id)}
                        >
                          Fill in check-in now
                        </button>
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <div className="ss-card athlete-sheet__block">
            <p className="muted">
              No mental check-ins yet. When a coach enables them, you&apos;ll answer after each
              session.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function HeatsSheet({ onClose, heatDetails, mySessions, coachName }: AthletePortalSheetProps) {
  const sessionCoach = useMemo(
    () => new Map(mySessions.map((session) => [session.id, session.coachId])),
    [mySessions],
  )

  return (
    <div className="athlete-sheet">
      <ScreenHeader title="Heat history" onBack={onClose} />
      <div className="athlete-sheet__body">
        {heatDetails.length > 0 ? (
          <ul className="athlete-history-list athlete-history-list--cards">
            {heatDetails.map((heat) => (
              <li key={`${heat.sessionId}-${heat.heatLabel}-${heat.sessionEndedAt}`}>
                <div>
                  <strong>{heat.heatLabel}</strong>
                  <p className="muted">
                    {formatSessionDate(heat.sessionEndedAt)} ·{' '}
                    {coachName(sessionCoach.get(heat.sessionId) ?? '')}
                  </p>
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
        ) : (
          <div className="ss-card athlete-sheet__block">
            <p className="muted">No heat results shared by your coaches yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TrainingHistorySheet({
  onClose,
  sessionSummaries,
  getSpot,
  coachName,
}: AthletePortalSheetProps) {
  return (
    <div className="athlete-sheet">
      <ScreenHeader title="Training history" onBack={onClose} />
      <div className="athlete-sheet__body">
        {sessionSummaries.length > 0 ? (
          <ul className="athlete-history-list athlete-history-list--cards">
            {sessionSummaries.map(({ session, headline }) => (
              <li key={session.id}>
                <div>
                  <strong>{TRAINING_MODE_LABELS[session.mode]}</strong>
                  <p className="muted">
                    {resolveSessionSpotName(session, getSpot)} · {session.condition} ·{' '}
                    {formatSessionDate(session.endedAt ?? session.startedAt)}
                  </p>
                  <p className="athlete-history-list__coach">{coachName(session.coachId)}</p>
                </div>
                <div className="athlete-history-list__meta">
                  <span>{headline}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="ss-card athlete-sheet__block">
            <p className="muted">No training history shared by your coaches yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function EvolutionSheet({ onClose, mySessions, athleteId }: AthletePortalSheetProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('6m')
  const points = useMemo(
    () => buildAthleteEvolution(mySessions, athleteId, period),
    [mySessions, athleteId, period],
  )

  return (
    <div className="athlete-sheet">
      <ScreenHeader title="Evolution" onBack={onClose} />
      <div className="athlete-sheet__body">
        <EvolutionLineChart
          title={`Your evolution · ${analyticsPeriodLabel(period)}`}
          subtitle="Success rate, potential, and average level (technical + combos)"
          points={points}
          period={period}
          periodOptions={ANALYTICS_PERIOD_OPTIONS}
          onPeriodChange={setPeriod}
          periodColumnLabel={period === '1w' ? 'Day' : period === '1m' ? 'Week' : 'Month'}
        />
      </div>
    </div>
  )
}
