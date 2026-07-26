import { heatAthleteTotals } from './heatUtils'
import type {
  ChampionshipHeatSize,
  ChampionshipState,
  HeatDurationMinutes,
  HeatRecord,
} from './types'

export function advancesFromHeat(heatSize: ChampionshipHeatSize, athleteCount: number): number {
  if (athleteCount <= 0) return 0
  if (athleteCount === 1) return 1
  return heatSize === 2 ? 1 : 2
}

/** Find heat sizes (each 2–4 in 4-mode, or 1–2 in 2-mode) that fit all athletes. */
export function partitionHeatSizes(
  athleteCount: number,
  heatSize: ChampionshipHeatSize,
): number[] {
  if (athleteCount <= 0) return []

  if (heatSize === 2) {
    const sizes: number[] = []
    let remaining = athleteCount
    while (remaining > 0) {
      if (remaining === 1) {
        sizes.push(1)
        break
      }
      sizes.push(2)
      remaining -= 2
    }
    return sizes
  }

  if (athleteCount <= 4) return [athleteCount]

  let best: number[] | null = null
  let bestScore = -Infinity
  const minHeats = Math.ceil(athleteCount / 4)
  const maxHeats = Math.ceil(athleteCount / 2)

  for (let heatCount = minHeats; heatCount <= maxHeats; heatCount++) {
    const sizes = distributeIntoHeats(athleteCount, heatCount, 2, 4)
    if (!sizes) continue
    const score = scorePartition(sizes, heatSize)
    if (score > bestScore) {
      bestScore = score
      best = sizes
    }
  }

  return best ?? [athleteCount]
}

function scorePartition(sizes: number[], heatSize: ChampionshipHeatSize): number {
  const fours = sizes.filter((s) => s === 4).length
  const threes = sizes.filter((s) => s === 3).length
  const twos = sizes.filter((s) => s === 2).length
  const advances = sizes.reduce((sum, size) => sum + advancesFromHeat(heatSize, size), 0)

  let score = fours * 10 + threes * 7 - twos * 5 - sizes.length

  if (heatSize === 4 && threes === sizes.length && sizes.length >= 2) {
    score += 20
  }
  if (heatSize === 4 && twos > 0 && sizes.length > 1) {
    score -= 8
  }
  if ([2, 4, 6, 8].includes(advances)) {
    score += 8
  }

  return score
}

function distributeIntoHeats(
  total: number,
  heatCount: number,
  minSize: number,
  maxSize: number,
): number[] | null {
  if (total < heatCount * minSize || total > heatCount * maxSize) return null

  const sizes = Array.from({ length: heatCount }, () => minSize)
  let remaining = total - heatCount * minSize
  let index = 0

  while (remaining > 0) {
    if (sizes[index]! < maxSize) {
      sizes[index]! += 1
      remaining -= 1
    }
    index = (index + 1) % heatCount
    if (sizes.every((size) => size >= maxSize)) break
  }

  if (remaining !== 0) return null
  return sizes.sort((a, b) => b - a)
}

/** Split athletes into heats — 4-mode uses 2, 3 or 4 per heat for a balanced bracket. */
export function splitAthletesIntoHeats(
  athleteIds: string[],
  heatSize: ChampionshipHeatSize,
): string[][] {
  const ids = [...athleteIds]
  if (ids.length === 0) return []

  const sizes = partitionHeatSizes(ids.length, heatSize)
  const groups: string[][] = []
  let offset = 0
  for (const size of sizes) {
    groups.push(ids.slice(offset, offset + size))
    offset += size
  }
  return groups
}

export function rankHeatAthletes(heat: HeatRecord): string[] {
  const totals = heatAthleteTotals(heat)
  return [...heat.athleteIds].sort((a, b) => {
    const diff = (totals[b] ?? 0) - (totals[a] ?? 0)
    if (diff !== 0) return diff
    return a.localeCompare(b)
  })
}

export function getHeatWinners(heat: HeatRecord, heatSize: ChampionshipHeatSize): string[] {
  const ranked = rankHeatAthletes(heat)
  const count = heat.isFinal ? 1 : advancesFromHeat(heatSize, heat.athleteIds.length)
  return ranked.slice(0, count)
}

export function roundLabelForRound(athletesInRound: number, roundNumber: number): string {
  if (athletesInRound <= 2) return 'Final'
  if (athletesInRound <= 4) return 'Semifinal'
  if (athletesInRound <= 8) return 'Quarterfinal'
  if (athletesInRound <= 16) return 'Round of 16'
  return `Round ${roundNumber}`
}

