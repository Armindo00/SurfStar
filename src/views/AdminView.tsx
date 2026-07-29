import { useCallback, useEffect, useState } from 'react'
import { getBillingCountryName } from '../billingCountries'
import {
  adminActivateCoachPlan,
  adminActivatePlanRequest,
  adminFetchAccounts,
  adminFetchDashboard,
  adminFetchPlanRequests,
  adminReviewPlanRequest,
  adminSetAccountBlocked,
  type AdminAccount,
  type AdminBillingSubscription,
  type AdminDashboardStats,
  type AdminPlanRequest,
  type AdminRequestFilter,
  type AdminSubscriptionFilter,
} from '../adminApi'
import {
  adminFetchAccountDeletionRequests,
  adminProcessAccountDeletionRequest,
  type AccountDeletionRequest,
} from '../accountDeletionApi'
import {
  adminFetchContactMessages,
  adminUpdateContactMessageStatus,
} from '../contactApi'
import { contactKindLabel } from '../contactKinds'
import { formatAppDateTime } from '../dateFormat'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonCard } from '../components/Skeleton'
import { useToast } from '../components/ToastProvider'
import {
  formatPlanPriceWithSuffix,
  formatPlanTotalPrice,
  getPlan,
  type BillingInterval,
  type PlanId,
} from '../plans'
import { useApp } from '../AppContext'
import { UNSEEN } from '../unseenDomains'
import type { ContactMessage, ContactMessageStatus } from '../types'
import { AdminSubscriptionsTab, loadAdminSubscriptions } from './admin/AdminSubscriptionsTab'
import { AdminManualPaymentSettings } from './admin/AdminManualPaymentSettings'

type AdminTab = 'dashboard' | 'requests' | 'subscriptions' | 'accounts' | 'contact'

