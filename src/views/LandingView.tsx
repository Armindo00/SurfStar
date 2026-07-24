import { PackCard } from '../components/PackCard'
import { AppLogo } from '../components/AppLogo'
import { SUBSCRIPTION_PLANS } from '../plans'
import { useApp } from '../AppContext'

const TRUST_STATS = [
  { value: '5 modes', label: 'Training, combos, heats, sea & more' },
  { value: '100%', label: 'Stats per athlete, never merged' },
  { value: '6 months', label: 'Evolution in team analytics' },
  { value: 'Free', label: 'Athlete accounts included' },
]

const FEATURES = [
  {
    icon: '◎',
    title: 'Wave-by-wave logging',
    text: 'Technical training and combos with success rates by maneuver, level, and side (frontside / backside).',
  },
  {
    icon: '⇄',
    title: 'Multi-coach pairing',
    text: 'Athletes create an account, share a code, and accept each coach. Global stats follow them everywhere.',
  },
  {
    icon: '◆',
    title: 'Pro analytics',
    text: 'KPIs, monthly evolution, session history, and controlled sharing with each athlete.',
  },
  {
    icon: '★',
    title: 'Heats & championship',
    text: 'Simulate heats, log interferences, and track results like a real contest.',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Pick your plan',
    text: 'Starter, Team, or Club — based on your school or club size.',
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
]

export function LandingView() {
  const { selectPlan, openAthleteLogin, openCoachLogin } = useApp()

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="landing-nav__brand" href="#top">
          <AppLogo size="md" />
        </a>
        <nav className="landing-nav__menu" aria-label="Sections">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#packs">Pricing</a>
        </nav>
        <div className="landing-nav__actions">
          <button type="button" className="btn btn--ghost btn--small landing-nav__link" onClick={openAthleteLogin}>
            I&apos;m an athlete
          </button>
          <button type="button" className="btn btn--gold btn--small" onClick={openCoachLogin}>
            Sign in
          </button>
        </div>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">Ride · Improve · Win</p>
            <h1>
              Surf statistics for{' '}
              <span className="landing-accent">coaches who demand more</span>
            </h1>
            <p className="landing-hero__lead">
              Log sessions, track every athlete&apos;s progress, and run entire teams — all in a fast app
              built for the beach.
            </p>
            <div className="landing-hero__cta">
              <a className="btn btn--gold btn--lg" href="#packs">
                Get started
              </a>
              <button type="button" className="btn btn--outline btn--lg" onClick={openAthleteLogin}>
                Sign in as athlete
              </button>
            </div>
            <ul className="landing-hero__checks">
              <li>No card required to explore plans</li>
              <li>Athletes included free</li>
              <li>Cancel anytime</li>
            </ul>
          </div>

          <div className="landing-showcase" aria-hidden="true">
            <div className="landing-showcase__glow" />
            <div className="landing-showcase__card">
              <header className="landing-showcase__head">
                <span className="landing-showcase__pill">Active session</span>
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

        <section className="landing-section" id="features">
          <div className="landing-section__head">
            <p className="landing-eyebrow">Features</p>
            <h2>Everything you need to coach with data</h2>
            <p className="landing-section__sub">
              From the first wave to the final heat — simple logging, clear stats, zero confusion between
              athletes.
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
              Monthly subscription, no lock-in. Secure payment via Stripe.
            </p>
          </div>
          <div className="landing-pricing__grid">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PackCard key={plan.id} planId={plan.id} onSelect={selectPlan} />
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
          <a href="#packs">Pricing</a>
          <button type="button" className="landing-footer__btn" onClick={openCoachLogin}>
            Sign in
          </button>
        </div>
        <p className="landing-footer__copy">© {new Date().getFullYear()} SurfStar</p>
      </footer>
    </div>
  )
}
