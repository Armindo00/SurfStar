import { createDefaultConditions, createDefaultSpots } from './defaults'
import type {
  Athlete,
  CoachAccount,
  CoachAthleteLink,
  StudentAccount,
  SurfSpot,
  TrainingSession,
  WaveRecord,
} from './types'

const KEY = 'surfstar-v2'
const AUTH_KEY = 'surfstar-auth'

type Persisted = {
  coaches: CoachAccount[]
  students: StudentAccount[]
  athletes: Athlete[]
  pairings: CoachAthleteLink[]
  spots: SurfSpot[]
  conditions: string[]
  trainingSessions: TrainingSession[]
}

function normalizeCoach(c: CoachAccount & { password?: string }): CoachAccount {
  return {
    id: c.id,
    name: c.name,
    email: c.email.toLowerCase(),
    passwordHash: c.passwordHash ?? '',
    password: c.password,
  }
}

function normalizeStudent(s: StudentAccount & { password?: string }): StudentAccount {
  return {
    id: s.id,
    coachId: s.coachId,
    athleteId: s.athleteId,
    name: s.name,
    email: s.email.toLowerCase(),
    passwordHash: s.passwordHash ?? '',
    password: s.password,
  }
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as Persisted
    return {
      coaches: (parsed.coaches ?? []).map((c) => normalizeCoach(c as CoachAccount & { password?: string })),
      students: (parsed.students ?? []).map((s) => normalizeStudent(s as StudentAccount & { password?: string })),
      athletes: parsed.athletes ?? [],
      pairings: parsed.pairings ?? [],
      spots: parsed.spots?.length ? parsed.spots : createDefaultSpots(),
      conditions: parsed.conditions?.length ? parsed.conditions : createDefaultConditions(),
      trainingSessions: (parsed.trainingSessions ?? []).map(migrateSession),
    }
  } catch {
    return seed()
  }
}

function migrateSession(s: TrainingSession): TrainingSession {
  const spots = load().spots
  const spotName =
    s.spotName?.trim() ||
    spots.find((spot) => spot.id === s.spotId)?.name?.trim() ||
    ''

  return {
    ...s,
    coachId: s.coachId ?? '',
    mode: s.mode ?? 'tecnico',
    spotName,
    comboEntries: s.comboEntries ?? [],
    heats: (s.heats ?? []).map((h) => ({
      ...h,
      label: h.label ?? 'Heat',
      waveScores: (h.waveScores ?? []).map((w) => ({
        ...w,
        score: typeof w.score === 'number' ? Math.round(w.score * 100) / 100 : 0,
      })),
      interferences: h.interferences ?? [],
    })),
    seaAnalysis: s.seaAnalysis
      ? {
          timerStartedAt: s.seaAnalysis.timerStartedAt ?? null,
          endedAt: s.seaAnalysis.endedAt ?? null,
          logs: s.seaAnalysis.logs ?? [],
        }
      : null,
    coachNotes: s.coachNotes ?? null,
    waves: (s.waves ?? []).map((raw) => {
      const w = raw as WaveRecord & { kind?: 'wave' | 'no-potential' }
      return {
        id: w.id,
        athleteId: w.athleteId,
        startedAt: w.startedAt,
        hasPotential: w.hasPotential ?? w.kind !== 'no-potential',
        multiManeuver: w.multiManeuver ?? false,
        maneuvers: (w.maneuvers ?? []).map((m) => ({
          ...m,
          level: normalizeLevel(m.level),
          success: m.success ?? true,
        })),
        comboAttempts: (w.comboAttempts ?? []).map((c) => ({
          ...c,
          level: normalizeLevel(c.level),
          success: c.success ?? true,
        })),
      }
    }),
  }
}

function normalizeLevel(level: unknown): TrainingSession['waves'][0]['maneuvers'][0]['level'] {
  if (level === 1 || level === 2 || level === 3 || level === 'estrela') return level
  return 1
}

function seed(): Persisted {
  return {
    coaches: [],
    students: [],
    athletes: [],
    pairings: [],
    spots: createDefaultSpots(),
    conditions: createDefaultConditions(),
    trainingSessions: [],
  }
}

function save(data: Persisted) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export const store = {
  getCoaches(): CoachAccount[] {
    return load().coaches
  },
  saveCoaches(coaches: CoachAccount[]) {
    const data = load()
    data.coaches = coaches
    save(data)
  },
  getStudents(): StudentAccount[] {
    return load().students
  },
  saveStudents(students: StudentAccount[]) {
    const data = load()
    data.students = students
    save(data)
  },
  getAthletes(): Athlete[] {
    return load().athletes
  },
  saveAthletes(athletes: Athlete[]) {
    const data = load()
    data.athletes = athletes
    save(data)
  },
  getPairings(): CoachAthleteLink[] {
    return load().pairings
  },
  savePairings(pairings: CoachAthleteLink[]) {
    const data = load()
    data.pairings = pairings
    save(data)
  },
  getSpots(): SurfSpot[] {
    return load().spots
  },
  saveSpots(spots: SurfSpot[]) {
    const data = load()
    data.spots = spots
    save(data)
  },
  getConditions(): string[] {
    return load().conditions
  },
  saveConditions(conditions: string[]) {
    const data = load()
    data.conditions = conditions
    save(data)
  },
  getTrainingSessions(): TrainingSession[] {
    return load().trainingSessions
  },
  saveTrainingSessions(sessions: TrainingSession[]) {
    const data = load()
    data.trainingSessions = sessions
    save(data)
  },
}

export const authStore = {
  getSession() {
    try {
      const raw = sessionStorage.getItem(AUTH_KEY)
      if (!raw) return null
      return JSON.parse(raw) as import('./types').AuthSession
    } catch {
      return null
    }
  },
  setSession(session: import('./types').AuthSession | null) {
    if (!session) sessionStorage.removeItem(AUTH_KEY)
    else sessionStorage.setItem(AUTH_KEY, JSON.stringify(session))
  },
}
