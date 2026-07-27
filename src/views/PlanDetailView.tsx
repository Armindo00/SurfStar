import { BillingIntervalToggle } from '../components/BillingIntervalToggle'
import { AppLogo } from '../components/AppLogo'
import {
  getAllComparisonLabels,
  getPlanMarketingSections,
  PLAN_MARKETING_PROFILES,
  planIncludesMarketingFeature,
} from '../planMarketing'
import {
  formatAnnualBillingNote,
  formatPlanPrice,
  formatPlanPriceSuffix,
  getPlan,
  isApprovalRequiredPlan,
  type PlanId,
} from '../plans'
import { useApp } from '../AppContext'

type Props = {
  planId: PlanId
}

export function PlanDetailView({ planId }: Props) {
  const {
    selectPlan,
    openTeamAcademyRequest,
    openLanding,
    openCoachPlanSelection,
    selectedBillingInterval,
    setBillingInterval,
  } = useApp()

  const plan = getPlan(planId)
  const profile = PLAN_MARKETING_PROFILES[planId]
  const sections = getPlanMarketingSections(planId)
  const comparisonLabels = getAllComparisonLabels()
  const approvalRequired = isApprovalRequiredPlan(planId)

  const handleSelect = () => {
    if (approvalRequired) {
      openTeamAcademyRequest()
      return
    }
    selectPlan(planId)
  }

  return (
    <div className="landing-page plan-detail-page">
      <header className="landing-nav plan-detail-nav">
        <button type="button" className="landing-nav__brand landing-nav__brand--btn" onClick={openLanding}>
          <AppLogo size="md" />
        </button>
        <button type="button" className="btn btn--outline btn--small" onClick={openCoachPlanSelection}>
          View all plans
        </button>
      </header>

      <main className="plan-detail">
        <section className="plan-detail__hero">
          <p className="landing-eyebrow">SurfStar plan</p>
          <h1>{plan.name}</h1>
          <p className="plan-detail__tagline">{profile.tagline}</p>
          <p className="plan-detail__summary">{profile.summary}</p>

          <div className="plan-detail__price-block">
            <p className="pack-card__price plan-detail__price">
              <strong>{formatPlanPrice(plan, selectedBillingInterval)}</strong>
              <span>{formatPlanPriceSuffix(selectedBillingInterval)}</span>
            </p>
            {selectedBillingInterval === 'annual' ? (
              <p className="pack-card__annual-equiv muted">{formatAnnualBillingNote(plan)}</p>
            ) : null}
          </div>

          <BillingIntervalToggle
            className="billing-toggle--landing"
            value={selectedBillingInterval}
            onChange={setBillingInterval}
          />

          <button
            type="button"
            className={
              approvalRequired
                ? 'btn btn--secondary btn--lg plan-detail__cta'
                : plan.highlighted
                  ? 'btn btn--gold btn--lg plan-detail__cta'
                  : 'btn btn--secondary btn--lg plan-detail__cta'
            }
            onClick={handleSelect}
          >
            {approvalRequired ? 'Request Team Academy access' : `Choose ${plan.name}`}
          </button>

          <p className="plan-detail__ideal muted">
            <strong>Ideal for:</strong> {profile.idealFor}
          </p>
        </section>

        <section className="plan-detail__matrix landing-section">
          <div className="landing-section__head">
            <h2>Everything in {plan.name}</h2>
            <p className="landing-section__sub">
              Full checklist for this plan — included items are marked with a check.
            </p>
          </div>
          <ul className="plan-detail__checklist">
            {comparisonLabels.map((label) => {
              const included = planIncludesMarketingFeature(planId, label)
              return (
                <li
                  key={label}
                  className={
                    included
                      ? 'pack-card__feature pack-card__feature--yes'
                      : 'pack-card__feature pack-card__feature--no'
                  }
                >
                  <span className="pack-card__mark" aria-hidden="true">
                    {included ? '✓' : '—'}
                  </span>
                  {label}
                </li>
              )
            })}
          </ul>
        </section>

        {sections.map((section) => (
          <section key={section.id} className="plan-detail__section landing-section landing-section--alt">
            <div className="landing-section__head">
              <p className="landing-eyebrow">{section.label}</p>
              <h2>{section.label}</h2>
            </div>
            <div className="plan-detail__feature-grid">
              {section.items.map((item) => (
                  <article key={item.title} className="plan-detail__feature-card">
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </article>
                ))}
            </div>
          </section>
        ))}

        <section className="landing-cta-band plan-detail__footer-cta">
          <div>
            <p className="landing-eyebrow landing-eyebrow--gold">Ready to start?</p>
            <h2>Get {plan.name} today</h2>
            <p className="muted">Athletes join free — only the coach subscribes.</p>
          </div>
          <div className="landing-cta-band__actions">
            <button type="button" className="btn btn--gold btn--lg" onClick={handleSelect}>
              {approvalRequired ? 'Request access' : `Choose ${plan.name}`}
            </button>
            <button type="button" className="btn btn--outline btn--lg" onClick={openCoachPlanSelection}>
              Compare plans
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
