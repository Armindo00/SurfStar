import { useMemo } from 'react'
import { EquipmentRatingChart } from './EquipmentRatingChart'
import { formatMaterialDate } from '../materialUtils'
import type { AthleteBoard, AthleteFin, CoachAthleteLink, EquipmentEvaluation } from '../types'

type Props = {
  athleteId: string
  evaluations: EquipmentEvaluation[]
  boards: AthleteBoard[]
  fins: AthleteFin[]
  athleteLinks: CoachAthleteLink[]
}

export function AthleteEquipmentReviewsList({
  athleteId,
  evaluations,
  boards,
  fins,
  athleteLinks,
}: Props) {
  const coachName = useMemo(() => {
    const map = new Map<string, string>()
    for (const link of athleteLinks) {
      if (link.coachName) map.set(link.coachId, link.coachName)
    }
    return (coachId: string) => map.get(coachId) ?? 'Coach'
  }, [athleteLinks])

  const equipmentName = (type: EquipmentEvaluation['equipmentType'], id: string) => {
    if (type === 'board') return boards.find((board) => board.id === id)?.name ?? 'Board'
    return fins.find((fin) => fin.id === id)?.name ?? 'Fins'
  }

  const myEvaluations = useMemo(
    () =>
      evaluations
        .filter((item) => item.athleteId === athleteId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [athleteId, evaluations],
  )

  if (myEvaluations.length === 0) {
    return (
      <div className="ss-card material-section">
        <p className="muted">
          No coach reviews yet. When a coach rates your boards or fins, their scores and comments
          will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="ss-card material-section">
      <h2 className="page-title">Coach reviews</h2>
      <p className="muted stats-panel__sub">
        Speed, control and release ratings (0–10) with optional comments from each coach.
      </p>
      <ul className="evaluation-history">
        {myEvaluations.map((item) => (
          <li key={item.id} className="evaluation-history__item">
            <span className="evaluation-history__coach">{coachName(item.coachId)}</span>
            <div className="evaluation-history__head">
              <strong>
                {equipmentName(item.equipmentType, item.equipmentId)} ·{' '}
                {item.equipmentType === 'board' ? 'Board' : 'Fins'}
              </strong>
              <span className="muted">{formatMaterialDate(item.createdAt)}</span>
            </div>
            <EquipmentRatingChart speed={item.speed} control={item.control} release={item.release} />
            {item.notes?.trim() ? (
              <p className="evaluation-history__note">{item.notes}</p>
            ) : (
              <p className="muted evaluation-history__note evaluation-history__note--empty">
                No written comment for this review.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
