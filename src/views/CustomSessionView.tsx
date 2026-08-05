import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import { CustomRegisterPanel } from '../components/CustomRegisterPanel'
import { SessionStickyBar } from '../components/SessionStickyBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { computeCustomSessionStats } from '../customTrainingStats'
import { useApp } from '../AppContext'

export function CustomSessionView() {
  const { t } = useI18n()
  const {
    activeSession,
    activeAthleteId,
    activeWaveId,
    trainingAthleteGridEpoch,
    selectAthlete,
    closeActiveWave,
    setActiveAthleteId,
    setView,
    getAthlete,
  } = useApp()

  const [focusAthleteId, setFocusAthleteId] = useState<string | null>(null)

  const sessionAthletes = useMemo(() => {
    if (!activeSession) return []
    return activeSession.athleteIds
      .map((id) => getAthlete(id))
      .filter(Boolean) as { id: string; name: string }[]
  }, [activeSession, getAthlete])

  const stats = activeSession ? computeCustomSessionStats(activeSession, null) : null
  const focusedAthlete = focusAthleteId ? getAthlete(focusAthleteId) : undefined
  const templateName = activeSession?.customTemplateName ?? t('ui.session.customTrainingFallback')

  useEffect(() => {
    if (!activeAthleteId) {
      setFocusAthleteId(null)
    }
  }, [activeAthleteId])

  useEffect(() => {
    setFocusAthleteId(null)
  }, [trainingAthleteGridEpoch])

  if (!activeSession || activeSession.mode !== 'custom') {
    return (
      <div className="ss-flow">
        <p className="muted">{t('ui.session.noActiveCustomSession')}</p>
        <button type="button" className="btn" onClick={() => setView('coach-home')}>
          {t('common.back')}
        </button>
      </div>
    )
  }

  const openAthleteRegister = (athleteId: string) => {
    if (activeWaveId) closeActiveWave()
    selectAthlete(athleteId)
    setFocusAthleteId(athleteId)
  }

  const backToGrid = () => {
    if (activeWaveId) closeActiveWave()
    setActiveAthleteId(null)
    setFocusAthleteId(null)
  }

  if (focusAthleteId && focusedAthlete && activeAthleteId === focusAthleteId) {
    return (
      <div className="ss-flow ss-flow--training ss-flow--with-sticky">
        <ScreenHeader title={templateName} onBack={backToGrid} />
        <div className="ss-card">
          <CustomRegisterPanel athleteName={focusedAthlete.name} onBack={backToGrid} />
        </div>
      </div>
    )
  }

  return (
    <div className="ss-flow ss-flow--training ss-flow--with-sticky">
      <ScreenHeader title={templateName} onBack={() => setView('coach-home')} />

      <div className="ss-card">
        <h2 className="page-title">{t('ui.session.chooseAthlete')}</h2>
        <p className="muted">{t('ui.session.chooseAthleteCustomHint')}</p>

        <div className="athlete-grid">
          {sessionAthletes.map((a) => (
            <button
              key={a.id}
              type="button"
              className="athlete-tile"
              onClick={() => openAthleteRegister(a.id)}
            >
              <span className="athlete-tile__avatar" aria-hidden="true">
                {a.name.charAt(0).toUpperCase()}
              </span>
              <span className="athlete-tile__name">{a.name}</span>
            </button>
          ))}
        </div>

        {stats ? (
          <div className="ss-mini-stats ss-mini-stats--bar">
            <span>{t('ui.session.sessionMetaAttempts', { attempts: stats.totalAttempts })}</span>
            {stats.waveStats.totalWaves > 0 ? (
              <span>{t('ui.session.wavesCount', { count: stats.waveStats.totalWaves })}</span>
            ) : null}
            <span>{t('ui.session.successShort', { rate: stats.overallSuccessRate })}</span>
          </div>
        ) : null}
      </div>

      <SessionStickyBar />
    </div>
  )
}
