import { getTaxIdHint, getTaxIdLabel } from '../billingUtils'

type Props = {
  value: string
  countryCode: string
  onChange: (value: string) => void
  variant?: 'auth' | 'form-pro'
}

export function TaxIdField({ value, countryCode, onChange, variant = 'auth' }: Props) {
  const fieldClass = variant === 'auth' ? 'auth-field' : 'field field--pro'

  return (
    <label className={fieldClass}>
      <span>{getTaxIdLabel(countryCode)}</span>
      <input
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={countryCode === 'PT' ? '123456789' : 'Tax ID or VAT number'}
        required
      />
      <small className="billing-fields__hint billing-fields__hint--inline">
        {getTaxIdHint(countryCode)}
      </small>
    </label>
  )
}
