import type { PlanId } from './plans'
import type { TrainingMode } from './types'
import { TRAINING_MODE_LABELS } from './types'

export type TrainingHelpGuide = {
  mode: TrainingMode
  planLabel: string
  summary: string
  steps: string[]
}

export const TRAINING_HELP_GUIDES: TrainingHelpGuide[] = [
  {
    mode: 'tecnico',
    planLabel: 'All plans',
    summary:
      'Wave-by-wave logging for rail, top turn, and progressive maneuvers — with level, side, and success tracking.',
    steps: [
      'Tap New session → choose Technical training, spot, and sea conditions.',
      'Select the athletes who are training, then tap Start session.',
      'Tap an athlete tile to open the register sheet for their current wave.',
      'Log each maneuver (R / T / P), pick the level (1–3 or ★), frontside or backside, and success or miss.',
      'Open Live stats anytime to see success rate and breakdowns update in real time.',
    ],
  },
  {
    mode: 'combos',
    planLabel: 'All plans',
    summary: 'Track linked maneuver sequences (combos) with levels and success rates.',
    steps: [
      'Tap New session → choose Combos, then spot and conditions.',
      'Select athletes and start the session.',
      'For each wave, tap the athlete and log the combo level achieved (Combo 1–3 or ★).',
      'Mark success or fail for that combo attempt.',
      'Review combo stats in Live stats or Team analytics after the session.',
    ],
  },
  {
    mode: 'heats',
    planLabel: 'Coach plan and above',
    summary: 'Run a single timed heat — score each athlete wave-by-wave like a contest heat.',
    steps: [
      'Tap New session → choose Heats and set the heat length (e.g. 15 or 20 minutes).',
      'Select up to four athletes for the heat, then start.',
      'Log each wave with scores and interferences as they happen.',
      'When the heat ends, review placements and totals on the heat screen.',
      'Finished heats appear in session history and Team analytics.',
    ],
  },
  {
    mode: 'campeonato',
    planLabel: 'Coach plan and above',
    summary:
      'Full knockout contest — add all surfers, pick heat size (2 or 4), and SurfStar builds every round until the final.',
    steps: [
      'Tap New session → Championship, set heat length and surfers per heat (2 = top 1 advances, 4 = top 2 advance).',
      'Select all athletes in the contest and tap Start championship.',
      'SurfStar splits the opening round into heats of 3 or 4 (e.g. quarterfinals with 8 surfers = 2 heats of 4).',
      'When a round has multiple heats, tap Start all heats — they share one clock and you score each heat side by side.',
      'Continue through semifinals and final until a champion is crowned.',
    ],
  },
  {
    mode: 'sea-analysis',
    planLabel: 'Coach Premium',
    summary:
      'Timed 30-minute ocean observation on two peaks — log wave types and get a peak recommendation.',
    steps: [
      'Tap New session → choose Sea analysis, spot, and conditions (no athletes needed).',
      'Start the session and tap Start timer when you begin observing.',
      'Log wave types on Peak 1 and Peak 2 as sets arrive (sets, intermediates, small waves).',
      'SurfStar scores each peak and shows which one is firing best.',
      'End the session to save the timeline and recommendation to history.',
    ],
  },
  {
    mode: 'custom',
    planLabel: 'Coach Premium',
    summary:
      'Your own training format — custom skill buttons, levels, success/fail, timer, and written rules.',
    steps: [
      'Go to Custom training templates and create a template (buttons, levels, timer, rules).',
      'Tap New session → choose Custom training and pick your template.',
      'Select athletes and start — the register shows your custom buttons instead of built-in maneuvers.',
      'Tap a skill button, pick level and outcome, and log directly or per wave depending on your template.',
      'If a timer is enabled, start it from the register sheet when your drill begins.',
    ],
  },
]

export const COACH_QUICK_TIPS = [
  'Set up spots and sea conditions first under Spots & conditions — they appear in every new session.',
  'Link athletes via pairing code under Manage athletes before the first beach session.',
  'Use End session from the menu to save everything to Past sessions and Team analytics.',
]

export const ATHLETE_HELP_SECTIONS = [
  {
    title: 'Your pairing code',
    body:
      'Share your code with a coach. They send a link request — you must tap Accept before they can log sessions for you.',
  },
  {
    title: 'Stats from your coaches',
    body:
      'Each coach chooses what to share: technical stats, combos, session history, and heat details. Stats from all linked coaches appear here in one place.',
  },
  {
    title: 'Leaving a coach',
    body:
      'Under Linked coaches, tap Leave to revoke access. Past sessions they logged stay in your history according to their share settings.',
  },
]

export const INSTALL_HELP = {
  title: 'Add SurfStar to your home screen',
  lead:
    'Install SurfStar like an app for one-tap access at the beach. Works on iPhone and Android — no App Store download required.',
  iphone: {
    title: 'iPhone (Safari)',
    steps: [
      'Open surf-star.vercel.app in Safari (Chrome on iPhone does not support home screen install the same way).',
      'Tap the Share button at the bottom of the screen (□ with an arrow pointing up).',
      'Scroll the share menu and tap Add to Home Screen.',
      'Edit the name if you like, then tap Add — the SurfStar icon appears on your home screen.',
      'Open SurfStar from that icon for full-screen, app-like experience.',
    ],
  },
  android: {
    title: 'Android (Chrome)',
    steps: [
      'Open surf-star.vercel.app in Google Chrome.',
      'Tap the menu (⋮) in the top-right corner.',
      'Tap Install app or Add to Home screen (wording may vary by phone).',
      'Confirm on the prompt — SurfStar is added to your home screen and app drawer.',
      'On Samsung Internet: tap ≡ menu → Add page to → Home screen.',
    ],
  },
  note: 'If you already installed SurfStar, you can ignore this section.',
}

export function trainingGuideLabel(mode: TrainingMode): string {
  return TRAINING_MODE_LABELS[mode]
}

export function planBadgeForMode(mode: TrainingMode, planId: PlanId): string | null {
  const guide = TRAINING_HELP_GUIDES.find((g) => g.mode === mode)
  if (!guide) return null
  if (mode === 'tecnico' || mode === 'combos') return null
  if ((mode === 'heats' || mode === 'campeonato') && (planId === 'team' || planId === 'club')) {
    return 'Included in your plan'
  }
  if (mode === 'custom' || mode === 'sea-analysis') {
    return planId === 'club' ? 'Included in your plan' : guide.planLabel
  }
  if (mode === 'heats' || mode === 'campeonato') return guide.planLabel
  return guide.planLabel
}
