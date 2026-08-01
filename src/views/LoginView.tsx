import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { LegalFooterLinks } from '../components/LegalFooterLinks'
import { TermsAcceptanceField } from '../components/TermsAcceptanceField'
import {
  normalizeBillingAddress,
  normalizeTaxId,
  validateBillingAddressParts,
  validateTaxId,
  type BillingAddress,
} from '../billingUtils'
import { BillingAddressFields } from '../components/BillingAddressFields'
import { TaxIdField } from '../components/TaxIdField'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { formatPlanPriceWithSuffix, getPlan } from '../plans'
import { useApp } from '../AppContext'
import type { AuthPublicView } from '../types'

const SCREEN_COPY: Record<
  AuthPublicView,
  {
    roleLabel: string
    modeLabel: string
    title: string
    submit: string
    switchPrompt: string
    switchActionLabel: string
    otherRolePrompt: string
    otherRoleActionLabel: string
  }
> = {
  'coach-sign-in': {
    roleLabel: 'Coach',
    modeLabel: 'Sign in',
    title: 'Coach sign in',
    submit: 'Sign in',
    switchPrompt: 'New coach?',
    switchActionLabel: 'Create coach account',
    otherRolePrompt: 'Are you an athlete?',
    otherRoleActionLabel: 'Athlete sign in',
  },
  'coach-sign-up': {
    roleLabel: 'Coach',
    modeLabel: 'Create account',
    title: 'Create coach account',
    submit: 'Create coach account',
    switchPrompt: 'Already have a coach account?',
    switchActionLabel: 'Coach sign in',
    otherRolePrompt: 'Are you an athlete?',
    otherRoleActionLabel: 'Create athlete account',
  },
  'athlete-sign-in': {
    roleLabel: 'Athlete',
    modeLabel: 'Sign in',
    title: 'Athlete sign in',
    submit: 'Sign in',
    switchPrompt: 'New athlete?',
    switchActionLabel: 'Create athlete account',
    otherRolePrompt: 'Are you a coach?',
    otherRoleActionLabel: 'Coach sign in',
  },
  'athlete-sign-up': {
    roleLabel: 'Athlete',
    modeLabel: 'Create account',
    title: 'Create athlete account',
    submit: 'Create athlete account',
    switchPrompt: 'Already have an athlete account?',
    switchActionLabel: 'Athlete sign in',
    otherRolePrompt: 'Are you a coach?',
    otherRoleActionLabel: 'Create coach account',
  },
}

