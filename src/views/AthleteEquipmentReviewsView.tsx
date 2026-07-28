import { useEffect } from 'react'
import { AthleteEquipmentReviewsList } from '../components/AthleteEquipmentReviewsList'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'
import { UNSEEN } from '../unseenDomains'

export function AthleteEquipmentReviewsView() {
  const {
    auth,
    athleteBoards,
    athleteFins,
    athleteLinks,
    equipmentEvaluations,
    refreshAthleteEquipment,
    markSeen,
    setView,
  } = useApp()

  useEffect(() => {
    if (auth?.role === 'atleta') void refreshAthleteEquipment(auth.athleteId)
  }, [auth, refreshAthleteEquipment])

  const athleteId = auth?.role === 'atleta' ? auth.athleteId : ''

  useEffect(() => {
    if (auth?.role !== 'atleta') return
    const reviewIds = equipmentEvaluations
      .filter((item) => item.athleteId === athleteId)
      .map((item) => item.id)
    markSeen(UNSEEN.athleteEquipmentReviews, reviewIds)
  }, [athleteId, auth, equipmentEvaluations, markSeen])

  return (
    <div className="ss-flow">
      <ScreenHeader title="Coach equipment reviews" onBack={() => setView('athlete-portal')} />
      <AthleteEquipmentReviewsList
        athleteId={athleteId}
        evaluations={equipmentEvaluations}
        boards={athleteBoards}
        fins={athleteFins}
        athleteLinks={athleteLinks}
      />
    </div>
  )
}
