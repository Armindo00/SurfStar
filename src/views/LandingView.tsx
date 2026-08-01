import { useEffect, useState } from 'react'
import { BillingIntervalToggle } from '../components/BillingIntervalToggle'
import { LegalFooterLinks } from '../components/LegalFooterLinks'
import { PackCard } from '../components/PackCard'
import { AppLogo } from '../components/AppLogo'
import { SUBSCRIPTION_PLANS } from '../plans'
import { scrollToPricingSection } from '../routing'
import { useApp } from '../AppContext'

const WHATS_NEW = [
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
]

const PILLARS = [
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
]

const PREMIUM_SPOTLIGHTS = [
  {
    id: 'custom',
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
    id: 'sea',
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
      recommend: { peak: 'Peak 1', note: 'Higher score from wave count × type × frequency on Peak 1' },
      peaks: [
        { name: 'Peak 1', score: '42 pts', obs: '18 observations' },
        { name: 'Peak 2', score: '31 pts', obs: '14 observations' },
      ],
      chips: ['Set', 'Large int.', 'Small int.', 'Small'],
    },
  },
] as const

type SpotlightId = (typeof PREMIUM_SPOTLIGHTS)[number]['id']

const VALUE_GROUPS = [
  {
    id: 'coach',
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
    id: 'athlete',
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
    id: 'team',
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
]

const STEPS = [
  { step: '01', title: 'Pick your plan', text: 'Coach, Coach Premium, or Team Academy.' },
  { step: '02', title: 'Set up your team', text: 'Create spots, invite athletes by code, and start logging.' },
  { step: '03', title: 'Review with data', text: 'Live stats on the beach, monthly trends, and season totals.' },
]

const FAQ = [
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
]

const NAV_LINKS = [
  { href: '#whats-new', label: "What's new" },
  { href: '#features', label: 'Features' },
  { href: '#packs', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

function PremiumPreview({ spotlight }: { spotlight: (typeof PREMIUM_SPOTLIGHTS)[number] }) {
  const { preview } = spotlight

  if (spotlight.id === 'sea' && 'recommend' in preview) {
    return (
      <div className="landing-showcase__card landing-spotlight__preview-card">
        <header className="landing-showcase__head">
          <span className="landing-showcase__pill">{preview.pill}</span>
          <strong>{preview.spot}</strong>
        </header>
        <div className="landing-sea__recommend">
          <span className="landing-sea__recommend-label">Recommended peak</span>
          <strong>{preview.recommend.peak}</strong>
          <p>{preview.recommend.note}</p>
        </div>
        <div className="landing-sea__peaks">
          {preview.peaks.map((peak) => (
            <div key={peak.name} className="landing-sea__peak">
              <span>{peak.name}</span>
              <strong>{peak.score}</strong>
              <small>{peak.obs}</small>
            </div>
          ))}
        </div>
        <div className="landing-sea__types">
          {preview.chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </div>
    )
  }

  if ('kpis' in preview) {
    return (
      <div className="landing-showcase__card landing-spotlight__preview-card">
        <header className="landing-showcase__head">
          <span className="landing-showcase__pill">{preview.pill}</span>
          <strong>{preview.spot}</strong>
        </header>
        <div className="landing-sea__types">
          {preview.chips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
        <div className="landing-showcase__kpis">
          {preview.kpis.map((kpi) => (
            <div key={kpi.label}>
              <span>{kpi.value}</span>
              <small>{kpi.label}</small>
            </div>
          ))}
        </div>
        <p className="landing-spotlight__preview-foot muted">{preview.foot}</p>
      </div>
    )
  }

  return null
}

export function LandingView() {
  const {
    selectPlan,
    selectedBillingInterval,
    setBillingInterval,
    openAthleteSignIn,
    openAthleteSignUp,
    openCoachSignIn,
    openCoachPlanSelection,
    openPrivacy,
    openTerms,
    openContact,
  } = useApp()

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [spotlightTab, setSpotlightTab] = useState<SpotlightId>('custom')

  const activeSpotlight = PREMIUM_SPOTLIGHTS.find((item) => item.id === spotlightTab) ?? PREMIUM_SPOTLIGHTS[0]

  useEffect(() => {
    if (!mobileNavOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileNavOpen])

  useEffect(() => {
    if (window.location.hash === '#packs') {
      requestAnimationFrame(() => scrollToPricingSection())
    }
  }, [])

  const closeMobileNav = () => setMobileNavOpen(false)

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="landing-nav__brand" href="#top">
          <AppLogo size="md" />
        </a>
        <button
          type="button"
          className="landing-nav__toggle btn btn--outline btn--small"
          aria-expanded={mobileNavOpen}
          aria-controls="landing-mobile-nav"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? 'Close' : 'Menu'}
        </button>
        <nav className="landing-nav__menu" aria-label="Sections">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="landing-nav__actions">
          <button type="button" className="btn btn--outline btn--small landing-nav__signin" onClick={openCoachSignIn}>
            Coach sign in
          </button>
          <button type="button" className="btn btn--outline btn--small landing-nav__signin" onClick={openAthleteSignIn}>
            Athlete sign in
          </button>
        </div>
      </header>

      {mobileNavOpen ? (
        <nav id="landing-mobile-nav" className="landing-mobile-nav" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMobileNav}>
              {link.label}
            </a>
          ))}
          <div className="landing-mobile-nav__auth">
            <button type="button" className="btn btn--gold btn--block" onClick={openCoachPlanSelection}>
              Create coach account
            </button>
            <button type="button" className="btn btn--outline btn--block" onClick={openCoachSignIn}>
              Coach sign in
            </button>
            <button type="button" className="btn btn--outline btn--block" onClick={openAthleteSignIn}>
              Athlete sign in
            </button>
          </div>
        </nav>
      ) : null}

      <main id="top">
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">Ride · Improve · Win</p>
            <h1>
              Surf statistics for{' '}
              <span className="landing-accent">coaches who demand more</span>
            </h1>
            <p className="landing-hero__lead landing-hero__lead--desktop">
              Log every wave, see live stats on the beach, and track monthly evolution and season totals
              for your whole team.
            </p>
            <p className="landing-hero__lead landing-hero__lead--mobile">
              Live stats on the beach. Gear tracking, wellbeing check-ins, and season analytics for your
              whole team.
            </p>

            <div className="landing-hero__chips landing-hero__chips--mobile">
              {PILLARS.slice(0, 3).map((pillar) => (
                <span key={pillar.title} className="landing-chip">
                  {pillar.title}
                </span>
              ))}
            </div>

            <div className="landing-hero__create">
              <div className="landing-hero__cta">
                <button type="button" className="btn btn--gold btn--lg" onClick={openCoachPlanSelection}>
                  Create coach account
                </button>
                <button type="button" className="btn btn--outline btn--lg" onClick={openAthleteSignUp}>
                  Create athlete account
                </button>
              </div>
              <div className="landing-hero__signin-links landing-hero__signin-links--desktop">
                <button type="button" className="landing-hero__signin-link" onClick={openCoachSignIn}>
                  Coach sign in
                </button>
                <span aria-hidden="true">·</span>
                <button type="button" className="landing-hero__signin-link" onClick={openAthleteSignIn}>
                  Athlete sign in
                </button>
              </div>
            </div>

            <ul className="landing-hero__checks landing-hero__checks--desktop">
              <li>Live stats during every session</li>
              <li>Gear quiver & wellbeing check-ins</li>
              <li>Athletes included free</li>
              <li>Cancel anytime</li>
            </ul>
          </div>

          <div className="landing-showcase landing-showcase--desktop" aria-hidden="true">
            <div className="landing-showcase__glow" />
            <div className="landing-showcase__card">
              <header className="landing-showcase__head">
                <span className="landing-showcase__pill">Live stats · Active session</span>
                <strong>Carcavelos · Technical training</strong>
              </header>
              <div className="landing-showcase__kpis">
                <div>
                  <span>87%</span>
                  <small>Success</small>
                </div>
                <div>
                  <span>24</span>
                  <small>Waves</small>
                </div>
                <div>
                  <span>3</span>
                  <small>Athletes</small>
                </div>
              </div>
              <div className="landing-showcase__bars">
                <div className="landing-showcase__bar">
                  <span>Rail</span>
                  <div><i style={{ width: '82%' }} /></div>
                </div>
                <div className="landing-showcase__bar">
                  <span>Top turn</span>
                  <div><i style={{ width: '74%' }} /></div>
                </div>
                <div className="landing-showcase__bar">
                  <span>Progressive</span>
                  <div><i style={{ width: '91%' }} /></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-whats-new" id="whats-new">
          <div className="landing-section__head">
            <p className="landing-eyebrow">What's new</p>
            <h2>Fresh tools for coaches and athletes</h2>
            <p className="landing-section__sub landing-section__sub--desktop">
              Latest additions to SurfStar — gear management, wellbeing insights, and direct support.
            </p>
          </div>
          <div className="landing-whats-new__track">
            {WHATS_NEW.map((item) => (
              <article key={item.title} className="landing-whats-new__card">
                <span className="landing-whats-new__tag">{item.tag}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="landing-whats-new__audience">{item.audience}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-pillars landing-pillars--desktop" aria-label="Core capabilities">
          <div className="landing-pillars__grid">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="landing-pillar">
                <span className="landing-pillar__icon" aria-hidden="true">
                  {pillar.icon}
                </span>
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--alt landing-spotlight" id="premium">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">Coach Premium</p>
            <h2>Advanced coaching tools</h2>
            <p className="landing-section__sub">
              From predefined sessions to a real work tool — custom training and sea analysis on Coach Premium.
            </p>
          </div>

          <div className="landing-spotlight__tabs" role="tablist" aria-label="Premium coaching tools">
            {PREMIUM_SPOTLIGHTS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                id={`spotlight-tab-${item.id}`}
                aria-selected={spotlightTab === item.id}
                aria-controls={`spotlight-panel-${item.id}`}
                className={spotlightTab === item.id ? 'landing-spotlight__tab landing-spotlight__tab--active' : 'landing-spotlight__tab'}
                onClick={() => setSpotlightTab(item.id)}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div
            className="landing-spotlight__panel"
            role="tabpanel"
            id={`spotlight-panel-${activeSpotlight.id}`}
            aria-labelledby={`spotlight-tab-${activeSpotlight.id}`}
          >
            <div className="landing-spotlight__copy">
              <p className="landing-eyebrow">{activeSpotlight.eyebrow}</p>
              <h3>{activeSpotlight.title}</h3>
              <p className="landing-spotlight__lead">{activeSpotlight.lead}</p>
              <ul className="landing-sea__bullets">
                {activeSpotlight.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </div>
            <div className="landing-spotlight__preview">
              <div className="landing-showcase__glow" />
              <PremiumPreview spotlight={activeSpotlight} />
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">Why SurfStar</p>
            <h2>Built for coaches, athletes, and teams</h2>
            <p className="landing-section__sub">
              Coaches subscribe — athletes join free. Everyone gets clearer feedback and a stronger season.
            </p>
          </div>

          <div className="landing-value-grid">
            {VALUE_GROUPS.map((group) => (
              <article key={group.id} className="landing-value-card">
                <span className="landing-value-card__icon" aria-hidden="true">
                  {group.icon}
                </span>
                <p className="landing-value-card__label">{group.label}</p>
                <h3>{group.headline}</h3>
                <p className="landing-value-card__lead">{group.lead}</p>
                <ul className="landing-value-card__benefits">
                  {group.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--alt" id="how">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">How it works</p>
            <h2>Get started in three steps</h2>
          </div>
          <ol className="landing-steps landing-steps--compact">
            {STEPS.map((step) => (
              <li key={step.step} className="landing-step">
                <span className="landing-step__num">{step.step}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section" id="packs">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">Pricing</p>
            <h2>Choose the right plan</h2>
            <p className="landing-section__sub">
              Monthly or annual billing. Annual plans include 2 months free.
            </p>
          </div>
          <BillingIntervalToggle
            className="billing-toggle--landing"
            value={selectedBillingInterval}
            onChange={setBillingInterval}
          />
          <div className="landing-pricing__grid">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PackCard
                key={plan.id}
                planId={plan.id}
                billingInterval={selectedBillingInterval}
                onSelect={selectPlan}
              />
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--alt" id="faq">
          <div className="landing-section__head">
            <p className="landing-eyebrow">FAQ</p>
            <h2>Common questions</h2>
          </div>
          <div className="landing-faq landing-faq--compact">
            {FAQ.map((item) => (
              <details key={item.q} className="landing-faq__item">
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="landing-cta-band">
          <div>
            <p className="landing-eyebrow landing-eyebrow--gold">Ready to surf with data?</p>
            <h2>Take your team to the next level</h2>
          </div>
          <div className="landing-cta-band__actions">
            <button type="button" className="btn btn--gold btn--lg" onClick={openCoachPlanSelection}>
              Create coach account
            </button>
            <button type="button" className="btn btn--outline btn--lg" onClick={openContact}>
              Contact us
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__grid">
          <div className="landing-footer__brand">
            <AppLogo size="sm" />
            <p>Surf statistics for coaches and athletes.</p>
          </div>

          <div className="landing-footer__col">
            <h3>Explore</h3>
            <a href="#whats-new">What's new</a>
            <a href="#features">Features</a>
            <a href="#packs">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="landing-footer__col">
            <h3>Account</h3>
            <button type="button" className="landing-footer__btn" onClick={openCoachPlanSelection}>
              Create coach account
            </button>
            <button type="button" className="landing-footer__btn" onClick={openAthleteSignUp}>
              Create athlete account
            </button>
            <button type="button" className="landing-footer__btn" onClick={openCoachSignIn}>
              Coach sign in
            </button>
            <button type="button" className="landing-footer__btn" onClick={openAthleteSignIn}>
              Athlete sign in
            </button>
          </div>

          <div className="landing-footer__col">
            <h3>Support</h3>
            <button type="button" className="landing-footer__btn" onClick={openContact}>
              Contact SurfStar
            </button>
            <LegalFooterLinks onPrivacy={openPrivacy} onTerms={openTerms} layout="stack" className="landing-footer__legal" />
          </div>
        </div>
        <p className="landing-footer__copy">© {new Date().getFullYear()} SurfStar</p>
      </footer>
    </div>
  )
}
