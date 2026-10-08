import { ErrorBoundary } from './components/ErrorBoundary'
import { CookieConsent } from './components/CookieConsent'
import { ToastProvider } from './components/ToastProvider'
import { AppProvider, useApp } from './AppContext'
import { I18nProvider, useI18n } from './i18n'
import { LanguagePicker } from './components/LanguagePicker'
import { NavBadge } from './components/NavBadge'
import { AppLogo } from './components/AppLogo'
import { ChangePasswordView } from './views/ChangePasswordView'
import { CheckoutView } from './views/CheckoutView'
import { ForgotPasswordView } from './views/ForgotPasswordView'
import { ResetPasswordView } from './views/ResetPasswordView'
import { LandingView } from './views/LandingView'
import { PlanDetailView } from './views/PlanDetailView'
import { SubscriptionView } from './views/SubscriptionView'
import { TeamAcademyRequestView } from './views/TeamAcademyRequestView'
import { AdminView } from './views/AdminView'
import { LegalPageView } from './views/LegalPageView'
import { ContactView } from './views/ContactView'
import { AthletePortal } from './views/AthletePortal'
import { AthleteMaterialView } from './views/AthleteMaterialView'
import { AthleteEquipmentReviewsView } from './views/AthleteEquipmentReviewsView'
import { CoachAthleteInsightsView } from './views/CoachAthleteInsightsView'
import { CoachHome } from './views/CoachHome'
import { CoachPortalMenu } from './views/CoachPortalMenu'
import { useMediaQuery } from './hooks/useMediaQuery'
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
import { CloseWaveConfirmSheet } from './components/CloseWaveConfirmSheet'
import { SessionFeedbackPortal } from './components/SessionFeedbackPortal'
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
import { isAuthPublicView } from './routing'
import './App.css'
import './app-theme.css'
import './plan-marketing.css'

function AppHeader() {
  const {
    auth,
    logout,
    role,
    setView,
    openContact,
    athleteMenuOpen,
    setAthleteMenuOpen,
    athleteMenuBadge,
    coachMenuOpen,
    setCoachMenuOpen,
  } = useApp()
  const { t } = useI18n()
  if (!auth) return null

  const go = (next: Parameters<typeof setView>[0]) => {
    setCoachMenuOpen(false)
    setView(next)
  }

  const isAthlete = role === 'atleta'

  return (
    <header className={isAthlete ? 'app-brandbar' : 'app-brandbar app-brandbar--coach'}>
      <div className="app-brandbar__brand">
        <AppLogo size="sm" />
        <div>
          <small>{role === 'treinador' ? t('roles.coach') : t('roles.athlete')}</small>
        </div>
      </div>
      {isAthlete ? (
        <button
          type="button"
          className={
            athleteMenuOpen
              ? 'app-brandbar__menu-btn app-brandbar__menu-btn--athlete app-brandbar__menu-btn--open btn btn--ghost btn--small'
              : 'app-brandbar__menu-btn app-brandbar__menu-btn--athlete btn btn--ghost btn--small'
          }
          aria-expanded={athleteMenuOpen}
          aria-controls="athlete-portal-menu"
          onClick={() => setAthleteMenuOpen(!athleteMenuOpen)}
        >
          <span className="app-brandbar__menu-icon" aria-hidden="true">
            {athleteMenuOpen ? '×' : '☰'}
          </span>
          <span>{athleteMenuOpen ? t('common.close') : t('common.menu')}</span>
          {!athleteMenuOpen && athleteMenuBadge > 0 ? (
            <NavBadge count={athleteMenuBadge} className="app-brandbar__menu-badge" />
          ) : null}
        </button>
      ) : (
        <>
          <button
            type="button"
            className={
              coachMenuOpen
                ? 'app-brandbar__menu-btn app-brandbar__menu-btn--coach app-brandbar__menu-btn--open btn btn--ghost btn--small'
                : 'app-brandbar__menu-btn app-brandbar__menu-btn--coach btn btn--ghost btn--small'
            }
            aria-expanded={coachMenuOpen}
            aria-controls="coach-portal-menu"
            onClick={() => setCoachMenuOpen(!coachMenuOpen)}
          >
            <span className="app-brandbar__menu-icon" aria-hidden="true">
              {coachMenuOpen ? '×' : '☰'}
            </span>
            <span>{coachMenuOpen ? t('common.close') : t('common.menu')}</span>
          </button>
          <div
            id="app-brandbar-menu"
            className={
              coachMenuOpen
                ? 'app-brandbar__user app-brandbar__user--coach app-brandbar__user--coach-desktop app-brandbar__user--open'
                : 'app-brandbar__user app-brandbar__user--coach app-brandbar__user--coach-desktop'
            }
          >
            <span className="app-brandbar__name">{auth.name}</span>
            <div className="app-brandbar__coach-actions">
              {auth.role === 'treinador' && auth.isPlatformAdmin ? (
                <button type="button" className="btn btn--ghost btn--small" onClick={() => go('admin')}>
                  {t('common.admin')}
                </button>
              ) : null}
              <button type="button" className="btn btn--ghost btn--small" onClick={() => go('subscription')}>
                {t('nav.accountAndSubscription')}
              </button>
              <button type="button" className="btn btn--ghost btn--small" onClick={() => go('help')}>
                {t('common.help')}
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => {
                  setCoachMenuOpen(false)
                  openContact()
                }}
              >
                {t('nav.contactSurfStar')}
              </button>
              <div className="app-brandbar__locale">
                <LanguagePicker compact stackedMenu key={coachMenuOpen ? 'menu-open' : 'menu-closed'} />
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() => {
                  setCoachMenuOpen(false)
                  logout()
                }}
              >
                {t('common.signOut')}
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  )
}

