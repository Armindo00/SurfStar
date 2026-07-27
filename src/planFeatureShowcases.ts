import type { PlanId } from './plans'

export type FeatureShowcaseId =
  | 'live-stats'
  | 'technical-training'
  | 'heats-championship'
  | 'team-analytics'
  | 'gear-quiver'
  | 'equipment-ratings'
  | 'psychology-checkins'
  | 'custom-training'
  | 'sea-analysis'
  | 'athlete-sharing'
  | 'multi-coach'
  | 'organization-roster'

export type FeatureShowcase = {
  id: FeatureShowcaseId
  title: string
  lead: string
  bullets: string[]
  plans: PlanId[]
}

export const FEATURE_SHOWCASES: FeatureShowcase[] = [
  {
    id: 'live-stats',
    title: 'Live session stats',
    lead: 'Open stats mid-session on the beach — success rate, wave count, and maneuver breakdown update instantly.',
    bullets: [
      'Real-time success % during technical and combo sessions',
      'Per-maneuver bars for rail, top turn, and progressive',
      'Works with multiple athletes in the same session',
    ],
    plans: ['team', 'club', 'organization'],
  },
  {
    id: 'technical-training',
    title: 'Technical training & combos',
    lead: 'Log every wave with maneuver type, level, side, and success — the core of SurfStar coaching.',
    bullets: [
      'Technical training with R / T / P and frontside / backside',
      'Combo attempts by level with success tracking',
      'CSV export for reports and external analysis',
    ],
    plans: ['team', 'club', 'organization'],
  },
  {
    id: 'heats-championship',
    title: 'Heats & championship',
    lead: 'Run simulated contest heats with timers, interferences, score editing, and championship brackets.',
    bullets: [
      'Heat timer with wave scores and placement tracking',
      'Edit or delete scores after logging',
      'Championship mode with parallel or sequential heats',
    ],
    plans: ['team', 'club', 'organization'],
  },
  {
    id: 'team-analytics',
    title: 'Team analytics',
    lead: 'Six-month evolution charts, heat timing breakdowns, and athlete profile tabs in one analytics hub.',
    bullets: [
      'Monthly sessions, success trends, and potential rate',
      'Heat analytics: opening/closing waves, clutch delta',
      'Per-athlete profile with training, psychology, and gear',
    ],
    plans: ['team', 'club', 'organization'],
  },
  {
    id: 'gear-quiver',
    title: 'Athlete gear quiver',
    lead: 'Athletes register boards and fins with dimensions, volume, and notes — free on every athlete account.',
    bullets: [
      'Board length, width, thickness, and liters',
      'Fin setups with notes',
      'Coaches see gear from the athlete profile',
    ],
    plans: ['team', 'club', 'organization'],
  },
  {
    id: 'equipment-ratings',
    title: 'Equipment ratings',
    lead: 'Rate speed, control, and release for each board and fin setup — track what works over time.',
    bullets: [
      'Star ratings after sessions',
      'History per board and fin set',
      'Gear & wellbeing panel for coaches',
    ],
    plans: ['team', 'club', 'organization'],
  },
  {
    id: 'athlete-sharing',
    title: 'Share stats with athletes',
    lead: 'Choose exactly what each athlete sees from your sessions — technical stats, combos, history, and heats.',
    bullets: [
      'Per-athlete sharing toggles',
      'Athletes pair with a code — no extra cost',
      'Multi-coach pairing supported',
    ],
    plans: ['team', 'club', 'organization'],
  },
  {
    id: 'custom-training',
    title: 'Custom training templates',
    lead: 'Build templates that match how you coach — name your skills, set levels, and run timed drills live.',
    bullets: [
      'Custom skill buttons with color coding',
      'Per-button levels plus success / fail',
      'Built-in timer with auto-start for drills',
    ],
    plans: ['club', 'organization'],
  },
  {
    id: 'sea-analysis',
    title: 'Sea analysis',
    lead: 'Compare two peaks in a 30-minute session — log wave types, scores, and get a recommended peak.',
    bullets: [
      'Peak 1 vs Peak 2 observation logging',
      'Wave score + arrival rate recommendation',
      'Full timeline with edit and delete',
    ],
    plans: ['club', 'organization'],
  },
  {
    id: 'psychology-checkins',
    title: 'Psychology check-ins',
    lead: 'Optional post-session 0–5 questionnaire in Portuguese — coaches enable it per athlete, opt-in only.',
    bullets: [
      '8 quick questions plus optional written note',
      'Only prompted when the coach enables it',
      'Wellbeing trends in the athlete profile',
    ],
    plans: ['club', 'organization'],
  },
  {
    id: 'multi-coach',
    title: 'Multiple coach accounts',
    lead: 'Up to 5 coaches on one Team Academy subscription — each with full access to the shared roster.',
    bullets: [
      'Invite coaches to your organization',
      'Shared athlete pool and session database',
      'Admin controls for membership',
    ],
    plans: ['organization'],
  },
  {
    id: 'organization-roster',
    title: 'Shared roster & database',
    lead: 'One academy, one source of truth — every coach works from the same athletes, spots, and sessions.',
    bullets: [
      'Unlimited athletes on Team Academy',
      'Centralized spot and template library',
      'Priority support from SurfStar',
    ],
    plans: ['organization'],
  },
]

export function getPlanFeatureShowcases(planId: PlanId): FeatureShowcase[] {
  return FEATURE_SHOWCASES.filter((showcase) => showcase.plans.includes(planId))
}

export type PlanMarketingProfile = {
  tagline: string
  summary: string
  idealFor: string
  heroImage: FeatureShowcaseId
}

export const PLAN_MARKETING_PROFILES: Record<PlanId, PlanMarketingProfile> = {
  team: {
    tagline: 'Everything you need to coach with data',
    summary:
      'Live stats, heats, team analytics, gear tracking, and athlete sharing — up to 20 athletes on one coach account.',
    idealFor: 'Independent coaches and small squads getting started with surf statistics.',
    heroImage: 'live-stats',
  },
  club: {
    tagline: 'Advanced tools for serious coaching',
    summary:
      'Unlimited athletes plus custom training, sea analysis, psychology check-ins, and full equipment insights.',
    idealFor: 'Performance coaches who want wellbeing tracking, custom drills, and peak analysis.',
    heroImage: 'custom-training',
  },
  organization: {
    tagline: 'Your academy on one platform',
    summary:
      'Up to 5 coaches, shared roster, and every Premium feature — built for schools, clubs, and federations.',
    idealFor: 'Surf schools, clubs, and federations running multiple coaches and a large athlete pool.',
    heroImage: 'organization-roster',
  },
}

export type PlanPickerCard = {
  icon: string
  title: string
  text: string
  planId: PlanId
}

export const LANDING_PLAN_PICKER: PlanPickerCard[] = [
  {
    icon: '◎',
    title: 'Coach',
    text: 'Live stats, heats, analytics, and gear tracking for up to 20 athletes.',
    planId: 'team',
  },
  {
    icon: '★',
    title: 'Coach Premium',
    text: 'Unlimited athletes, custom training, sea analysis, and psychology check-ins.',
    planId: 'club',
  },
  {
    icon: '◆',
    title: 'Team Academy',
    text: 'Up to 5 coaches, shared roster, and every Premium feature for your academy.',
    planId: 'organization',
  },
]
