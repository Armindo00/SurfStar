import { useState, type FormEvent } from 'react'
import { formatPlanPriceWithSuffix, getPlan, isApprovalRequiredPlan, isStripeConfigured, SUBSCRIPTION_PLANS, type PlanId, usesManualPaymentFlow } from '../plans'
import { formatAppDate } from '../dateFormat'
import { athleteLimitMessage, coachSeatLimitMessage, canManageOrganizationCoaches } from '../planUtils'
import { cloudOpenBillingPortal, isSubscriptionActive } from '../subscriptionApi'
import { ScreenHeader } from '../components/ScreenHeader'
import { DeleteAccountPanel } from '../components/DeleteAccountPanel'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { useApp } from '../AppContext'

export function SubscriptionView() {
  const {
    subscription,
    coachAthletes,
    organizationMembers,
    auth,
    refreshSubscription,
    changeSubscriptionPlan,
    cancelSubscription,
    changePassword,
    openTeamAcademyRequest,
    setView,
    cloudMode,
  } = useApp()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)
  const [planBusy, setPlanBusy] = useState<PlanId | null>(null)
  const [billingBusy, setBillingBusy] = useState(false)
  const [cancelBusy, setCancelBusy] = useState(false)
  const [manageError, setManageError] = useState('')
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const plan = subscription ? getPlan(subscription.planId) : null
  const activeCount = coachAthletes.filter((a) => !a.blocked).length
  const isActive = isSubscriptionActive(subscription)
  const isCanceled = subscription?.status === 'canceled'
  const canceledWithAccess = isCanceled && isActive
  const manualFlow = usesManualPaymentFlow()

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

  const handleChangePlan = async (planId: PlanId) => {
    if (subscription?.planId === planId && isActive) return
    setManageError('')
    setPlanBusy(planId)
    try {
      const result = await changeSubscriptionPlan(planId)
      if (!result.ok) setManageError(result.error)
    } finally {
      setPlanBusy(null)
    }
  }

  const handleOpenBilling = async () => {
    setManageError('')
    setBillingBusy(true)
    try {
      const result = await cloudOpenBillingPortal()
      if (!result.ok) {
        setManageError(result.error)
        return
      }
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } finally {
      setBillingBusy(false)
    }
  }

  const handleCancel = async () => {
    setManageError('')
    setCancelBusy(true)
    try {
      const result = await cancelSubscription()
      if (!result.ok) {
        setManageError(result.error)
        return
      }
      setShowCancelConfirm(false)
    } finally {
      setCancelBusy(false)
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
              <strong>{plan.name}</strong> — {formatPlanPriceWithSuffix(plan, 'monthly')}
            </p>
            <p className="muted">
              {athleteLimitMessage(plan.id)} · {activeCount} active athletes
              {canManageOrganizationCoaches(plan.id)
                ? ` · ${organizationMembers.filter((m) => m.status === 'active' || m.status === 'pending').length} coaches`
                : ''}
            </p>
            {auth?.role === 'treinador' ? (
              <p className="muted">Team: {auth.organizationName}</p>
            ) : null}
            {canManageOrganizationCoaches(plan.id) ? (
              <p className="muted">{coachSeatLimitMessage(plan.id)}</p>
            ) : null}
            {subscription?.status ? (
              <p className="muted">
                Status:{' '}
                <strong>
                  {canceledWithAccess
                    ? 'Canceled (access until period end)'
                    : subscription.status === 'active'
                      ? 'Active'
                      : subscription.status === 'trialing'
                        ? 'Trial'
                        : subscription.status === 'pending'
                          ? 'Pending payment'
                          : 'Canceled'}
                </strong>
              </p>
            ) : null}
            {subscription?.currentPeriodEnd ? (
              <p className="muted">
                {canceledWithAccess || isCanceled ? 'Access until' : 'Renews'}:{' '}
                {formatAppDate(subscription.currentPeriodEnd, {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            ) : null}
            {cloudMode ? (
              <button type="button" className="btn btn--ghost btn--block" onClick={() => void refreshSubscription()}>
                Refresh status
              </button>
            ) : null}
          </>
        ) : (
          <p className="muted">No active subscription.</p>
        )}
      </div>

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">Change plan</h2>
        <p className="muted subscription-manage__hint">
          {manualFlow
            ? 'Manual billing is active. Contact support to change plan or renew your subscription.'
            : cloudMode && !isStripeConfigured()
              ? 'Switch anytime. Plans update instantly while Stripe is not active.'
              : 'Switch anytime. Upgrades apply immediately; downgrades follow your billing cycle when paid via Stripe.'}
          {!manualFlow ? (
            <>
              {' '}
              Annual billing (2 months free) is available at checkout when you subscribe or upgrade via Stripe.
            </>
          ) : null}
        </p>
        {!manualFlow ? (
        <div className="subscription-plan-picker">
          {SUBSCRIPTION_PLANS.filter((item) => !isApprovalRequiredPlan(item.id)).map((item) => {
            const isCurrent = subscription?.planId === item.id && isActive
            return (
              <div
                key={item.id}
                className={
                  isCurrent
                    ? 'subscription-plan-picker__item subscription-plan-picker__item--current'
                    : 'subscription-plan-picker__item'
                }
              >
                <div>
                  <strong>{item.name}</strong>
                  <span className="muted"> · {formatPlanPriceWithSuffix(item, 'monthly')}</span>
                  {isCurrent ? <span className="subscription-plan-picker__badge">Current</span> : null}
                </div>
                <button
                  type="button"
                  className={isCurrent ? 'btn btn--ghost btn--small' : 'btn btn--secondary btn--small'}
                  disabled={isCurrent || planBusy !== null || cancelBusy}
                  onClick={() => void handleChangePlan(item.id)}
                >
                  {planBusy === item.id ? 'Updating…' : isCurrent ? 'Current plan' : `Switch to ${item.name}`}
                </button>
              </div>
            )
          })}
        </div>
        ) : null}
        {!canManageOrganizationCoaches(plan?.id ?? 'team') ? (
          <div className="subscription-team-academy-cta">
            <p className="muted">
              Need up to 5 coaches on one shared roster? Team Academy (
              {formatPlanPriceWithSuffix(getPlan('organization'), 'monthly')} or{' '}
              {formatPlanPriceWithSuffix(getPlan('organization'), 'annual')} billed annually) is available by approval for
              schools and federations.
            </p>
            <button type="button" className="btn btn--secondary btn--block" onClick={openTeamAcademyRequest}>
              Request Team Academy
            </button>
          </div>
        ) : null}
        {cloudMode && !manualFlow ? (
          <button
            type="button"
            className="btn btn--gold btn--block"
            disabled={billingBusy || cancelBusy}
            onClick={() => void handleOpenBilling()}
          >
            {billingBusy ? 'Opening…' : 'Manage billing on Stripe'}
          </button>
        ) : null}
      </div>

      <div className="ss-card stats-panel subscription-cancel-panel">
        <h2 className="stats-panel__title">Cancel subscription</h2>
        <p className="muted">
          {manualFlow
            ? 'Your subscription stays active until the end of the current billing period. To renew later, contact contact@surfstar.app.'
            : cloudMode
              ? 'Your subscription stays active until the end of the current billing period. You can resubscribe anytime.'
              : 'Canceling stops access to coach features on this device.'}
        </p>
        {!showCancelConfirm ? (
          <button
            type="button"
            className="btn btn--danger btn--block"
            disabled={!isActive || cancelBusy || planBusy !== null || canceledWithAccess}
            onClick={() => setShowCancelConfirm(true)}
          >
            {canceledWithAccess ? 'Cancellation scheduled' : 'Cancel subscription'}
          </button>
        ) : (
          <div className="subscription-cancel-confirm">
            <p>Are you sure you want to cancel?</p>
            <div className="subscription-cancel-confirm__actions">
              <button
                type="button"
                className="btn btn--danger"
                disabled={cancelBusy}
                onClick={() => void handleCancel()}
              >
                {cancelBusy ? 'Canceling…' : 'Yes, cancel'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={cancelBusy}
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep subscription
              </button>
            </div>
          </div>
        )}
      </div>

      {manageError ? <p className="login-error">{manageError}</p> : null}

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

      <DeleteAccountPanel
        roleLabel="coach"
        subscriptionActive={isActive}
        subscriptionCanceled={isCanceled || canceledWithAccess}
      />
    </div>
  )
}
