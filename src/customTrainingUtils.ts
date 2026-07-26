import type {
  CustomButton,
  CustomLevel,
  CustomSessionRules,
  CustomTimerConfig,
  CustomTrainingTemplate,
} from './types'

export const CUSTOM_BUTTON_COLORS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#be185d',
  '#4f46e5',
] as const

export function createCustomLevel(label: string, sortOrder: number): CustomLevel {
  return { id: crypto.randomUUID(), label, sortOrder }
}

export function createCustomButton(partial?: Partial<CustomButton>): CustomButton {
  return {
    id: crypto.randomUUID(),
    label: partial?.label ?? 'New button',
    shortLabel: partial?.shortLabel ?? '',
    color: partial?.color ?? CUSTOM_BUTTON_COLORS[0],
    levels: partial?.levels ?? [
      createCustomLevel('1', 0),
      createCustomLevel('2', 1),
      createCustomLevel('3', 2),
    ],
    trackSuccess: partial?.trackSuccess ?? true,
    sortOrder: partial?.sortOrder ?? 0,
  }
}

export function defaultCustomTimer(): CustomTimerConfig {
  return {
    enabled: false,
    durationMinutes: 15,
    autoStart: false,
    label: 'Session timer',
  }
}

export function defaultCustomRules(): CustomSessionRules {
  return {
    maxAttemptsPerWave: null,
    requireWaveBeforeLog: true,
    showRulesPanel: true,
  }
}

export function createEmptyCustomTemplate(name = 'My custom training'): CustomTrainingTemplate {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    name,
    description: '',
    rulesNotes: '',
    buttons: [
      createCustomButton({ label: 'Skill A', shortLabel: 'A', sortOrder: 0, color: CUSTOM_BUTTON_COLORS[0] }),
      createCustomButton({ label: 'Skill B', shortLabel: 'B', sortOrder: 1, color: CUSTOM_BUTTON_COLORS[1] }),
      createCustomButton({ label: 'Skill C', shortLabel: 'C', sortOrder: 2, color: CUSTOM_BUTTON_COLORS[2] }),
    ],
    timer: defaultCustomTimer(),
    useWaves: true,
    rules: defaultCustomRules(),
    updatedAt: now,
  }
}

export function cloneCustomTemplate(template: CustomTrainingTemplate): CustomTrainingTemplate {
  return JSON.parse(JSON.stringify(template)) as CustomTrainingTemplate
}

export function duplicateCustomTemplateRecord(template: CustomTrainingTemplate): CustomTrainingTemplate {
  const copy = cloneCustomTemplate(template)
  copy.id = crypto.randomUUID()
  copy.name = `${template.name} (copy)`
  copy.updatedAt = new Date().toISOString()
  return copy
}

export function snapshotCustomTemplate(template: CustomTrainingTemplate): CustomTrainingTemplate {
  const snap = cloneCustomTemplate(template)
  snap.updatedAt = new Date().toISOString()
  return snap
}

export function sortCustomButtons(buttons: CustomButton[]): CustomButton[] {
  return [...buttons].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function sortCustomLevels(levels: CustomLevel[]): CustomLevel[] {
  return [...levels].sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getCustomButton(
  template: CustomTrainingTemplate | null | undefined,
  buttonId: string,
): CustomButton | undefined {
  return template?.buttons.find((b) => b.id === buttonId)
}

export function getCustomLevel(
  button: CustomButton,
  levelId: string,
): CustomLevel | undefined {
  return button.levels.find((l) => l.id === levelId)
}

export function buttonDisplayLabel(button: CustomButton): string {
  return button.shortLabel?.trim() || button.label
}

export function validateCustomTemplate(template: CustomTrainingTemplate): string | null {
  if (!template.name.trim()) return 'Enter a template name.'
  if (template.buttons.length === 0) return 'Add at least one button.'
  for (const button of template.buttons) {
    if (!button.label.trim()) return 'Every button needs a name.'
  }
  if (template.timer.enabled && template.timer.durationMinutes < 1) {
    return 'Timer duration must be at least 1 minute.'
  }
  return null
}

export function countWaveCustomAttempts(
  wave: { customAttempts?: { buttonId: string }[] } | undefined,
): number {
  return wave?.customAttempts?.length ?? 0
}

export function customTimerDurationMs(template: CustomTrainingTemplate | null | undefined): number {
  const minutes = template?.timer?.durationMinutes ?? 15
  return Math.max(1, minutes) * 60_000
}

export function customTimerRemainingMs(
  session: {
    customTimerStartedAt?: string | null
    customTimerEndedAt?: string | null
    customTemplateSnapshot?: CustomTrainingTemplate | null
  },
  now = Date.now(),
): number | null {
  if (!session.customTimerStartedAt || session.customTimerEndedAt) return null
  const end =
    new Date(session.customTimerStartedAt).getTime() +
    customTimerDurationMs(session.customTemplateSnapshot)
  return Math.max(0, end - now)
}

export function customTimerIsRunning(session: {
  customTimerStartedAt?: string | null
  customTimerEndedAt?: string | null
}): boolean {
  return Boolean(session.customTimerStartedAt && !session.customTimerEndedAt)
}
