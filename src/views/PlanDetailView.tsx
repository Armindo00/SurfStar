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
    <div className="plan-detail-page">
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

      <main className="plan-detail">
        <section className="plan-detail__hero">
          <div className="plan-detail__hero-copy">
            {plan.highlighted ? <span className="plan-detail__badge">Most popular</span> : null}
            {approvalRequired ? (
              <span className="plan-detail__badge plan-detail__badge--muted">By approval</span>
            ) : null}
            <p className="plan-detail__eyebrow">SurfStar plan</p>
            <h1>{plan.name}</h1>
            <p className="plan-detail__tagline">{profile.tagline}</p>
            <p className="plan-detail__summary">{profile.summary}</p>
            <p className="plan-detail__ideal">
              <strong>Ideal for:</strong> {profile.idealFor}
            </p>

            <div className="plan-detail__pricing">
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
            </div>
          </div>

          <div className="plan-detail__hero-visual">
            <PlanFeaturePreview variant={profile.heroImage} />
          </div>
        </section>

        <section className="plan-detail__features">
          <div className="plan-detail__features-head">
            <h2>What&apos;s included in {plan.name}</h2>
            <p>Every feature below is part of this plan — with a live app preview for each one.</p>
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
            <h2>Ready to start with {plan.name}?</h2>
            <p>
              <strong>{formatPlanPrice(plan, selectedBillingInterval)}</strong>
              {formatPlanPriceSuffix(selectedBillingInterval)}
              {selectedBillingInterval === 'annual' ? ` · ${formatAnnualBillingNote(plan)}` : null}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--gold btn--lg"
            onClick={handleSelect}
          >
            {approvalRequired ? 'Request access' : `Subscribe to ${plan.name}`}
          </button>
        </section>
      </main>
    </div>
  )
}
