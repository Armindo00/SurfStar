import { useState, type FormEvent } from 'react'
import { AppLogo } from '../components/AppLogo'
import { useApp } from '../AppContext'
import { isValidEmail, normalizeEmail } from '../passwordUtils'
import { formatPlanPriceWithSuffix, getPlan } from '../plans'
import { submitOrganizationPlanRequest } from '../organizationPlanRequestApi'

export function TeamAcademyRequestView() {
  const { openLanding, openCoachSignIn, cloudMode } = useApp()
  const plan = getPlan('organization')

  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
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

    setBusy(true)
    try {
      const result = await submitOrganizationPlanRequest(
        {
          contactName: trimmedName,
          email: normalized,
          organizationName: trimmedOrg,
          coachesCount: coachesCount ? Number(coachesCount) : null,
          message,
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
          <p className="muted auth-lead">
            Thanks — we&apos;ll review your Team Academy request and email you within 2 business days.
            Once approved, we activate your organization and send payment details.
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
          For schools, federations, and surf academies. Up to 5 coaches on one shared roster —{' '}
          {formatPlanPriceWithSuffix(plan, 'monthly')} or {formatPlanPriceWithSuffix(plan, 'annual')} after approval.
        </p>

        <ul className="checkout-features team-academy-request__features">
          <li>Manual review — no self-checkout</li>
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
          Need a solo plan today? Choose Coach or Coach Premium on the pricing page — instant activation.
        </p>
      </div>
    </div>
  )
}
