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
import { formatAppDateTime } from '../../dateFormat'
import { getPlan, type BillingInterval, type PlanId } from '../../plans'

type Props = {
  filter: AdminSubscriptionFilter
  onFilterChange: (filter: AdminSubscriptionFilter) => void
  subscriptions: AdminBillingSubscription[]
  loading: boolean
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

function formatDate(value: string | null): string {
  if (!value) return '—'
  return formatAppDateTime(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function planLabel(planId: string): string {
  try {
    return getPlan(planId as PlanId).name
  } catch {
    return planId
  }
}

function billingIntervalLabel(interval: BillingInterval | string): string {
  return interval === 'annual' ? 'Annual' : 'Monthly'
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
  loading,
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
      const nextDate = result.currentPeriodEnd ? formatDate(result.currentPeriodEnd) : 'extended'
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
      <p className="muted admin-page__hint">
        Active subscriptions and renewals. After receiving payment (IBAN / MB Way), confirm renewal to extend the
        billing period by one month or one year.
      </p>

      <div className="admin-toolbar admin-toolbar--wrap">
        <label className="field field--pro admin-toolbar__field">
          <span>Filter</span>
          <select value={filter} onChange={(e) => onFilterChange(e.target.value as AdminSubscriptionFilter)}>
            <option value="all">All active</option>
            <option value="due_7d">Due within 7 days</option>
            <option value="due_30d">Due within 30 days</option>
            <option value="overdue">Overdue</option>
            <option value="monthly">Monthly billing</option>
            <option value="annual">Annual billing</option>
          </select>
        </label>
        <button type="button" className="btn btn--secondary btn--small" onClick={() => void onReload()}>
          Refresh
        </button>
      </div>

      {error ? <p className="login-error admin-page__error">{error}</p> : null}
      {loading ? null : subscriptions.length === 0 ? (
        <p className="muted">No subscriptions match this filter.</p>
      ) : (
        <div className="admin-list">
          {subscriptions.map((sub) => {
            const renewalStatus = getRenewalStatus(sub.current_period_end)
            const daysLeft = daysUntilRenewal(sub.current_period_end)
            const amount = subscriptionAmount(sub.plan_id, sub.billing_interval)

            return (
              <article key={sub.coach_id} className="admin-card">
                <div className="admin-card__head">
                  <div>
                    <h2>{sub.name}</h2>
                    <p className="muted">
                      {sub.email}
                      {sub.organization_name ? ` · ${sub.organization_name}` : ''}
                    </p>
                  </div>
                  <div className="admin-card__badges">
                    <span className={`admin-badge admin-badge--${renewalStatusTone(renewalStatus)}`}>
                      {renewalStatusLabel(renewalStatus)}
                    </span>
                    <span className="admin-badge admin-badge--plan">{billingIntervalLabel(sub.billing_interval)}</span>
                    {sub.blocked ? <span className="admin-badge admin-badge--blocked">Blocked</span> : null}
                  </div>
                </div>

                <div className="admin-plan-banner admin-plan-banner--active">
                  <span className="admin-plan-banner__eyebrow">Active subscription</span>
                  <strong className="admin-plan-banner__title">
                    {planLabel(sub.plan_id)} · {billingIntervalLabel(sub.billing_interval)} · {amount}
                  </strong>
                  <p className="admin-plan-banner__hint muted">
                    Renews {formatDate(sub.current_period_end)}
                    {daysLeft !== null
                      ? daysLeft < 0
                        ? ` (${Math.abs(daysLeft)} days overdue)`
                        : ` (${daysLeft} days left)`
                      : ''}
                  </p>
                </div>

                <dl className="admin-meta">
                  <div>
                    <dt>Plan</dt>
                    <dd>{planLabel(sub.plan_id)} ({sub.plan_id})</dd>
                  </div>
                  <div>
                    <dt>Billing cycle</dt>
                    <dd>{billingIntervalLabel(sub.billing_interval)}</dd>
                  </div>
                  <div>
                    <dt>Amount due</dt>
                    <dd>{amount}</dd>
                  </div>
                  <div>
                    <dt>Period ends</dt>
                    <dd>{formatDate(sub.current_period_end)}</dd>
                  </div>
                  {sub.tax_id ? (
                    <div>
                      <dt>Tax ID / VAT</dt>
                      <dd>{sub.tax_id}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Status</dt>
                    <dd>{sub.plan_status}</dd>
                  </div>
                </dl>

                <label className="field field--pro">
                  <span>Payment notes (optional)</span>
                  <textarea
                    rows={2}
                    value={notesDraft[sub.coach_id] ?? ''}
                    onChange={(e) => onNotesChange(sub.coach_id, e.target.value)}
                    placeholder="Transfer reference, invoice number, etc."
                  />
                </label>

                <div className="admin-card__actions">
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
