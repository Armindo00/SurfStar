import { useState } from 'react'
import { formatPlanPrice, getPlan, getStripePaymentLink, type PlanId } from '../plans'
import { SUBSCRIPTION_PLANS } from '../plans'
import { AppLogo } from '../components/AppLogo'
import { useApp } from '../AppContext'

export function CheckoutView() {
  const {
    auth,
    selectedPlanId,
    selectPlan,
    completeCheckout,
    openLanding,
    logout,
    cloudMode,
  } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [paidExternally, setPaidExternally] = useState(false)

  const planId = selectedPlanId ?? 'team'
  const plan = getPlan(planId)
  const stripeLink = getStripePaymentLink(planId)

  const handlePay = () => {
    if (stripeLink) {
      window.open(stripeLink, '_blank', 'noopener,noreferrer')
      setPaidExternally(true)
      return
    }
    void handleActivate()
  }

  const handleActivate = async () => {
    setError('')
    setBusy(true)
    try {
      const result = await completeCheckout()
      if (!result.ok) setError(result.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível ativar a subscrição.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <button type="button" className="checkout-back" onClick={openLanding}>
          ← Voltar
        </button>

        <div className="checkout-brand">
          <AppLogo size="lg" />
          <div>
            <h1>Ativar subscrição</h1>
            <p className="muted">Olá {auth?.name ?? 'treinador'} — falta só confirmar o teu pack.</p>
          </div>
        </div>

        <div className="checkout-summary">
          <div>
            <span className="checkout-summary__label">Pack escolhido</span>
            <strong>{plan.name}</strong>
            <p className="muted">{plan.tagline}</p>
          </div>
          <div className="checkout-summary__price">
            <strong>{formatPlanPrice(plan)}</strong>
            <span>/ mês</span>
          </div>
        </div>

        <label className="field field--login">
          <span>Alterar pack</span>
          <select
            value={planId}
            onChange={(e) => selectPlan(e.target.value as PlanId, { goToLogin: false })}
          >
            {SUBSCRIPTION_PLANS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {formatPlanPrice(item)}/mês
              </option>
            ))}
          </select>
        </label>

        <ul className="checkout-features">
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        {error ? <p className="login-error">{error}</p> : null}

        {stripeLink ? (
          <>
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={handlePay} disabled={busy}>
              Pagar com Stripe
            </button>
            {paidExternally ? (
              <button
                type="button"
                className="btn btn--secondary btn--block"
                onClick={() => void handleActivate()}
                disabled={busy}
              >
                {busy ? 'A ativar…' : 'Já paguei — ativar conta'}
              </button>
            ) : null}
            <p className="checkout-note muted">
              Abre o pagamento numa nova janela. Depois de pagar, clica em &quot;Já paguei&quot; para
              ativar.
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              className="btn btn--primary btn--block btn--lg"
              onClick={() => void handleActivate()}
              disabled={busy}
            >
              {busy ? 'A ativar…' : `Ativar ${plan.name} e começar`}
            </button>
            <p className="checkout-note muted">
              {cloudMode
                ? 'Modo demonstração: a subscrição é ativada na tua conta. Configura VITE_STRIPE_LINK_* para pagamento real.'
                : 'Modo local: a subscrição fica guardada neste dispositivo.'}
            </p>
          </>
        )}

        <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
          Terminar sessão
        </button>
      </div>
    </div>
  )
}
