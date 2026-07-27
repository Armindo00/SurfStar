import type { FeatureShowcaseId } from './planFeatureShowcases'
import type { PlanId } from './plans'

export type LandingCapability = {
  id: FeatureShowcaseId
  title: string
  text: string
  tag: string
}

export const LANDING_STATS = [
  { value: '6', label: 'Training modes' },
  { value: '87%', label: 'Avg success tracked' },
  { value: '6 mo', label: 'Team analytics' },
  { value: 'Free', label: 'For all athletes' },
]

export const LANDING_CAPABILITIES: LandingCapability[] = [
  {
    id: 'live-stats',
    tag: 'Live coaching',
    title: 'Live session stats',
    text: 'Success rates and maneuver breakdowns update wave by wave — right on the beach.',
  },
  {
    id: 'gear-quiver',
    tag: 'Athlete gear',
    title: 'Gear quiver',
    text: 'Boards and fins with dimensions, volume, and notes in one place.',
  },
  {
    id: 'psychology-checkins',
    tag: 'Wellbeing',
    title: 'Psychology check-ins',
    text: 'Optional 0–5 post-session questionnaire — coaches opt in per athlete.',
  },
  {
    id: 'custom-training',
    tag: 'Premium',
    title: 'Custom training',
    text: 'Your skill buttons, levels, timer, and rules — run live with one tap.',
  },
  {
    id: 'sea-analysis',
    tag: 'Premium',
    title: 'Sea analysis',
    text: 'Compare two peaks with timed observations and a data-backed pick.',
  },
  {
    id: 'team-analytics',
    tag: 'Analytics',
    title: 'Team analytics',
    text: 'Six-month evolution, heat breakdowns, and athlete profile insights.',
  },
]

export const LANDING_TRAINING_MODES = [
  { icon: 'R', name: 'Technical', desc: 'Maneuvers by level & side' },
  { icon: 'C', name: 'Combos', desc: 'Linked maneuver sequences' },
  { icon: 'H', name: 'Heats', desc: 'Contest simulation & scores' },
  { icon: 'T', name: 'Championship', desc: 'Bracket rounds & finals' },
  { icon: 'S', name: 'Sea analysis', desc: 'Peak comparison', premium: true },
  { icon: '+', name: 'Custom', desc: 'Your own drill templates', premium: true },
]

export const LANDING_STEPS = [
  {
    step: '01',
    title: 'Pick your plan',
    text: 'Open Coach, Coach Premium, or Team Academy — each plan has its own feature page.',
  },
  {
    step: '02',
    title: 'Build your team',
    text: 'Create spots, pair athletes by code, and start logging sessions from the beach.',
  },
  {
    step: '03',
    title: 'Coach with data',
    text: 'Live stats, gear tracking, wellbeing check-ins, and season analytics in one app.',
  },
]

export type PlanPickerCard = {
  icon: string
  title: string
  text: string
  planId: PlanId
  previewId: FeatureShowcaseId
  highlights: string[]
}

export const LANDING_PLAN_PICKER: PlanPickerCard[] = [
  {
    icon: '◎',
    title: 'Coach',
    text: 'The essentials for independent coaches and small squads.',
    planId: 'team',
    previewId: 'live-stats',
    highlights: ['Up to 20 athletes', 'Live stats & heats', 'Gear quiver & analytics'],
  },
  {
    icon: '★',
    title: 'Coach Premium',
    text: 'Advanced tools for performance coaches who want more.',
    planId: 'club',
    previewId: 'custom-training',
    highlights: ['Unlimited athletes', 'Custom training & sea analysis', 'Psychology check-ins'],
  },
  {
    icon: '◆',
    title: 'Team Academy',
    text: 'Built for schools, clubs, and federations with multiple coaches.',
    planId: 'organization',
    previewId: 'organization-roster',
    highlights: ['Up to 5 coaches', 'Shared roster', 'Every Premium feature'],
  },
]
