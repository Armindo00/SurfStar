import {
  formatPlanPrice,
  getPlan,
  PLAN_COMPARISON_FEATURES,
  planHasComparisonFeature,
  type PlanId,
} from '../plans'

type Props = {
  planId: PlanId
  selected?: boolean
  onSelect: (planId: PlanId) => void
}

export function PackCard({ planId, selected, onSelect }: Props) {
  const plan = getPlan(planId)
  const includedFeatures = PLAN_COMPARISON_FEATURES.filter((feature) =>
    planHasComparisonFeature(planId, feature),
  )
  const excludedFeatures = PLAN_COMPARISON_FEATURES.filter(
    (feature) => !planHasComparisonFeature(planId, feature),
  )

  return (
    <article
      className={
        plan.highlighted
          ? 'pack-card pack-card--highlighted'
          : selected
            ? 'pack-card pack-card--selected'
            : 'pack-card'
      }
    >
      {plan.highlighted ? <span className="pack-card__badge">Most popular</span> : null}

      <header className="pack-card__head">
        <h3 className="pack-card__name">{plan.name}</h3>
      </header>

      <p className="pack-card__price">
        <strong>{formatPlanPrice(plan)}</strong>
        <span>/ month</span>
      </p>

      <ul className="pack-card__features">
        {includedFeatures.map((feature) => (
          <li key={feature.label} className="pack-card__feature pack-card__feature--yes">
            <span className="pack-card__mark" aria-hidden="true">
              ✓
            </span>
            {feature.label}
          </li>
        ))}
        {includedFeatures.length > 0 && excludedFeatures.length > 0 ? (
          <li className="pack-card__features-divider" aria-hidden="true" />
        ) : null}
        {excludedFeatures.map((feature) => (
          <li key={feature.label} className="pack-card__feature pack-card__feature--no">
            <span className="pack-card__mark" aria-hidden="true">
              ✗
            </span>
            {feature.label}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={plan.highlighted ? 'btn btn--gold btn--block' : 'btn btn--secondary btn--block'}
        onClick={() => onSelect(planId)}
      >
        Choose {plan.name}
      </button>
    </article>
  )
}
