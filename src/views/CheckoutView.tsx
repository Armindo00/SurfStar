import { useCallback, useEffect, useState } from 'react'
import {
  formatPlanPrice,
  formatPlanPriceSuffix,
  formatPlanTotalPrice,
  getCheckoutPlans,
  getIncludedFeatureLabels,
  getPlan,
  getSelfServePlans,
  getStripePaymentLink,
  isApprovalRequiredPlan,
  type PlanId,
  usesManualPaymentFlow,
} from '../plans'
import { AppLogo } from '../components/AppLogo'
import { BillingIntervalToggle } from '../components/BillingIntervalToggle'
import { useApp } from '../AppContext'
import { buildStripeCheckoutUrl, isSubscriptionActive } from '../subscriptionApi'
import { isDemoSubscriptionEnabled } from '../config'
import { fetchCoachPlanRequest, submitOrganizationPlanRequest, type CoachPlanRequest } from '../organizationPlanRequestApi'
import { formatAppDateTime } from '../dateFormat'

function requestStatusLabel(request: CoachPlanRequest): string {
  if (request.activated_at) return 'Active'
  if (request.status === 'pending') return 'Pending review'
  if (request.status === 'approved' && request.payment_status === 'unpaid') return 'Awaiting payment'
  if (request.status === 'approved') return 'Approved'
  return request.status
}

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
  const [openRequest, setOpenRequest] = useState<CoachPlanRequest | null>(null)

  const rawPlanId = selectedPlanId ?? subscription?.planId ?? 'team'
  const planId = isApprovalRequiredPlan(rawPlanId) ? 'team' : rawPlanId
  const plan = getPlan(planId)
  const stripeLink = getStripePaymentLink(planId, selectedBillingInterval)
  const manualFlow = usesManualPaymentFlow()
  const isPending = subscription?.status === 'pending'
  const isActive = isSubscriptionActive(subscription)
  const approvalBlocked = isApprovalRequiredPlan(rawPlanId)
  const demoActivationAllowed = !cloudMode || isDemoSubscriptionEnabled()

  const loadOpenRequest = useCallback(async () => {
    if (!cloudMode || !manualFlow) return
    const result = await fetchCoachPlanRequest()
    if (result.ok) setOpenRequest(result.request)
  }, [cloudMode, manualFlow])

  useEffect(() => {
    void loadOpenRequest()
  }, [loadOpenRequest])

  useEffect(() => {
    if (manualFlow) return
    if (!awaitingPayment && !isPending) return
    if (isActive) return

    const timer = window.setInterval(() => {
      void refreshSubscription()
    }, 4000)

    return () => window.clearInterval(timer)
  }, [awaitingPayment, isPending, isActive, refreshSubscription, manualFlow])

  useEffect(() => {
    if (manualFlow && openRequest?.activated_at) {
      void refreshSubscription()
    }
  }, [manualFlow, openRequest?.activated_at, refreshSubscription])

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

  const handleSubmitPaymentRequest = async () => {
    if (!auth || auth.role !== 'treinador') {
      setError('Sign in as coach first.')
      return
    }

    setError('')
    setBusy(true)
    try {
      const result = await submitOrganizationPlanRequest(
        {
          contactName: auth.name,
          email: auth.email,
          organizationName: auth.organizationName || `${auth.name}'s Team`,
          planId: planId as PlanId,
          billingInterval: selectedBillingInterval,
          message: `Payment request submitted from checkout for ${plan.name} (${selectedBillingInterval}).`,
        },
        cloudMode,
      )
      if (!result.ok) {
        setError(result.error)
        return
      }
      await loadOpenRequest()
    } finally {
      setBusy(false)
    }
  }

  const handlePay = async () => {
    setError('')
    setBusy(true)
    try {
      if (manualFlow) {
        await handleSubmitPaymentRequest()
        return
      }

      if (!stripeLink) {
        if (!demoActivationAllowed) {
          setError('Online payment is not configured yet. Contact support to activate your plan.')
          return
        }
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

  const planOptions = manualFlow ? getCheckoutPlans() : getSelfServePlans()

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <button type="button" className="checkout-back" onClick={openLanding}>
          ← Back
        </button>

        <div className="checkout-brand">
          <AppLogo size="lg" />
          <div>
            <h1>{manualFlow ? 'Request plan access' : 'Activate subscription'}</h1>
            <p className="muted">
              Hi {auth?.name ?? 'coach'} —{' '}
              {manualFlow
                ? 'submit your payment request and we will activate your account after confirmation.'
                : 'confirm your plan to enter the app.'}
            </p>
          </div>
        </div>

        {approvalBlocked ? (
          <div className="checkout-pending team-academy-request__banner">
            <p className="checkout-pending__title">Team Academy requires approval</p>
            <p className="muted">
              This plan is not available for instant checkout. Submit a request and we&apos;ll activate your
              organization after review and payment.
            </p>
            <button type="button" className="btn btn--gold btn--block" onClick={openTeamAcademyRequest}>
              Request Team Academy
            </button>
          </div>
        ) : null}

        {!approvalBlocked ? (
          <>
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

            {manualFlow ? (
              <p className="checkout-manual-total muted">
                Total due: <strong>{formatPlanTotalPrice(plan, selectedBillingInterval)}</strong>
                {selectedBillingInterval === 'annual' ? ' / year' : ' / month'} — payment by bank transfer or MB Way
                after approval.
              </p>
            ) : null}

            <label className="field field--login">
              <span>Change plan</span>
              <select
                value={planId}
                onChange={(e) => selectPlan(e.target.value as PlanId, { goToLogin: false })}
              >
                {planOptions.map((id) => {
                  const item = getPlan(id)
                  return (
                    <option key={item.id} value={item.id}>
                      {item.name}
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

            {manualFlow && openRequest ? (
              <div className="checkout-pending checkout-pending--manual">
                <p className="checkout-pending__title">Payment request submitted</p>
                <dl className="checkout-request-meta">
                  <div>
                    <dt>Status</dt>
                    <dd>{requestStatusLabel(openRequest)}</dd>
                  </div>
                  <div>
                    <dt>Plan</dt>
                    <dd>{getPlan(openRequest.plan_id).name}</dd>
                  </div>
                  <div>
                    <dt>Billing</dt>
                    <dd>{openRequest.billing_interval === 'annual' ? 'Annual' : 'Monthly'}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>{formatAppDateTime(openRequest.created_at, { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
                  </div>
                </dl>
                <p className="muted">
                  {openRequest.status === 'pending'
                    ? 'We will review your request and email you payment details (IBAN / MB Way) within 2 business days.'
                    : openRequest.status === 'approved' && openRequest.payment_status === 'unpaid'
                      ? 'Your request was approved. Complete payment using the details we sent, then we activate your account.'
                      : 'Your request is being processed.'}
                </p>
                <button
                  type="button"
                  className="btn btn--secondary btn--block"
                  onClick={() => void loadOpenRequest()}
                  disabled={busy}
                >
                  Refresh status
                </button>
              </div>
            ) : manualFlow ? (
              <button
                type="button"
                className="btn btn--gold btn--block btn--lg"
                onClick={() => void handlePay()}
                disabled={busy}
              >
                {busy ? 'Submitting…' : 'Submit payment request'}
              </button>
            ) : isPending || awaitingPayment ? (
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
                disabled={busy || (!stripeLink && !demoActivationAllowed)}
              >
                {busy ? 'Processing…' : stripeLink ? 'Pay with Stripe' : demoActivationAllowed ? `Activate ${plan.name}` : 'Payment unavailable'}
              </button>
            )}

            <p className="checkout-note muted">
              {manualFlow
                ? 'Manual billing: we review every request, send payment instructions, and activate your account after confirmation.'
                : stripeLink
                  ? 'Secure payment via Stripe. Cancel anytime from the billing portal.'
                  : demoActivationAllowed
                    ? cloudMode
                      ? 'Demo activation enabled — for testing only. Configure Stripe for production billing.'
                      : 'Local mode: subscription is stored on this device.'
                    : 'Stripe billing is required to activate your subscription in production.'}
            </p>
          </>
        ) : null}

        <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  )
}
