import { useEffect, useState } from 'react'
import {
  formatPlanPrice,
  formatPlanPriceSuffix,
  formatPlanPriceWithSuffix,
  getIncludedFeatureLabels,
  getPlan,
  getSelfServePlans,
  getStripePaymentLink,
  isApprovalRequiredPlan,
  type PlanId,
} from '../plans'
import { AppLogo } from '../components/AppLogo'
import { BillingIntervalToggle } from '../components/BillingIntervalToggle'
import { useApp } from '../AppContext'
import { buildStripeCheckoutUrl, isSubscriptionActive } from '../subscriptionApi'

export function CheckoutView() {
  const {
    auth,
    selectedPlanId,
    selectedBillingInterval,
    setBillingInterval,
    selectPlan,
    startCheckout,
    activateDemoSubscription,
    refreshSubscription,
    subscription,
    openLanding,
    openTeamAcademyRequest,
    logout,
    cloudMode,
  } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [awaitingPayment, setAwaitingPayment] = useState(false)

  const rawPlanId = selectedPlanId ?? subscription?.planId ?? 'team'
  const planId = isApprovalRequiredPlan(rawPlanId) ? 'team' : rawPlanId
  const plan = getPlan(planId)
  const stripeLink = getStripePaymentLink(planId, selectedBillingInterval)
  const isPending = subscription?.status === 'pending'
  const isActive = isSubscriptionActive(subscription)
  const approvalBlocked = isApprovalRequiredPlan(rawPlanId)

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
        auth?.role === 'treinador' ? auth.organizationId : undefined,
        selectedBillingInterval,
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

        {approvalBlocked ? (
          <div className="checkout-pending team-academy-request__banner">
            <p className="checkout-pending__title">Team Academy requires approval</p>
            <p className="muted">
              This plan is not available for instant checkout. Submit a request and we&apos;ll activate your
              organization after review.
            </p>
            <button type="button" className="btn btn--gold btn--block" onClick={openTeamAcademyRequest}>
              Request Team Academy
            </button>
          </div>
        ) : null}

        <BillingIntervalToggle value={selectedBillingInterval} onChange={setBillingInterval} />

        <div className="checkout-summary">
          <div>
            <span className="checkout-summary__label">Selected plan</span>
            <strong>{plan.name}</strong>
          </div>
          <div className="checkout-summary__price">
            <strong>{formatPlanPrice(plan, selectedBillingInterval)}</strong>
            <span>{formatPlanPriceSuffix(selectedBillingInterval)}</span>
          </div>
        </div>

        <label className="field field--login">
          <span>Change plan</span>
          <select
            value={planId}
            onChange={(e) => selectPlan(e.target.value as PlanId, { goToLogin: false })}
          >
            {getSelfServePlans().map((id) => {
              const item = getPlan(id)
              return (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatPlanPriceWithSuffix(item, selectedBillingInterval)}
                </option>
              )
            })}
          </select>
        </label>

        <ul className="checkout-features">
          {getIncludedFeatureLabels(planId).map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        {error ? <p className="login-error">{error}</p> : null}

        {!approvalBlocked ? (
          isPending || awaitingPayment ? (
            <div className="checkout-pending">
              <p className="checkout-pending__title">Waiting for payment confirmation…</p>
              <p className="muted">
                Complete payment in the Stripe window. Your account activates automatically within seconds.
              </p>
              <button
                type="button"
                className="btn btn--secondary btn--block"
                onClick={() => void refreshSubscription()}
                disabled={busy}
              >
                Check now
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--gold btn--block btn--lg"
              onClick={() => void handlePay()}
              disabled={busy}
            >
              {busy ? 'Processing…' : stripeLink ? 'Pay with Stripe' : `Activate ${plan.name}`}
            </button>
          )
        ) : null}

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
