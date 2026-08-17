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
import { formatShortDate } from './dateFormat'
import { isCloudEnabled } from './config'
import type { BillingAddress } from './billingUtils'
import {
  cloudChangePassword,
  cloudGetSession,
  cloudLoadAthleteData,
  cloudLoadCoachData,
  cloudLogin,
  cloudLogout,
  cloudOnAuthChange,
  cloudRefreshAuthSession,
  cloudRegisterAthlete,
  cloudRegisterCoach,
  cloudResetPassword,
  cloudVerifyRecoveryOtp,
  cloudSaveConditions,
  cloudSaveCustomTemplates,
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
import { filterOrgCompletedSessions } from './sessionHistoryUtils'
import {
  countWaveCustomAttempts,
  createEmptyCustomTemplate,
  duplicateCustomTemplateRecord,
  snapshotCustomTemplate,
} from './customTrainingUtils'
import { resolveDraftSpotId, resolveDraftTemplateId, saveLastSpotId, loadLastSpotId } from './draftUtils'
import {
  loadSessionCache,
  mergeTrainingSessions,
  saveSessionCache,
} from './sessionCacheStore'
import {
  hashPassword,
  isValidEmail,
  normalizeEmail,
  validatePasswordStrength,
  verifyPassword,
} from './passwordUtils'
import {
  clearPasswordRecoveryPending,
  isPasswordRecoveryPending,
  isRecoveryHash,
  markPasswordRecoveryPending,
  navigateToResetPassword,
} from './passwordRecoveryUtils'
import { isResetPasswordPath } from './routing'
import type {
  ContactMessageKind,
  AppView,
  Athlete,
  AthleteBoard,
  AthleteFin,
  AthleteShareSettings,
  AuthSession,
  ChampionshipHeatSize,
  ComboLevel,
  EquipmentEvaluation,
  EquipmentType,
  HeatDurationMinutes,
  HeatInterferenceType,
  HeatRecord,
  PublicView,
  SeaPeak,
  SeaWaveType,
  SessionAthleteFeedback,
  ManeuverKind,
  ManeuverLevel,
  ManeuverLog,
  ComboAttemptLog,
  CustomAttemptLog,
  CustomTrainingTemplate,
  CoachAccount,
  OrganizationMember,
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
import type { AthletePortalSheet } from './views/athlete-portal/types'
import { coachIdsWithPsychologyCheckins, linkHasPsychologyCheckins } from './psychologyCheckins'
import {
  backfillLocalLinks,
  buildCoachAthletesFromLinks,
  findAthleteByPairingCode,
  generatePairingCode,
  loadAthleteSessionsLocal,
  migrateLegacyLocalAthletes,
} from './localPairing'
import {
  canEndHeatBasedSession,
  clampHeatScore,
  MAX_HEAT_ATHLETES,
  pendingHeatEndLabels,
} from './heatUtils'
import { buildInitialChampionshipHeats, isValidChampionshipField, processChampionshipRoundAdvance } from './championshipUtils'
import type { BillingInterval, PlanId } from './plans'
import {
  getPlan,
  getStripePaymentLink,
  isApprovalRequiredPlan,
  isStripeConfigured,
  usesManualPaymentFlow,
} from './plans'
import { submitOrganizationPlanRequest } from './organizationPlanRequestApi'
import {
  canAccessTeamAnalytics,
  canAddAthlete,
  canAddCoach,
  canUseCustomTraining,
  canUsePsychologyCheckins,
  canUseTrainingMode,
  getAllowedModes,
  planUpgradeHint,
  resolveCoachPlanId,
} from './planUtils'
import {
  activateCoachSubscription,
  buildStripeCheckoutUrl,
  cancelLocalSubscription,
  changeLocalSubscriptionPlan,
  cloudCancelSubscription,
  cloudCancelManualSubscription,
  cloudChangeSubscriptionPlan,
  cloudChangeSubscriptionPlanDirect,
  fetchCoachSubscription,
  isSubscriptionActive,
  startCoachCheckout,
  type CoachSubscription,
} from './subscriptionApi'
import { useToast } from './components/ToastProvider'
import {
  navigateToLandingPricing,
  navigateToPlanDetail,
  navigateToPublicView,
  planIdFromPath,
  publicViewFromPath,
  scrollToPricingSection,
} from './routing'
import {
  buildLocalCoachAuthSession,
  cloudInviteOrganizationCoach,
  cloudListOrganizationMembers,
  cloudRemoveOrganizationMember,
  cloudUpdateOrganizationName,
  loadLocalCoachData,
  localEnsureCoachOrganization,
  localInviteOrganizationCoach,
  localListOrganizationMembers,
  localRemoveOrganizationMember,
  localUpdateOrganizationName,
} from './organizationApi'
import {
  cloudSubmitContactMessage,
  localSubmitContactMessage,
} from './contactApi'
import {
  cloudDeleteAthleteBoard,
  cloudDeleteAthleteFin,
  cloudLoadAthleteEquipmentBundle,
  cloudSaveEquipmentEvaluation,
  cloudSubmitSessionFeedback,
  cloudUpsertAthleteBoard,
  cloudUpsertAthleteFin,
} from './athleteEquipmentApi'
import { equipmentStore } from './equipmentStore'
import {
  ACTIVE_SESSION_FLOW_VIEWS,
  clearResumeState,
  loadResumeState,
  resumeUserKey,
  saveResumeState,
  validateAndNormalizeResume,
} from './resumeStore'
import { countUnseen, markSeenIds } from './seenStore'

function mergeSessionFeedback(
  serverRows: SessionAthleteFeedback[],
  localRows: SessionAthleteFeedback[],
): SessionAthleteFeedback[] {
  const byKey = new Map<string, SessionAthleteFeedback>()
  const keyFor = (row: SessionAthleteFeedback) => `${row.sessionId}:${row.athleteId}`
  for (const row of serverRows) byKey.set(keyFor(row), row)
  for (const row of localRows) {
    const key = keyFor(row)
    const existing = byKey.get(key)
    if (!existing || row.submittedAt >= existing.submittedAt) {
      byKey.set(key, row)
    }
  }
  return [...byKey.values()].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
}

type DraftSession = {
  mode: TrainingMode
  spotId: string
  condition: string
  athleteIds: string[]
  heatDurationMinutes: HeatDurationMinutes
  customTemplateId: string
  championshipHeatSize: ChampionshipHeatSize
  championshipParallelHeats: boolean
}

type AppContextValue = {
  auth: AuthSession | null
  authReady: boolean
  cloudMode: boolean
  publicView: PublicView
  planDetailPlanId: PlanId | null
  selectedPlanId: PlanId | null
  selectedBillingInterval: BillingInterval
  setBillingInterval: (interval: BillingInterval) => void
  subscription: CoachSubscription | null
  coachPlanId: PlanId
  hasActiveSubscription: boolean
  selectPlan: (planId: PlanId, options?: { goToLogin?: boolean }) => void
  openLanding: () => void
  openPrivacy: () => void
  openTerms: () => void
  openContact: () => void
  openCoachSignIn: () => void
  openCoachPlanSelection: () => void
  openPlanDetail: (planId: PlanId) => void
  openCoachSignUp: () => void
  openAthleteSignIn: () => void
  openAthleteSignUp: () => void
  openTeamAcademyRequest: () => void
  openForgotPassword: (role?: UserRole) => void
  forgotPasswordRole: UserRole
  requestPasswordReset: (email: string) => Promise<{ ok: true } | { ok: false; error: string }>
  verifyPasswordResetCode: (
    email: string,
    code: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  passwordRecoveryPending: boolean
  completePasswordRecovery: (
    newPassword: string,
  ) => Promise<{ ok: true; role: UserRole } | { ok: false; error: string }>
  startCheckout: () => Promise<{ ok: true } | { ok: false; error: string }>
  activateDemoSubscription: () => Promise<{ ok: true } | { ok: false; error: string }>
  refreshSubscription: () => Promise<void>
  changeSubscriptionPlan: (planId: PlanId) => Promise<{ ok: true } | { ok: false; error: string }>
  cancelSubscription: () => Promise<{ ok: true } | { ok: false; error: string }>
  completeCheckout: () => Promise<{ ok: true } | { ok: false; error: string }>
  loginAsCoach: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  loginAsStudent: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  registerCoach: (
    name: string,
    email: string,
    password: string,
    billing?: { taxId: string; billingAddress: BillingAddress },
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
  athleteMenuOpen: boolean
  setAthleteMenuOpen: (open: boolean) => void
  athleteMenuBadge: number
  setAthleteMenuBadge: (count: number) => void
  athletePortalSheet: AthletePortalSheet | null
  setAthletePortalSheet: (sheet: AthletePortalSheet | null) => void
  coachAthletes: Athlete[]
  coachLinks: CoachAthleteLink[]
  athleteLinks: CoachAthleteLink[]
  spots: SurfSpot[]
  conditions: string[]
  customTemplates: CustomTrainingTemplate[]
  saveCustomTemplate: (template: CustomTrainingTemplate) => void
  deleteCustomTemplate: (templateId: string) => void
  duplicateCustomTemplate: (templateId: string) => void
  requestPairingByCode: (code: string) => Promise<{ ok: boolean; error?: string; athleteName?: string }>
  respondToPairing: (linkId: string, accept: boolean) => Promise<{ ok: boolean; error?: string }>
  revokePairing: (linkId: string) => Promise<{ ok: boolean; error?: string }>
  updateAthleteShareSettings: (linkId: string, shareSettings: AthleteShareSettings) => void
  setAthleteBlocked: (linkId: string, blocked: boolean) => Promise<{ ok: boolean; error?: string }>
  activeCoachAthletes: Athlete[]
  changePassword: (newPassword: string) => Promise<{ ok: true } | { ok: false; error: string }>
  refreshPairingData: () => Promise<void>
  organizationMembers: OrganizationMember[]
  refreshOrganizationMembers: () => Promise<void>
  inviteOrganizationCoach: (email: string) => Promise<{ ok: boolean; error?: string }>
  removeOrganizationMember: (memberId: string) => Promise<{ ok: boolean; error?: string }>
  updateOrganizationName: (name: string) => Promise<{ ok: boolean; error?: string; name?: string }>
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
  setDraftCustomTemplate: (templateId: string) => void
  setDraftSpot: (spotId: string) => void
  setDraftCondition: (condition: string) => void
  setDraftHeatDuration: (minutes: HeatDurationMinutes) => void
  setDraftChampionshipHeatSize: (size: ChampionshipHeatSize) => void
  setDraftChampionshipParallelHeats: (parallel: boolean) => void
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
  leaveSessionConfirmOpen: boolean
  closeLeaveSessionConfirm: () => void
  confirmLeaveActiveSession: () => void
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
  requestNoPotentialWave: () => void
  logTechnicalManeuver: (
    kind: ManeuverKind,
    side: WaveSide,
    level: ManeuverLevel,
    success: boolean,
  ) => void
  closeActiveWave: () => void
  requestCloseActiveWave: () => void
  waveConfirmAction: 'close' | 'no-potential' | null
  closeWaveConfirmOpen: boolean
  closeCloseWaveConfirm: () => void
  confirmCloseActiveWave: () => void
  trainingAthleteGridEpoch: number
  logComboAttempt: (level: ComboLevel, side: WaveSide, success: boolean) => void
  logCustomAttempt: (buttonId: string, levelId: string | null, success: boolean | null) => void
  startCustomTimer: () => void
  endCustomTimer: () => void
  activeHeatId: string | null
  setActiveHeatId: (id: string | null) => void
  createChampionshipHeat: (athleteIds: string[], durationMinutes: HeatDurationMinutes) => void
  startHeatTimer: (heatId: string) => void
  startHeatTimers: (heatIds: string[]) => void
  endHeat: (heatId: string) => void
  endHeatTimers: (heatIds: string[]) => void
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
  updateCustomAttempt: (
    waveId: string,
    logId: string,
    patch: Pick<CustomAttemptLog, 'levelId' | 'success'>,
  ) => void
  deleteCustomAttempt: (waveId: string, logId: string) => void
  deleteWaveRecord: (waveId: string) => void
  updateHeatWaveScore: (heatId: string, scoreId: string, score: number) => void
  deleteHeatWaveScore: (heatId: string, scoreId: string) => void
  athleteBoards: AthleteBoard[]
  athleteFins: AthleteFin[]
  equipmentEvaluations: EquipmentEvaluation[]
  sessionAthleteFeedback: SessionAthleteFeedback[]
  insightsAthlete: Athlete | null
  pendingSessionFeedback: TrainingSession[]
  refreshAthleteEquipment: (athleteId: string) => Promise<void>
  openCoachAthleteInsights: (athleteId: string) => Promise<void>
  saveAthleteBoard: (input: {
    id?: string
    name: string
    lengthFeet: number | null
    lengthInches: number | null
    widthInches: number | null
    thicknessInches: number | null
    volumeLiters: number | null
    notes: string | null
  }) => Promise<{ ok: true } | { ok: false; error: string }>
  deleteAthleteBoard: (boardId: string) => Promise<void>
  saveAthleteFin: (input: {
    id?: string
    name: string
    size: string | null
    template: string | null
    notes: string | null
  }) => Promise<{ ok: true } | { ok: false; error: string }>
  deleteAthleteFin: (finId: string) => Promise<void>
  saveEquipmentEvaluation: (input: {
    athleteId: string
    equipmentType: EquipmentType
    equipmentId: string
    speed: number
    control: number
    release: number
    notes: string | null
  }) => Promise<{ ok: true } | { ok: false; error: string }>
  submitSessionFeedback: (input: {
    sessionId: string
    coachId: string
    psychologyScores: import('./psychologySurvey').PsychologySurveyScores
    writtenNote: string | null
  }) => Promise<{ ok: true } | { ok: false; error: string }>
  skipSessionFeedback: (sessionId: string) => void
  openSessionFeedback: (sessionId: string) => void
  clearPrioritySessionFeedback: () => void
  priorityFeedbackSessionId: string | null
  markSeen: (domain: string, itemIds: string[]) => void
  countUnseen: (domain: string, items: { id: string }[]) => number
  submitContactMessage: (input: {
    kind: ContactMessageKind
    name: string
    email: string
    subject: string
    message: string
  }) => Promise<{ ok: true } | { ok: false; error: string }>
}

const AppContext = createContext<AppContextValue | null>(null)

const emptyDraft = (
  spots: SurfSpot[] = [],
  customTemplates: CustomTrainingTemplate[] = [],
): DraftSession => ({
  mode: 'tecnico',
  spotId: spots[0]?.id ?? '',
  condition: '',
  athleteIds: [],
  heatDurationMinutes: 15,
  customTemplateId: customTemplates[0]?.id ?? '',
  championshipHeatSize: 4,
  championshipParallelHeats: true,
})

function viewForAuth(session: AuthSession): AppView {
  return session.role === 'atleta' ? 'athlete-portal' : 'coach-home'
}

function mergePlatformAdminFlag(
  previous: AuthSession | null,
  next: AuthSession,
): AuthSession {
  if (
    previous?.role === 'treinador' &&
    previous.isPlatformAdmin &&
    next.role === 'treinador' &&
    !next.isPlatformAdmin
  ) {
    return { ...next, isPlatformAdmin: true }
  }
  return next
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
    case 'custom':
      return 'custom'
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
    customAttempts: [],
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
  const [authReady, setAuthReady] = useState(!cloudMode)
  const [auth, setAuth] = useState<AuthSession | null>(() =>
    cloudMode ? null : authStore.getSession(),
  )
  const role: UserRole = auth?.role ?? 'treinador'
  const [publicView, setPublicViewState] = useState<PublicView>(() => publicViewFromPath(window.location.pathname))
  const [planDetailPlanId, setPlanDetailPlanId] = useState<PlanId | null>(() =>
    planIdFromPath(window.location.pathname),
  )
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null)
  const [selectedBillingInterval, setSelectedBillingInterval] = useState<BillingInterval>('monthly')
  const [subscription, setSubscription] = useState<CoachSubscription | null>(null)
  const coachPlanId = useMemo((): PlanId => {
    const base = subscription?.planId ?? selectedPlanId ?? 'team'
    return resolveCoachPlanId(base, auth?.role === 'treinador' && Boolean(auth.isPlatformAdmin))
  }, [auth, selectedPlanId, subscription?.planId])
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMember[]>([])
  const [forgotPasswordRole, setForgotPasswordRole] = useState<UserRole>('treinador')
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(
    () =>
      isRecoveryHash() ||
      isPasswordRecoveryPending() ||
      isResetPasswordPath(window.location.pathname),
  )
  const passwordRecoveryPendingRef = useRef(passwordRecoveryPending)
  passwordRecoveryPendingRef.current = passwordRecoveryPending
  const [athleteBoards, setAthleteBoards] = useState<AthleteBoard[]>([])
  const [athleteFins, setAthleteFins] = useState<AthleteFin[]>([])
  const [equipmentEvaluations, setEquipmentEvaluations] = useState<EquipmentEvaluation[]>([])
  const [sessionAthleteFeedback, setSessionAthleteFeedback] = useState<SessionAthleteFeedback[]>([])
  const [insightsAthleteId, setInsightsAthleteId] = useState<string | null>(null)
  const [skippedFeedbackSessionIds, setSkippedFeedbackSessionIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('surfstar-skipped-feedback') ?? '[]') as string[]
    } catch {
      return []
    }
  })
  const [priorityFeedbackSessionId, setPriorityFeedbackSessionId] = useState<string | null>(null)
  const [seenRevision, setSeenRevision] = useState(0)
  const [view, setView] = useState<AppView>('coach-home')
  const [athleteMenuOpen, setAthleteMenuOpen] = useState(false)
  const [athleteMenuBadge, setAthleteMenuBadge] = useState(0)
  const [athletePortalSheet, setAthletePortalSheet] = useState<AthletePortalSheet | null>(null)
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
  const [customTemplates, setCustomTemplates] = useState<CustomTrainingTemplate[]>(() => {
    if (cloudMode) return []
    const list = store.getCustomTemplates()
    if (list.length === 0) {
      const seed = [createEmptyCustomTemplate()]
      store.saveCustomTemplates(seed)
      return seed
    }
    return list
  })
  const [draft, setDraft] = useState<DraftSession>(emptyDraft)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [activeAthleteId, setActiveAthleteId] = useState<string | null>(null)
  const [activeWaveId, setActiveWaveId] = useState<string | null>(null)
  const [activeHeatId, setActiveHeatId] = useState<string | null>(null)
  const [endSessionSheetOpen, setEndSessionSheetOpen] = useState(false)
  const [leaveSessionConfirmOpen, setLeaveSessionConfirmOpen] = useState(false)
  const [closeWaveConfirmOpen, setCloseWaveConfirmOpen] = useState(false)
  const [waveConfirmAction, setWaveConfirmAction] = useState<'close' | 'no-potential' | null>(null)
  const [trainingAthleteGridEpoch, setTrainingAthleteGridEpoch] = useState(0)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const trainingSessionsRef = useRef(trainingSessions)
  trainingSessionsRef.current = trainingSessions
  const [pendingLeaveView, setPendingLeaveView] = useState<AppView | null>(null)
  const [historySessionId, setHistorySessionId] = useState<string | null>(null)

  const skipResumeSaveRef = useRef(false)
  const manualSignInActiveRef = useRef(false)
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

  const applyResumeFromStore = useCallback((
    session: AuthSession,
    sessions: TrainingSession[],
    orgSpots: SurfSpot[] = spots,
    orgTemplates: CustomTrainingTemplate[] = customTemplates,
  ) => {
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

    const templates =
      orgTemplates.length > 0 ? orgTemplates : [createEmptyCustomTemplate()]
    const fallbackSpotId =
      session.role === 'treinador'
        ? loadLastSpotId(session.organizationId, orgSpots)
        : resolveDraftSpotId('', orgSpots)

    skipResumeSaveRef.current = true
    setView(restored.view)
    setActiveSessionId(restored.activeSessionId)
    setActiveAthleteId(restored.activeAthleteId)
    setActiveWaveId(restored.activeWaveId)
    setActiveHeatId(restored.activeHeatId)
    setHistorySessionId(restored.historySessionId)
    setDraft({
      ...restored.draft,
      championshipParallelHeats: restored.draft.championshipParallelHeats ?? true,
      spotId: resolveDraftSpotId(restored.draft.spotId || fallbackSpotId, orgSpots),
      customTemplateId: resolveDraftTemplateId(restored.draft.customTemplateId, templates),
    })
    queueMicrotask(() => {
      skipResumeSaveRef.current = false
    })
  }, [customTemplates, spots])

  const organizationId = auth?.role === 'treinador' ? auth.organizationId : null

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

  const saveToastTimerRef = useRef<number | null>(null)

  const syncSessionsToCloud = useCallback(
    (next: TrainingSession[], session: AuthSession | null = auth) => {
      if (cloudMode && session?.role === 'treinador') {
        void cloudSaveTrainingSessions(session.organizationId, session.coachId, next).then((result) => {
          if (!result.ok) {
            showToast(`Failed to save sessions: ${result.error}`, 'error')
            return
          }
          if (saveToastTimerRef.current) window.clearTimeout(saveToastTimerRef.current)
          saveToastTimerRef.current = window.setTimeout(() => {
            showToast('All changes saved', 'success')
            saveToastTimerRef.current = null
          }, 1200)
        })
      }
    },
    [auth, cloudMode, showToast],
  )

  const setPublicView = useCallback((next: PublicView) => {
    setPublicViewState(next)
    if (next !== 'plan-detail') {
      setPlanDetailPlanId(null)
      navigateToPublicView(next)
    }
  }, [])

  useEffect(() => {
    const onPopState = () => {
      const planId = planIdFromPath(window.location.pathname)
      if (planId) {
        setPlanDetailPlanId(planId)
        setPublicViewState('plan-detail')
        return
      }
      setPlanDetailPlanId(null)
      setPublicViewState(publicViewFromPath(window.location.pathname))
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const applyCloudSessionData = useCallback(async (
    session: AuthSession,
  ): Promise<{
    sessions: TrainingSession[]
    spots: SurfSpot[]
    customTemplates: CustomTrainingTemplate[]
  }> => {
    if (session.role === 'treinador') {
      const data = await cloudLoadCoachData(session.organizationId, session.coachId)
      const cloudSessions = data.trainingSessions.map((trainingSession) => ({
        ...trainingSession,
        spotName:
          trainingSession.spotName?.trim() ||
          data.spots.find((spot) => spot.id === trainingSession.spotId)?.name?.trim() ||
          '',
      }))
      const cachedSessions = loadSessionCache(session.organizationId)
      const sessions = mergeTrainingSessions(cloudSessions, cachedSessions)
      saveSessionCache(session.organizationId, sessions)
      setAthletes(data.athletes)
      setCoachLinks(data.links)
      setAthleteLinks([])
      setSpots(data.spots)
      setConditions(data.conditions)
      const templates =
        data.customTemplates.length > 0
          ? data.customTemplates
          : [createEmptyCustomTemplate()]
      setCustomTemplates(templates)
      setTrainingSessions(sessions)
      setDraft((d) => ({
        ...d,
        spotId: resolveDraftSpotId(
          d.spotId || loadLastSpotId(session.organizationId, data.spots),
          data.spots,
        ),
        customTemplateId: resolveDraftTemplateId(d.customTemplateId, templates),
      }))
      return { sessions, spots: data.spots, customTemplates: templates }
    }

    const data = await cloudLoadAthleteData(session.athleteId)
    const sessions = data.trainingSessions.filter((s) => Boolean(s.endedAt))
    setAthletes(data.athlete ? [data.athlete] : [])
    setAthleteLinks(data.links)
    setCoachLinks([])
    setTrainingSessions(sessions)
    setSpots([])
    return { sessions, spots: [], customTemplates: [] }
  }, [])

  const syncCoachSubscription = useCallback(
    async (session: AuthSession) => {
      if (session.role !== 'treinador') {
        setSubscription(null)
        return
      }
      const sub = await fetchCoachSubscription(session.coachId, cloudMode, session.organizationId)
      setSubscription(sub)
    },
    [cloudMode],
  )

  const loadCloudSessionAfterAuth = useCallback(
    async (session: AuthSession) => {
      try {
        const loaded = await applyCloudSessionData(session)
        if (session.role === 'treinador') {
          await syncCoachSubscription(session)
        }
        applyResumeFromStore(
          session,
          loaded.sessions,
          loaded.spots,
          loaded.customTemplates,
        )
        const refreshed = await cloudRefreshAuthSession()
        if (refreshed) {
          setAuth((prev) => mergePlatformAdminFlag(prev, refreshed))
        }
      } catch (err) {
        console.error('Failed to load session data after sign in', err)
      }
    },
    [applyCloudSessionData, applyResumeFromStore, syncCoachSubscription],
  )

  const refreshOrganizationMembers = useCallback(async () => {
    if (!auth || auth.role !== 'treinador') {
      setOrganizationMembers([])
      return
    }
    if (cloudMode) {
      const members = await cloudListOrganizationMembers()
      setOrganizationMembers(members)
      return
    }
    setOrganizationMembers(localListOrganizationMembers(auth.organizationId))
  }, [auth, cloudMode])

  const hasActiveSubscription = useMemo(() => {
    if (auth?.role !== 'treinador') return true
    if (auth.isPlatformAdmin) return true
    return isSubscriptionActive(subscription)
  }, [auth, subscription])

  const refreshSubscription = useCallback(async () => {
    if (!auth || auth.role !== 'treinador') return
    const sub = await fetchCoachSubscription(auth.coachId, cloudMode, auth.organizationId)
    setSubscription(sub)
    await refreshOrganizationMembers()
    if (isSubscriptionActive(sub)) {
      setView('coach-home')
    }
  }, [auth, cloudMode, refreshOrganizationMembers])

  const selectPlan = useCallback((planId: PlanId, options?: { goToLogin?: boolean }) => {
    if (isApprovalRequiredPlan(planId)) {
      setSelectedPlanId(planId)
      setPublicView('team-academy-request')
      return
    }
    setSelectedPlanId(planId)
    if (options?.goToLogin !== false) {
      setPublicView('coach-sign-up')
    }
  }, [setPublicView])

  const openLanding = useCallback(() => {
    setPlanDetailPlanId(null)
    setPublicView('landing')
  }, [setPublicView])

  const openPlanDetail = useCallback((planId: PlanId) => {
    setPlanDetailPlanId(planId)
    setPublicViewState('plan-detail')
    navigateToPlanDetail(planId)
  }, [])

  const openPrivacy = useCallback(() => {
    setPublicView('privacy')
  }, [setPublicView])

  const openTerms = useCallback(() => {
    setPublicView('terms')
  }, [setPublicView])

  const openContact = useCallback(() => {
    if (auth) {
      setView('contact')
      return
    }
    setPublicView('contact')
  }, [auth, setPublicView])

  const openCoachSignIn = useCallback(() => {
    setPublicView('coach-sign-in')
  }, [setPublicView])

  const openCoachPlanSelection = useCallback(() => {
    const onLanding = publicView === 'landing'
    setPublicViewState('landing')
    navigateToLandingPricing(!onLanding)
    if (onLanding) {
      requestAnimationFrame(() => scrollToPricingSection())
    }
  }, [publicView])

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

  const setBillingInterval = useCallback((interval: BillingInterval) => {
    setSelectedBillingInterval(interval)
  }, [])

  const openTeamAcademyRequest = useCallback(() => {
    setSelectedPlanId('organization')
    setPublicView('team-academy-request')
  }, [setPublicView])

  const activatePasswordRecovery = useCallback(() => {
    passwordRecoveryPendingRef.current = true
    setPasswordRecoveryPending(true)
    markPasswordRecoveryPending()
    navigateToResetPassword()
  }, [])

  const openForgotPassword = useCallback(
    (role: UserRole = 'treinador') => {
      setForgotPasswordRole(role)
      setPublicView('forgot-password')
    },
    [setPublicView],
  )

  const requestPasswordReset = useCallback(
    async (email: string) => {
      if (!cloudMode) {
        return { ok: false as const, error: 'Password reset is only available in cloud mode.' }
      }
      return cloudResetPassword(email)
    },
    [cloudMode],
  )

  const verifyPasswordResetCode = useCallback(
    async (email: string, code: string) => {
      if (!cloudMode) {
        return { ok: false as const, error: 'Password reset is only available in cloud mode.' }
      }

      const result = await cloudVerifyRecoveryOtp(email, code)
      if (!result.ok) return result

      activatePasswordRecovery()
      setAuth(result.session)
      return { ok: true as const }
    },
    [activatePasswordRecovery, cloudMode],
  )

  const completePasswordRecovery = useCallback(
    async (newPassword: string) => {
      if (!cloudMode) {
        return { ok: false as const, error: 'Password reset is only available in cloud mode.' }
      }

      const pwdError = validatePasswordStrength(newPassword)
      if (pwdError) return { ok: false as const, error: pwdError }

      const result = await cloudChangePassword(newPassword)
      if (!result.ok) return result

      const role = result.session.role
      passwordRecoveryPendingRef.current = false
      setPasswordRecoveryPending(false)
      clearPasswordRecoveryPending()

      if (auth) clearResumeState(resumeUserKey(auth))
      await cloudLogout()
      setAuth(null)
      setActiveSessionId(null)
      setActiveWaveId(null)
      setActiveHeatId(null)
      setActiveAthleteId(null)
      setSubscription(null)

      return { ok: true as const, role }
    },
    [auth, cloudMode],
  )

  const startCheckout = useCallback(async () => {
    if (!auth || auth.role !== 'treinador') {
        return { ok: false as const, error: 'Sign in as coach first.' }
    }
    if (usesManualPaymentFlow()) {
      return {
        ok: false as const,
        error: 'Manual billing is active. Submit a payment request and wait for admin approval.',
      }
    }
    const planId = selectedPlanId ?? subscription?.planId ?? 'team'
    if (isApprovalRequiredPlan(planId)) {
      return {
        ok: false as const,
        error: 'Team Academy requires approval. Submit a request and we will activate your plan manually.',
      }
    }
    const orgName =
      planId === 'organization' && auth.role === 'treinador'
        ? `${auth.name}'s Academy`
        : undefined
    try {
      const sub = await startCoachCheckout(auth.coachId, auth.organizationId, planId, cloudMode, orgName)
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
    if (cloudMode && usesManualPaymentFlow()) {
      return {
        ok: false as const,
        error: 'Your account must be approved by an administrator before you can access the app.',
      }
    }
    const planId = selectedPlanId ?? subscription?.planId ?? 'team'
    if (isApprovalRequiredPlan(planId)) {
      return {
        ok: false as const,
        error: 'Team Academy requires approval before activation.',
      }
    }
    const orgName =
      planId === 'organization' && auth.role === 'treinador'
        ? `${auth.name}'s Academy`
        : undefined
    try {
      const sub = await activateCoachSubscription(auth.coachId, auth.organizationId, planId, cloudMode, orgName)
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

  const changeSubscriptionPlan = useCallback(
    async (planId: PlanId) => {
      if (!auth || auth.role !== 'treinador') {
        return { ok: false as const, error: 'Sign in as coach first.' }
      }

      if (cloudMode && usesManualPaymentFlow()) {
        return {
          ok: false as const,
          error: 'Plan changes are handled manually. Contact support or use the admin panel.',
        }
      }

      if (isApprovalRequiredPlan(planId)) {
        return {
          ok: false as const,
          error: 'Team Academy is approval-only. Submit a request from the pricing page.',
        }
      }

      if (subscription?.planId === planId && isSubscriptionActive(subscription)) {
        return { ok: true as const }
      }

      if (!cloudMode) {
        const sub = changeLocalSubscriptionPlan(auth.organizationId, auth.coachId, planId)
        setSubscription(sub)
        setSelectedPlanId(planId)
        showToast(`Plan changed to ${getPlan(planId).name}.`, 'success')
        return { ok: true as const }
      }

      if (!isStripeConfigured()) {
        const direct = await cloudChangeSubscriptionPlanDirect(planId)
        if (!direct.ok) return direct
        await refreshSubscription()
        setSelectedPlanId(planId)
        showToast(`Plan changed to ${getPlan(planId).name}.`, 'success')
        return { ok: true as const }
      }

      const result = await cloudChangeSubscriptionPlan(planId)
      if (!result.ok) {
        if (!getStripePaymentLink(planId, selectedBillingInterval)) {
          const direct = await cloudChangeSubscriptionPlanDirect(planId)
          if (!direct.ok) return direct
          await refreshSubscription()
          setSelectedPlanId(planId)
          showToast(`Plan changed to ${getPlan(planId).name}.`, 'success')
          return { ok: true as const }
        }
        return result
      }

      if (result.unchanged) {
        return { ok: true as const }
      }

      if (result.portalUrl) {
        window.open(result.portalUrl, '_blank', 'noopener,noreferrer')
        if (result.message) showToast(result.message, 'info')
        return { ok: true as const }
      }

      if (result.requiresCheckout) {
        setSelectedPlanId(planId)
        try {
          const sub = await startCoachCheckout(auth.coachId, auth.organizationId, planId, cloudMode)
          setSubscription(sub)
        } catch (err) {
          return {
            ok: false as const,
            error: err instanceof Error ? err.message : 'Could not update plan.',
          }
        }

        const stripeLink = getStripePaymentLink(planId, selectedBillingInterval)
        if (stripeLink) {
          const url = buildStripeCheckoutUrl(
            stripeLink,
            auth.coachId,
            auth.email,
            planId,
            auth.organizationId,
            selectedBillingInterval,
          )
          window.open(url, '_blank', 'noopener,noreferrer')
          showToast('Complete payment to activate your new plan.', 'info')
          return { ok: true as const }
        }

        const demo = await activateCoachSubscription(auth.coachId, auth.organizationId, planId, cloudMode)
        setSubscription(demo)
        showToast(`Plan changed to ${getPlan(planId).name}.`, 'success')
        return { ok: true as const }
      }

      await refreshSubscription()
      showToast(`Plan changed to ${getPlan(planId).name}.`, 'success')
      return { ok: true as const }
    },
    [auth, cloudMode, refreshSubscription, selectedBillingInterval, showToast, subscription],
  )

  const cancelSubscription = useCallback(async () => {
    if (!auth || auth.role !== 'treinador') {
      return { ok: false as const, error: 'Sign in as coach first.' }
    }

    if (!cloudMode) {
      const sub = cancelLocalSubscription(auth.organizationId, auth.coachId)
      setSubscription(sub)
      showToast('Subscription canceled.', 'success')
      return { ok: true as const }
    }

    if (usesManualPaymentFlow()) {
      const result = await cloudCancelManualSubscription()
      if (!result.ok) return result

      await refreshSubscription()
      showToast(
        result.currentPeriodEnd
          ? `Subscription canceled. Access until ${formatShortDate(result.currentPeriodEnd)}.`
          : result.alreadyCanceled
            ? 'Subscription is already canceled.'
            : 'Subscription canceled.',
        'success',
      )
      return { ok: true as const }
    }

    const result = await cloudCancelSubscription()
    if (!result.ok) return result

    await refreshSubscription()
    showToast(
      result.currentPeriodEnd
        ? `Subscription canceled. Access until ${formatShortDate(result.currentPeriodEnd)}.`
        : 'Subscription canceled.',
      'success',
    )
    return { ok: true as const }
  }, [auth, cloudMode, refreshSubscription, showToast])

  const refreshAthleteEquipment = useCallback(
    async (athleteId: string) => {
      if (cloudMode) {
        try {
          const bundle = await cloudLoadAthleteEquipmentBundle(athleteId)
          setAthleteBoards(bundle.boards)
          setAthleteFins(bundle.fins)
          setEquipmentEvaluations(bundle.evaluations)
          setSessionAthleteFeedback((prev) => mergeSessionFeedback(bundle.sessionFeedback, prev))
        } catch (err) {
          console.error('Failed to load athlete equipment', err)
        }
        return
      }
      setAthleteBoards(equipmentStore.getBoards(athleteId))
      setAthleteFins(equipmentStore.getFins(athleteId))
      setEquipmentEvaluations(equipmentStore.getEvaluations(athleteId))
      setSessionAthleteFeedback((prev) =>
        mergeSessionFeedback(equipmentStore.getSessionFeedback(athleteId), prev),
      )
    },
    [cloudMode],
  )

  const refreshPairingData = useCallback(async () => {
    if (!auth) return
    if (cloudMode) {
      if (auth.role === 'treinador') {
        const [athletesNext, linksNext] = await Promise.all([
          cloudFetchCoachAthletes(auth.organizationId),
          cloudFetchCoachLinks(auth.organizationId),
        ])
        setAthletes(athletesNext)
        setCoachLinks(linksNext)
      } else {
        const data = await cloudLoadAthleteData(auth.athleteId)
        setAthletes(data.athlete ? [data.athlete] : [])
        setAthleteLinks(data.links)
        setTrainingSessions(data.trainingSessions.filter((s) => Boolean(s.endedAt)))
        await refreshAthleteEquipment(auth.athleteId)
      }
      return
    }

    if (auth.role === 'treinador') {
      const orgId = auth.organizationId
      setCoachLinks(store.getPairings().filter((l) => l.organizationId === orgId))
      setAthletes(buildCoachAthletesFromLinks(store.getPairings().filter((l) => l.organizationId === orgId), migrateLegacyLocalAthletes(store.getAthletes())))
    } else {
      const allLinks = store.getPairings().filter((l) => l.athleteId === auth.athleteId)
      setAthleteLinks(allLinks)
      const orgIds = new Set(allLinks.filter((l) => l.status === 'active').map((l) => l.organizationId).filter(Boolean) as string[])
      const sessions = orgIds.size
        ? orgIds.values().next().value
          ? store.getTrainingSessionsForOrg(orgIds.values().next().value as string)
          : []
        : []
      setTrainingSessions(loadAthleteSessionsLocal(auth.athleteId, allLinks, sessions))
      await refreshAthleteEquipment(auth.athleteId)
    }
  }, [auth, cloudMode, refreshAthleteEquipment])

  useEffect(() => {
    if (cloudMode || !auth || auth.role !== 'treinador') return
    void syncCoachSubscription(auth)
  }, [auth, cloudMode, syncCoachSubscription])

  useEffect(() => {
    if (!auth || skipResumeSaveRef.current) return
    saveResumeState(resumeUserKey(auth), resumeSnapshotRef.current)
    if (auth.role === 'treinador' && auth.organizationId) {
      saveSessionCache(auth.organizationId, trainingSessionsRef.current)
    }
  }, [
    auth,
    view,
    activeSessionId,
    activeAthleteId,
    activeWaveId,
    activeHeatId,
    draft,
    historySessionId,
    trainingSessions,
  ])

  useEffect(() => {
    const flushResume = () => {
      const session = authRef.current
      if (!session) return
      saveResumeState(resumeUserKey(session), resumeSnapshotRef.current)
      if (session.role === 'treinador' && session.organizationId) {
        saveSessionCache(session.organizationId, trainingSessionsRef.current)
      }
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
    if (auth.role === 'treinador') {
      const templates = store.getCustomTemplatesForOrg(auth.organizationId)
      applyResumeFromStore(
        auth,
        store.getTrainingSessionsForOrg(auth.organizationId),
        store.getSpotsForOrg(auth.organizationId),
        templates.length > 0 ? templates : [createEmptyCustomTemplate()],
      )
      return
    }
    applyResumeFromStore(auth, store.getTrainingSessions())
  }, [applyResumeFromStore, auth, cloudMode])

  useEffect(() => {
    if (auth?.role !== 'atleta') return
    if (view === 'coach-home') {
      setView('athlete-portal')
    }
  }, [auth, view])

  useEffect(() => {
    if (!cloudMode) return

    let mounted = true
    let unsub: (() => void) | undefined

    const applySessionData = async (session: AuthSession) => {
      if (!mounted) return
      const loaded = await applyCloudSessionData(session)
      await syncCoachSubscription(session)
      await refreshOrganizationMembers()
      return loaded
    }

    void (async () => {
      try {
        if (
          isRecoveryHash() ||
          isPasswordRecoveryPending() ||
          isResetPasswordPath(window.location.pathname)
        ) {
          activatePasswordRecovery()
        }

        unsub = await cloudOnAuthChange((next, event) => {
          if (!mounted) return
          const previous = authRef.current

          if (event === 'PASSWORD_RECOVERY') {
            activatePasswordRecovery()
          }

          setAuth((prev) => (next ? mergePlatformAdminFlag(prev, next) : null))
          if (next) {
            if (event === 'TOKEN_REFRESHED') return

            if (passwordRecoveryPendingRef.current || event === 'PASSWORD_RECOVERY') {
              return
            }

            if (event === 'SIGNED_IN' && manualSignInActiveRef.current) {
              return
            }

            setTimeout(() => {
              void applySessionData(next).then(async (loaded) => {
                if (!mounted || !loaded) return
                if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                  applyResumeFromStore(
                    next,
                    loaded.sessions,
                    loaded.spots,
                    loaded.customTemplates,
                  )
                }
                const refreshed = await cloudRefreshAuthSession()
                if (mounted && refreshed) {
                  setAuth((prev) => mergePlatformAdminFlag(prev, refreshed))
                }
              })
            }, 0)
          } else {
            if (!previous) return

            clearResumeState(resumeUserKey(previous))
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
          if (!passwordRecoveryPendingRef.current) {
            void applySessionData(session).then(async (loaded) => {
              if (mounted && loaded) {
                applyResumeFromStore(
                  session,
                  loaded.sessions,
                  loaded.spots,
                  loaded.customTemplates,
                )
              }
              const refreshed = await cloudRefreshAuthSession()
              if (mounted && refreshed) {
                setAuth((prev) => mergePlatformAdminFlag(prev, refreshed))
              }
            })
          }
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
  }, [
    activatePasswordRecovery,
    applyCloudSessionData,
    applyResumeFromStore,
    cloudMode,
    refreshOrganizationMembers,
    syncCoachSubscription,
  ])

  const loginAsCoach = useCallback(
    async (email: string, password: string) => {
      if (cloudMode) {
        manualSignInActiveRef.current = true
        try {
          const result = await cloudLogin(email, password)
          if (!result.ok) return result
          setAuth(result.session)
          setView(viewForAuth(result.session))
          void loadCloudSessionAfterAuth(result.session)
          return { ok: true as const }
        } finally {
          queueMicrotask(() => {
            manualSignInActiveRef.current = false
          })
        }
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
    const session = buildLocalCoachAuthSession(current)
    authStore.setSession(session)
    setAuth(session)
    const data = loadLocalCoachData(session.organizationId)
    setTrainingSessions(data.trainingSessions)
    setSpots(data.spots)
    setConditions(data.conditions)
    setCustomTemplates(data.customTemplates)
    setCoachLinks(data.links)
    setAthletes(data.athletes)
    applyResumeFromStore(
      session,
      data.trainingSessions,
      data.spots,
      data.customTemplates,
    )
    await syncCoachSubscription(session)
    await refreshOrganizationMembers()
    return { ok: true }
  },
    [loadCloudSessionAfterAuth, applyResumeFromStore, cloudMode, refreshOrganizationMembers, syncCoachSubscription],
  )

  const loginAsStudent = useCallback(
    async (email: string, password: string) => {
      if (cloudMode) {
        manualSignInActiveRef.current = true
        try {
          const result = await cloudLogin(email, password)
          if (!result.ok) return result
          setAuth(result.session)
          setView(viewForAuth(result.session))
          void loadCloudSessionAfterAuth(result.session)
          return { ok: true as const }
        } finally {
          queueMicrotask(() => {
            manualSignInActiveRef.current = false
          })
        }
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
    [loadCloudSessionAfterAuth, applyResumeFromStore, cloudMode],
  )

  const registerCoach = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      billing?: { taxId: string; billingAddress: BillingAddress },
    ) => {
      if (cloudMode) {
        const result = await cloudRegisterCoach(name, email, password, billing)
        if (!result.ok) return result
        setAuth(result.session)
        try {
          await applyCloudSessionData(result.session)
          await syncCoachSubscription(result.session)

          if (usesManualPaymentFlow() && result.session.role === 'treinador' && billing) {
            const planId = selectedPlanId ?? 'team'
            if (!isApprovalRequiredPlan(planId)) {
              await submitOrganizationPlanRequest(
                {
                  contactName: result.session.name,
                  email: result.session.email,
                  organizationName: result.session.organizationName || `${result.session.name}'s Team`,
                  planId,
                  billingInterval: selectedBillingInterval,
                  taxId: billing.taxId,
                  billingAddress: billing.billingAddress,
                  message: 'Payment request auto-submitted on coach registration.',
                },
                true,
              )
            }
          }
        } catch (err) {
          console.error('Failed to load coach data after registration', err)
        }
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
      const orgName =
        selectedPlanId === 'organization' ? `${trimmedName}'s Academy` : undefined
      const org = localEnsureCoachOrganization(coach.id, coach.name, orgName)
      store.saveCoaches(
        store.getCoaches().map((c) => (c.id === coach.id ? { ...c, organizationId: org.id } : c)),
      )
      const session = buildLocalCoachAuthSession({ ...coach, organizationId: org.id })
      authStore.setSession(session)
      setAuth(session)
      setView('coach-home')
      await syncCoachSubscription(session)
      await refreshOrganizationMembers()
      return { ok: true as const }
    },
    [
      applyCloudSessionData,
      cloudMode,
      refreshOrganizationMembers,
      selectedBillingInterval,
      selectedPlanId,
      syncCoachSubscription,
    ],
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
    passwordRecoveryPendingRef.current = false
    setPasswordRecoveryPending(false)
    clearPasswordRecoveryPending()
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
    setAthleteMenuOpen(false)
    setAthleteMenuBadge(0)
    setAthletePortalSheet(null)
  }, [auth, cloudMode, setPublicView])

  const persistSessions = useCallback(
    (nextOrUpdater: TrainingSession[] | ((prev: TrainingSession[]) => TrainingSession[])) => {
      setTrainingSessions((prev) => {
        const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater
        if (auth?.role === 'treinador' && auth.organizationId) {
          saveSessionCache(auth.organizationId, next)
        }
        if (cloudMode) syncSessionsToCloud(next)
        else if (auth?.role === 'treinador') store.saveTrainingSessionsForOrg(auth.organizationId, next)
        return next
      })
    },
    [auth, cloudMode, syncSessionsToCloud],
  )

  const persistCustomTemplates = useCallback(
    (
      nextOrUpdater:
        | CustomTrainingTemplate[]
        | ((prev: CustomTrainingTemplate[]) => CustomTrainingTemplate[]),
    ) => {
      setCustomTemplates((prev) => {
        const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater
        if (cloudMode && auth?.role === 'treinador') {
          void cloudSaveCustomTemplates(auth.organizationId, auth.coachId, next).then((result) => {
            if (!result.ok) showToast(`Failed to save templates: ${result.error}`, 'error')
          })
        } else if (auth?.role === 'treinador') {
          store.saveCustomTemplatesForOrg(auth.organizationId, next)
        }
        return next
      })
    },
    [auth, cloudMode, showToast],
  )

  const saveCustomTemplate = useCallback(
    (template: CustomTrainingTemplate) => {
      persistCustomTemplates((prev) => {
        const index = prev.findIndex((t) => t.id === template.id)
        if (index >= 0) {
          const next = [...prev]
          next[index] = template
          return next
        }
        return [template, ...prev]
      })
      setDraft((d) => (d.customTemplateId ? d : { ...d, customTemplateId: template.id }))
    },
    [persistCustomTemplates],
  )

  const deleteCustomTemplate = useCallback(
    (templateId: string) => {
      let nextTemplateId = ''
      persistCustomTemplates((prev) => {
        const next = prev.filter((t) => t.id !== templateId)
        nextTemplateId = next[0]?.id ?? ''
        return next
      })
      setDraft((d) =>
        d.customTemplateId === templateId ? { ...d, customTemplateId: nextTemplateId } : d,
      )
    },
    [persistCustomTemplates],
  )

  const duplicateCustomTemplate = useCallback(
    (templateId: string) => {
      const source = customTemplates.find((t) => t.id === templateId)
      if (!source) return
      const copy = duplicateCustomTemplateRecord(source)
      persistCustomTemplates((prev) => [copy, ...prev])
    },
    [customTemplates, persistCustomTemplates],
  )

  const activeSession = useMemo(
    () => trainingSessions.find((s) => s.id === activeSessionId),
    [trainingSessions, activeSessionId],
  )

  const completedCoachSessions = useMemo(
    () => (organizationId ? filterOrgCompletedSessions(trainingSessions, organizationId) : []),
    [organizationId, trainingSessions],
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

      const activeCount = coachAthletes.filter((a) => !a.blocked).length
      const pendingCount = coachLinks.filter((l) => l.status === 'pending').length
      if (!canAddAthlete(coachPlanId, activeCount + pendingCount)) {
        return {
          ok: false,
          error: `Athlete limit reached on ${getPlan(coachPlanId).name}. Upgrade to add more.`,
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
        (l) => l.organizationId === auth.organizationId && l.athleteId === athlete.id,
      )
      if (existing?.status === 'active') {
        return { ok: false, error: 'This athlete is already on your team.' }
      }

      const nextLink: CoachAthleteLink = existing
        ? { ...existing, status: 'pending', initiatedBy: 'coach', blocked: false }
        : {
            id: crypto.randomUUID(),
            coachId: auth.coachId,
            organizationId: auth.organizationId,
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
      setCoachLinks(nextPairings.filter((l) => l.organizationId === auth.organizationId))
      return { ok: true, athleteName: athlete.name }
    },
    [auth, cloudMode, coachAthletes, coachLinks, coachPlanId, refreshPairingData],
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
      if (auth.role === 'treinador' && link.organizationId !== auth.organizationId) {
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
        setCoachLinks(nextPairings.filter((l) => l.organizationId === auth.organizationId))
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
      if (normalized.psychologyCheckins && !canUsePsychologyCheckins(coachPlanId)) {
        showToast(planUpgradeHint(coachPlanId, 'psychology'), 'error')
        return
      }
      if (!canUsePsychologyCheckins(coachPlanId)) {
        normalized.psychologyCheckins = false
      }

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
      setCoachLinks(nextPairings.filter((l) => l.organizationId === auth.organizationId))
      setAthletes(buildCoachAthletesFromLinks(nextPairings, store.getAthletes()))
    },
    [auth, cloudMode, coachPlanId, refreshPairingData, showToast],
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
      setCoachLinks(nextPairings.filter((l) => l.organizationId === auth.organizationId))
      setAthletes(buildCoachAthletesFromLinks(nextPairings, store.getAthletes()))
      return { ok: true }
    },
    [auth, cloudMode, refreshPairingData],
  )

  const inviteOrganizationCoach = useCallback(
    async (email: string) => {
      if (!auth || auth.role !== 'treinador') {
        return { ok: false, error: 'Sign in as coach first.' }
      }
      if (auth.organizationRole !== 'owner') {
        return { ok: false, error: 'Only the organization owner can invite coaches.' }
      }

      const seatCount = organizationMembers.filter((m) => m.status === 'active' || m.status === 'pending').length
      if (!canAddCoach(coachPlanId, seatCount)) {
        return { ok: false, error: `Coach seat limit reached (${getPlan(coachPlanId).maxCoaches} coaches).` }
      }

      if (cloudMode) {
        const result = await cloudInviteOrganizationCoach(email)
        if (!result.ok) return result
        await refreshOrganizationMembers()
        return { ok: true }
      }

      const result = localInviteOrganizationCoach(auth.organizationId, email)
      if (!result.ok) return result
      await refreshOrganizationMembers()
      return { ok: true }
    },
    [auth, cloudMode, coachPlanId, organizationMembers, refreshOrganizationMembers],
  )

  const removeOrganizationMember = useCallback(
    async (memberId: string) => {
      if (!auth || auth.role !== 'treinador') {
        return { ok: false, error: 'Sign in as coach first.' }
      }

      if (cloudMode) {
        const result = await cloudRemoveOrganizationMember(memberId)
        if (!result.ok) return result
        await refreshOrganizationMembers()
        return { ok: true }
      }

      const result = localRemoveOrganizationMember(auth.organizationId, memberId)
      if (!result.ok) return result
      await refreshOrganizationMembers()
      return { ok: true }
    },
    [auth, cloudMode, refreshOrganizationMembers],
  )

  const updateOrganizationName = useCallback(
    async (name: string) => {
      if (!auth || auth.role !== 'treinador') {
        return { ok: false, error: 'Sign in as coach first.' }
      }
      if (auth.organizationRole !== 'owner') {
        return { ok: false, error: 'Only the organization owner can rename the team.' }
      }

      if (cloudMode) {
        const result = await cloudUpdateOrganizationName(name)
        if (!result.ok) return result
        setAuth({ ...auth, organizationName: result.name })
        await refreshOrganizationMembers()
        return { ok: true, name: result.name }
      }

      const result = localUpdateOrganizationName(auth.organizationId, name)
      if (!result.ok) return result
      setAuth({ ...auth, organizationName: result.name })
      await refreshOrganizationMembers()
      return { ok: true, name: result.name }
    },
    [auth, cloudMode, refreshOrganizationMembers],
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
    (organizationId: string, coachId: string, next: SurfSpot[]) => {
      void cloudSaveSpots(organizationId, coachId, next).then((result) => {
        if (!result.ok) showToast(`Failed to save spots: ${result.error}`, 'error')
      })
    },
    [showToast],
  )

  const saveConditionsToCloud = useCallback(
    (organizationId: string, coachId: string, next: string[]) => {
      void cloudSaveConditions(organizationId, coachId, next).then((result) => {
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
      if (cloudMode) saveSpotsToCloud(auth.organizationId, auth.coachId, next)
      else store.saveSpotsForOrg(auth.organizationId, next)
    },
    [auth, cloudMode, saveSpotsToCloud, spots],
  )

  const addCondition = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed || conditions.includes(trimmed) || auth?.role !== 'treinador') return
      const next = [...conditions, trimmed]
      setConditions(next)
      if (cloudMode) saveConditionsToCloud(auth.organizationId, auth.coachId, next)
      else store.saveConditionsForOrg(auth.organizationId, next)
    },
    [auth, cloudMode, conditions, saveConditionsToCloud],
  )

  const updateSpotName = useCallback(
    (spotId: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed || auth?.role !== 'treinador') return
      const next = spots.map((s) => (s.id === spotId ? { ...s, name: trimmed } : s))
      setSpots(next)
      if (cloudMode) saveSpotsToCloud(auth.organizationId, auth.coachId, next)
      else store.saveSpotsForOrg(auth.organizationId, next)
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
      if (cloudMode) saveSpotsToCloud(auth.organizationId, auth.coachId, next)
      else store.saveSpotsForOrg(auth.organizationId, next)
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
      if (cloudMode) saveConditionsToCloud(auth.organizationId, auth.coachId, next)
      else store.saveConditionsForOrg(auth.organizationId, next)
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
      if (cloudMode) saveConditionsToCloud(auth.organizationId, auth.coachId, next)
      else store.saveConditionsForOrg(auth.organizationId, next)
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

  const setDraftMode = useCallback(
    (mode: TrainingMode) => {
      setDraft((d) => ({
        ...d,
        mode,
        customTemplateId:
          mode === 'custom'
            ? d.customTemplateId || customTemplates[0]?.id || ''
            : d.customTemplateId,
      }))
    },
    [customTemplates],
  )

  const setDraftCustomTemplate = useCallback((templateId: string) => {
    setDraft((d) => ({ ...d, customTemplateId: templateId, mode: 'custom' }))
  }, [])

  const setDraftSpot = useCallback((spotId: string) => {
    setDraft((d) => ({ ...d, spotId }))
    if (auth?.role === 'treinador') {
      saveLastSpotId(auth.organizationId, spotId)
    }
  }, [auth])

  const setDraftCondition = useCallback((condition: string) => {
    setDraft((d) => ({ ...d, condition }))
  }, [])

  const setDraftHeatDuration = useCallback((minutes: HeatDurationMinutes) => {
    setDraft((d) => ({ ...d, heatDurationMinutes: minutes }))
  }, [])

  const setDraftChampionshipHeatSize = useCallback((size: ChampionshipHeatSize) => {
    setDraft((d) => ({ ...d, championshipHeatSize: size }))
  }, [])

  const setDraftChampionshipParallelHeats = useCallback((parallel: boolean) => {
    setDraft((d) => ({ ...d, championshipParallelHeats: parallel }))
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
    setDraft(emptyDraft(spots, customTemplates))
  }, [customTemplates, spots])

  const navigateView = useCallback(
    (next: AppView) => {
      if (next === 'analytics' && !canAccessTeamAnalytics(coachPlanId)) {
        showToast('Team analytics requires Coach or Coach Premium plan.', 'error')
        return
      }
      if (next === 'manage-custom-templates' && !canUseCustomTraining(coachPlanId)) {
        showToast('Custom training requires Coach Premium plan.', 'error')
        setView('subscription')
        return
      }
      if (
        activeSessionId &&
        ACTIVE_SESSION_FLOW_VIEWS.includes(view) &&
        !ACTIVE_SESSION_FLOW_VIEWS.includes(next)
      ) {
        setPendingLeaveView(next)
        setLeaveSessionConfirmOpen(true)
        return
      }
      setView(next)
    },
    [activeSessionId, coachPlanId, showToast, view],
  )

  const beginDraftSession = useCallback(() => {
    const draftBase = emptyDraft(spots, customTemplates)
    if (auth?.role === 'treinador') {
      draftBase.spotId = loadLastSpotId(auth.organizationId, spots)
    }
    if (!canUseTrainingMode(coachPlanId, draftBase.mode)) {
      draftBase.mode = getAllowedModes(coachPlanId)[0] ?? 'tecnico'
    }
    setDraft(draftBase)
    navigateView('start-session')
  }, [auth, coachPlanId, customTemplates, navigateView, spots])

  const confirmAthletesAndStart = useCallback(() => {
    const currentDraft = draftRef.current
    if (!currentDraft.spotId || !currentDraft.condition) return
    if (currentDraft.mode !== 'sea-analysis' && currentDraft.athleteIds.length === 0) return
    if (currentDraft.mode === 'campeonato' && currentDraft.athleteIds.length < 2) {
      showToast('Select at least 2 athletes for a championship.', 'error')
      return
    }
    if (
      currentDraft.mode === 'campeonato' &&
      !isValidChampionshipField(currentDraft.athleteIds.length, currentDraft.championshipHeatSize)
    ) {
      showToast(
        'Cannot build a valid bracket with this number of surfers. Each heat needs at least 2 athletes.',
        'error',
      )
      return
    }
    if (auth?.role !== 'treinador') return

    if (!canUseTrainingMode(coachPlanId, currentDraft.mode)) {
      showToast(
        currentDraft.mode === 'custom'
          ? 'Custom training requires Coach Premium plan.'
          : 'This training mode is not included in your plan.',
        'error',
      )
      return
    }

    if (currentDraft.mode === 'custom') {
      const template = customTemplates.find((t) => t.id === currentDraft.customTemplateId)
      if (!template) {
        showToast('Select a custom training template first.', 'error')
        return
      }
    }

    const customTemplate =
      currentDraft.mode === 'custom'
        ? customTemplates.find((t) => t.id === currentDraft.customTemplateId)
        : null
    const customSnapshot = customTemplate ? snapshotCustomTemplate(customTemplate) : null

    const initialHeat =
      currentDraft.mode === 'heats'
        ? buildHeatRecord(currentDraft.athleteIds, currentDraft.heatDurationMinutes, 'Heat')
        : null

    const championshipHeats =
      currentDraft.mode === 'campeonato'
        ? buildInitialChampionshipHeats(
            currentDraft.athleteIds,
            currentDraft.championshipHeatSize,
            currentDraft.heatDurationMinutes,
          )
        : []

    const resolvedSpotId = resolveDraftSpotId(currentDraft.spotId, spots)
    saveLastSpotId(auth.organizationId, resolvedSpotId)

    const session: TrainingSession = {
      id: crypto.randomUUID(),
      coachId: auth.coachId,
      organizationId: auth.organizationId,
      mode: currentDraft.mode,
      spotId: resolvedSpotId,
      spotName: spots.find((spot) => spot.id === resolvedSpotId)?.name?.trim() ?? '',
      condition: currentDraft.condition,
      startedAt: new Date().toISOString(),
      athleteIds: currentDraft.athleteIds,
      waves: [],
      comboEntries: [],
      heats: initialHeat ? [initialHeat] : championshipHeats,
      seaAnalysis:
        currentDraft.mode === 'sea-analysis'
          ? { timerStartedAt: null, endedAt: null, logs: [] }
          : null,
      championship:
        currentDraft.mode === 'campeonato'
          ? {
              heatSize: currentDraft.championshipHeatSize,
              parallelHeats: currentDraft.championshipParallelHeats,
              status: 'active',
              championAthleteId: null,
            }
          : null,
      customTemplateId: customTemplate?.id ?? null,
      customTemplateName: customTemplate?.name ?? null,
      customTemplateSnapshot: customSnapshot,
      customTimerStartedAt:
        customSnapshot?.timer.enabled && customSnapshot.timer.autoStart
          ? new Date().toISOString()
          : null,
      customTimerEndedAt: null,
      endedAt: null,
      coachNotes: null,
    }
    persistSessions((prev) => [session, ...prev])
    setActiveSessionId(session.id)
    setActiveAthleteId(currentDraft.athleteIds[0] ?? null)
    setActiveWaveId(null)
    setActiveHeatId(initialHeat?.id ?? championshipHeats[0]?.id ?? null)
    setTrainingAthleteGridEpoch((epoch) => epoch + 1)
    setView(viewForMode(currentDraft.mode))
  }, [auth, coachPlanId, customTemplates, persistSessions, showToast, spots, subscription?.planId])

  const openEndSessionSheet = useCallback(() => {
    const session = trainingSessions.find((s) => s.id === activeSessionId)
    if (session && !canEndHeatBasedSession(session)) {
      const labels = pendingHeatEndLabels(session)
      showToast(
        labels.length
          ? `Finish ${labels.join(', ')} before ending the session.`
          : 'Finish all heats before ending the session.',
        'error',
      )
      return
    }
    setEndSessionSheetOpen(true)
  }, [activeSessionId, showToast, trainingSessions])

  const closeEndSessionSheet = useCallback(() => {
    setEndSessionSheetOpen(false)
  }, [])

  const confirmEndSession = useCallback(
    (coachNotes: string) => {
      if (!activeSessionId) return
      const sessionId = activeSessionId
      const trimmedNotes = coachNotes.trim()

      updateSession(sessionId, (s) => {
        const endedAt = new Date().toISOString()
        const seaAnalysis =
          s.mode === 'sea-analysis' && s.seaAnalysis && !s.seaAnalysis.endedAt
            ? { ...s.seaAnalysis, endedAt }
            : s.seaAnalysis

        return {
          ...s,
          endedAt,
          coachNotes: trimmedNotes || null,
          spotName:
            s.spotName?.trim() ||
            spots.find((spot) => spot.id === s.spotId)?.name?.trim() ||
            '',
          seaAnalysis,
        }
      })

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

  const discardActiveSession = useCallback(() => {
    if (!activeSessionId) return
    persistSessions((prev) => prev.filter((s) => s.id !== activeSessionId))
    setActiveWaveId(null)
    setActiveHeatId(null)
    setActiveSessionId(null)
    setActiveAthleteId(null)
    resetDraft()
  }, [activeSessionId, persistSessions, resetDraft])

  const closeLeaveSessionConfirm = useCallback(() => {
    setLeaveSessionConfirmOpen(false)
    setPendingLeaveView(null)
  }, [])

  const confirmLeaveActiveSession = useCallback(() => {
    const target = pendingLeaveView ?? 'coach-home'
    discardActiveSession()
    setLeaveSessionConfirmOpen(false)
    setPendingLeaveView(null)
    setView(target)
  }, [discardActiveSession, pendingLeaveView])

  const cancelActiveSession = useCallback(() => {
    discardActiveSession()
    setView('coach-home')
  }, [discardActiveSession])

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

  const closeCloseWaveConfirm = useCallback(() => {
    setWaveConfirmAction(null)
    setCloseWaveConfirmOpen(false)
  }, [])

  const requestCloseActiveWave = useCallback(() => {
    if (!activeWaveId) return
    setWaveConfirmAction('close')
    setCloseWaveConfirmOpen(true)
  }, [activeWaveId])

  const canMarkNoPotentialWave = useCallback(() => {
    if (!activeSessionId || !activeAthleteId || !activeWaveId) return false
    const session = trainingSessions.find((s) => s.id === activeSessionId)
    const wave = session?.waves.find((w) => w.id === activeWaveId)
    return Boolean(wave && session && !waveHasLoggedAttempts(wave, session.mode))
  }, [activeAthleteId, activeSessionId, activeWaveId, trainingSessions])

  const requestNoPotentialWave = useCallback(() => {
    if (!canMarkNoPotentialWave()) return
    setWaveConfirmAction('no-potential')
    setCloseWaveConfirmOpen(true)
  }, [canMarkNoPotentialWave])

  const applyNoPotentialWave = useCallback(() => {
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

  const confirmCloseActiveWave = useCallback(() => {
    if (waveConfirmAction === 'no-potential') {
      applyNoPotentialWave()
    } else {
      closeActiveWave()
    }
    setActiveAthleteId(null)
    setTrainingAthleteGridEpoch((epoch) => epoch + 1)
    setWaveConfirmAction(null)
    setCloseWaveConfirmOpen(false)
  }, [applyNoPotentialWave, closeActiveWave, waveConfirmAction])

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
    applyNoPotentialWave()
  }, [applyNoPotentialWave])

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

  const logCustomAttempt = useCallback(
    (buttonId: string, levelId: string | null, success: boolean | null) => {
      if (!activeSessionId || !activeAthleteId) return

      let nextActiveWaveId: string | null = null

      updateSession(activeSessionId, (s) => {
        if (s.mode !== 'custom') return s

        const rules = s.customTemplateSnapshot?.rules
        const useWaves = s.customTemplateSnapshot?.useWaves !== false

        let waveId = activeWaveId
        if (waveId) {
          const openWave = s.waves.find((w) => w.id === waveId)
          if (!openWave || openWave.athleteId !== activeAthleteId) waveId = null
        }

        let newWave: WaveRecord | null = null
        if (!waveId && !useWaves) {
          const existing = s.waves.find((w) => w.athleteId === activeAthleteId)
          if (existing) {
            waveId = existing.id
          } else {
            newWave = createPotentialWave(activeAthleteId)
            waveId = newWave.id
          }
        }

        if (rules?.requireWaveBeforeLog && useWaves && !waveId) return s
        if (!waveId) return s

        const wave = newWave ?? s.waves.find((w) => w.id === waveId)
        if (!wave) return s

        const maxAttempts = rules?.maxAttemptsPerWave ?? null
        if (maxAttempts !== null && countWaveCustomAttempts(wave) >= maxAttempts) return s

        const entry: CustomAttemptLog = {
          id: crypto.randomUUID(),
          buttonId,
          levelId,
          success,
          at: new Date().toISOString(),
        }

        const nextWaves = newWave
          ? [{ ...newWave, customAttempts: [entry] }, ...s.waves]
          : s.waves.map((w) =>
              w.id === waveId
                ? { ...w, customAttempts: [...(w.customAttempts ?? []), entry] }
                : w,
            )

        nextActiveWaveId = waveId
        return { ...s, waves: nextWaves }
      })

      if (nextActiveWaveId && nextActiveWaveId !== activeWaveId) {
        setActiveWaveId(nextActiveWaveId)
      }
    },
    [activeAthleteId, activeSessionId, activeWaveId, updateSession],
  )

  const startCustomTimer = useCallback(() => {
    if (!activeSessionId) return
    updateSession(activeSessionId, (s) => {
      if (!s.customTemplateSnapshot?.timer.enabled || s.customTimerStartedAt) return s
      return { ...s, customTimerStartedAt: new Date().toISOString(), customTimerEndedAt: null }
    })
  }, [activeSessionId, updateSession])

  const endCustomTimer = useCallback(() => {
    if (!activeSessionId) return
    updateSession(activeSessionId, (s) => {
      if (!s.customTimerStartedAt || s.customTimerEndedAt) return s
      return { ...s, customTimerEndedAt: new Date().toISOString() }
    })
  }, [activeSessionId, updateSession])

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

  const startHeatTimers = useCallback(
    (heatIds: string[]) => {
      if (!activeSessionId || heatIds.length === 0) return
      updateSession(activeSessionId, (s) => {
        const selected = s.heats.filter((h) => heatIds.includes(h.id))
        const syncFrom = selected.find((h) => h.timerStartedAt && !h.endedAt)
        const startedAt = syncFrom?.timerStartedAt ?? new Date().toISOString()
        return {
          ...s,
          heats: s.heats.map((h) => {
            if (!heatIds.includes(h.id) || h.timerStartedAt || h.endedAt) return h
            if (h.bracketLocked || h.athleteIds.length === 0) return h
            return { ...h, timerStartedAt: startedAt }
          }),
        }
      })
    },
    [activeSessionId, updateSession],
  )

  const startHeatTimer = useCallback(
    (heatId: string) => {
      startHeatTimers([heatId])
    },
    [startHeatTimers],
  )

  const endHeatTimers = useCallback(
    (heatIds: string[]) => {
      if (!activeSessionId || heatIds.length === 0) return
      const session = trainingSessions.find((s) => s.id === activeSessionId)
      if (!session) return

      const idsToEnd = heatIds.filter((id) => {
        const heat = session.heats.find((h) => h.id === id)
        return heat && !heat.endedAt
      })
      if (idsToEnd.length === 0) return

      const endedAt = new Date().toISOString()
      let heats = session.heats.map((h) =>
        idsToEnd.includes(h.id) && !h.endedAt ? { ...h, endedAt } : h,
      )
      let championship = session.championship ?? null
      const endedHeat = heats.find((h) => idsToEnd.includes(h.id))

      if (session.mode === 'campeonato' && championship?.status === 'active' && endedHeat) {
        const result = processChampionshipRoundAdvance(
          heats,
          championship,
          endedHeat.durationMinutes,
        )
        heats = result.heats
        const nextChampionship = result.championship
        championship = nextChampionship

        if (nextChampionship.status === 'complete' && nextChampionship.championAthleteId) {
          const name =
            coachAthletes.find((a) => a.id === nextChampionship.championAthleteId)?.name ??
            'Champion'
          showToast(`${name} wins the championship!`, 'success')
        } else if (result.advancedToNextRound) {
          const nextHeat = heats.find(
            (h) => !h.endedAt && !h.bracketLocked && h.round === (endedHeat.round ?? 1) + 1,
          )
          if (nextHeat) {
            setActiveHeatId(nextHeat.id)
            showToast(`${nextHeat.label} is ready.`, 'info')
          }
        }
      }

      updateSession(activeSessionId, (s) => ({ ...s, heats, championship }))
    },
    [activeSessionId, coachAthletes, showToast, trainingSessions, updateSession],
  )

  const endHeat = useCallback(
    (heatId: string) => {
      endHeatTimers([heatId])
    },
    [endHeatTimers],
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

  const updateCustomAttempt = useCallback(
    (
      waveId: string,
      logId: string,
      patch: Pick<CustomAttemptLog, 'levelId' | 'success'>,
    ) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        waves: s.waves.map((w) =>
          w.id === waveId
            ? {
                ...w,
                customAttempts: (w.customAttempts ?? []).map((c) =>
                  c.id === logId ? { ...c, ...patch } : c,
                ),
              }
            : w,
        ),
      }))
    },
    [activeSessionId, updateSession],
  )

  const deleteCustomAttempt = useCallback(
    (waveId: string, logId: string) => {
      if (!activeSessionId) return
      updateSession(activeSessionId, (s) => ({
        ...s,
        waves: s.waves.map((w) =>
          w.id === waveId
            ? { ...w, customAttempts: (w.customAttempts ?? []).filter((c) => c.id !== logId) }
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

  const insightsAthlete = useMemo(() => {
    if (!insightsAthleteId) return null
    return coachAthletes.find((a) => a.id === insightsAthleteId) ?? null
  }, [coachAthletes, insightsAthleteId])

  const psychologyCoachIds = useMemo(
    () => coachIdsWithPsychologyCheckins(athleteLinks),
    [athleteLinks],
  )

  const pendingSessionFeedback = useMemo(() => {
    if (auth?.role !== 'atleta') return []
    if (psychologyCoachIds.size === 0) return []
    const answered = new Set(sessionAthleteFeedback.map((row) => row.sessionId))
    const skipped = new Set(skippedFeedbackSessionIds)
    return trainingSessions
      .filter(
        (session) =>
          Boolean(session.endedAt) &&
          session.athleteIds.includes(auth.athleteId) &&
          psychologyCoachIds.has(session.coachId) &&
          !answered.has(session.id) &&
          !skipped.has(session.id),
      )
      .sort(
        (a, b) =>
          new Date(b.endedAt ?? b.startedAt).getTime() -
          new Date(a.endedAt ?? a.startedAt).getTime(),
      )
  }, [
    auth,
    psychologyCoachIds,
    sessionAthleteFeedback,
    skippedFeedbackSessionIds,
    trainingSessions,
  ])

  const openCoachAthleteInsights = useCallback(
    async (athleteId: string) => {
      setInsightsAthleteId(athleteId)
      await refreshAthleteEquipment(athleteId)
      setView('coach-athlete-insights')
    },
    [refreshAthleteEquipment],
  )

  const saveAthleteBoard = useCallback(
    async (input: {
      id?: string
      name: string
      lengthFeet: number | null
    lengthInches: number | null
      widthInches: number | null
      thicknessInches: number | null
      volumeLiters: number | null
      notes: string | null
    }) => {
      if (!auth || auth.role !== 'atleta') {
        return { ok: false as const, error: 'Sign in as athlete first.' }
      }
      try {
        const id = input.id ?? crypto.randomUUID()
        const now = new Date().toISOString()
        if (cloudMode) {
          const saved = await cloudUpsertAthleteBoard(auth.athleteId, {
            id,
            name: input.name,
            lengthFeet: input.lengthFeet,
            lengthInches: input.lengthInches,
            widthInches: input.widthInches,
            thicknessInches: input.thicknessInches,
            volumeLiters: input.volumeLiters,
            notes: input.notes,
          })
          setAthleteBoards((prev) => [saved, ...prev.filter((b) => b.id !== saved.id)])
        } else {
          const saved = equipmentStore.saveBoard({
            id,
            athleteId: auth.athleteId,
            name: input.name,
            lengthFeet: input.lengthFeet,
            lengthInches: input.lengthInches,
            widthInches: input.widthInches,
            thicknessInches: input.thicknessInches,
            volumeLiters: input.volumeLiters,
            notes: input.notes,
            createdAt: now,
            updatedAt: now,
          })
          setAthleteBoards((prev) => [saved, ...prev.filter((b) => b.id !== saved.id)])
        }
        return { ok: true as const }
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : 'Could not save board.',
        }
      }
    },
    [auth, cloudMode],
  )

  const deleteAthleteBoard = useCallback(
    async (boardId: string) => {
      if (cloudMode) await cloudDeleteAthleteBoard(boardId)
      else equipmentStore.deleteBoard(boardId)
      setAthleteBoards((prev) => prev.filter((b) => b.id !== boardId))
    },
    [cloudMode],
  )

  const saveAthleteFin = useCallback(
    async (input: {
      id?: string
      name: string
      size: string | null
      template: string | null
      notes: string | null
    }) => {
      if (!auth || auth.role !== 'atleta') {
        return { ok: false as const, error: 'Sign in as athlete first.' }
      }
      try {
        const id = input.id ?? crypto.randomUUID()
        const now = new Date().toISOString()
        if (cloudMode) {
          const saved = await cloudUpsertAthleteFin(auth.athleteId, {
            id,
            name: input.name,
            size: input.size,
            template: input.template,
            notes: input.notes,
          })
          setAthleteFins((prev) => [saved, ...prev.filter((f) => f.id !== saved.id)])
        } else {
          const saved = equipmentStore.saveFin({
            id,
            athleteId: auth.athleteId,
            name: input.name,
            size: input.size,
            template: input.template,
            notes: input.notes,
            createdAt: now,
            updatedAt: now,
          })
          setAthleteFins((prev) => [saved, ...prev.filter((f) => f.id !== saved.id)])
        }
        return { ok: true as const }
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : 'Could not save fins.',
        }
      }
    },
    [auth, cloudMode],
  )

  const deleteAthleteFin = useCallback(
    async (finId: string) => {
      if (cloudMode) await cloudDeleteAthleteFin(finId)
      else equipmentStore.deleteFin(finId)
      setAthleteFins((prev) => prev.filter((f) => f.id !== finId))
    },
    [cloudMode],
  )

  const saveEquipmentEvaluation = useCallback(
    async (input: {
      athleteId: string
      equipmentType: EquipmentType
      equipmentId: string
      speed: number
      control: number
      release: number
      notes: string | null
    }) => {
      if (!auth || auth.role !== 'treinador') {
        return { ok: false as const, error: 'Sign in as coach first.' }
      }
      try {
        if (cloudMode) {
          const saved = await cloudSaveEquipmentEvaluation(auth.coachId, input.athleteId, input)
          setEquipmentEvaluations((prev) => [saved, ...prev])
        } else {
          const saved = equipmentStore.saveEvaluation({
            id: crypto.randomUUID(),
            coachId: auth.coachId,
            athleteId: input.athleteId,
            equipmentType: input.equipmentType,
            equipmentId: input.equipmentId,
            speed: input.speed,
            control: input.control,
            release: input.release,
            notes: input.notes,
            createdAt: new Date().toISOString(),
          })
          setEquipmentEvaluations((prev) => [saved, ...prev])
        }
        return { ok: true as const }
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : 'Could not save evaluation.',
        }
      }
    },
    [auth, cloudMode],
  )

  const submitSessionFeedback = useCallback(
    async (input: {
      sessionId: string
      coachId: string
      psychologyScores: import('./psychologySurvey').PsychologySurveyScores
      writtenNote: string | null
    }) => {
      if (!auth || auth.role !== 'atleta') {
        return { ok: false as const, error: 'Sign in as athlete first.' }
      }
      const link = athleteLinks.find(
        (row) => row.coachId === input.coachId && row.status === 'active',
      )
      if (!link || !linkHasPsychologyCheckins(link)) {
        return {
          ok: false as const,
          error: 'Psychology check-in is not enabled for this coach.',
        }
      }
      try {
        if (cloudMode) {
          const saved = await cloudSubmitSessionFeedback({
            sessionId: input.sessionId,
            athleteId: auth.athleteId,
            coachId: input.coachId,
            psychologyScores: input.psychologyScores,
            writtenNote: input.writtenNote,
          })
          setSessionAthleteFeedback((prev) => [saved, ...prev.filter((row) => row.id !== saved.id)])
        } else {
          const saved = equipmentStore.saveSessionFeedback({
            id: crypto.randomUUID(),
            sessionId: input.sessionId,
            athleteId: auth.athleteId,
            coachId: input.coachId,
            psychologyScores: input.psychologyScores,
            writtenNote: input.writtenNote,
            submittedAt: new Date().toISOString(),
          })
          setSessionAthleteFeedback((prev) => [saved, ...prev.filter((row) => row.id !== saved.id)])
        }
        return { ok: true as const }
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : 'Could not submit feedback.',
        }
      }
    },
    [athleteLinks, auth, cloudMode],
  )

  const skipSessionFeedback = useCallback((sessionId: string) => {
    setSkippedFeedbackSessionIds((prev) => {
      if (prev.includes(sessionId)) return prev
      const next = [...prev, sessionId]
      localStorage.setItem('surfstar-skipped-feedback', JSON.stringify(next))
      return next
    })
    if (priorityFeedbackSessionId === sessionId) {
      setPriorityFeedbackSessionId(null)
    }
  }, [priorityFeedbackSessionId])

  const openSessionFeedback = useCallback((sessionId: string) => {
    setPriorityFeedbackSessionId(sessionId)
    setSkippedFeedbackSessionIds((prev) => {
      if (!prev.includes(sessionId)) return prev
      const next = prev.filter((id) => id !== sessionId)
      localStorage.setItem('surfstar-skipped-feedback', JSON.stringify(next))
      return next
    })
  }, [])

  const clearPrioritySessionFeedback = useCallback(() => {
    setPriorityFeedbackSessionId(null)
  }, [])

  const markSeen = useCallback(
    (domain: string, itemIds: string[]) => {
      if (!auth) return
      markSeenIds(resumeUserKey(auth), domain, itemIds)
      setSeenRevision((value) => value + 1)
    },
    [auth],
  )

  const countUnseenItems = useCallback(
    (domain: string, items: { id: string }[]) => {
      if (!auth) return 0
      void seenRevision
      return countUnseen(items, resumeUserKey(auth), domain)
    },
    [auth, seenRevision],
  )

  const submitContactMessage = useCallback(
    async (input: {
      kind: ContactMessageKind
      name: string
      email: string
      subject: string
      message: string
    }) => {
      if (!input.name.trim()) return { ok: false as const, error: 'Name is required.' }
      if (!input.email.trim()) return { ok: false as const, error: 'Email is required.' }
      if (!input.subject.trim()) return { ok: false as const, error: 'Subject is required.' }
      if (input.message.trim().length < 10) {
        return { ok: false as const, error: 'Message must be at least 10 characters.' }
      }

      try {
        if (cloudMode) {
          const result = await cloudSubmitContactMessage(input)
          if (!result.ok) return result
          return { ok: true as const }
        }

        localSubmitContactMessage({
          ...input,
          userId: auth?.role === 'treinador' ? auth.coachId : auth?.role === 'atleta' ? auth.athleteId : null,
          userRole: auth?.role ?? null,
        })
        return { ok: true as const }
      } catch (err) {
        return {
          ok: false as const,
          error: err instanceof Error ? err.message : 'Could not send message.',
        }
      }
    },
    [auth, cloudMode],
  )

  const value = useMemo(
    () => ({
      auth,
      authReady,
      cloudMode,
      publicView,
      planDetailPlanId,
      selectedPlanId,
      selectedBillingInterval,
      setBillingInterval,
      subscription,
      coachPlanId,
      hasActiveSubscription,
      selectPlan,
      openLanding,
      openPrivacy,
      openTerms,
      openContact,
      openCoachSignIn,
      openCoachPlanSelection,
      openPlanDetail,
      openCoachSignUp,
      openAthleteSignIn,
      openAthleteSignUp,
      openTeamAcademyRequest,
      openForgotPassword,
      forgotPasswordRole,
      requestPasswordReset,
      verifyPasswordResetCode,
      passwordRecoveryPending,
      completePasswordRecovery,
      startCheckout,
      activateDemoSubscription,
      refreshSubscription,
      changeSubscriptionPlan,
      cancelSubscription,
      completeCheckout,
      loginAsCoach,
      loginAsStudent,
      registerCoach,
      registerAthlete,
      logout,
      role,
      view,
      setView: navigateView,
      athleteMenuOpen,
      setAthleteMenuOpen,
      athleteMenuBadge,
      setAthleteMenuBadge,
      athletePortalSheet,
      setAthletePortalSheet,
      coachAthletes,
      coachLinks,
      athleteLinks,
      spots,
      conditions,
      customTemplates,
      saveCustomTemplate,
      deleteCustomTemplate,
      duplicateCustomTemplate,
      requestPairingByCode,
      respondToPairing,
      revokePairing,
      updateAthleteShareSettings,
      setAthleteBlocked,
      activeCoachAthletes,
      changePassword,
      refreshPairingData,
      organizationMembers,
      refreshOrganizationMembers,
      inviteOrganizationCoach,
      removeOrganizationMember,
      updateOrganizationName,
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
      setDraftCustomTemplate,
      setDraftSpot,
      setDraftCondition,
      setDraftHeatDuration,
      setDraftChampionshipHeatSize,
      setDraftChampionshipParallelHeats,
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
      leaveSessionConfirmOpen,
      closeLeaveSessionConfirm,
      confirmLeaveActiveSession,
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
      requestNoPotentialWave,
      logTechnicalManeuver,
      closeActiveWave,
      requestCloseActiveWave,
      waveConfirmAction,
      closeWaveConfirmOpen,
      closeCloseWaveConfirm,
      confirmCloseActiveWave,
      trainingAthleteGridEpoch,
      logComboAttempt,
      logCustomAttempt,
      startCustomTimer,
      endCustomTimer,
      activeHeatId,
      setActiveHeatId,
      createChampionshipHeat,
      startHeatTimer,
      startHeatTimers,
      endHeat,
      endHeatTimers,
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
      updateCustomAttempt,
      deleteCustomAttempt,
      deleteWaveRecord,
      updateHeatWaveScore,
      deleteHeatWaveScore,
      athleteBoards,
      athleteFins,
      equipmentEvaluations,
      sessionAthleteFeedback,
      insightsAthlete,
      pendingSessionFeedback,
      refreshAthleteEquipment,
      openCoachAthleteInsights,
      saveAthleteBoard,
      deleteAthleteBoard,
      saveAthleteFin,
      deleteAthleteFin,
      saveEquipmentEvaluation,
      submitSessionFeedback,
      skipSessionFeedback,
      openSessionFeedback,
      clearPrioritySessionFeedback,
      priorityFeedbackSessionId,
      markSeen,
      countUnseen: countUnseenItems,
      submitContactMessage,
    }),
    [
      auth,
      authReady,
      cloudMode,
      publicView,
      planDetailPlanId,
      selectedPlanId,
      selectedBillingInterval,
      setBillingInterval,
      subscription,
      coachPlanId,
      hasActiveSubscription,
      selectPlan,
      openLanding,
      openPrivacy,
      openTerms,
      openContact,
      openCoachSignIn,
      openCoachPlanSelection,
      openPlanDetail,
      openCoachSignUp,
      openAthleteSignIn,
      openAthleteSignUp,
      openTeamAcademyRequest,
      openForgotPassword,
      forgotPasswordRole,
      requestPasswordReset,
      verifyPasswordResetCode,
      passwordRecoveryPending,
      completePasswordRecovery,
      startCheckout,
      activateDemoSubscription,
      refreshSubscription,
      changeSubscriptionPlan,
      cancelSubscription,
      completeCheckout,
      loginAsCoach,
      loginAsStudent,
      registerCoach,
      registerAthlete,
      logout,
      role,
      view,
      navigateView,
      athleteMenuOpen,
      athleteMenuBadge,
      athletePortalSheet,
      coachAthletes,
      coachLinks,
      athleteLinks,
      spots,
      conditions,
      customTemplates,
      saveCustomTemplate,
      deleteCustomTemplate,
      duplicateCustomTemplate,
      requestPairingByCode,
      respondToPairing,
      revokePairing,
      updateAthleteShareSettings,
      setAthleteBlocked,
      activeCoachAthletes,
      changePassword,
      refreshPairingData,
      organizationMembers,
      refreshOrganizationMembers,
      inviteOrganizationCoach,
      removeOrganizationMember,
      updateOrganizationName,
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
      setDraftCustomTemplate,
      setDraftSpot,
      setDraftCondition,
      setDraftHeatDuration,
      setDraftChampionshipHeatSize,
      setDraftChampionshipParallelHeats,
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
      leaveSessionConfirmOpen,
      closeLeaveSessionConfirm,
      confirmLeaveActiveSession,
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
      requestNoPotentialWave,
      logTechnicalManeuver,
      closeActiveWave,
      requestCloseActiveWave,
      waveConfirmAction,
      closeWaveConfirmOpen,
      closeCloseWaveConfirm,
      confirmCloseActiveWave,
      trainingAthleteGridEpoch,
      logComboAttempt,
      logCustomAttempt,
      startCustomTimer,
      endCustomTimer,
      activeHeatId,
      createChampionshipHeat,
      startHeatTimer,
      startHeatTimers,
      endHeat,
      endHeatTimers,
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
      updateCustomAttempt,
      deleteCustomAttempt,
      deleteWaveRecord,
      updateHeatWaveScore,
      deleteHeatWaveScore,
      athleteBoards,
      athleteFins,
      equipmentEvaluations,
      sessionAthleteFeedback,
      insightsAthlete,
      pendingSessionFeedback,
      refreshAthleteEquipment,
      openCoachAthleteInsights,
      saveAthleteBoard,
      deleteAthleteBoard,
      saveAthleteFin,
      deleteAthleteFin,
      saveEquipmentEvaluation,
      submitSessionFeedback,
      skipSessionFeedback,
      openSessionFeedback,
      clearPrioritySessionFeedback,
      priorityFeedbackSessionId,
      markSeen,
      countUnseenItems,
      seenRevision,
      submitContactMessage,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
