import { InstallInstructions } from '../components/InstallInstructions'
import { ScreenHeader } from '../components/ScreenHeader'
import {
  ATHLETE_HELP_SECTIONS,
  COACH_QUICK_TIPS,
  TRAINING_HELP_GUIDES,
  planBadgeForMode,
  trainingGuideLabel,
} from '../helpContent'
import { useApp } from '../AppContext'

export function HelpView() {
  const { role, subscription, setView } = useApp()
  const isCoach = role === 'treinador'
  const planId = subscription?.planId ?? 'team'

  const goBack = () => {
    setView(isCoach ? 'coach-home' : 'athlete-portal')
  }

  return (
    <div className="ss-flow help-page">
      <ScreenHeader title="Help" onBack={goBack} />

      {isCoach ? (
        <>
          <div className="ss-card help-section">
            <h2 className="page-title">Quick start</h2>
            <ul className="help-list">
              {COACH_QUICK_TIPS.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="ss-card help-section">
            <h2 className="page-title">Training modes</h2>
            <p className="muted stats-panel__sub">
              How each session type works and how to run it on the beach.
            </p>
            <div className="help-faq">
              {TRAINING_HELP_GUIDES.map((guide) => {
                const badge = planBadgeForMode(guide.mode, planId)
                return (
                  <details key={guide.mode} className="help-faq__item" open={guide.mode === 'tecnico'}>
                    <summary>
                      <span className="help-faq__title">{trainingGuideLabel(guide.mode)}</span>
                      {badge ? <span className="help-faq__badge">{badge}</span> : null}
                    </summary>
                    <p className="muted">{guide.summary}</p>
                    <ol className="help-steps">
                      {guide.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </details>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="ss-card help-section">
          <h2 className="page-title">Athlete guide</h2>
          <div className="help-faq">
            {ATHLETE_HELP_SECTIONS.map((section) => (
              <details key={section.title} className="help-faq__item">
                <summary>
                  <span className="help-faq__title">{section.title}</span>
                </summary>
                <p className="muted">{section.body}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="ss-card help-section">
        <h2 className="page-title">{isCoach ? 'Add to home screen' : 'Install on your phone'}</h2>
        <InstallInstructions />
      </div>
    </div>
  )
}
