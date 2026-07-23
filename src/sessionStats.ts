import type {
  ComboAttemptLog,
  ComboLevel,
  ManeuverKind,
  ManeuverLevel,
  ManeuverLog,
  TrainingMode,
  TrainingSession,
  WaveRecord,
  WaveSide,
} from './types'

export type LevelSuccessStats = {
  attempts: number
  successes: number
  rate: number
}

export type MoveStats = {
  total: number
  successes: number
  rate: number
  byLevel: Record<ManeuverLevel, LevelSuccessStats>
  bySide: SidePairStats
}

export type SidePairStats = {
  frontside: LevelSuccessStats
  backside: LevelSuccessStats
}

export type LevelWithSideStats = LevelSuccessStats & {
  bySide: SidePairStats
}

export type WaveStats = {
  totalWaves: number
  withPotential: number
  withoutPotential: number
}

export type SessionStatsSnapshot = {
  waveStats: WaveStats
  totalManeuvers: number
  successfulManeuvers: number
  overallSuccessRate: number
  bySide: SidePairStats
  byKind: Record<ManeuverKind, MoveStats>
}

export type ComboSessionStatsSnapshot = {
  waveStats: WaveStats
  totalAttempts: number
  successfulAttempts: number
  overallSuccessRate: number
  bySide: SidePairStats
  byLevel: Record<ComboLevel, LevelWithSideStats>
}

export const COMBO_LEVELS: ComboLevel[] = [1, 2, 3, 'estrela']
export const LEVELS: ManeuverLevel[] = COMBO_LEVELS

function emptySideStats(): LevelSuccessStats {
  return { attempts: 0, successes: 0, rate: 0 }
}

function emptyLevelStats(): Record<ManeuverLevel, LevelSuccessStats> {
  return {
    1: { attempts: 0, successes: 0, rate: 0 },
    2: { attempts: 0, successes: 0, rate: 0 },
    3: { attempts: 0, successes: 0, rate: 0 },
    estrela: { attempts: 0, successes: 0, rate: 0 },
  }
}

function rate(successes: number, attempts: number) {
  return attempts ? Math.round((successes / attempts) * 100) : 0
}

function emptySidePair(): SidePairStats {
  return { frontside: emptySideStats(), backside: emptySideStats() }
}

function tallySidePair<T extends { side: WaveSide; success: boolean }>(
  logs: T[],
): SidePairStats {
  const pair = emptySidePair()
  for (const log of logs) {
    pair[log.side].attempts += 1
    if (log.success) pair[log.side].successes += 1
  }
  pair.frontside.rate = rate(pair.frontside.successes, pair.frontside.attempts)
  pair.backside.rate = rate(pair.backside.successes, pair.backside.attempts)
  return pair
}

function kindStats(logs: ManeuverLog[]): MoveStats {
  const byLevel = emptyLevelStats()
  let successes = 0
  for (const log of logs) {
    byLevel[log.level].attempts += 1
    if (log.success) {
      byLevel[log.level].successes += 1
      successes += 1
    }
  }
  for (const lvl of LEVELS) {
    byLevel[lvl].rate = rate(byLevel[lvl].successes, byLevel[lvl].attempts)
  }
  const total = logs.length
  return {
    total,
    successes,
    rate: rate(successes, total),
    byLevel,
    bySide: tallySidePair(logs),
  }
}

export function waveHasLoggedAttempts(w: WaveRecord, mode: TrainingMode): boolean {
  if (mode === 'combos') return (w.comboAttempts?.length ?? 0) > 0
  return w.maneuvers.length > 0
}

export function computeWaveStats(
  session: TrainingSession,
  athleteId?: string | null,
): WaveStats {
  const waves = athleteId
    ? session.waves.filter((w) => w.athleteId === athleteId)
    : session.waves
  return {
    totalWaves: waves.length,
    withPotential: waves.filter((w) => w.hasPotential).length,
    withoutPotential: waves.filter((w) => !w.hasPotential).length,
  }
}

export function computeSessionStats(
  session: TrainingSession,
  athleteId?: string | null,
): SessionStatsSnapshot {
  const waves = athleteId
    ? session.waves.filter((w) => w.athleteId === athleteId)
    : session.waves
  const logs = waves.flatMap((w) => w.maneuvers)

  const byKind: Record<ManeuverKind, MoveStats> = {
    rail: kindStats(logs.filter((l) => l.kind === 'rail')),
    'top-turn': kindStats(logs.filter((l) => l.kind === 'top-turn')),
    progressive: kindStats(logs.filter((l) => l.kind === 'progressive')),
  }

  const successfulManeuvers = logs.filter((l) => l.success).length
  const totalManeuvers = logs.length

  return {
    waveStats: computeWaveStats(session, athleteId),
    totalManeuvers,
    successfulManeuvers,
    overallSuccessRate: rate(successfulManeuvers, totalManeuvers),
    bySide: tallySidePair(logs),
    byKind,
  }
}

function tallyComboLogs(logs: ComboAttemptLog[]) {
  const byLevel = emptyLevelStats()
  const bySide = emptySidePair()
  const byLevelSide: Record<ComboLevel, SidePairStats> = {
    1: emptySidePair(),
    2: emptySidePair(),
    3: emptySidePair(),
    estrela: emptySidePair(),
  }
  let successes = 0

  for (const log of logs) {
    byLevel[log.level].attempts += 1
    bySide[log.side].attempts += 1
    byLevelSide[log.level][log.side].attempts += 1
    if (log.success) {
      byLevel[log.level].successes += 1
      bySide[log.side].successes += 1
      byLevelSide[log.level][log.side].successes += 1
      successes += 1
    }
  }

  const byLevelFull = {} as Record<ComboLevel, LevelWithSideStats>
  for (const lvl of COMBO_LEVELS) {
    const side = byLevelSide[lvl]
    side.frontside.rate = rate(side.frontside.successes, side.frontside.attempts)
    side.backside.rate = rate(side.backside.successes, side.backside.attempts)
    byLevelFull[lvl] = {
      ...byLevel[lvl],
      rate: rate(byLevel[lvl].successes, byLevel[lvl].attempts),
      bySide: side,
    }
  }

  bySide.frontside.rate = rate(bySide.frontside.successes, bySide.frontside.attempts)
  bySide.backside.rate = rate(bySide.backside.successes, bySide.backside.attempts)

  const total = logs.length
  return {
    byLevel: byLevelFull,
    bySide,
    total,
    successes,
    overallSuccessRate: rate(successes, total),
  }
}

export function computeComboSessionStats(
  session: TrainingSession,
  athleteId?: string | null,
): ComboSessionStatsSnapshot {
  const waves = athleteId
    ? session.waves.filter((w) => w.athleteId === athleteId)
    : session.waves
  const logs = waves.flatMap((w) => w.comboAttempts ?? [])
  const tally = tallyComboLogs(logs)

  return {
    waveStats: computeWaveStats(session, athleteId),
    totalAttempts: tally.total,
    successfulAttempts: tally.successes,
    overallSuccessRate: tally.overallSuccessRate,
    byLevel: tally.byLevel,
    bySide: tally.bySide,
  }
}
