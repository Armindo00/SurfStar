import { useCallback, useEffect, useState } from 'react'
import {
  adminActivateCoachPlan,
  adminFetchAccounts,
  adminFetchDashboard,
  adminFetchPlanRequests,
  adminReviewPlanRequest,
  adminSetAccountBlocked,
  type AdminAccount,
  type AdminDashboardStats,
  type AdminPlanRequest,
} from '../adminApi'
import {
  adminFetchContactMessages,
  adminUpdateContactMessageStatus,
} from '../contactApi'
import { contactKindLabel } from '../contactKinds'
import { formatAppDateTime } from '../dateFormat'
import { ScreenHeader } from '../components/ScreenHeader'
import { SkeletonCard } from '../components/Skeleton'
import { useToast } from '../components/ToastProvider'
import { getPlan, type PlanId } from '../plans'
import { useApp } from '../AppContext'
import type { ContactMessage, ContactMessageStatus } from '../types'

type AdminTab = 'dashboard' | 'requests' | 'accounts' | 'contact'

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

export function AdminView() {
  const { auth, cloudMode, setView } = useApp()
  const { showToast } = useToast()
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [stats, setStats] = useState<AdminDashboardStats | null>(null)
  const [requests, setRequests] = useState<AdminPlanRequest[]>([])
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [newContactCount, setNewContactCount] = useState(0)
  const [requestFilter, setRequestFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [contactFilter, setContactFilter] = useState<'new' | 'read' | 'resolved' | 'all'>('new')
  const [accountRole, setAccountRole] = useState<'all' | 'treinador' | 'atleta'>('all')
  const [accountSearch, setAccountSearch] = useState('')
  const [blockedOnly, setBlockedOnly] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})

  const isAdmin = auth?.role === 'treinador' && auth.isPlatformAdmin

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
    const result = await adminFetchPlanRequests(requestFilter === 'all' ? null : requestFilter)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setRequests(result.requests)
  }, [requestFilter])

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

  useEffect(() => {
    if (!isAdmin || !cloudMode) return
    setError('')
    if (tab === 'dashboard') void loadDashboard()
    if (tab === 'requests') void loadRequests()
    if (tab === 'accounts') void loadAccounts()
    if (tab === 'contact') void loadContactMessages()
  }, [tab, isAdmin, cloudMode, loadDashboard, loadRequests, loadAccounts, loadContactMessages])

  useEffect(() => {
    if (!isAdmin || !cloudMode) return
    void refreshNewContactCount()
  }, [isAdmin, cloudMode, refreshNewContactCount])

  const reviewRequest = async (request: AdminPlanRequest, action: 'approve' | 'reject') => {
    setBusyId(request.id)
    setError('')
    try {
      const result = await adminReviewPlanRequest(request.id, action, notesDraft[request.id])
      if (!result.ok) {
        setError(result.error)
        return
      }
      showToast(result.message ?? (action === 'approve' ? 'Request approved.' : 'Request rejected.'), 'success')
      await loadRequests()
      await loadDashboard()
    } finally {
      setBusyId(null)
    }
  }

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

  const activatePlan = async (account: AdminAccount, planId: PlanId) => {
    setBusyId(account.profile_id)
    setError('')
    try {
      const result = await adminActivateCoachPlan(
        account.profile_id,
        account.organization_name ?? `${account.name}'s Team`,
        planId,
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
            ['requests', 'Team Academy'],
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
            {id === 'requests' && stats && stats.pending_requests > 0 ? (
              <span className="admin-tabs__badge">{stats.pending_requests}</span>
            ) : null}
            {id === 'contact' && newContactCount > 0 ? (
              <span className="admin-tabs__badge">{newContactCount}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {error ? <p className="login-error admin-page__error">{error}</p> : null}

      {loading ? <SkeletonCard lines={5} /> : null}

      {!loading && tab === 'dashboard' && stats ? (
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
            <strong>{stats.pending_requests}</strong>
            <span>Pending requests</span>
          </div>
          <div className="admin-stat-card">
            <strong>{stats.blocked_accounts}</strong>
            <span>Blocked accounts</span>
          </div>
        </div>
      ) : null}

      {!loading && tab === 'requests' ? (
        <div className="admin-panel">
          <div className="admin-toolbar">
            <label className="field field--pro admin-toolbar__field">
              <span>Status</span>
              <select
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value as typeof requestFilter)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </label>
            <button type="button" className="btn btn--secondary btn--small" onClick={() => void loadRequests()}>
              Refresh
            </button>
          </div>

          {requests.length === 0 ? (
            <p className="muted">No requests match this filter.</p>
          ) : (
            <div className="admin-list">
              {requests.map((request) => (
                <article key={request.id} className="admin-card">
                  <div className="admin-card__head">
                    <div>
                      <h2>{request.organization_name}</h2>
                      <p className="muted">
                        {request.contact_name} · {request.email}
                      </p>
                    </div>
                    <span className={`admin-badge admin-badge--${request.status}`}>{request.status}</span>
                  </div>
                  <dl className="admin-meta">
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
                  </dl>
                  {request.message ? <p className="admin-card__message">{request.message}</p> : null}
                  {request.notes ? <p className="muted admin-card__notes">Notes: {request.notes}</p> : null}

                  {request.status === 'pending' ? (
                    <>
                      <label className="field field--pro">
                        <span>Internal notes (optional)</span>
                        <textarea
                          rows={2}
                          value={notesDraft[request.id] ?? ''}
                          onChange={(e) =>
                            setNotesDraft((prev) => ({ ...prev, [request.id]: e.target.value }))
                          }
                        />
                      </label>
                      <div className="admin-card__actions">
                        <button
                          type="button"
                          className="btn btn--gold btn--small"
                          disabled={busyId === request.id}
                          onClick={() => void reviewRequest(request, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary btn--small"
                          disabled={busyId === request.id}
                          onClick={() => void reviewRequest(request, 'reject')}
                        >
                          Reject
                        </button>
                      </div>
                    </>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {!loading && tab === 'accounts' ? (
        <div className="admin-panel">
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
              {accounts.map((account) => (
                <article key={account.profile_id} className="admin-card">
                  <div className="admin-card__head">
                    <div>
                      <h2>{account.name}</h2>
                      <p className="muted">
                        {account.email} · {account.role === 'treinador' ? 'Coach' : 'Athlete'}
                      </p>
                    </div>
                    <div className="admin-card__badges">
                      {account.is_platform_admin ? <span className="admin-badge admin-badge--admin">Admin</span> : null}
                      {account.blocked ? <span className="admin-badge admin-badge--blocked">Blocked</span> : null}
                    </div>
                  </div>
                  <dl className="admin-meta">
                    <div>
                      <dt>Plan</dt>
                      <dd>
                        {planLabel(account.plan_id)}
                        {account.plan_status ? ` (${account.plan_status})` : ''}
                      </dd>
                    </div>
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
              ))}
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
