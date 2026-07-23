import { heatAthleteTotals, heatIsFinished, heatResultBreakdown } from './heatUtils'
import {
  computeComboSessionStats,
  computeSessionStats,
  computeWaveStats,
  type ComboSessionStatsSnapshot,
  type SessionStatsSnapshot,
} from './sessionStats'
import type { TrainingSession } from './types'

export type AthleteGeneralStats = {
  totalTrainings: number
  totalWaves: number
  potentialWaveSuccessRate: number | null
  heatWins: number
  heatParticipations: number
  avgHeatScore: number | null
  totalStars: number
  technicalStars: number
  comboStars: number
}

export type AthleteHeatDetail = {
  sessionId: string
  sessionEndedAt: string
  heatLabel: string
  total: number
  placement: number
  won: boolean
}

export type AthleteSessionSummary = {
  session: TrainingSession
  waveCount: number
  headline: string
}

export function filterAthleteSessions(
  sessions: TrainingSession[],
  coachId: string,
  athleteId: string,
): TrainingSession[] {
  return sessions
    .filter(
      (s) =>
        s.coachId === coachId && Boolean(s.endedAt) && s.athleteIds.includes(athleteId),
    )
    .sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''))
}

function countAthleteStars(sessions: TrainingSession[], athleteId: string) {
  let technicalStars = 0
  let comboStars = 0

  for (const session of sessions) {
    for (const wave of session.waves) {
      if (wave.athleteId !== athleteId) continue
      technicalStars += wave.maneuvers.filter((m) => m.level === 'estrela' && m.success).length
      comboStars += (wave.comboAttempts ?? []).filter((c) => c.level === 'estrela' && c.success).length
    }
  }

  return { technicalStars, comboStars, totalStars: technicalStars + comboStars }
}

function computePotentialWaveSuccessRate(
  sessions: TrainingSession[],
  athleteId: string,
): number | null {
  let attempts = 0
  let successes = 0

  for (const session of sessions) {
    for (const wave of session.waves) {
      if (wave.athleteId !== athleteId || !wave.hasPotential) continue

      for (const maneuver of wave.maneuvers) {
        attempts += 1
        if (maneuver.success) successes += 1
      }

      for (const combo of wave.comboAttempts ?? []) {
        attempts += 1
        if (combo.success) successes += 1
      }
    }
  }

  if (attempts === 0) return null
  return Math.round((successes / attempts) * 100)
}

export function computeAthleteGeneralStats(
  sessions: TrainingSession[],
  athleteId: string,
): AthleteGeneralStats {
  let totalWaves = 0
  let heatWins = 0
  let heatParticipations = 0
  const heatTotals: number[] = []

  for (const session of sessions) {
    const waveStats = computeWaveStats(session, athleteId)
    totalWaves += waveStats.totalWaves

    for (const heat of session.heats) {
      if (!heatIsFinished(heat) || !heat.athleteIds.includes(athleteId)) continue
      heatParticipations += 1
      const myTotal = heatResultBreakdown(heat, athleteId).total
      heatTotals.push(myTotal)

      const totals = heatAthleteTotals(heat)
      const maxTotal = Math.max(...heat.athleteIds.map((id) => totals[id] ?? 0))
      if (myTotal > 0 && myTotal >= maxTotal) heatWins += 1
    }
  }

  const avgHeatScore = heatTotals.length
    ? Math.round((heatTotals.reduce((sum, value) => sum + value, 0) / heatTotals.length) * 100) /
      100
    : null

  const { technicalStars, comboStars, totalStars } = countAthleteStars(sessions, athleteId)
  const potentialWaveSuccessRate = computePotentialWaveSuccessRate(sessions, athleteId)

  return {
    totalTrainings: sessions.length,
    totalWaves,
    potentialWaveSuccessRate,
    heatWins,
    heatParticipations,
    avgHeatScore,
    totalStars,
    technicalStars,
    comboStars,
  }
}

