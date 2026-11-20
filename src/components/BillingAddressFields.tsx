import {
  getOtherBillingCountries,
  getPopularBillingCountries,
} from '../billingCountries'
import { regionRecommendedForCountry } from '../billingUtils'
import { useI18n } from '../i18n'

type Props = {
  street: string
  addressLine2: string
  city: string
  region: string
  postalCode: string
  countryCode: string
  onStreetChange: (value: string) => void
  onAddressLine2Change: (value: string) => void
  onCityChange: (value: string) => void
  onRegionChange: (value: string) => void
  onPostalCodeChange: (value: string) => void
  onCountryCodeChange: (value: string) => void
  variant?: 'auth' | 'form-pro'
}

export function BillingAddressFields({
  street,
  addressLine2,
  city,
  region,
  postalCode,
  countryCode,
  onStreetChange,
  onAddressLine2Change,
  onCityChange,
  onRegionChange,
  onPostalCodeChange,
  onCountryCodeChange,
  variant = 'auth',
}: Props) {
  const { messages } = useI18n()
  const b = messages.billing.address
  const fieldClass = variant === 'auth' ? 'auth-field' : 'field field--pro'
  const showRegion = regionRecommendedForCountry(countryCode)
  const popularCountries = getPopularBillingCountries()
  const otherCountries = getOtherBillingCountries()

  return (
    <fieldset className="billing-fields">
      <legend className="billing-fields__legend">{b.legend}</legend>
      <p className="billing-fields__hint">{b.hint}</p>

      <label className={fieldClass}>
        <span>{b.line1}</span>
        <input
          type="text"
          autoComplete="address-line1"
          value={street}
          onChange={(e) => onStreetChange(e.target.value)}
          placeholder={b.line1Placeholder}
          required
        />
      </label>

      <label className={fieldClass}>
        <span>
          {b.line2} <em className="billing-fields__optional">{b.line2Optional}</em>
        </span>
        <input
          type="text"
          autoComplete="address-line2"
          value={addressLine2}
          onChange={(e) => onAddressLine2Change(e.target.value)}
          placeholder={b.line2Placeholder}
        />
      </label>

      <div className="billing-fields__row">
        <label className={fieldClass}>
          <span>{b.postalCode}</span>
          <input
            type="text"
            autoComplete="postal-code"
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            placeholder={countryCode === 'PT' ? b.postalCodePlaceholderPt : b.postalCodePlaceholder}
            required
          />
        </label>

        <label className={fieldClass}>
          <span>{b.city}</span>
          <input
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder={b.cityPlaceholder}
            required
          />
        </label>
      </div>

      {showRegion ? (
        <label className={fieldClass}>
          <span>{b.region}</span>
          <input
            type="text"
            autoComplete="address-level1"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            placeholder={b.regionRequired}
            required
          />
        </label>
      ) : (
        <label className={fieldClass}>
          <span>
            {b.region} <em className="billing-fields__optional">{b.regionOptional}</em>
          </span>
          <input
            type="text"
            autoComplete="address-level1"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            placeholder={b.regionPlaceholderIfApplicable}
          />
        </label>
      )}

      <label className={fieldClass}>
        <span>{b.country}</span>
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          autoComplete="country"
          required
        >
          <option value="" disabled>
            {b.selectCountry}
          </option>
          <optgroup label={b.popularCountries}>
            {popularCountries.map((country) => (
              <option key={`popular-${country.code}`} value={country.code}>
                {country.name}
              </option>
            ))}
          </optgroup>
          <optgroup label={b.allCountries}>
            {otherCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </optgroup>
        </select>
      </label>
    </fieldset>
  )
}
