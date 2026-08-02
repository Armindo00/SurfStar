import { useEffect, useState } from 'react'
import { BillingIntervalToggle } from '../components/BillingIntervalToggle'
import { LegalFooterLinks } from '../components/LegalFooterLinks'
import { PackCard } from '../components/PackCard'
import { AppLogo } from '../components/AppLogo'
import { LanguagePicker } from '../components/LanguagePicker'
import { SUBSCRIPTION_PLANS, usesManualPaymentFlow } from '../plans'
import { scrollToPricingSection } from '../routing'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import type { MessageCatalog } from '../i18n/types'

type SpotlightId = 'custom' | 'sea'
type PremiumSpotlight = MessageCatalog['landing']['premiumSpotlights']['items'][number]

function PremiumPreview({ spotlight }: { spotlight: PremiumSpotlight }) {
  const { messages } = useI18n()
  const { preview } = spotlight

  if (spotlight.id === 'sea' && 'recommend' in preview) {
    return (
      <div className="landing-showcase__card landing-spotlight__preview-card">
        <header className="landing-showcase__head">
          <span className="landing-showcase__pill">{preview.pill}</span>
          <strong>{preview.spot}</strong>
        </header>
        <div className="landing-sea__recommend">
          <span className="landing-sea__recommend-label">
            {messages.landing.premiumSpotlights.recommendedPeak}
          </span>
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
  const { messages, t } = useI18n()
  const L = messages.landing
  const manualFlow = usesManualPaymentFlow()
  const WHATS_NEW = L.whatsNew.items
  const PILLARS = L.pillars.items
  const PREMIUM_SPOTLIGHTS = L.premiumSpotlights.items
  const VALUE_GROUPS = L.valueGroups.items
  const STEPS = L.steps.items
  const FAQ = L.faq.items
  const NAV_LINKS = [
    { href: '#whats-new', label: L.nav.whatsNew },
    { href: '#features', label: L.nav.features },
    { href: '#packs', label: L.nav.pricing },
    { href: '#faq', label: L.nav.faq },
  ]
  const showcase = L.hero.showcase

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
          {mobileNavOpen ? t('common.close') : t('common.menu')}
        </button>
        <nav className="landing-nav__menu" aria-label={L.nav.sectionsLabel}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="landing-nav__actions">
          <div className="landing-nav__language">
            <LanguagePicker compact />
          </div>
          <button type="button" className="btn btn--outline btn--small landing-nav__signin" onClick={openCoachSignIn}>
            {L.nav.coachSignIn}
          </button>
          <button type="button" className="btn btn--outline btn--small landing-nav__signin" onClick={openAthleteSignIn}>
            {L.nav.athleteSignIn}
          </button>
        </div>
      </header>

      {mobileNavOpen ? (
        <nav id="landing-mobile-nav" className="landing-mobile-nav" aria-label={L.nav.mobileNavLabel}>
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} onClick={closeMobileNav}>
              {link.label}
            </a>
          ))}
          <div className="landing-mobile-nav__auth">
            <div className="landing-nav__language landing-nav__language--mobile">
              <LanguagePicker compact />
            </div>
            <button type="button" className="btn btn--gold btn--block" onClick={openCoachPlanSelection}>
              {L.nav.createCoachAccount}
            </button>
            <button type="button" className="btn btn--outline btn--block" onClick={openCoachSignIn}>
              {L.nav.coachSignIn}
            </button>
            <button type="button" className="btn btn--outline btn--block" onClick={openAthleteSignIn}>
              {L.nav.athleteSignIn}
            </button>
          </div>
        </nav>
      ) : null}

      <main id="top">
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">{L.hero.eyebrow}</p>
            <h1>
              {L.hero.titlePrefix}{' '}
              <span className="landing-accent">{L.hero.titleAccent}</span>
            </h1>
            <p className="landing-hero__lead landing-hero__lead--desktop">{L.hero.leadDesktop}</p>
            <p className="landing-hero__lead landing-hero__lead--mobile">{L.hero.leadMobile}</p>

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
                  {L.nav.createCoachAccount}
                </button>
                <button type="button" className="btn btn--outline btn--lg" onClick={openAthleteSignUp}>
                  {L.nav.createAthleteAccount}
                </button>
              </div>
              <div className="landing-hero__signin-links landing-hero__signin-links--desktop">
                <button type="button" className="landing-hero__signin-link" onClick={openCoachSignIn}>
                  {L.nav.coachSignIn}
                </button>
                <span aria-hidden="true">·</span>
                <button type="button" className="landing-hero__signin-link" onClick={openAthleteSignIn}>
                  {L.nav.athleteSignIn}
                </button>
              </div>
            </div>

            <ul className="landing-hero__checks landing-hero__checks--desktop">
              {L.hero.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
          </div>

          <div className="landing-showcase landing-showcase--desktop" aria-hidden="true">
            <div className="landing-showcase__glow" />
            <div className="landing-showcase__card">
              <header className="landing-showcase__head">
                <span className="landing-showcase__pill">{showcase.pill}</span>
                <strong>{showcase.spot}</strong>
              </header>
              <div className="landing-showcase__kpis">
                <div>
                  <span>87%</span>
                  <small>{showcase.success}</small>
                </div>
                <div>
                  <span>24</span>
                  <small>{showcase.waves}</small>
                </div>
                <div>
                  <span>3</span>
                  <small>{showcase.athletes}</small>
                </div>
              </div>
              <div className="landing-showcase__bars">
                <div className="landing-showcase__bar">
                  <span>{showcase.rail}</span>
                  <div><i style={{ width: '82%' }} /></div>
                </div>
                <div className="landing-showcase__bar">
                  <span>{showcase.topTurn}</span>
                  <div><i style={{ width: '74%' }} /></div>
                </div>
                <div className="landing-showcase__bar">
                  <span>{showcase.progressive}</span>
                  <div><i style={{ width: '91%' }} /></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-whats-new" id="whats-new">
          <div className="landing-section__head">
            <p className="landing-eyebrow">{L.whatsNew.sectionEyebrow}</p>
            <h2>{L.whatsNew.sectionTitle}</h2>
            <p className="landing-section__sub landing-section__sub--desktop">{L.whatsNew.sectionSub}</p>
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

        <section className="landing-pillars landing-pillars--desktop" aria-label={L.pillars.ariaLabel}>
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
            <p className="landing-eyebrow">{L.premiumSpotlights.sectionEyebrow}</p>
            <h2>{L.premiumSpotlights.sectionTitle}</h2>
            <p className="landing-section__sub">{L.premiumSpotlights.sectionSub}</p>
          </div>

          <div className="landing-spotlight__tabs" role="tablist" aria-label={L.premiumSpotlights.tabsLabel}>
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
            <p className="landing-eyebrow">{L.valueGroups.sectionEyebrow}</p>
            <h2>{L.valueGroups.sectionTitle}</h2>
            <p className="landing-section__sub">{L.valueGroups.sectionSub}</p>
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
            <p className="landing-eyebrow">{L.steps.sectionEyebrow}</p>
            <h2>{L.steps.sectionTitle}</h2>
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
            <p className="landing-eyebrow">{L.pricing.sectionEyebrow}</p>
            <h2>{L.pricing.sectionTitle}</h2>
            <p className="landing-section__sub">{L.pricing.sectionSub}</p>
            {manualFlow ? (
              <p className="landing-section__sub landing-section__sub--manual">{L.pricing.manualBillingHint}</p>
            ) : null}
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
            <p className="landing-eyebrow">{L.faq.sectionEyebrow}</p>
            <h2>{L.faq.sectionTitle}</h2>
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
            <p className="landing-eyebrow landing-eyebrow--gold">{L.cta.eyebrow}</p>
            <h2>{L.cta.title}</h2>
          </div>
          <div className="landing-cta-band__actions">
            <button type="button" className="btn btn--gold btn--lg" onClick={openCoachPlanSelection}>
              {L.cta.createCoachAccount}
            </button>
            <button type="button" className="btn btn--outline btn--lg" onClick={openContact}>
              {L.cta.contactUs}
            </button>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__grid">
          <div className="landing-footer__brand">
            <AppLogo size="sm" />
            <p>{L.footer.tagline}</p>
          </div>

          <div className="landing-footer__col">
            <h3>{L.footer.explore}</h3>
            <a href="#whats-new">{L.nav.whatsNew}</a>
            <a href="#features">{L.nav.features}</a>
            <a href="#packs">{L.nav.pricing}</a>
            <a href="#faq">{L.nav.faq}</a>
          </div>

          <div className="landing-footer__col">
            <h3>{L.footer.account}</h3>
            <button type="button" className="landing-footer__btn" onClick={openCoachPlanSelection}>
              {L.nav.createCoachAccount}
            </button>
            <button type="button" className="landing-footer__btn" onClick={openAthleteSignUp}>
              {L.nav.createAthleteAccount}
            </button>
            <button type="button" className="landing-footer__btn" onClick={openCoachSignIn}>
              {L.nav.coachSignIn}
            </button>
            <button type="button" className="landing-footer__btn" onClick={openAthleteSignIn}>
              {L.nav.athleteSignIn}
            </button>
          </div>

          <div className="landing-footer__col">
            <h3>{L.footer.support}</h3>
            <button type="button" className="landing-footer__btn" onClick={openContact}>
              {L.footer.contactSurfStar}
            </button>
            <LegalFooterLinks onPrivacy={openPrivacy} onTerms={openTerms} layout="stack" className="landing-footer__legal" />
          </div>
        </div>
        <p className="landing-footer__copy">{t('landing.footer.copyright', { year: new Date().getFullYear() })}</p>
      </footer>
    </div>
  )
}
