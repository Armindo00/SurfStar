import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import {
  activateCoachSubscription,
  fetchCoachSubscription,
  isSubscriptionActive,
  type CoachSubscription,
} from './subscriptionApi'

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
  loginTab: UserRole
  selectedPlanId: PlanId | null
  subscription: CoachSubscription | null
  hasActiveSubscription: boolean
  selectPlan: (planId: PlanId, options?: { goToLogin?: boolean }) => void
  openLanding: () => void
  openCoachLogin: () => void
  openAthleteLogin: () => void
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
  const [authReady, setAuthReady] = useState(true)
  const [auth, setAuth] = useState<AuthSession | null>(() =>
    cloudMode ? null : authStore.getSession(),
  )
  const role: UserRole = auth?.role ?? 'treinador'
  const [publicView, setPublicView] = useState<PublicView>('landing')
  const [loginTab, setLoginTab] = useState<UserRole>('treinador')
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
        void cloudSaveTrainingSessions(session.coachId, next)
      }
    },
    [auth, cloudMode],
  )

  const applyCloudSessionData = useCallback(async (session: AuthSession) => {
    if (session.role === 'treinador') {
      const data = await cloudLoadCoachData(session.coachId)
      setAthletes(data.athletes)
      setCoachLinks(data.links)
      setAthleteLinks([])
      setSpots(data.spots)
      setConditions(data.conditions)
      setTrainingSessions(
        data.trainingSessions.map((session) => ({
          ...session,
          spotName:
            session.spotName?.trim() ||
            data.spots.find((spot) => spot.id === session.spotId)?.name?.trim() ||
            '',
        })),
      )
      setDraft((d) => ({ ...d, spotId: data.spots[0]?.id ?? d.spotId }))
      return
    }

    const data = await cloudLoadAthleteData(session.athleteId)
    setAthletes(data.athlete ? [data.athlete] : [])
    setAthleteLinks(data.links)
    setCoachLinks([])
    setTrainingSessions(data.trainingSessions)
    setSpots([])
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

  const selectPlan = useCallback((planId: PlanId, options?: { goToLogin?: boolean }) => {
    setSelectedPlanId(planId)
    setLoginTab('treinador')
    if (options?.goToLogin !== false) {
      setPublicView('login')
    }
  }, [])

  const openLanding = useCallback(() => {
    setPublicView('landing')
  }, [])

  const openCoachLogin = useCallback(() => {
    setLoginTab('treinador')
    setPublicView('login')
  }, [])

  const openAthleteLogin = useCallback(() => {
    setLoginTab('atleta')
    setSelectedPlanId(null)
    setPublicView('login')
  }, [])

  const completeCheckout = useCallback(async () => {
    if (!auth || auth.role !== 'treinador') {
      return { ok: false as const, error: 'Inicia sessão como treinador.' }
    }

    const planId = selectedPlanId ?? 'team'

    try {
      const sub = await activateCoachSubscription(auth.coachId, planId, cloudMode)
      setSubscription(sub)
      setView('coach-home')
      return { ok: true as const }
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : 'Não foi possível ativar a subscrição.',
      }
    }
  }, [auth, cloudMode, selectedPlanId])

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
        setTrainingSessions(data.trainingSessions)
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
    if (!cloudMode) return

    let mounted = true
    let unsub: (() => void) | undefined

    const applySessionData = async (session: AuthSession) => {
      if (!mounted) return
      await applyCloudSessionData(session)
      await syncCoachSubscription(session)
    }

    void (async () => {
      try {
        unsub = await cloudOnAuthChange((next, event) => {
          if (!mounted) return
          setAuth(next)
          if (next) {
            if (event === 'TOKEN_REFRESHED') return

            setTimeout(() => {
              void applySessionData(next).then(() => {
                if (!mounted) return
                if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                  setView(viewForAuth(next))
                }
              })
            }, 0)
          } else {
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
          void applySessionData(session).then(() => {
            if (mounted) {
              setView(viewForAuth(session))
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
  }, [cloudMode, applyCloudSessionData, syncCoachSubscription])

  const loginAsCoach = useCallback(
    async (email: string, password: string) => {
      if (cloudMode) {
        const result = await cloudLogin(email, password)
        if (!result.ok) return result
        setAuth(result.session)
        setView('coach-home')
        void applyCloudSessionData(result.session)
          .then(() => syncCoachSubscription(result.session))
          .catch((err) => {
          console.error('Failed to load coach data after sign in', err)
        })
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
    setView('coach-home')
    await syncCoachSubscription(session)
    return { ok: true }
  },
    [applyCloudSessionData, cloudMode, syncCoachSubscription],
  )

  const loginAsStudent = useCallback(
    async (email: string, password: string) => {
      if (cloudMode) {
        const result = await cloudLogin(email, password)
        if (!result.ok) return result
        setAuth(result.session)
        setView(viewForAuth(result.session))
        void applyCloudSessionData(result.session).catch((err) => {
          console.error('Failed to load athlete data after sign in', err)
        })
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
    setAthleteLinks(links)
    setTrainingSessions(
      loadAthleteSessionsLocal(current.athleteId, links, store.getTrainingSessions()),
    )
    setView(viewForAuth(session))
    return { ok: true }
  },
    [applyCloudSessionData, cloudMode],
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
  }, [cloudMode])

  const persistSessions = useCallback(
    (next: TrainingSession[]) => {
      setTrainingSessions(next)
      if (cloudMode) syncSessionsToCloud(next)
      else store.saveTrainingSessions(next)
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
      persistSessions(
        trainingSessions.map((s) => (s.id === sessionId ? updater(s) : s)),
      )
    },
    [persistSessions, trainingSessions],
  )

  const requestPairingByCode = useCallback(
    async (code: string) => {
      if (auth?.role !== 'treinador') {
        return { ok: false, error: 'Sign in as coach first.' }
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
    [auth, cloudMode, refreshPairingData],
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
        void cloudUpdateLinkShareSettings(linkId, normalized).then(() => refreshPairingData())
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
    [auth, cloudMode, refreshPairingData],
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
      if (auth?.role !== 'atleta') {
        return { ok: false as const, error: 'Sign in as athlete first.' }
      }

      const pwdError = validatePasswordStrength(newPassword)
      if (pwdError) return { ok: false as const, error: pwdError }

      if (cloudMode) {
        const result = await cloudChangePassword(newPassword)
        if (!result.ok) return result
        setAuth(result.session)
        authStore.setSession(result.session)
        setView('athlete-portal')
        return { ok: true as const }
      }

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
    },
    [auth, cloudMode],
  )

  const addSpot = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || auth?.role !== 'treinador') return
      const next = [...spots, { id: crypto.randomUUID(), name: trimmed }]
      setSpots(next)
      if (cloudMode) void cloudSaveSpots(auth.coachId, next)
      else store.saveSpots(next)
    },
    [auth, cloudMode, spots],
  )

  const addCondition = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || conditions.includes(trimmed) || auth?.role !== 'treinador') return
      const next = [...conditions, trimmed]
      setConditions(next)
      if (cloudMode) void cloudSaveConditions(auth.coachId, next)
      else store.saveConditions(next)
    },
    [auth, cloudMode, conditions],
  )

  const updateSpotName = useCallback(
    (spotId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed || auth?.role !== 'treinador') return
      const next = spots.map((s) => (s.id === spotId ? { ...s, name: trimmed } : s))
      setSpots(next)
      if (cloudMode) void cloudSaveSpots(auth.coachId, next)
      else store.saveSpots(next)
    },
    [auth, cloudMode, spots],
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
      if (cloudMode) void cloudSaveSpots(auth.coachId, next)
      else store.saveSpots(next)
      return true
    },
    [auth, cloudMode, spots],
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
      if (cloudMode) void cloudSaveConditions(auth.coachId, next)
      else store.saveConditions(next)
    },
    [auth, cloudMode, conditions],
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
      if (cloudMode) void cloudSaveConditions(auth.coachId, next)
      else store.saveConditions(next)
      return true
    },
    [auth, cloudMode, conditions],
  )

  const getAthlete = useCallback(
    (id: string) => {
      const athlete = athletes.find((a) => a.id === id)
      if (!athlete) return undefined
      return {
        ...athlete,
        shareSettings: normalizeAthleteShareSettings(athlete.shareSettings),
      }
    },
    [athletes],
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

  const beginDraftSession = useCallback(() => {
    setDraft(emptyDraft())
    setView('start-session')
  }, [])

  const confirmAthletesAndStart = useCallback(() => {
    if (!draft.spotId || !draft.condition) return
    if (draft.mode !== 'sea-analysis' && draft.athleteIds.length === 0) return
    if (auth?.role !== 'treinador') return

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
    persistSessions([session, ...trainingSessions])
    setActiveSessionId(session.id)
    setActiveAthleteId(draft.athleteIds[0] ?? null)
    setActiveWaveId(null)
    setActiveHeatId(initialHeat?.id ?? null)
    setView(viewForMode(draft.mode))
  }, [auth, draft, persistSessions, spots, trainingSessions])

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
    persistSessions(trainingSessions.filter((s) => s.id !== activeSessionId))
    setActiveWaveId(null)
    setActiveHeatId(null)
    setActiveSessionId(null)
    setActiveAthleteId(null)
    resetDraft()
    setView('coach-home')
  }, [activeSessionId, persistSessions, resetDraft, trainingSessions])

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
      loginTab,
      selectedPlanId,
      subscription,
      hasActiveSubscription,
      selectPlan,
      openLanding,
      openCoachLogin,
      openAthleteLogin,
      completeCheckout,
      loginAsCoach,
      loginAsStudent,
      registerCoach,
      registerAthlete,
      logout,
      role,
      view,
      setView,
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
      loginTab,
      selectedPlanId,
      subscription,
      hasActiveSubscription,
      selectPlan,
      openLanding,
      openCoachLogin,
      openAthleteLogin,
      completeCheckout,
      loginAsCoach,
      loginAsStudent,
      registerCoach,
      registerAthlete,
      logout,
      role,
      view,
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
