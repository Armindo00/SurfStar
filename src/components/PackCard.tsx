import {
  formatAnnualBillingNote,
  formatPlanPrice,
  formatPlanPriceSuffix,
  getPlan,
  getVisibleComparisonFeatures,
  isApprovalRequiredPlan,
  planHasComparisonFeature,
  type BillingInterval,
  type PlanId,
} from '../plans'

type Props = {
  planId: PlanId
  billingInterval?: BillingInterval
  selected?: boolean
  onSelect: (planId: PlanId) => void
}

export function PackCard({ planId, billingInterval = 'monthly', selected, onSelect }: Props) {
  const plan = getPlan(planId)
  const approvalRequired = isApprovalRequiredPlan(planId)
  const visibleFeatures = getVisibleComparisonFeatures(planId)
  const includedFeatures = visibleFeatures.filter((feature) =>
    planHasComparisonFeature(planId, feature),
  )

  return (
    <article
      className={
        plan.highlighted
          ? 'pack-card pack-card--highlighted'
          : selected
            ? 'pack-card pack-card--selected'
            : approvalRequired
              ? 'pack-card pack-card--approval'
              : 'pack-card'
      }
    >
      {plan.highlighted ? <span className="pack-card__badge">Most popular</span> : null}
      {approvalRequired ? <span className="pack-card__badge pack-card__badge--muted">By approval</span> : null}

      <header className="pack-card__head">
        <h3 className="pack-card__name">{plan.name}</h3>
      </header>

      <p className="pack-card__price">
        <strong>{formatPlanPrice(plan, billingInterval)}</strong>
        <span>{formatPlanPriceSuffix(billingInterval)}</span>
      </p>

      {billingInterval === 'annual' ? (
        <p className="pack-card__annual-equiv muted">{formatAnnualBillingNote(plan)}</p>
      ) : null}

      {approvalRequired ? (
        <p className="pack-card__approval-note muted">For schools, clubs & federations — we review every request.</p>
      ) : null}

      <ul className="pack-card__features">
        {includedFeatures.map((feature) => (
          <li key={feature.label} className="pack-card__feature pack-card__feature--yes">
            <span className="pack-card__mark" aria-hidden="true">
              ✓
            </span>
            {feature.label}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={
          approvalRequired
            ? 'btn btn--secondary btn--block'
            : plan.highlighted
              ? 'btn btn--gold btn--block'
              : 'btn btn--secondary btn--block'
        }
        onClick={() => onSelect(planId)}
      >
        {approvalRequired ? 'Request access' : `Choose ${plan.name}`}
      </button>
    </article>
  )
}
