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
import { ScreenHeader } from '../components/ScreenHeader'
import { useToast } from '../components/ToastProvider'
import { getPlan, type PlanId } from '../plans'
import { useApp } from '../AppContext'

type AdminTab = 'dashboard' | 'requests' | 'accounts'

function formatDate(value: string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-PT', {
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
  const [requestFilter, setRequestFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [accountRole, setAccountRole] = useState<'all' | 'treinador' | 'atleta'>('all')
  const [accountSearch, setAccountSearch] = useState('')
  const [blockedOnly, setBlockedOnly] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})

  const isAdmin = auth?.role === 'treinador' && auth.isPlatformAdmin

  const loadDashboard = useCallback(async () => {
    const result = await adminFetchDashboard()
    if (!result.ok) {
      setError(result.error)
      return
    }
    setStats(result.stats)
  }, [])

  const loadRequests = useCallback(async () => {
    const result = await adminFetchPlanRequests(requestFilter === 'all' ? null : requestFilter)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setRequests(result.requests)
  }, [requestFilter])

  const loadAccounts = useCallback(async () => {
    const result = await adminFetchAccounts({
      role: accountRole === 'all' ? null : accountRole,
      search: accountSearch.trim() || undefined,
      blockedOnly,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    setAccounts(result.accounts)
  }, [accountRole, accountSearch, blockedOnly])

  useEffect(() => {
    if (!isAdmin || !cloudMode) return
    setError('')
    if (tab === 'dashboard') void loadDashboard()
    if (tab === 'requests') void loadRequests()
    if (tab === 'accounts') void loadAccounts()
  }, [tab, isAdmin, cloudMode, loadDashboard, loadRequests, loadAccounts])

  const reviewRequest = async (request: AdminPlanRequest, action: 'approve' | 'reject') => {
    setBusyId(request.id)
    setError('')
    try {
      const result = await adminReviewPlanRequest(request.id, action, notesDraft[request.id])
      if (!result.ok) {
        setError(result.error)
        return
      }
      showToast(result.message ?? (action === 'approve' ? 'Pedido aprovado.' : 'Pedido rejeitado.'), 'success')
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
      showToast(account.blocked ? 'Conta desbloqueada.' : 'Conta bloqueada.', 'success')
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
      showToast(`Plano ${planLabel(planId)} ativado.`, 'success')
      await loadAccounts()
    } finally {
      setBusyId(null)
    }
  }

  if (!cloudMode) {
    return (
      <div className="admin-page">
        <ScreenHeader title="Admin" onBack={() => setView('coach-home')} />
        <p className="muted admin-page__hint">O painel admin só está disponível em modo cloud (Supabase).</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <ScreenHeader title="Admin" onBack={() => setView('coach-home')} />
        <p className="muted admin-page__hint">Não tens permissões de administrador.</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <ScreenHeader title="Admin SurfStar" onBack={() => setView('coach-home')} />

      <nav className="admin-tabs" aria-label="Secções admin">
        {(
          [
            ['dashboard', 'Resumo'],
            ['requests', 'Team Academy'],
            ['accounts', 'Contas'],
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
          </button>
        ))}
      </nav>

      {error ? <p className="login-error admin-page__error">{error}</p> : null}

      {tab === 'dashboard' && stats ? (
        <div className="admin-stats">
          <div className="admin-stat-card">
            <strong>{stats.coaches}</strong>
            <span>Treinadores</span>
          </div>
          <div className="admin-stat-card">
            <strong>{stats.athletes}</strong>
            <span>Atletas</span>
          </div>
          <div className="admin-stat-card">
            <strong>{stats.organizations}</strong>
            <span>Organizações</span>
          </div>
          <div className="admin-stat-card admin-stat-card--highlight">
            <strong>{stats.pending_requests}</strong>
            <span>Pedidos pendentes</span>
          </div>
          <div className="admin-stat-card">
            <strong>{stats.blocked_accounts}</strong>
            <span>Contas bloqueadas</span>
          </div>
        </div>
      ) : null}

      {tab === 'requests' ? (
        <div className="admin-panel">
          <div className="admin-toolbar">
            <label className="field field--pro admin-toolbar__field">
              <span>Estado</span>
              <select
                value={requestFilter}
                onChange={(e) => setRequestFilter(e.target.value as typeof requestFilter)}
              >
                <option value="pending">Pendentes</option>
                <option value="approved">Aprovados</option>
                <option value="rejected">Rejeitados</option>
                <option value="all">Todos</option>
              </select>
            </label>
            <button type="button" className="btn btn--secondary btn--small" onClick={() => void loadRequests()}>
              Atualizar
            </button>
          </div>

          {requests.length === 0 ? (
            <p className="muted">Sem pedidos neste filtro.</p>
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
                      <dt>Data</dt>
                      <dd>{formatDate(request.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Treinadores</dt>
                      <dd>{request.coaches_count ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Conta registada</dt>
                      <dd>{request.coach_registered ? 'Sim' : 'Ainda não'}</dd>
                    </div>
                  </dl>
                  {request.message ? <p className="admin-card__message">{request.message}</p> : null}
                  {request.notes ? <p className="muted admin-card__notes">Notas: {request.notes}</p> : null}

                  {request.status === 'pending' ? (
                    <>
                      <label className="field field--pro">
                        <span>Notas internas (opcional)</span>
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
                          Aprovar
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary btn--small"
                          disabled={busyId === request.id}
                          onClick={() => void reviewRequest(request, 'reject')}
                        >
                          Rejeitar
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

      {tab === 'accounts' ? (
        <div className="admin-panel">
          <div className="admin-toolbar admin-toolbar--wrap">
            <label className="field field--pro admin-toolbar__field">
              <span>Pesquisar</span>
              <input
                value={accountSearch}
                onChange={(e) => setAccountSearch(e.target.value)}
                placeholder="Nome ou email"
              />
            </label>
            <label className="field field--pro admin-toolbar__field">
              <span>Tipo</span>
              <select value={accountRole} onChange={(e) => setAccountRole(e.target.value as typeof accountRole)}>
                <option value="all">Todos</option>
                <option value="treinador">Treinadores</option>
                <option value="atleta">Atletas</option>
              </select>
            </label>
            <label className="field field--pro admin-toolbar__check">
              <input
                type="checkbox"
                checked={blockedOnly}
                onChange={(e) => setBlockedOnly(e.target.checked)}
              />
              <span>Só bloqueados</span>
            </label>
            <button type="button" className="btn btn--secondary btn--small" onClick={() => void loadAccounts()}>
              Pesquisar
            </button>
          </div>

          {accounts.length === 0 ? (
            <p className="muted">Nenhuma conta encontrada.</p>
          ) : (
            <div className="admin-list">
              {accounts.map((account) => (
                <article key={account.profile_id} className="admin-card">
                  <div className="admin-card__head">
                    <div>
                      <h2>{account.name}</h2>
                      <p className="muted">
                        {account.email} · {account.role === 'treinador' ? 'Treinador' : 'Atleta'}
                      </p>
                    </div>
                    <div className="admin-card__badges">
                      {account.is_platform_admin ? <span className="admin-badge admin-badge--admin">Admin</span> : null}
                      {account.blocked ? <span className="admin-badge admin-badge--blocked">Bloqueado</span> : null}
                    </div>
                  </div>
                  <dl className="admin-meta">
                    <div>
                      <dt>Plano</dt>
                      <dd>
                        {planLabel(account.plan_id)}
                        {account.plan_status ? ` (${account.plan_status})` : ''}
                      </dd>
                    </div>
                    <div>
                      <dt>Organização</dt>
                      <dd>{account.organization_name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Registo</dt>
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
                        {account.blocked ? 'Desbloquear' : 'Bloquear'}
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
                          Ativar Coach
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          disabled={busyId === account.profile_id}
                          onClick={() => void activatePlan(account, 'club')}
                        >
                          Ativar Premium
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          disabled={busyId === account.profile_id}
                          onClick={() => void activatePlan(account, 'organization')}
                        >
                          Ativar Team Academy
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
    </div>
  )
}
