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

const FILTER_OPTIONS: { value: AdminSubscriptionFilter; label: string }[] = [
  { value: 'all', label: 'All active' },
  { value: 'due_7d', label: 'Due 7 days' },
  { value: 'due_30d', label: 'Due 30 days' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
]

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
      onToast(`Renewal confirmed. Next period ends ${nextDate}.`)
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
      onToast(sub.blocked ? 'Account unblocked.' : 'Account blocked.')
      await onReload()
      await onDashboardRefresh()
    } finally {
      onBusyChange(null)
    }
  }

  return (
    <div className="admin-panel">
      <p className="admin-panel__intro muted">
        Active subscriptions and renewals. After receiving payment, confirm renewal to extend the billing period.
      </p>

      <div className="admin-toolbar admin-toolbar--filters">
        <AdminFilterPills label="Show" value={filter} options={FILTER_OPTIONS} onChange={onFilterChange} />
        <button type="button" className="btn btn--ghost btn--small admin-toolbar__refresh" onClick={() => void onReload()}>
          Refresh
        </button>
      </div>

      {error ? <p className="login-error admin-page__error">{error}</p> : null}

      {subscriptions.length === 0 ? (
        <p className="admin-empty">No subscriptions match this filter.</p>
      ) : (
        <div className="admin-list">
          {subscriptions.map((sub) => {
            const renewalStatus = getRenewalStatus(sub.current_period_end)
            const daysLeft = daysUntilRenewal(sub.current_period_end)
            const amount = subscriptionAmount(sub.plan_id, sub.billing_interval)
            const renewalHint =
              daysLeft !== null
                ? daysLeft < 0
                  ? `${Math.abs(daysLeft)} days overdue`
                  : `${daysLeft} days left`
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
                      {planLabel(sub.plan_id)} · {billingIntervalLabel(sub.billing_interval)} · {amount} · Renews{' '}
                      {formatAdminDate(sub.current_period_end)}
                      {renewalHint ? ` (${renewalHint})` : ''}
                    </p>
                  </div>
                  <div className="admin-card__badges">
                    <span className={`admin-badge admin-badge--${renewalStatusTone(renewalStatus)}`}>
                      {renewalStatusLabel(renewalStatus)}
                    </span>
                    {sub.blocked ? <span className="admin-badge admin-badge--blocked">Blocked</span> : null}
                  </div>
                </div>

                <details className="admin-details">
                  <summary>Subscription details</summary>
                  <dl className="admin-meta admin-meta--compact">
                    <div>
                      <dt>Status</dt>
                      <dd>{sub.plan_status}</dd>
                    </div>
                    {sub.tax_id ? (
                      <div>
                        <dt>Tax ID / VAT</dt>
                        <dd>{sub.tax_id}</dd>
                      </div>
                    ) : null}
                  </dl>
                </details>

                <label className="field field--pro admin-card__notes-field">
                  <span>Payment notes (optional)</span>
                  <textarea
                    rows={2}
                    value={notesDraft[sub.coach_id] ?? ''}
                    onChange={(e) => onNotesChange(sub.coach_id, e.target.value)}
                    placeholder="Transfer reference, invoice number, etc."
                  />
                </label>

                <div className="admin-card__actions admin-card__actions--primary">
                  <button
                    type="button"
                    className="btn btn--gold btn--small"
                    disabled={busyId === sub.coach_id}
                    onClick={() => void confirmRenewal(sub)}
                  >
                    Confirm renewal payment
                  </button>
                  <button
                    type="button"
                    className={sub.blocked ? 'btn btn--gold btn--small' : 'btn btn--secondary btn--small'}
                    disabled={busyId === sub.coach_id}
                    onClick={() => void toggleBlocked(sub)}
                  >
                    {sub.blocked ? 'Unblock' : 'Block account'}
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
