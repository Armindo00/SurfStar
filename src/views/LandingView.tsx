import { useEffect, useState } from 'react'
import { AppLogo } from '../components/AppLogo'
import { LANDING_PLAN_PICKER } from '../planFeatureShowcases'
import { formatPlanPrice, formatPlanPriceSuffix, getPlan, SUBSCRIPTION_PLANS } from '../plans'
import { scrollToPricingSection } from '../routing'
import { useApp } from '../AppContext'

const FAQ = [
  {
    q: 'Do athletes pay?',
    a: 'No. Only the coach subscribes. Athletes join free with a pairing code.',
  },
  {
    q: 'How do I see what each plan includes?',
    a: 'Tap Coach, Coach Premium, or Team Academy below — each plan opens its own page with previews and full explanations.',
  },
  {
    q: 'What is the psychology check-in?',
    a: 'On Coach Premium and Team Academy, coaches can opt in individual athletes for a quick 0–5 questionnaire after each session.',
  },
  {
    q: 'Does it work on mobile?',
    a: 'Yes. SurfStar is built for the beach — add it to your home screen as an app.',
  },
]

const NAV_LINKS = [
  { href: '#plans', label: 'Plans' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingView() {
  const {
    openPlanDetail,
    selectedBillingInterval,
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
    if (window.location.hash === '#packs' || window.location.hash === '#plans') {
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
              Live stats, gear quiver, psychology check-ins, and season analytics — pick a plan
              below to see exactly what each package includes.
            </p>

            <div className="landing-hero__create">
              <div className="landing-hero__cta">
                <a className="btn btn--gold btn--lg" href="#plans">
                  Explore plans
                </a>
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
                <div><span>87%</span><small>Success</small></div>
                <div><span>24</span><small>Waves</small></div>
                <div><span>3</span><small>Athletes</small></div>
              </div>
              <div className="landing-showcase__bars">
                <div className="landing-showcase__bar"><span>Rail</span><div><i style={{ width: '82%' }} /></div></div>
                <div className="landing-showcase__bar"><span>Top turn</span><div><i style={{ width: '74%' }} /></div></div>
                <div className="landing-showcase__bar"><span>Progressive</span><div><i style={{ width: '91%' }} /></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="plans">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">Pricing & features</p>
            <h2>What does each package include?</h2>
            <p className="landing-section__sub">
              Choose a plan to open its dedicated page — features, app previews, price, and subscribe
              button. Each plan is explained separately.
            </p>
          </div>

          <div className="plan-picker-grid" id="packs">
            {LANDING_PLAN_PICKER.map((entry) => {
              const plan = getPlan(entry.planId)
              return (
                <article
                  key={entry.planId}
                  className={
                    plan.highlighted
                      ? 'plan-picker-card plan-picker-card--highlighted'
                      : plan.requiresApproval
                        ? 'plan-picker-card plan-picker-card--approval'
                        : 'plan-picker-card'
                  }
                >
                  <span className="plan-picker-card__icon" aria-hidden="true">
                    {entry.icon}
                  </span>
                  <h3>{entry.title}</h3>
                  <p className="plan-picker-card__text">{entry.text}</p>
                  <p className="plan-picker-card__price">
                    <strong>{formatPlanPrice(plan, selectedBillingInterval)}</strong>
                    <span>{formatPlanPriceSuffix(selectedBillingInterval)}</span>
                  </p>
                  <button
                    type="button"
                    className={
                      plan.highlighted ? 'btn btn--gold btn--block' : 'btn btn--secondary btn--block'
                    }
                    onClick={() => openPlanDetail(entry.planId)}
                  >
                    See {entry.title} features
                  </button>
                </article>
              )
            })}
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
            <a className="btn btn--gold btn--lg" href="#plans">
              Explore plans
            </a>
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
