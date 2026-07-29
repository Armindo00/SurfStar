import { useCallback, useEffect, useState } from 'react'
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
import { adminFetchContactMessages, adminUpdateContactMessageStatus } from '../contactApi'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonCard } from '../components/Skeleton'
import { useToast } from '../components/ToastProvider'
import { planLabel, requestPhase } from './admin/adminUtils'
import type { BillingInterval, PlanId } from '../plans'
import { useApp } from '../AppContext'
import { UNSEEN } from '../unseenDomains'
import type { ContactMessage, ContactMessageStatus } from '../types'
import { AdminAccountsTab } from './admin/AdminAccountsTab'
import { AdminContactTab } from './admin/AdminContactTab'
import { AdminDashboardTab } from './admin/AdminDashboardTab'
import { AdminPaymentsTab } from './admin/AdminPaymentsTab'
import { AdminSubscriptionsTab, loadAdminSubscriptions } from './admin/AdminSubscriptionsTab'

type AdminTab = 'dashboard' | 'requests' | 'subscriptions' | 'accounts' | 'contact'

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
  const [tabLoading, setTabLoading] = useState(false)
  const [error, setError] = useState('')
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [pendingPlanRequestItems, setPendingPlanRequestItems] = useState<{ id: string }[]>([])

  const isAdmin = auth?.role === 'treinador' && auth.isPlatformAdmin
  const unseenPlanRequests = countUnseen(UNSEEN.adminPlanRequests, pendingPlanRequestItems)
  const renewalAttentionCount = (stats?.renewals_due_7d ?? 0) + (stats?.renewals_overdue ?? 0)

  const loadDashboard = useCallback(async () => {
    setTabLoading(true)
    const result = await adminFetchDashboard()
    setTabLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setStats(result.stats)
  }, [])

  const loadRequests = useCallback(async () => {
    setTabLoading(true)
    const result = await adminFetchPlanRequests(requestFilter)
    setTabLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setRequests(result.requests)
  }, [requestFilter])

  const loadSubscriptions = useCallback(async () => {
    setTabLoading(true)
    const result = await loadAdminSubscriptions(subscriptionFilter)
    setTabLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSubscriptions(result.subscriptions)
  }, [subscriptionFilter])

  const loadAccounts = useCallback(async () => {
    setTabLoading(true)
    const result = await adminFetchAccounts({
      role: accountRole === 'all' ? null : accountRole,
      search: accountSearch.trim() || undefined,
      blockedOnly,
    })
    setTabLoading(false)
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
    setTabLoading(true)
    const result = await adminFetchContactMessages(contactFilter === 'all' ? null : contactFilter)
    setTabLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setContactMessages(result.messages)
    if (contactFilter === 'new') setNewContactCount(result.messages.length)
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

  const goToTab = (
    nextTab: AdminTab,
    options?: {
      requestFilter?: AdminRequestFilter
      subscriptionFilter?: AdminSubscriptionFilter
      contactFilter?: typeof contactFilter
    },
  ) => {
    if (options?.requestFilter) setRequestFilter(options.requestFilter)
    if (options?.subscriptionFilter) setSubscriptionFilter(options.subscriptionFilter)
    if (options?.contactFilter) setContactFilter(options.contactFilter)
    setTab(nextTab)
  }

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

  const renderTabContent = () => {
    if (tabLoading) return <SkeletonCard lines={4} />

    switch (tab) {
      case 'dashboard':
        return stats ? <AdminDashboardTab stats={stats} newContactCount={newContactCount} onNavigate={goToTab} /> : null
      case 'requests':
        return (
          <AdminPaymentsTab
            requests={requests}
            filter={requestFilter}
            onFilterChange={setRequestFilter}
            onRefresh={() => void loadRequests()}
            busyId={busyId}
            notesDraft={notesDraft}
            onNotesChange={(requestId, notes) => setNotesDraft((prev) => ({ ...prev, [requestId]: notes }))}
            onApprove={approveRequest}
            onReject={rejectRequest}
            onConfirmPayment={confirmPayment}
            onActivateFree={activateFree}
            onToast={(message) => showToast(message, 'success')}
          />
        )
      case 'subscriptions':
        return (
          <AdminSubscriptionsTab
            filter={subscriptionFilter}
            onFilterChange={setSubscriptionFilter}
            subscriptions={subscriptions}
            busyId={busyId}
            error={error}
            notesDraft={notesDraft}
            onNotesChange={(coachId, notes) => setNotesDraft((prev) => ({ ...prev, [coachId]: notes }))}
            onReload={loadSubscriptions}
            onError={setError}
            onBusyChange={setBusyId}
            onToast={(message) => showToast(message, 'success')}
            onDashboardRefresh={loadDashboard}
          />
        )
      case 'accounts':
        return (
          <AdminAccountsTab
            accounts={accounts}
            deletionRequests={deletionRequests}
            accountRole={accountRole}
            accountSearch={accountSearch}
            blockedOnly={blockedOnly}
            onRoleChange={setAccountRole}
            onSearchChange={setAccountSearch}
            onBlockedOnlyChange={setBlockedOnly}
            onSearch={() => void loadAccounts()}
            busyId={busyId}
            onToggleBlocked={toggleBlocked}
            onActivatePlan={activatePlan}
            onProcessDeletion={processDeletionRequest}
          />
        )
      case 'contact':
        return (
          <AdminContactTab
            messages={contactMessages}
            filter={contactFilter}
            onFilterChange={setContactFilter}
            onRefresh={() => void loadContactMessages()}
            busyId={busyId}
            onUpdateStatus={updateContactStatus}
          />
        )
      default:
        return null
    }
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

      <div className="admin-content">{renderTabContent()}</div>
    </div>
  )
}
