import { AppProvider, useApp } from './AppContext'
import { AthletePortal } from './views/AthletePortal'
import { CoachHome } from './views/CoachHome'
import { ChampionshipSessionView } from './views/ChampionshipSessionView'
import { CombosSessionView } from './views/CombosSessionView'
import { HeatsSessionView } from './views/HeatsSessionView'
import { LoginView } from './views/LoginView'
import { ManageAthletes } from './views/ManageAthletes'
import { ManageSpots } from './views/ManageSpots'
import { PlaceholderScreen } from './views/PlaceholderScreen'
import { SavedWavesView } from './views/SavedWavesView'
import { SelectAthletes } from './views/SelectAthletes'
import { SeaAnalysisSessionView } from './views/SeaAnalysisSessionView'
import { SessionStatsView } from './views/SessionStatsView'
import { StartSession } from './views/StartSession'
import { TrainingSessionView } from './views/TrainingSessionView'
import './App.css'

function AppHeader() {
  const { auth, logout, role } = useApp()
  if (!auth) return null

  return (
    <header className="app-brandbar">
      <div className="app-brandbar__brand">
        <span className="app-brandbar__mark" aria-hidden="true">
          ★
        </span>
        <div>
          <strong>SurfStar</strong>
          <small>{role === 'treinador' ? 'Coach' : 'Athlete'}</small>
        </div>
      </div>
      <div className="app-brandbar__user">
        <span className="app-brandbar__name">{auth.name}</span>
        <button type="button" className="btn btn--ghost btn--small" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  )
}

function Shell() {
  const { auth, authReady, role, view } = useApp()

  if (!authReady) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="muted">Loading SurfStar…</p>
        </div>
      </div>
    )
  }

  if (!auth) {
    return <LoginView />
  }

  return (
    <div className="app-shell">
      <div className="app-shell__inner">
        <AppHeader />
        <main className="app-main">
          {role === 'atleta' && <AthletePortal />}
          {role === 'treinador' && view === 'coach-home' && <CoachHome />}
          {role === 'treinador' && view === 'start-session' && <StartSession />}
          {role === 'treinador' && view === 'select-athletes' && <SelectAthletes />}
          {role === 'treinador' && view === 'training' && <TrainingSessionView />}
          {role === 'treinador' && view === 'combos' && <CombosSessionView />}
          {role === 'treinador' && view === 'heats' && <HeatsSessionView />}
          {role === 'treinador' && view === 'campeonato' && <ChampionshipSessionView />}
          {role === 'treinador' && view === 'sea-analysis' && <SeaAnalysisSessionView />}
          {role === 'treinador' && view === 'session-stats' && <SessionStatsView />}
          {role === 'treinador' && view === 'saved-waves' && <SavedWavesView />}
          {role === 'treinador' && view === 'manage-athletes' && <ManageAthletes />}
          {role === 'treinador' && view === 'manage-spots' && <ManageSpots />}
          {role === 'treinador' && view === 'training-sessions' && (
            <PlaceholderScreen
              title="Past sessions"
              description="Full history — coming soon, linked to your coach account."
            />
          )}
          {role === 'treinador' && view === 'analytics' && (
            <PlaceholderScreen
              title="Team analytics"
              description="Team-wide analytics dashboard — in development."
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  )
}
