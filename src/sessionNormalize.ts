import { resolveSessionMode } from './sessionModeUtils'
import type { SurfSpot, TrainingSession, WaveRecord } from './types'

function normalizeLevel(level: unknown): WaveRecord['maneuvers'][0]['level'] {
  if (level === 1 || level === 2 || level === 3 || level === 'estrela') return level
  return 1
}

export function normalizeWaveRecord(raw: WaveRecord): WaveRecord {
  const w = raw as WaveRecord & { kind?: 'wave' | 'no-potential'; outcome?: WaveRecord['outcome'] }
  const hasPotential = w.hasPotential ?? w.kind !== 'no-potential'
  const maneuvers = (w.maneuvers ?? []).map((m) => ({
    ...m,
    level: normalizeLevel(m.level),
    success: m.success ?? true,
  }))
  const comboAttempts = (w.comboAttempts ?? []).map((c) => ({
    ...c,
    level: normalizeLevel(c.level),
    success: c.success ?? true,
  }))
  const customAttempts = (w.customAttempts ?? []).map((c) => ({
    id: c.id,
    buttonId: c.buttonId,
    levelId: c.levelId ?? null,
    success: c.success ?? null,
    at: c.at,
  }))
  const hasAttempts =
    maneuvers.length > 0 || comboAttempts.length > 0 || customAttempts.length > 0
  const outcome =
    w.outcome === 'surfed' || w.outcome === 'wasted'
      ? w.outcome
      : hasAttempts
        ? 'surfed'
        : hasPotential
          ? 'surfed'
          : 'wasted'

  return {
    id: w.id,
    athleteId: w.athleteId,
    startedAt: w.startedAt,
    hasPotential,
    outcome,
    // Legacy waves (pre-classification gate) count as already classified.
    classified: w.classified ?? true,
    multiManeuver: w.multiManeuver ?? false,
    maneuvers,
    comboAttempts,
    customAttempts,
  }
}

export function normalizeTrainingSession(
  session: TrainingSession,
  spots: SurfSpot[] = [],
): TrainingSession {
  const spotName =
    session.spotName?.trim() ||
    spots.find((spot) => spot.id === session.spotId)?.name?.trim() ||
    ''

  return {
    ...session,
    coachId: session.coachId ?? '',
    organizationId: session.organizationId,
    mode: resolveSessionMode(session),
    spotName,
    comboEntries: session.comboEntries ?? [],
    heats: (session.heats ?? []).map((h) => ({
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
    seaAnalysis: session.seaAnalysis
      ? {
          timerStartedAt: session.seaAnalysis.timerStartedAt ?? null,
          endedAt: session.seaAnalysis.endedAt ?? null,
          logs: session.seaAnalysis.logs ?? [],
        }
      : null,
    championship: session.championship ?? null,
    coachNotes: session.coachNotes ?? null,
    customTemplateId: session.customTemplateId ?? null,
    customTemplateName: session.customTemplateName ?? null,
    customTemplateSnapshot: session.customTemplateSnapshot ?? null,
    customTimerStartedAt: session.customTimerStartedAt ?? null,
    customTimerEndedAt: session.customTimerEndedAt ?? null,
    waves: (session.waves ?? []).map((wave) => normalizeWaveRecord(wave)),
  }
}

export function normalizeTrainingSessions(
  sessions: TrainingSession[],
  spots: SurfSpot[] = [],
): TrainingSession[] {
  return sessions.map((session) => normalizeTrainingSession(session, spots))
}
