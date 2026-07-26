import { getAnnualSavingsLabel, type BillingInterval } from '../plans'

type Props = {
  value: BillingInterval
  onChange: (interval: BillingInterval) => void
  className?: string
}

export function BillingIntervalToggle({ value, onChange, className }: Props) {
  const rootClass = className ? `billing-toggle ${className}` : 'billing-toggle'

  return (
    <div className={rootClass} role="group" aria-label="Billing interval">
      <button
        type="button"
        className={value === 'monthly' ? 'billing-toggle__btn billing-toggle__btn--active' : 'billing-toggle__btn'}
        onClick={() => onChange('monthly')}
        aria-pressed={value === 'monthly'}
      >
        Monthly
      </button>
      <button
        type="button"
        className={value === 'annual' ? 'billing-toggle__btn billing-toggle__btn--active' : 'billing-toggle__btn'}
        onClick={() => onChange('annual')}
        aria-pressed={value === 'annual'}
      >
        Annual
        <span className="billing-toggle__save">{getAnnualSavingsLabel()}</span>
      </button>
    </div>
  )
}
