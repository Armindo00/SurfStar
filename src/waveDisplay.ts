import type { ComboAttemptLog, CustomAttemptLog, CustomTrainingTemplate, ManeuverLog, WaveSide } from './types'
import { comboLevelLabel } from './i18n/labels'
import { MANEUVER_SHORT } from './types'
import { getCustomButton, getCustomLevel } from './customTrainingUtils'

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
  return `${comboLevelLabel(log.level)} · ${sideShort(log.side)} · ${outcome}`
}

export function formatCustomEntry(
  log: CustomAttemptLog,
  template: CustomTrainingTemplate | null | undefined,
) {
  const button = getCustomButton(template, log.buttonId)
  const level = log.levelId && button ? getCustomLevel(button, log.levelId) : undefined
  const parts = [button?.label ?? 'Skill']
  if (level) parts.push(level.label)
  if (log.success === true) parts.push('✓')
  else if (log.success === false) parts.push('✕')
  return parts.join(' · ')
}
