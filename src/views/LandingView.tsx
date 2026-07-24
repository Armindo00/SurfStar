import { PackCard } from '../components/PackCard'
import { AppLogo } from '../components/AppLogo'
import { SUBSCRIPTION_PLANS } from '../plans'
import { useApp } from '../AppContext'

const TRUST_STATS = [
  { value: '5 modos', label: 'Treino, combos, heats, mar e mais' },
  { value: '100%', label: 'Stats separadas por atleta' },
  { value: '6 meses', label: 'Evolução em team analytics' },
  { value: 'Grátis', label: 'Entrada para atletas' },
]

const FEATURES = [
  {
    icon: '◎',
    title: 'Registo onda a onda',
    text: 'Treino técnico e combos com taxas de sucesso por manobra, nível e lado (frontside / backside).',
  },
  {
    icon: '⇄',
    title: 'Pairing multi-treinador',
    text: 'Atletas criam conta, partilham código e aceitam cada treinador. Stats globais que os seguem.',
  },
  {
    icon: '◆',
    title: 'Analytics profissional',
    text: 'KPIs, evolução mensal, histórico de sessões e partilha controlada com cada atleta.',
  },
  {
    icon: '★',
    title: 'Heats & campeonato',
    text: 'Simula heats, regista interferências e acompanha resultados como num evento real.',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Escolhe o teu pack',
    text: 'Starter, Team ou Club — conforme o tamanho da tua escola ou clube.',
  },
  {
    step: '02',
    title: 'Cria conta de treinador',
    text: 'Regista-te, ativa a subscrição e configura spots e condições de mar.',
  },
  {
    step: '03',
    title: 'Liga a equipa e surf',
    text: 'Convida atletas por código, regista sessões na praia e revê stats em segundos.',
  },
]

const FAQ = [
  {
    q: 'Os atletas pagam?',
    a: 'Não. Apenas o treinador subscreve um pack. Atletas entram grátis com código de pairing.',
  },
  {
    q: 'Posso ter vários treinadores?',
    a: 'Sim. Um atleta pode ligar-se a vários treinadores e controlar o que partilha com cada um.',
  },
  {
    q: 'Funciona no telemóvel?',
    a: 'Sim. SurfStar foi desenhado para usar na praia — instala no ecrã inicial como app.',
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
        <nav className="landing-nav__menu" aria-label="Secções">
          <a href="#features">Funcionalidades</a>
          <a href="#how">Como funciona</a>
          <a href="#packs">Preços</a>
        </nav>
        <div className="landing-nav__actions">
          <button type="button" className="btn btn--ghost btn--small landing-nav__link" onClick={openAthleteLogin}>
            Sou atleta
          </button>
          <button type="button" className="btn btn--gold btn--small" onClick={openCoachLogin}>
            Entrar
          </button>
        </div>
      </header>

      <main id="top">
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <p className="landing-eyebrow">Ride · Improve · Win</p>
            <h1>
              A plataforma de estatística de surf para{' '}
              <span className="landing-accent">treinadores exigentes</span>
            </h1>
            <p className="landing-hero__lead">
              Regista sessões, acompanha a evolução de cada atleta e gere equipas inteiras — tudo
              numa app rápida, feita para a praia.
            </p>
            <div className="landing-hero__cta">
              <a className="btn btn--gold btn--lg" href="#packs">
                Começar agora
              </a>
              <button type="button" className="btn btn--outline btn--lg" onClick={openAthleteLogin}>
                Entrar como atleta
              </button>
            </div>
            <ul className="landing-hero__checks">
              <li>Sem cartão para explorar packs</li>
              <li>Atletas incluídos grátis</li>
              <li>Cancela quando quiseres</li>
            </ul>
          </div>

          <div className="landing-showcase" aria-hidden="true">
            <div className="landing-showcase__glow" />
            <div className="landing-showcase__card">
              <header className="landing-showcase__head">
                <span className="landing-showcase__pill">Sessão activa</span>
                <strong>Carcavelos · Treino técnico</strong>
              </header>
              <div className="landing-showcase__kpis">
                <div>
                  <span>87%</span>
                  <small>Sucesso</small>
                </div>
                <div>
                  <span>24</span>
                  <small>Ondas</small>
                </div>
                <div>
                  <span>3</span>
                  <small>Atletas</small>
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

        <section className="landing-trust" aria-label="Destaques">
          {TRUST_STATS.map((item) => (
            <article key={item.value} className="landing-trust__item">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </article>
          ))}
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section__head">
            <p className="landing-eyebrow">Funcionalidades</p>
            <h2>Tudo o que precisas para treinar com dados</h2>
            <p className="landing-section__sub">
              Da primeira onda ao heat final — registo simples, estatísticas claras, zero confusão
              entre atletas.
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
            <p className="landing-eyebrow">Como funciona</p>
            <h2>Três passos para começar</h2>
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
            <p className="landing-eyebrow">Preços</p>
            <h2>Escolhe o pack ideal</h2>
            <p className="landing-section__sub">
              Subscrição mensal, sem fidelização. Pagamento seguro via Stripe.
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
            <h2>Perguntas frequentes</h2>
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
            <p className="landing-eyebrow landing-eyebrow--gold">Pronto para surfar com dados?</p>
            <h2>Leva a tua equipa ao próximo nível</h2>
          </div>
          <a className="btn btn--gold btn--lg" href="#packs">
            Ver packs
          </a>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__brand">
          <AppLogo size="sm" />
          <p>Estatísticas de surf para treinadores e atletas.</p>
        </div>
        <div className="landing-footer__links">
          <a href="#features">Funcionalidades</a>
          <a href="#packs">Preços</a>
          <button type="button" className="landing-footer__btn" onClick={openCoachLogin}>
            Entrar
          </button>
        </div>
        <p className="landing-footer__copy">© {new Date().getFullYear()} SurfStar</p>
      </footer>
    </div>
  )
}