function formatDate(value: string | null): string {
  if (!value) return '—'
  return formatAppDateTime(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function planLabel(planId: string | null): string {
  if (!planId) return '—'
  try {
    return getPlan(planId as PlanId).name
  } catch {
    return planId
  }
}

function planIdLabel(planId: string | null): string {
  if (!planId) return '—'
  const labels: Record<string, string> = {
    team: 'Coach',
    club: 'Coach Premium',
    organization: 'Team Academy',
  }
  return labels[planId] ?? planId
}

function billingIntervalLabel(interval: BillingInterval | string | null | undefined): string {
  return interval === 'annual' ? 'Annual' : 'Monthly'
}

function planRequestSummary(planId: PlanId, billingInterval: BillingInterval): string {
  const plan = getPlan(planId)
  const price =
    billingInterval === 'annual'
      ? `${formatPlanTotalPrice(plan, 'annual')}/year`
      : `${formatPlanPriceWithSuffix(plan, 'monthly')}`
  return `${plan.name} · ${billingIntervalLabel(billingInterval)} · ${price}`
}

function requestAmount(request: AdminPlanRequest): string {
  try {
    return formatPlanTotalPrice(getPlan(request.plan_id), request.billing_interval)
  } catch {
    return '—'
  }
}

function requestPhase(request: AdminPlanRequest): { label: string; tone: string } {
  if (request.activated_at) {
    return { label: 'Activated', tone: 'activated' }
  }
  if (request.status === 'pending') {
    return { label: 'Pending review', tone: 'pending' }
  }
  if (request.status === 'approved' && request.payment_status === 'unpaid') {
    return { label: 'Awaiting payment', tone: 'awaiting' }
  }
  if (request.status === 'rejected') {
    return { label: 'Rejected', tone: 'rejected' }
  }
  if (request.status === 'approved') {
    return { label: 'Approved', tone: 'approved' }
  }
  return { label: request.status, tone: 'pending' }
}

function accountPlanInfo(account: AdminAccount): {
  headline: string
  subline: string
  tone: 'active' | 'pending' | 'none'
} {
  const activePlanId = account.plan_id
  const activeStatus = account.plan_status

  if (
    activePlanId &&
    (activeStatus === 'active' || activeStatus === 'trialing')
  ) {
    const interval = account.billing_interval ?? account.requested_billing_interval ?? 'monthly'
    const renewal = account.current_period_end
      ? `Renews ${formatDate(account.current_period_end)}`
      : 'No renewal date'
    return {
      headline: planLabel(activePlanId),
      subline: `${activeStatus === 'trialing' ? 'Trialing' : 'Active subscription'} · ${billingIntervalLabel(interval)} · ${renewal}`,
      tone: 'active',
    }
  }

  if (account.requested_plan_id) {
    try {
      const planId = account.requested_plan_id as PlanId
      const interval = (account.requested_billing_interval ?? 'monthly') as BillingInterval
      const awaiting =
        !account.requested_plan_activated_at &&
        account.requested_plan_status !== 'rejected'
      return {
        headline: planRequestSummary(planId, interval),
        subline: awaiting
          ? `Requested plan — unlock ${planIdLabel(planId)} on payment confirmation`
          : `Last request: ${account.requested_plan_status ?? 'unknown'}`,
        tone: awaiting ? 'pending' : 'none',
      }
    } catch {
      return {
        headline: planLabel(account.requested_plan_id),
        subline: 'Requested plan on file',
        tone: 'pending',
      }
    }
  }

  return {
    headline: 'No active plan',
    subline: 'Coach is waiting for plan activation',
    tone: 'none',
  }
}

export function AdminView() {
  const { auth, cloudMode, setView, markSeen, countUnseen } = useApp()
  const { showToast } = useToast()
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [requests, setRequests] = useState<AdminPlanRequest[]>([])
  const [subscriptions, setSubscriptions] = useState<AdminBillingSubscription[]>([])
  const [subscriptionFilter, setSubscriptionFilter] = useState<AdminSubscriptionFilter>('all')
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [deletionRequests, setDeletionRequests] = useState<AccountDeletionRequest[]>([])
  const [newContactCount, setNewContactCount] = useState(0)
  const [requestFilter, setRequestFilter] = useState<AdminRequestFilter>('pending')
  const [contactFilter, setContactFilter] = useState<'new' | 'read' | 'resolved' | 'all'>('new')
  const [accountRole, setAccountRole] = useState<'all' | 'treinador' | 'atleta'>('all')
  const [accountSearch, setAccountSearch] = useState('')
  const [blockedOnly, setBlockedOnly] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [pendingPlanRequestItems, setPendingPlanRequestItems] = useState<{ id: string }[]>([])

  const isAdmin = auth?.role === 'treinador' && auth.isPlatformAdmin

  const unseenPlanRequests = countUnseen(UNSEEN.adminPlanRequests, pendingPlanRequestItems)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchDashboard()
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setStats(result.stats)
  }, [])

  const loadRequests = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchPlanRequests(requestFilter)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setRequests(result.requests)
  }, [requestFilter])

  const loadSubscriptions = useCallback(async () => {
    setLoading(true)
    const result = await loadAdminSubscriptions(subscriptionFilter)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSubscriptions(result.subscriptions)
  }, [subscriptionFilter])

  const loadAccounts = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchAccounts({
      role: accountRole === 'all' ? null : accountRole,
      search: accountSearch.trim() || undefined,
      blockedOnly,
    })
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setAccounts(result.accounts)
  }, [accountRole, accountSearch, blockedOnly])

  const loadDeletionRequests = useCallback(async () => {
    const result = await adminFetchAccountDeletionRequests('pending')
    if (result.ok) setDeletionRequests(result.requests)
  }, [])

  const loadContactMessages = useCallback(async () => {
    setLoading(true)
    const result = await adminFetchContactMessages(contactFilter === 'all' ? null : contactFilter)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setContactMessages(result.messages)
    if (contactFilter === 'new') {
      setNewContactCount(result.messages.length)
    }
  }, [contactFilter])

  const refreshNewContactCount = useCallback(async () => {
    const result = await adminFetchContactMessages('new')
    if (result.ok) setNewContactCount(result.messages.length)
  }, [])

  const refreshPendingPlanRequestItems = useCallback(async () => {
    const [pending, awaiting] = await Promise.all([
      adminFetchPlanRequests('pending'),
      adminFetchPlanRequests('awaiting_payment'),
    ])
    const items: { id: string }[] = []
    if (pending.ok) items.push(...pending.requests.map((r) => ({ id: r.id })))
    if (awaiting.ok) items.push(...awaiting.requests.map((r) => ({ id: r.id })))
    setPendingPlanRequestItems(items)
  }, [])

  useEffect(() => {
    if (!isAdmin || !cloudMode) return
    void refreshPendingPlanRequestItems()
  }, [isAdmin, cloudMode, refreshPendingPlanRequestItems])

  useEffect(() => {
    if (tab !== 'requests' || requests.length === 0) return
    const unseenIds = requests
      .filter((request) => {
        const phase = requestPhase(request)
        return phase.tone === 'pending' || phase.tone === 'awaiting'
      })
      .map((request) => request.id)
    if (unseenIds.length > 0) markSeen(UNSEEN.adminPlanRequests, unseenIds)
  }, [tab, requests, markSeen])

  useEffect(() => {
    if (!isAdmin || !cloudMode || tab !== 'subscriptions') return
    void loadSubscriptions()
  }, [subscriptionFilter, tab, isAdmin, cloudMode, loadSubscriptions])

  useEffect(() => {
    if (!isAdmin || !cloudMode) return
    setError('')
    if (tab === 'dashboard') void loadDashboard()
    if (tab === 'requests') void loadRequests()
    if (tab === 'subscriptions') void loadSubscriptions()
    if (tab === 'accounts') {
      void loadAccounts()
      void loadDeletionRequests()
    }
    if (tab === 'contact') void loadContactMessages()
  }, [tab, isAdmin, cloudMode, loadDashboard, loadRequests, loadSubscriptions, loadAccounts, loadContactMessages, loadDeletionRequests])

  useEffect(() => {
    if (!isAdmin || !cloudMode) return
    void refreshNewContactCount()
  }, [isAdmin, cloudMode, refreshNewContactCount])

  const runRequestAction = async (
    request: AdminPlanRequest,
    action: () => Promise<{ ok: boolean; error?: string; message?: string }>,
    successFallback: string,
  ) => {
    setBusyId(request.id)
    setError('')
    try {
      const result = await action()
      if (!result.ok) {
        setError(result.error ?? 'Action failed.')
        return
      }
      showToast(result.message ?? successFallback, 'success')
      await loadRequests()
      await loadDashboard()
      await refreshPendingPlanRequestItems()
    } finally {
      setBusyId(null)
    }
  }

  const approveRequest = (request: AdminPlanRequest) =>
    runRequestAction(request, () => adminReviewPlanRequest(request.id, 'approve', notesDraft[request.id], false), 'Request approved.')

  const rejectRequest = (request: AdminPlanRequest) =>
    runRequestAction(request, () => adminReviewPlanRequest(request.id, 'reject', notesDraft[request.id]), 'Request rejected.')

  const confirmPayment = (request: AdminPlanRequest) =>
    runRequestAction(
      request,
      () => adminActivatePlanRequest(request.id, 'paid', notesDraft[request.id]),
      'Payment confirmed and plan activated.',
    )

  const activateFree = (request: AdminPlanRequest) =>
    runRequestAction(
      request,
      () => adminActivatePlanRequest(request.id, 'waived', notesDraft[request.id]),
      'Plan activated without payment.',
    )

  const toggleBlocked = async (account: AdminAccount) => {
    setBusyId(account.profile_id)
    setError('')
    try {
      const result = await adminSetAccountBlocked(account.profile_id, !account.blocked)
      if (!result.ok) {
        setError(result.error)
        return
      }
      showToast(account.blocked ? 'Account unblocked.' : 'Account blocked.', 'success')
      await loadAccounts()
      await loadDashboard()
    } finally {
      setBusyId(null)
    }
  }

  const activatePlan = async (account: AdminAccount, planId: PlanId, billingInterval: BillingInterval = 'monthly') => {
    setBusyId(account.profile_id)
    setError('')
    try {
      const result = await adminActivateCoachPlan(
        account.profile_id,
        account.organization_name ?? `${account.name}'s Team`,
        planId,
        billingInterval,
      )
      if (!result.ok) {
        setError(result.error)
        return
      }
      showToast(`${planLabel(planId)} plan activated.`, 'success')
      await loadAccounts()
    } finally {
      setBusyId(null)
    }
  }

  const goToTab = (nextTab: AdminTab, options?: { requestFilter?: AdminRequestFilter; subscriptionFilter?: AdminSubscriptionFilter; contactFilter?: typeof contactFilter }) => {
    if (options?.requestFilter) setRequestFilter(options.requestFilter)
    if (options?.subscriptionFilter) setSubscriptionFilter(options.subscriptionFilter)
    if (options?.contactFilter) setContactFilter(options.contactFilter)
    setTab(nextTab)
  }

  const renewalAttentionCount = (stats?.renewals_due_7d ?? 0) + (stats?.renewals_overdue ?? 0)

  const processDeletionRequest = async (request: AccountDeletionRequest, action: 'approve' | 'reject') => {
    const label = action === 'approve' ? 'permanently delete this account' : 'reject this deletion request'
    if (!window.confirm(`Are you sure you want to ${label} for ${request.email}?`)) return

    setBusyId(request.id)
    setError('')
    try {
      const result = await adminProcessAccountDeletionRequest(request.id, action)
      if (!result.ok) {
        setError(result.error)
        return
      }
      showToast(action === 'approve' ? 'Account deleted.' : 'Deletion request rejected.', 'success')
      await loadDeletionRequests()
      await loadAccounts()
      await loadDashboard()
    } finally {
      setBusyId(null)
    }
  }

  const updateContactStatus = async (message: ContactMessage, status: ContactMessageStatus) => {
    setBusyId(message.id)
    setError('')
    try {
      const result = await adminUpdateContactMessageStatus(message.id, status)
      if (!result.ok) {
        setError(result.error)
        return
      }
      showToast(`Message marked as ${status}.`, 'success')
      await loadContactMessages()
      await refreshNewContactCount()
    } finally {
      setBusyId(null)
    }
  }

  if (!cloudMode) {
    return (
      <div className="admin-page">
        <ScreenHeader title="Admin" onBack={() => setView('coach-home')} />
        <p className="muted admin-page__hint">The admin panel is only available in cloud mode (Supabase).</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <ScreenHeader title="Admin" onBack={() => setView('coach-home')} />
        <p className="muted admin-page__hint">You do not have platform administrator permissions.</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <ScreenHeader title="SurfStar Admin" onBack={() => setView('coach-home')} />

      <nav className="admin-tabs" aria-label="Admin sections">
        {(
          [
            ['dashboard', 'Overview'],
            ['requests', 'Payments'],
            ['subscriptions', 'Subscriptions'],
            ['accounts', 'Accounts'],
            ['contact', 'Contact'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'admin-tabs__btn admin-tabs__btn--active' : 'admin-tabs__btn'}
            onClick={() => setTab(id)}
          >
            {label}
            {id === 'requests' && unseenPlanRequests > 0 ? (
              <span className="admin-tabs__badge">{unseenPlanRequests}</span>
            ) : null}
            {id === 'subscriptions' && renewalAttentionCount > 0 ? (
              <span className="admin-tabs__badge">{renewalAttentionCount}</span>
            ) : null}
            {id === 'contact' && newContactCount > 0 ? (
              <span className="admin-tabs__badge">{newContactCount}</span>
            ) : null}
            {id === 'accounts' && deletionRequests.length > 0 ? (
              <span className="admin-tabs__badge">{deletionRequests.length}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {error ? <p className="login-error admin-page__error">{error}</p> : null}

      {loading ? <SkeletonCard lines={5} /> : null}

      {!loading && tab === 'dashboard' && stats ? (
        <>
          {(stats.pending_requests > 0 ||
            stats.awaiting_payment > 0 ||
            stats.renewals_due_7d > 0 ||
            stats.renewals_overdue > 0 ||
            newContactCount > 0) && (
            <section className="admin-attention">
              <h2 className="admin-attention__title">Needs attention</h2>
              <div className="admin-attention__grid">
                {stats.pending_requests > 0 ? (
                  <button
                    type="button"
                    className="admin-attention-card admin-attention-card--pending"
                    onClick={() => goToTab('requests', { requestFilter: 'pending' })}
                  >
                    <strong>{stats.pending_requests}</strong>
                    <span>Pending review</span>
                  </button>
                ) : null}
                {stats.awaiting_payment > 0 ? (
                  <button
                    type="button"
                    className="admin-attention-card admin-attention-card--awaiting"
                    onClick={() => goToTab('requests', { requestFilter: 'awaiting_payment' })}
                  >
                    <strong>{stats.awaiting_payment}</strong>
                    <span>Awaiting payment</span>
                  </button>
                ) : null}
                {stats.renewals_due_7d > 0 ? (
                  <button
                    type="button"
                    className="admin-attention-card admin-attention-card--due"
                    onClick={() => goToTab('subscriptions', { subscriptionFilter: 'due_7d' })}
                  >
                    <strong>{stats.renewals_due_7d}</strong>
                    <span>Renewals due this week</span>
                  </button>
                ) : null}
                {stats.renewals_overdue > 0 ? (
                  <button
                    type="button"
                    className="admin-attention-card admin-attention-card--overdue"
                    onClick={() => goToTab('subscriptions', { subscriptionFilter: 'overdue' })}
                  >
                    <strong>{stats.renewals_overdue}</strong>
                    <span>Overdue renewals</span>
                  </button>
                ) : null}
                {newContactCount > 0 ? (
                  <button
                    type="button"
                    className="admin-attention-card admin-attention-card--contact"
                    onClick={() => goToTab('contact', { contactFilter: 'new' })}
                  >
                    <strong>{newContactCount}</strong>
                    <span>New messages</span>
                  </button>
                ) : null}
              </div>
            </section>
          )}

          <div className="admin-stats">
            <div className="admin-stat-card">
              <strong>{stats.coaches}</strong>
              <span>Coaches</span>
            </div>
            <div className="admin-stat-card">
              <strong>{stats.athletes}</strong>
              <span>Athletes</span>
            </div>
            <div className="admin-stat-card">
              <strong>{stats.organizations}</strong>
              <span>Organizations</span>
            </div>
            <div className="admin-stat-card admin-stat-card--highlight">
              <strong>{stats.active_subscriptions}</strong>
              <span>Active subscriptions</span>
            </div>
            <div className="admin-stat-card">
              <strong>{stats.monthly_subscribers}</strong>
              <span>Monthly</span>
            </div>
            <div className="admin-stat-card">
              <strong>{stats.annual_subscribers}</strong>
              <span>Annual</span>
            </div>
            <div className="admin-stat-card admin-stat-card--highlight">
              <strong>{stats.pending_requests}</strong>
              <span>Pending review</span>
            </div>
            <div className="admin-stat-card admin-stat-card--highlight">
              <strong>{stats.awaiting_payment}</strong>
              <span>Awaiting payment</span>
            </div>
            <div className="admin-stat-card">
              <strong>{stats.blocked_accounts}</strong>
              <span>Blocked accounts</span>
            </div>
          </div>

          <div className="admin-workflow">
            <article className="admin-workflow-card">
              <h3>New sign-ups</h3>
              <p className="muted">
                Approve request → coach receives payment details by email → confirm payment to activate.
              </p>
              <button type="button" className="btn btn--secondary btn--small" onClick={() => goToTab('requests')}>
                Open Payments
              </button>
            </article>
            <article className="admin-workflow-card">
              <h3>Recurring billing</h3>
              <p className="muted">
                Track monthly and annual renewals. Confirm payment to extend the subscription period automatically.
              </p>
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => goToTab('subscriptions', { subscriptionFilter: 'due_7d' })}
              >
                Open Subscriptions
              </button>
            </article>
            <article className="admin-workflow-card">
              <h3>Accounts & support</h3>
              <p className="muted">Block accounts, manually activate plans, and respond to contact messages.</p>
              <div className="admin-workflow-card__actions">
                <button type="button" className="btn btn--ghost btn--small" onClick={() => goToTab('accounts')}>
                  Accounts
                </button>
                <button type="button" className="btn btn--ghost btn--small" onClick={() => goToTab('contact')}>
                  Contact
                </button>
              </div>
            </article>
          </div>
        </>
      ) : null}

      {!loading && tab === 'requests' ? (
        <div className="admin-panel">
          <AdminManualPaymentSettings onToast={(message) => showToast(message, 'success')} />

          <div className="admin-toolbar">
            <label className="field field--pro admin-toolbar__field">
              <span>Filter</span>
              <select
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value as AdminRequestFilter)}
              >
                <option value="pending">Pending review</option>
                <option value="awaiting_payment">Awaiting payment</option>
                <option value="activated">Activated</option>
                <option value="approved">Approved (all)</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </label>
            <button type="button" className="btn btn--secondary btn--small" onClick={() => void loadRequests()}>
              Refresh
            </button>
          </div>

          {requests.length === 0 ? (
            <p className="muted">No payment requests match this filter.</p>
          ) : (
            <div className="admin-list">
              {requests.map((request) => {
                const phase = requestPhase(request)
                const isOpen = !request.activated_at && request.status !== 'rejected'

                return (
                  <article key={request.id} className="admin-card">
                    <div className="admin-card__head">
                      <div>
                        <h2>{request.organization_name}</h2>
                        <p className="muted">
                          {request.contact_name} · {request.email}
                        </p>
                      </div>
                      <div className="admin-card__badges">
                        <span className={`admin-badge admin-badge--${phase.tone}`}>{phase.label}</span>
                        <span className="admin-badge admin-badge--plan">{planIdLabel(request.plan_id)}</span>
                      </div>
                    </div>

                    <div className="admin-plan-banner">
                      <span className="admin-plan-banner__eyebrow">Requested plan to unlock</span>
                      <strong className="admin-plan-banner__title">
                        {planRequestSummary(request.plan_id, request.billing_interval)}
                      </strong>
                      <p className="admin-plan-banner__hint muted">
                        When you confirm payment, activate{' '}
                        <strong>{planLabel(request.plan_id)}</strong> ({planIdLabel(request.plan_id)}).
                      </p>
                    </div>

                    <dl className="admin-meta">
                      <div>
                        <dt>Plan ID</dt>
                        <dd>{request.plan_id}</dd>
                      </div>
                      <div>
                        <dt>Plan name</dt>
                        <dd>{planLabel(request.plan_id)}</dd>
                      </div>
                      <div>
                        <dt>Billing</dt>
                        <dd>{billingIntervalLabel(request.billing_interval)}</dd>
                      </div>
                      <div>
                        <dt>Amount</dt>
                        <dd>{requestAmount(request)}</dd>
                      </div>
                      <div>
                        <dt>Submitted</dt>
                        <dd>{formatDate(request.created_at)}</dd>
                      </div>
                      <div>
                        <dt>Coaches</dt>
                        <dd>{request.coaches_count ?? '—'}</dd>
                      </div>
                      <div>
                        <dt>Account registered</dt>
                        <dd>{request.coach_registered ? 'Yes' : 'Not yet'}</dd>
                      </div>
                      {request.tax_id ? (
                        <div>
                          <dt>Tax ID / VAT</dt>
                          <dd>{request.tax_id}</dd>
                        </div>
                      ) : null}
                      {request.billing_street ? (
                        <div className="admin-meta__wide">
                          <dt>Address line 1</dt>
                          <dd>{request.billing_street}</dd>
                        </div>
                      ) : request.billing_address ? (
                        <div className="admin-meta__wide">
                          <dt>Address</dt>
                          <dd>{request.billing_address}</dd>
                        </div>
                      ) : null}
                      {request.billing_address_line2 ? (
                        <div className="admin-meta__wide">
                          <dt>Address line 2</dt>
                          <dd>{request.billing_address_line2}</dd>
                        </div>
                      ) : null}
                      {request.billing_postal_code ? (
                        <div>
                          <dt>Postal / ZIP</dt>
                          <dd>{request.billing_postal_code}</dd>
                        </div>
                      ) : null}
                      {request.billing_city ? (
                        <div>
                          <dt>City</dt>
                          <dd>{request.billing_city}</dd>
                        </div>
                      ) : null}
                      {request.billing_region ? (
                        <div>
                          <dt>State / region</dt>
                          <dd>{request.billing_region}</dd>
                        </div>
                      ) : null}
                      {request.billing_country ? (
                        <div>
                          <dt>Country</dt>
                          <dd>
                            {getBillingCountryName(request.billing_country)} ({request.billing_country})
                          </dd>
                        </div>
                      ) : null}
                      {request.reviewed_at ? (
                        <div>
                          <dt>Reviewed</dt>
                          <dd>{formatDate(request.reviewed_at)}</dd>
                        </div>
                      ) : null}
                      {request.paid_at ? (
                        <div>
                          <dt>Paid</dt>
                          <dd>{formatDate(request.paid_at)}</dd>
                        </div>
                      ) : null}
                      {request.activated_at ? (
                        <div>
                          <dt>Activated</dt>
                          <dd>{formatDate(request.activated_at)}</dd>
                        </div>
                      ) : null}
                    </dl>
                    {request.message ? <p className="admin-card__message">{request.message}</p> : null}
                    {request.notes ? <p className="muted admin-card__notes">Notes: {request.notes}</p> : null}

                    {isOpen ? (
                      <>
                        <label className="field field--pro">
                          <span>Internal notes (optional)</span>
                          <textarea
                            rows={2}
                            value={notesDraft[request.id] ?? ''}
                            onChange={(e) =>
                              setNotesDraft((prev) => ({ ...prev, [request.id]: e.target.value }))
                            }
                            placeholder="Payment reference, IBAN sent, etc."
                          />
                        </label>
                        <div className="admin-card__actions">
                          {request.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                className="btn btn--gold btn--small"
                                disabled={busyId === request.id}
                                onClick={() => void approveRequest(request)}
                              >
                                Approve (await payment)
                              </button>
                              <button
                                type="button"
                                className="btn btn--secondary btn--small"
                                disabled={busyId === request.id}
                                onClick={() => void rejectRequest(request)}
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--small"
                                disabled={busyId === request.id}
                                onClick={() => void confirmPayment(request)}
                              >
                                Confirm payment & activate {planLabel(request.plan_id)}
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--small"
                                disabled={busyId === request.id}
                                onClick={() => void activateFree(request)}
                              >
                                Activate {planLabel(request.plan_id)} free
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="btn btn--gold btn--small"
                                disabled={busyId === request.id}
                                onClick={() => void confirmPayment(request)}
                              >
                                Confirm payment & activate {planLabel(request.plan_id)}
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--small"
                                disabled={busyId === request.id}
                                onClick={() => void activateFree(request)}
                              >
                                Activate {planLabel(request.plan_id)} free
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      {!loading && tab === 'subscriptions' ? (
        <AdminSubscriptionsTab
          filter={subscriptionFilter}
          onFilterChange={setSubscriptionFilter}
          subscriptions={subscriptions}
          loading={loading}
          busyId={busyId}
          error={error}
          notesDraft={notesDraft}
          onNotesChange={(coachId, notes) =>
            setNotesDraft((prev) => ({ ...prev, [coachId]: notes }))
          }
          onReload={loadSubscriptions}
          onError={setError}
          onBusyChange={setBusyId}
          onToast={(message) => showToast(message, 'success')}
          onDashboardRefresh={loadDashboard}
        />
      ) : null}

      {!loading && tab === 'accounts' ? (
        <div className="admin-panel">
          {deletionRequests.length > 0 ? (
            <section className="admin-deletion-requests">
              <h3 className="stats-panel__title">Account deletion requests</h3>
              <p className="muted">Approve only after verifying the user identity. Deletion is permanent.</p>
              <div className="admin-list">
                {deletionRequests.map((request) => (
                  <article key={request.id} className="admin-card admin-card--danger">
                    <div className="admin-card__head">
                      <div>
                        <h2>{request.email}</h2>
                        <p className="muted">
                          {request.role === 'treinador' ? 'Coach' : 'Athlete'} · {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                    {request.reason ? <p className="admin-card__message">{request.reason}</p> : null}
                    <div className="admin-card__actions">
                      <button
                        type="button"
                        className="btn btn--danger btn--small"
                        disabled={busyId === request.id}
                        onClick={() => void processDeletionRequest(request, 'approve')}
                      >
                        {busyId === request.id ? 'Processing…' : 'Approve & delete'}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === request.id}
                        onClick={() => void processDeletionRequest(request, 'reject')}
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
            <label className="field field--pro admin-toolbar__field">
              <span>Search</span>
              <input
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Name or email"
              />
            </label>
            <label className="field field--pro admin-toolbar__field">
              <span>Role</span>
              <select value={accountRole} onChange={(e) => setAccountRole(e.target.value as typeof accountRole)}>
                <option value="all">All</option>
                <option value="treinador">Coaches</option>
                <option value="atleta">Athletes</option>
              </select>
            </label>
            <label className="field field--pro admin-toolbar__check">
              <input
                type="checkbox"
                checked={blockedOnly}
                onChange={(e) => setBlockedOnly(e.target.checked)}
              />
              <span>Blocked only</span>
            </label>
            <button type="button" className="btn btn--secondary btn--small" onClick={() => void loadAccounts()}>
              Search
            </button>
          </div>

          {accounts.length === 0 ? (
            <p className="muted">No accounts found.</p>
          ) : (
            <div className="admin-list">
              {accounts.map((account) => {
                const planInfo = accountPlanInfo(account)

                return (
                <article key={account.profile_id} className="admin-card">
                  <div className="admin-card__head">
                    <div>
                      <h2>{account.name}</h2>
                      <p className="muted">
                        {account.email} · {account.role === 'treinador' ? 'Coach' : 'Athlete'}
                      </p>
                    </div>
                    <div className="admin-card__badges">
                      <span className={`admin-badge admin-badge--plan admin-badge--plan-${planInfo.tone}`}>
                        {planInfo.headline}
                      </span>
                      {account.is_platform_admin ? <span className="admin-badge admin-badge--admin">Admin</span> : null}
                      {account.blocked ? <span className="admin-badge admin-badge--blocked">Blocked</span> : null}
                    </div>
                  </div>

                  <div className={`admin-plan-banner admin-plan-banner--${planInfo.tone}`}>
                    <span className="admin-plan-banner__eyebrow">
                      {planInfo.tone === 'active' ? 'Current plan' : 'Plan status'}
                    </span>
                    <strong className="admin-plan-banner__title">{planInfo.headline}</strong>
                    <p className="admin-plan-banner__hint muted">{planInfo.subline}</p>
                  </div>

                  <dl className="admin-meta">
                    <div>
                      <dt>Active plan</dt>
                      <dd>
                        {account.plan_id ? planLabel(account.plan_id) : '—'}
                        {account.plan_status ? ` (${account.plan_status})` : ''}
                      </dd>
                    </div>
                    {account.requested_plan_id && account.requested_plan_id !== account.plan_id ? (
                      <div>
                        <dt>Requested plan</dt>
                        <dd>
                          {planLabel(account.requested_plan_id)}
                          {account.requested_billing_interval
                            ? ` · ${billingIntervalLabel(account.requested_billing_interval)}`
                            : ''}
                        </dd>
                      </div>
                    ) : null}
                    {account.billing_interval ? (
                      <div>
                        <dt>Billing cycle</dt>
                        <dd>{billingIntervalLabel(account.billing_interval)}</dd>
                      </div>
                    ) : null}
                    {account.current_period_end ? (
                      <div>
                        <dt>Renewal date</dt>
                        <dd>{formatDate(account.current_period_end)}</dd>
                      </div>
                    ) : null}
                    {account.tax_id ? (
                      <div>
                        <dt>Tax ID / VAT</dt>
                        <dd>{account.tax_id}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Organization</dt>
                      <dd>{account.organization_name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Registered</dt>
                      <dd>{formatDate(account.created_at)}</dd>
                    </div>
                  </dl>
                  <div className="admin-card__actions">
                    {!account.is_platform_admin ? (
                      <button
                        type="button"
                        className={account.blocked ? 'btn btn--gold btn--small' : 'btn btn--secondary btn--small'}
                        disabled={busyId === account.profile_id}
                        onClick={() => void toggleBlocked(account)}
                      >
                        {account.blocked ? 'Unblock' : 'Block'}
                      </button>
                    ) : null}
                    {account.role === 'treinador' && !account.is_platform_admin ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          disabled={busyId === account.profile_id}
                          onClick={() => void activatePlan(account, 'team')}
                        >
                          Activate Coach
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          disabled={busyId === account.profile_id}
                          onClick={() => void activatePlan(account, 'club')}
                        >
                          Activate Premium
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          disabled={busyId === account.profile_id}
                          onClick={() => void activatePlan(account, 'organization')}
                        >
                          Activate Team Academy
                        </button>
                      </>
                    ) : null}
                  </div>
                </article>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      {!loading && tab === 'contact' ? (
        <div className="admin-panel">
          <div className="admin-toolbar">
            <label className="field field--pro admin-toolbar__field">
              <span>Status</span>
              <select
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value as typeof contactFilter)}
              >
                <option value="new">New</option>
                <option value="read">Read</option>
                <option value="resolved">Resolved</option>
                <option value="all">All</option>
              </select>
            </label>
            <button type="button" className="btn btn--secondary btn--small" onClick={() => void loadContactMessages()}>
              Refresh
            </button>
          </div>

          {contactMessages.length === 0 ? (
            <p className="muted">No contact messages match this filter.</p>
          ) : (
            <div className="admin-list">
              {contactMessages.map((message) => (
                <article key={message.id} className="admin-card">
                  <div className="admin-card__head">
                    <div>
                      <h2>{message.subject}</h2>
                      <p className="muted">
                        {message.name} · {message.email}
                        {message.userRole ? ` · ${message.userRole === 'treinador' ? 'Coach' : 'Athlete'}` : ''}
                      </p>
                    </div>
                    <span className={`admin-badge admin-badge--${message.status}`}>{message.status}</span>
                  </div>
                  <dl className="admin-meta">
                    <div>
                      <dt>Type</dt>
                      <dd>{contactKindLabel(message.kind)}</dd>
                    </div>
                    <div>
                      <dt>Received</dt>
                      <dd>{formatDate(message.createdAt)}</dd>
                    </div>
                  </dl>
                  <p className="admin-card__message">{message.message}</p>
                  <div className="admin-card__actions">
                    {message.status !== 'read' ? (
                      <button
                        type="button"
                        className="btn btn--secondary btn--small"
                        disabled={busyId === message.id}
                        onClick={() => void updateContactStatus(message, 'read')}
                      >
                        Mark read
                      </button>
                    ) : null}
                    {message.status !== 'resolved' ? (
                      <button
                        type="button"
                        className="btn btn--gold btn--small"
                        disabled={busyId === message.id}
                        onClick={() => void updateContactStatus(message, 'resolved')}
                      >
                        Resolve
                      </button>
                    ) : null}
                    {message.status !== 'new' ? (
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === message.id}
                        onClick={() => void updateContactStatus(message, 'new')}
                      >
                        Reopen
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
