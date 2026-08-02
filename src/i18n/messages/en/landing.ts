export const landing = {
  nav: {
    whatsNew: "What's new",
    features: 'Features',
    pricing: 'Pricing',
    faq: 'FAQ',
    coachSignIn: 'Coach sign in',
    athleteSignIn: 'Athlete sign in',
    createCoachAccount: 'Create coach account',
    createAthleteAccount: 'Create athlete account',
    contactUs: 'Contact us',
    mobileNavLabel: 'Mobile navigation',
    sectionsLabel: 'Sections',
  },
  hero: {
    eyebrow: 'Ride · Improve · Win',
    titlePrefix: 'Surf statistics for',
    titleAccent: 'coaches who demand more',
    leadDesktop:
      'Log every wave, see live stats on the beach, and track monthly evolution and season totals for your whole team.',
    leadMobile:
      'Live stats on the beach. Gear tracking, wellbeing check-ins, and season analytics for your whole team.',
    checks: [
      'Live stats during every session',
      'Gear quiver & wellbeing check-ins',
      'Athletes included free',
      'Cancel anytime',
    ],
    showcase: {
      pill: 'Live stats · Active session',
      spot: 'Carcavelos · Technical training',
      success: 'Success',
      waves: 'Waves',
      athletes: 'Athletes',
      rail: 'Rail',
      topTurn: 'Top turn',
      progressive: 'Progressive',
    },
  },
  whatsNew: {
    sectionEyebrow: "What's new",
    sectionTitle: 'Fresh tools for coaches and athletes',
    sectionSub:
      'Latest additions to SurfStar — gear management, wellbeing insights, and direct support.',
    items: [
      {
        tag: 'New',
        title: 'Athlete gear quiver',
        text: 'Athletes add their boards and fins — coaches review and rate the quiver from the athlete profile.',
        audience: 'Athlete',
      },
      {
        tag: 'New',
        title: 'Post-session wellbeing',
        text: 'Athletes complete a quick check-in after training — coaches see mental state trends across sessions and the full season.',
        audience: 'Athlete',
      },
      {
        tag: 'New',
        title: 'Combo training',
        text: 'Log linked maneuver sequences by level — track success rates on full combos, not just single moves.',
        audience: 'Coach',
      },
      {
        tag: 'New',
        title: 'Heats & championships',
        text: 'Simulate contest heats, run championship brackets, and review competition stats — scores, placement, and heat timing.',
        audience: 'Coach',
      },
    ] as const,
  },
  pillars: {
    ariaLabel: 'Core capabilities',
    items: [
      {
        icon: '▣',
        title: 'Live session stats',
        text: 'Success rates and maneuver breakdowns update wave by wave on the beach.',
      },
      {
        icon: '⚙',
        title: 'Custom training',
        text: 'Coach Premium — your skill buttons, levels, timer, and rules.',
      },
      {
        icon: '≋',
        title: 'Sea analysis',
        text: 'Compare two peaks with timed observations and a data-backed pick.',
      },
      {
        icon: '◆',
        title: 'Season analytics',
        text: 'Coaches access full stats for the last 6 months, 1 month, and 1 week — per athlete or for the whole team.',
      },
    ] as const,
  },
  premiumSpotlights: {
    sectionEyebrow: 'Coach Premium',
    sectionTitle: 'Advanced coaching tools',
    sectionSub:
      'From predefined sessions to a real work tool — custom training and sea analysis on Coach Premium.',
    tabsLabel: 'Premium coaching tools',
    recommendedPeak: 'Recommended peak',
    items: [
      {
        id: 'custom' as const,
        eyebrow: 'Coach Premium',
        title: 'Custom training',
        lead: 'SurfStar goes from fixed drills to your coaching workspace — create training with your own objectives, rules, skills, and levels, then run it live on the beach.',
        bullets: [
          'Define objectives and rules that match how you actually coach',
          'Name your skill buttons, set levels, and track success / fail',
          'Built-in timer with auto-start for timed drills',
        ],
        preview: {
          pill: 'Custom training · Live register',
          spot: 'Cutback focus · Carcavelos',
          chips: ['Cutback', 'Re-entry', 'Tube', 'Layback'],
          kpis: [
            { value: '76%', label: 'Success' },
            { value: '12:40', label: 'Timer left' },
            { value: '18', label: 'Logs' },
          ],
          foot: 'Level 3 cutback · Success · Frontside',
        },
      },
      {
        id: 'sea' as const,
        eyebrow: 'Coach Premium',
        title: 'Sea analysis',
        lead: 'The sea is rarely predictable — coaches face tough, shifting conditions every session. Sea analysis scores each peak using wave count × wave type × frequency, so you can choose the right strategy for each athlete.',
        bullets: [
          'Compare two peaks with a calculated score — not guesswork alone',
          'Wave count, wave type, and arrival frequency combined into one recommendation',
          'Full timeline of every wave-type interval — review, edit, or delete anytime',
        ],
        preview: {
          pill: 'Sea analysis · 18:42 left',
          spot: 'Supertubos · Offshore',
          recommend: {
            peak: 'Peak 1',
            note: 'Higher score from wave count × type × frequency on Peak 1',
          },
          peaks: [
            { name: 'Peak 1', score: '42 pts', obs: '18 observations' },
            { name: 'Peak 2', score: '31 pts', obs: '14 observations' },
          ],
          chips: ['Set', 'Large int.', 'Small int.', 'Small'],
        },
      },
    ] as const,
  },
  valueGroups: {
    sectionEyebrow: 'Why SurfStar',
    sectionTitle: 'Built for coaches, athletes, and teams',
    sectionSub:
      'Coaches subscribe — athletes join free. Everyone gets clearer feedback and a stronger season.',
    items: [
      {
        id: 'coach' as const,
        icon: '◎',
        label: 'Coaches',
        headline: 'Coach with data, not guesswork',
        lead: 'One subscription covers your athletes — log on the beach and back every decision with real numbers.',
        benefits: [
          'Live success rates during training — adjust focus before the session ends',
          'Heats, championships, and contest-style stats your athletes understand',
          'Season analytics and CSV export for reports, parents, or sponsors',
        ],
      },
      {
        id: 'athlete' as const,
        icon: '⇄',
        label: 'Athletes',
        headline: 'Your progress, free forever',
        lead: 'Join with a coach code at no cost — keep your quiver, sessions, and shared stats in one app.',
        benefits: [
          'Pair with several coaches and control what each one sees',
          'Add your board and fin quiver — coaches review and rate your gear',
          'See the stats your coach chooses to share after every session',
        ],
      },
      {
        id: 'team' as const,
        icon: '◆',
        label: 'Teams & academies',
        headline: 'One platform for the whole squad',
        lead: 'From small squads to federations — coaches, athletes, and analytics stay in sync.',
        benefits: [
          'Athletes join free — only the coach subscribes',
          'Six-month team trends and per-athlete profiles in one hub',
          'Team Academy: up to 5 coaches, shared roster, every Premium tool',
        ],
      },
    ] as const,
  },
  steps: {
    sectionEyebrow: 'How it works',
    sectionTitle: 'Get started in three steps',
    items: [
      { step: '01', title: 'Pick your plan', text: 'Coach, Coach Premium, or Team Academy.' },
      {
        step: '02',
        title: 'Set up your team',
        text: 'Create spots, invite athletes by code, and start logging.',
      },
      {
        step: '03',
        title: 'Review with data',
        text: 'Live stats on the beach, monthly trends, and season totals.',
      },
    ] as const,
  },
  pricing: {
    sectionEyebrow: 'Pricing',
    sectionTitle: 'Choose the right plan',
    sectionSub: 'Monthly or annual billing. Annual plans include 2 months free.',
    manualBillingHint: 'All plans use manual billing — register, submit payment, and we activate after confirmation.',
  },
  faq: {
    sectionEyebrow: 'FAQ',
    sectionTitle: 'Common questions',
    items: [
      {
        q: 'Do athletes pay?',
        a: 'No. Only the coach subscribes. Athletes join free with a pairing code.',
      },
      {
        q: 'Can I see stats while training?',
        a: 'Yes. Open Live stats during technical or combo sessions — success rate and breakdowns update in real time.',
      },
      {
        q: 'What is new in SurfStar?',
        a: 'Athletes can manage their gear quiver and complete post-session wellbeing check-ins. Coaches can rate equipment and see wellbeing trends. Everyone can contact SurfStar from the app.',
      },
      {
        q: 'Does it work on mobile?',
        a: 'Yes. SurfStar is built for the beach — add it to your home screen as an app.',
      },
    ] as const,
  },
  cta: {
    eyebrow: 'Ready to surf with data?',
    title: 'Take your team to the next level',
    createCoachAccount: 'Create coach account',
    contactUs: 'Contact us',
  },
  footer: {
    tagline: 'Surf statistics for coaches and athletes.',
    explore: 'Explore',
    account: 'Account',
    support: 'Support',
    contactSurfStar: 'Contact SurfStar',
    copyright: '© {{year}} SurfStar',
  },
} as const
