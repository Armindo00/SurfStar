import { heatAthleteTotals, heatIsFinished } from './heatUtils'
import {
  computeComboSessionStats,
  computeSessionStats,
  computeWaveStats,
} from './sessionStats'
import type { SurfSpot, TrainingSession } from './types'

export function resolveSessionSpotName(
  session: Pick<TrainingSession, 'spotId' | 'spotName'>,
  getSpot?: (id: string) => SurfSpot | undefined,
): string {
  if (session.spotName?.trim()) return session.spotName.trim()
  return getSpot?.(session.spotId)?.name ?? 'Unknown spot'
}

export function filterCoachCompletedSessions(
  sessions: TrainingSession[],
  coachId: string,
): TrainingSession[] {
  return sessions
    .filter((s) => s.coachId === coachId && Boolean(s.endedAt))
    .sort((a, b) => (b.endedAt ?? '').localeCompare(a.endedAt ?? ''))
}

export function formatSessionDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatSessionDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatSessionDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '—'
  const ms = Math.max(0, new Date(endedAt).getTime() - new Date(startedAt).getTime())
  const mins = Math.max(1, Math.round(ms / 60_000))
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  const remainder = mins % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

function athleteStatHeadline(
  session: TrainingSession,
  athleteId: string,
  getAthlete?: (id: string) => { name: string } | undefined,
): string {
  const name = getAthlete?.(athleteId)?.name ?? 'Athlete'

  if (session.mode === 'tecnico') {
    const stats = computeSessionStats(session, athleteId)
    const waves = computeWaveStats(session, athleteId)
    return `${name}: ${stats.overallSuccessRate}% · ${waves.totalWaves} waves`
  }

  if (session.mode === 'combos') {
    const stats = computeComboSessionStats(session, athleteId)
    const waves = computeWaveStats(session, athleteId)
    return `${name}: ${stats.overallSuccessRate}% · ${waves.totalWaves} waves`
  }

  return name
}

export function buildCoachSessionHeadline(
  session: TrainingSession,
  getAthlete?: (id: string) => { name: string } | undefined,
): string {
  if (session.mode === 'tecnico' || session.mode === 'combos') {
    if (session.athleteIds.length === 0) return 'No athletes'

    if (session.athleteIds.length === 1) {
      const athleteId = session.athleteIds[0]!
      if (session.mode === 'tecnico') {
        const stats = computeSessionStats(session, athleteId)
        const waves = computeWaveStats(session, athleteId)
        return `${stats.overallSuccessRate}% success · ${waves.totalWaves} waves`
      }

      const stats = computeComboSessionStats(session, athleteId)
      const waves = computeWaveStats(session, athleteId)
      return `${stats.overallSuccessRate}% combo success · ${waves.totalWaves} waves`
    }

    return session.athleteIds
      .map((athleteId) => athleteStatHeadline(session, athleteId, getAthlete))
      .join(' · ')
  }

  if (session.mode === 'heats' || session.mode === 'campeonato') {
    const finished = session.heats.filter(heatIsFinished).length
    return `${finished} heat${finished === 1 ? '' : 's'} completed`
  }

  const logs = session.seaAnalysis?.logs.length ?? 0
  return logs ? `${logs} sea observations` : 'Sea analysis completed'
}

export function athleteNamesForSession(
  session: TrainingSession,
  getAthlete: (id: string) => { name: string } | undefined,
): string {
  const names = session.athleteIds
    .map((id) => getAthlete(id)?.name)
    .filter(Boolean) as string[]

  if (names.length === 0) return 'No athletes'
  if (names.length <= 2) return names.join(', ')
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`
}

export function heatSessionSummary(session: TrainingSession): string[] {
  return session.heats
    .filter(heatIsFinished)
    .map((heat) => {
      const totals = heatAthleteTotals(heat)
      const parts = heat.athleteIds
        .map((id) => {
          const total = totals[id] ?? 0
          return `${total.toFixed(2)} pts`
        })
        .join(' · ')
      return `${heat.label}: ${parts}`
    })
}
