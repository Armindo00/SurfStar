import { useEffect, useState } from 'react'
import { BillingIntervalToggle } from '../components/BillingIntervalToggle'
import { PackCard } from '../components/PackCard'
import { AppLogo } from '../components/AppLogo'
import { SUBSCRIPTION_PLANS } from '../plans'
import { scrollToPricingSection } from '../routing'
import { useApp } from '../AppContext'

const TRUST_STATS = [
  { value: 'Live stats', label: 'Success rates update during every session' },
  { value: 'Custom training', label: 'Coach Premium — your buttons, levels & rules' },
  { value: 'Sea analysis', label: 'Compare peaks and pick the best spot' },
  { value: 'Season', label: 'Totals, heat wins & full session history' },
]

const FEATURES = [
  {
    icon: '◎',
    title: 'Wave-by-wave logging',
    text: 'Technical training and combos with success rates by maneuver, level, and side (frontside / backside).',
  },
  {
    icon: '⚙',
    title: 'Custom training',
    text: 'Coach Premium exclusive — design your own session format with skill buttons, levels, success/fail tracking, timer, and rules. Train exactly your way.',
  },
  {
    icon: '≋',
    title: 'Sea analysis',
    text: 'Timed 30-minute sessions: log sets and wave types on two peaks, track intervals, and get a data-backed peak recommendation.',
  },
  {
    icon: '▣',
    title: 'Live session stats',
    text: 'Open Live stats mid-training — waves, success %, and breakdowns by maneuver or combo level update as you log each wave.',
  },
  {
    icon: '⇄',
    title: 'Multi-coach pairing',
    text: 'Athletes create an account, share a code, and accept each coach. Global stats follow them everywhere.',
  },
  {
    icon: '◆',
    title: 'Monthly & season analytics',
    text: 'Team analytics with 6-month evolution charts, plus season totals — waves, stars, heat wins, and every past session.',
  },
  {
    icon: '★',
    title: 'Heats & championship',
    text: 'Simulate heats, log interferences, and track results like a real contest.',
  },
]

const CUSTOM_TRAINING_BULLETS = [
  'Name your own skill buttons and color-code them',
  'Per-button levels plus optional success / fail tracking',
  'Built-in timer with auto-start for timed drills',
  'Wave-based or direct logging — your rules, your format',
]

const SEA_ANALYSIS_BULLETS = [
  'Log wave types on Peak 1 and Peak 2 in real time',
  'Wave score + arrival rate = recommended peak',
  'Average intervals between sets and wave types',
  'Full timeline with edit and delete for mistakes',
]

const STATS_LAYERS = [
  {
    step: 'Live',
    title: 'Stats during training',
    text: 'Tap Live stats while the session runs. See success rate, wave count, and frontside vs backside breakdowns — no waiting until the end.',
    metrics: ['87% success', '24 waves', 'R · T · P breakdown'],
  },
  {
    step: 'Month',
    title: 'Evolution month by month',
    text: 'Team analytics rolls up the last 6 months: sessions per month, success trend, and potential rate in a clear evolution chart.',
    metrics: ['6-month chart', 'Sessions / month', 'Success & potential'],
  },
  {
    step: 'Season',
    title: 'The full picture',
    text: 'Season totals for every athlete — trainings, waves, star maneuvers, heat wins, and a searchable session history across the whole year.',
    metrics: ['Season totals', 'Heat results', 'Session history'],
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Pick your plan',
    text: 'Coach, Coach Premium, or Team Academy — pick the plan that fits your team.',
  },
  {
    step: '02',
    title: 'Create a coach account',
    text: 'Sign up, activate your subscription, and set up spots and sea conditions.',
  },
  {
    step: '03',
    title: 'Connect your team',
    text: 'Invite athletes by code, log sessions at the beach, and review stats in seconds.',
  },
]

