import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastProvider'
import { AppProvider, useApp } from './AppContext'
import { AppLogo } from './components/AppLogo'
import { ChangePasswordView } from './views/ChangePasswordView'
import { CheckoutView } from './views/CheckoutView'
import { ForgotPasswordView } from './views/ForgotPasswordView'
import { LandingView } from './views/LandingView'
import { SubscriptionView } from './views/SubscriptionView'
import { AthletePortal } from './views/AthletePortal'
import { CoachHome } from './views/CoachHome'
import { ChampionshipSessionView } from './views/ChampionshipSessionView'
import { CombosSessionView } from './views/CombosSessionView'
import { CustomSessionView } from './views/CustomSessionView'
import { HeatsSessionView } from './views/HeatsSessionView'
import { LoginView } from './views/LoginView'
import { ManageAthletes } from './views/ManageAthletes'
import { ManageSpots } from './views/ManageSpots'
import { ManageCustomTemplates } from './views/ManageCustomTemplates'
import { EndSessionSheet } from './components/EndSessionSheet'
import { HelpView } from './views/HelpView'
import { InstallAppBanner } from './components/InstallAppBanner'
import { SavedWavesView } from './views/SavedWavesView'
import { SelectAthletes } from './views/SelectAthletes'
import { SeaAnalysisSessionView } from './views/SeaAnalysisSessionView'
import { SessionHistoryDetailView } from './views/SessionHistoryDetailView'
import { SessionStatsView } from './views/SessionStatsView'
import { StartSession } from './views/StartSession'
import { TeamAnalyticsView } from './views/TeamAnalyticsView'
import { TrainingSessionsView } from './views/TrainingSessionsView'
import { TrainingSessionView } from './views/TrainingSessionView'
import { isAuthPublicView, isForgotPasswordPath } from './routing'
import './App.css'
import './app-theme.css'

function AppHeader() {
  const { auth, logout, role, setView } = useApp()
  if (!auth) return null

  return (
    <header className="app-brandbar">
      <div className="app-brandbar__brand">
        <AppLogo size="sm" />
        <div>
          <small>{role === 'treinador' ? 'Coach' : 'Athlete'}</small>
        </div>
      </div>
      <div className="app-brandbar__user">
        <span className="app-brandbar__name">{auth.name}</span>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => setView('help')}>
          Help
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  )
}

function Shell() {
  const { auth, authReady, role, view, publicView, hasActiveSubscription } = useApp()

  if (!authReady) {
    return (
      <div className="auth-page auth-page--loading">
        <div className="auth-card">
          <AppLogo size="xl" />
          <p className="auth-loading-text muted">Loading SurfStar…</p>
        </div>
      </div>
    )
  }

  if (!auth) {
    if (isForgotPasswordPath(window.location.pathname)) {
      return <ForgotPasswordView />
    }
    if (publicView === 'landing') {
      return <LandingView />
    }
    if (isAuthPublicView(publicView)) {
      return <LoginView />
    }
    return <LandingView />
  }

  if (auth.role === 'atleta' && auth.mustChangePassword) {
    return <ChangePasswordView />
  }

  if (auth.role === 'treinador' && !hasActiveSubscription) {
    return (
      <>
        <InstallAppBanner />
        <CheckoutView />
      </>
    )
  }

  return (
    <div className="app-shell">
      <InstallAppBanner />
      <div className="app-shell__inner">
        <AppHeader />
        <main className="app-main">
          {role === 'atleta' && view === 'help' && <HelpView />}
          {role === 'atleta' && view !== 'help' && <AthletePortal />}
          {role === 'treinador' && view === 'coach-home' && <CoachHome />}
          {role === 'treinador' && view === 'start-session' && <StartSession />}
          {role === 'treinador' && view === 'select-athletes' && <SelectAthletes />}
          {role === 'treinador' && view === 'training' && <TrainingSessionView />}
          {role === 'treinador' && view === 'combos' && <CombosSessionView />}
          {role === 'treinador' && view === 'heats' && <HeatsSessionView />}
          {role === 'treinador' && view === 'campeonato' && <ChampionshipSessionView />}
          {role === 'treinador' && view === 'sea-analysis' && <SeaAnalysisSessionView />}
          {role === 'treinador' && view === 'custom' && <CustomSessionView />}
          {role === 'treinador' && view === 'session-stats' && <SessionStatsView />}
          {role === 'treinador' && view === 'saved-waves' && <SavedWavesView />}
          {role === 'treinador' && view === 'manage-athletes' && <ManageAthletes />}
          {role === 'treinador' && view === 'manage-spots' && <ManageSpots />}
          {role === 'treinador' && view === 'manage-custom-templates' && <ManageCustomTemplates />}
          {role === 'treinador' && view === 'training-sessions' && <TrainingSessionsView />}
          {role === 'treinador' && view === 'session-history-detail' && <SessionHistoryDetailView />}
          {role === 'treinador' && view === 'analytics' && <TeamAnalyticsView />}
          {role === 'treinador' && view === 'subscription' && <SubscriptionView />}
          {role === 'treinador' && view === 'help' && <HelpView />}
        </main>
        <EndSessionSheet />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <Shell />
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}
