import {
  adminConfirmSubscriptionRenewal,
  adminFetchBillingSubscriptions,
  adminSetAccountBlocked,
  type AdminBillingSubscription,
  type AdminSubscriptionFilter,
} from '../../adminApi'
import {
  daysUntilRenewal,
  getRenewalStatus,
  renewalStatusLabel,
  renewalStatusTone,
  subscriptionAmount,
} from '../../adminBillingUtils'
import { useI18n } from '../../i18n'
import { AdminFilterPills } from './AdminFilterPills'
import { billingIntervalLabel, formatAdminDate, planLabel } from './adminUtils'

type Props = {
  filter: AdminSubscriptionFilter
  onFilterChange: (filter: AdminSubscriptionFilter) => void
  subscriptions: AdminBillingSubscription[]
  busyId: string | null
  error: string
  notesDraft: Record<string, string>
  onNotesChange: (coachId: string, notes: string) => void
  onReload: () => Promise<void>
  onError: (message: string) => void
  onBusyChange: (id: string | null) => void
  onToast: (message: string) => void
  onDashboardRefresh: () => Promise<void>
}

export async function loadAdminSubscriptions(
  filter: AdminSubscriptionFilter,
): Promise<{ ok: true; subscriptions: AdminBillingSubscription[] } | { ok: false; error: string }> {
  return adminFetchBillingSubscriptions(filter)
}

export function AdminSubscriptionsTab({
  filter,
  onFilterChange,
  subscriptions,
  busyId,
  error,
  notesDraft,
  onNotesChange,
  onReload,
  onError,
  onBusyChange,
  onToast,
  onDashboardRefresh,
}: Props) {
  const { t, messages } = useI18n()
  const a = messages.ui.admin as Record<string, string>

  const filterOptions: { value: AdminSubscriptionFilter; label: string }[] = [
    { value: 'all', label: a.subscriptionFilterAll },
    { value: 'due_7d', label: a.subscriptionFilterDue7d },
    { value: 'due_30d', label: a.subscriptionFilterDue30d },
    { value: 'overdue', label: a.subscriptionFilterOverdue },
    { value: 'monthly', label: a.subscriptionFilterMonthly },
    { value: 'annual', label: a.subscriptionFilterAnnual },
  ]

  const confirmRenewal = async (sub: AdminBillingSubscription) => {
    onBusyChange(sub.coach_id)
    onError('')
    try {
      const result = await adminConfirmSubscriptionRenewal(sub.coach_id, notesDraft[sub.coach_id])
      if (!result.ok) {
        onError(result.error)
        return
      }
      const nextDate = result.currentPeriodEnd ? formatAdminDate(result.currentPeriodEnd) : 'extended'
      onToast(t('ui.admin.renewalConfirmedToast', { date: nextDate }))
      await onReload()
      await onDashboardRefresh()
    } finally {
      onBusyChange(null)
    }
  }

  const toggleBlocked = async (sub: AdminBillingSubscription) => {
    onBusyChange(sub.coach_id)
    onError('')
    try {
      const result = await adminSetAccountBlocked(sub.coach_id, !sub.blocked)
      if (!result.ok) {
        onError(result.error)
        return
      }
      onToast(sub.blocked ? a.accountUnblockedToast : a.accountBlockedToast)
      await onReload()
      await onDashboardRefresh()
    } finally {
      onBusyChange(null)
    }
  }

  return (
    <div className="admin-panel">
      <p className="admin-panel__intro muted">{a.subscriptionsIntro}</p>

      <div className="admin-toolbar admin-toolbar--filters">
        <AdminFilterPills
          label={a.show}
          value={filter}
          options={filterOptions}
          onChange={onFilterChange}
          filterAriaLabel={a.filter}
        />
        <button type="button" className="btn btn--ghost btn--small admin-toolbar__refresh" onClick={() => void onReload()}>
          {a.refresh}
        </button>
      </div>

      {error ? <p className="login-error admin-page__error">{error}</p> : null}

      {subscriptions.length === 0 ? (
        <p className="admin-empty">{a.noSubscriptionsMatch}</p>
      ) : (
        <div className="admin-list">
          {subscriptions.map((sub) => {
            const renewalStatus = getRenewalStatus(sub.current_period_end)
            const daysLeft = daysUntilRenewal(sub.current_period_end)
            const amount = subscriptionAmount(sub.plan_id, sub.billing_interval)
            const renewalHint =
              daysLeft !== null
                ? daysLeft < 0
                  ? t('ui.admin.daysOverdue', { count: Math.abs(daysLeft) })
                  : t('ui.admin.daysLeft', { count: daysLeft })
                : null

            return (
              <article key={sub.coach_id} className="admin-card admin-card--compact">
                <div className="admin-card__head">
                  <div>
                    <h2>{sub.name}</h2>
                    <p className="muted admin-card__subtitle">
                      {sub.email}
                      {sub.organization_name ? ` · ${sub.organization_name}` : ''}
                    </p>
                    <p className="admin-card__summary">
                      {planLabel(sub.plan_id)} · {billingIntervalLabel(sub.billing_interval)} · {amount} · {a.renews}{' '}
                      {formatAdminDate(sub.current_period_end)}
                      {renewalHint ? ` (${renewalHint})` : ''}
                    </p>
                  </div>
                  <div className="admin-card__badges">
                    <span className={`admin-badge admin-badge--${renewalStatusTone(renewalStatus)}`}>
                      {renewalStatusLabel(renewalStatus)}
                    </span>
                    {sub.blocked ? <span className="admin-badge admin-badge--blocked">{a.blocked}</span> : null}
                  </div>
                </div>

                <details className="admin-details">
                  <summary>{a.subscriptionDetails}</summary>
                  <dl className="admin-meta admin-meta--compact">
                    <div>
                      <dt>{a.status}</dt>
                      <dd>{sub.plan_status}</dd>
                    </div>
                    {sub.tax_id ? (
                      <div>
                        <dt>{a.taxIdVat}</dt>
                        <dd>{sub.tax_id}</dd>
                      </div>
                    ) : null}
                  </dl>
                </details>

                <label className="field field--pro admin-card__notes-field">
                  <span>{a.paymentNotes}</span>
                  <textarea
                    rows={2}
                    value={notesDraft[sub.coach_id] ?? ''}
                    onChange={(e) => onNotesChange(sub.coach_id, e.target.value)}
                    placeholder={a.transferReferencePlaceholder}
                  />
                </label>

                <div className="admin-card__actions admin-card__actions--primary">
                  <button
                    type="button"
                    className="btn btn--gold btn--small"
                    disabled={busyId === sub.coach_id}
                    onClick={() => void confirmRenewal(sub)}
                  >
                    {a.confirmRenewalPayment}
                  </button>
                  <button
                    type="button"
                    className={sub.blocked ? 'btn btn--gold btn--small' : 'btn btn--secondary btn--small'}
                    disabled={busyId === sub.coach_id}
                    onClick={() => void toggleBlocked(sub)}
                  >
                    {sub.blocked ? a.unblock : a.blockAccount}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