/** Round names this bracket will run through (e.g. Quarterfinal → Semifinal → Final). */
export function previewBracketRounds(
  athleteCount: number,
  heatSize: ChampionshipHeatSize,
): string[] {
  if (athleteCount < 2) return []

  const labels: string[] = []
  let current = athleteCount
  let round = 1

  while (current > 1) {
    labels.push(roundLabelForRound(current, round))
    if (current <= 2) break

    const sizes = partitionHeatSizes(current, heatSize)
    current = sizes.reduce((sum, size) => sum + advancesFromHeat(heatSize, size), 0)
    round += 1
  }

  const last = labels[labels.length - 1]
  if (last && last !== 'Final') {
    labels.push('Final')
  }

  return [...new Set(labels)]
}

export function describeHeatGroups(groups: string[][]): string {
  const counts = groups.map((g) => g.length)
  const summary = counts.reduce<Record<number, number>>((acc, n) => {
    acc[n] = (acc[n] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(summary)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([size, count]) => `${count} heat${count === 1 ? '' : 's'} of ${size}`)
    .join(' · ')
}

export function heatsInRound(heats: HeatRecord[], round: number): HeatRecord[] {
  return heats.filter((h) => (h.round ?? 1) === round)
}

export function maxRound(heats: HeatRecord[]): number {
  return heats.reduce((max, h) => Math.max(max, h.round ?? 1), 1)
}

export function isRoundComplete(heats: HeatRecord[], round: number): boolean {
  const roundHeats = heatsInRound(heats, round)
  if (roundHeats.length === 0) return false
  return roundHeats.every((h) => Boolean(h.endedAt))
}

export function createHeatRecordsForGroups(
  groups: string[][],
  round: number,
  heatSize: ChampionshipHeatSize,
  durationMinutes: HeatDurationMinutes,
): HeatRecord[] {
  const roundAthletes = groups.reduce((sum, g) => sum + g.length, 0)
  const roundLabel = roundLabelForRound(roundAthletes, round)

  return groups.map((athleteIds, index) => ({
    id: crypto.randomUUID(),
    label: `${roundLabel} · Heat ${index + 1}`,
    athleteIds,
    durationMinutes,
    timerStartedAt: null,
    endedAt: null,
    waveScores: [],
    interferences: [],
    round,
    advancesCount: advancesFromHeat(heatSize, athleteIds.length),
    isFinal: false,
  }))
}

export function buildInitialChampionshipHeats(
  athleteIds: string[],
  heatSize: ChampionshipHeatSize,
  durationMinutes: HeatDurationMinutes,
): HeatRecord[] {
  const groups = splitAthletesIntoHeats(athleteIds, heatSize)
  return createHeatRecordsForGroups(groups, 1, heatSize, durationMinutes)
}

export type ChampionshipAdvanceResult = {
  heats: HeatRecord[]
  championship: ChampionshipState
  advancedToNextRound: boolean
}

export function processChampionshipRoundAdvance(
  heats: HeatRecord[],
  championship: ChampionshipState,
  durationMinutes: HeatDurationMinutes,
): ChampionshipAdvanceResult {
  const round = maxRound(heats)
  if (!isRoundComplete(heats, round)) {
    return { heats, championship, advancedToNextRound: false }
  }

  const roundHeats = heatsInRound(heats, round)
  const winners = roundHeats.flatMap((h) => getHeatWinners(h, championship.heatSize))

  if (winners.length <= 1) {
    return {
      heats,
      championship: {
        ...championship,
        status: 'complete',
        championAthleteId: winners[0] ?? null,
      },
      advancedToNextRound: false,
    }
  }

  const nextRound = round + 1

  if (winners.length === 2) {
    const finalHeat: HeatRecord = {
      id: crypto.randomUUID(),
      label: 'Final',
      athleteIds: winners,
      durationMinutes,
      timerStartedAt: null,
      endedAt: null,
      waveScores: [],
      interferences: [],
      round: nextRound,
      advancesCount: 1,
      isFinal: true,
    }
    return {
      heats: [...heats, finalHeat],
      championship: { ...championship, status: 'active', championAthleteId: null },
      advancedToNextRound: true,
    }
  }

  const groups = splitAthletesIntoHeats(winners, championship.heatSize)
  const nextHeats = createHeatRecordsForGroups(
    groups,
    nextRound,
    championship.heatSize,
    durationMinutes,
  )

  return {
    heats: [...heats, ...nextHeats],
    championship: { ...championship, status: 'active', championAthleteId: null },
    advancedToNextRound: true,
  }
}

export function getAdvancementSummary(
  heat: HeatRecord,
  heatSize: ChampionshipHeatSize,
): { athleteId: string; place: number; advances: boolean }[] {
  const ranked = rankHeatAthletes(heat)
  const advanceCount = heat.isFinal ? 1 : advancesFromHeat(heatSize, heat.athleteIds.length)
  return ranked.map((athleteId, index) => ({
    athleteId,
    place: index + 1,
    advances: index < advanceCount,
  }))
}
