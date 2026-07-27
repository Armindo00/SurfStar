import { useEffect, useState } from 'react'
import { AppLogo } from '../components/AppLogo'
import { PlanFeaturePreview } from '../components/PlanFeaturePreview'
import {
  LANDING_CAPABILITIES,
  LANDING_PLAN_PICKER,
  LANDING_STATS,
  LANDING_STEPS,
  LANDING_TRAINING_MODES,
} from '../landingContent'
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
    a: 'Tap any plan card below — each opens a dedicated page with app previews, explanations, price, and subscribe button.',
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
  { href: '#features', label: 'Features' },
  { href: '#modes', label: 'Training modes' },
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
              Log every wave on the beach, track gear and wellbeing, and review season analytics —
              built for coaches, athletes, and academies.
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
              <li>Gear quiver & psychology check-ins</li>
              <li>Athletes included free</li>
              <li>Cancel anytime</li>
            </ul>
          </div>

          <div className="landing-hero__visual">
            <PlanFeaturePreview variant="live-stats" size="hero" />
          </div>
        </section>

        <section className="landing-stats-strip" aria-label="Key metrics">
          {LANDING_STATS.map((stat) => (
            <article key={stat.label} className="landing-stats-strip__item">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">Platform capabilities</p>
            <h2>Everything you need on the beach and after</h2>
            <p className="landing-section__sub">
              Real app previews — tap a plan below to see which package includes each feature.
            </p>
          </div>

          <div className="landing-capabilities">
            {LANDING_CAPABILITIES.map((item, index) => (
              <article
                key={item.id}
                className={index % 2 === 1 ? 'landing-capability landing-capability--reverse' : 'landing-capability'}
              >
                <div className="landing-capability__copy">
                  <span className="landing-capability__tag">{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <div className="landing-capability__preview">
                  <PlanFeaturePreview variant={item.id} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--alt" id="modes">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">Training modes</p>
            <h2>Six ways to log a session</h2>
            <p className="landing-section__sub">
              From technical maneuvers to championship heats — every mode feeds your analytics.
            </p>
          </div>
          <div className="landing-modes-grid">
            {LANDING_TRAINING_MODES.map((mode) => (
              <article
                key={mode.name}
                className={mode.premium ? 'landing-mode-card landing-mode-card--premium' : 'landing-mode-card'}
              >
                <span className="landing-mode-card__icon">{mode.icon}</span>
                <h3>{mode.name}</h3>
                <p>{mode.desc}</p>
                {mode.premium ? <span className="landing-mode-card__badge">Premium</span> : null}
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="how">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">How it works</p>
            <h2>Get started in three steps</h2>
          </div>
          <ol className="landing-steps landing-steps--compact">
            {LANDING_STEPS.map((step) => (
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

        <section className="landing-section landing-section--alt" id="plans">
          <div className="landing-section__head landing-section__head--center">
            <p className="landing-eyebrow">Pricing & features</p>
            <h2>What does each package include?</h2>
            <p className="landing-section__sub">
              Each plan opens its own page — full feature list, app previews, price, and subscribe
              button. No mixing plans on one screen.
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
                  <div className="plan-picker-card__preview">
                    <PlanFeaturePreview variant={entry.previewId} framed={false} />
                  </div>
                  <div className="plan-picker-card__body">
                    <span className="plan-picker-card__icon" aria-hidden="true">
                      {entry.icon}
                    </span>
                    <h3>{entry.title}</h3>
                    <p className="plan-picker-card__text">{entry.text}</p>
                    <ul className="plan-picker-card__highlights">
                      {entry.highlights.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
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
                  </div>
                </article>
              )
            })}
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
