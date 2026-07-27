import { useState } from 'react'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastProvider'
import { AppProvider, useApp } from './AppContext'
import { AppLogo } from './components/AppLogo'
import { ChangePasswordView } from './views/ChangePasswordView'
import { CheckoutView } from './views/CheckoutView'
import { ForgotPasswordView } from './views/ForgotPasswordView'
import { LandingView } from './views/LandingView'
import { SubscriptionView } from './views/SubscriptionView'
import { TeamAcademyRequestView } from './views/TeamAcademyRequestView'
import { AdminView } from './views/AdminView'
import { LegalPageView } from './views/LegalPageView'
import { ContactView } from './views/ContactView'
import { AthletePortal } from './views/AthletePortal'
import { AthleteMaterialView } from './views/AthleteMaterialView'
import { CoachAthleteInsightsView } from './views/CoachAthleteInsightsView'
import { CoachHome } from './views/CoachHome'
import { ChampionshipSessionView } from './views/ChampionshipSessionView'
import { CombosSessionView } from './views/CombosSessionView'
import { CustomSessionView } from './views/CustomSessionView'
import { HeatsSessionView } from './views/HeatsSessionView'
import { LoginView } from './views/LoginView'
import { ManageAthletes } from './views/ManageAthletes'
import { ManageSpots } from './views/ManageSpots'
import { ManageCustomTemplates } from './views/ManageCustomTemplates'
import { OrganizationView } from './views/OrganizationView'
import { EndSessionSheet } from './components/EndSessionSheet'
import { LeaveSessionConfirmSheet } from './components/LeaveSessionConfirmSheet'
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
  const [menuOpen, setMenuOpen] = useState(false)
  if (!auth) return null

  const go = (next: Parameters<typeof setView>[0]) => {
    setMenuOpen(false)
    setView(next)
  }

  return (
    <header className="app-brandbar">
      <div className="app-brandbar__brand">
        <AppLogo size="sm" />
        <div>
          <small>{role === 'treinador' ? 'Coach' : 'Athlete'}</small>
        </div>
      </div>
      <button
        type="button"
        className="app-brandbar__menu-btn btn btn--ghost btn--small"
        aria-expanded={menuOpen}
        aria-controls="app-brandbar-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? 'Close' : 'Menu'}
      </button>
      <div
        id="app-brandbar-menu"
        className={menuOpen ? 'app-brandbar__user app-brandbar__user--open' : 'app-brandbar__user'}
      >
        <span className="app-brandbar__name">{auth.name}</span>
        {auth.role === 'treinador' && auth.isPlatformAdmin ? (
          <button type="button" className="btn btn--ghost btn--small" onClick={() => go('admin')}>
            Admin
          </button>
        ) : null}
        <button type="button" className="btn btn--ghost btn--small" onClick={() => go('help')}>
          Help
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => {
            setMenuOpen(false)
            logout()
          }}
        >
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
    if (publicView === 'team-academy-request') {
      return <TeamAcademyRequestView />
    }
    if (publicView === 'privacy') {
      return <LegalPageView page="privacy" />
    }
    if (publicView === 'terms') {
      return <LegalPageView page="terms" />
    }
    if (publicView === 'contact') {
      return <ContactView variant="public" />
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
          {role === 'atleta' && view === 'athlete-material' && <AthleteMaterialView />}
          {role === 'atleta' && view === 'contact' && <ContactView variant="app" />}
          {role === 'atleta' && view !== 'help' && view !== 'athlete-material' && view !== 'contact' && (
            <AthletePortal />
          )}
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
          {role === 'treinador' && view === 'coach-athlete-insights' && <CoachAthleteInsightsView />}
          {role === 'treinador' && view === 'manage-spots' && <ManageSpots />}
          {role === 'treinador' && view === 'manage-custom-templates' && <ManageCustomTemplates />}
          {role === 'treinador' && view === 'training-sessions' && <TrainingSessionsView />}
          {role === 'treinador' && view === 'session-history-detail' && <SessionHistoryDetailView />}
          {role === 'treinador' && view === 'analytics' && <TeamAnalyticsView />}
          {role === 'treinador' && view === 'organization' && <OrganizationView />}
          {role === 'treinador' && view === 'admin' && <AdminView />}
          {role === 'treinador' && view === 'subscription' && <SubscriptionView />}
          {role === 'treinador' && view === 'help' && <HelpView />}
          {role === 'treinador' && view === 'contact' && <ContactView variant="app" />}
        </main>
        <EndSessionSheet />
        <LeaveSessionConfirmSheet />
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
