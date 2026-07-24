import { useState, type FormEvent } from 'react'
import { formatPlanPrice, getPlan } from '../plans'
import { athleteLimitMessage } from '../planUtils'
import { getStripeBillingPortalUrl } from '../subscriptionApi'
import { ScreenHeader } from '../components/ScreenHeader'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { useApp } from '../AppContext'

export function SubscriptionView() {
  const {
    subscription,
    coachAthletes,
    refreshSubscription,
    changePassword,
    setView,
    cloudMode,
  } = useApp()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)

  const plan = subscription ? getPlan(subscription.planId) : null
  const billingPortal = getStripeBillingPortalUrl()
  const activeCount = coachAthletes.filter((a) => !a.blocked).length

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')
    if (password !== passwordConfirm) {
      setPwdError('Passwords do not match.')
      return
    }
    setPwdBusy(true)
    try {
      const result = await changePassword(password)
      if (!result.ok) {
        setPwdError(result.error)
        return
      }
      setPassword('')
      setPasswordConfirm('')
      setPwdSuccess('Password updated.')
    } finally {
      setPwdBusy(false)
    }
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title="Account & subscription" onBack={() => setView('coach-home')} />

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">Current plan</h2>
        {plan ? (
          <>
            <p className="stats-panel__plan-name">
              <strong>{plan.name}</strong> — {formatPlanPrice(plan)}/mo
            </p>
            <p className="muted">{plan.tagline}</p>
            <p className="muted">{athleteLimitMessage(plan.id)} · {activeCount} active athletes</p>
            {subscription?.currentPeriodEnd ? (
              <p className="muted">
                Renews:{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            ) : null}
            <div className="stats-panel__actions">
              {billingPortal ? (
                <a className="btn btn--gold btn--block" href={billingPortal} target="_blank" rel="noreferrer">
                  Manage subscription (Stripe)
                </a>
              ) : (
                <p className="muted">To change plans, configure the Stripe Customer Portal or contact support.</p>
              )}
              {cloudMode ? (
                <button type="button" className="btn btn--ghost btn--block" onClick={() => void refreshSubscription()}>
                  Refresh status
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="muted">No active subscription.</p>
        )}
      </div>

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">Change password</h2>
        <form className="form-pro" onSubmit={(e) => void submitPassword(e)}>
          <label className="field field--pro">
            <span>New password</span>
            <input
              type="password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="field field--pro">
            <span>Confirm password</span>
            <input
              type="password"
              minLength={MIN_PASSWORD_LENGTH}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          {pwdError ? <p className="login-error">{pwdError}</p> : null}
          {pwdSuccess ? <p className="login-success">{pwdSuccess}</p> : null}
          <button type="submit" className="btn btn--primary btn--block" disabled={pwdBusy}>
            {pwdBusy ? 'Saving…' : 'Save password'}
          </button>
        </form>
      </div>
    </div>
  )
}