export function LoginView() {
  const {
    loginAsCoach,
    loginAsStudent,
    registerCoach,
    registerAthlete,
    cloudMode,
    publicView,
    selectedPlanId,
    selectedBillingInterval,
    openLanding,
    openForgotPassword,
    openCoachSignIn,
    openCoachPlanSelection,
    openAthleteSignIn,
    openAthleteSignUp,
    openPrivacy,
    openTerms,
  } = useApp()

  const screen = publicView as AuthPublicView
  const isCoach = screen.startsWith('coach')
  const isRegister = screen.endsWith('sign-up')

  const copy = (() => {
    const base = SCREEN_COPY[screen]
    const switchAction =
      screen === 'coach-sign-in'
        ? openCoachPlanSelection
        : screen === 'coach-sign-up'
          ? openCoachSignIn
          : screen === 'athlete-sign-in'
            ? openAthleteSignUp
            : openAthleteSignIn
    const otherRoleAction =
      isCoach
        ? screen === 'coach-sign-up'
          ? openAthleteSignUp
          : openAthleteSignIn
        : screen === 'athlete-sign-up'
          ? openCoachPlanSelection
          : openCoachSignIn
    return { ...base, switchAction, otherRoleAction }
  })()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [taxId, setTaxId] = useState('')
  const [billingStreet, setBillingStreet] = useState('')
  const [billingAddressLine2, setBillingAddressLine2] = useState('')
  const [billingPostalCode, setBillingPostalCode] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingRegion, setBillingRegion] = useState('')
  const [billingCountryCode, setBillingCountryCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const selectedPlan = selectedPlanId && isCoach ? getPlan(selectedPlanId) : null

  const goToAlternateScreen = () => {
    setError('')
    setName('')
    setTaxId('')
    setBillingStreet('')
    setBillingAddressLine2('')
    setBillingPostalCode('')
    setBillingCity('')
    setBillingRegion('')
    setBillingCountryCode('')
    setPasswordConfirm('')
    copy.switchAction()
  }

  const goToOtherRole = () => {
    setError('')
    setName('')
    setTaxId('')
    setBillingStreet('')
    setBillingAddressLine2('')
    setBillingPostalCode('')
    setBillingCity('')
    setBillingRegion('')
    setBillingCountryCode('')
    setPasswordConfirm('')
    copy.otherRoleAction()
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const trimmedEmail = email.trim()

      if (isRegister) {
        if (!acceptedTerms) {
          setError('Please accept the Terms of Service and Privacy Policy.')
          return
        }
        if (password !== passwordConfirm) {
          setError('Passwords do not match.')
          return
        }
        if (isCoach && cloudMode) {
          const taxError = validateTaxId(taxId, billingCountryCode)
          if (taxError) {
            setError(taxError)
            return
          }
          const billingDraft: BillingAddress = {
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
        }
        const billing: BillingAddress | undefined =
          isCoach && cloudMode
            ? normalizeBillingAddress({
                street: billingStreet,
                addressLine2: billingAddressLine2,
                postalCode: billingPostalCode,
                city: billingCity,
                region: billingRegion,
                countryCode: billingCountryCode,
              })
            : undefined
        const result = isCoach
          ? await registerCoach(
              name,
              trimmedEmail,
              password,
              billing
                ? { taxId: normalizeTaxId(taxId, billing.countryCode), billingAddress: billing }
                : undefined,
            )
          : await registerAthlete(name, trimmedEmail, password)
        if (!result.ok) setError(result.error ?? 'Could not create account.')
        return
      }

      const result = isCoach
        ? await loginAsCoach(trimmedEmail, password)
        : await loginAsStudent(trimmedEmail, password)
      if (!result.ok) setError(result.error ?? 'Sign in failed.')
    } catch (err) {
      console.error('Login submit failed', err)
      setError(err instanceof Error ? err.message : 'Sign in failed. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell onBack={openLanding} backLabel="Home" showTagline>
      <div className="auth-badges">
        <span className="auth-badge auth-badge--role">{copy.roleLabel}</span>
        <span className="auth-badge auth-badge--mode">{copy.modeLabel}</span>
      </div>

      <header className="auth-card__head auth-card__head--compact">
        <h2 className="auth-card__title">{copy.title}</h2>
      </header>

      {selectedPlan ? (
        <div className="auth-plan-banner">
          <span className="auth-plan-banner__label">Selected plan</span>
          <strong>
            {selectedPlan.name} · {formatPlanPriceWithSuffix(selectedPlan, selectedBillingInterval)}
          </strong>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        {isRegister ? (
          <label className="auth-field">
            <span>Full name</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCoach ? 'e.g. John Smith' : 'e.g. Jane Doe'}
              required
            />
          </label>
        ) : null}

        {isRegister && isCoach && cloudMode ? (
          <div className="auth-billing-block">
            <p className="auth-billing-block__title">Billing details</p>
            <p className="auth-billing-block__lead muted">
              Required for invoices and tax compliance. We bill coaches worldwide.
            </p>
            <TaxIdField
              value={taxId}
              countryCode={billingCountryCode}
              onChange={setTaxId}
              variant="auth"
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
              variant="auth"
            />
          </div>
        ) : null}

        <label className="auth-field">
          <span>Email address</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
            placeholder={isRegister ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Your password'}
            required
          />
        </label>

        {isRegister ? (
          <label className="auth-field">
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              placeholder="Repeat password"
              required
            />
          </label>
        ) : null}

        {isRegister ? (
          <TermsAcceptanceField
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            onPrivacy={openPrivacy}
            onTerms={openTerms}
          />
        ) : null}

        {error ? <p className="auth-alert auth-alert--error">{error}</p> : null}

        {!isRegister && cloudMode ? (
          <button
            type="button"
            className="auth-forgot"
            onClick={() => openForgotPassword(isCoach ? 'treinador' : 'atleta')}
          >
            Forgot password?
          </button>
        ) : null}

        <button type="submit" className="btn btn--primary btn--block btn--lg auth-submit" disabled={busy}>
          {busy
            ? 'Please wait…'
            : isRegister && selectedPlan
              ? `Create account · ${selectedPlan.name}`
              : copy.submit}
        </button>
      </form>

      <p className="auth-switch">
        {copy.switchPrompt}{' '}
        <button type="button" className="auth-switch__btn" onClick={goToAlternateScreen}>
          {copy.switchActionLabel}
        </button>
      </p>

      <p className="auth-switch auth-switch--muted">
        {copy.otherRolePrompt}{' '}
        <button type="button" className="auth-switch__btn" onClick={goToOtherRole}>
          {copy.otherRoleActionLabel}
        </button>
      </p>

      <LegalFooterLinks className="auth-legal-footer" onPrivacy={openPrivacy} onTerms={openTerms} layout="stack" />
    </AuthShell>
  )
}
