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
        {PLAN_COMPARISON_FEATURES.map((feature) => {
          const included = planHasComparisonFeature(planId, feature)
          return (
            <li
              key={feature.label}
              className={included ? 'pack-card__feature pack-card__feature--yes' : 'pack-card__feature pack-card__feature--no'}
            >
              <span className="pack-card__mark" aria-hidden="true">
                {included ? '✓' : '✗'}
              </span>
              {feature.label}
            </li>
          )
        })}
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
