import { useApp } from '../AppContext'
import { canUseTrainingMode } from '../planUtils'
import { ScreenHeader } from '../components/ScreenHeader'
import { SessionSetupSteps } from '../components/SessionSetupSteps'
import { useI18n } from '../i18n'
import { trainingModeLabel } from '../i18n/labels'
import type { TrainingMode } from '../types'

const ALL_MODES: TrainingMode[] = ['tecnico', 'combos', 'custom', 'heats', 'campeonato', 'sea-analysis']

export function StartSession() {
  const { draft, coachPlanId, setDraftMode, setView } = useApp()
  const { t } = useI18n()
  const s = (key: string, params?: Record<string, string | number>) => t(`session.setup.${key}`, params)

  const planId = coachPlanId
  const modes = ALL_MODES.filter((mode) => canUseTrainingMode(planId, mode))
  const lockedModes = ALL_MODES.filter((mode) => !canUseTrainingMode(planId, mode))

  const lockedModesHint = (() => {
    const labels = lockedModes.map((m) => trainingModeLabel(m)).join(', ')
    const needsCoach = lockedModes.some((m) => m === 'heats' || m === 'campeonato')
    const needsPremium = lockedModes.some((m) => m === 'custom' || m === 'sea-analysis')
    if (needsPremium && needsCoach) return s('lockedModesPremiumAndCoach', { modes: labels })
    if (needsPremium) return s('lockedModesPremium', { modes: labels })
    if (needsCoach) return s('lockedModesCoach', { modes: labels })
    return s('lockedModesUpgrade', { modes: labels })
  })()

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.newSession')} onBack={() => setView('coach-home')} />
      <div className="ss-card stats-panel">
        <SessionSetupSteps current={1} totalSteps={draft.mode === 'sea-analysis' ? 2 : 3} />
        <h2 className="stats-panel__title">{s('step1Title')}</h2>
        <p className="muted stats-panel__sub">{s('step1Subtitle')}</p>

        <div className="chip-row chip-row--pro chip-row--modes">
          {modes.map((mode) => (
            <button
              key={mode}
              type="button"
              className={draft.mode === mode ? 'chip chip--active' : 'chip'}
              onClick={() => setDraftMode(mode)}
            >
              {trainingModeLabel(mode)}
            </button>
          ))}
        </div>

        {lockedModes.length > 0 ? <p className="plan-lock-note muted">{lockedModesHint}</p> : null}

        <button
          type="button"
          className="btn btn--primary btn--block btn--lg"
          disabled={modes.length === 0}
          onClick={() => setView('configure-session')}
        >
          {s('continue')}
        </button>
      </div>
    </div>
  )
}
