import type { AthleteGeneralStats } from './athleteStats'
import type { WaveMatrixCounts, WaveStats } from './sessionStats'

export type ComparisonNoteLabels = {
  mostFrequentQuadrant: string
  quadrantShare: string
  potentialShare: string
  aproveitamentoVsValorizacao: string
  aproveitamentoOnly: string
  valorizacaoOnly: string
  technicalVsCombo: string
  technicalOnly: string
  comboOnly: string
  heatWinShare: string
  noWaveData: string
  matrixHighHigh: string
  matrixHighLow: string
  matrixLowHigh: string
  matrixLowLow: string
}

type NoteArgs = {
  labels: ComparisonNoteLabels
  waveStats?: Pick<
    WaveStats,
    | 'totalWaves'
    | 'withPotential'
    | 'withoutPotential'
    | 'matrix'
    | 'aproveitamentoRate'
    | 'valorizacaoRate'
  > | null
  general?: Pick<
    AthleteGeneralStats,
    | 'totalWaves'
    | 'withPotential'
    | 'withoutPotential'
    | 'withPotentialRate'
    | 'withoutPotentialRate'
    | 'matrix'
    | 'aproveitamentoRate'
    | 'valorizacaoRate'
    | 'heatWins'
    | 'heatParticipations'
  > | null
  technicalSuccessRate?: number | null
  comboSuccessRate?: number | null
}

function pct(n: number, d: number): number | null {
  if (!d) return null
  return Math.round((n / d) * 100)
}

function dominantQuadrant(
  matrix: WaveMatrixCounts,
  labels: ComparisonNoteLabels,
): { label: string; count: number } | null {
  const entries: { label: string; count: number }[] = [
    { label: labels.matrixHighHigh, count: matrix.potentialSurfed },
    { label: labels.matrixHighLow, count: matrix.potentialWasted },
    { label: labels.matrixLowHigh, count: matrix.noPotentialSurfed },
    { label: labels.matrixLowLow, count: matrix.noPotentialWasted },
  ]
  const ranked = [...entries].sort((a, b) => b.count - a.count)
  const top = ranked[0]
  if (!top || top.count <= 0) return null
  return top
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''))
}

/** Factual comparison lines only — no coaching advice. */
export function buildResultComparisonNotes(args: NoteArgs): string[] {
  const L = args.labels
  const notes: string[] = []

  const totalWaves = args.waveStats?.totalWaves ?? args.general?.totalWaves ?? 0
  const matrix = args.waveStats?.matrix ?? args.general?.matrix
  const withPotential = args.waveStats?.withPotential ?? args.general?.withPotential ?? 0
  const withoutPotential = args.waveStats?.withoutPotential ?? args.general?.withoutPotential ?? 0
  const aproveitamento =
    args.waveStats?.aproveitamentoRate ?? args.general?.aproveitamentoRate ?? null
  const valorizacao = args.waveStats?.valorizacaoRate ?? args.general?.valorizacaoRate ?? null

  if (!totalWaves || !matrix) {
    if (
      args.technicalSuccessRate == null &&
      args.comboSuccessRate == null &&
      !(args.general && args.general.heatParticipations > 0)
    ) {
      return [L.noWaveData]
    }
  } else {
    const top = dominantQuadrant(matrix, L)
    if (top) {
      const share = pct(top.count, totalWaves)
      if (share !== null) {
        notes.push(
          fill(L.mostFrequentQuadrant, { quadrant: top.label, pct: share, count: top.count }),
        )
        notes.push(fill(L.quadrantShare, { pct: share, total: totalWaves }))
      }
    }

    const potShare =
      args.general?.withPotentialRate ?? pct(withPotential, totalWaves)
    const noPotShare =
      args.general?.withoutPotentialRate ?? pct(withoutPotential, totalWaves)
    if (potShare !== null && noPotShare !== null) {
      notes.push(
        fill(L.potentialShare, {
          withPct: potShare,
          withoutPct: noPotShare,
          withCount: withPotential,
          withoutCount: withoutPotential,
        }),
      )
    }

    if (aproveitamento !== null && valorizacao !== null) {
      const delta = aproveitamento - valorizacao
      notes.push(
        fill(L.aproveitamentoVsValorizacao, {
          aproveitamento,
          valorizacao,
          delta: `${delta > 0 ? '+' : ''}${delta}`,
        }),
      )
    } else if (aproveitamento !== null) {
      notes.push(fill(L.aproveitamentoOnly, { aproveitamento }))
    } else if (valorizacao !== null) {
      notes.push(fill(L.valorizacaoOnly, { valorizacao }))
    }
  }

  const tech = args.technicalSuccessRate
  const combo = args.comboSuccessRate
  if (tech !== null && tech !== undefined && combo !== null && combo !== undefined) {
    const delta = tech - combo
    notes.push(
      fill(L.technicalVsCombo, {
        technical: tech,
        combo,
        delta: `${delta > 0 ? '+' : ''}${delta}`,
      }),
    )
  } else if (tech !== null && tech !== undefined) {
    notes.push(fill(L.technicalOnly, { technical: tech }))
  } else if (combo !== null && combo !== undefined) {
    notes.push(fill(L.comboOnly, { combo }))
  }

  const heats = args.general?.heatParticipations ?? 0
  const wins = args.general?.heatWins ?? 0
  if (heats > 0) {
    notes.push(
      fill(L.heatWinShare, {
        wins,
        heats,
        pct: Math.round((wins / heats) * 100),
      }),
    )
  }

  return notes.slice(0, 6)
}
