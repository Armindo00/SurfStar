import { useMemo, useState, type ReactNode } from 'react'
import { NavBadge } from '../components/NavBadge'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import { UNSEEN } from '../unseenDomains'
import {
  canManageOrganizationCoaches,
  canUseCustomTraining,
  getAllowedModes,
} from '../planUtils'
import { getPlan, type PlanId } from '../plans'
import { trainingModeLabel } from '../i18n/labels'
import { formatShortDate } from '../dateFormat'

const ONBOARDING_DISMISS_KEY = 'surfstar_onboarding_dismissed'

function sessionModesSubtitle(planId: PlanId): string {
  return getAllowedModes(planId)
    .map((mode) => trainingModeLabel(mode))
    .join(', ')
}

function ActionRow({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: string
  label: string
  badge?: number
  onClick: () => void
}) {
  return (
    <button type="button" className="action-list__item" onClick={onClick}>
      <span className="action-list__label">
        <span className="action-list__icon" aria-hidden="true">
          {icon}
        </span>
        <span>{label}</span>
      </span>
      <span className="action-list__trail">
        <NavBadge count={badge ?? 0} className="nav-badge" />
        {!badge ? <span aria-hidden="true">›</span> : null}
      </span>
    </button>
  )
}

function DashboardSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="dashboard-section" aria-labelledby={undefined}>
      <h2 className="dashboard-section__title">{title}</h2>
      <div className="action-list">{children}</div>
    </section>
  )
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
    coachPlanId,
    setView,
    beginDraftSession,
    coachAthletes,
    completedCoachSessions,
    coachLinks,
    organizationMembers,
    countUnseen,
  } = useApp()
  const { t } = useI18n()
  const name = auth?.role === 'treinador' ? auth.name : t('coach.defaultName')
  const plan = subscription ? getPlan(subscription.planId) : null
  const hasCustomTraining = canUseCustomTraining(coachPlanId)
  const orgName = auth?.role === 'treinador' ? auth.organizationName : null

  const unseenAthletePairing = countUnseen(
    UNSEEN.coachPairing,
    coachLinks.filter((link) => link.status === 'pending').map((link) => ({ id: link.id })),
  )

  const unseenOrgInvites = countUnseen(
    UNSEEN.coachOrgInvites,
    organizationMembers.filter((member) => member.status === 'pending').map((member) => ({ id: member.id })),
  )

  const lastSessionLabel = useMemo(() => {
    if (completedCoachSessions.length === 0) return t('coach.dashboard.summaryNoSessions')
    const sorted = [...completedCoachSessions].sort((a, b) => {
      const ta = a.endedAt ?? a.startedAt
      const tb = b.endedAt ?? b.startedAt
      return tb.localeCompare(ta)
    })
    const latest = sorted[0]
    return formatShortDate(latest.endedAt ?? latest.startedAt)
  }, [completedCoachSessions, t])

  const teamAcademySuffix = !canManageOrganizationCoaches(coachPlanId) ? t('nav.teamAcademySuffix') : ''
  const premiumSuffix = !hasCustomTraining ? t('nav.coachPremiumSuffix') : ''

  return (
    <div className="dashboard">
      <header className="dashboard__hero">
        <p className="dashboard__hello">{t('coach.hello')}</p>
        <h1 className="dashboard__name">{name}</h1>
        {orgName ? <p className="dashboard__org muted">{orgName}</p> : null}
        {plan ? (
          <button type="button" className="dashboard__plan-link" onClick={() => setView('subscription')}>
            {t('coach.dashboard.planLink', { planName: plan.name })}
          </button>
        ) : (
          <p className="muted">{t('coach.dashboardFallback')}</p>
        )}
      </header>

      <div className="dashboard-summary">
          <div className="dashboard-summary__tile">
            <strong>{coachAthletes.length}</strong>
            <span className="muted">{t('coach.dashboard.summaryAthletes')}</span>
          </div>
          <div className="dashboard-summary__tile">
            <strong>{completedCoachSessions.length}</strong>
            <span className="muted">{t('coach.dashboard.summarySessions')}</span>
          </div>
          <div className="dashboard-summary__tile dashboard-summary__tile--wide">
            <strong>{lastSessionLabel}</strong>
            <span className="muted">{t('coach.dashboard.summaryLastSession')}</span>
          </div>
      </div>

      <CoachOnboarding />

      <button type="button" className="action-card action-card--primary" onClick={beginDraftSession}>
        <span className="action-card__icon" aria-hidden="true">
          ▶
        </span>
        <span>
          <strong>{t('coach.newSession')}</strong>
          <small>{sessionModesSubtitle(coachPlanId)}</small>
        </span>
      </button>

      <nav className="dashboard-nav" aria-label={t('coach.dashboard.navLabel')}>
        <DashboardSection title={t('coach.dashboard.sectionTraining')}>
          <ActionRow icon="📋" label={t('nav.pastSessions')} onClick={() => setView('training-sessions')} />
          <ActionRow icon="📍" label={t('nav.spotsAndConditions')} onClick={() => setView('manage-spots')} />
          <ActionRow
            icon="✦"
            label={`${t('nav.customTrainingTemplates')}${premiumSuffix}`}
            onClick={() =>
              hasCustomTraining ? setView('manage-custom-templates') : setView('subscription')
            }
          />
        </DashboardSection>

        <DashboardSection title={t('coach.dashboard.sectionTeam')}>
          <ActionRow
            icon="👤"
            label={t('nav.manageAthletes')}
            badge={unseenAthletePairing || undefined}
            onClick={() => setView('manage-athletes')}
          />
          <ActionRow icon="📈" label={t('nav.teamAnalytics')} onClick={() => setView('analytics')} />
          <ActionRow
            icon="👥"
            label={`${t('nav.teamAndCoaches')}${teamAcademySuffix}`}
            badge={unseenOrgInvites || undefined}
            onClick={() => setView('organization')}
          />
        </DashboardSection>
      </nav>
    </div>
  )
}
