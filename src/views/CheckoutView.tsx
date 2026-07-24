import { useEffect, useState } from 'react'
import {
  formatPlanPrice,
  getIncludedFeatureLabels,
  getPlan,
  getStripePaymentLink,
  SUBSCRIPTION_PLANS,
  type PlanId,
} from '../plans'
import { AppLogo } from '../components/AppLogo'
import { useApp } from '../AppContext'
import { buildStripeCheckoutUrl, isSubscriptionActive } from '../subscriptionApi'

export function CheckoutView() {
  const {
    auth,
    selectedPlanId,
    selectPlan,
    startCheckout,
    activateDemoSubscription,
    refreshSubscription,
    subscription,
    openLanding,
    logout,
    cloudMode,
  } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [awaitingPayment, setAwaitingPayment] = useState(false)

  const planId = selectedPlanId ?? subscription?.planId ?? 'team'
  const plan = getPlan(planId)
  const stripeLink = getStripePaymentLink(planId)
  const isPending = subscription?.status === 'pending'
  const isActive = isSubscriptionActive(subscription)

  useEffect(() => {
    if (!awaitingPayment && !isPending) return
    if (isActive) return

    const timer = window.setInterval(() => {
      void refreshSubscription()
    }, 4000)

    return () => window.clearInterval(timer)
  }, [awaitingPayment, isPending, isActive, refreshSubscription])

  const handleActivateWithoutStripe = async () => {
    setError('')
    setBusy(true)
    try {
      const result = await activateDemoSubscription()
      if (!result.ok) setError(result.error)
    } finally {
      setBusy(false)
    }
  }

  const handlePay = async () => {
    setError('')
    setBusy(true)
    try {
      if (!stripeLink) {
        await handleActivateWithoutStripe()
        return
      }

      const checkoutResult = await startCheckout()
      if (!checkoutResult.ok) {
        setError(checkoutResult.error)
        return
      }

      const url = buildStripeCheckoutUrl(
        stripeLink,
        auth?.role === 'treinador' ? auth.coachId : '',
        auth?.email ?? '',
        planId,
      )
      window.open(url, '_blank', 'noopener,noreferrer')
      setAwaitingPayment(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <button type="button" className="checkout-back" onClick={openLanding}>
          ← Back
        </button>

        <div className="checkout-brand">
          <AppLogo size="lg" />
          <div>
            <h1>Activate subscription</h1>
            <p className="muted">Hi {auth?.name ?? 'coach'} — confirm your plan to enter the app.</p>
          </div>
        </div>

        <div className="checkout-summary">
          <div>
            <span className="checkout-summary__label">Selected plan</span>
            <strong>{plan.name}</strong>
          </div>
          <div className="checkout-summary__price">
            <strong>{formatPlanPrice(plan)}</strong>
            <span>/ month</span>
          </div>
        </div>

        <label className="field field--login">
          <span>Change plan</span>
          <select
            value={planId}
            onChange={(e) => selectPlan(e.target.value as PlanId, { goToLogin: false })}
          >
            {SUBSCRIPTION_PLANS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {formatPlanPrice(item)}/mo
              </option>
            ))}
          </select>
        </label>

        <ul className="checkout-features">
          {getIncludedFeatureLabels(planId).map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        {error ? <p className="login-error">{error}</p> : null}

        {isPending || awaitingPayment ? (
          <div className="checkout-pending">
            <p className="checkout-pending__title">Waiting for payment confirmation…</p>
            <p className="muted">
              Complete payment in the Stripe window. Your account activates automatically within seconds.
            </p>
            <button type="button" className="btn btn--secondary btn--block" onClick={() => void refreshSubscription()} disabled={busy}>
              Check now
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--gold btn--block btn--lg" onClick={() => void handlePay()} disabled={busy}>
            {busy ? 'Processing…' : stripeLink ? 'Pay with Stripe' : `Activate ${plan.name}`}
          </button>
        )}

        <p className="checkout-note muted">
          {stripeLink
            ? 'Secure payment via Stripe. Cancel anytime from the billing portal.'
            : cloudMode
              ? 'No Stripe configured — direct activation (demo mode on Supabase).'
              : 'Local mode: subscription is stored on this device.'}
        </p>

        <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  )
}
