import {
  getOtherBillingCountries,
  getPopularBillingCountries,
} from '../billingCountries'
import { regionRecommendedForCountry } from '../billingUtils'

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
  const fieldClass = variant === 'auth' ? 'auth-field' : 'field field--pro'
  const showRegion = regionRecommendedForCountry(countryCode)
  const popularCountries = getPopularBillingCountries()
  const otherCountries = getOtherBillingCountries()

  return (
    <fieldset className="billing-fields">
      <legend className="billing-fields__legend">Billing address</legend>
      <p className="billing-fields__hint">
        Legal address for invoices and tax compliance. We serve coaches worldwide.
      </p>

      <label className={fieldClass}>
        <span>Address line 1</span>
        <input
          type="text"
          autoComplete="address-line1"
          value={street}
          onChange={(e) => onStreetChange(e.target.value)}
          placeholder="Street and number"
          required
        />
      </label>

      <label className={fieldClass}>
        <span>Address line 2 <em className="billing-fields__optional">optional</em></span>
        <input
          type="text"
          autoComplete="address-line2"
          value={addressLine2}
          onChange={(e) => onAddressLine2Change(e.target.value)}
          placeholder="Apartment, suite, unit, etc."
        />
      </label>

      <div className="billing-fields__row">
        <label className={fieldClass}>
          <span>Postal / ZIP code</span>
          <input
            type="text"
            autoComplete="postal-code"
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value)}
            placeholder={countryCode === 'PT' ? '1200-001' : 'Postal or ZIP code'}
            required
          />
        </label>

        <label className={fieldClass}>
          <span>City</span>
          <input
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder="City"
            required
          />
        </label>
      </div>

      {showRegion ? (
        <label className={fieldClass}>
          <span>State / province / region</span>
          <input
            type="text"
            autoComplete="address-level1"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            placeholder="Required for this country"
            required
          />
        </label>
      ) : (
        <label className={fieldClass}>
          <span>
            State / province / region <em className="billing-fields__optional">optional</em>
          </span>
          <input
            type="text"
            autoComplete="address-level1"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            placeholder="If applicable"
          />
        </label>
      )}

      <label className={fieldClass}>
        <span>Country</span>
        <select
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          autoComplete="country"
          required
        >
          <option value="" disabled>
            Select country
          </option>
          <optgroup label="Popular">
            {popularCountries.map((country) => (
              <option key={`popular-${country.code}`} value={country.code}>
                {country.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="All countries">
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
