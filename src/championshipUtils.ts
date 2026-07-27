import { heatAthleteTotals } from './heatUtils'
import type {
  ChampionshipHeatSize,
  ChampionshipState,
  HeatDurationMinutes,
  HeatRecord,
} from './types'

export function advancesFromHeat(heatSize: ChampionshipHeatSize, athleteCount: number): number {
  if (athleteCount < 2) return 0
  return heatSize === 2 ? 1 : 2
}

const MIN_HEAT_SURFERS = 2

function heatSizesAreValid(sizes: number[]): boolean {
  return sizes.length > 0 && sizes.every((size) => size >= MIN_HEAT_SURFERS)
}

/** Find heat sizes (2–4 in 4-mode, 2–3 in 2-mode). Never creates a heat of 1. */
export function partitionHeatSizes(
  athleteCount: number,
  heatSize: ChampionshipHeatSize,
): number[] {
  if (athleteCount < MIN_HEAT_SURFERS) return []

  if (heatSize === 2) {
    if (athleteCount <= 3) return [athleteCount]

    let best: number[] | null = null
    let bestScore = -Infinity
    const minHeats = Math.ceil(athleteCount / 3)
    const maxHeats = Math.ceil(athleteCount / 2)

    for (let heatCount = minHeats; heatCount <= maxHeats; heatCount++) {
      const sizes = distributeIntoHeats(athleteCount, heatCount, MIN_HEAT_SURFERS, 3)
      if (!sizes || !heatSizesAreValid(sizes)) continue
      const score = scorePartition(sizes, heatSize)
      if (score > bestScore) {
        bestScore = score
        best = sizes
      }
    }

    return best ?? []
  }

  if (athleteCount <= 4) return [athleteCount]

  let best: number[] | null = null
  let bestScore = -Infinity
  const minHeats = Math.ceil(athleteCount / 4)
  const maxHeats = Math.ceil(athleteCount / 2)

  for (let heatCount = minHeats; heatCount <= maxHeats; heatCount++) {
    const sizes = distributeIntoHeats(athleteCount, heatCount, MIN_HEAT_SURFERS, 4)
    if (!sizes || !heatSizesAreValid(sizes)) continue
    const score = scorePartition(sizes, heatSize)
    if (score > bestScore) {
      bestScore = score
      best = sizes
    }
  }

  return best ?? []
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
  return simulateBracketStructure(athleteCount, heatSize).map((round) => round.label)
}

