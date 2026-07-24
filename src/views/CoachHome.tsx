import { useApp } from '../AppContext'
import { athleteLimitMessage } from '../planUtils'
import { formatPlanPrice, getPlan } from '../plans'

export function CoachHome() {
  const { auth, subscription, setView, beginDraftSession, logout } = useApp()
  const name = auth?.role === 'treinador' ? auth.name : 'Treinador'
  const plan = subscription ? getPlan(subscription.planId) : null

  return (
    <div className="dashboard">
      <header className="dashboard__hero">
        <p className="dashboard__hello">Olá,</p>
        <h1 className="dashboard__name">{name}</h1>
        {plan ? (
          <p className="dashboard__plan muted">
            Pack {plan.name} · {formatPlanPrice(plan)}/mês · {athleteLimitMessage(plan.id)}
          </p>
        ) : (
          <p className="muted">Painel SurfStar</p>
        )}
      </header>

      <button type="button" className="action-card action-card--primary" onClick={beginDraftSession}>
        <span className="action-card__icon" aria-hidden="true">
          ▶
        </span>
        <span>
          <strong>Nova sessão</strong>
          <small>Técnico, combos, heats, mar</small>
        </span>
      </button>

      <nav className="action-list">
        <button type="button" className="action-list__item" onClick={() => setView('training-sessions')}>
          <span>Sessões anteriores</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('analytics')}>
          <span>Team analytics</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('manage-athletes')}>
          <span>Gerir atletas</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('manage-spots')}>
          <span>Spots & condições</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('subscription')}>
          <span>Conta & subscrição</span>
          <span aria-hidden="true">›</span>
        </button>
      </nav>

      <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={logout}>
        Sair
      </button>
    </div>
  )
}
