import { getTaxIdHint, getTaxIdLabel } from '../billingUtils'
import { useI18n } from '../i18n'

type Props = {
  value: string
  countryCode: string
  onChange: (value: string) => void
  variant?: 'auth' | 'form-pro'
}

export function TaxIdField({ value, countryCode, onChange, variant = 'auth' }: Props) {
  const { locale, messages } = useI18n()
  const taxId = messages.billing.taxId
  const fieldClass = variant === 'auth' ? 'auth-field' : 'field field--pro'

  return (
    <label className={fieldClass}>
      <span>{getTaxIdLabel(countryCode, locale)}</span>
      <input
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={countryCode === 'PT' ? taxId.placeholderPt : taxId.placeholderDefault}
        required
      />
      <small className="billing-fields__hint billing-fields__hint--inline">
        {getTaxIdHint(countryCode, locale)}
      </small>
    </label>
  )
}
