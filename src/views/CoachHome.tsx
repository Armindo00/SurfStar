import { useState } from 'react'
import { useApp } from '../AppContext'
import {
  athleteLimitMessage,
  canManageOrganizationCoaches,
  canUseCustomTraining,
  getAllowedModes,
} from '../planUtils'
import { formatPlanPriceWithSuffix, getPlan, type PlanId } from '../plans'
import { TRAINING_MODE_LABELS } from '../types'

const ONBOARDING_DISMISS_KEY = 'surfstar_onboarding_dismissed'

function sessionModesSubtitle(planId: PlanId): string {
  return getAllowedModes(planId)
    .map((mode) => TRAINING_MODE_LABELS[mode])
    .join(', ')
}

function CoachOnboarding() {
  const { coachAthletes, completedCoachSessions, setView, beginDraftSession } = useApp()
  const [dismissed, setDismissed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_DISMISS_KEY) === '1',
  )

  const steps = [
    {
      done: coachAthletes.length > 0,
      label: 'Add your first athlete',
      hint: 'Share a pairing code so they can link to your account.',
      action: () => setView('manage-athletes'),
      cta: 'Manage athletes',
    },
    {
      done: completedCoachSessions.length > 0,
      label: 'Log your first session',
      hint: 'Start a training at the beach and save it when you finish.',
      action: beginDraftSession,
      cta: 'New session',
    },
    {
      done: completedCoachSessions.length > 0 && coachAthletes.length > 0,
      label: 'Review team analytics',
      hint: 'See 6-month evolution charts and session breakdowns per athlete.',
      action: () => setView('analytics'),
      cta: 'Open analytics',
    },
  ]

  const completedCount = steps.filter((step) => step.done).length
  const allDone = completedCount === steps.length

  if (dismissed || allDone) return null

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_DISMISS_KEY, '1')
    setDismissed(true)
  }

  const nextStep = steps.find((step) => !step.done)

  return (
    <section className="ss-card onboarding-card" aria-label="Getting started">
      <div className="onboarding-card__head">
        <div>
          <p className="onboarding-card__eyebrow">Getting started</p>
          <h2 className="onboarding-card__title">Set up your coaching workspace</h2>
          <p className="muted onboarding-card__sub">
            {completedCount} of {steps.length} complete
          </p>
        </div>
        <button type="button" className="btn btn--ghost btn--small" onClick={dismiss}>
          Dismiss
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
  const { auth, subscription, setView, beginDraftSession, logout, coachAthletes, completedCoachSessions, openContact } =
    useApp()
  const name = auth?.role === 'treinador' ? auth.name : 'Coach'
  const plan = subscription ? getPlan(subscription.planId) : null
  const planId = subscription?.planId ?? 'team'
  const hasCustomTraining = canUseCustomTraining(planId)
  const orgName = auth?.role === 'treinador' ? auth.organizationName : null
  const isNewCoach = coachAthletes.length === 0 && completedCoachSessions.length === 0

  return (
    <div className="dashboard">
      <header className="dashboard__hero">
        <p className="dashboard__hello">Hello,</p>
        <h1 className="dashboard__name">{name}</h1>
        {orgName ? <p className="dashboard__org muted">{orgName}</p> : null}
        {plan ? (
          <p className="dashboard__plan muted">
            {plan.name} plan · {formatPlanPriceWithSuffix(plan, 'monthly')} · {athleteLimitMessage(plan.id)}
          </p>
        ) : (
          <p className="muted">SurfStar coach dashboard</p>
        )}
      </header>

      <CoachOnboarding />

      <button type="button" className="action-card action-card--primary" onClick={beginDraftSession}>
        <span className="action-card__icon" aria-hidden="true">
          ▶
        </span>
        <span>
          <strong>New session</strong>
          <small>{sessionModesSubtitle(planId)}</small>
        </span>
      </button>

      {isNewCoach ? (
        <div className="ss-card dashboard-empty-hint">
          <p className="muted">
            Welcome to SurfStar. Add athletes from Manage athletes, then start your first session at the
            beach — stats update live as you log waves.
          </p>
        </div>
      ) : null}

      <nav className="action-list">
        <button type="button" className="action-list__item" onClick={() => setView('training-sessions')}>
          <span>Past sessions</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('analytics')}>
          <span>Team analytics</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('manage-athletes')}>
          <span>Manage athletes</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('organization')}>
          <span>
            Team & coaches
            {!canManageOrganizationCoaches(planId) ? ' · Team Academy' : ''}
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('manage-spots')}>
          <span>Spots & conditions</span>
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
            Custom training templates
            {!hasCustomTraining ? ' · Coach Premium' : ''}
          </span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('subscription')}>
          <span>Account & subscription</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('help')}>
          <span>Help & training guide</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={openContact}>
          <span>Contact SurfStar</span>
          <span aria-hidden="true">›</span>
        </button>
      </nav>

      <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={logout}>
        Sign out
      </button>
    </div>
  )
}
