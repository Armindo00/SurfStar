import { useMemo, useState } from 'react'
import { AthleteCustomSessionStatsDetail } from './AthleteCustomSessionStatsDetail'
import { useI18n } from '../i18n'
import { formatSessionDate, resolveSessionSpotName } from '../sessionHistoryUtils'
import { trainingModeLabel } from '../i18n/labels'
import type { SurfSpot, TrainingSession } from '../types'

type Props = {
  sessions: TrainingSession[]
  athleteId: string
  getSpot: (id: string) => SurfSpot | undefined
  coachName: (coachId: string) => string
}

export function AthleteCustomSessionsList({
  sessions,
  athleteId,
  getSpot,
  coachName,
}: Props) {
  const { t } = useI18n()
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null)

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(b.endedAt ?? b.startedAt).getTime() -
          new Date(a.endedAt ?? a.startedAt).getTime(),
      ),
    [sessions],
  )

  if (sortedSessions.length === 0) return null

  const toggleSession = (sessionId: string) => {
    setExpandedSessionId((current) => (current === sessionId ? null : sessionId))
  }

  return (
    <ul className="athlete-checkin-list athlete-custom-sessions-list">
      {sortedSessions.map((session) => {
        const expanded = expandedSessionId === session.id
        return (
          <li key={session.id} className="athlete-checkin-list__item athlete-checkin-list__item--done">
            <button
              type="button"
              className="athlete-checkin-list__row"
              aria-expanded={expanded}
              onClick={() => toggleSession(session.id)}
            >
              <div className="athlete-checkin-list__summary">
                <strong>{trainingModeLabel(session.mode)}</strong>
                <p className="muted">
                  {resolveSessionSpotName(session, getSpot)} · {session.condition} ·{' '}
                  {formatSessionDate(session.endedAt ?? session.startedAt)}
                </p>
                <p className="athlete-history-list__coach">{coachName(session.coachId)}</p>
              </div>
              <span className="athlete-checkin-list__badge athlete-checkin-list__badge--done">
                {session.customTemplateName ?? t('ui.session.customTrainingFallback')}
              </span>
            </button>

            {expanded ? (
              <div className="athlete-checkin-list__detail">
                <AthleteCustomSessionStatsDetail session={session} athleteId={athleteId} />
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
