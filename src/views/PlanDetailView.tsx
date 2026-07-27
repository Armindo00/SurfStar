import { BillingIntervalToggle } from '../components/BillingIntervalToggle'
import { AppLogo } from '../components/AppLogo'
import { PlanFeaturePreview } from '../components/PlanFeaturePreview'
import {
  getPlanFeatureShowcases,
  PLAN_MARKETING_PROFILES,
} from '../planFeatureShowcases'
import {
  formatAnnualBillingNote,
  formatPlanPrice,
  formatPlanPriceSuffix,
  getPlan,
  isApprovalRequiredPlan,
  SUBSCRIPTION_PLANS,
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
    openPlanDetail,
    selectedBillingInterval,
    setBillingInterval,
  } = useApp()

  const plan = getPlan(planId)
  const profile = PLAN_MARKETING_PROFILES[planId]
  const showcases = getPlanFeatureShowcases(planId)
  const approvalRequired = isApprovalRequiredPlan(planId)
  const otherPlans = SUBSCRIPTION_PLANS.filter((entry) => entry.id !== planId)

  const handleSelect = () => {
    if (approvalRequired) {
      openTeamAcademyRequest()
      return
    }
    selectPlan(planId)
  }

  return (
    <div className={`plan-detail-page plan-detail-page--${planId}`}>
      <header className="plan-detail-nav">
        <button type="button" className="plan-detail-nav__brand" onClick={openLanding}>
          <AppLogo size="md" />
        </button>
        <nav className="plan-detail-nav__links" aria-label="Other plans">
          {otherPlans.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="plan-detail-nav__link"
              onClick={() => openPlanDetail(entry.id)}
            >
              {entry.name}
            </button>
          ))}
        </nav>
      </header>

      <section className="plan-detail__banner">
        <div className="plan-detail__banner-inner">
          <div className="plan-detail__banner-copy">
            {plan.highlighted ? <span className="plan-detail__badge">Most popular</span> : null}
            {approvalRequired ? (
              <span className="plan-detail__badge plan-detail__badge--muted">By approval</span>
            ) : null}
            <p className="plan-detail__eyebrow">SurfStar · {plan.name}</p>
            <h1>{profile.tagline}</h1>
            <p className="plan-detail__banner-summary">{profile.summary}</p>
            <p className="plan-detail__ideal">
              <strong>Ideal for:</strong> {profile.idealFor}
            </p>
          </div>
          <div className="plan-detail__banner-visual">
            <PlanFeaturePreview variant={profile.heroImage} size="hero" />
          </div>
        </div>
      </section>

      <main className="plan-detail">
        <aside className="plan-detail__pricing-panel">
          <p className="plan-detail__pricing-label">Subscription</p>
          <p className="plan-detail__price">
            <strong>{formatPlanPrice(plan, selectedBillingInterval)}</strong>
            <span>{formatPlanPriceSuffix(selectedBillingInterval)}</span>
          </p>
          {selectedBillingInterval === 'annual' ? (
            <p className="plan-detail__annual">{formatAnnualBillingNote(plan)}</p>
          ) : null}
          <BillingIntervalToggle
            className="billing-toggle--plan-detail"
            value={selectedBillingInterval}
            onChange={setBillingInterval}
          />
          <button
            type="button"
            className={
              approvalRequired
                ? 'btn btn--secondary btn--lg btn--block plan-detail__cta'
                : plan.highlighted
                  ? 'btn btn--gold btn--lg btn--block plan-detail__cta'
                  : 'btn btn--secondary btn--lg btn--block plan-detail__cta'
            }
            onClick={handleSelect}
          >
            {approvalRequired ? 'Request Team Academy access' : `Subscribe to ${plan.name}`}
          </button>
          <p className="plan-detail__note">Athletes join free — only the coach subscribes.</p>
          <ul className="plan-detail__pricing-perks">
            <li>{showcases.length} features included</li>
            <li>Mobile-first · works on the beach</li>
            <li>Cancel anytime</li>
          </ul>
        </aside>

        <section className="plan-detail__features">
          <div className="plan-detail__features-head">
            <p className="plan-detail__eyebrow">Included in {plan.name}</p>
            <h2>{showcases.length} professional coaching tools</h2>
            <p>
              Every feature below is part of this plan — with a structured app preview for each
              training type and workflow.
            </p>
          </div>

          {showcases.map((showcase, index) => (
            <article
              key={showcase.id}
              className={
                index % 2 === 1
                  ? 'plan-detail__feature plan-detail__feature--reverse'
                  : 'plan-detail__feature'
              }
            >
              <div className="plan-detail__feature-copy">
                <div className="plan-detail__feature-meta">
                  <span className="plan-detail__feature-category">{showcase.category}</span>
                  <span className="plan-detail__feature-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3>{showcase.title}</h3>
                <p className="plan-detail__feature-lead">{showcase.lead}</p>
                <ul className="plan-detail__feature-bullets">
                  {showcase.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
              <div className="plan-detail__feature-visual">
                <PlanFeaturePreview variant={showcase.id} />
              </div>
            </article>
          ))}
        </section>

        <section className="plan-detail__subscribe">
          <div className="plan-detail__subscribe-copy">
            <h2>Start coaching with {plan.name}</h2>
            <p>
              Join coaches who track every wave, every heat, and every athlete with SurfStar.
            </p>
            <p className="plan-detail__subscribe-price">
              <strong>{formatPlanPrice(plan, selectedBillingInterval)}</strong>
              {formatPlanPriceSuffix(selectedBillingInterval)}
              {selectedBillingInterval === 'annual' ? ` · ${formatAnnualBillingNote(plan)}` : null}
            </p>
          </div>
          <button type="button" className="btn btn--gold btn--lg" onClick={handleSelect}>
            {approvalRequired ? 'Request access' : `Subscribe to ${plan.name}`}
          </button>
        </section>
      </main>
    </div>
  )
}
