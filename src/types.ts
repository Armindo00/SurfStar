export type UserRole = 'treinador' | 'atleta'

export type PublicView =
  | 'landing'
  | 'coach-sign-in'
  | 'coach-sign-up'
  | 'athlete-sign-in'
  | 'athlete-sign-up'
  | 'checkout'
  | 'team-academy-request'
  | 'privacy'
  | 'terms'
  | 'contact'

export type AuthPublicView = Exclude<PublicView, 'landing' | 'checkout' | 'team-academy-request' | 'privacy' | 'terms' | 'contact'>

/** Tipos de sessão SurfStar (evolução futura: mar, heat) */
export type SessionType = 'treino-tecnico' | 'analise-mar' | 'heat'

/** Modo ao iniciar NEW SESSION */
export type TrainingMode = 'tecnico' | 'combos' | 'heats' | 'campeonato' | 'sea-analysis' | 'custom'

export type AppView =
  | 'coach-home'
  | 'start-session'
  | 'select-athletes'
  | 'training'
  | 'combos'
  | 'heats'
  | 'campeonato'
  | 'sea-analysis'
  | 'custom'
  | 'session-stats'
  | 'saved-waves'
  | 'manage-athletes'
  | 'manage-spots'
  | 'training-sessions'
  | 'session-history-detail'
  | 'analytics'
  | 'subscription'
  | 'help'
  | 'athlete-portal'
  | 'manage-custom-templates'
  | 'organization'
  | 'admin'
  | 'athlete-material'
  | 'coach-athlete-insights'
  | 'contact'

export type ContactMessageKind = 'feedback' | 'support' | 'bug' | 'billing' | 'other'

export type ContactMessageStatus = 'new' | 'read' | 'resolved'

export type ContactMessage = {
  id: string
  kind: ContactMessageKind
  name: string
  email: string
  subject: string
  message: string
  userId: string | null
  userRole: UserRole | null
  status: ContactMessageStatus
  createdAt: string
}

export type MentalState =
  | 'focused'
  | 'motivated'
  | 'confident'
  | 'neutral'
  | 'tired'
  | 'anxious'
  | 'demotivated'
  | 'frustrated'

export type EquipmentType = 'board' | 'fin'

