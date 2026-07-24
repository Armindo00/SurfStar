import { PackCard } from '../components/PackCard'
import { AppLogo } from '../components/AppLogo'
import { SUBSCRIPTION_PLANS } from '../plans'
import { useApp } from '../AppContext'

const TRUST_STATS = [
  { value: 'Live stats', label: 'Success rates update during every session' },
  { value: 'Sea analysis', label: 'Compare peaks and pick the best spot' },
  { value: '6 months', label: 'Monthly evolution per athlete' },
  { value: 'Season', label: 'Totals, heat wins & full session history' },
]

const FEATURES = [
  {
    icon: '◎',
    title: 'Wave-by-wave logging',
    text: 'Technical training and combos with success rates by maneuver, level, and side (frontside / backside).',
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
    text: 'Starter, Coach, or Coach Premium — pick the pack that fits your team.',
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
]

export function LandingView() {
  const {
    selectPlan,
    openAthleteSignIn,
    openAthleteSignUp,
    openCoachSignIn,
    openCoachSignUp,
  } = useApp()

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <a className="landing-nav__brand" href="#top">
          <AppLogo size="md" />
        </a>
        <nav className="landing-nav__menu" aria-label="Sections">
          <a href="#features">Features</a>
          <a href="#sea-analysis">Sea analysis</a>
          <a href="#analytics">Analytics</a>
          <a href="#how">How it works</a>
          <a href="#packs">Pricing</a>
        </nav>
        <div className="landing-nav__actions">
          <div className="landing-nav__auth-group">
            <span className="landing-nav__auth-label">Coach</span>
            <button type="button" className="btn btn--outline btn--small" onClick={openCoachSignIn}>
              Sign in
            </button>
            <button type="button" className="btn btn--gold btn--small" onClick={openCoachSignUp}>
              Sign up
            </button>
          </div>
          <div className="landing-nav__auth-group">
            <span className="landing-nav__auth-label">Athlete</span>
            <button type="button" className="btn btn--outline btn--small" onClick={openAthleteSignIn}>
              Sign in
            </button>
            <button type="button" className="btn btn--outline btn--small" onClick={openAthleteSignUp}>
              Sign up
            </button>
          </div>
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
              Log every wave, see live stats on the beach, and track monthly evolution and season totals
              for your whole team.
            </p>
            <div className="landing-hero__cta">
              <a className="btn btn--gold btn--lg" href="#packs">
                Coach sign up
              </a>
              <button type="button" className="btn btn--outline btn--lg" onClick={openAthleteSignIn}>
                Athlete sign in
              </button>
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
                Included with heats & championship modes
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
          <a href="#sea-analysis">Sea analysis</a>
          <a href="#analytics">Analytics</a>
          <a href="#packs">Pricing</a>
          <button type="button" className="landing-footer__btn" onClick={openCoachSignIn}>
            Coach sign in
          </button>
          <button type="button" className="landing-footer__btn" onClick={openAthleteSignIn}>
            Athlete sign in
          </button>
        </div>
        <p className="landing-footer__copy">© {new Date().getFullYear()} SurfStar</p>
      </footer>
    </div>
  )
}