const FAQ = [
  {
    q: 'Do athletes pay?',
    a: 'No. Only the coach subscribes. Athletes join free with a pairing code.',
  },
  {
    q: 'Can I have multiple coaches?',
    a: 'Yes. An athlete can link to several coaches and control what they share with each one.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Yes. SurfStar is built for the beach — add it to your home screen as an app.',
  },
  {
    q: 'What is Sea analysis mode?',
    a: 'A timed session where you observe two peaks, log wave types (sets, intermediates, small waves), and SurfStar recommends which peak offers the best conditions — with intervals and a full timeline.',
  },
  {
    q: 'Can I see stats while training?',
    a: 'Yes. During technical or combo sessions, open Live stats to see success rate, waves, and maneuver breakdowns update in real time — then review monthly evolution and season totals in Team analytics.',
  },
  {
    q: 'What is Custom training?',
    a: 'Coach Premium lets you create your own training templates: name your skill buttons, set levels, track success or fail, add a timer, and write your rules. Start a session with your template and log live on the beach.',
  },
]

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
          <a href="#features">Features</a>
          <a href="#custom-training">Custom training</a>
          <a href="#sea-analysis">Sea analysis</a>
          <a href="#analytics">Analytics</a>
          <a href="#how">How it works</a>
          <a href="#packs">Pricing</a>
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
          <a href="#features" onClick={() => setMobileNavOpen(false)}>
            Features
          </a>
          <a href="#custom-training" onClick={() => setMobileNavOpen(false)}>
            Custom training
          </a>
          <a href="#sea-analysis" onClick={() => setMobileNavOpen(false)}>
            Sea analysis
          </a>
          <a href="#analytics" onClick={() => setMobileNavOpen(false)}>
            Analytics
          </a>
          <a href="#how" onClick={() => setMobileNavOpen(false)}>
            How it works
          </a>
          <a href="#packs" onClick={() => setMobileNavOpen(false)}>
            Pricing
          </a>
          <div className="landing-mobile-nav__auth">
            <button type="button" className="btn btn--outline btn--block" onClick={openCoachSignIn}>
              Coach sign in
            </button>
            <button type="button" className="btn btn--gold btn--block" onClick={openCoachPlanSelection}>
              Create coach account
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
            <p className="landing-hero__lead">
              Log every wave, see live stats on the beach, and track monthly evolution and season totals
              for your whole team.
            </p>
            <div className="landing-hero__create">
              <p className="landing-hero__create-label">Create account</p>
              <div className="landing-hero__cta">
                <button type="button" className="btn btn--gold btn--lg" onClick={openCoachPlanSelection}>
                  Create coach account
                </button>
                <button type="button" className="btn btn--outline btn--lg" onClick={openAthleteSignUp}>
                  Create athlete account
                </button>
              </div>
              <div className="landing-hero__signin-links">
                <button type="button" className="landing-hero__signin-link" onClick={openCoachSignIn}>
                  Coach sign in
                </button>
                <span aria-hidden="true">·</span>
                <button type="button" className="landing-hero__signin-link" onClick={openAthleteSignIn}>
                  Athlete sign in
                </button>
              </div>
            </div>
            <ul className="landing-hero__checks">
              <li>Live stats during every session</li>
              <li>Monthly evolution & season totals</li>
              <li>Athletes included free</li>
              <li>Cancel anytime</li>
            </ul>
          </div>

          <div className="landing-showcase" aria-hidden="true">
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

        <section className="landing-trust" aria-label="Highlights">
          {TRUST_STATS.map((item) => (
            <article key={item.value} className="landing-trust__item">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </section>

        <section className="landing-section landing-section--alt landing-sea" id="sea-analysis">
          <div className="landing-sea__grid">
            <div className="landing-sea__copy">
              <p className="landing-eyebrow">Sea analysis</p>
              <h2>Read the ocean before your athletes paddle out</h2>
              <p className="landing-sea__lead">
                Stop guessing which peak is firing. Run a 30-minute timed session, log what you see on
                both peaks, and get a clear recommendation backed by wave quality and arrival rate.
              </p>
              <ul className="landing-sea__bullets">
                {SEA_ANALYSIS_BULLETS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="landing-sea__badge">
                <span className="landing-showcase__pill">Coach Premium</span>
                Included with custom training & sea analysis
              </p>
            </div>

            <div className="landing-sea__preview" aria-hidden="true">
              <div className="landing-showcase__glow" />
              <div className="landing-showcase__card landing-sea__card">
                <header className="landing-showcase__head">
                  <span className="landing-showcase__pill">Sea analysis · 18:42 left</span>
                  <strong>Supertubos · Offshore</strong>
                </header>

                <div className="landing-sea__recommend">
                  <span className="landing-sea__recommend-label">Recommended peak</span>
                  <strong>Peak 1</strong>
                  <p>Stronger sets and faster arrivals on Peak 1</p>
                </div>

                <div className="landing-sea__peaks">
                  <div className="landing-sea__peak">
                    <span>Peak 1</span>
                    <strong>42 pts</strong>
                    <small>18 observations</small>
                  </div>
                  <div className="landing-sea__peak">
                    <span>Peak 2</span>
                    <strong>31 pts</strong>
                    <small>14 observations</small>
                  </div>
                </div>

                <div className="landing-sea__types">
                  <span>Set</span>
                  <span>Large int.</span>
                  <span>Small int.</span>
                  <span>Small</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--alt landing-sea" id="custom-training">
          <div className="landing-sea__grid">
            <div className="landing-sea__copy">
              <p className="landing-eyebrow">Custom training</p>
              <h2>Your drills. Your buttons. Your rules.</h2>
              <p className="landing-sea__lead">
                Go beyond built-in modes. Build templates that match how you actually coach — then run
                them live on the beach with one tap per skill.
              </p>
              <ul className="landing-sea__bullets">
                {CUSTOM_TRAINING_BULLETS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="landing-sea__badge">
                <span className="landing-showcase__pill">Coach Premium</span>
                Exclusive to the top plan — alongside sea analysis & unlimited athletes
              </p>
            </div>

            <div className="landing-sea__preview" aria-hidden="true">
              <div className="landing-showcase__glow" />
              <div className="landing-showcase__card landing-sea__card">
                <header className="landing-showcase__head">
                  <span className="landing-showcase__pill">Custom training · Live register</span>
                  <strong>Cutback focus · Carcavelos</strong>
                </header>

                <div className="landing-sea__types">
                  <span>Cutback</span>
                  <span>Re-entry</span>
                  <span>Tube</span>
                  <span>Layback</span>
                </div>

                <div className="landing-showcase__kpis">
                  <div>
                    <span>76%</span>
                    <small>Success</small>
                  </div>
                  <div>
                    <span>12:40</span>
                    <small>Timer left</small>
                  </div>
                  <div>
                    <span>18</span>
                    <small>Logs</small>
                  </div>
                </div>

                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  Level 3 cutback · Success · Frontside
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section__head">
            <p className="landing-eyebrow">Features</p>
            <h2>Everything you need to coach with data</h2>
            <p className="landing-section__sub">
              From reading the ocean to the final heat — simple logging, clear stats, zero confusion
              between athletes.
            </p>
          </div>
          <div className="landing-features__grid">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="landing-feature">
                <span className="landing-feature__icon" aria-hidden="true">
                  {feature.icon}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-stats" id="analytics">
          <div className="landing-section__head">
            <p className="landing-eyebrow">Analytics</p>
            <h2>Live on the beach. Monthly trends. Season totals.</h2>
            <p className="landing-section__sub">
              Three layers of insight — from the wave you just logged to how your athlete has progressed
              all season.
            </p>
          </div>

          <div className="landing-stats__grid">
            {STATS_LAYERS.map((layer) => (
              <article key={layer.step} className="landing-stats__card">
                <span className="landing-stats__step">{layer.step}</span>
                <h3>{layer.title}</h3>
                <p>{layer.text}</p>
                <ul className="landing-stats__metrics">
                  {layer.metrics.map((metric) => (
                    <li key={metric}>{metric}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <p className="landing-stats__plan muted">
            <span className="landing-showcase__pill">Coach plan</span>
            Monthly evolution & team analytics · Live stats on every plan
          </p>
        </section>

        <section className="landing-section landing-section--alt" id="how">
          <div className="landing-section__head">
            <p className="landing-eyebrow">How it works</p>
            <h2>Three steps to get started</h2>
          </div>
          <ol className="landing-steps">
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
              Monthly or annual billing. Annual plans include 2 months free. Secure payment via Stripe.
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

        <section className="landing-section landing-section--alt">
          <div className="landing-section__head">
            <p className="landing-eyebrow">FAQ</p>
            <h2>Frequently asked questions</h2>
          </div>
          <div className="landing-faq">
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
          <a className="btn btn--gold btn--lg" href="#packs">
            View plans
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <AppLogo size="sm" />
          <p>Surf statistics for coaches and athletes.</p>
        </div>
        <div className="landing-footer__links">
          <a href="#features">Features</a>
          <a href="#custom-training">Custom training</a>
          <a href="#sea-analysis">Sea analysis</a>
          <a href="#analytics">Analytics</a>
          <a href="#packs">Pricing</a>
          <button type="button" className="landing-footer__btn" onClick={openCoachSignIn}>
            Coach sign in
          </button>
          <button type="button" className="landing-footer__btn" onClick={openCoachPlanSelection}>
            Create coach account
          </button>
          <button type="button" className="landing-footer__btn" onClick={openAthleteSignIn}>
            Athlete sign in
          </button>
          <button type="button" className="landing-footer__btn" onClick={openAthleteSignUp}>
            Create athlete account
          </button>
          <button type="button" className="landing-footer__btn" onClick={openPrivacy}>
            Privacy Policy
          </button>
          <button type="button" className="landing-footer__btn" onClick={openTerms}>
            Terms of Service
          </button>
          <button type="button" className="landing-footer__btn" onClick={openContact}>
            Contact
          </button>
        </div>
        <p className="landing-footer__copy">© {new Date().getFullYear()} SurfStar</p>
      </footer>
    </div>
  )
}