function Shell() {
  const {
    auth,
    authReady,
    role,
    view,
    publicView,
    planDetailPlanId,
    hasActiveSubscription,
    passwordRecoveryPending,
    athleteMenuOpen,
    athletePortalSheet,
    coachMenuOpen,
    setCoachMenuOpen,
    logout,
    openContact,
    setView,
  } = useApp()
  const { t } = useI18n()
  const coachMobileMenu = useMediaQuery('(max-width: 767px)')
  const coachMenuFullScreen = role === 'treinador' && coachMenuOpen && coachMobileMenu

  if (!authReady) {
    return (
      <div className="auth-page auth-page--loading">
        <div className="auth-card">
          <AppLogo size="xl" />
          <p className="auth-loading-text muted">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (passwordRecoveryPending || publicView === 'reset-password') {
    return <ResetPasswordView />
  }

  if (!auth) {
    if (publicView === 'forgot-password') {
      return <ForgotPasswordView />
    }
    if (publicView === 'landing') {
      return <LandingView />
    }
    if (publicView === 'plan-detail' && planDetailPlanId) {
      return <PlanDetailView planId={planDetailPlanId} />
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

  const athleteOverlayActive = athleteMenuOpen || athletePortalSheet !== null

  return (
    <div className="app-shell">
      <InstallAppBanner />
      <div className="app-shell__inner">
        <AppHeader />
        <main className="app-main">
          {coachMenuFullScreen && auth?.role === 'treinador' ? (
            <CoachPortalMenu
              coachName={auth.name}
              isPlatformAdmin={Boolean(auth.isPlatformAdmin)}
              onAdmin={() => {
                setCoachMenuOpen(false)
                setView('admin')
              }}
              onSubscription={() => {
                setCoachMenuOpen(false)
                setView('subscription')
              }}
              onHelp={() => {
                setCoachMenuOpen(false)
                setView('help')
              }}
              onContact={() => {
                setCoachMenuOpen(false)
                openContact()
              }}
              onLogout={() => {
                setCoachMenuOpen(false)
                logout()
              }}
            />
          ) : null}
          {role === 'atleta' && !athleteOverlayActive && view === 'help' && <HelpView />}
          {role === 'atleta' && !athleteOverlayActive && view === 'athlete-material' && <AthleteMaterialView />}
          {role === 'atleta' && !athleteOverlayActive && view === 'athlete-equipment-reviews' && (
            <AthleteEquipmentReviewsView />
          )}
          {role === 'atleta' && !athleteOverlayActive && view === 'contact' && <ContactView variant="app" />}
          {role === 'atleta' && <AthletePortal />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'coach-home' && <CoachHome />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'start-session' && <StartSession />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'select-athletes' && <SelectAthletes />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'training' && <TrainingSessionView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'combos' && <CombosSessionView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'heats' && <HeatsSessionView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'campeonato' && <ChampionshipSessionView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'sea-analysis' && <SeaAnalysisSessionView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'custom' && <CustomSessionView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'session-stats' && <SessionStatsView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'saved-waves' && <SavedWavesView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'manage-athletes' && <ManageAthletes />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'coach-athlete-insights' && (
            <CoachAthleteInsightsView />
          )}
          {role === 'treinador' && !coachMenuFullScreen && view === 'manage-spots' && <ManageSpots />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'manage-custom-templates' && (
            <ManageCustomTemplates />
          )}
          {role === 'treinador' && !coachMenuFullScreen && view === 'training-sessions' && <TrainingSessionsView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'session-history-detail' && (
            <SessionHistoryDetailView />
          )}
          {role === 'treinador' && !coachMenuFullScreen && view === 'analytics' && <TeamAnalyticsView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'organization' && <OrganizationView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'admin' && <AdminView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'subscription' && <SubscriptionView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'help' && <HelpView />}
          {role === 'treinador' && !coachMenuFullScreen && view === 'contact' && <ContactView variant="app" />}
        </main>
        <EndSessionSheet />
        <LeaveSessionConfirmSheet />
        <CloseWaveConfirmSheet />
        <SessionFeedbackPortal />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <I18nProvider>
        <ToastProvider>
          <AppProvider>
            <Shell />
            <CookieConsent />
          </AppProvider>
        </ToastProvider>
      </I18nProvider>
    </ErrorBoundary>
  )
}
