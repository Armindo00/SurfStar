import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { authStore, store } from './store'
import { isCloudEnabled } from './config'
import {
  cloudChangePassword,
  cloudGetSession,
  cloudLoadAthleteData,
  cloudLoadCoachData,
  cloudLogin,
  cloudLogout,
  cloudOnAuthChange,
  cloudRegisterAthlete,
  cloudRegisterCoach,
  cloudResetPassword,
  cloudSaveConditions,
  cloudSaveSpots,
  cloudSaveTrainingSessions,
} from './cloudApi'
import {
  cloudFetchCoachAthletes,
  cloudFetchCoachLinks,
  cloudRequestPairingByCode,
  cloudRespondToPairing,
  cloudRevokePairing,
  cloudSetLinkBlocked,
  cloudUpdateLinkShareSettings,
} from './cloudPairingApi'
import { waveHasLoggedAttempts } from './sessionStats'
import { filterCoachCompletedSessions } from './sessionHistoryUtils'
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  validatePasswordStrength,
  verifyPassword,
} from './passwordUtils'
import type {
  AppView,
  Athlete,
  AthleteShareSettings,
  AuthSession,
  ComboLevel,
  HeatDurationMinutes,
  HeatInterferenceType,
  HeatRecord,
  PublicView,
  SeaPeak,
  SeaWaveType,
  ManeuverKind,
  ManeuverLevel,
  ManeuverLog,
  ComboAttemptLog,
  CoachAccount,
  CoachAthleteLink,
  StudentAccount,
  SurfSpot,
  TrainingMode,
  TrainingSession,
  UserRole,
  WaveRecord,
  WaveSide,
} from './types'
import { DEFAULT_ATHLETE_SHARE_SETTINGS, normalizeAthleteShareSettings } from './types'
import {
  backfillLocalLinks,
  buildCoachAthletesFromLinks,
  findAthleteByPairingCode,
  generatePairingCode,
  loadAthleteSessionsLocal,
  migrateLegacyLocalAthletes,
} from './localPairing'
import { clampHeatScore, MAX_HEAT_ATHLETES } from './heatUtils'
import type { PlanId } from './plans'
import { getPlan } from './plans'
import {
  canAccessTeamAnalytics,
  canAddAthlete,
  canUseTrainingMode,
  getAllowedModes,
} from './planUtils'
import {
  activateCoachSubscription,
  fetchCoachSubscription,
  isSubscriptionActive,
  startCoachCheckout,
  type CoachSubscription,
} from './subscriptionApi'
import { useToast } from './components/ToastProvider'
import {
  navigateToPublicView,
  publicViewFromPath,
} from './routing'
import {
  clearResumeState,
  loadResumeState,
  resumeUserKey,
  saveResumeState,
  validateAndNormalizeResume,
} from './resumeStore'

type DraftSession = {
  mode: TrainingMode
  spotId: string
  condition: string
  athleteIds: string[]
  heatDurationMinutes: HeatDurationMinutes
}

