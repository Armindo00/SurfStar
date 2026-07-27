import type { MentalState } from './types'

export const MENTAL_STATES: { id: MentalState; label: string }[] = [
  { id: 'focused', label: 'Focused' },
  { id: 'motivated', label: 'Motivated' },
  { id: 'confident', label: 'Confident' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'tired', label: 'Tired' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'demotivated', label: 'Demotivated' },
  { id: 'frustrated', label: 'Frustrated' },
]

export function mentalStateLabel(state: MentalState): string {
  return MENTAL_STATES.find((item) => item.id === state)?.label ?? state
}
