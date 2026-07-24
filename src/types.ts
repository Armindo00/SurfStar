export type UserRole = 'treinador' | 'atleta'

export type PublicView = 'landing' | 'login' | 'checkout'

/** Tipos de sessão SurfStar (evolução futura: mar, heat) */
export type SessionType = 'treino-tecnico' | 'analise-mar' | 'heat'

/** Modo ao iniciar NEW SESSION */
export type TrainingMode = 'tecnico' | 'combos' | 'heats' | 'campeonato' | 'sea-analysis'

export type AppView =
  | 'coach-home'
  | 'start-session'
  | 'select-athletes'
  | 'training'
  | 'combos'
  | 'heats'
  | 'campeonato'
  | 'sea-analysis'
  | 'session-stats'
  | 'saved-waves'
  | 'manage-athletes'
  | 'manage-spots'
  | 'training-sessions'
  | 'session-history-detail'
  | 'analytics'
  | 'subscription'
  | 'athlete-portal'

export type AthleteShareSettings = {
  technicalStats: boolean
  comboStats: boolean
  sessionHistory: boolean
  heatDetails: boolean
}

export const DEFAULT_ATHLETE_SHARE_SETTINGS: AthleteShareSettings = {
  technicalStats: false,
  comboStats: false,
  sessionHistory: false,
  heatDetails: false,
}

export function normalizeAthleteShareSettings(
  raw?: Partial<AthleteShareSettings> | null,
): AthleteShareSettings {
  return {
    technicalStats: raw?.technicalStats ?? false,
    comboStats: raw?.comboStats ?? false,
    sessionHistory: raw?.sessionHistory ?? false,
    heatDetails: raw?.heatDetails ?? false,
  }
}

export type PairingStatus = 'pending' | 'active' | 'revoked'

export type CoachAthleteLink = {
  id: string
  coachId: string
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
  | { role: 'treinador'; coachId: string; name: string; email: string }
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
