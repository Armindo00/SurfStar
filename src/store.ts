import { createDefaultConditions, createDefaultSpots } from './defaults'
import type {
  Athlete,
  CoachAccount,
  CoachAthleteLink,
  CustomTrainingTemplate,
  Organization,
  OrganizationMember,
  StudentAccount,
  SurfSpot,
  TrainingSession,
  WaveRecord,
} from './types'

const KEY = 'surfstar-v2'
const AUTH_KEY = 'surfstar-auth'

type OrgData = {
  spots: SurfSpot[]
  conditions: string[]
  trainingSessions: TrainingSession[]
  customTemplates: CustomTrainingTemplate[]
}

type Persisted = {
  coaches: CoachAccount[]
  students: StudentAccount[]
  athletes: Athlete[]
  pairings: CoachAthleteLink[]
  organizations: Organization[]
  organizationMembers: OrganizationMember[]
  orgData: Record<string, OrgData>
  /** @deprecated legacy flat storage — migrated into orgData */
  spots?: SurfSpot[]
  conditions?: string[]
  trainingSessions?: TrainingSession[]
  customTemplates?: CustomTrainingTemplate[]
}

function normalizeCoach(c: CoachAccount & { password?: string }): CoachAccount {
  return {
    id: c.id,
    name: c.name,
    email: c.email.toLowerCase(),
    passwordHash: c.passwordHash ?? '',
    organizationId: c.organizationId,
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

function defaultOrgData(): OrgData {
  return {
    spots: createDefaultSpots(),
    conditions: createDefaultConditions(),
    trainingSessions: [],
    customTemplates: [],
  }
}

function migrateLegacyData(parsed: Persisted): Persisted {
  const organizations = parsed.organizations ?? []
  const organizationMembers = parsed.organizationMembers ?? []
  const orgData = parsed.orgData ?? {}
  let coaches = (parsed.coaches ?? []).map((c) => normalizeCoach(c as CoachAccount & { password?: string }))

  const legacySpots = parsed.spots?.length ? parsed.spots : createDefaultSpots()
  const legacyConditions = parsed.conditions?.length ? parsed.conditions : createDefaultConditions()
  const legacySessions = (parsed.trainingSessions ?? []).map((s) => migrateSession(s, legacySpots))
  const legacyTemplates = parsed.customTemplates ?? []
  const legacyPairings = parsed.pairings ?? []

  if (organizations.length === 0 && coaches.length > 0) {
    for (const coach of coaches) {
      const orgId = crypto.randomUUID()
      organizations.push({
        id: orgId,
        name: `${coach.name}'s Team`,
        createdAt: new Date().toISOString(),
      })
      organizationMembers.push({
        id: crypto.randomUUID(),
        organizationId: orgId,
        profileId: coach.id,
        role: 'owner',
        status: 'active',
        name: coach.name,
        email: coach.email,
        acceptedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
      orgData[orgId] = {
        spots: legacySpots,
        conditions: legacyConditions,
        trainingSessions: legacySessions.filter((s) => !s.coachId || s.coachId === coach.id),
        customTemplates: legacyTemplates,
      }
    }
    coaches = coaches.map((c, index) => ({
      ...c,
      organizationId: organizations[index]?.id ?? c.organizationId,
    }))
  }

  for (const coach of coaches) {
    if (!coach.organizationId) continue
    if (!orgData[coach.organizationId]) {
      orgData[coach.organizationId] = defaultOrgData()
    }
  }

  const pairings = legacyPairings.map((link) => {
    if (link.organizationId) return link
    const coach = coaches.find((c) => c.id === link.coachId)
    return { ...link, organizationId: coach?.organizationId }
  })

  return {
    coaches,
    students: (parsed.students ?? []).map((s) => normalizeStudent(s as StudentAccount & { password?: string })),
    athletes: parsed.athletes ?? [],
    pairings,
    organizations,
    organizationMembers,
    orgData,
  }
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as Persisted
    return migrateLegacyData(parsed)
  } catch {
    return seed()
  }
}

function migrateSession(s: TrainingSession, spots: SurfSpot[]): TrainingSession {
  const spotName =
    s.spotName?.trim() ||
    spots.find((spot) => spot.id === s.spotId)?.name?.trim() ||
    ''

  return {
    ...s,
    coachId: s.coachId ?? '',
    organizationId: s.organizationId,
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
      round: h.round,
      advancesCount: h.advancesCount,
      isFinal: h.isFinal ?? false,
    })),
    seaAnalysis: s.seaAnalysis
      ? {
          timerStartedAt: s.seaAnalysis.timerStartedAt ?? null,
          endedAt: s.seaAnalysis.endedAt ?? null,
          logs: s.seaAnalysis.logs ?? [],
        }
      : null,
    championship: s.championship ?? null,
    coachNotes: s.coachNotes ?? null,
    customTemplateId: s.customTemplateId ?? null,
    customTemplateName: s.customTemplateName ?? null,
    customTemplateSnapshot: s.customTemplateSnapshot ?? null,
    customTimerStartedAt: s.customTimerStartedAt ?? null,
    customTimerEndedAt: s.customTimerEndedAt ?? null,
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
        customAttempts: (w.customAttempts ?? []).map((c) => ({
          id: c.id,
          buttonId: c.buttonId,
          levelId: c.levelId ?? null,
          success: c.success ?? null,
          at: c.at,
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
    organizations: [],
    organizationMembers: [],
    orgData: {},
  }
}

function save(data: Persisted) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

function getOrgData(orgId: string, data: Persisted): OrgData {
  if (!data.orgData[orgId]) {
    data.orgData[orgId] = defaultOrgData()
  }
  return data.orgData[orgId]
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
  getOrganizations(): Organization[] {
    return load().organizations
  },
  saveOrganizations(organizations: Organization[]) {
    const data = load()
    data.organizations = organizations
    save(data)
  },
  getOrganizationMembers(): OrganizationMember[] {
    return load().organizationMembers
  },
  saveOrganizationMembers(members: OrganizationMember[]) {
    const data = load()
    data.organizationMembers = members
    save(data)
  },
  ensureOrgData(orgId: string) {
    const data = load()
    getOrgData(orgId, data)
    save(data)
  },
  getSpotsForOrg(orgId: string): SurfSpot[] {
    const data = load()
    return getOrgData(orgId, data).spots
  },
  saveSpotsForOrg(orgId: string, spots: SurfSpot[]) {
    const data = load()
    getOrgData(orgId, data).spots = spots
    save(data)
  },
  getConditionsForOrg(orgId: string): string[] {
    const data = load()
    return getOrgData(orgId, data).conditions
  },
  saveConditionsForOrg(orgId: string, conditions: string[]) {
    const data = load()
    getOrgData(orgId, data).conditions = conditions
    save(data)
  },
  getTrainingSessionsForOrg(orgId: string): TrainingSession[] {
    const data = load()
    return getOrgData(orgId, data).trainingSessions
  },
  saveTrainingSessionsForOrg(orgId: string, sessions: TrainingSession[]) {
    const data = load()
    getOrgData(orgId, data).trainingSessions = sessions
    save(data)
  },
  getCustomTemplatesForOrg(orgId: string): CustomTrainingTemplate[] {
    const data = load()
    return getOrgData(orgId, data).customTemplates
  },
  saveCustomTemplatesForOrg(orgId: string, templates: CustomTrainingTemplate[]) {
    const data = load()
    getOrgData(orgId, data).customTemplates = templates
    save(data)
  },
  /** @deprecated use getSpotsForOrg */
  getSpots(): SurfSpot[] {
    return createDefaultSpots()
  },
  /** @deprecated use saveSpotsForOrg */
  saveSpots(_spots: SurfSpot[]) {},
  /** @deprecated use getConditionsForOrg */
  getConditions(): string[] {
    return createDefaultConditions()
  },
  /** @deprecated use saveConditionsForOrg */
  saveConditions(_conditions: string[]) {},
  /** @deprecated use getTrainingSessionsForOrg */
  getTrainingSessions(): TrainingSession[] {
    return []
  },
  /** @deprecated use saveTrainingSessionsForOrg */
  saveTrainingSessions(_sessions: TrainingSession[]) {},
  /** @deprecated use getCustomTemplatesForOrg */
  getCustomTemplates(): CustomTrainingTemplate[] {
    return []
  },
  /** @deprecated use saveCustomTemplatesForOrg */
  saveCustomTemplates(_templates: CustomTrainingTemplate[]) {},
}

export const authStore = {
  getSession() {
    try {
      const raw = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY)
      if (!raw) return null
      const session = JSON.parse(raw) as import('./types').AuthSession
      if (!localStorage.getItem(AUTH_KEY) && sessionStorage.getItem(AUTH_KEY)) {
        localStorage.setItem(AUTH_KEY, raw)
        sessionStorage.removeItem(AUTH_KEY)
      }
      return session
    } catch {
      return null
    }
  },
  setSession(session: import('./types').AuthSession | null) {
    sessionStorage.removeItem(AUTH_KEY)
    if (!session) localStorage.removeItem(AUTH_KEY)
    else localStorage.setItem(AUTH_KEY, JSON.stringify(session))
  },
}