type AppContextValue = {
  auth: AuthSession | null
  authReady: boolean
  cloudMode: boolean
  publicView: PublicView
  selectedPlanId: PlanId | null
  subscription: CoachSubscription | null
  hasActiveSubscription: boolean
  selectPlan: (planId: PlanId, options?: { goToLogin?: boolean }) => void
  openLanding: () => void
  openCoachSignIn: () => void
  openCoachSignUp: () => void
  openAthleteSignIn: () => void
  openAthleteSignUp: () => void
  openForgotPassword: () => void
  requestPasswordReset: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>
  startCheckout: () => Promise<{ ok: true } | { ok: false; error: string }>
  activateDemoSubscription: () => Promise<{ ok: true } | { ok: false; error: string }>
  refreshSubscription: () => Promise<void>
  completeCheckout: () => Promise<{ ok: true } | { ok: false; error: string }>
  loginAsCoach: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  loginAsStudent: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  registerCoach: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  registerAthlete: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => void
  role: UserRole
  view: AppView
  setView: (view: AppView) => void
  coachAthletes: Athlete[]
  coachLinks: CoachAthleteLink[]
  athleteLinks: CoachAthleteLink[]
  spots: SurfSpot[]
  conditions: string[]
  requestPairingByCode: (code: string) => Promise<{ ok: boolean; error?: string; athleteName?: string }>
  respondToPairing: (linkId: string, accept: boolean) => Promise<{ ok: boolean; error?: string }>
  revokePairing: (linkId: string) => Promise<{ ok: boolean; error?: string }>
  updateAthleteShareSettings: (linkId: string, shareSettings: AthleteShareSettings) => void
  setAthleteBlocked: (linkId: string, blocked: boolean) => Promise<{ ok: boolean; error?: string }>
  activeCoachAthletes: Athlete[]
  changePassword: (newPassword: string) => Promise<{ ok: true } | { ok: false; error: string }>
  refreshPairingData: () => Promise<void>
  addSpot: (name: string) => void
  updateSpotName: (spotId: string, name: string) => void
  removeSpot: (spotId: string) => boolean
  addCondition: (name: string) => void
  updateConditionName: (currentLabel: string, nextLabel: string) => void
  removeCondition: (label: string) => boolean
  getAthlete: (id: string) => Athlete | undefined
  getSpot: (id: string) => SurfSpot | undefined
  draft: DraftSession
  setDraftMode: (mode: TrainingMode) => void
  setDraftSpot: (spotId: string) => void
  setDraftCondition: (condition: string) => void
  setDraftHeatDuration: (minutes: HeatDurationMinutes) => void
  addDraftAthlete: (athleteId: string) => void
  removeDraftAthlete: (athleteId: string) => void
  resetDraft: () => void
  activeSessionId: string | null
  activeSession: TrainingSession | undefined
  trainingSessions: TrainingSession[]
  beginDraftSession: () => void
  confirmAthletesAndStart: () => void
  endSessionSheetOpen: boolean
  openEndSessionSheet: () => void
  closeEndSessionSheet: () => void
  confirmEndSession: (coachNotes: string) => void
  cancelActiveSession: () => void
  completedCoachSessions: TrainingSession[]
  historySessionId: string | null
  historySession: TrainingSession | undefined
  openHistorySession: (sessionId: string) => void
  closeHistorySession: () => void
  activeAthleteId: string | null
  setActiveAthleteId: (id: string | null) => void
  activeWaveId: string | null
  selectAthlete: (athleteId: string) => void
  startOpenWave: () => void
  registerNoPotentialWave: () => void
  logTechnicalManeuver: (
    kind: ManeuverKind,
    side: WaveSide,
    level: ManeuverLevel,
    success: boolean,
  ) => void
  closeActiveWave: () => void
  logComboAttempt: (level: ComboLevel, side: WaveSide, success: boolean) => void
  activeHeatId: string | null
  setActiveHeatId: (id: string | null) => void
  createChampionshipHeat: (athleteIds: string[], durationMinutes: HeatDurationMinutes) => void
  startHeatTimer: (heatId: string) => void
  endHeat: (heatId: string) => void
  logHeatWaveScore: (heatId: string, athleteId: string, score: number) => void
  setHeatInterference: (
    heatId: string,
    athleteId: string,
    type: HeatInterferenceType | null,
  ) => void
  startSeaAnalysisTimer: () => void
  endSeaAnalysisTimer: () => void
  logSeaObservation: (peak: SeaPeak, waveType: SeaWaveType) => void
  updateSeaAnalysisLog: (logId: string, peak: SeaPeak, waveType: SeaWaveType) => void
  deleteSeaAnalysisLog: (logId: string) => void
  updateManeuverLog: (
    waveId: string,
    logId: string,
    patch: Pick<ManeuverLog, 'kind' | 'side' | 'level' | 'success'>,
  ) => void
  deleteManeuverLog: (waveId: string, logId: string) => void
  updateComboAttempt: (
    waveId: string,
    logId: string,
    patch: Pick<ComboAttemptLog, 'level' | 'side' | 'success'>,
  ) => void
  deleteComboAttempt: (waveId: string, logId: string) => void
  deleteWaveRecord: (waveId: string) => void
  updateHeatWaveScore: (heatId: string, scoreId: string, score: number) => void
  deleteHeatWaveScore: (heatId: string, scoreId: string) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const emptyDraft = (): DraftSession => ({
  mode: 'tecnico',
  spotId: store.getSpots()[0]?.id ?? '',
  condition: '',
  athleteIds: [],
  heatDurationMinutes: 15,
})

function viewForAuth(session: AuthSession): AppView {
  return session.role === 'atleta' ? 'athlete-portal' : 'coach-home'
}

function viewForMode(mode: TrainingMode): AppView {
  switch (mode) {
    case 'combos':
      return 'combos'
    case 'heats':
      return 'heats'
    case 'campeonato':
      return 'campeonato'
    case 'sea-analysis':
      return 'sea-analysis'
    default:
      return 'training'
  }
}

function buildHeatRecord(
  athleteIds: string[],
  durationMinutes: HeatDurationMinutes,
  label: string,
): HeatRecord {
  return {
    id: crypto.randomUUID(),
    label,
    athleteIds: athleteIds.slice(0, MAX_HEAT_ATHLETES),
    durationMinutes,
    timerStartedAt: null,
    endedAt: null,
    waveScores: [],
    interferences: [],
  }
}

function createPotentialWave(athleteId: string): WaveRecord {
  return {
    id: crypto.randomUUID(),
    athleteId,
    hasPotential: true,
    multiManeuver: true,
    startedAt: new Date().toISOString(),
    maneuvers: [],
    comboAttempts: [],
  }
}

async function coachPasswordMatches(coach: CoachAccount, password: string): Promise<boolean> {
  if (coach.passwordHash) return verifyPassword(password, coach.passwordHash)
  if (coach.password) return coach.password === password
  return false
}

async function studentPasswordMatches(student: StudentAccount, password: string): Promise<boolean> {
  if (student.passwordHash) return verifyPassword(password, student.passwordHash)
  if (student.password) return student.password === password
  return false
}

async function upgradeCoachPassword(coach: CoachAccount, password: string): Promise<CoachAccount> {
  const passwordHash = await hashPassword(password)
  return { ...coach, passwordHash, password: undefined }
}

async function upgradeStudentPassword(student: StudentAccount, password: string): Promise<StudentAccount> {
  const passwordHash = await hashPassword(password)
  return { ...student, passwordHash, password: undefined }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const cloudMode = isCloudEnabled()
  const { showToast } = useToast()
  const [authReady, setAuthReady] = useState(true)
  const [auth, setAuth] = useState<AuthSession | null>(() =>
    cloudMode ? null : authStore.getSession(),
  )
  const role: UserRole = auth?.role ?? 'treinador'
  const [publicView, setPublicViewState] = useState<PublicView>(() => publicViewFromPath(window.location.pathname))
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null)
  const [subscription, setSubscription] = useState<CoachSubscription | null>(null)
  const [view, setView] = useState<AppView>('coach-home')
  const [athletes, setAthletes] = useState<Athlete[]>(() =>
    cloudMode ? [] : migrateLegacyLocalAthletes(store.getAthletes()),
  )
  const [students, setStudents] = useState<StudentAccount[]>(() =>
    cloudMode ? [] : store.getStudents(),
  )
  const [coachLinks, setCoachLinks] = useState<CoachAthleteLink[]>(() =>
    cloudMode
      ? []
      : backfillLocalLinks(
          migrateLegacyLocalAthletes(store.getAthletes()),
          store.getPairings(),
          store.getCoaches(),
        ),
  )
  const [athleteLinks, setAthleteLinks] = useState<CoachAthleteLink[]>([])
  const [spots, setSpots] = useState<SurfSpot[]>(() => (cloudMode ? [] : store.getSpots()))
  const [conditions, setConditions] = useState<string[]>(() =>
    cloudMode ? [] : store.getConditions(),
  )
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>(() =>
    cloudMode ? [] : store.getTrainingSessions(),
  )
  const [draft, setDraft] = useState<DraftSession>(emptyDraft)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeAthleteId, setActiveAthleteId] = useState<string | null>(null)
  const [activeWaveId, setActiveWaveId] = useState<string | null>(null)
  const [activeHeatId, setActiveHeatId] = useState<string | null>(null)
  const [endSessionSheetOpen, setEndSessionSheetOpen] = useState(false)
  const [historySessionId, setHistorySessionId] = useState<string | null>(null)

  const skipResumeSaveRef = useRef(false)
  const authRef = useRef(auth)
  authRef.current = auth

  const resumeSnapshotRef = useRef({
    view: 'coach-home' as AppView,
    activeSessionId: null as string | null,
    activeAthleteId: null as string | null,
    activeWaveId: null as string | null,
    activeHeatId: null as string | null,
    draft: emptyDraft(),
    historySessionId: null as string | null,
  })
  resumeSnapshotRef.current = {
    view,
    activeSessionId,
    activeAthleteId,
    activeWaveId,
    activeHeatId,
    draft,
    historySessionId,
  }

  const applyResumeFromStore = useCallback((session: AuthSession, sessions: TrainingSession[]) => {
    const userKey = resumeUserKey(session)
    const saved = loadResumeState(userKey)
    if (!saved) {
      setView(viewForAuth(session))
      return
    }

    const restored = validateAndNormalizeResume(saved, session, sessions)
    if (!restored) {
      clearResumeState(userKey)
      setView(viewForAuth(session))
      return
    }

    skipResumeSaveRef.current = true
    setView(restored.view)
    setActiveSessionId(restored.activeSessionId)
    setActiveAthleteId(restored.activeAthleteId)
    setActiveWaveId(restored.activeWaveId)
    setActiveHeatId(restored.activeHeatId)
    setHistorySessionId(restored.historySessionId)
    setDraft(restored.draft)
    queueMicrotask(() => {
      skipResumeSaveRef.current = false
    })
  }, [])

  const coachId = auth?.role === 'treinador' ? auth.coachId : null

  const coachAthletes = useMemo(() => {
    if (auth?.role === 'treinador') {
      return cloudMode ? athletes : buildCoachAthletesFromLinks(coachLinks, athletes)
    }
    if (auth?.role === 'atleta') {
      return athletes.filter((a) => a.id === auth.athleteId)
    }
    return []
  }, [athletes, auth, cloudMode, coachLinks])

  const activeCoachAthletes = useMemo(
    () => coachAthletes.filter((a) => !a.blocked),
    [coachAthletes],
  )

  const syncSessionsToCloud = useCallback(
    (next: TrainingSession[], session: AuthSession | null = auth) => {
      if (cloudMode && session?.role === 'treinador') {
        void cloudSaveTrainingSessions(session.coachId, next).then((result) => {
          if (!result.ok) showToast(`Failed to save sessions: ${result.error}`, 'error')
        })
      }
    },
    [auth, cloudMode, showToast],
  )

  const setPublicView = useCallback((next: PublicView) => {
    setPublicViewState(next)
    navigateToPublicView(next)
  }, [])

  useEffect(() => {
    const onPopState = () => setPublicViewState(publicViewFromPath(window.location.pathname))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const applyCloudSessionData = useCallback(async (session: AuthSession): Promise<TrainingSession[]> => {
    if (session.role === 'treinador') {
      const data = await cloudLoadCoachData(session.coachId)
      const sessions = data.trainingSessions.map((trainingSession) => ({
        ...trainingSession,
        spotName:
          trainingSession.spotName?.trim() ||
          data.spots.find((spot) => spot.id === trainingSession.spotId)?.name?.trim() ||
          '',
      }))
      setAthletes(data.athletes)
      setCoachLinks(data.links)
      setAthleteLinks([])
      setSpots(data.spots)
      setConditions(data.conditions)
      setTrainingSessions(sessions)
      setDraft((d) => ({ ...d, spotId: data.spots[0]?.id ?? d.spotId }))
      return sessions
    }

    const data = await cloudLoadAthleteData(session.athleteId)
    const sessions = data.trainingSessions.filter((s) => Boolean(s.endedAt))
    setAthletes(data.athlete ? [data.athlete] : [])
    setAthleteLinks(data.links)
    setCoachLinks([])
    setTrainingSessions(sessions)
    setSpots([])
    return sessions
  }, [])

  const syncCoachSubscription = useCallback(
    async (session: AuthSession) => {
      if (session.role !== 'treinador') {
        setSubscription(null)
        return
      }
      const sub = await fetchCoachSubscription(session.coachId, cloudMode)
      setSubscription(sub)
    },
    [cloudMode],
  )

  const hasActiveSubscription = useMemo(() => {
    if (auth?.role !== 'treinador') return true
    return isSubscriptionActive(subscription)
  }, [auth, subscription])

  const refreshSubscription = useCallback(async () => {
    if (!auth || auth.role !== 'treinador') return
    const sub = await fetchCoachSubscription(auth.coachId, cloudMode)
    setSubscription(sub)
    if (isSubscriptionActive(sub)) {
      setView('coach-home')
    }
  }, [auth, cloudMode])

  const selectPlan = useCallback((planId: PlanId, options?: { goToLogin?: boolean }) => {
    setSelectedPlanId(planId)
    if (options?.goToLogin !== false) {
      setPublicView('coach-sign-up')
    }
  }, [setPublicView])

  const openLanding = useCallback(() => {
    setPublicView('landing')
  }, [setPublicView])

  const openCoachSignIn = useCallback(() => {
    setPublicView('coach-sign-in')
  }, [setPublicView])

  const openCoachSignUp = useCallback(() => {
    setPublicView('coach-sign-up')
  }, [setPublicView])

  const openAthleteSignIn = useCallback(() => {
    setSelectedPlanId(null)
    setPublicView('athlete-sign-in')
  }, [setPublicView])

  const openAthleteSignUp = useCallback(() => {
    setSelectedPlanId(null)
    setPublicView('athlete-sign-up')
  }, [setPublicView])

  const openForgotPassword = useCallback(() => {
    window.history.pushState({}, '', '/forgot-password')
  }, [])

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!cloudMode) {
        return { ok: false as const, error: 'Password reset is only available in cloud mode.' }
      }
      return cloudResetPassword(email)
    },
    [cloudMode],
  )

  const startCheckout = useCallback(async () => {
    if (!auth || auth.role !== 'treinador') {
        return { ok: false as const, error: 'Sign in as coach first.' }
    }
    const planId = selectedPlanId ?? subscription?.planId ?? 'team'
    try {
      const sub = await startCoachCheckout(auth.coachId, planId, cloudMode)
      setSubscription(sub)
      return { ok: true as const }
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Could not start checkout.',
      }
    }
  }, [auth, cloudMode, selectedPlanId, subscription?.planId])

  const activateDemoSubscription = useCallback(async () => {
    if (!auth || auth.role !== 'treinador') {
        return { ok: false as const, error: 'Sign in as coach first.' }
    }
    const planId = selectedPlanId ?? subscription?.planId ?? 'team'
    try {
      const sub = await activateCoachSubscription(auth.coachId, planId, cloudMode)
      setSubscription(sub)
      setView('coach-home')
      showToast('Subscription activated.', 'success')
      return { ok: true as const }
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Could not activate subscription.',
      }
    }
  }, [auth, cloudMode, selectedPlanId, subscription?.planId, showToast])

  const completeCheckout = useCallback(async () => {
    return activateDemoSubscription()
  }, [activateDemoSubscription])

  const refreshPairingData = useCallback(async () => {
    if (!auth) return
    if (cloudMode) {
      if (auth.role === 'treinador') {
        const [athletesNext, linksNext] = await Promise.all([
          cloudFetchCoachAthletes(auth.coachId),
          cloudFetchCoachLinks(auth.coachId),
        ])
        setAthletes(athletesNext)
        setCoachLinks(linksNext)
      } else {
        const data = await cloudLoadAthleteData(auth.athleteId)
        setAthletes(data.athlete ? [data.athlete] : [])
        setAthleteLinks(data.links)
        setTrainingSessions(data.trainingSessions.filter((s) => Boolean(s.endedAt)))
      }
      return
    }

    if (auth.role === 'treinador') {
      setCoachLinks(store.getPairings().filter((l) => l.coachId === auth.coachId))
      setAthletes(migrateLegacyLocalAthletes(store.getAthletes()))
    } else {
      const allLinks = store.getPairings().filter((l) => l.athleteId === auth.athleteId)
      setAthleteLinks(allLinks)
      setTrainingSessions(
        loadAthleteSessionsLocal(auth.athleteId, allLinks, store.getTrainingSessions()),
      )
    }
  }, [auth, cloudMode])

  useEffect(() => {
    if (cloudMode || !auth || auth.role !== 'treinador') return
    void syncCoachSubscription(auth)
  }, [auth, cloudMode, syncCoachSubscription])

  useEffect(() => {
    if (!auth || skipResumeSaveRef.current) return
    saveResumeState(resumeUserKey(auth), resumeSnapshotRef.current)
  }, [
    auth,
    view,
    activeSessionId,
    activeAthleteId,
    activeWaveId,
    activeHeatId,
    draft,
    historySessionId,
  ])

  useEffect(() => {
    const flushResume = () => {
      const session = authRef.current
      if (!session) return
      saveResumeState(resumeUserKey(session), resumeSnapshotRef.current)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushResume()
    }
    window.addEventListener('pagehide', flushResume)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('pagehide', flushResume)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (cloudMode || !auth) return
    applyResumeFromStore(auth, store.getTrainingSessions())
  }, [applyResumeFromStore, auth, cloudMode])

  useEffect(() => {
    if (!cloudMode) return

    let mounted = true
    let unsub: (() => void) | undefined

    const applySessionData = async (session: AuthSession) => {
      if (!mounted) return
      const sessions = await applyCloudSessionData(session)
      await syncCoachSubscription(session)
      return sessions
    }

    void (async () => {
      try {
        unsub = await cloudOnAuthChange((next, event) => {
          if (!mounted) return
          const previous = authRef.current
          setAuth(next)
          if (next) {
            if (event === 'TOKEN_REFRESHED') return

            setTimeout(() => {
              void applySessionData(next).then((sessions) => {
                if (!mounted || !sessions) return
                if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                  applyResumeFromStore(next, sessions)
                }
              })
            }, 0)
          } else {
            if (previous) clearResumeState(resumeUserKey(previous))
            setAthletes([])
            setStudents([])
            setCoachLinks([])
            setAthleteLinks([])
            setSpots([])
            setConditions([])
            setTrainingSessions([])
            setActiveSessionId(null)
            setActiveWaveId(null)
            setActiveHeatId(null)
            setActiveAthleteId(null)
            setSubscription(null)
            setSelectedPlanId(null)
            setPublicView('landing')
          }
        })

        // Avoid Supabase auth deadlock: listener first, then getSession.
        await new Promise((resolve) => setTimeout(resolve, 0))
        const session = await cloudGetSession()
        if (session && mounted) {
          setAuth(session)
          void applySessionData(session).then((sessions) => {
            if (mounted && sessions) {
              applyResumeFromStore(session, sessions)
            }
          })
        }
      } catch (error) {
        console.error('SurfStar cloud init failed', error)
      } finally {
        if (mounted) setAuthReady(true)
      }
    })()

    return () => {
      mounted = false
      unsub?.()
    }
  }, [applyCloudSessionData, applyResumeFromStore, cloudMode, syncCoachSubscription])

  const loginAsCoach = useCallback(
    async (email: string, password: string) => {
      if (cloudMode) {
        const result = await cloudLogin(email, password)
        if (!result.ok) return result
        setAuth(result.session)
        const sessions = await applyCloudSessionData(result.session)
        await syncCoachSubscription(result.session)
        applyResumeFromStore(result.session, sessions)
        return { ok: true as const }
      }

      const normalized = normalizeEmail(email)
    const coaches = store.getCoaches()
    const index = coaches.findIndex((c) => c.email === normalized)
    if (index < 0) return { ok: false, error: 'Incorrect email or password.' }
    const coach = coaches[index]!
    if (!(await coachPasswordMatches(coach, password))) {
      return { ok: false, error: 'Incorrect email or password.' }
    }

    let nextCoaches = coaches
    if (!coach.passwordHash && coach.password) {
      const upgraded = await upgradeCoachPassword(coach, password)
      nextCoaches = coaches.map((c, i) => (i === index ? upgraded : c))
      store.saveCoaches(nextCoaches)
    }

    const current = nextCoaches[index]!
    const session: AuthSession = {
      role: 'treinador',
      coachId: current.id,
      name: current.name,
      email: current.email,
    }
    authStore.setSession(session)
    setAuth(session)
    const sessions = store.getTrainingSessions()
    setTrainingSessions(sessions)
    applyResumeFromStore(session, sessions)
    await syncCoachSubscription(session)
    return { ok: true }
  },
    [applyCloudSessionData, applyResumeFromStore, cloudMode, syncCoachSubscription],
  )

  const loginAsStudent = useCallback(
    async (email: string, password: string) => {
      if (cloudMode) {
        const result = await cloudLogin(email, password)
        if (!result.ok) return result
        setAuth(result.session)
        const sessions = await applyCloudSessionData(result.session)
        applyResumeFromStore(result.session, sessions)
        return { ok: true as const }
      }

      const normalized = normalizeEmail(email)
    const all = store.getStudents()
    const index = all.findIndex((s) => s.email === normalized)
    if (index < 0) return { ok: false, error: 'Incorrect email or password.' }
    const student = all[index]!
    if (!(await studentPasswordMatches(student, password))) {
      return { ok: false, error: 'Incorrect email or password.' }
    }

    const athlete = store.getAthletes().find((a) => a.id === student.athleteId)
    if (athlete?.blocked) {
      return {
        ok: false,
        error: 'Your account is blocked. Contact your coach if you think this is a mistake.',
      }
    }

    let nextStudents = all
    if (!student.passwordHash && student.password) {
      const upgraded = await upgradeStudentPassword(student, password)
      nextStudents = all.map((s, i) => (i === index ? upgraded : s))
      store.saveStudents(nextStudents)
      setStudents(nextStudents)
    }

    const current = nextStudents[index]!
    const currentAthlete = store.getAthletes().find((a) => a.id === current.athleteId)
    const session: AuthSession = {
      role: 'atleta',
      athleteId: current.athleteId,
      name: current.name,
      email: current.email,
      pairingCode: currentAthlete?.pairingCode ?? '',
      mustChangePassword: current.mustChangePassword ?? false,
    }
    authStore.setSession(session)
    setAuth(session)
    const links = store.getPairings().filter((l) => l.athleteId === current.athleteId)
    const athleteSessions = loadAthleteSessionsLocal(
      current.athleteId,
      links,
      store.getTrainingSessions(),
    )
    setAthleteLinks(links)
    setTrainingSessions(athleteSessions)
    applyResumeFromStore(session, athleteSessions)
    return { ok: true }
  },
    [applyCloudSessionData, applyResumeFromStore, cloudMode],
  )

  const registerCoach = useCallback(
    async (name: string, email: string, password: string) => {
      if (cloudMode) {
        const result = await cloudRegisterCoach(name, email, password)
        if (!result.ok) return result
        setAuth(result.session)
        setView('coach-home')
        void applyCloudSessionData(result.session)
          .then(() => syncCoachSubscription(result.session))
          .catch((err) => {
          console.error('Failed to load coach data after registration', err)
        })
        return { ok: true as const }
      }

      const trimmedName = name.trim()
      const normalized = normalizeEmail(email)
      if (!trimmedName) return { ok: false as const, error: 'Enter your name.' }
      if (!isValidEmail(normalized)) return { ok: false as const, error: 'Enter a valid email.' }
      const pwdError = validatePasswordStrength(password)
      if (pwdError) return { ok: false as const, error: pwdError }
      const coaches = store.getCoaches()
      if (coaches.some((c) => c.email === normalized)) {
        return { ok: false as const, error: 'This email is already registered.' }
      }
      const passwordHash = await hashPassword(password)
      const coach: CoachAccount = {
        id: crypto.randomUUID(),
        name: trimmedName,
        email: normalized,
        passwordHash,
      }
      const next = [...coaches, coach]
      store.saveCoaches(next)
      const session: AuthSession = {
        role: 'treinador',
        coachId: coach.id,
        name: coach.name,
        email: coach.email,
      }
      authStore.setSession(session)
      setAuth(session)
      setView('coach-home')
      await syncCoachSubscription(session)
      return { ok: true as const }
    },
    [applyCloudSessionData, cloudMode, syncCoachSubscription],
  )

  const registerAthlete = useCallback(
    async (name: string, email: string, password: string) => {
      if (cloudMode) {
        const result = await cloudRegisterAthlete(name, email, password)
        if (!result.ok) return result
        setAuth(result.session)
        setView(viewForAuth(result.session))
        void applyCloudSessionData(result.session).catch((err) => {
          console.error('Failed to load athlete data after registration', err)
        })
        return { ok: true as const }
      }

      const trimmedName = name.trim()
      const normalized = normalizeEmail(email)
      if (!trimmedName) return { ok: false as const, error: 'Enter your name.' }
      if (!isValidEmail(normalized)) return { ok: false as const, error: 'Enter a valid email.' }
      const pwdError = validatePasswordStrength(password)
      if (pwdError) return { ok: false as const, error: pwdError }
      if (students.some((s) => s.email === normalized)) {
        return { ok: false as const, error: 'This email is already registered.' }
      }

      const athleteId = crypto.randomUUID()
      const allAthletes = migrateLegacyLocalAthletes(store.getAthletes())
      const pairingCode = generatePairingCode(allAthletes.map((a) => a.pairingCode))
      const athlete: Athlete = {
        id: athleteId,
        name: trimmedName,
        pairingCode,
      }
      const passwordHash = await hashPassword(password)
      const student: StudentAccount = {
        id: crypto.randomUUID(),
        coachId: '',
        athleteId,
        name: trimmedName,
        email: normalized,
        passwordHash,
        mustChangePassword: false,
      }
      const nextAthletes = [...allAthletes, athlete]
      const nextStudents = [...students, student]
      store.saveAthletes(nextAthletes)
      store.saveStudents(nextStudents)
      setAthletes(nextAthletes)
      setStudents(nextStudents)
      setAthleteLinks([])

      const session: AuthSession = {
        role: 'atleta',
        athleteId,
        name: trimmedName,
        email: normalized,
        pairingCode,
      }
      authStore.setSession(session)
      setAuth(session)
      setView('athlete-portal')
      return { ok: true as const }
    },
    [applyCloudSessionData, cloudMode, students],
  )

  const logout = useCallback(async () => {
    if (auth) clearResumeState(resumeUserKey(auth))
    if (cloudMode) await cloudLogout()
    else authStore.setSession(null)
    setAuth(null)
    setActiveSessionId(null)
    setActiveWaveId(null)
    setActiveHeatId(null)
    setActiveAthleteId(null)
    setSubscription(null)
    setSelectedPlanId(null)
    setPublicView('landing')
    setView('coach-home')
  }, [auth, cloudMode, setPublicView])

  const persistSessions = useCallback(
    (nextOrUpdater: TrainingSession[] | ((prev: TrainingSession[]) => TrainingSession[])) => {
      setTrainingSessions((prev) => {
        const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater
        if (cloudMode) syncSessionsToCloud(next)
        else store.saveTrainingSessions(next)
        return next
      })
    },
    [cloudMode, syncSessionsToCloud],
  )

  const activeSession = useMemo(
    () => trainingSessions.find((s) => s.id === activeSessionId),
    [trainingSessions, activeSessionId],
  )

  const completedCoachSessions = useMemo(
    () => (coachId ? filterCoachCompletedSessions(trainingSessions, coachId) : []),
    [coachId, trainingSessions],
  )

  const historySession = useMemo(
    () =>
      historySessionId
        ? trainingSessions.find((s) => s.id === historySessionId)
        : undefined,
    [historySessionId, trainingSessions],
  )

  const updateSession = useCallback(
    (sessionId: string, updater: (session: TrainingSession) => TrainingSession) => {
      persistSessions((prev) => prev.map((s) => (s.id === sessionId ? updater(s) : s)))
    },
    [persistSessions],
  )

  const requestPairingByCode = useCallback(
    async (code: string) => {
      if (auth?.role !== 'treinador') {
        return { ok: false, error: 'Sign in as coach first.' }
      }

      const planId = subscription?.planId ?? selectedPlanId ?? 'starter'
      const activeCount = coachAthletes.filter((a) => !a.blocked).length
      const pendingCount = coachLinks.filter((l) => l.status === 'pending').length
      if (!canAddAthlete(planId, activeCount + pendingCount)) {
        return {
          ok: false,
          error: `Athlete limit reached on ${getPlan(planId).name}. Upgrade to add more.`,
        }
      }

      if (cloudMode) {
        const result = await cloudRequestPairingByCode(code)
        if (!result.ok) return result
        await refreshPairingData()
        return { ok: true, athleteName: result.athleteName }
      }

      const trimmed = code.trim().toUpperCase()
      const allAthletes = migrateLegacyLocalAthletes(store.getAthletes())
      const athlete = findAthleteByPairingCode(allAthletes, trimmed)
      if (!athlete) return { ok: false, error: 'No athlete found with this code.' }

      const pairings = store.getPairings()
      const existing = pairings.find(
        (l) => l.coachId === auth.coachId && l.athleteId === athlete.id,
      )
      if (existing?.status === 'active') {
        return { ok: false, error: 'This athlete is already on your team.' }
      }

      const nextLink: CoachAthleteLink = existing
        ? { ...existing, status: 'pending', initiatedBy: 'coach', blocked: false }
        : {
            id: crypto.randomUUID(),
            coachId: auth.coachId,
            athleteId: athlete.id,
            status: 'pending',
            initiatedBy: 'coach',
            shareSettings: DEFAULT_ATHLETE_SHARE_SETTINGS,
            blocked: false,
            athleteName: athlete.name,
          }

      const nextPairings = existing
        ? pairings.map((l) => (l.id === existing.id ? nextLink : l))
        : [...pairings, nextLink]
      store.savePairings(nextPairings)
      setCoachLinks(nextPairings.filter((l) => l.coachId === auth.coachId))
      return { ok: true, athleteName: athlete.name }
    },
    [auth, cloudMode, coachAthletes, coachLinks, refreshPairingData, selectedPlanId, subscription?.planId],
  )

  const respondToPairing = useCallback(
    async (linkId: string, accept: boolean) => {
      if (auth?.role !== 'atleta') {
        return { ok: false, error: 'Sign in as athlete first.' }
      }

      if (cloudMode) {
        const result = await cloudRespondToPairing(linkId, accept)
        if (!result.ok) return result
        await refreshPairingData()
        return { ok: true }
      }

      const pairings = store.getPairings()
      const link = pairings.find((l) => l.id === linkId && l.athleteId === auth.athleteId)
      if (!link || link.status !== 'pending') {
        return { ok: false, error: 'Request not found.' }
      }

      const nextPairings = pairings.map((l) =>
        l.id === linkId
          ? { ...l, status: accept ? ('active' as const) : ('revoked' as const) }
          : l,
      )
      store.savePairings(nextPairings)
      setAthleteLinks(nextPairings.filter((l) => l.athleteId === auth.athleteId))
      if (accept) {
        setTrainingSessions(
          loadAthleteSessionsLocal(auth.athleteId, nextPairings, store.getTrainingSessions()),
        )
      }
      return { ok: true }
    },
    [auth, cloudMode, refreshPairingData],
  )

  const revokePairing = useCallback(
    async (linkId: string) => {
      if (!auth) return { ok: false, error: 'Sign in first.' }

      if (cloudMode) {
        const result = await cloudRevokePairing(linkId)
        if (!result.ok) return result
        await refreshPairingData()
        return { ok: true }
      }

      const pairings = store.getPairings()
      const link = pairings.find((l) => l.id === linkId)
      if (!link) return { ok: false, error: 'Link not found.' }
      if (auth.role === 'treinador' && link.coachId !== auth.coachId) {
        return { ok: false, error: 'Not allowed.' }
      }
      if (auth.role === 'atleta' && link.athleteId !== auth.athleteId) {
        return { ok: false, error: 'Not allowed.' }
      }

      const nextPairings = pairings.map((l) =>
        l.id === linkId ? { ...l, status: 'revoked' as const, blocked: false } : l,
      )
      store.savePairings(nextPairings)
      if (auth.role === 'treinador') {
        setCoachLinks(nextPairings.filter((l) => l.coachId === auth.coachId))
      } else {
        setAthleteLinks(nextPairings.filter((l) => l.athleteId === auth.athleteId))
        setTrainingSessions(
          loadAthleteSessionsLocal(auth.athleteId, nextPairings, store.getTrainingSessions()),
        )
      }
      return { ok: true }
    },
    [auth, cloudMode, refreshPairingData],
  )

  const updateAthleteShareSettings = useCallback(
    (linkId: string, shareSettings: AthleteShareSettings) => {
      if (auth?.role !== 'treinador') return
      const normalized = normalizeAthleteShareSettings(shareSettings)

      if (cloudMode) {
        void cloudUpdateLinkShareSettings(linkId, normalized).then((result) => {
          if (!result.ok) {
            showToast(result.error, 'error')
            return
          }
          void refreshPairingData()
        })
        return
      }

      const pairings = store.getPairings()
      const nextPairings = pairings.map((l) =>
        l.id === linkId ? { ...l, shareSettings: normalized } : l,
      )
      store.savePairings(nextPairings)
      setCoachLinks(nextPairings.filter((l) => l.coachId === auth.coachId))
      setAthletes(buildCoachAthletesFromLinks(nextPairings, store.getAthletes()))
    },
    [auth, cloudMode, refreshPairingData, showToast],
  )

  const setAthleteBlocked = useCallback(
    async (linkId: string, blocked: boolean) => {
      if (auth?.role !== 'treinador') {
        return { ok: false, error: 'Sign in as coach first.' }
      }

      if (cloudMode) {
        const result = await cloudSetLinkBlocked(linkId, blocked)
        if (!result.ok) return result
        await refreshPairingData()
        return { ok: true }
      }

      const pairings = store.getPairings()
      const nextPairings = pairings.map((l) => (l.id === linkId ? { ...l, blocked } : l))
      store.savePairings(nextPairings)
      setCoachLinks(nextPairings.filter((l) => l.coachId === auth.coachId))
      setAthletes(buildCoachAthletesFromLinks(nextPairings, store.getAthletes()))
      return { ok: true }
    },
    [auth, cloudMode, refreshPairingData],
  )

  const changePassword = useCallback(
    async (newPassword: string) => {
      if (auth?.role !== 'atleta' && auth?.role !== 'treinador') {
        return { ok: false as const, error: 'Sign in first.' }
      }

      const pwdError = validatePasswordStrength(newPassword)
      if (pwdError) return { ok: false as const, error: pwdError }

      if (cloudMode) {
        const result = await cloudChangePassword(newPassword)
        if (!result.ok) return result
        setAuth(result.session)
        authStore.setSession(result.session)
        setView(auth.role === 'atleta' ? 'athlete-portal' : 'subscription')
        return { ok: true as const }
      }

      if (auth.role === 'atleta') {
        const all = store.getStudents()
        const index = all.findIndex((s) => s.athleteId === auth.athleteId)
        if (index < 0) {
          return { ok: false as const, error: 'Account not found.' }
        }

        const passwordHash = await hashPassword(newPassword)
        const updated: StudentAccount = {
          ...all[index]!,
          passwordHash,
          mustChangePassword: false,
        }
        const nextStudents = all.map((s, i) => (i === index ? updated : s))
        store.saveStudents(nextStudents)
        setStudents(nextStudents)

        const session: AuthSession = { ...auth, mustChangePassword: false }
        setAuth(session)
        authStore.setSession(session)
        setView('athlete-portal')
        return { ok: true as const }
      }

      const coaches = store.getCoaches()
      const coachIndex = coaches.findIndex((c) => c.id === auth.coachId)
      if (coachIndex < 0) return { ok: false as const, error: 'Account not found.' }
      const updatedCoach = await upgradeCoachPassword(coaches[coachIndex]!, newPassword)
      const nextCoaches = coaches.map((c, i) => (i === coachIndex ? updatedCoach : c))
      store.saveCoaches(nextCoaches)
      setView('subscription')
      return { ok: true as const }
    },
    [auth, cloudMode],
  )

  const saveSpotsToCloud = useCallback(
    (coachId: string, next: SurfSpot[]) => {
      void cloudSaveSpots(coachId, next).then((result) => {
        if (!result.ok) showToast(`Failed to save spots: ${result.error}`, 'error')
      })
    },
    [showToast],
  )

  const saveConditionsToCloud = useCallback(
    (coachId: string, next: string[]) => {
      void cloudSaveConditions(coachId, next).then((result) => {
        if (!result.ok) showToast(`Failed to save conditions: ${result.error}`, 'error')
      })
    },
    [showToast],
  )

  const addSpot = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || auth?.role !== 'treinador') return
      const next = [...spots, { id: crypto.randomUUID(), name: trimmed }]
      setSpots(next)
      if (cloudMode) saveSpotsToCloud(auth.coachId, next)
      else store.saveSpots(next)
    },
    [auth, cloudMode, saveSpotsToCloud, spots],
  )

  const addCondition = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || conditions.includes(trimmed) || auth?.role !== 'treinador') return
      const next = [...conditions, trimmed]
      setConditions(next)
      if (cloudMode) saveConditionsToCloud(auth.coachId, next)
      else store.saveConditions(next)
    },
    [auth, cloudMode, conditions, saveConditionsToCloud],
  )

  const updateSpotName = useCallback(
    (spotId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed || auth?.role !== 'treinador') return
      const next = spots.map((s) => (s.id === spotId ? { ...s, name: trimmed } : s))
      setSpots(next)
      if (cloudMode) saveSpotsToCloud(auth.coachId, next)
      else store.saveSpots(next)
    },
    [auth, cloudMode, saveSpotsToCloud, spots],
  )

  const removeSpot = useCallback(
    (spotId: string) => {
      if (auth?.role !== 'treinador') return false
      if (spots.length <= 1) return false
      const next = spots.filter((s) => s.id !== spotId)
      setSpots(next)
      setDraft((d) => ({
        ...d,
        spotId: d.spotId === spotId ? (next[0]?.id ?? '') : d.spotId,
      }))
      if (cloudMode) saveSpotsToCloud(auth.coachId, next)
      else store.saveSpots(next)
      return true
    },
    [auth, cloudMode, saveSpotsToCloud, spots],
  )

  const updateConditionName = useCallback(
    (currentLabel: string, nextLabel: string) => {
      const trimmed = nextLabel.trim()
      if (!trimmed || auth?.role !== 'treinador') return
      if (trimmed === currentLabel) return
      if (conditions.includes(trimmed)) return
      const next = conditions.map((c) => (c === currentLabel ? trimmed : c))
      setConditions(next)
      setDraft((d) => ({
        ...d,
        condition: d.condition === currentLabel ? trimmed : d.condition,
      }))
      if (cloudMode) saveConditionsToCloud(auth.coachId, next)
      else store.saveConditions(next)
    },
    [auth, cloudMode, conditions, saveConditionsToCloud],
  )

  const removeCondition = useCallback(
    (label: string) => {
      if (auth?.role !== 'treinador') return false
      if (conditions.length <= 1) return false
      const next = conditions.filter((c) => c !== label)
      setConditions(next)
      setDraft((d) => ({
        ...d,
        condition: d.condition === label ? '' : d.condition,
      }))
      if (cloudMode) saveConditionsToCloud(auth.coachId, next)
      else store.saveConditions(next)
      return true
    },
    [auth, cloudMode, conditions, saveConditionsToCloud],
  )

  const getAthlete = useCallback(
    (id: string) => {
      const athlete =
        athletes.find((a) => a.id === id) ?? coachAthletes.find((a) => a.id === id)
      if (!athlete) return undefined
      return {
        ...athlete,
        shareSettings: normalizeAthleteShareSettings(athlete.shareSettings),
      }
    },
    [athletes, coachAthletes],
  )
  const getSpot = useCallback((id: string) => spots.find((s) => s.id === id), [spots])

  const setDraftMode = useCallback((mode: TrainingMode) => {
    setDraft((d) => ({ ...d, mode }))
  }, [])

  const setDraftSpot = useCallback((spotId: string) => {
    setDraft((d) => ({ ...d, spotId }))
  }, [])

  const setDraftCondition = useCallback((condition: string) => {
    setDraft((d) => ({ ...d, condition }))
  }, [])

  const setDraftHeatDuration = useCallback((minutes: HeatDurationMinutes) => {
    setDraft((d) => ({ ...d, heatDurationMinutes: minutes }))
  }, [])

  const addDraftAthlete = useCallback((athleteId: string) => {
    setDraft((d) => {
      if (d.athleteIds.includes(athleteId)) return d
      if (d.mode === 'heats' && d.athleteIds.length >= MAX_HEAT_ATHLETES) return d
      return { ...d, athleteIds: [...d.athleteIds, athleteId] }
    })
  }, [])

  const removeDraftAthlete = useCallback((athleteId: string) => {
    setDraft((d) => ({ ...d, athleteIds: d.athleteIds.filter((id) => id !== athleteId) }))
  }, [])

  const resetDraft = useCallback(() => {
    setDraft(emptyDraft())
  }, [])

  const navigateView = useCallback(
    (next: AppView) => {
      if (
        next === 'analytics' &&
        subscription &&
        !canAccessTeamAnalytics(subscription.planId)
      ) {
        showToast('Team analytics requires Coach or Coach Premium plan.', 'error')
        return
      }
      setView(next)
    },
    [showToast, subscription],
  )

  const beginDraftSession = useCallback(() => {
    const planId = subscription?.planId ?? 'starter'
    const draftBase = emptyDraft()
    if (!canUseTrainingMode(planId, draftBase.mode)) {
      draftBase.mode = getAllowedModes(planId)[0] ?? 'tecnico'
    }
    setDraft(draftBase)
    navigateView('start-session')
  }, [navigateView, subscription?.planId])

  const confirmAthletesAndStart = useCallback(() => {
    if (!draft.spotId || !draft.condition) return
    if (draft.mode !== 'sea-analysis' && draft.athleteIds.length === 0) return
    if (auth?.role !== 'treinador') return

    const planId = subscription?.planId ?? 'starter'
    if (!canUseTrainingMode(planId, draft.mode)) {
      showToast('This training mode is not included in your plan.', 'error')
      return
    }

    const initialHeat =
      draft.mode === 'heats'
        ? buildHeatRecord(draft.athleteIds, draft.heatDurationMinutes, 'Heat')
        : null

    const session: TrainingSession = {
      id: crypto.randomUUID(),
      coachId: auth.coachId,
      mode: draft.mode,
      spotId: draft.spotId,
      spotName: spots.find((spot) => spot.id === draft.spotId)?.name?.trim() ?? '',
      condition: draft.condition,
      startedAt: new Date().toISOString(),
      athleteIds: draft.athleteIds,
      waves: [],
      comboEntries: [],
      heats: initialHeat ? [initialHeat] : [],
      seaAnalysis:
        draft.mode === 'sea-analysis'
          ? { timerStartedAt: null, endedAt: null, logs: [] }
          : null,
      endedAt: null,
      coachNotes: null,
    }
    persistSessions((prev) => [session, ...prev])
    setActiveSessionId(session.id)
    setActiveAthleteId(draft.athleteIds[0] ?? null)
    setActiveWaveId(null)
    setActiveHeatId(initialHeat?.id ?? null)
    setView(viewForMode(draft.mode))
  }, [auth, draft, persistSessions, showToast, spots, subscription?.planId])

  const openEndSessionSheet = useCallback(() => {
    setEndSessionSheetOpen(true)
  }, [])

  const closeEndSessionSheet = useCallback(() => {
    setEndSessionSheetOpen(false)
  }, [])

  const confirmEndSession = useCallback(
    (coachNotes: string) => {
      if (!activeSessionId) return
      const sessionId = activeSessionId
      const trimmedNotes = coachNotes.trim()

      updateSession(sessionId, (s) => ({
        ...s,
        endedAt: new Date().toISOString(),
        coachNotes: trimmedNotes || null,
        spotName:
          s.spotName?.trim() ||
          spots.find((spot) => spot.id === s.spotId)?.name?.trim() ||
          '',
      }))

      setEndSessionSheetOpen(false)
      setActiveWaveId(null)
      setActiveHeatId(null)
      setActiveSessionId(null)
      setActiveAthleteId(null)
      resetDraft()
      setHistorySessionId(sessionId)
      setView('session-history-detail')
    },
    [activeSessionId, resetDraft, spots, updateSession],
  )

  const openHistorySession = useCallback((sessionId: string) => {
    setHistorySessionId(sessionId)
    setView('session-history-detail')
  }, [])

  const closeHistorySession = useCallback(() => {
    setHistorySessionId(null)
    setView('training-sessions')
  }, [])

  const cancelActiveSession = useCallback(() => {
    if (!activeSessionId) return
    persistSessions((prev) => prev.filter((s) => s.id !== activeSessionId))
    setActiveWaveId(null)
    setActiveHeatId(null)
    setActiveSessionId(null)
    setActiveAthleteId(null)
    resetDraft()
    setView('coach-home')
  }, [activeSessionId, persistSessions, resetDraft])

  const discardEmptyOpenWave = useCallback(
    (sessionId: string, waveId: string | null) => {
      if (!waveId) return
      const session = trainingSessions.find((s) => s.id === sessionId)
      const wave = session?.waves.find((w) => w.id === waveId)
      if (wave && session && !waveHasLoggedAttempts(wave, session.mode)) {
        updateSession(sessionId, (s) => ({
          ...s,
          waves: s.waves.filter((w) => w.id !== waveId),
        }))
      }
    },
    [trainingSessions, updateSession],
  )

  const closeActiveWave = useCallback(() => {
    if (!activeSessionId) return
    discardEmptyOpenWave(activeSessionId, activeWaveId)
    setActiveWaveId(null)
  }, [activeSessionId, activeWaveId, discardEmptyOpenWave])

  const selectAthlete = useCallback(
    (athleteId: string) => {
      if (!activeSessionId) return

      const session = trainingSessions.find((s) => s.id === activeSessionId)
      const openWave = activeWaveId ? session?.waves.find((w) => w.id === activeWaveId) : undefined
      if (openWave && session && waveHasLoggedAttempts(openWave, session.mode)) return

      if (activeWaveId) {
        discardEmptyOpenWave(activeSessionId, activeWaveId)
        setActiveWaveId(null)
      }

      setActiveAthleteId(athleteId)
    },
    [activeSessionId, activeWaveId, discardEmptyOpenWave, trainingSessions],
  )

  const startOpenWave = useCallback(() => {
    if (!activeSessionId || !activeAthleteId || activeWaveId) return

    const wave = createPotentialWave(activeAthleteId)
    updateSession(activeSessionId, (s) => ({ ...s, waves: [wave, ...s.waves] }))
    setActiveWaveId(wave.id)
  }, [activeAthleteId, activeSessionId, activeWaveId, updateSession])

  const registerNoPotentialWave = useCallback(() => {
    if (!activeSessionId || !activeAthleteId || !activeWaveId) return

    const session = trainingSessions.find((s) => s.id === activeSessionId)
    const wave = session?.waves.find((w) => w.id === activeWaveId)
    if (!wave || !session || waveHasLoggedAttempts(wave, session.mode)) return

    updateSession(activeSessionId, (s) => ({
      ...s,
      waves: s.waves.map((w) =>
        w.id === activeWaveId ? { ...w, hasPotential: false, multiManeuver: false } : w,
      ),
    }))
    setActiveWaveId(null)
  }, [activeAthleteId, activeSessionId, activeWaveId, trainingSessions, updateSession])

  const logTechnicalManeuver = useCallback(
    (kind: ManeuverKind, side: WaveSide, level: ManeuverLevel, success: boolean) => {
      if (!activeSessionId || !activeWaveId) return

      const entry = {
        id: crypto.randomUUID(),
        kind,
        side,
        level,
        success,
        at: new Date().toISOString(),
      }

      updateSession(activeSessionId, (s) => ({
        ...s,
        waves: s.waves.map((w) =>
          w.id === activeWaveId ? { ...w, maneuvers: [...w.maneuvers, entry] } : w,
        ),
      }))
    },
    [activeSessionId, activeWaveId, updateSession],
  )

  const logComboAttempt = useCallback(
    (level: ComboLevel, side: WaveSide, success: boolean) => {
      if (!activeSessionId || !activeWaveId) return

      const entry = {
        id: crypto.randomUUID(),
        level,
        side,
        success,
        at: new Date().toISOString(),
      }

      updateSession(activeSessionId, (s) => ({
        ...s,
        waves: s.waves.map((w) =>
          w.id === activeWaveId
            ? { ...w, comboAttempts: [...(w.comboAttempts ?? []), entry] }
            : w,
        ),
      }))
    },
    [activeSessionId, activeWaveId, updateSession],
  )

  const createChampionshipHeat = useCallback(
    (athleteIds: string[], durationMinutes: HeatDurationMinutes) => {
      if (!activeSessionId) return
      const session = trainingSessions.find((s) => s.id === activeSessionId)
      if (!session || session.mode !== 'campeonato') return

      const heat = buildHeatRecord(
        athleteIds,
        durationMinutes,
        `Heat ${session.heats.length + 1}`,
      )
      updateSession(activeSessionId, (s) => ({ ...s, heats: [...s.heats, heat] }))
      setActiveHeatId(heat.id)
    },
    [activeSessionId, trainingSessions, updateSession],
  )

  const startHeatTimer = useCallback(
    (heatId: string) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        heats: s.heats.map((h) =>
          h.id === heatId && !h.timerStartedAt && !h.endedAt
            ? { ...h, timerStartedAt: new Date().toISOString() }
            : h,
        ),
      }))
    },
    [activeSessionId, updateSession],
  )

  const endHeat = useCallback(
    (heatId: string) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        heats: s.heats.map((h) =>
          h.id === heatId && !h.endedAt ? { ...h, endedAt: new Date().toISOString() } : h,
        ),
      }))
    },
    [activeSessionId, updateSession],
  )

  const logHeatWaveScore = useCallback(
    (heatId: string, athleteId: string, score: number) => {
      if (!activeSessionId) return
      const session = trainingSessions.find((s) => s.id === activeSessionId)
      const heat = session?.heats.find((h) => h.id === heatId)
      if (!heat || heat.endedAt || !heat.athleteIds.includes(athleteId)) return
      if (!heat.timerStartedAt) return

      const entry = {
        id: crypto.randomUUID(),
        athleteId,
        score: clampHeatScore(score),
        at: new Date().toISOString(),
      }

      updateSession(activeSessionId, (s) => ({
        ...s,
        heats: s.heats.map((h) =>
          h.id === heatId ? { ...h, waveScores: [...h.waveScores, entry] } : h,
        ),
      }))
    },
    [activeSessionId, trainingSessions, updateSession],
  )

  const setHeatInterference = useCallback(
    (heatId: string, athleteId: string, type: HeatInterferenceType | null) => {
      if (!activeSessionId) return
      const session = trainingSessions.find((s) => s.id === activeSessionId)
      const heat = session?.heats.find((h) => h.id === heatId)
      if (!heat || !heat.athleteIds.includes(athleteId)) return
      if (!heat.timerStartedAt) return

      updateSession(activeSessionId, (s) => ({
        ...s,
        heats: s.heats.map((h) => {
          if (h.id !== heatId) return h
          const rest = (h.interferences ?? []).filter((i) => i.athleteId !== athleteId)
          const interferences = type
            ? [
                ...rest,
                {
                  id: crypto.randomUUID(),
                  athleteId,
                  type,
                  at: new Date().toISOString(),
                },
              ]
            : rest
          return { ...h, interferences }
        }),
      }))
    },
    [activeSessionId, trainingSessions, updateSession],
  )

  const startSeaAnalysisTimer = useCallback(() => {
    if (!activeSessionId) return
    updateSession(activeSessionId, (s) => {
      if (s.mode !== 'sea-analysis' || !s.seaAnalysis) return s
      if (s.seaAnalysis.timerStartedAt) return s
      return {
        ...s,
        seaAnalysis: {
          ...s.seaAnalysis,
          timerStartedAt: new Date().toISOString(),
        },
      }
    })
  }, [activeSessionId, updateSession])

  const endSeaAnalysisTimer = useCallback(() => {
    if (!activeSessionId) return
    updateSession(activeSessionId, (s) => {
      if (!s.seaAnalysis || s.seaAnalysis.endedAt) return s
      return {
        ...s,
        seaAnalysis: {
          ...s.seaAnalysis,
          endedAt: new Date().toISOString(),
        },
      }
    })
  }, [activeSessionId, updateSession])

  const logSeaObservation = useCallback(
    (peak: SeaPeak, waveType: SeaWaveType) => {
      if (!activeSessionId) return
      const session = trainingSessions.find((s) => s.id === activeSessionId)
      const sea = session?.seaAnalysis
      if (!sea || !sea.timerStartedAt || sea.endedAt) return

      const entry = {
        id: crypto.randomUUID(),
        peak,
        waveType,
        at: new Date().toISOString(),
      }

      updateSession(activeSessionId, (s) => {
        if (!s.seaAnalysis) return s
        return {
          ...s,
          seaAnalysis: {
            ...s.seaAnalysis,
            logs: [...s.seaAnalysis.logs, entry],
          },
        }
      })
    },
    [activeSessionId, trainingSessions, updateSession],
  )

  const updateSeaAnalysisLog = useCallback(
    (logId: string, peak: SeaPeak, waveType: SeaWaveType) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => {
        if (!s.seaAnalysis) return s
        return {
          ...s,
          seaAnalysis: {
            ...s.seaAnalysis,
            logs: s.seaAnalysis.logs.map((log) =>
              log.id === logId ? { ...log, peak, waveType } : log,
            ),
          },
        }
      })
    },
    [activeSessionId, updateSession],
  )

  const deleteSeaAnalysisLog = useCallback(
    (logId: string) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => {
        if (!s.seaAnalysis) return s
        return {
          ...s,
          seaAnalysis: {
            ...s.seaAnalysis,
            logs: s.seaAnalysis.logs.filter((log) => log.id !== logId),
          },
        }
      })
    },
    [activeSessionId, updateSession],
  )

  const updateManeuverLog = useCallback(
    (
      waveId: string,
      logId: string,
      patch: Pick<ManeuverLog, 'kind' | 'side' | 'level' | 'success'>,
    ) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        waves: s.waves.map((w) =>
          w.id === waveId
            ? {
                ...w,
                maneuvers: w.maneuvers.map((m) => (m.id === logId ? { ...m, ...patch } : m)),
              }
            : w,
        ),
      }))
    },
    [activeSessionId, updateSession],
  )

  const deleteManeuverLog = useCallback(
    (waveId: string, logId: string) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        waves: s.waves.map((w) =>
          w.id === waveId ? { ...w, maneuvers: w.maneuvers.filter((m) => m.id !== logId) } : w,
        ),
      }))
    },
    [activeSessionId, updateSession],
  )

  const updateComboAttempt = useCallback(
    (
      waveId: string,
      logId: string,
      patch: Pick<ComboAttemptLog, 'level' | 'side' | 'success'>,
    ) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        waves: s.waves.map((w) =>
          w.id === waveId
            ? {
                ...w,
                comboAttempts: (w.comboAttempts ?? []).map((c) =>
                  c.id === logId ? { ...c, ...patch } : c,
                ),
              }
            : w,
        ),
      }))
    },
    [activeSessionId, updateSession],
  )

  const deleteComboAttempt = useCallback(
    (waveId: string, logId: string) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        waves: s.waves.map((w) =>
          w.id === waveId
            ? { ...w, comboAttempts: (w.comboAttempts ?? []).filter((c) => c.id !== logId) }
            : w,
        ),
      }))
    },
    [activeSessionId, updateSession],
  )

  const deleteWaveRecord = useCallback(
    (waveId: string) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        waves: s.waves.filter((w) => w.id !== waveId),
      }))
      if (activeWaveId === waveId) setActiveWaveId(null)
    },
    [activeSessionId, activeWaveId, updateSession],
  )

  const updateHeatWaveScore = useCallback(
    (heatId: string, scoreId: string, score: number) => {
      if (!activeSessionId) return
      const next = clampHeatScore(score)
      updateSession(activeSessionId, (s) => ({
        ...s,
        heats: s.heats.map((h) =>
          h.id === heatId
            ? {
                ...h,
                waveScores: h.waveScores.map((w) =>
                  w.id === scoreId ? { ...w, score: next } : w,
                ),
              }
            : h,
        ),
      }))
    },
    [activeSessionId, updateSession],
  )

  const deleteHeatWaveScore = useCallback(
    (heatId: string, scoreId: string) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        heats: s.heats.map((h) =>
          h.id === heatId
            ? { ...h, waveScores: h.waveScores.filter((w) => w.id !== scoreId) }
            : h,
        ),
      }))
    },
    [activeSessionId, updateSession],
  )

  const value = useMemo(
    () => ({
      auth,
      authReady,
      cloudMode,
      publicView,
      selectedPlanId,
      subscription,
      hasActiveSubscription,
      selectPlan,
      openLanding,
      openCoachSignIn,
      openCoachSignUp,
      openAthleteSignIn,
      openAthleteSignUp,
      openForgotPassword,
      requestPasswordReset,
      startCheckout,
      activateDemoSubscription,
      refreshSubscription,
      completeCheckout,
      loginAsCoach,
      loginAsStudent,
      registerCoach,
      registerAthlete,
      logout,
      role,
      view,
      setView: navigateView,
      coachAthletes,
      coachLinks,
      athleteLinks,
      spots,
      conditions,
      requestPairingByCode,
      respondToPairing,
      revokePairing,
      updateAthleteShareSettings,
      setAthleteBlocked,
      activeCoachAthletes,
      changePassword,
      refreshPairingData,
      addSpot,
      addCondition,
      updateSpotName,
      removeSpot,
      updateConditionName,
      removeCondition,
      getAthlete,
      getSpot,
      draft,
      setDraftMode,
      setDraftSpot,
      setDraftCondition,
      setDraftHeatDuration,
      addDraftAthlete,
      removeDraftAthlete,
      resetDraft,
      activeSessionId,
      activeSession,
      trainingSessions,
      beginDraftSession,
      confirmAthletesAndStart,
      endSessionSheetOpen,
      openEndSessionSheet,
      closeEndSessionSheet,
      confirmEndSession,
      cancelActiveSession,
      completedCoachSessions,
      historySessionId,
      historySession,
      openHistorySession,
      closeHistorySession,
      activeAthleteId,
      setActiveAthleteId,
      activeWaveId,
      selectAthlete,
      startOpenWave,
      registerNoPotentialWave,
      logTechnicalManeuver,
      closeActiveWave,
      logComboAttempt,
      activeHeatId,
      setActiveHeatId,
      createChampionshipHeat,
      startHeatTimer,
      endHeat,
      logHeatWaveScore,
      setHeatInterference,
      startSeaAnalysisTimer,
      endSeaAnalysisTimer,
      logSeaObservation,
      updateSeaAnalysisLog,
      deleteSeaAnalysisLog,
      updateManeuverLog,
      deleteManeuverLog,
      updateComboAttempt,
      deleteComboAttempt,
      deleteWaveRecord,
      updateHeatWaveScore,
      deleteHeatWaveScore,
    }),
    [
      auth,
      authReady,
      cloudMode,
      publicView,
      selectedPlanId,
      subscription,
      hasActiveSubscription,
      selectPlan,
      openLanding,
      openCoachSignIn,
      openCoachSignUp,
      openAthleteSignIn,
      openAthleteSignUp,
      openForgotPassword,
      requestPasswordReset,
      startCheckout,
      activateDemoSubscription,
      refreshSubscription,
      completeCheckout,
      loginAsCoach,
      loginAsStudent,
      registerCoach,
      registerAthlete,
      logout,
      role,
      view,
      navigateView,
      coachAthletes,
      coachLinks,
      athleteLinks,
      spots,
      conditions,
      requestPairingByCode,
      respondToPairing,
      revokePairing,
      updateAthleteShareSettings,
      setAthleteBlocked,
      activeCoachAthletes,
      changePassword,
      refreshPairingData,
      addSpot,
      addCondition,
      updateSpotName,
      removeSpot,
      updateConditionName,
      removeCondition,
      getAthlete,
      getSpot,
      draft,
      setDraftMode,
      setDraftSpot,
      setDraftCondition,
      setDraftHeatDuration,
      addDraftAthlete,
      removeDraftAthlete,
      resetDraft,
      activeSessionId,
      activeSession,
      trainingSessions,
      beginDraftSession,
      confirmAthletesAndStart,
      endSessionSheetOpen,
      openEndSessionSheet,
      closeEndSessionSheet,
      confirmEndSession,
      cancelActiveSession,
      completedCoachSessions,
      historySessionId,
      historySession,
      openHistorySession,
      closeHistorySession,
      activeAthleteId,
      activeWaveId,
      selectAthlete,
      startOpenWave,
      registerNoPotentialWave,
      logTechnicalManeuver,
      closeActiveWave,
      logComboAttempt,
      activeHeatId,
      createChampionshipHeat,
      startHeatTimer,
      endHeat,
      logHeatWaveScore,
      setHeatInterference,
      startSeaAnalysisTimer,
      endSeaAnalysisTimer,
      logSeaObservation,
      updateSeaAnalysisLog,
      deleteSeaAnalysisLog,
      updateManeuverLog,
      deleteManeuverLog,
      updateComboAttempt,
      deleteComboAttempt,
      deleteWaveRecord,
      updateHeatWaveScore,
      deleteHeatWaveScore,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
