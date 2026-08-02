import { getAnnualSavingsLabel, type BillingInterval } from '../plans'
import { useI18n } from '../i18n'

type Props = {
  value: BillingInterval
  onChange: (interval: BillingInterval) => void
  className?: string
}

export function BillingIntervalToggle({ value, onChange, className }: Props) {
  const { messages } = useI18n()
  const b = messages.plans.billing
  const rootClass = className ? `billing-toggle ${className}` : 'billing-toggle'

  return (
    <div className={rootClass} role="group" aria-label={b.intervalLabel}>
      <button
        type="button"
        className={value === 'monthly' ? 'billing-toggle__btn billing-toggle__btn--active' : 'billing-toggle__btn'}
        onClick={() => onChange('monthly')}
        aria-pressed={value === 'monthly'}
      >
        {b.monthly}
      </button>
      <button
        type="button"
        className={value === 'annual' ? 'billing-toggle__btn billing-toggle__btn--active' : 'billing-toggle__btn'}
        onClick={() => onChange('annual')}
        aria-pressed={value === 'annual'}
      >
        {b.annual}
        <span className="billing-toggle__save">{getAnnualSavingsLabel()}</span>
      </button>
    </div>
  )
}
