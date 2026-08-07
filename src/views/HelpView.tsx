import { InstallInstructions } from '../components/InstallInstructions'
import { ScreenHeader } from '../components/ScreenHeader'
import {
  getAthleteHelpSections,
  getCoachQuickTips,
  getTrainingHelpGuides,
  planBadgeForMode,
  trainingGuideLabel,
} from '../helpContent'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

export function HelpView() {
  const { role, coachPlanId, setView, openContact } = useApp()
  const { t, locale, messages } = useI18n()
  const page = messages.help.page
  const isCoach = role === 'treinador'
  const planId = coachPlanId

  const goBack = () => {
    setView(isCoach ? 'coach-home' : 'athlete-portal')
  }

  return (
    <div className="ss-flow help-page">
      <ScreenHeader title={t('nav.help')} onBack={goBack} />

      {isCoach ? (
        <>
          <div className="ss-card help-section">
            <h2 className="page-title">{page.quickStart}</h2>
            <ul className="help-list">
              {getCoachQuickTips(locale).map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>

          <div className="ss-card help-section">
            <h2 className="page-title">{page.trainingModes}</h2>
            <p className="muted stats-panel__sub">{page.trainingModesSub}</p>
            <div className="help-faq">
              {getTrainingHelpGuides(locale).map((guide) => {
                const badge = planBadgeForMode(guide.mode, planId, locale)
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
          <h2 className="page-title">{page.athleteGuide}</h2>
          <div className="help-faq">
            {getAthleteHelpSections(locale).map((section) => (
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
        <h2 className="page-title">{isCoach ? page.addToHomeScreen : page.installOnPhone}</h2>
        <InstallInstructions />
      </div>

      <div className="ss-card help-section help-section--contact">
        <h2 className="page-title">{page.contactTitle}</h2>
        <p className="muted">{page.contactLead}</p>
        <button type="button" className="btn btn--outline btn--block" onClick={openContact}>
          {page.sendMessage}
        </button>
      </div>
    </div>
  )
}
