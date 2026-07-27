import type { PlanId } from './plans'
import { PLAN_COMPARISON_FEATURES, planHasComparisonFeature } from './plans'

export type MarketingHighlight = {
  icon: string
  title: string
  text: string
  plans: PlanId[]
}

export const LANDING_HIGHLIGHTS: MarketingHighlight[] = [
  {
    icon: '▣',
    title: 'Live session stats',
    text: 'Success rates and maneuver breakdowns update wave by wave on the beach.',
    plans: ['team', 'club', 'organization'],
  },
  {
    icon: '🏄',
    title: 'Athlete gear quiver',
    text: 'Boards and fins with length, width, thickness, volume, and notes — all in one place.',
    plans: ['team', 'club', 'organization'],
  },
  {
    icon: '🧠',
    title: 'Psychology check-ins',
    text: 'Optional 0–5 post-session questionnaire. Coaches opt in per athlete.',
    plans: ['club', 'organization'],
  },
  {
    icon: '⚙',
    title: 'Custom training',
    text: 'Your skill buttons, levels, timer, and rules — run live with one tap.',
    plans: ['club', 'organization'],
  },
  {
    icon: '≋',
    title: 'Sea analysis',
    text: 'Compare two peaks with timed observations and a data-backed recommendation.',
    plans: ['club', 'organization'],
  },
  {
    icon: '◆',
    title: 'Team analytics',
    text: 'Six-month evolution, heat breakdowns, psychology trends, and equipment insights.',
    plans: ['team', 'club', 'organization'],
  },
]

export type PlanMarketingSection = {
  id: string
  label: string
  items: {
    title: string
    text: string
    plans: PlanId[]
  }[]
}

const PLAN_SECTIONS: PlanMarketingSection[] = [
  {
    id: 'training',
    label: 'Training & sessions',
    items: [
      {
        title: 'Technical training & combos',
        text: 'Log maneuvers wave by wave with success rates by level and frontside/backside.',
        plans: ['team', 'club', 'organization'],
      },
      {
        title: 'Heats & championship',
        text: 'Simulate contest heats, log interferences, edit scores, and track placements.',
        plans: ['team', 'club', 'organization'],
      },
      {
        title: 'Custom training templates',
        text: 'Build your own skill buttons, levels, and timed drills.',
        plans: ['club', 'organization'],
      },
      {
        title: 'Sea analysis',
        text: '30-minute sessions comparing two peaks with wave-type logging and a recommended pick.',
        plans: ['club', 'organization'],
      },
      {
        title: 'Session history & CSV export',
        text: 'Full archive of completed sessions with summaries, heat stats, and export.',
        plans: ['team', 'club', 'organization'],
      },
      {
        title: 'Spot management',
        text: 'Save your breaks and attach conditions to every session.',
        plans: ['team', 'club', 'organization'],
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics & sharing',
    items: [
      {
        title: 'Team analytics (6 months)',
        text: 'Performance, volume, wave quality, heat timing, and monthly evolution charts.',
        plans: ['team', 'club', 'organization'],
      },
      {
        title: 'Share stats with athletes',
        text: 'Control what each athlete sees: technical stats, combos, history, and heat details.',
        plans: ['team', 'club', 'organization'],
      },
      {
        title: 'Psychology analytics',
        text: 'Average scores per question, check-in timeline, and wellbeing trends in the athlete profile.',
        plans: ['club', 'organization'],
      },
    ],
  },
  {
    id: 'athlete',
    label: 'Athlete wellbeing & gear',
    items: [
      {
        title: 'Gear quiver',
        text: 'Athletes register boards and fins with dimensions and volume. Free for every athlete account.',
        plans: ['team', 'club', 'organization'],
      },
      {
        title: 'Equipment ratings',
        text: 'Coaches rate speed, control, and release — track how each setup performs over time.',
        plans: ['team', 'club', 'organization'],
      },
      {
        title: 'Psychology check-ins',
        text: 'Quick 8-question 0–5 survey after training. Coaches enable it per athlete — opt-in only.',
        plans: ['club', 'organization'],
      },
      {
        title: 'Multi-coach pairing',
        text: 'Athletes link to several coaches with a code and choose what each coach can see.',
        plans: ['team', 'club', 'organization'],
      },
    ],
  },
  {
    id: 'team',
    label: 'Team & organization',
    items: [
      {
        title: 'Up to 20 athletes',
        text: 'Pair athletes by code and manage sharing settings per athlete.',
        plans: ['team'],
      },
      {
        title: 'Unlimited athletes',
        text: 'No cap on roster size — scale your squad without upgrading again.',
        plans: ['club', 'organization'],
      },
      {
        title: '1 coach account',
        text: 'One login for the head coach with full access to team data.',
        plans: ['team', 'club'],
      },
      {
        title: 'Up to 5 coach accounts',
        text: 'Multiple coaches on one shared roster and database.',
        plans: ['organization'],
      },
      {
        title: 'Shared roster & database',
        text: 'One organization, one athlete pool — every coach works from the same data.',
        plans: ['organization'],
      },
      {
        title: 'Priority support',
        text: 'Direct contact with the SurfStar team for faster help.',
        plans: ['club', 'organization'],
      },
    ],
  },
]

export type PlanMarketingProfile = {
  tagline: string
  summary: string
  idealFor: string
}

export const PLAN_MARKETING_PROFILES: Record<PlanId, PlanMarketingProfile> = {
  team: {
    tagline: 'Everything you need to coach with data',
    summary:
      'Live stats, heats, team analytics, and athlete sharing — up to 20 athletes on one coach account.',
    idealFor: 'Independent coaches and small squads getting started with surf statistics.',
  },
  club: {
    tagline: 'Advanced tools for serious coaching',
    summary:
      'Unlimited athletes plus custom training, sea analysis, psychology check-ins, and equipment insights.',
    idealFor: 'Performance coaches who want wellbeing tracking, custom drills, and peak analysis.',
  },
  organization: {
    tagline: 'Your academy on one platform',
    summary:
      'Up to 5 coaches, shared roster, and every Premium feature — built for schools, clubs, and federations.',
    idealFor: 'Surf schools, clubs, and federations running multiple coaches and a large athlete pool.',
  },
}

export function getAllComparisonLabels(): string[] {
  return PLAN_COMPARISON_FEATURES.map((feature) => feature.label)
}

export function planIncludesMarketingFeature(planId: PlanId, featureLabel: string): boolean {
  const matrixFeature = PLAN_COMPARISON_FEATURES.find((feature) => feature.label === featureLabel)
  if (!matrixFeature) return false
  return planHasComparisonFeature(planId, matrixFeature)
}

export function getPlanMarketingSections(planId: PlanId): Array<
  PlanMarketingSection & {
    items: Array<PlanMarketingSection['items'][number] & { included: boolean }>
  }
> {
  return PLAN_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      included: item.plans.includes(planId),
    })),
  })).filter((section) => section.items.some((item) => item.included))
}

export function getTopPlanFeatures(planId: PlanId, limit = 5): string[] {
  return getAllComparisonLabels()
    .filter((label) => planIncludesMarketingFeature(planId, label))
    .slice(0, limit)
}
