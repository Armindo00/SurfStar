import { getCustomButton, sortCustomButtons } from './customTrainingUtils'
import { computeWaveStats, rate, type WaveStats } from './sessionStats'
import type {
  CustomAttemptLog,
  CustomTrainingTemplate,
  TrainingSession,
  WaveRecord,
} from './types'

export type CustomButtonStats = {
  buttonId: string
  label: string
  attempts: number
  successes: number
  rate: number
  byLevel: Record<
    string,
    {
      levelId: string
      label: string
      attempts: number
      successes: number
      rate: number
    }
  >
}

export type CustomSessionStatsSnapshot = {
  waveStats: WaveStats
  totalAttempts: number
  successfulAttempts: number
  overallSuccessRate: number
  byButton: CustomButtonStats[]
}

function waveAttempts(w: WaveRecord): CustomAttemptLog[] {
  return w.customAttempts ?? []
}

function tallyAttempts(
  logs: CustomAttemptLog[],
  template: CustomTrainingTemplate | null | undefined,
): CustomSessionStatsSnapshot['byButton'] {
  const sorted = sortCustomButtons(template?.buttons ?? [])
  const map = new Map<string, CustomButtonStats>()

  for (const button of sorted) {
    map.set(button.id, {
      buttonId: button.id,
      label: button.label,
      attempts: 0,
      successes: 0,
      rate: 0,
      byLevel: Object.fromEntries(
        button.levels.map((level) => [
          level.id,
          { levelId: level.id, label: level.label, attempts: 0, successes: 0, rate: 0 },
        ]),
      ),
    })
  }

  for (const log of logs) {
    const entry =
      map.get(log.buttonId) ??
      ({
        buttonId: log.buttonId,
        label: getCustomButton(template, log.buttonId)?.label ?? 'Unknown',
        attempts: 0,
        successes: 0,
        rate: 0,
        byLevel: {},
      } as CustomButtonStats)

    entry.attempts += 1
    if (log.success === true) entry.successes += 1

    if (log.levelId && entry.byLevel[log.levelId]) {
      entry.byLevel[log.levelId].attempts += 1
      if (log.success === true) entry.byLevel[log.levelId].successes += 1
    }

    map.set(log.buttonId, entry)
  }

  return [...map.values()].map((entry) => {
    entry.rate = rate(entry.successes, entry.attempts)
    for (const level of Object.values(entry.byLevel)) {
      level.rate = rate(level.successes, level.attempts)
    }
    return entry
  })
}

export function computeCustomSessionStats(
  session: TrainingSession,
  athleteId?: string | null,
): CustomSessionStatsSnapshot {
  const waves = athleteId
    ? session.waves.filter((w) => w.athleteId === athleteId)
    : session.waves
  const logs = waves.flatMap(waveAttempts)
  const tracked = logs.filter((l) => l.success !== null && l.success !== undefined)
  const successes = tracked.filter((l) => l.success === true).length

  return {
    waveStats: computeWaveStats(session, athleteId),
    totalAttempts: logs.length,
    successfulAttempts: successes,
    overallSuccessRate: rate(successes, tracked.length),
    byButton: tallyAttempts(logs, session.customTemplateSnapshot),
  }
}
