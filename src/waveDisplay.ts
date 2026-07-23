import type { ComboAttemptLog, ManeuverLog, WaveSide } from './types'
import { COMBO_LEVEL_LABELS, MANEUVER_SHORT } from './types'

export function sideShort(side: WaveSide) {
  return side === 'frontside' ? 'FS' : 'BS'
}

export function formatManeuverEntry(log: ManeuverLog) {
  const level = log.level === 'estrela' ? '★' : `L${log.level}`
  const outcome = log.success ? '✓' : '✕'
  return `${MANEUVER_SHORT[log.kind]} · ${sideShort(log.side)} · ${level} · ${outcome}`
}

export function formatComboEntry(log: ComboAttemptLog) {
  const outcome = log.success ? '✓' : '✕'
  return `${COMBO_LEVEL_LABELS[log.level]} · ${sideShort(log.side)} · ${outcome}`
}
