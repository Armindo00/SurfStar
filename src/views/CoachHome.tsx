import { useApp } from '../AppContext'

export function CoachHome() {
  const { auth, setView, beginDraftSession, logout } = useApp()
  const name = auth?.role === 'treinador' ? auth.name : 'Coach'

  return (
    <div className="dashboard">
      <header className="dashboard__hero">
        <p className="dashboard__hello">Hello,</p>
        <h1 className="dashboard__name">{name}</h1>
        <p className="muted">SurfStar coach dashboard</p>
      </header>

      <button type="button" className="action-card action-card--primary" onClick={beginDraftSession}>
        <span className="action-card__icon" aria-hidden="true">
          ▶
        </span>
        <span>
          <strong>New session</strong>
          <small>Technical, combos, heats, sea analysis</small>
        </span>
      </button>

      <nav className="action-list">
        <button type="button" className="action-list__item" onClick={() => setView('training-sessions')}>
          <span>Past sessions</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('analytics')}>
          <span>Team analytics</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('manage-athletes')}>
          <span>Manage athletes</span>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="action-list__item" onClick={() => setView('manage-spots')}>
          <span>Spots & conditions</span>
          <span aria-hidden="true">›</span>
        </button>
      </nav>

      <button type="button" className="btn btn--ghost btn--block logout-btn" onClick={logout}>
        Sign out
      </button>
    </div>
  )
}
