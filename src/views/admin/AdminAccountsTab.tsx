import type { AdminAccount } from '../../adminApi'
import type { AccountDeletionRequest } from '../../accountDeletionApi'
import type { BillingInterval, PlanId } from '../../plans'
import { AdminFilterPills } from './AdminFilterPills'
import { accountPlanSummary, formatAdminDate, planLabel } from './adminUtils'

type AccountRole = 'all' | 'treinador' | 'atleta'

type Props = {
  accounts: AdminAccount[]
  deletionRequests: AccountDeletionRequest[]
  accountRole: AccountRole
  accountSearch: string
  blockedOnly: boolean
  onRoleChange: (role: AccountRole) => void
  onSearchChange: (search: string) => void
  onBlockedOnlyChange: (blocked: boolean) => void
  onSearch: () => void
  busyId: string | null
  onToggleBlocked: (account: AdminAccount) => void
  onActivatePlan: (account: AdminAccount, planId: PlanId, billingInterval?: BillingInterval) => void
  onProcessDeletion: (request: AccountDeletionRequest, action: 'approve' | 'reject') => void
}

const ROLE_OPTIONS: { value: AccountRole; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'treinador', label: 'Coaches' },
  { value: 'atleta', label: 'Athletes' },
]

export function AdminAccountsTab({
  accounts,
  deletionRequests,
  accountRole,
  accountSearch,
  blockedOnly,
  onRoleChange,
  onSearchChange,
  onBlockedOnlyChange,
  onSearch,
  busyId,
  onToggleBlocked,
  onActivatePlan,
  onProcessDeletion,
}: Props) {
  return (
    <div className="admin-panel">
      <p className="admin-panel__intro muted">
        Manage user accounts, block access, manually activate plans, and process GDPR deletion requests.
      </p>

      {deletionRequests.length > 0 ? (
        <section className="admin-deletion-banner">
          <div className="admin-deletion-banner__head">
            <strong>{deletionRequests.length} deletion request{deletionRequests.length === 1 ? '' : 's'}</strong>
            <span className="muted">Verify identity before approving — deletion is permanent.</span>
          </div>
          <div className="admin-list admin-list--compact">
            {deletionRequests.map((request) => (
              <article key={request.id} className="admin-card admin-card--danger admin-card--inline">
                <div className="admin-card__head">
                  <div>
                    <h2>{request.email}</h2>
                    <p className="muted">
                      {request.role === 'treinador' ? 'Coach' : 'Athlete'} · {formatAdminDate(request.created_at)}
                    </p>
                  </div>
                </div>
                {request.reason ? <p className="admin-card__message">{request.reason}</p> : null}
                <div className="admin-card__actions">
                  <button
                    type="button"
                    className="btn btn--danger btn--small"
                    disabled={busyId === request.id}
                    onClick={() => onProcessDeletion(request, 'approve')}
                  >
                    {busyId === request.id ? 'Processing…' : 'Approve & delete'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={busyId === request.id}
                    onClick={() => onProcessDeletion(request, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="admin-toolbar admin-toolbar--wrap">
        <label className="field field--pro admin-toolbar__field admin-toolbar__field--grow">
          <span>Search</span>
          <input
            value={accountSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Name or email"
          />
        </label>
        <AdminFilterPills label="Role" value={accountRole} options={ROLE_OPTIONS} onChange={onRoleChange} />
        <label className="field field--pro admin-toolbar__check">
          <input type="checkbox" checked={blockedOnly} onChange={(e) => onBlockedOnlyChange(e.target.checked)} />
          <span>Blocked only</span>
        </label>
        <button type="button" className="btn btn--secondary btn--small" onClick={onSearch}>
          Search
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="admin-empty">No accounts found.</p>
      ) : (
        <div className="admin-list">
          {accounts.map((account) => {
            const planSummary = accountPlanSummary(account)
            const isCoach = account.role === 'treinador' && !account.is_platform_admin

            return (
              <article key={account.profile_id} className="admin-card admin-card--compact">
                <div className="admin-card__head">
                  <div>
                    <h2>{account.name}</h2>
                    <p className="muted admin-card__subtitle">
                      {account.email} · {account.role === 'treinador' ? 'Coach' : 'Athlete'}
                      {account.organization_name ? ` · ${account.organization_name}` : ''}
                    </p>
                    <p className="admin-card__summary">{planSummary}</p>
                  </div>
                  <div className="admin-card__badges">
                    {account.is_platform_admin ? <span className="admin-badge admin-badge--admin">Admin</span> : null}
                    {account.blocked ? <span className="admin-badge admin-badge--blocked">Blocked</span> : null}
                  </div>
                </div>

                <details className="admin-details">
                  <summary>Account details</summary>
                  <dl className="admin-meta admin-meta--compact">
                    <div>
                      <dt>Active plan</dt>
                      <dd>
                        {account.plan_id ? planLabel(account.plan_id) : '—'}
                        {account.plan_status ? ` (${account.plan_status})` : ''}
                      </dd>
                    </div>
                    {account.current_period_end ? (
                      <div>
                        <dt>Renewal</dt>
                        <dd>{formatAdminDate(account.current_period_end)}</dd>
                      </div>
                    ) : null}
                    {account.tax_id ? (
                      <div>
                        <dt>Tax ID</dt>
                        <dd>{account.tax_id}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Registered</dt>
                      <dd>{formatAdminDate(account.created_at)}</dd>
                    </div>
                  </dl>
                </details>

                <div className="admin-card__actions admin-card__actions--primary">
                  {!account.is_platform_admin ? (
                    <button
                      type="button"
                      className={account.blocked ? 'btn btn--gold btn--small' : 'btn btn--secondary btn--small'}
                      disabled={busyId === account.profile_id}
                      onClick={() => onToggleBlocked(account)}
                    >
                      {account.blocked ? 'Unblock' : 'Block'}
                    </button>
                  ) : null}
                </div>

                {isCoach ? (
                  <details className="admin-details admin-details--secondary">
                    <summary>Manual plan activation</summary>
                    <div className="admin-card__actions admin-card__actions--secondary">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === account.profile_id}
                        onClick={() => onActivatePlan(account, 'team')}
                      >
                        Coach
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === account.profile_id}
                        onClick={() => onActivatePlan(account, 'club')}
                      >
                        Premium
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === account.profile_id}
                        onClick={() => onActivatePlan(account, 'organization')}
                      >
                        Team Academy
                      </button>
                    </div>
                  </details>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
