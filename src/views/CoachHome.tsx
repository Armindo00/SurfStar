import { useState } from 'react'
import { LanguagePicker } from '../components/LanguagePicker'
import { NavBadge } from '../components/NavBadge'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import { UNSEEN } from '../unseenDomains'
import {
  athleteLimitMessage,
  canManageOrganizationCoaches,
  canUseCustomTraining,
  getAllowedModes,
} from '../planUtils'
import { formatPlanPriceWithSuffix, getPlan, type PlanId } from '../plans'
import { trainingModeLabel } from '../i18n/labels'

const ONBOARDING_DISMISS_KEY = 'surfstar_onboarding_dismissed'

function sessionModesSubtitle(planId: PlanId): string {
  return getAllowedModes(planId)
    .map((mode) => trainingModeLabel(mode))
    .join(', ')
}

function CoachOnboarding() {
  const { coachAthletes, completedCoachSessions, setView, beginDraftSession } = useApp()
  const { messages, t } = useI18n()
  const onboarding = messages.coach.onboarding
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_DISMISS_KEY) === '1',
  )

  const steps = onboarding.steps.map((step, index) => ({
    done:
      index === 0
        ? coachAthletes.length > 0
        : index === 1
          ? completedCoachSessions.length > 0
          : completedCoachSessions.length > 0 && coachAthletes.length > 0,
    label: step.label,
    hint: step.hint,
    action:
      index === 0
        ? () => setView('manage-athletes')
        : index === 1
          ? beginDraftSession
          : () => setView('analytics'),
    cta: step.cta,
  }))

  const completedCount = steps.filter((step) => step.done).length
  const allDone = completedCount === steps.length

  if (dismissed || allDone) return null

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_DISMISS_KEY, '1')
    setDismissed(true)
  }

  const nextStep = steps.find((step) => !step.done)

  return (
    <section className="ss-card onboarding-card" aria-label={onboarding.ariaLabel}>
      <div className="onboarding-card__head">
        <div>
          <p className="onboarding-card__eyebrow">{onboarding.eyebrow}</p>
          <h2 className="onboarding-card__title">{onboarding.title}</h2>
          <p className="muted onboarding-card__sub">
            {t('coach.onboarding.progress', { completed: completedCount, total: steps.length })}
          </p>
        </div>
        <button type="button" className="btn btn--ghost btn--small" onClick={dismiss}>
          {onboarding.dismiss}
        </button>
      </div>

      <ol className="onboarding-steps">
        {steps.map((step, index) => (
          <li
            key={step.label}
            className={step.done ? 'onboarding-step onboarding-step--done' : 'onboarding-step'}
          >
            <span className="onboarding-step__num" aria-hidden="true">
              {step.done ? '✓' : index + 1}
            </span>
            <div className="onboarding-step__body">
              <strong>{step.label}</strong>
              {!step.done ? <p className="muted">{step.hint}</p> : null}
            </div>
          </li>
        ))}
      </ol>

      {nextStep ? (
        <button type="button" className="btn btn--primary btn--block" onClick={nextStep.action}>
          {nextStep.cta}
        </button>
      ) : null}
    </section>
  )
}

export function CoachHome() {
  const {
    auth,
    subscription,
    setView,
    beginDraftSession,
    logout,
    coachAthletes,
    completedCoachSessions,
    openContact,
    coachLinks,
    organizationMembers,
    countUnseen,
  } = useApp()
  const { t } = useI18n()
  const name = auth?.role === 'treinador' ? auth.name : t('coach.defaultName')
  const plan = subscription ? getPlan(subscription.planId) : null
  const planId = subscription?.planId ?? 'team'
  const hasCustomTraining = canUseCustomTraining(planId)
  const orgName = auth?.role === 'treinador' ? auth.organizationName : null
  const isNewCoach = coachAthletes.length === 0 && completedCoachSessions.length === 0

  const unseenAthletePairing = countUnseen(
    UNSEEN.coachPairing,
    coachLinks.filter((link) => link.status === 'pending').map((link) => ({ id: link.id })),
  )

  const unseenOrgInvites = countUnseen(
    UNSEEN.coachOrgInvites,
    organizationMembers.filter((member) => member.status === 'pending').map((member) => ({ id: member.id })),
  )

  return (
    <div className="dashboard">
      <header className="dashboard__hero">
        <p className="dashboard__hello">{t('coach.hello')}</p>
        <h1 className="dashboard__name">{name}</h1>
        {orgName ? <p className="dashboard__org muted">{orgName}</p> : null}
        {plan ? (
          <p className="dashboard__plan muted">
            {t('coach.planLine', {
              planName: plan.name,
              price: formatPlanPriceWithSuffix(plan, 'monthly'),
              athleteLimit: athleteLimitMessage(plan.id),
            })}
          </p>
        ) : (
          <p className="muted">{t('coach.dashboardFallback')}</p>
        )}
      </header>

      <CoachOnboarding />

      <button type="button" className="action-card action-card--primary" onClick={beginDraftSession}>
        <span className="action-card__icon" aria-hidden="true">
          ▶
        </span>
        <span>
          <strong>{t('coach.newSession')}</strong>
          <small>{sessionModesSubtitle(planId)}</small>
        </span>
      </button>

      {isNewCoach ? (
        <div className="ss-card dashboard-empty-hint">
          <p className="muted">{t('coach.welcomeHint')}</p>
        </div>
      ) : null}

      <nav className="action-list">
        <button type="button" className="action-list__item" onClick={() => setView('training-sessions')}>
          <span>{t('nav.pastSessions')}</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('analytics')}>
          <span>{t('nav.teamAnalytics')}</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('manage-athletes')}>
          <span>{t('nav.manageAthletes')}</span>
          <NavBadge count={unseenAthletePairing} className="nav-badge" />
          {!unseenAthletePairing ? <span aria-hidden="true">›</span> : null}
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('organization')}>
          <span>
            {t('nav.teamAndCoaches')}
            {!canManageOrganizationCoaches(planId) ? t('nav.teamAcademySuffix') : ''}
          </span>
          <NavBadge count={unseenOrgInvites} className="nav-badge" />
          {!unseenOrgInvites ? <span aria-hidden="true">›</span> : null}
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('manage-spots')}>
          <span>{t('nav.spotsAndConditions')}</span>
          <span aria-hidden="true">›</span>
        </button>
        <button
          type="button"
          className="action-list__item"
          onClick={() =>
            hasCustomTraining ? setView('manage-custom-templates') : setView('subscription')
          }
        >
          <span>
            {t('nav.customTrainingTemplates')}
            {!hasCustomTraining ? t('nav.coachPremiumSuffix') : ''}
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('subscription')}>
          <span>{t('nav.accountAndSubscription')}</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('help')}>
          <span>{t('nav.helpAndTrainingGuide')}</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={openContact}>
          <span>{t('nav.contactSurfStar')}</span>
          <span aria-hidden="true">›</span>
        </button>
      </nav>

      <div className="ss-card stats-panel">
        <LanguagePicker compact />
      </div>

      <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={logout}>
        {t('common.signOut')}
      </button>
    </div>
  )
}
