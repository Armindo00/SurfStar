import { useState, type FormEvent } from 'react'
import { formatPlanPriceWithSuffix, getPlan, isApprovalRequiredPlan, isStripeConfigured, SUBSCRIPTION_PLANS, type PlanId, usesManualPaymentFlow } from '../plans'
import { formatAppDate } from '../dateFormat'
import { athleteLimitMessage, coachSeatLimitMessage, canManageOrganizationCoaches } from '../planUtils'
import { cloudOpenBillingPortal, isSubscriptionActive } from '../subscriptionApi'
import { ScreenHeader } from '../components/ScreenHeader'
import { DeleteAccountPanel } from '../components/DeleteAccountPanel'
import { LanguagePicker } from '../components/LanguagePicker'
import { MIN_PASSWORD_LENGTH } from '../passwordUtils'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'

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
  const { t } = useI18n()
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
      setPwdError(t('subscription.passwordsMismatch'))
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
      setPwdSuccess(t('subscription.passwordUpdated'))
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
      <ScreenHeader title={t('subscription.title')} onBack={() => setView('coach-home')} />

      <div className="ss-card stats-panel">
        <LanguagePicker />
      </div>

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">{t('subscription.currentPlan')}</h2>
        {plan ? (
          <>
            <p className="stats-panel__plan-name">
              <strong>{plan.name}</strong> — {formatPlanPriceWithSuffix(plan, 'monthly')}
            </p>
            <p className="muted">
              {athleteLimitMessage(plan.id)} · {activeCount} {t('subscription.activeAthletes')}
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
          <p className="muted">{t('ui.subscription.noActiveSubscription')}</p>
        )}
      </div>

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">{t('ui.subscription.changePlan')}</h2>
        <p className="muted subscription-manage__hint">
          {manualFlow
            ? t('ui.subscription.changePlanHintManual')
            : cloudMode && !isStripeConfigured()
              ? t('ui.subscription.changePlanHintDemo')
              : t('ui.subscription.changePlanHintStripe')}
          {!manualFlow ? t('ui.subscription.annualBillingNote') : null}
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
                  {isCurrent ? <span className="subscription-plan-picker__badge">{t('ui.subscription.current')}</span> : null}
                </div>
                <button
                  type="button"
                  className={isCurrent ? 'btn btn--ghost btn--small' : 'btn btn--secondary btn--small'}
                  disabled={isCurrent || planBusy !== null || cancelBusy}
                  onClick={() => void handleChangePlan(item.id)}
                >
                  {planBusy === item.id
                    ? t('ui.subscription.updating')
                    : isCurrent
                      ? t('ui.subscription.currentPlan')
                      : t('ui.subscription.switchToPlan', { name: item.name })}
                </button>
              </div>
            )
          })}
        </div>
        ) : null}
        {!canManageOrganizationCoaches(plan?.id ?? 'team') ? (
          <div className="subscription-team-academy-cta">
            <p className="muted">
              {t('ui.subscription.teamAcademyCta', {
                monthly: formatPlanPriceWithSuffix(getPlan('organization'), 'monthly'),
                annual: formatPlanPriceWithSuffix(getPlan('organization'), 'annual'),
              })}
            </p>
            <button type="button" className="btn btn--secondary btn--block" onClick={openTeamAcademyRequest}>
              {t('ui.subscription.requestTeamAcademy')}
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
            {billingBusy ? t('ui.subscription.openingBilling') : t('ui.subscription.manageBillingStripe')}
          </button>
        ) : null}
      </div>

      <div className="ss-card stats-panel subscription-cancel-panel">
        <h2 className="stats-panel__title">{t('ui.subscription.cancelSubscription')}</h2>
        <p className="muted">
          {manualFlow
            ? t('ui.subscription.cancelHintManual')
            : cloudMode
              ? t('ui.subscription.cancelHintCloud')
              : t('ui.subscription.cancelHintLocal')}
        </p>
        {!showCancelConfirm ? (
          <button
            type="button"
            className="btn btn--danger btn--block"
            disabled={!isActive || cancelBusy || planBusy !== null || canceledWithAccess}
            onClick={() => setShowCancelConfirm(true)}
          >
            {canceledWithAccess ? t('ui.subscription.cancellationScheduled') : t('ui.subscription.cancelSubscription')}
          </button>
        ) : (
          <div className="subscription-cancel-confirm">
            <p>{t('ui.subscription.cancelConfirmQuestion')}</p>
            <div className="subscription-cancel-confirm__actions">
              <button
                type="button"
                className="btn btn--danger"
                disabled={cancelBusy}
                onClick={() => void handleCancel()}
              >
                {cancelBusy ? t('ui.subscription.canceling') : t('ui.subscription.yesCancel')}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                disabled={cancelBusy}
                onClick={() => setShowCancelConfirm(false)}
              >
                {t('ui.subscription.keepSubscription')}
              </button>
            </div>
          </div>
        )}
      </div>

      {manageError ? <p className="login-error">{manageError}</p> : null}

      <div className="ss-card stats-panel">
        <h2 className="stats-panel__title">{t('subscription.changePassword')}</h2>
        <form className="form-pro" onSubmit={(e) => void submitPassword(e)}>
          <label className="field field--pro">
            <span>{t('subscription.newPassword')}</span>
            <input
              type="password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="field field--pro">
            <span>{t('subscription.confirmPassword')}</span>
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
            {pwdBusy ? t('common.save') + '…' : t('subscription.updatePassword')}
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
