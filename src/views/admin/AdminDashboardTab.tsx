import type { AdminDashboardStats } from '../../adminApi'
import type { AdminRequestFilter, AdminSubscriptionFilter } from '../../adminApi'

type AdminTab = 'dashboard' | 'requests' | 'subscriptions' | 'accounts' | 'contact'

type Props = {
  stats: AdminDashboardStats
  newContactCount: number
  onNavigate: (
    tab: AdminTab,
    options?: { requestFilter?: AdminRequestFilter; subscriptionFilter?: AdminSubscriptionFilter; contactFilter?: 'new' | 'read' | 'resolved' | 'all' },
  ) => void
}

export function AdminDashboardTab({ stats, newContactCount, onNavigate }: Props) {
  const hasAttention =
    stats.pending_requests > 0 ||
    stats.awaiting_payment > 0 ||
    stats.renewals_due_7d > 0 ||
    stats.renewals_overdue > 0 ||
    newContactCount > 0

  return (
    <div className="admin-panel">
      <p className="admin-panel__intro muted">
        Platform overview. Use the attention cards below to jump straight to items that need action.
      </p>

      {hasAttention ? (
        <section className="admin-attention">
          <h2 className="admin-attention__title">Needs attention</h2>
          <div className="admin-attention__grid">
            {stats.pending_requests > 0 ? (
              <button
                type="button"
                className="admin-attention-card admin-attention-card--pending"
                onClick={() => onNavigate('requests', { requestFilter: 'pending' })}
              >
                <strong>{stats.pending_requests}</strong>
                <span>Pending review</span>
              </button>
            ) : null}
            {stats.awaiting_payment > 0 ? (
              <button
                type="button"
                className="admin-attention-card admin-attention-card--awaiting"
                onClick={() => onNavigate('requests', { requestFilter: 'awaiting_payment' })}
              >
                <strong>{stats.awaiting_payment}</strong>
                <span>Awaiting payment</span>
              </button>
            ) : null}
            {stats.renewals_due_7d > 0 ? (
              <button
                type="button"
                className="admin-attention-card admin-attention-card--due"
                onClick={() => onNavigate('subscriptions', { subscriptionFilter: 'due_7d' })}
              >
                <strong>{stats.renewals_due_7d}</strong>
                <span>Renewals this week</span>
              </button>
            ) : null}
            {stats.renewals_overdue > 0 ? (
              <button
                type="button"
                className="admin-attention-card admin-attention-card--overdue"
                onClick={() => onNavigate('subscriptions', { subscriptionFilter: 'overdue' })}
              >
                <strong>{stats.renewals_overdue}</strong>
                <span>Overdue renewals</span>
              </button>
            ) : null}
            {newContactCount > 0 ? (
              <button
                type="button"
                className="admin-attention-card admin-attention-card--contact"
                onClick={() => onNavigate('contact', { contactFilter: 'new' })}
              >
                <strong>{newContactCount}</strong>
                <span>New messages</span>
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <p className="admin-empty admin-empty--inline">All clear — nothing needs immediate attention.</p>
      )}

      <div className="admin-stats admin-stats--compact">
        <div className="admin-stat-card">
          <strong>{stats.coaches}</strong>
          <span>Coaches</span>
        </div>
        <div className="admin-stat-card">
          <strong>{stats.athletes}</strong>
          <span>Athletes</span>
        </div>
        <div className="admin-stat-card admin-stat-card--highlight">
          <strong>{stats.active_subscriptions}</strong>
          <span>Active subscriptions</span>
        </div>
        <div className="admin-stat-card">
          <strong>{stats.blocked_accounts}</strong>
          <span>Blocked</span>
        </div>
      </div>
    </div>
  )
}