export function describeHeatSizes(sizes: number[]): string {
  const summary = sizes.reduce<Record<number, number>>((acc, n) => {
    acc[n] = (acc[n] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(summary)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([size, count]) => `${count} heat${count === 1 ? '' : 's'} of ${size}`)
    .join(' · ')
}

/** Human-readable bracket for the coach while selecting athletes. */
export function describeFullBracket(
  athleteCount: number,
  heatSize: ChampionshipHeatSize,
): string {
  const structure = simulateBracketStructure(athleteCount, heatSize)
  if (structure.length === 0) return ''

  return structure
    .map((round) => `${round.label}: ${describeHeatSizes(round.heatSizes)}`)
    .join(' → ')
}

export function isValidChampionshipField(
  athleteCount: number,
  heatSize: ChampionshipHeatSize,
): boolean {
  return simulateBracketStructure(athleteCount, heatSize).length > 0
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

export function roundHeatsActionable(heats: HeatRecord[], round: number): HeatRecord[] {
  return heatsInRound(heats, round).filter(
    (h) => !h.bracketLocked && h.athleteIds.length > 0,
  )
}

export function roundHeatsReadyToStart(heats: HeatRecord[], round: number): HeatRecord[] {
  return roundHeatsActionable(heats, round).filter((h) => !h.timerStartedAt && !h.endedAt)
}

export function roundHeatsRunning(heats: HeatRecord[], round: number): HeatRecord[] {
  return roundHeatsActionable(heats, round).filter(
    (h) => Boolean(h.timerStartedAt) && !h.endedAt,
  )
}

export function roundSupportsParallelRun(heats: HeatRecord[], round: number): boolean {
  return roundHeatsActionable(heats, round).length > 1
}

export function championshipParallelHeatsEnabled(
  championship: Pick<ChampionshipState, 'parallelHeats'> | null | undefined,
): boolean {
  return championship?.parallelHeats !== false
}

export function shouldUseParallelRoundRunner(
  championship: Pick<ChampionshipState, 'parallelHeats'> | null | undefined,
  heats: HeatRecord[],
  round: number,
): boolean {
  if (!championshipParallelHeatsEnabled(championship)) return false
  const roundHeats = roundHeatsActionable(heats, round)
  return roundHeats.length > 1 && !roundHeats.every((h) => h.bracketLocked)
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
  return buildFullChampionshipBracket(athleteIds, heatSize, durationMinutes)
}

export type BracketRoundPlan = {
  round: number
  label: string
  heatSizes: number[]
  isFinal: boolean
}

/** Full bracket structure from opening round through the final. */
export function simulateBracketStructure(
  athleteCount: number,
  heatSize: ChampionshipHeatSize,
): BracketRoundPlan[] {
  if (athleteCount < MIN_HEAT_SURFERS) return []

  if (athleteCount === MIN_HEAT_SURFERS) {
    return [{ round: 1, label: 'Final', heatSizes: [2], isFinal: true }]
  }

  const rounds: BracketRoundPlan[] = []
  let current = athleteCount
  let roundNum = 1

  while (true) {
    const sizes = partitionHeatSizes(current, heatSize)
    if (!heatSizesAreValid(sizes)) return []

    const advances = sizes.reduce((sum, size) => sum + advancesFromHeat(heatSize, size), 0)

    if (advances <= 1) {
      rounds.push({
        round: roundNum,
        label: current <= 4 && sizes.length === 1 ? 'Final' : roundLabelForRound(current, roundNum),
        heatSizes: sizes,
        isFinal: true,
      })
      break
    }

    if (advances === 2) {
      rounds.push({
        round: roundNum,
        label: roundLabelForRound(current, roundNum),
        heatSizes: sizes,
        isFinal: false,
      })
      rounds.push({
        round: roundNum + 1,
        label: 'Final',
        heatSizes: [2],
        isFinal: true,
      })
      break
    }

    rounds.push({
      round: roundNum,
      label: roundLabelForRound(current, roundNum),
      heatSizes: sizes,
      isFinal: false,
    })
    current = advances
    roundNum += 1
  }

  return rounds.every((round) => heatSizesAreValid(round.heatSizes)) ? rounds : []
}

/** Create every heat upfront — later rounds start locked until winners arrive. */
export function buildFullChampionshipBracket(
  athleteIds: string[],
  heatSize: ChampionshipHeatSize,
  durationMinutes: HeatDurationMinutes,
): HeatRecord[] {
  const structure = simulateBracketStructure(athleteIds.length, heatSize)
  if (structure.length === 0) return []

  const allHeats: HeatRecord[] = []
  const firstPlan = structure[0]!
  const openingGroups = splitAthletesIntoHeats(athleteIds, heatSize)

  openingGroups.forEach((group, index) => {
    const isSingleFinalRound = firstPlan.isFinal && structure.length === 1
    allHeats.push({
      id: crypto.randomUUID(),
      label: isSingleFinalRound
        ? 'Final'
        : `${firstPlan.label} · Heat ${index + 1}`,
      athleteIds: group,
      durationMinutes,
      timerStartedAt: null,
      endedAt: null,
      waveScores: [],
      interferences: [],
      round: firstPlan.round,
      advancesCount: firstPlan.isFinal ? 1 : advancesFromHeat(heatSize, group.length),
      isFinal: firstPlan.isFinal,
      bracketLocked: false,
      bracketCapacity: group.length,
    })
  })

  for (let planIndex = 1; planIndex < structure.length; planIndex++) {
    const plan = structure[planIndex]!
    plan.heatSizes.forEach((capacity, index) => {
      allHeats.push({
        id: crypto.randomUUID(),
        label:
          plan.heatSizes.length === 1 && plan.isFinal
            ? 'Final'
            : `${plan.label} · Heat ${index + 1}`,
        athleteIds: [],
        durationMinutes,
        timerStartedAt: null,
        endedAt: null,
        waveScores: [],
        interferences: [],
        round: plan.round,
        advancesCount: plan.isFinal ? 1 : advancesFromHeat(heatSize, capacity),
        isFinal: plan.isFinal,
        bracketLocked: true,
        bracketCapacity: capacity,
      })
    })
  }

  return allHeats
}

export function findRoundReadyToAdvance(heats: HeatRecord[]): number | null {
  const rounds = [...new Set(heats.map((h) => h.round ?? 1))].sort((a, b) => a - b)
  for (const round of rounds) {
    if (!isRoundComplete(heats, round)) continue
    const nextRoundHeats = heatsInRound(heats, round + 1)
    if (nextRoundHeats.length === 0) continue
    if (nextRoundHeats.some((h) => h.bracketLocked || h.athleteIds.length === 0)) {
      return round
    }
  }
  return null
}

export function activeChampionshipRound(heats: HeatRecord[]): number {
  const rounds = [...new Set(heats.map((h) => h.round ?? 1))].sort((a, b) => a - b)
  for (const round of rounds) {
    const roundHeats = heatsInRound(heats, round)
    if (roundHeats.some((h) => !h.bracketLocked && !h.endedAt)) return round
  }
  return rounds[rounds.length - 1] ?? 1
}

export function groupHeatsByRound(heats: HeatRecord[]): { round: number; label: string; heats: HeatRecord[] }[] {
  const rounds = [...new Set(heats.map((h) => h.round ?? 1))].sort((a, b) => a - b)
  return rounds.map((round) => {
    const roundHeats = heatsInRound(heats, round).sort((a, b) => a.label.localeCompare(b.label))
    const label = roundHeats[0]?.isFinal
      ? 'Final'
      : roundHeats[0]?.label.split(' · ')[0] ?? `Round ${round}`
    return { round, label, heats: roundHeats }
  })
}

export type ChampionshipAdvanceResult = {
  heats: HeatRecord[]
  championship: ChampionshipState
  advancedToNextRound: boolean
}

export function processChampionshipRoundAdvance(
  heats: HeatRecord[],
  championship: ChampionshipState,
  _durationMinutes: HeatDurationMinutes,
): ChampionshipAdvanceResult {
  const finalHeat = heats.find((h) => h.isFinal)
  if (finalHeat?.endedAt) {
    const championId = getHeatWinners(finalHeat, championship.heatSize)[0] ?? null
    if (championship.status === 'complete' && championship.championAthleteId === championId) {
      return { heats, championship, advancedToNextRound: false }
    }
    return {
      heats,
      championship: { ...championship, status: 'complete', championAthleteId: championId },
      advancedToNextRound: false,
    }
  }

  const roundToAdvance = findRoundReadyToAdvance(heats)
  if (roundToAdvance === null) {
    return { heats, championship, advancedToNextRound: false }
  }

  const roundHeats = heatsInRound(heats, roundToAdvance)
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

  const nextRound = roundToAdvance + 1
  const nextRoundHeats = heatsInRound(heats, nextRound)
  const winnerGroups = splitAthletesIntoHeats(winners, championship.heatSize)
  let groupIndex = 0

  const updatedHeats = heats.map((heat) => {
    if ((heat.round ?? 1) !== nextRound) return heat
    const slotIndex = nextRoundHeats.findIndex((h) => h.id === heat.id)
    if (slotIndex < 0) return heat

    const group = winnerGroups[groupIndex]
    groupIndex += 1
    if (!group || group.length === 0) return heat

    return {
      ...heat,
      athleteIds: group,
      bracketLocked: false,
      advancesCount: heat.isFinal ? 1 : advancesFromHeat(championship.heatSize, group.length),
    }
  })

  return {
    heats: updatedHeats,
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
