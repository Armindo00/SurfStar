import { PackCard } from '../components/PackCard'
import { SUBSCRIPTION_PLANS } from '../plans'
import { useApp } from '../AppContext'

const FEATURES = [
  {
    title: 'Treino técnico',
    text: 'Regista manobras por atleta, onda a onda, com taxas de sucesso por nível.',
  },
  {
    title: 'Pairing inteligente',
    text: 'Atletas criam conta e partilham código. Tu ligas a equipa em segundos.',
  },
  {
    title: 'Stats por atleta',
    text: 'Cada surfista vê as suas estatísticas — nunca misturadas em grupo.',
  },
  {
    title: 'Team analytics',
    text: 'Evolução de 6 meses, KPIs e histórico completo por atleta.',
  },
]

export function LandingView() {
  const { selectPlan, openAthleteLogin, openCoachLogin } = useApp()

  return (
    <div className="landing-page">
      <header className="landing-nav">
        <div className="landing-nav__brand">
          <span className="app-brandbar__mark" aria-hidden="true">
            ★
          </span>
          <strong>SurfStar</strong>
        </div>
        <div className="landing-nav__actions">
          <button type="button" className="btn btn--ghost btn--small landing-nav__link" onClick={openAthleteLogin}>
            Sou atleta
          </button>
          <button type="button" className="btn btn--secondary btn--small" onClick={openCoachLogin}>
            Entrar
          </button>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <p className="landing-hero__eyebrow">Estatística de surf para treinadores</p>
          <h1>Organiza treinos, acompanha evolução e gere a tua equipa num só lugar.</h1>
          <p className="landing-hero__lead">
            Escolhe o pack ideal, cria a tua conta de treinador e começa a registar sessões em
            Carcavelos, Ericeira ou onde fores surfar.
          </p>
          <div className="landing-hero__cta">
            <a className="btn btn--primary btn--lg" href="#packs">
              Ver packs
            </a>
            <button type="button" className="btn btn--ghost btn--lg landing-hero__secondary" onClick={openAthleteLogin}>
              Já sou atleta
            </button>
          </div>
        </div>

        <div className="landing-hero__card" aria-hidden="true">
          <p className="landing-hero__card-label">Sessão de hoje</p>
          <strong>Carcavelos · Técnico</strong>
          <div className="landing-hero__stats">
            <span>87% sucesso</span>
            <span>24 ondas</span>
            <span>3 atletas</span>
          </div>
        </div>
      </section>

      <section className="landing-features">
        <h2>Tudo o que precisas na praia</h2>
        <div className="landing-features__grid">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="landing-feature">
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-pricing" id="packs">
        <div className="landing-pricing__intro">
          <h2>Escolhe o teu pack</h2>
          <p>Paga mensalmente, cancela quando quiseres. Atletas entram grátis com código de pairing.</p>
        </div>

        <div className="landing-pricing__grid">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <PackCard key={plan.id} planId={plan.id} onSelect={selectPlan} />
          ))}
        </div>

        <p className="landing-pricing__note">
          Pagamento seguro via Stripe. Após escolher o pack, crias conta de treinador e ativas a subscrição.
        </p>
      </section>

      <footer className="landing-footer">
        <p>© SurfStar · Stats de surf para treinadores e atletas</p>
        <button type="button" className="btn btn--ghost btn--small" onClick={openCoachLogin}>
          Já tenho conta
        </button>
      </footer>
    </div>
  )
}
