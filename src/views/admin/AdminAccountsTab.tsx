import type { AdminAccount } from '../../adminApi'
import type { AccountDeletionRequest } from '../../accountDeletionApi'
import type { BillingInterval, PlanId } from '../../plans'
import { useI18n } from '../../i18n'
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
  const { t, messages } = useI18n()
  const a = messages.ui.admin as Record<string, string>
  const coachRole = messages.roles.coach
  const athleteRole = messages.roles.athlete

  const roleOptions: { value: AccountRole; label: string }[] = [
    { value: 'all', label: a.roleAll },
    { value: 'treinador', label: a.roleCoaches },
    { value: 'atleta', label: a.roleAthletes },
  ]

  return (
    <div className="admin-panel">
      <p className="admin-panel__intro muted">{a.accountsIntro}</p>

      {deletionRequests.length > 0 ? (
        <section className="admin-deletion-banner">
          <div className="admin-deletion-banner__head">
            <strong>
              {deletionRequests.length === 1
                ? t('ui.admin.deletionRequest', { count: deletionRequests.length })
                : t('ui.admin.deletionRequests', { count: deletionRequests.length })}
            </strong>
            <span className="muted">{a.verifyIdentity}</span>
          </div>
          <div className="admin-list admin-list--compact">
            {deletionRequests.map((request) => (
              <article key={request.id} className="admin-card admin-card--danger admin-card--inline">
                <div className="admin-card__head">
                  <div>
                    <h2>{request.email}</h2>
                    <p className="muted">
                      {request.role === 'treinador' ? coachRole : athleteRole} · {formatAdminDate(request.created_at)}
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
                    {busyId === request.id ? a.processing : a.approveAndDelete}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={busyId === request.id}
                    onClick={() => onProcessDeletion(request, 'reject')}
                  >
                    {a.reject}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="admin-toolbar admin-toolbar--wrap">
        <label className="field field--pro admin-toolbar__field admin-toolbar__field--grow">
          <span>{a.search}</span>
          <input
            value={accountSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder={a.searchPlaceholder}
          />
        </label>
        <AdminFilterPills
          label={a.role}
          value={accountRole}
          options={roleOptions}
          onChange={onRoleChange}
          filterAriaLabel={a.filter}
        />
        <label className="field field--pro admin-toolbar__check">
          <input type="checkbox" checked={blockedOnly} onChange={(e) => onBlockedOnlyChange(e.target.checked)} />
          <span>{a.blockedOnly}</span>
        </label>
        <button type="button" className="btn btn--secondary btn--small" onClick={onSearch}>
          {a.search}
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="admin-empty">{a.noAccountsFound}</p>
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
                      {account.email} · {account.role === 'treinador' ? coachRole : athleteRole}
                      {account.organization_name ? ` · ${account.organization_name}` : ''}
                    </p>
                    <p className="admin-card__summary">{planSummary}</p>
                  </div>
                  <div className="admin-card__badges">
                    {account.is_platform_admin ? (
                      <span className="admin-badge admin-badge--admin">{a.adminBadge}</span>
                    ) : null}
                    {account.blocked ? <span className="admin-badge admin-badge--blocked">{a.blocked}</span> : null}
                  </div>
                </div>

                <details className="admin-details">
                  <summary>{a.accountDetails}</summary>
                  <dl className="admin-meta admin-meta--compact">
                    <div>
                      <dt>{a.activePlan}</dt>
                      <dd>
                        {account.plan_id ? planLabel(account.plan_id) : '—'}
                        {account.plan_status ? ` (${account.plan_status})` : ''}
                      </dd>
                    </div>
                    {account.current_period_end ? (
                      <div>
                        <dt>{a.renewal}</dt>
                        <dd>{formatAdminDate(account.current_period_end)}</dd>
                      </div>
                    ) : null}
                    {account.tax_id ? (
                      <div>
                        <dt>{a.taxId}</dt>
                        <dd>{account.tax_id}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>{a.registered}</dt>
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
                      {account.blocked ? a.unblock : a.block}
                    </button>
                  ) : null}
                </div>

                {isCoach ? (
                  <details className="admin-details admin-details--secondary">
                    <summary>{a.manualPlanActivation}</summary>
                    <div className="admin-card__actions admin-card__actions--secondary">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === account.profile_id}
                        onClick={() => onActivatePlan(account, 'team')}
                      >
                        {planLabel('team')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === account.profile_id}
                        onClick={() => onActivatePlan(account, 'club')}
                      >
                        {planLabel('club')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === account.profile_id}
                        onClick={() => onActivatePlan(account, 'organization')}
                      >
                        {planLabel('organization')}
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
