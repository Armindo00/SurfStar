import { useEffect } from 'react'
import { AthleteEquipmentReviewsList } from '../components/AthleteEquipmentReviewsList'
import { ScreenHeader } from '../components/ScreenHeader'
import { useApp } from '../AppContext'

export function AthleteEquipmentReviewsView() {
  const {
    auth,
    athleteBoards,
    athleteFins,
    athleteLinks,
    equipmentEvaluations,
    refreshAthleteEquipment,
    setView,
  } = useApp()

  useEffect(() => {
    if (auth?.role === 'atleta') void refreshAthleteEquipment(auth.athleteId)
  }, [auth, refreshAthleteEquipment])

  const athleteId = auth?.role === 'atleta' ? auth.athleteId : ''

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
