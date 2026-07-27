import { useMemo, useState } from 'react'
import { AthleteMaterialPanel } from '../components/AthleteMaterialPanel'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import { formatMaterialDate } from '../materialUtils'
import { mentalStateLabel } from '../mentalState'
import { TRAINING_MODE_LABELS } from '../types'

export function CoachAthleteInsightsView() {
  const {
    insightsAthlete,
    athleteBoards,
    athleteFins,
    sessionAthleteFeedback,
    trainingSessions,
    setView,
  } = useApp()

  const [tab, setTab] = useState<'material' | 'wellbeing'>('material')

  const feedbackRows = useMemo(() => {
    if (!insightsAthlete) return []
    return sessionAthleteFeedback
      .filter((row) => row.athleteId === insightsAthlete.id)
      .map((row) => {
        const session = trainingSessions.find((s) => s.id === row.sessionId)
        const board = row.boardId ? athleteBoards.find((b) => b.id === row.boardId) : null
        const fin = row.finId ? athleteFins.find((f) => f.id === row.finId) : null
        return { row, session, board, fin }
      })
      .sort(
        (a, b) =>
          new Date(b.row.submittedAt).getTime() - new Date(a.row.submittedAt).getTime(),
      )
  }, [athleteBoards, athleteFins, insightsAthlete, sessionAthleteFeedback, trainingSessions])

  if (!insightsAthlete) {
    return (
      <div className="ss-flow">
        <ScreenHeader title="Athlete insights" onBack={() => setView('manage-athletes')} />
        <p className="muted">No athlete selected.</p>
      </div>
    )
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title={insightsAthlete.name} onBack={() => setView('manage-athletes')} />

      <nav className="admin-tabs insights-tabs" aria-label="Athlete insights">
        <button
          type="button"
          className={tab === 'material' ? 'admin-tabs__btn admin-tabs__btn--active' : 'admin-tabs__btn'}
          onClick={() => setTab('material')}
        >
          Gear & ratings
        </button>
        <button
          type="button"
          className={tab === 'wellbeing' ? 'admin-tabs__btn admin-tabs__btn--active' : 'admin-tabs__btn'}
          onClick={() => setTab('wellbeing')}
        >
          Wellbeing & feedback
        </button>
      </nav>

      {tab === 'material' ? (
        <AthleteMaterialPanel athleteId={insightsAthlete.id} />
      ) : (
        <div className="ss-card material-section">
          <h2 className="page-title">Session feedback & wellbeing</h2>
          <p className="muted">Post-session reports from the athlete across the season.</p>

          {feedbackRows.length === 0 ? (
            <p className="muted">No feedback submitted yet.</p>
          ) : (
            <ul className="feedback-timeline">
              {feedbackRows.map(({ row, session, board, fin }) => (
                <li key={row.id} className="feedback-timeline__item">
                  <div className="feedback-timeline__head">
                    <strong>
                      {session ? TRAINING_MODE_LABELS[session.mode] : 'Session'} ·{' '}
                      {mentalStateLabel(row.mentalState)}
                    </strong>
                    <span className="muted">{formatMaterialDate(row.submittedAt)}</span>
                  </div>
                  <p className="muted feedback-timeline__gear">
                    Gear: {board?.name ?? '—'} · Fins: {fin?.name ?? '—'}
                  </p>
                  {row.writtenNote ? <p className="feedback-timeline__note">{row.writtenNote}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
