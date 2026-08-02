import { useCallback, useEffect, useRef, useState } from 'react'
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
import { LegalFooterLinks } from '../components/LegalFooterLinks'
import { ManualBillingNotice } from '../components/ManualBillingNotice'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import { buildStripeCheckoutUrl, isSubscriptionActive } from '../subscriptionApi'
import { hasCompleteBillingAddress, emptyBillingAddress } from '../billingUtils'
import { isDemoSubscriptionEnabled } from '../config'
import { fetchCoachPlanRequest, submitOrganizationPlanRequest, type CoachPlanRequest } from '../organizationPlanRequestApi'
import { formatAppDateTime } from '../dateFormat'

function requestStatusLabel(request: CoachPlanRequest, t: (key: string) => string): string {
  if (request.activated_at) return t('ui.checkout.statusActive')
  if (request.status === 'pending') return t('ui.checkout.statusPendingReview')
  if (request.status === 'approved' && request.payment_status === 'unpaid') return t('ui.checkout.statusAwaitingPayment')
  if (request.status === 'approved') return t('ui.checkout.statusApproved')
  return request.status
}

export function CheckoutView() {
  const { t } = useI18n()
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
    openPrivacy,
    openTerms,
    logout,
    cloudMode,
  } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [awaitingPayment, setAwaitingPayment] = useState(false)
  const [openRequest, setOpenRequest] = useState<CoachPlanRequest | null>(null)
  const autoSubmitAttempted = useRef(false)

  const rawPlanId = selectedPlanId ?? subscription?.planId ?? 'team'
  const planId = isApprovalRequiredPlan(rawPlanId) ? 'team' : rawPlanId
  const plan = getPlan(planId)
  const stripeLink = getStripePaymentLink(planId, selectedBillingInterval)
  const manualFlow = usesManualPaymentFlow()
  const isPending = subscription?.status === 'pending'
  const isActive = isSubscriptionActive(subscription)
  const approvalBlocked = isApprovalRequiredPlan(rawPlanId)
  const demoActivationAllowed = (!cloudMode || isDemoSubscriptionEnabled()) && !manualFlow

  const loadOpenRequest = useCallback(async () => {
    if (!cloudMode || !manualFlow) return
    const result = await fetchCoachPlanRequest()
    if (result.ok) setOpenRequest(result.request)
  }, [cloudMode, manualFlow])

  useEffect(() => {
    void loadOpenRequest()
  }, [loadOpenRequest])

  useEffect(() => {
    if (!manualFlow || !cloudMode || !auth || auth.role !== 'treinador') return
    if (autoSubmitAttempted.current || approvalBlocked) return
    if (!hasCompleteBillingAddress(auth.billingAddress)) return

    autoSubmitAttempted.current = true
    void (async () => {
      setBusy(true)
      try {
        const existing = await fetchCoachPlanRequest()
        if (existing.ok && existing.request) {
          setOpenRequest(existing.request)
          return
        }

        await submitOrganizationPlanRequest(
          {
            contactName: auth.name,
            email: auth.email,
            organizationName: auth.organizationName || `${auth.name}'s Team`,
            planId: planId as PlanId,
            billingInterval: selectedBillingInterval,
            taxId: auth.taxId ?? '',
            billingAddress: auth.billingAddress ?? emptyBillingAddress(),
            message: 'Payment request submitted while waiting for admin approval.',
          },
          cloudMode,
        )
        await loadOpenRequest()
      } finally {
        setBusy(false)
      }
    })()
  }, [
    approvalBlocked,
    auth,
    cloudMode,
    loadOpenRequest,
    manualFlow,
    planId,
    selectedBillingInterval,
  ])

  useEffect(() => {
    if (!manualFlow || !openRequest || openRequest.activated_at || isActive) return

    const timer = window.setInterval(() => {
      void loadOpenRequest()
      void refreshSubscription()
    }, 5000)

    return () => window.clearInterval(timer)
  }, [manualFlow, openRequest, isActive, loadOpenRequest, refreshSubscription])

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
      setError(t('ui.checkout.signInCoachFirst'))
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
          taxId: auth.taxId ?? '',
          billingAddress: auth.billingAddress ?? emptyBillingAddress(),
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
          setError(t('ui.checkout.paymentNotConfigured'))
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
      setError(err instanceof Error ? err.message : t('ui.checkout.couldNotStartCheckout'))
    } finally {
      setBusy(false)
    }
  }

  const planOptions = manualFlow ? getCheckoutPlans() : getSelfServePlans()

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <button type="button" className="checkout-back" onClick={openLanding}>
          ← {t('common.back')}
        </button>

        <div className="checkout-brand">
          <AppLogo size="lg" />
          <div>
            <h1>{manualFlow ? t('ui.checkout.titleManual') : t('ui.checkout.titleActivate')}</h1>
            <p className="muted">
              {t('ui.checkout.greeting', { name: auth?.name ?? t('ui.checkout.coachFallback') })}{' '}
              {manualFlow ? t('ui.checkout.leadManual') : t('ui.checkout.leadStripe')}
            </p>
          </div>
        </div>

        {manualFlow && !approvalBlocked ? (
          <ManualBillingNotice variant="waiting" email={auth?.email} />
        ) : null}

        {approvalBlocked ? (
          <div className="checkout-pending team-academy-request__banner">
            <p className="checkout-pending__title">{t('ui.checkout.teamAcademyTitle')}</p>
            <p className="muted">{t('ui.checkout.teamAcademyBody')}</p>
            <button type="button" className="btn btn--gold btn--block" onClick={openTeamAcademyRequest}>
              {t('ui.checkout.requestTeamAcademy')}
            </button>
          </div>
        ) : null}

        {!approvalBlocked ? (
          <>
            <BillingIntervalToggle value={selectedBillingInterval} onChange={setBillingInterval} />

            <div className="checkout-summary">
              <div>
                <span className="checkout-summary__label">{t('ui.checkout.selectedPlan')}</span>
                <strong>{plan.name}</strong>
              </div>
              <div className="checkout-summary__price">
                <strong>{formatPlanPrice(plan, selectedBillingInterval)}</strong>
                <span>{formatPlanPriceSuffix(selectedBillingInterval)}</span>
              </div>
            </div>

            {manualFlow ? (
              <p className="checkout-manual-total muted">
                {t('ui.checkout.totalDue')}{' '}
                <strong>{formatPlanTotalPrice(plan, selectedBillingInterval)}</strong>
                {selectedBillingInterval === 'annual'
                  ? t('ui.checkout.perYear')
                  : t('ui.checkout.perMonth')}{' '}
                {t('ui.checkout.manualPaymentNote')}
              </p>
            ) : null}

            <label className="field field--login">
              <span>{t('ui.checkout.changePlan')}</span>
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
                <p className="checkout-pending__title">{t('ui.checkout.accessPending')}</p>
                <dl className="checkout-request-meta">
                  <div>
                    <dt>{t('ui.checkout.status')}</dt>
                    <dd>{requestStatusLabel(openRequest, t)}</dd>
                  </div>
                  <div>
                    <dt>{t('ui.checkout.plan')}</dt>
                    <dd>{getPlan(openRequest.plan_id).name}</dd>
                  </div>
                  <div>
                    <dt>{t('ui.checkout.billing')}</dt>
                    <dd>
                      {openRequest.billing_interval === 'annual'
                        ? t('ui.checkout.billingAnnual')
                        : t('ui.checkout.billingMonthly')}
                    </dd>
                  </div>
                  <div>
                    <dt>{t('ui.checkout.submitted')}</dt>
                    <dd>{formatAppDateTime(openRequest.created_at, { day: '2-digit', month: 'short', year: 'numeric' })}</dd>
                  </div>
                </dl>
                <p className="muted">
                  {openRequest.status === 'pending'
                    ? t('ui.checkout.pendingQueueMessage')
                    : openRequest.status === 'approved' && openRequest.payment_status === 'unpaid'
                      ? t('ui.checkout.approvedUnpaidMessage')
                      : t('ui.checkout.processingMessage')}
                </p>
                <button
                  type="button"
                  className="btn btn--secondary btn--block"
                  onClick={() => {
                    void loadOpenRequest()
                    void refreshSubscription()
                  }}
                  disabled={busy}
                >
                  {t('ui.checkout.checkNow')}
                </button>
              </div>
            ) : manualFlow ? (
              <div className="checkout-pending checkout-pending--manual">
                <p className="checkout-pending__title">{t('ui.checkout.submittingRequest')}</p>
                <p className="muted">{t('ui.checkout.awaitingPaymentMessage')}</p>
              </div>
            ) : isPending || awaitingPayment ? (
              <div className="checkout-pending">
                <p className="checkout-pending__title">{t('ui.checkout.waitingPayment')}</p>
                <p className="muted">{t('ui.checkout.stripePaymentMessage')}</p>
                <button
                  type="button"
                  className="btn btn--secondary btn--block"
                  onClick={() => void refreshSubscription()}
                  disabled={busy}
                >
                  {t('ui.checkout.checkNow')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn--gold btn--block btn--lg"
                onClick={() => void handlePay()}
                disabled={busy || (!stripeLink && !demoActivationAllowed)}
              >
                {busy
                  ? t('ui.checkout.processing')
                  : stripeLink
                    ? t('ui.checkout.payWithStripe')
                    : demoActivationAllowed
                      ? t('ui.checkout.activatePlan', { planName: plan.name })
                      : t('ui.checkout.paymentUnavailable')}
              </button>
            )}

            <p className="checkout-note muted">
              {manualFlow
                ? t('ui.checkout.noteManual')
                : stripeLink
                  ? t('ui.checkout.noteStripe')
                  : demoActivationAllowed
                    ? cloudMode
                      ? t('ui.checkout.noteDemoCloud')
                      : t('ui.checkout.noteLocal')
                    : t('ui.checkout.noteStripeRequired')}
            </p>
          </>
        ) : null}

        <LegalFooterLinks className="checkout-legal-footer" onPrivacy={openPrivacy} onTerms={openTerms} layout="stack" />

        <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
          {t('common.signOut')}
        </button>
      </div>
    </div>
  )
}
