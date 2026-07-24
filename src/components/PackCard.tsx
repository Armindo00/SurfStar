import { formatPlanPrice, getPlan, type PlanId } from '../plans'

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
      {plan.highlighted ? <span className="pack-card__badge">Mais popular</span> : null}

      <header className="pack-card__head">
        <h3 className="pack-card__name">{plan.name}</h3>
        <p className="pack-card__tagline">{plan.tagline}</p>
      </header>

      <p className="pack-card__price">
        <strong>{formatPlanPrice(plan)}</strong>
        <span>/ mês</span>
      </p>

      <p className="pack-card__limit">
        {plan.maxAthletes === null ? 'Atletas ilimitados' : `Até ${plan.maxAthletes} atletas`}
      </p>

      <ul className="pack-card__features">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <button
        type="button"
        className={plan.highlighted ? 'btn btn--primary btn--block' : 'btn btn--secondary btn--block'}
        onClick={() => onSelect(planId)}
      >
        Escolher {plan.name}
      </button>
    </article>
  )
}
