import { useState, type FormEvent } from 'react'
import { AppLogo } from '../components/AppLogo'
import { BillingIntervalToggle } from '../components/BillingIntervalToggle'
import { ManualBillingNotice } from '../components/ManualBillingNotice'
import {
  normalizeBillingAddress,
  normalizeTaxId,
  validateBillingAddressParts,
  validateTaxId,
} from '../billingUtils'
import { BillingAddressFields } from '../components/BillingAddressFields'
import { TaxIdField } from '../components/TaxIdField'
import { useApp } from '../AppContext'
import { isValidEmail, normalizeEmail } from '../passwordUtils'
import {
  formatPlanPriceWithSuffix,
  formatPlanTotalPrice,
  getPlan,
  usesManualPaymentFlow,
} from '../plans'
import { submitOrganizationPlanRequest } from '../organizationPlanRequestApi'

export function TeamAcademyRequestView() {
  const { openLanding, openCoachSignIn, cloudMode, selectedBillingInterval, setBillingInterval } = useApp()
  const plan = getPlan('organization')
  const manualFlow = usesManualPaymentFlow()

  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [taxId, setTaxId] = useState('')
  const [billingStreet, setBillingStreet] = useState('')
  const [billingAddressLine2, setBillingAddressLine2] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingRegion, setBillingRegion] = useState('')
  const [billingCountryCode, setBillingCountryCode] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [coachesCount, setCoachesCount] = useState('5')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedName = contactName.trim()
    const trimmedOrg = organizationName.trim()
    const normalized = normalizeEmail(email)

    if (!trimmedName) {
      setError('Enter your name.')
      return
    }
    if (!isValidEmail(normalized)) {
      setError('Enter a valid email.')
      return
    }
    if (trimmedOrg.length < 2) {
      setError('Enter your school, club, or federation name.')
      return
    }

    const taxError = validateTaxId(taxId, billingCountryCode)
    if (taxError) {
      setError(taxError)
      return
    }

    const billingDraft = {
      street: billingStreet,
      addressLine2: billingAddressLine2,
      postalCode: billingPostalCode,
      city: billingCity,
      region: billingRegion,
      countryCode: billingCountryCode,
    }
    const addressError = validateBillingAddressParts(billingDraft)
    if (addressError) {
      setError(addressError)
      return
    }

    const billingAddress = normalizeBillingAddress(billingDraft)

    setBusy(true)
    try {
      const result = await submitOrganizationPlanRequest(
        {
          contactName: trimmedName,
          email: normalized,
          organizationName: trimmedOrg,
          coachesCount: coachesCount ? Number(coachesCount) : null,
          message,
          planId: 'organization',
          billingInterval: selectedBillingInterval,
          taxId: normalizeTaxId(taxId, billingAddress.countryCode),
          billingAddress,
        },
        cloudMode,
      )

      if (!result.ok) {
        setError(result.error)
        return
      }

      setSubmitted(true)
    } finally {
      setBusy(false)
    }
  }

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--wide">
          <AppLogo size="xl" />
          <h1 className="auth-title">Request received</h1>
          <ManualBillingNotice variant="submitted" email={email.trim() || undefined} />
          <p className="muted auth-lead">
            Thanks — we&apos;ll review your Team Academy request and email you within 2 business days.
          </p>
          <button type="button" className="btn btn--gold btn--block" onClick={openLanding}>
            Back to home
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={openCoachSignIn}>
            Already approved? Coach sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--wide">
        <button type="button" className="checkout-back" onClick={openLanding}>
          ← Back
        </button>

        <AppLogo size="xl" />
        <h1 className="auth-title">Request Team Academy</h1>
        <p className="muted auth-lead">
          For schools, federations, and surf academies worldwide. Up to 5 coaches on one shared roster —{' '}
          {formatPlanPriceWithSuffix(plan, selectedBillingInterval)} or{' '}
          {formatPlanTotalPrice(plan, 'annual')} billed annually after approval.
        </p>

        <BillingIntervalToggle value={selectedBillingInterval} onChange={setBillingInterval} />

        <ul className="checkout-features team-academy-request__features">
          <li>Manual review — payment after approval</li>
          <li>Shared athletes, sessions & analytics for your staff</li>
          <li>Everything included in Coach Premium</li>
        </ul>

        <form className="form-pro" onSubmit={(e) => void submit(e)}>
          <label className="field field--pro">
            <span>Your name</span>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
          </label>
          <label className="field field--pro">
            <span>Work email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="field field--pro">
            <span>School / club / federation</span>
            <input
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Cascais Surf Academy"
              required
            />
          </label>

          <TaxIdField
            value={taxId}
            countryCode={billingCountryCode}
            onChange={setTaxId}
            variant="form-pro"
          />
          <BillingAddressFields
            street={billingStreet}
            addressLine2={billingAddressLine2}
            city={billingCity}
            region={billingRegion}
            postalCode={billingPostalCode}
            countryCode={billingCountryCode}
            onStreetChange={setBillingStreet}
            onAddressLine2Change={setBillingAddressLine2}
            onCityChange={setBillingCity}
            onRegionChange={setBillingRegion}
            onPostalCodeChange={setBillingPostalCode}
            onCountryCodeChange={setBillingCountryCode}
            variant="form-pro"
          />

          <label className="field field--pro">
            <span>Coaches needed</span>
            <select value={coachesCount} onChange={(e) => setCoachesCount(e.target.value)}>
              {[2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  {n} coaches
                </option>
              ))}
            </select>
          </label>
          <label className="field field--pro">
            <span>Message (optional)</span>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your program, number of athletes, etc."
            />
          </label>

          {error ? <p className="login-error">{error}</p> : null}

          <button type="submit" className="btn btn--gold btn--block btn--lg" disabled={busy}>
            {busy ? 'Sending…' : 'Submit request'}
          </button>
        </form>

        <p className="checkout-note muted">
          {manualFlow
            ? 'All plans use manual billing at launch. Choose Coach or Coach Premium on the pricing page to register first.'
            : 'Need a solo plan today? Choose Coach or Coach Premium on the pricing page — instant activation.'}
        </p>
      </div>
    </div>
  )
}
