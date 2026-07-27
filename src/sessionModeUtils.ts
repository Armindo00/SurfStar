import type { AppView } from './types'
import type { TrainingMode, TrainingSession } from './types'

export function resolveSessionMode(session: TrainingSession): TrainingMode {
  if (session.championship) return 'campeonato'
  if (session.seaAnalysis) return 'sea-analysis'
  if (session.customTemplateId || session.customTemplateSnapshot) return 'custom'
  if (
    session.mode === 'heats' ||
    session.mode === 'campeonato' ||
    session.mode === 'combos' ||
    session.mode === 'sea-analysis' ||
    session.mode === 'custom'
  ) {
    return session.mode
  }
  if ((session.heats?.length ?? 0) > 0) return 'heats'
  if ((session.comboEntries?.length ?? 0) > 0) return 'combos'
  return session.mode ?? 'tecnico'
}

export function isHeatLikeSession(session: TrainingSession): boolean {
  const mode = resolveSessionMode(session)
  return mode === 'heats' || mode === 'campeonato'
}

export function liveStatsBackView(session: TrainingSession): AppView {
  const mode = resolveSessionMode(session)
  if (mode === 'combos') return 'combos'
  if (mode === 'custom') return 'custom'
  if (mode === 'heats') return 'heats'
  if (mode === 'campeonato') return 'campeonato'
  if (mode === 'sea-analysis') return 'sea-analysis'
  return 'training'
}

export function liveStatsTitle(session: TrainingSession): string {
  const mode = resolveSessionMode(session)
  if (mode === 'campeonato') return 'Live stats · Championship'
  if (mode === 'heats') return 'Live stats · Heat'
  if (mode === 'combos') return 'Live stats · Combos'
  if (mode === 'sea-analysis') return 'Live stats · Sea analysis'
  if (mode === 'custom') return `Live stats · ${session.customTemplateName ?? 'Custom training'}`
  return 'Live stats · Technical'
}

export function liveStatsButtonLabel(session: TrainingSession): string {
  const mode = resolveSessionMode(session)
  if (mode === 'heats' || mode === 'campeonato') return 'Heat stats'
  if (mode === 'sea-analysis') return 'Sea stats'
  return 'Live stats'
}

export function sessionFlowViewForMode(mode: TrainingMode): AppView {
  switch (mode) {
    case 'combos':
      return 'combos'
    case 'heats':
      return 'heats'
    case 'campeonato':
      return 'campeonato'
    case 'sea-analysis':
      return 'sea-analysis'
    case 'custom':
      return 'custom'
    default:
      return 'training'
  }
}
