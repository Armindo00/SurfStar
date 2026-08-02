import {
  formatAnnualBillingNote,
  formatPlanPrice,
  formatPlanPriceSuffix,
  getPlan,
  getVisibleComparisonFeatures,
  isApprovalRequiredPlan,
  planHasComparisonFeature,
  usesManualPaymentFlow,
  type BillingInterval,
  type PlanId,
} from '../plans'
import { useI18n } from '../i18n'

type Props = {
  planId: PlanId
  billingInterval?: BillingInterval
  selected?: boolean
  onSelect: (planId: PlanId) => void
  onOpenDetail?: (planId: PlanId) => void
}

export function PackCard({
  planId,
  billingInterval = 'monthly',
  selected,
  onSelect,
  onOpenDetail,
}: Props) {
  const { messages, t } = useI18n()
  const p = messages.plans.packCard
  const plan = getPlan(planId)
  const approvalRequired = isApprovalRequiredPlan(planId)
  const manualFlow = usesManualPaymentFlow()
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
      <div className="pack-card__badges">
        {plan.highlighted ? <span className="pack-card__badge">{p.mostPopular}</span> : null}
        {approvalRequired ? (
          <span className="pack-card__badge pack-card__badge--muted">{p.byApproval}</span>
        ) : null}
      </div>

      <header className="pack-card__head">
        <button
          type="button"
          className="pack-card__name-link"
          onClick={() => onOpenDetail?.(planId)}
        >
          <h3 className="pack-card__name">{plan.name}</h3>
          {onOpenDetail ? <span className="pack-card__name-hint">{p.seeAllFeatures}</span> : null}
        </button>
      </header>

      <p className="pack-card__price">
        <strong>{formatPlanPrice(plan, billingInterval)}</strong>
        <span>{formatPlanPriceSuffix(billingInterval)}</span>
      </p>

      {billingInterval === 'annual' ? (
        <p className="pack-card__annual-equiv muted">{formatAnnualBillingNote(plan)}</p>
      ) : null}

      {approvalRequired ? (
        <p className="pack-card__approval-note muted">{p.approvalNote}</p>
      ) : null}
      {manualFlow ? <p className="pack-card__approval-note muted">{p.manualFlowNote}</p> : null}

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
        {approvalRequired
          ? p.requestAccess
          : manualFlow
            ? t('plans.packCard.getPlan', { planName: plan.name })
            : t('plans.packCard.choosePlan', { planName: plan.name })}
      </button>

      {onOpenDetail ? (
        <button type="button" className="pack-card__detail-link" onClick={() => onOpenDetail(planId)}>
          {p.compareFullList}
        </button>
      ) : null}
    </article>
  )
}