export type AthleteBoard = {
  id: string
  athleteId: string
  name: string
  lengthCm: number | null
  widthInches: number | null
  thicknessInches: number | null
  volumeLiters: number | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type AthleteFin = {
  id: string
  athleteId: string
  name: string
  size: string | null
  template: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export type EquipmentEvaluation = {
  id: string
  coachId: string
  athleteId: string
  equipmentType: EquipmentType
  equipmentId: string
  speed: number
  control: number
  release: number
  notes: string | null
  createdAt: string
}

export type SessionAthleteFeedback = {
  id: string
  sessionId: string
  athleteId: string
  coachId: string
  boardId: string | null
  finId: string | null
  mentalState: MentalState
  writtenNote: string | null
  submittedAt: string
}

export type CustomLevel = {
  id: string
  label: string
  sortOrder: number
}

export type CustomButton = {
  id: string
  label: string
  shortLabel?: string
  color?: string
  levels: CustomLevel[]
  /** When true, coach picks success or fail after level (or alone if no levels). */
  trackSuccess: boolean
  sortOrder: number
}

export type CustomTimerConfig = {
  enabled: boolean
  durationMinutes: number
  autoStart: boolean
  label?: string
}

export type CustomSessionRules = {
  /** Max logged attempts per wave (null = unlimited). */
  maxAttemptsPerWave?: number | null
  requireWaveBeforeLog: boolean
  showRulesPanel: boolean
}

export type CustomTrainingTemplate = {
  id: string
  name: string
  description?: string
  rulesNotes?: string
  buttons: CustomButton[]
  timer: CustomTimerConfig
  useWaves: boolean
  rules: CustomSessionRules
  updatedAt: string
}

export type CustomAttemptLog = {
  id: string
  buttonId: string
  levelId?: string | null
  success?: boolean | null
  at: string
}

export type AthleteShareSettings = {
  technicalStats: boolean
  comboStats: boolean
  sessionHistory: boolean
  heatDetails: boolean
}

export const DEFAULT_ATHLETE_SHARE_SETTINGS: AthleteShareSettings = {
  technicalStats: true,
  comboStats: true,
  sessionHistory: true,
  heatDetails: true,
}

export function normalizeAthleteShareSettings(
  raw?: Partial<AthleteShareSettings> | null,
): AthleteShareSettings {
  const hasAnyKey =
    raw &&
    ('technicalStats' in raw ||
      'comboStats' in raw ||
      'sessionHistory' in raw ||
      'heatDetails' in raw)

  if (!hasAnyKey) {
    return { ...DEFAULT_ATHLETE_SHARE_SETTINGS }
  }

  return {
    technicalStats: raw?.technicalStats ?? DEFAULT_ATHLETE_SHARE_SETTINGS.technicalStats,
    comboStats: raw?.comboStats ?? DEFAULT_ATHLETE_SHARE_SETTINGS.comboStats,
    sessionHistory: raw?.sessionHistory ?? DEFAULT_ATHLETE_SHARE_SETTINGS.sessionHistory,
    heatDetails: raw?.heatDetails ?? DEFAULT_ATHLETE_SHARE_SETTINGS.heatDetails,
  }
}

export type PairingStatus = 'pending' | 'active' | 'revoked'

export type OrganizationRole = 'owner' | 'coach'

export type OrganizationMemberStatus = 'pending' | 'active'

export type Organization = {
  id: string
  name: string
  createdAt?: string
}

export type OrganizationMember = {
  id: string
  organizationId: string
  profileId: string | null
  role: OrganizationRole
  status: OrganizationMemberStatus
  invitedEmail?: string | null
  name: string
  email: string
  acceptedAt?: string | null
  createdAt?: string
}

export type CoachAthleteLink = {
  id: string
  coachId: string
  organizationId?: string
  athleteId: string
  status: PairingStatus
  initiatedBy: 'coach' | 'athlete'
  shareSettings: AthleteShareSettings
  blocked: boolean
  coachName?: string
  athleteName?: string
  createdAt?: string
}

export type Athlete = {
  id: string
  name: string
  pairingCode: string
  /** Link row when viewed by a coach */
  linkId?: string
  /** @deprecated legacy coach-owned row */
  coachId?: string
  shareSettings?: AthleteShareSettings
  blocked?: boolean
}

export type CoachAccount = {
  id: string
  name: string
  email: string
  passwordHash: string
  organizationId?: string
  /** Legacy plain text — upgraded on next login */
  password?: string
}

export type StudentAccount = {
  id: string
  coachId: string
  athleteId: string
  name: string
  email: string
  passwordHash: string
  password?: string
  /** True until athlete sets their own password on first login */
  mustChangePassword?: boolean
}

export type AuthSession =
  | {
      role: 'treinador'
      coachId: string
      organizationId: string
      organizationRole: OrganizationRole
      organizationName: string
      name: string
      email: string
      isPlatformAdmin?: boolean
    }
  | {
      role: 'atleta'
      athleteId: string
      name: string
      email: string
      pairingCode: string
      /** Legacy coach-created accounts only */
      mustChangePassword?: boolean
    }

export type SurfSpot = {
  id: string
  name: string
}

/** R = rail, T = top turn, P = manobra progressiva */
export type ManeuverKind = 'rail' | 'top-turn' | 'progressive'

export type WaveSide = 'frontside' | 'backside'

export type ManeuverLevel = 1 | 2 | 3 | 'estrela'

export type ManeuverLog = {
  id: string
  kind: ManeuverKind
  side: WaveSide
  level: ManeuverLevel
  success: boolean
  at: string
}

/** Nível do combo (botões 1, 2, 3, estrela) */
export type ComboLevel = ManeuverLevel

export type ComboAttemptLog = {
  id: string
  level: ComboLevel
  side: WaveSide
  success: boolean
  at: string
}

/** @deprecated formato antigo — mantido na persistência */
export type ComboLog = {
  id: string
  direction: string
  move1: string
  move2: string
  combLevel: string
  result: string
  at: string
}

export type SessionComboEntry = ComboLog & {
  athleteId: string
}

/** Uma onda no treino técnico (NP ou onda com potencial + manobras) */
export type WaveRecord = {
  id: string
  athleteId: string
  /** false = botão NP (sem potencial) */
  hasPotential: boolean
  /** true = várias manobras R/T/P na mesma onda (botão +) */
  multiManeuver: boolean
  startedAt: string
  maneuvers: ManeuverLog[]
  comboAttempts: ComboAttemptLog[]
  customAttempts?: CustomAttemptLog[]
}

export type HeatDurationMinutes = 5 | 10 | 15 | 20 | 25 | 30

export const HEAT_DURATIONS: HeatDurationMinutes[] = [5, 10, 15, 20, 25, 30]

export type HeatWaveScore = {
  id: string
  athleteId: string
  /** 0–10, two decimal places */
  score: number
  at: string
}

/** Penalty applied to heat counting (2nd best wave). */
export type HeatInterferenceType = 'half-second' | 'drop-second'

export type HeatInterference = {
  id: string
  athleteId: string
  type: HeatInterferenceType
  at: string
}

export const HEAT_INTERFERENCE_LABELS: Record<HeatInterferenceType, string> = {
  'half-second': 'INT — 2nd best halved',
  'drop-second': 'INT — 2nd best removed',
}

export type HeatRecord = {
  id: string
  /** Display name, e.g. Heat 1 */
  label: string
  athleteIds: string[]
  durationMinutes: HeatDurationMinutes
  timerStartedAt: string | null
  endedAt: string | null
  waveScores: HeatWaveScore[]
  interferences: HeatInterference[]
  /** Bracket round (championship mode). */
  round?: number
  /** Surfers advancing to the next round from this heat. */
  advancesCount?: number
  /** True when this heat decides the champion (top 1 only). */
  isFinal?: boolean
  /** Championship: waiting for previous round — no surfers assigned yet. */
  bracketLocked?: boolean
  /** Expected surfers in this heat (for empty bracket slots). */
  bracketCapacity?: number
}

export type ChampionshipHeatSize = 2 | 4

export type ChampionshipState = {
  heatSize: ChampionshipHeatSize
  status: 'active' | 'complete'
  championAthleteId: string | null
}

export const SEA_ANALYSIS_DURATION_MINUTES = 30

export type SeaPeak = 'peak-1' | 'peak-2'

export type SeaWaveType = 'set' | 'intermedia-grande' | 'intermedia-pequena' | 'pequena'

export type SeaAnalysisLog = {
  id: string
  peak: SeaPeak
  waveType: SeaWaveType
  at: string
}

export type SeaAnalysisState = {
  timerStartedAt: string | null
  endedAt: string | null
  logs: SeaAnalysisLog[]
}

export const SEA_PEAK_LABELS: Record<SeaPeak, string> = {
  'peak-1': 'Peak 1',
  'peak-2': 'Peak 2',
}

export const SEA_WAVE_TYPE_LABELS: Record<SeaWaveType, string> = {
  set: 'Set',
  'intermedia-grande': 'Large intermediate',
  'intermedia-pequena': 'Small intermediate',
  pequena: 'Small',
}

export const SEA_WAVE_TYPES: SeaWaveType[] = [
  'set',
  'intermedia-grande',
  'intermedia-pequena',
  'pequena',
]

export const SEA_PEAKS: SeaPeak[] = ['peak-1', 'peak-2']

export type TrainingSession = {
  id: string
  coachId: string
  organizationId?: string
  mode: TrainingMode
  spotId: string
  /** Snapshot at session start so history keeps the spot name */
  spotName: string
  condition: string
  startedAt: string
  athleteIds: string[]
  waves: WaveRecord[]
  comboEntries: SessionComboEntry[]
  heats: HeatRecord[]
  seaAnalysis: SeaAnalysisState | null
  championship?: ChampionshipState | null
  customTemplateId?: string | null
  customTemplateName?: string | null
  customTemplateSnapshot?: CustomTrainingTemplate | null
  customTimerStartedAt?: string | null
  customTimerEndedAt?: string | null
  endedAt: string | null
  /** Optional coach notes written when ending the session */
  coachNotes: string | null
}

export const TRAINING_MODE_LABELS: Record<TrainingMode, string> = {
  tecnico: 'Technical training',
  combos: 'Combos',
  heats: 'Heats',
  campeonato: 'Championship',
  'sea-analysis': 'Sea analysis',
  custom: 'Custom training',
}

export const MANEUVER_LABELS: Record<ManeuverKind, string> = {
  rail: 'Rail (R)',
  'top-turn': 'Top turn (T)',
  progressive: 'Progressive (P)',
}

export const MANEUVER_SHORT: Record<ManeuverKind, string> = {
  rail: 'R',
  'top-turn': 'T',
  progressive: 'P',
}

export const LEVEL_LABELS: Record<ManeuverLevel, string> = {
  1: '1',
  2: '2',
  3: '3',
  estrela: '★',
}

export const COMBO_LEVEL_LABELS: Record<ComboLevel, string> = {
  1: 'Combo 1',
  2: 'Combo 2',
  3: 'Combo 3',
  estrela: 'Combo star ★',
}

export const COMBO_LEVELS: ComboLevel[] = [1, 2, 3, 'estrela']

// Legacy types kept for store compatibility if needed later
export type SessionTypeLegacy = SessionType