function mergeSessionsForStats(
  sessions: TrainingSession[],
  athleteId: string,
  mode: TrainingSession['mode'],
): TrainingSession | null {
  const filtered = sessions.filter((s) => s.mode === mode)
  if (filtered.length === 0) return null

  return {
    id: 'merged',
    coachId: filtered[0]!.coachId,
    mode,
    spotId: '',
    condition: '',
    startedAt: '',
    athleteIds: [athleteId],
    waves: filtered.flatMap((s) => s.waves.filter((w) => w.athleteId === athleteId)),
    comboEntries: filtered.flatMap((s) =>
      s.comboEntries.filter((c) => c.athleteId === athleteId),
    ),
    heats: [],
    seaAnalysis: null,
    endedAt: new Date().toISOString(),
  }
}

export function computeAthleteTechnicalStats(
  sessions: TrainingSession[],
  athleteId: string,
): SessionStatsSnapshot | null {
  const merged = mergeSessionsForStats(sessions, athleteId, 'tecnico')
  if (!merged || merged.waves.length === 0) return null
  return computeSessionStats(merged, athleteId)
}

export function computeAthleteComboStats(
  sessions: TrainingSession[],
  athleteId: string,
): ComboSessionStatsSnapshot | null {
  const merged = mergeSessionsForStats(sessions, athleteId, 'combos')
  if (!merged || merged.waves.every((w) => (w.comboAttempts?.length ?? 0) === 0)) return null
  return computeComboSessionStats(merged, athleteId)
}

export function buildAthleteHeatDetails(
  sessions: TrainingSession[],
  athleteId: string,
): AthleteHeatDetail[] {
  const rows: AthleteHeatDetail[] = []

  for (const session of sessions) {
    for (const heat of session.heats) {
      if (!heatIsFinished(heat) || !heat.athleteIds.includes(athleteId)) continue

      const totals = heatAthleteTotals(heat)
      const myTotal = totals[athleteId] ?? 0
      const ranked = [...heat.athleteIds].sort(
        (a, b) => (totals[b] ?? 0) - (totals[a] ?? 0) || a.localeCompare(b),
      )
      const placement = ranked.indexOf(athleteId) + 1
      const maxTotal = Math.max(...heat.athleteIds.map((id) => totals[id] ?? 0))

      rows.push({
        sessionId: session.id,
        sessionEndedAt: session.endedAt ?? session.startedAt,
        heatLabel: heat.label,
        total: myTotal,
        placement,
        won: myTotal > 0 && myTotal >= maxTotal,
      })
    }
  }

  return rows.sort((a, b) => b.sessionEndedAt.localeCompare(a.sessionEndedAt))
}

export function buildAthleteSessionSummaries(
  sessions: TrainingSession[],
  athleteId: string,
): AthleteSessionSummary[] {
  return sessions.map((session) => {
    const waveCount = computeWaveStats(session, athleteId).totalWaves

    if (session.mode === 'tecnico') {
      const stats = computeSessionStats(session, athleteId)
      return {
        session,
        waveCount,
        headline: `${stats.overallSuccessRate}% maneuver success · ${waveCount} waves`,
      }
    }

    if (session.mode === 'combos') {
      const stats = computeComboSessionStats(session, athleteId)
      return {
        session,
        waveCount,
        headline: `${stats.overallSuccessRate}% combo success · ${waveCount} waves`,
      }
    }

    if (session.mode === 'heats' || session.mode === 'campeonato') {
      const finishedHeats = session.heats.filter(
        (h) => heatIsFinished(h) && h.athleteIds.includes(athleteId),
      )
      const wins = finishedHeats.filter((heat) => {
        const totals = heatAthleteTotals(heat)
        const myTotal = totals[athleteId] ?? 0
        const maxTotal = Math.max(...heat.athleteIds.map((id) => totals[id] ?? 0))
        return myTotal > 0 && myTotal >= maxTotal
      }).length
      return {
        session,
        waveCount,
        headline: `${finishedHeats.length} heats · ${wins} wins`,
      }
    }

    return {
      session,
      waveCount,
      headline: session.seaAnalysis?.logs.length
        ? `${session.seaAnalysis.logs.length} sea observations`
        : 'Session completed',
    }
  })
}
