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
  cloudAddAthleteWithLogin,
  cloudChangePassword,
  cloudDeleteAthlete,
  cloudGetSession,
  cloudLoadAthleteData,
  cloudLoadCoachData,
  cloudLogin,
  cloudLogout,
  cloudOnAuthChange,
  cloudRegisterCoach,
  cloudSaveAthletes,
  cloudSaveConditions,
  cloudSaveSpots,
  cloudSaveTrainingSessions,
  cloudSetAthleteBlocked,
} from './cloudApi'
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
  SeaPeak,
  SeaWaveType,
  ManeuverKind,
  ManeuverLevel,
  ManeuverLog,
  ComboAttemptLog,
  CoachAccount,
  StudentAccount,
  SurfSpot,
  TrainingMode,
  TrainingSession,
  UserRole,
  WaveRecord,
  WaveSide,
} from './types'
import { DEFAULT_ATHLETE_SHARE_SETTINGS, normalizeAthleteShareSettings } from './types'
import { canDeleteAthlete as athleteCanBeDeleted } from './athleteManagementUtils'
import { clampHeatScore, MAX_HEAT_ATHLETES } from './heatUtils'

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
  loginAsCoach: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  loginAsStudent: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  registerCoach: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  logout: () => void
  role: UserRole
  view: AppView
  setView: (view: AppView) => void
  coachAthletes: Athlete[]
  coachStudents: StudentAccount[]
  spots: SurfSpot[]
  conditions: string[]
  addAthlete: (name: string) => void
  addAthleteWithLogin: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  updateAthleteShareSettings: (athleteId: string, shareSettings: AthleteShareSettings) => void
  setAthleteBlocked: (athleteId: string, blocked: boolean) => Promise<{ ok: boolean; error?: string }>
  deleteAthlete: (athleteId: string) => Promise<{ ok: boolean; error?: string }>
  canDeleteAthlete: (athleteId: string) => boolean
  activeCoachAthletes: Athlete[]
  changePassword: (newPassword: string) => Promise<{ ok: true } | { ok: false; error: string }>
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
  const [view, setView] = useState<AppView>('coach-home')
  const [athletes, setAthletes] = useState<Athlete[]>(() => (cloudMode ? [] : store.getAthletes()))
  const [students, setStudents] = useState<StudentAccount[]>(() =>
    cloudMode ? [] : store.getStudents(),
  )
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

  const coachId = auth?.role === 'treinador' ? auth.coachId : auth?.role === 'atleta' ? auth.coachId : null

  const coachAthletes = useMemo(
    () => (coachId ? athletes.filter((a) => a.coachId === coachId) : []),
    [athletes, coachId],
  )

  const coachStudents = useMemo(
    () => (coachId ? students.filter((s) => s.coachId === coachId) : []),
    [students, coachId],
  )

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
      setStudents(data.students)
      setSpots(data.spots)
      setConditions(data.conditions)
      setTrainingSessions(data.trainingSessions)
      setDraft((d) => ({ ...d, spotId: data.spots[0]?.id ?? d.spotId }))
      return
    }

    const data = await cloudLoadAthleteData(session.coachId, session.athleteId)
    setAthletes(data.athlete ? [data.athlete] : [])
    setSpots(data.spots)
    setTrainingSessions(data.trainingSessions)
  }, [])

  useEffect(() => {
    if (!cloudMode) return

    let mounted = true
    let unsub: (() => void) | undefined

    const applySessionData = async (session: AuthSession) => {
      if (!mounted) return
      await applyCloudSessionData(session)
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
            setSpots([])
            setConditions([])
            setTrainingSessions([])
            setActiveSessionId(null)
            setActiveWaveId(null)
            setActiveHeatId(null)
            setActiveAthleteId(null)
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
  }, [cloudMode, applyCloudSessionData])

  const loginAsCoach = useCallback(
    async (email: string, password: string) => {
      if (cloudMode) {
        const result = await cloudLogin(email, password)
        if (!result.ok) return result
        setAuth(result.session)
        setView('coach-home')
        void applyCloudSessionData(result.session).catch((err) => {
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
    return { ok: true }
  },
    [applyCloudSessionData, cloudMode],
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
    const session: AuthSession = {
      role: 'atleta',
      coachId: current.coachId,
      athleteId: current.athleteId,
      name: current.name,
      email: current.email,
      mustChangePassword: current.mustChangePassword ?? false,
    }
    authStore.setSession(session)
    setAuth(session)
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
        void applyCloudSessionData(result.session).catch((err) => {
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
      return { ok: true as const }
    },
    [applyCloudSessionData, cloudMode],
  )

  const logout = useCallback(async () => {
    if (cloudMode) await cloudLogout()
    else authStore.setSession(null)
    setAuth(null)
    setActiveSessionId(null)
    setActiveWaveId(null)
    setActiveHeatId(null)
    setActiveAthleteId(null)
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

  const addAthlete = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || auth?.role !== 'treinador') return
      const next = [
        ...athletes,
        { id: crypto.randomUUID(), coachId: auth.coachId, name: trimmed },
      ]
      setAthletes(next)
      store.saveAthletes(next)
    },
    [athletes, auth],
  )

  const addAthleteWithLogin = useCallback(
    async (name: string, email: string, password: string) => {
      if (auth?.role !== 'treinador') {
        return { ok: false as const, error: 'Sign in as coach first.' }
      }

      if (cloudMode) {
        const result = await cloudAddAthleteWithLogin(auth.coachId, name, email, password)
        if (!result.ok) return result
        setAthletes(result.athletes)
        setStudents(result.students)
        return { ok: true as const }
      }

      const trimmedName = name.trim()
      const normalized = normalizeEmail(email)
      if (!trimmedName) return { ok: false as const, error: 'Enter athlete name.' }
      if (!isValidEmail(normalized)) return { ok: false as const, error: 'Enter a valid email.' }
      const pwdError = validatePasswordStrength(password)
      if (pwdError) return { ok: false as const, error: pwdError }
      if (students.some((s) => s.email === normalized)) {
        return { ok: false as const, error: 'This email is already used.' }
      }

      const athleteId = crypto.randomUUID()
      const passwordHash = await hashPassword(password)
      const athlete: Athlete = {
        id: athleteId,
        coachId: auth.coachId,
        name: trimmedName,
        shareSettings: DEFAULT_ATHLETE_SHARE_SETTINGS,
        blocked: false,
      }
      const student: StudentAccount = {
        id: crypto.randomUUID(),
        coachId: auth.coachId,
        athleteId,
        name: trimmedName,
        email: normalized,
        passwordHash,
        mustChangePassword: true,
      }
      const nextAthletes = [...athletes, athlete]
      const nextStudents = [...students, student]
      setAthletes(nextAthletes)
      setStudents(nextStudents)
      store.saveAthletes(nextAthletes)
      store.saveStudents(nextStudents)
      return { ok: true as const }
    },
    [athletes, auth, cloudMode, students],
  )

  const updateAthleteShareSettings = useCallback(
    (athleteId: string, shareSettings: AthleteShareSettings) => {
      if (auth?.role !== 'treinador') return
      const next = athletes.map((a) =>
        a.id === athleteId ? { ...a, shareSettings: normalizeAthleteShareSettings(shareSettings) } : a,
      )
      setAthletes(next)
      if (cloudMode) {
        void cloudSaveAthletes(auth.coachId, next)
      } else {
        store.saveAthletes(next)
      }
    },
    [athletes, auth, cloudMode],
  )

  const setAthleteBlocked = useCallback(
    async (athleteId: string, blocked: boolean) => {
      if (auth?.role !== 'treinador') {
        return { ok: false, error: 'Sign in as coach first.' }
      }

      if (cloudMode) {
        const result = await cloudSetAthleteBlocked(auth.coachId, athleteId, blocked)
        if (!result.ok) return result
        setAthletes(result.athletes)
        return { ok: true }
      }

      const next = athletes.map((a) => (a.id === athleteId ? { ...a, blocked } : a))
      setAthletes(next)
      store.saveAthletes(next)
      return { ok: true }
    },
    [athletes, auth, cloudMode],
  )

  const deleteAthlete = useCallback(
    async (athleteId: string) => {
      if (auth?.role !== 'treinador') {
        return { ok: false, error: 'Sign in as coach first.' }
      }

      if (!athleteCanBeDeleted(athleteId, trainingSessions)) {
        return {
          ok: false,
          error:
            'This athlete has training sessions and cannot be deleted. Use Block instead.',
        }
      }

      if (cloudMode) {
        const result = await cloudDeleteAthlete(auth.coachId, athleteId)
        if (!result.ok) return result
        setAthletes(result.athletes)
        setStudents(result.students)
        return { ok: true }
      }

      const nextAthletes = athletes.filter((a) => a.id !== athleteId)
      const nextStudents = students.filter((s) => s.athleteId !== athleteId)
      setAthletes(nextAthletes)
      setStudents(nextStudents)
      store.saveAthletes(nextAthletes)
      store.saveStudents(nextStudents)
      return { ok: true }
    },
    [athletes, auth, cloudMode, students, trainingSessions],
  )

  const canDeleteAthleteById = useCallback(
    (athleteId: string) => athleteCanBeDeleted(athleteId, trainingSessions),
    [trainingSessions],
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
  }, [auth, draft, persistSessions, trainingSessions])

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
    [activeSessionId, resetDraft, updateSession],
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
      loginAsCoach,
      loginAsStudent,
      registerCoach,
      logout,
      role,
      view,
      setView,
      coachAthletes,
      coachStudents,
      spots,
      conditions,
      addAthlete,
      addAthleteWithLogin,
      updateAthleteShareSettings,
      setAthleteBlocked,
      deleteAthlete,
      canDeleteAthlete: canDeleteAthleteById,
      activeCoachAthletes,
      changePassword,
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
      loginAsCoach,
      loginAsStudent,
      registerCoach,
      logout,
      role,
      view,
      coachAthletes,
      coachStudents,
      spots,
      conditions,
      addAthlete,
      addAthleteWithLogin,
      updateAthleteShareSettings,
      setAthleteBlocked,
      deleteAthlete,
      canDeleteAthleteById,
      activeCoachAthletes,
      changePassword,
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
