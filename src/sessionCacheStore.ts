import type { TrainingSession } from './types'

const KEY_PREFIX = 'surfstar-session-cache'

function cacheKey(orgId: string) {
  return `${KEY_PREFIX}:${orgId}`
}

export function loadSessionCache(orgId: string): TrainingSession[] {
  if (!orgId) return []
  try {
    const raw = localStorage.getItem(cacheKey(orgId))
    if (!raw) return []
    return JSON.parse(raw) as TrainingSession[]
  } catch {
    return []
  }
}

export function saveSessionCache(orgId: string, sessions: TrainingSession[]) {
  if (!orgId) return
  try {
    localStorage.setItem(cacheKey(orgId), JSON.stringify(sessions))
  } catch {
    // Ignore quota / private mode errors.
  }
}

export function sessionActivityScore(session: TrainingSession): number {
  let score = 0
  for (const wave of session.waves) {
    score += 10
    score += wave.maneuvers.length
    score += wave.comboAttempts.length
    score += wave.customAttempts?.length ?? 0
  }
  score += session.comboEntries.length
  score += session.heats.length * 5
  for (const heat of session.heats) {
    score += heat.waveScores?.length ?? 0
  }
  score += session.seaAnalysis?.logs?.length ?? 0
  return score
}

export function pickPreferredSession(a: TrainingSession, b: TrainingSession): TrainingSession {
  if (!a.endedAt && b.endedAt) {
    return sessionActivityScore(b) >= sessionActivityScore(a) ? b : a
  }
  if (a.endedAt && !b.endedAt) {
    return sessionActivityScore(a) >= sessionActivityScore(b) ? a : b
  }

  const scoreA = sessionActivityScore(a)
  const scoreB = sessionActivityScore(b)
  if (scoreA !== scoreB) return scoreA > scoreB ? a : b

  if (a.endedAt && b.endedAt) {
    return a.endedAt >= b.endedAt ? a : b
  }

  return a.startedAt >= b.startedAt ? a : b
}

export function mergeTrainingSessions(
  cloudSessions: TrainingSession[],
  localSessions: TrainingSession[],
): TrainingSession[] {
  const byId = new Map<string, TrainingSession>()

  for (const session of cloudSessions) {
    byId.set(session.id, session)
  }

  for (const localSession of localSessions) {
    const existing = byId.get(localSession.id)
    byId.set(
      localSession.id,
      existing ? pickPreferredSession(existing, localSession) : localSession,
    )
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
}
