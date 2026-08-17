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
import { resolveAuthErrorMessage } from '../authErrors'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { formatPlanPriceWithSuffix, getPlan } from '../plans'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import type { AuthPublicView } from '../types'

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
  const { t, messages } = useI18n()

  const screen = publicView as AuthPublicView
  const isCoach = screen.startsWith('coach')
  const isRegister = screen.endsWith('sign-up')

  const copy = (() => {
    const base = messages.auth.screens[screen]
    const switchAction =
      screen === 'coach-sign-in'
        ? openCoachPlanSelection
        : screen === 'coach-sign-up'
          ? openCoachSignIn
          : screen === 'athlete-sign-in'
            ? openAthleteSignUp
            : openAthleteSignIn
    const otherRoleAction = isCoach
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

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const form = e.currentTarget
      const fd = new FormData(form)
      const trimmedEmail = String(fd.get('email') ?? email).trim()
      const formPassword = String(fd.get('password') ?? password)
      const formName = String(fd.get('name') ?? name).trim()
      const formPasswordConfirm = String(fd.get('passwordConfirm') ?? passwordConfirm)

      if (isRegister) {
        if (!acceptedTerms) {
          setError(t('auth.acceptTermsError'))
          return
        }
        if (formPassword !== formPasswordConfirm) {
          setError(t('auth.passwordsMismatch'))
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
              formName,
              trimmedEmail,
              formPassword,
              billing
                ? { taxId: normalizeTaxId(taxId, billing.countryCode), billingAddress: billing }
                : undefined,
            )
          : await registerAthlete(formName, trimmedEmail, formPassword)
        if (!result.ok) setError(result.error ?? t('errors.createAccountFailed'))
        return
      }

      const result = isCoach
        ? await loginAsCoach(trimmedEmail, formPassword)
        : await loginAsStudent(trimmedEmail, formPassword)
      if (!result.ok) setError(resolveAuthErrorMessage(result.error, t))
    } catch (err) {
      console.error('Login submit failed', err)
      setError(err instanceof Error ? err.message : t('errors.signInConnection'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell onBack={openLanding} backLabel={t('auth.home')} showTagline>
      <div className="auth-badges">
        <span className="auth-badge auth-badge--role">{copy.roleLabel}</span>
        <span className="auth-badge auth-badge--mode">{copy.modeLabel}</span>
      </div>

      <header className="auth-card__head auth-card__head--compact">
        <h2 className="auth-card__title">{copy.title}</h2>
      </header>

      {selectedPlan ? (
        <div className="auth-plan-banner">
          <span className="auth-plan-banner__label">{t('auth.selectedPlan')}</span>
          <strong>
            {selectedPlan.name} · {formatPlanPriceWithSuffix(selectedPlan, selectedBillingInterval)}
          </strong>
        </div>
      ) : null}

      <form className="auth-form" onSubmit={(e) => void submit(e)}>
        {isRegister ? (
          <label className="auth-field">
            <span>{t('auth.fullName')}</span>
            <input
              type="text"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isCoach ? t('auth.namePlaceholderCoach') : t('auth.namePlaceholderAthlete')}
              required
            />
          </label>
        ) : null}

        {isRegister && isCoach && cloudMode ? (
          <div className="auth-billing-block">
            <p className="auth-billing-block__title">{t('auth.billingDetails')}</p>
            <p className="auth-billing-block__lead muted">{t('auth.billingDetailsLead')}</p>
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
          <span>{t('auth.emailAddress')}</span>
          <input
            type="email"
            name="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
            required
          />
        </label>

        <label className="auth-field">
          <span>{t('auth.password')}</span>
          <input
            type="password"
            name="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
            placeholder={
              isRegister
                ? t('auth.passwordPlaceholderNew', { minLength: MIN_PASSWORD_LENGTH })
                : t('auth.passwordPlaceholderSignIn')
            }
            required
          />
        </label>

        {isRegister ? (
          <label className="auth-field">
            <span>{t('auth.confirmPassword')}</span>
            <input
              type="password"
              name="passwordConfirm"
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              placeholder={t('auth.confirmPasswordPlaceholder')}
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
            {t('auth.forgotPassword')}
          </button>
        ) : null}

        <button type="submit" className="btn btn--primary btn--block btn--lg auth-submit" disabled={busy}>
          {busy
            ? t('auth.pleaseWait')
            : isRegister && selectedPlan
              ? t('auth.createAccountWithPlan', { planName: selectedPlan.name })
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
