import { useEffect, useState } from 'react'
import { BillingIntervalToggle } from '../components/BillingIntervalToggle'
import { PackCard } from '../components/PackCard'
import { AppLogo } from '../components/AppLogo'
import { LANDING_HIGHLIGHTS, getTopPlanFeatures, PLAN_MARKETING_PROFILES } from '../planMarketing'
import { SUBSCRIPTION_PLANS, formatPlanPrice, formatPlanPriceSuffix, getPlan } from '../plans'
import { scrollToPricingSection } from '../routing'
import { useApp } from '../AppContext'

const STEPS = [
  { step: '01', title: 'Pick your plan', text: 'Tap a plan below to see everything included — then subscribe.' },
  { step: '02', title: 'Set up your team', text: 'Create spots, invite athletes by code, and start logging.' },
  { step: '03', title: 'Review with data', text: 'Live stats on the beach, gear tracking, wellbeing, and season analytics.' },
]

const FAQ = [
  {
    q: 'Do athletes pay?',
    a: 'No. Only the coach subscribes. Athletes join free with a pairing code.',
  },
  {
    q: 'What is the psychology check-in?',
    a: 'On Coach Premium and Team Academy, coaches can opt in individual athletes for a quick 0–5 questionnaire after each session. Athletes who are not interested simply do not get prompted.',
  },
  {
    q: 'Can athletes manage their gear?',
    a: 'Yes. Every athlete can register boards and fins in their quiver. Coaches can rate equipment and track performance over time.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Yes. SurfStar is built for the beach — add it to your home screen as an app.',
  },
]

const NAV_LINKS = [
  { href: '#highlights', label: 'Features' },
  { href: '#plans', label: 'Plans' },
  { href: '#packs', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingView() {
  const {
    selectPlan,
    openPlanDetail,
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
            <p className="landing-hero__lead">
              Live stats on the beach, gear quiver management, optional psychology check-ins, and
              season analytics for your whole team.
            </p>

            <div className="landing-hero__create">
              <div className="landing-hero__cta">
                <button type="button" className="btn btn--gold btn--lg" onClick={openCoachPlanSelection}>
                  Create coach account
                </button>
                <button type="button" className="btn btn--outline btn--lg" onClick={openAthleteSignUp}>
                  Create athlete account
                </button>
              </div>
            </div>

            <ul className="landing-hero__checks">
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

        <section className="landing-section" id="highlights">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">What SurfStar offers</p>
            <h2>From live stats to mental check-ins</h2>
            <p className="landing-section__sub">
              Training tools, athlete wellbeing, gear management, and team analytics — in one app.
            </p>
          </div>
          <div className="landing-highlights__grid">
            {LANDING_HIGHLIGHTS.map((item) => (
              <article key={item.title} className="landing-highlight">
                <span className="landing-highlight__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="landing-highlight__plans muted">
                  {item.plans.length === 3
                    ? 'All plans'
                    : item.plans.map((id) => getPlan(id).name).join(' · ')}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--alt" id="plans">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">Compare plans</p>
            <h2>What does each package include?</h2>
            <p className="landing-section__sub">
              Tap a plan name to open the full feature breakdown — psychology check-ins, quiver
              management, custom training, and more.
            </p>
          </div>
          <div className="plan-teaser-grid">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const profile = PLAN_MARKETING_PROFILES[plan.id]
              const topFeatures = getTopPlanFeatures(plan.id, 4)
              return (
                <article
                  key={plan.id}
                  className={
                    plan.highlighted
                      ? 'plan-teaser plan-teaser--highlighted'
                      : plan.requiresApproval
                        ? 'plan-teaser plan-teaser--approval'
                        : 'plan-teaser'
                  }
                >
                  {plan.highlighted ? (
                    <span className="pack-card__badge">Most popular</span>
                  ) : null}
                  <button
                    type="button"
                    className="plan-teaser__title"
                    onClick={() => openPlanDetail(plan.id)}
                  >
                    <h3>{plan.name}</h3>
                    <span>See all features →</span>
                  </button>
                  <p className="plan-teaser__summary">{profile.summary}</p>
                  <p className="plan-teaser__price">
                    <strong>{formatPlanPrice(plan, selectedBillingInterval)}</strong>
                    <span>{formatPlanPriceSuffix(selectedBillingInterval)}</span>
                  </p>
                  <ul className="plan-teaser__features">
                    {topFeatures.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn btn--outline btn--block"
                    onClick={() => openPlanDetail(plan.id)}
                  >
                    View {plan.name} details
                  </button>
                </article>
              )
            })}
          </div>
        </section>

        <section className="landing-section" id="how">
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

        <section className="landing-section landing-section--alt" id="packs">
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
                onOpenDetail={openPlanDetail}
              />
            ))}
          </div>
        </section>

        <section className="landing-section" id="faq">
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
            <a href="#highlights">Features</a>
            <a href="#plans">Plans</a>
            <a href="#packs">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="landing-footer__col">
            <h3>Plans</h3>
            {SUBSCRIPTION_PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className="landing-footer__btn"
                onClick={() => openPlanDetail(plan.id)}
              >
                {plan.name}
              </button>
            ))}
          </div>

          <div className="landing-footer__col">
            <h3>Account</h3>
            <button type="button" className="landing-footer__btn" onClick={openCoachPlanSelection}>
              Create coach account
            </button>
            <button type="button" className="landing-footer__btn" onClick={openAthleteSignUp}>
              Create athlete account
            </button>
            <button type="button" className="landing-footer__btn" onClick={openContact}>
              Contact SurfStar
            </button>
            <button type="button" className="landing-footer__btn" onClick={openPrivacy}>
              Privacy Policy
            </button>
            <button type="button" className="landing-footer__btn" onClick={openTerms}>
              Terms of Service
            </button>
          </div>
        </div>
        <p className="landing-footer__copy">© {new Date().getFullYear()} SurfStar</p>
      </footer>
    </div>
  )
}
