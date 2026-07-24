import type {
  AppView,
  AuthSession,
  HeatDurationMinutes,
  TrainingMode,
  TrainingSession,
} from './types'

export type DraftSessionResume = {
  mode: TrainingMode
  spotId: string
  condition: string
  athleteIds: string[]
  heatDurationMinutes: HeatDurationMinutes
}

export type AppResumeState = {
  view: AppView
  activeSessionId: string | null
  activeAthleteId: string | null
  activeWaveId: string | null
  activeHeatId: string | null
  draft: DraftSessionResume
  historySessionId: string | null
}

const KEY_PREFIX = 'surfstar-resume'

const SESSION_VIEWS: AppView[] = [
  'training',
  'combos',
  'heats',
  'campeonato',
  'sea-analysis',
  'session-stats',
  'saved-waves',
]

const DRAFT_VIEWS: AppView[] = ['start-session', 'select-athletes']

const COACH_NAV_VIEWS: AppView[] = [
  'coach-home',
  'manage-athletes',
  'manage-spots',
  'training-sessions',
  'session-history-detail',
  'analytics',
  'subscription',
  ...DRAFT_VIEWS,
  ...SESSION_VIEWS,
]

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

function resumeKey(userKey: string) {
  return `${KEY_PREFIX}:${userKey}`
}

export function resumeUserKey(session: AuthSession): string {
  return session.role === 'treinador' ? `coach:${session.coachId}` : `athlete:${session.athleteId}`
}

export function loadResumeState(userKey: string): AppResumeState | null {
  try {
    const raw = localStorage.getItem(resumeKey(userKey))
    if (!raw) return null
    return JSON.parse(raw) as AppResumeState
  } catch {
    return null
  }
}

export function saveResumeState(userKey: string, state: AppResumeState) {
  try {
    localStorage.setItem(resumeKey(userKey), JSON.stringify(state))
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function clearResumeState(userKey: string) {
  localStorage.removeItem(resumeKey(userKey))
}

export function validateAndNormalizeResume(
  saved: AppResumeState,
  auth: AuthSession,
  sessions: TrainingSession[],
): AppResumeState | null {
  if (auth.role === 'atleta') {
    return {
      view: 'athlete-portal',
      activeSessionId: null,
      activeAthleteId: null,
      activeWaveId: null,
      activeHeatId: null,
      draft: saved.draft,
      historySessionId: null,
    }
  }

  let {
    view,
    activeSessionId,
    activeWaveId,
    activeHeatId,
    activeAthleteId,
    draft,
    historySessionId,
  } = saved

  if (activeSessionId) {
    const session = sessions.find((s) => s.id === activeSessionId && !s.endedAt)
    if (!session) {
      activeSessionId = null
      activeWaveId = null
      activeHeatId = null
      activeAthleteId = null
    } else {
      if (activeWaveId && !session.waves.some((w) => w.id === activeWaveId)) {
        activeWaveId = null
      }
      if (activeHeatId && !session.heats.some((h) => h.id === activeHeatId)) {
        activeHeatId = null
      }
      if (activeAthleteId && !session.athleteIds.includes(activeAthleteId)) {
        activeAthleteId = session.athleteIds[0] ?? null
      }
      if (!SESSION_VIEWS.includes(view)) {
        view = viewForMode(session.mode)
      }
    }
  } else {
    activeWaveId = null
    activeHeatId = null
    activeAthleteId = null

    if (view === 'session-history-detail' && historySessionId) {
      if (!sessions.some((s) => s.id === historySessionId && s.endedAt)) {
        historySessionId = null
        view = 'training-sessions'
      }
    } else if (!COACH_NAV_VIEWS.includes(view)) {
      view = 'coach-home'
    }
  }

  if (!COACH_NAV_VIEWS.includes(view) && view !== 'athlete-portal') {
    view = activeSessionId ? viewForMode(sessions.find((s) => s.id === activeSessionId)!.mode) : 'coach-home'
  }

  return {
    view,
    activeSessionId,
    activeAthleteId,
    activeWaveId,
    activeHeatId,
    draft,
    historySessionId,
  }
}
